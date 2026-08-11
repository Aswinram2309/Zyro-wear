import { NextResponse } from 'next/server';
import { INITIAL_PRODUCTS } from '@/lib/products-data';
import { saveOrderToStore } from '@/lib/orders-store';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { customer, items, razorpayOrderId, razorpayPaymentId } = body;

    if (!customer || !customer.fullName || !customer.phone || !customer.email || !customer.address) {
      return NextResponse.json({ error: 'Missing customer details' }, { status: 400 });
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Missing order items' }, { status: 400 });
    }

    // 1. Calculate trusted server-side total
    let subtotal = 0;
    const validatedItems = [];

    for (const item of items) {
      const product = INITIAL_PRODUCTS.find((p) => p.id === item.productId);
      if (!product) {
        return NextResponse.json({ error: `Invalid product ID: ${item.productId}` }, { status: 400 });
      }

      const qty = Math.max(1, parseInt(item.quantity, 10) || 1);
      const price = product.price;
      subtotal += price * qty;

      validatedItems.push({
        product_id: product.id,
        product_name: product.name,
        size: item.size || 'M',
        quantity: qty,
        price,
      });
    }

    const shippingFee = subtotal >= 999 ? 0 : 49;
    const totalAmount = subtotal + shippingFee;

    const orderNumber = `ZY${Math.floor(1000 + Math.random() * 9000)}`;

    // 2. Save order to persistent store (Supabase database & local backup)
    const savedOrder = await saveOrderToStore({
      orderNumber,
      customer,
      items: validatedItems,
      subtotal,
      totalAmount,
      razorpayOrderId,
      razorpayPaymentId,
    });

    return NextResponse.json({
      success: true,
      orderNumber: savedOrder.order_number,
      totalAmount: savedOrder.total_amount,
      customerName: customer.fullName,
    });
  } catch (error: any) {
    console.error('Error verifying payment:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
