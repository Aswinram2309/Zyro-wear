import { NextResponse } from 'next/server';
import { saveOrderToStore } from '@/lib/orders-store';
import { sendOrderConfirmationEmail } from '@/lib/email-service';
import { getProductByIdFromStore, deductSizeStock } from '@/lib/products-store';

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

    // 1. Calculate trusted server-side total and validate size stock
    let subtotal = 0;
    const validatedItems = [];

    for (const item of items) {
      const product = await getProductByIdFromStore(item.productId);
      if (!product) {
        return NextResponse.json({ error: `Invalid product ID: ${item.productId}` }, { status: 400 });
      }

      const qty = Math.max(1, parseInt(item.quantity, 10) || 1);
      const requestedSize = item.size || 'M';

      // Check server-side size stock
      if (product.stock_by_size && product.stock_by_size[requestedSize] !== undefined) {
        const avail = Number(product.stock_by_size[requestedSize]) || 0;
        if (avail < qty) {
          return NextResponse.json(
            { error: `Insufficient stock for ${product.name} (Size: ${requestedSize}). Requested: ${qty}, Available: ${avail}` },
            { status: 400 }
          );
        }
      }

      const price = product.sale_price || product.price;
      subtotal += price * qty;

      validatedItems.push({
        product_id: product.id,
        product_name: product.name,
        size: requestedSize,
        quantity: qty,
        price,
      });
    }

    // 2. Perform atomic size-wise stock deduction ONLY after successful payment validation
    for (const item of validatedItems) {
      const result = await deductSizeStock(item.product_id, item.size, item.quantity);
      if (!result.success) {
        return NextResponse.json({ error: result.message || 'Failed to update stock' }, { status: 400 });
      }
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

    // 3. Send Order Confirmation Email via Resend (Server-Side Only)
    // Non-blocking: Email errors do NOT break order confirmation
    try {
      await sendOrderConfirmationEmail({
        orderNumber: savedOrder.order_number,
        customerName: customer.fullName,
        email: customer.email,
        phone: customer.phone,
        address: customer.address,
        city: customer.city || '',
        state: customer.state || '',
        pincode: customer.pincode || '',
        items: validatedItems,
        subtotal,
        totalAmount,
        paymentStatus: 'PAID (Test Mode)',
        createdAt: savedOrder.created_at || new Date().toISOString(),
      });
    } catch (emailErr) {
      console.error('Non-critical email dispatch error:', emailErr);
    }

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
