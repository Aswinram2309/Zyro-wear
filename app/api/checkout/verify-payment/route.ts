import { NextResponse } from 'next/server';
import { verifyRazorpaySignature } from '@/lib/razorpay';
import { saveOrderToStore, findOrderByPaymentId, generateNextOrderNumber } from '@/database/stores/orders-store';
import { sendOrderConfirmationEmail, sendAdminNewOrderEmail } from '@/backend/services/email-service';
import { getProductByIdFromStore, deductSizeStock, restoreSizeStock } from '@/database/stores/products-store';
import { calculateDeliveryCharge } from '@/lib/delivery';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const clientIp = getClientIp(req);
    const rateLimit = checkRateLimit(`verify_pay:${clientIp}`, 30, 60);

    if (!rateLimit.success) {
      return NextResponse.json(
        { error: 'Too many requests. Please wait a moment.' },
        { status: 429 }
      );
    }

    let body: any = {};
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON request payload' }, { status: 400 });
    }

    const customer = body.customer;
    const items = body.items;
    const razorpayOrderId = (body.razorpayOrderId || body.razorpay_order_id || body.order_id || '').trim();
    const razorpayPaymentId = (body.razorpayPaymentId || body.razorpay_payment_id || body.payment_id || '').trim();
    const razorpaySignature = (body.razorpaySignature || body.razorpay_signature || body.signature || '').trim();

    if (!customer || !customer.fullName || !customer.phone || !customer.address) {
      return NextResponse.json({ error: 'Missing required customer delivery details' }, { status: 400 });
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Missing checkout order items' }, { status: 400 });
    }

    if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      return NextResponse.json({ error: 'Missing Razorpay payment verification parameters' }, { status: 400 });
    }

    // 1. IDEMPOTENCY CHECK: Prevent duplicate order processing if payment was already verified
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

    // 2. SERVER-SIDE RAZORPAY SIGNATURE VERIFICATION
    let isValid = false;
    try {
      isValid = verifyRazorpaySignature(razorpayOrderId, razorpayPaymentId, razorpaySignature);
    } catch (configError: any) {
      console.error('Razorpay secret config error:', configError.message);
      return NextResponse.json({ error: 'Payment gateway configuration error.' }, { status: 500 });
    }

    if (!isValid) {
      console.error(`Razorpay signature mismatch for order: ${razorpayOrderId}, payment: ${razorpayPaymentId}`);
      return NextResponse.json({ error: 'Invalid payment signature. Verification failed.' }, { status: 400 });
    }

    // 3. Calculate trusted server-side total and validate products
    let subtotal = 0;
    const validatedItems = [];

    for (const item of items) {
      if (!item.productId) {
        return NextResponse.json({ error: 'Missing product ID in order items' }, { status: 400 });
      }

      const product = await getProductByIdFromStore(item.productId.trim());
      if (!product) {
        return NextResponse.json({ error: `Invalid product ID: ${item.productId}` }, { status: 400 });
      }

      const qty = Math.max(1, parseInt(item.quantity, 10) || 1);
      const requestedSize = (item.size || 'M').trim();
      const price = product.sale_price !== null && product.sale_price !== undefined ? Number(product.sale_price) : Number(product.price);

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
          error: result.message || `Sorry, ${item.product_name} (Size: ${item.size}) is no longer available in requested quantity.`
        }, { status: 400 });
      }
      successfullyDeductedItems.push(item);
    }

    const shippingFee = calculateDeliveryCharge(customer.state);
    const totalAmount = subtotal + shippingFee;

    const orderNumber = await generateNextOrderNumber();

    // 5. Save order to persistent store (Supabase DB + local backup)
    const savedOrder = await saveOrderToStore({
      orderNumber,
      customer: {
        fullName: customer.fullName.trim(),
        phone: customer.phone.trim(),
        altPhone: (customer.altPhone || '').trim(),
        email: (customer.email || '').trim(),
        address: customer.address.trim(),
        city: (customer.city || '').trim(),
        state: (customer.state || '').trim(),
        pincode: (customer.pincode || '').trim(),
      },
      items: validatedItems,
      subtotal,
      totalAmount,
      razorpayOrderId,
      razorpayPaymentId,
    });

    // 6. Asynchronously Send Order Confirmation Email via Resend
    try {
      const orderPayload = {
        orderNumber: savedOrder.order_number,
        customerName: customer.fullName.trim(),
        email: (customer.email || '').trim(),
        phone: customer.phone.trim(),
        address: customer.address.trim(),
        city: (customer.city || '').trim(),
        state: (customer.state || '').trim(),
        pincode: (customer.pincode || '').trim(),
        items: validatedItems,
        subtotal,
        totalAmount,
        paymentStatus: 'PAID',
        createdAt: savedOrder.created_at || new Date().toISOString(),
      };
      
      // Customer confirmation
      if (orderPayload.email) {
        sendOrderConfirmationEmail(orderPayload).catch((e) => console.error('Customer email dispatch error:', e));
      }
      
      // Admin notification
      sendAdminNewOrderEmail(orderPayload, razorpayPaymentId).catch((e) => console.error('Admin email dispatch error:', e));
    } catch (emailErr) {
      console.error('Non-critical email trigger error:', emailErr);
    }

    return NextResponse.json({
      success: true,
      orderNumber: savedOrder.order_number,
      totalAmount: savedOrder.total_amount,
      customerName: customer.fullName,
      order_id: razorpayOrderId,
      payment_id: razorpayPaymentId,
    });
  } catch (error: any) {
    console.error('Error verifying payment:', error);
    return NextResponse.json({ error: 'Failed to verify payment transaction' }, { status: 500 });
  }
}
