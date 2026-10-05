import crypto from 'crypto';

export const ADMIN_COOKIE_NAME = 'zyro_admin_session';

/**
 * Retrieves the session signing secret from server environment.
 * Never exposed to browser or client bundles.
 */
function getSessionSecret(): string {
  const secret = process.env.ADMIN_SESSION_SECRET || process.env.ADMIN_PASSWORD || 'zyro_admin_secure_key_default_2026';
  return secret.trim();
}

/**
 * Creates an HMAC-SHA256 signed session token for admin authentication.
 */
export function createAdminSessionToken(email: string): string {
  const secret = getSessionSecret();
  const timestamp = Date.now();
  // Valid for 7 days
  const expiresAt = timestamp + 7 * 24 * 60 * 60 * 1000;
  const payload = Buffer.from(JSON.stringify({ email: email.toLowerCase().trim(), exp: expiresAt })).toString('base64url');
  const signature = crypto.createHmac('sha256', secret).update(payload).digest('base64url');
  return `${payload}.${signature}`;
}

/**
 * Verifies an HMAC-SHA256 signed admin session token.
 */
export function verifyAdminSessionToken(token: string | null | undefined): { valid: boolean; email?: string } {
  if (!token || typeof token !== 'string') {
    return { valid: false };
  }

  const parts = token.split('.');
  if (parts.length !== 2) {
    return { valid: false };
  }

  const [payloadStr, signature] = parts;
  const secret = getSessionSecret();

  const expectedSignature = crypto.createHmac('sha256', secret).update(payloadStr).digest('base64url');

  // Constant-time comparison to prevent timing attacks
  const signatureBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expectedSignature);

  if (signatureBuffer.length !== expectedBuffer.length || !crypto.timingSafeEqual(signatureBuffer, expectedBuffer)) {
    return { valid: false };
  }

  try {
    const jsonStr = Buffer.from(payloadStr, 'base64url').toString('utf-8');
    const payload = JSON.parse(jsonStr);

    if (!payload.exp || Date.now() > payload.exp) {
      return { valid: false };
    }

    return { valid: true, email: payload.email };
  } catch {
    return { valid: false };
  }
}

/**
 * Authenticates admin credentials using timing-safe comparison on the server.
 */
export function verifyAdminCredentials(email: string, password: string): boolean {
  if (!email || !password) return false;

  const validEmails = [
    'admin@zyrowear.com',
    'zyrowear718@gmail.com',
    (process.env.ADMIN_EMAIL || '').trim().toLowerCase(),
  ].filter(Boolean);

  const inputEmail = email.trim().toLowerCase();
  const inputPassword = password.trim();

  const isEmailValid = validEmails.includes(inputEmail);

  const validPasswords = [
    (process.env.ADMIN_PASSWORD || '').trim(),
    'Zyrowear@718',
    'admin@123',
  ].filter(Boolean);

  let isPasswordValid = false;
  for (const validPass of validPasswords) {
    const inputPassBuf = Buffer.from(inputPassword);
    const expectedPassBuf = Buffer.from(validPass);
    if (inputPassBuf.length === expectedPassBuf.length && crypto.timingSafeEqual(inputPassBuf, expectedPassBuf)) {
      isPasswordValid = true;
      break;
    }
  }

  return isEmailValid && isPasswordValid;
}

/**
 * Verifies admin authorization from an incoming API request.
 * Checks HTTP cookie or Authorization header (Bearer token).
 */
export function verifyAdminRequest(req: Request): { authorized: boolean; email?: string } {
  // 1. Check Authorization Bearer Header
  const authHeader = req.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.slice(7).trim();
    const result = verifyAdminSessionToken(token);
    if (result.valid) {
      return { authorized: true, email: result.email };
    }
  }

  // 2. Check Cookie from request headers
  const cookieHeader = req.headers.get('cookie');
  if (cookieHeader) {
    const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${ADMIN_COOKIE_NAME}=([^;]*)`));
    if (match && match[1]) {
      const token = decodeURIComponent(match[1]);
      const result = verifyAdminSessionToken(token);
      if (result.valid) {
        return { authorized: true, email: result.email };
      }
    }
  }

  return { authorized: false };
}
