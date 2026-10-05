import { NextResponse } from 'next/server';
import { getRazorpayClient } from '@/lib/razorpay';
import { getAllProductsFromStore } from '@/database/stores/products-store';
import { calculateDeliveryCharge } from '@/lib/delivery';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const clientIp = getClientIp(req);
    const rateLimit = checkRateLimit(`order_create:${clientIp}`, 30, 60); // 30 per minute

    if (!rateLimit.success) {
      return NextResponse.json(
        { error: 'Too many requests. Please slow down and try again.' },
        { status: 429 }
      );
    }

    let body: any = {};
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON request payload' }, { status: 400 });
    }

    const { items, customer } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Cart is empty. Please add items to checkout.' }, { status: 400 });
    }

    if (!customer || typeof customer !== 'object') {
      return NextResponse.json({ error: 'Customer details are required for delivery calculation.' }, { status: 400 });
    }

    const allProducts = await getAllProductsFromStore(false);

    // 1. Validate & accumulate requested quantities by productId + size
    const requestedQuantities: Record<string, number> = {};
    for (const item of items) {
      if (!item.productId || typeof item.productId !== 'string' || !item.size || typeof item.size !== 'string') {
        return NextResponse.json({ error: 'Missing product ID or size in checkout items' }, { status: 400 });
      }
      const qty = parseInt(item.quantity, 10);
      if (isNaN(qty) || qty <= 0 || qty > 50) {
        return NextResponse.json({ error: 'Invalid quantity specified for product' }, { status: 400 });
      }
      const key = `${item.productId.trim()}_${item.size.trim()}`;
      requestedQuantities[key] = (requestedQuantities[key] || 0) + qty;
    }

    let subtotal = 0;
    const validatedItems: any[] = [];

    // 2. Validate price and inventory against trusted database records
    for (const item of items) {
      const product = allProducts.find((p) => p.id === item.productId.trim());
      if (!product) {
        return NextResponse.json({ error: `Product not found: ${item.productId}` }, { status: 400 });
      }

      const selectedSize = item.size.trim();
      const key = `${item.productId.trim()}_${selectedSize}`;
      const totalRequested = requestedQuantities[key];
      const availableStock = product.stock_by_size?.[selectedSize] ?? 0;

      if (totalRequested > availableStock) {
        return NextResponse.json({
          error: `Requested quantity (${totalRequested}) for ${product.name} (Size: ${selectedSize}) exceeds available stock (${availableStock})`
        }, { status: 400 });
      }

      const qty = parseInt(item.quantity, 10);
      const price = product.sale_price !== null && product.sale_price !== undefined ? Number(product.sale_price) : Number(product.price);
      const itemSubtotal = price * qty;
      subtotal += itemSubtotal;

      validatedItems.push({
        productId: product.id,
        productName: product.name,
        size: selectedSize,
        quantity: qty,
        price,
      });
    }

    // 3. Compute Server-Side Shipping & Total Amount
    const shippingFee = calculateDeliveryCharge(customer.state);
    const totalAmountRupees = subtotal + shippingFee;
    const totalAmountPaise = Math.round(totalAmountRupees * 100);

    if (totalAmountPaise < 100) {
      return NextResponse.json({ error: 'Order amount must be at least ₹1.00' }, { status: 400 });
    }

    // 4. Initialize Razorpay Client
    let razorpay;
    try {
      razorpay = getRazorpayClient();
    } catch (authError: any) {
      console.error('Razorpay Auth/Config Error:', authError.message);
      return NextResponse.json({ error: 'Payment gateway configuration error on server.' }, { status: 500 });
    }

    const receipt = `rcpt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    // 5. Create Razorpay Server Order
    const razorpayOrder = await razorpay.orders.create({
      amount: totalAmountPaise,
      currency: 'INR',
      receipt,
      notes: {
        customerName: (customer.fullName || '').slice(0, 40),
        customerPhone: (customer.phone || '').slice(0, 15),
        state: (customer.state || '').slice(0, 30),
      },
    });

    const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID || '';

    return NextResponse.json({
      success: true,
      order_id: razorpayOrder.id,
      razorpayOrderId: razorpayOrder.id,
      amount: totalAmountPaise,
      amountInRupees: totalAmountRupees,
      subtotal,
      shippingFee,
      currency: razorpayOrder.currency || 'INR',
      keyId,
      validatedItems,
    });
  } catch (error: any) {
    console.error('Error creating checkout order:', error);
    return NextResponse.json(
      { error: error.error?.description || error.message || 'Failed to create payment session' },
      { status: 500 }
    );
  }
}
