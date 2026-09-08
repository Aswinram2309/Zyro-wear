import Razorpay from 'razorpay';
import crypto from 'crypto';

function cleanEnv(val?: string): string {
  if (!val) return '';
  return val.trim().replace(/^["']|["']$/g, '');
}

/**
 * Initializes and returns a Razorpay SDK instance.
 * Checks for required environment variables with automatic trimming of whitespace and quotes.
 */
export function getRazorpayClient(): Razorpay {
  const keyId = cleanEnv(process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID);
  const keySecret = cleanEnv(process.env.RAZORPAY_KEY_SECRET);

  if (!keyId || !keySecret) {
    throw new Error('Razorpay credentials (RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET) are missing from environment variables.');
  }

  return new Razorpay({
    key_id: keyId,
    key_secret: keySecret,
  });
}

/**
 * Verifies Razorpay payment signature using HMAC SHA256.
 * Algorithm: HMAC-SHA256(order_id + "|" + payment_id, KEY_SECRET)
 */
export function verifyRazorpaySignature(
  orderId: string,
  paymentId: string,
  signature: string
): boolean {
  const keySecret = cleanEnv(process.env.RAZORPAY_KEY_SECRET);
  if (!keySecret) {
    throw new Error('RAZORPAY_KEY_SECRET is not configured on server.');
  }

  if (!orderId || !paymentId || !signature) {
    return false;
  }

  const generatedSignature = crypto
    .createHmac('sha256', keySecret)
    .update(`${orderId.trim()}|${paymentId.trim()}`)
    .digest('hex');

  return generatedSignature === signature.trim();
}
