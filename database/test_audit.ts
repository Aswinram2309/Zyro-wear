import { calculateDeliveryCharge } from '../lib/delivery';
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
