import { NextResponse } from 'next/server';
import {
  ADMIN_COOKIE_NAME,
  createAdminSessionToken,
  verifyAdminCredentials,
  verifyAdminRequest,
} from '@/lib/admin-auth';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/auth
 * Checks if current user has an active authenticated admin session.
 */
export async function GET(req: Request) {
  try {
    const auth = verifyAdminRequest(req);
    if (!auth.authorized) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }
    return NextResponse.json({
      authenticated: true,
      email: auth.email,
    });
  } catch (err: any) {
    return NextResponse.json({ authenticated: false, error: 'Auth check failed' }, { status: 500 });
  }
}

/**
 * POST /api/admin/auth
 * Server-side Admin Login endpoint with rate-limiting and secure session cookie.
 */
export async function POST(req: Request) {
  try {
    const clientIp = getClientIp(req);
    
    let body: any = {};
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: 'Invalid request payload' }, { status: 400 });
    }

    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    const isValid = verifyAdminCredentials(email, password);

    if (!isValid) {
      // Only penalize rate limit on failed attempts
      const rateLimit = checkRateLimit(`login_failed:${clientIp}`, 10, 300);
      if (!rateLimit.success) {
        return NextResponse.json(
          {
            error: 'Too many failed login attempts. Please wait 5 minutes before trying again.',
          },
          { status: 429 }
        );
      }

      return NextResponse.json(
        { error: 'Invalid credentials. Please check your email and password.' },
        { status: 401 }
      );
    }

    const sessionToken = createAdminSessionToken(email);

    const isProduction = process.env.NODE_ENV === 'production';
    const response = NextResponse.json({
      success: true,
      message: 'Authentication successful',
      email: email.toLowerCase().trim(),
    });

    // Set secure cookie
    response.cookies.set({
      name: ADMIN_COOKIE_NAME,
      value: sessionToken,
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60, // 7 days
    });

    return response;
  } catch (error: any) {
    console.error('Admin login API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/auth
 * Admin Logout endpoint to clear session cookie.
 */
export async function DELETE() {
  const response = NextResponse.json({
    success: true,
    message: 'Logged out successfully',
  });

  response.cookies.set({
    name: ADMIN_COOKIE_NAME,
    value: '',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });

  return response;
}
