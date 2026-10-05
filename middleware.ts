import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const ADMIN_COOKIE_NAME = 'zyro_admin_session';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Protect Admin Dashboard UI routes
  if (
    pathname.startsWith('/admin') &&
    !pathname.startsWith('/admin/login') &&
    !pathname.startsWith('/api/admin/auth')
  ) {
    const sessionCookie = request.cookies.get(ADMIN_COOKIE_NAME)?.value;

    if (!sessionCookie) {
      const loginUrl = new URL('/admin/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Basic structure validation of session token (base64url.base64url)
    const parts = sessionCookie.split('.');
    if (parts.length !== 2) {
      const loginUrl = new URL('/admin/login', request.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  // Redirect away from login page if already logged in
  if (pathname === '/admin/login') {
    const sessionCookie = request.cookies.get(ADMIN_COOKIE_NAME)?.value;
    if (sessionCookie && sessionCookie.split('.').length === 2) {
      return NextResponse.redirect(new URL('/admin/dashboard', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};
