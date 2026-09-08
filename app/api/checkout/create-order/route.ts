import { NextResponse } from 'next/server';
import { getRazorpayClient } from '@/lib/razorpay';
import { getAllProductsFromStore } from '@/database/stores/products-store';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { items, customer } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Cart is empty' }, { status: 400 });
    }

    const allProducts = await getAllProductsFromStore(false);

    // Accumulate requested quantities by productId + size to check total requested stock
    const requestedQuantities: Record<string, number> = {};
    for (const item of items) {
      if (!item.productId || !item.size) {
        return NextResponse.json({ error: 'Missing product ID or size in checkout items' }, { status: 400 });
      }
      const key = `${item.productId}_${item.size}`;
      const qty = Math.max(1, parseInt(item.quantity, 10) || 1);
      requestedQuantities[key] = (requestedQuantities[key] || 0) + qty;
    }

    let subtotal = 0;
    const validatedItems = [];

    for (const item of items) {
      const product = allProducts.find((p) => p.id === item.productId);
      if (!product) {
        return NextResponse.json({ error: `Invalid product ID: ${item.productId}` }, { status: 400 });
      }

      const selectedSize = item.size;
      const key = `${item.productId}_${selectedSize}`;
      const totalRequested = requestedQuantities[key];
      const availableStock = product.stock_by_size?.[selectedSize] ?? 0;

      if (totalRequested > availableStock) {
        return NextResponse.json({
          error: `Requested quantity (${totalRequested}) for ${product.name} (Size: ${selectedSize}) exceeds available stock (${availableStock})`
        }, { status: 400 });
      }

      const qty = Math.max(1, parseInt(item.quantity, 10) || 1);
      const price = product.sale_price || product.price;
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

    const shippingFee = subtotal >= 999 ? 0 : 49;
    const totalAmount = subtotal + shippingFee;
    const totalAmountPaise = totalAmount * 100;

    if (totalAmountPaise < 100) {
      return NextResponse.json({ error: 'Order amount must be at least ₹1.00' }, { status: 400 });
    }

    let razorpay;
    try {
      razorpay = getRazorpayClient();
    } catch (authError: any) {
      console.error('Razorpay Auth/Config Error:', authError.message);
      return NextResponse.json({ error: 'Payment gateway configuration error' }, { status: 401 });
    }

    const razorpayOrder = await razorpay.orders.create({
      amount: totalAmountPaise, // Amount in paise
      currency: 'INR',
      receipt: `rcpt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      notes: {
        customerName: customer?.fullName || '',
        customerPhone: customer?.phone || '',
      },
    });

    return NextResponse.json({
      success: true,
      order_id: razorpayOrder.id,
      razorpayOrderId: razorpayOrder.id,
      amount: totalAmount,
      subtotal,
      shippingFee,
      currency: 'INR',
      validatedItems,
    });
  } catch (error: any) {
    console.error('Error creating order:', error);
    const statusCode = error.statusCode || 500;
    return NextResponse.json(
      { error: error.error?.description || error.message || 'Internal server error' },
      { status: statusCode === 401 ? 401 : 500 }
    );
  }
}
