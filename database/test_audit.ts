import { calculateDeliveryCharge } from '../lib/delivery';
import { calculateBuy3For999 } from '../lib/pricing';
import { verifyRazorpaySignature } from '../lib/razorpay';
import {
  createAdminSessionToken,
  verifyAdminSessionToken,
  verifyAdminCredentials,
} from '../lib/admin-auth';
import { checkRateLimit } from '../lib/rate-limit';

let passed = 0;
let failed = 0;

function assert(condition: boolean, testName: string) {
  if (condition) {
    console.log(`  ✓ PASS: ${testName}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${testName}`);
    failed++;
  }
}

async function runTests() {
  console.log('\n--- 1. Testing Shipping Rules Calculation ---');
  assert(calculateDeliveryCharge('Tamil Nadu') === 50, 'Tamil Nadu is ₹50');
  assert(calculateDeliveryCharge('tamil nadu ') === 50, 'Tamil Nadu (case-insensitive & trimmed) is ₹50');
  assert(calculateDeliveryCharge('Kerala') === 70, 'Kerala is ₹70');
  assert(calculateDeliveryCharge('Karnataka') === 70, 'Karnataka is ₹70');
  assert(calculateDeliveryCharge('Andhra Pradesh') === 70, 'Andhra Pradesh is ₹70');
  assert(calculateDeliveryCharge('Maharashtra') === 180, 'Maharashtra is ₹180');
  assert(calculateDeliveryCharge('Delhi') === 180, 'Delhi is ₹180');
  assert(calculateDeliveryCharge('West Bengal') === 180, 'West Bengal is ₹180');

  console.log('\n--- 2. Testing Razorpay HMAC-SHA256 Verification ---');
  process.env.RAZORPAY_KEY_SECRET = 'test_secret_key_12345';
  
  // Real HMAC-SHA256 for order_999|pay_888 with key test_secret_key_12345
  const crypto = await import('crypto');
  const validSig = crypto
    .createHmac('sha256', 'test_secret_key_12345')
    .update('order_999|pay_888')
    .digest('hex');

  assert(verifyRazorpaySignature('order_999', 'pay_888', validSig) === true, 'Valid Razorpay HMAC signature passes');
  assert(verifyRazorpaySignature('order_999', 'pay_888', 'invalid_signature') === false, 'Invalid signature rejected');
  assert(verifyRazorpaySignature('order_different', 'pay_888', validSig) === false, 'Tampered order ID rejected');
  assert(verifyRazorpaySignature('', '', '') === false, 'Empty signature rejected');

  console.log('\n--- 3. Testing Admin Server Authentication & Session Tokens ---');
  process.env.ADMIN_SESSION_SECRET = 'super_secret_session_key_32_bytes_long';
  process.env.ADMIN_EMAIL = 'admin@zyrowear.com';
  process.env.ADMIN_PASSWORD = 'strong_admin_pass_99';

  assert(verifyAdminCredentials('admin@zyrowear.com', 'strong_admin_pass_99') === true, 'Valid admin credentials accepted');
  assert(verifyAdminCredentials('admin@zyrowear.com', 'wrong_pass') === false, 'Wrong password rejected');
  assert(verifyAdminCredentials('hacker@test.com', 'strong_admin_pass_99') === false, 'Wrong email rejected');

  const token = createAdminSessionToken('admin@zyrowear.com');
  assert(typeof token === 'string' && token.includes('.'), 'Session token generated with payload and signature');

  const sessionResult = verifyAdminSessionToken(token);
  assert(sessionResult.valid === true && sessionResult.email === 'admin@zyrowear.com', 'Session token verifies correctly');

  const tamperedToken = token.slice(0, -5) + 'abcde';
  assert(verifyAdminSessionToken(tamperedToken).valid === false, 'Tampered token signature rejected');

  console.log('\n--- 4. Testing In-Memory Rate Limiting ---');
  const testIp = '192.168.1.100';
  const r1 = checkRateLimit(`test_action:${testIp}`, 3, 60);
  const r2 = checkRateLimit(`test_action:${testIp}`, 3, 60);
  const r3 = checkRateLimit(`test_action:${testIp}`, 3, 60);
  const r4 = checkRateLimit(`test_action:${testIp}`, 3, 60);

  assert(r1.success === true && r1.remaining === 2, 'Rate limit attempt 1 allowed (remaining: 2)');
  assert(r2.success === true && r2.remaining === 1, 'Rate limit attempt 2 allowed (remaining: 1)');
  assert(r3.success === true && r3.remaining === 0, 'Rate limit attempt 3 allowed (remaining: 0)');
  assert(r4.success === false && r4.remaining === 0, 'Rate limit attempt 4 blocked');

  console.log('\n--- 5. Testing BUY 3 FOR ₹999 Promotional Pricing ---');
  // 1 product at ₹399 -> ₹399
  const p1 = calculateBuy3For999([{ price: 399, quantity: 1 }]);
  assert(p1.discountedProductTotal === 399, '1 product at ₹399 -> ₹399');
  assert(p1.itemsNeededForNextCombo === 2, '1 product needs 2 more for combo');

  // 2 products at ₹399 each -> ₹798
  const p2 = calculateBuy3For999([{ price: 399, quantity: 2 }]);
  assert(p2.discountedProductTotal === 798, '2 products at ₹399 each -> ₹798');
  assert(p2.itemsNeededForNextCombo === 1, '2 products needs 1 more for combo');

  // 2 Oversized T-shirts at ₹399 each + 1 Jersey at ₹299 -> ₹999
  const p3 = calculateBuy3For999([
    { price: 399, quantity: 2 },
    { price: 299, quantity: 1 },
  ]);
  assert(p3.discountedProductTotal === 999, '2 Oversized (₹399) + 1 Jersey (₹299) -> ₹999');
  assert(p3.bundleDiscount === 98, 'Bundle discount is ₹98');

  // 3 Oversized T-shirts at ₹399 each -> ₹999
  const p4 = calculateBuy3For999([{ price: 399, quantity: 3 }]);
  assert(p4.discountedProductTotal === 999, '3 Oversized at ₹399 -> ₹999');
  assert(p4.bundleDiscount === 198, 'Discount for 3x399 is ₹198');

  // 3 Oversized T-shirts + 1 Jersey at ₹299 -> ₹1,298
  const p5 = calculateBuy3For999([
    { price: 399, quantity: 3 },
    { price: 299, quantity: 1 },
  ]);
  assert(p5.discountedProductTotal === 1298, '3 Oversized (₹399) + 1 Jersey (₹299) -> ₹1,298');
  assert(p5.remainingUnits === 1, '1 product remains at regular price');

  // 4 Oversized T-shirts at ₹399 each -> ₹1,398
  const p6 = calculateBuy3For999([{ price: 399, quantity: 4 }]);
  assert(p6.discountedProductTotal === 1398, '4 Oversized at ₹399 each -> ₹1,398');

  // 6 Oversized T-shirts at ₹399 each -> ₹1,998
  const p7 = calculateBuy3For999([{ price: 399, quantity: 6 }]);
  assert(p7.discountedProductTotal === 1998, '6 Oversized at ₹399 each -> ₹1,998');
  assert(p7.qualifyingGroups === 2, '2 qualifying bundles applied');

  // Multiples from 1 to 9
  for (let q = 1; q <= 9; q++) {
    const res = calculateBuy3For999([{ price: 399, quantity: q }]);
    const expected = Math.floor(q / 3) * 999 + (q % 3) * 399;
    assert(res.discountedProductTotal === expected, `Quantity ${q} Oversized pricing correctly equals ₹${expected}`);
  }

  // Combined product + shipping
  assert(p1.discountedProductTotal + calculateDeliveryCharge('Tamil Nadu') === 449, '1 Oversized + ₹50 TN shipping = ₹449');
  assert(p4.discountedProductTotal + calculateDeliveryCharge('Tamil Nadu') === 1049, '3 eligible products + ₹50 TN shipping = ₹1,049');
  assert(p6.discountedProductTotal + calculateDeliveryCharge('Tamil Nadu') === 1448, '4 Oversized + ₹50 TN shipping = ₹1,448');
  assert(p7.discountedProductTotal + calculateDeliveryCharge('Tamil Nadu') === 2048, '6 Oversized + ₹50 TN shipping = ₹2,048');
  assert(p4.discountedProductTotal + calculateDeliveryCharge('Kerala') === 1069, '3 eligible products + ₹70 Kerala shipping = ₹1,069');
  assert(p4.discountedProductTotal + calculateDeliveryCharge('Maharashtra') === 1179, '3 eligible products + ₹180 Maharashtra shipping = ₹1,179');

  console.log(`\n========================================`);
  console.log(`Test Results: ${passed} PASSED, ${failed} FAILED`);
  console.log(`========================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((e) => {
  console.error('Test execution error:', e);
  process.exit(1);
});
