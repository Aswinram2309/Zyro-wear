import { NextResponse } from 'next/server';
import { getRazorpayClient } from '@/lib/razorpay';
import { getAllProductsFromStore } from '@/database/stores/products-store';
import { calculateDeliveryCharge } from '@/lib/delivery';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const clientIp = getClientIp(req);
    const rateLimit = checkRateLimit(`order_create:${clientIp}`, 30, 60);

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
      return NextResponse.json({ error: 'Invalid JSON request body' }, { status: 400 });
    }

    const { amount, currency = 'INR', receipt, notes, items, customer } = body;

    let totalAmountPaise = 0;
    let validatedItems: any[] = [];
    let subtotal = 0;
    let shippingFee = 0;

    // Cart items provided (trusted e-commerce flow)
    if (items && Array.isArray(items) && items.length > 0) {
      const allProducts = await getAllProductsFromStore(false);

      const requestedQuantities: Record<string, number> = {};
      for (const item of items) {
        if (!item.productId || !item.size) {
          return NextResponse.json({ error: 'Missing product ID or size in checkout items' }, { status: 400 });
        }
        const key = `${item.productId.trim()}_${item.size.trim()}`;
        const qty = Math.max(1, parseInt(item.quantity, 10) || 1);
        requestedQuantities[key] = (requestedQuantities[key] || 0) + qty;
      }

      for (const item of items) {
        const product = allProducts.find((p) => p.id === item.productId.trim());
        if (!product) {
          return NextResponse.json({ error: `Invalid product ID: ${item.productId}` }, { status: 400 });
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

        const qty = Math.max(1, parseInt(item.quantity, 10) || 1);
        const itemPrice = product.sale_price !== null && product.sale_price !== undefined ? Number(product.sale_price) : Number(product.price);
        const itemSubtotal = itemPrice * qty;
        subtotal += itemSubtotal;

        validatedItems.push({
          productId: product.id,
          productName: product.name,
          size: selectedSize,
          quantity: qty,
          price: itemPrice,
        });
      }

      shippingFee = calculateDeliveryCharge(customer?.state);
      const totalAmountRupees = subtotal + shippingFee;
      totalAmountPaise = Math.round(totalAmountRupees * 100);
    } 
    // Direct amount fallback
    else if (typeof amount === 'number' || (typeof amount === 'string' && !isNaN(Number(amount)))) {
      const numAmount = Number(amount);
      totalAmountPaise = Math.round(numAmount >= 100 ? numAmount : numAmount * 100);
    } else {
      return NextResponse.json({ error: 'Missing required items or amount' }, { status: 400 });
    }

    if (totalAmountPaise < 100) {
      return NextResponse.json(
        { error: 'Amount must be at least 100 paise (₹1.00)' },
        { status: 400 }
      );
    }

    let razorpay;
    try {
      razorpay = getRazorpayClient();
    } catch (authError: any) {
      console.error('Razorpay Auth/Config Error:', authError.message);
      return NextResponse.json(
        { error: 'Payment gateway configuration error' },
        { status: 500 }
      );
    }

    const orderReceipt = receipt || `rcpt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    try {
      const razorpayOrder = await razorpay.orders.create({
        amount: totalAmountPaise,
        currency: currency || 'INR',
        receipt: orderReceipt,
        notes: notes || {
          customerName: (customer?.fullName || '').slice(0, 40),
          customerPhone: (customer?.phone || '').slice(0, 15),
        },
      });

      const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID || '';

      return NextResponse.json({
        success: true,
        order_id: razorpayOrder.id,
        id: razorpayOrder.id,
        razorpayOrderId: razorpayOrder.id,
        amount: razorpayOrder.amount,
        amountInRupees: Math.round(Number(razorpayOrder.amount) / 100),
        currency: razorpayOrder.currency,
        receipt: razorpayOrder.receipt,
        subtotal,
        shippingFee,
        keyId,
        validatedItems: validatedItems.length > 0 ? validatedItems : undefined,
      });
    } catch (rzpError: any) {
      console.error('Razorpay API Error:', rzpError);
      return NextResponse.json(
        { error: rzpError.error?.description || rzpError.message || 'Razorpay order creation failed' },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('Error in create-order endpoint:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
