import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { saveOrderToStore, findOrderByPaymentId } from '@/database/stores/orders-store';
import { sendOrderConfirmationEmail, sendAdminNewOrderEmail } from '@/backend/services/email-service';
import { getProductByIdFromStore, deductSizeStock, restoreSizeStock } from '@/database/stores/products-store';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { customer, items, razorpayOrderId, razorpayPaymentId, razorpaySignature } = body;

    if (!customer || !customer.fullName || !customer.phone || !customer.address) {
      return NextResponse.json({ error: 'Missing customer details' }, { status: 400 });
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Missing order items' }, { status: 400 });
    }

    // 1. IDEMPOTENCY CHECK: Prevent duplicate order processing if payment ID or order ID was already processed
    if (razorpayPaymentId) {
      const existingOrder = await findOrderByPaymentId(razorpayPaymentId, razorpayOrderId);
      if (existingOrder) {
        return NextResponse.json({
          success: true,
          orderNumber: existingOrder.order_number,
          totalAmount: existingOrder.total_amount,
          customerName: existingOrder.customer_name,
          alreadyProcessed: true,
        });
      }
    }

    // 2. SERVER-SIDE RAZORPAY SIGNATURE VERIFICATION
    const razorpaySecret = process.env.RAZORPAY_KEY_SECRET;
    
    if (!razorpaySecret) {
      console.error('Razorpay key secret is not configured.');
      return NextResponse.json({ error: 'Payment gateway configuration error.' }, { status: 500 });
    }

    if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      return NextResponse.json({ error: 'Missing Razorpay payment parameters.' }, { status: 400 });
    }

    const expectedSignature = crypto
      .createHmac('sha256', razorpaySecret)
      .update(`${razorpayOrderId}|${razorpayPaymentId}`)
      .digest('hex');

    if (expectedSignature !== razorpaySignature) {
      console.error('Razorpay signature mismatch!');
      return NextResponse.json({ error: 'Invalid payment signature. Verification failed.' }, { status: 400 });
    }

    // 3. Calculate trusted server-side total and validate size stock
    let subtotal = 0;
    const validatedItems = [];

    for (const item of items) {
      const product = await getProductByIdFromStore(item.productId);
      if (!product) {
        return NextResponse.json({ error: `Invalid product ID: ${item.productId}` }, { status: 400 });
      }

      const qty = Math.max(1, parseInt(item.quantity, 10) || 1);
      const requestedSize = item.size || 'M';
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

    // 4. PERFORM ATOMIC SIZE-WISE STOCK DEDUCTION WITH TRANSACTIONAL ROLLBACK
    const successfullyDeductedItems: Array<{ product_id: string; size: string; quantity: number }> = [];

    for (const item of validatedItems) {
      const result = await deductSizeStock(item.product_id, item.size, item.quantity);
      if (!result.success) {
        // Rollback any previously deducted items in this transaction
        for (const deducted of successfullyDeductedItems) {
          await restoreSizeStock(deducted.product_id, deducted.size, deducted.quantity);
        }
        return NextResponse.json({
          error: result.message || `Sorry, ${item.product_name} (Size: ${item.size}) is no longer available in the requested quantity.`
        }, { status: 400 });
      }
      successfullyDeductedItems.push(item);
    }

    const shippingFee = subtotal >= 999 ? 0 : 49;
    const totalAmount = subtotal + shippingFee;

    const orderNumber = `ZY${Math.floor(1000 + Math.random() * 9000)}`;

    // 5. Save order to persistent store (Supabase database & local backup)
    const savedOrder = await saveOrderToStore({
      orderNumber,
      customer,
      items: validatedItems,
      subtotal,
      totalAmount,
      razorpayOrderId,
      razorpayPaymentId,
    });

    // 6. Send Order Confirmation Email via Resend (Server-Side Only)
    try {
      const orderPayload = {
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
        paymentStatus: 'PAID',
        createdAt: savedOrder.created_at || new Date().toISOString(),
      };
      
      // Send to Customer
      await sendOrderConfirmationEmail(orderPayload);
      
      // Send to Admin
      await sendAdminNewOrderEmail(orderPayload, razorpayPaymentId);
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
