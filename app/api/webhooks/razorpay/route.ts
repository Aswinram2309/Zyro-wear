import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { findOrderByPaymentId } from '@/database/stores/orders-store';

export const dynamic = 'force-dynamic';

/**
 * Razorpay Webhook Handler
 * Verifies webhook cryptographic signature and ensures idempotent event processing.
 */
export async function POST(req: Request) {
  try {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

    const signature = req.headers.get('x-razorpay-signature');
    const rawBody = await req.text();

    if (webhookSecret) {
      if (!signature) {
        return NextResponse.json({ error: 'Missing webhook signature' }, { status: 400 });
      }

      const expectedSignature = crypto
        .createHmac('sha256', webhookSecret)
        .update(rawBody)
        .digest('hex');

      if (signature !== expectedSignature) {
        console.warn('[Razorpay Webhook] Invalid webhook signature');
        return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
      }
    }

    let event: any = {};
    try {
      event = JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
    }

    const eventType = event.event;
    console.log(`[Razorpay Webhook] Received event: ${eventType}`);

    if (eventType === 'order.paid' || eventType === 'payment.captured') {
      const paymentEntity = event.payload?.payment?.entity;
      const orderEntity = event.payload?.order?.entity;

      const paymentId = paymentEntity?.id;
      const orderId = orderEntity?.id || paymentEntity?.order_id;

      if (paymentId || orderId) {
        // Idempotency check: verify if order already processed via client flow
        const existing = await findOrderByPaymentId(paymentId, orderId);
        if (existing) {
          console.log(`[Razorpay Webhook] Order for payment ${paymentId} already processed. Idempotent ack.`);
          return NextResponse.json({ received: true, status: 'already_processed' });
        }
      }
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('[Razorpay Webhook Error]:', error);
    return NextResponse.json({ error: 'Webhook handling failed' }, { status: 500 });
  }
}
