import { NextResponse } from 'next/server';
import { verifyRazorpaySignature } from '@/lib/razorpay';
import { saveOrderToStore, findOrderByPaymentId } from '@/database/stores/orders-store';
import { sendOrderConfirmationEmail, sendAdminNewOrderEmail } from '@/backend/services/email-service';
import { getProductByIdFromStore, deductSizeStock, restoreSizeStock } from '@/database/stores/products-store';

export async function POST(req: Request) {
  try {
    let body: any = {};
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON request body' }, { status: 400 });
    }

    // Accept both standard snake_case and camelCase parameters
    const orderId = body.razorpay_order_id || body.order_id || body.razorpayOrderId;
    const paymentId = body.razorpay_payment_id || body.payment_id || body.razorpayPaymentId;
    const signature = body.razorpay_signature || body.signature || body.razorpaySignature;

    // Validate missing fields
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
      console.error('Razorpay secret config error:', configError);
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

      // Deduct size stock atomically
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

      const shippingFee = subtotal >= 999 ? 0 : 49;
      const totalAmount = subtotal + shippingFee;
      const orderNumber = `ZY${Math.floor(1000 + Math.random() * 9000)}`;

      // Save order
      const savedOrder = await saveOrderToStore({
        orderNumber,
        customer,
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

        await sendOrderConfirmationEmail(orderPayload);
        await sendAdminNewOrderEmail(orderPayload, paymentId);
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

    // Default standalone verification response
    return NextResponse.json({
      success: true,
      message: 'Payment verified successfully',
      order_id: orderId,
      payment_id: paymentId,
    });
  } catch (error: any) {
    console.error('Error verifying payment signature:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error', success: false },
      { status: 500 }
    );
  }
}
