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
      return NextResponse.json({ error: 'Invalid JSON request body' }, { status: 400 });
    }

    const orderId = (body.razorpay_order_id || body.order_id || body.razorpayOrderId || '').trim();
    const paymentId = (body.razorpay_payment_id || body.payment_id || body.razorpayPaymentId || '').trim();
    const signature = (body.razorpay_signature || body.signature || body.razorpaySignature || '').trim();

    if (!orderId || !paymentId || !signature) {
      return NextResponse.json(
        {
          error: 'Missing required payment verification fields (order_id, payment_id, razorpay_signature)',
          success: false,
        },
        { status: 400 }
      );
    }

    // 1. Verify HMAC-SHA256 signature
    let isValid = false;
    try {
      isValid = verifyRazorpaySignature(orderId, paymentId, signature);
    } catch (configError: any) {
      console.error('Razorpay secret config error:', configError.message);
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    if (!isValid) {
      console.error(`Razorpay signature mismatch for order: ${orderId}, payment: ${paymentId}`);
      return NextResponse.json(
        {
          error: 'Invalid payment signature. Verification failed.',
          success: false,
        },
        { status: 400 }
      );
    }

    // If request contains customer & cart items (full e-commerce purchase flow)
    const { customer, items } = body;

    if (customer && customer.fullName && customer.phone && customer.address && items && Array.isArray(items)) {
      // Check idempotency
      const existingOrder = await findOrderByPaymentId(paymentId, orderId);
      if (existingOrder) {
        return NextResponse.json({
          success: true,
          message: 'Payment verified successfully (Already processed)',
          orderNumber: existingOrder.order_number,
          totalAmount: existingOrder.total_amount,
          customerName: existingOrder.customer_name,
          alreadyProcessed: true,
        });
      }

      // Validate products and stock
      let subtotal = 0;
      const validatedItems = [];

      for (const item of items) {
        if (!item.productId) {
          return NextResponse.json({ error: 'Missing product ID in items' }, { status: 400 });
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

      // Deduct size stock atomically with rollback
      const successfullyDeductedItems: Array<{ product_id: string; size: string; quantity: number }> = [];
      for (const item of validatedItems) {
        const result = await deductSizeStock(item.product_id, item.size, item.quantity);
        if (!result.success) {
          for (const deducted of successfullyDeductedItems) {
            await restoreSizeStock(deducted.product_id, deducted.size, deducted.quantity);
          }
          return NextResponse.json({
            error: result.message || `Sorry, ${item.product_name} (Size: ${item.size}) is no longer available in the requested quantity.`
          }, { status: 400 });
        }
        successfullyDeductedItems.push(item);
      }

      const shippingFee = calculateDeliveryCharge(customer?.state);
      const totalAmount = subtotal + shippingFee;
      const orderNumber = await generateNextOrderNumber();

      // Save order
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
        razorpayOrderId: orderId,
        razorpayPaymentId: paymentId,
      });

      // Dispatch order confirmation emails asynchronously
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

        if (orderPayload.email) {
          sendOrderConfirmationEmail(orderPayload).catch(() => {});
        }
        sendAdminNewOrderEmail(orderPayload, paymentId).catch(() => {});
      } catch (emailErr) {
        console.error('Non-critical email notification error:', emailErr);
      }

      return NextResponse.json({
        success: true,
        message: 'Payment verified and order placed successfully',
        orderNumber: savedOrder.order_number,
        totalAmount: savedOrder.total_amount,
        customerName: customer.fullName,
        payment_id: paymentId,
        order_id: orderId,
      });
    }

    // Standalone verification response
    return NextResponse.json({
      success: true,
      message: 'Payment verified successfully',
      order_id: orderId,
      payment_id: paymentId,
    });
  } catch (error: any) {
    console.error('Error verifying payment signature:', error);
    return NextResponse.json(
      { error: 'Payment verification failed', success: false },
      { status: 500 }
    );
  }
}
