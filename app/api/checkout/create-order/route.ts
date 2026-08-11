import { NextResponse } from 'next/server';
import { INITIAL_PRODUCTS } from '@/lib/products-data';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { items } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Cart is empty' }, { status: 400 });
    }

    let subtotal = 0;
    const validatedItems = [];

    for (const item of items) {
      const product = INITIAL_PRODUCTS.find((p) => p.id === item.productId);
      if (!product) {
        return NextResponse.json({ error: `Invalid product ID: ${item.productId}` }, { status: 400 });
      }

      const qty = Math.max(1, parseInt(item.quantity, 10) || 1);
      const itemSubtotal = product.price * qty;
      subtotal += itemSubtotal;

      validatedItems.push({
        productId: product.id,
        productName: product.name,
        size: item.size || 'M',
        quantity: qty,
        price: product.price,
      });
    }

    const shippingFee = subtotal >= 999 ? 0 : 49;
    const totalAmount = subtotal + shippingFee;

    const testOrderId = `order_test_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    return NextResponse.json({
      success: true,
      razorpayOrderId: testOrderId,
      amount: totalAmount,
      subtotal,
      shippingFee,
      currency: 'INR',
      validatedItems,
    });
  } catch (error: any) {
    console.error('Error creating order:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
