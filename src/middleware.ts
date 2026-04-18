import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionToken =
    request.cookies.get('__session')?.value ||
    request.cookies.get('next-auth.session-token')?.value ||
    request.cookies.get('firebase-auth-token')?.value;

  // Protect /account routes — must be logged in
  if (pathname.startsWith('/account')) {
    if (!sessionToken) {
      const url = request.nextUrl.clone();
      url.pathname = '/auth/login';
      url.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(url);
    }
  }

  // Protect /admin routes — verified server-side per page
  if (pathname.startsWith('/admin')) {
    if (!sessionToken) {
      const url = request.nextUrl.clone();
      url.pathname = '/auth/login';
      url.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/account/:path*', '/admin/:path*', '/checkout/:path*'],
};
