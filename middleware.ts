import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Edge-compatible middleware that checks for NextAuth session cookie
// This avoids importing Node.js-only dependencies like Prisma
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Check for NextAuth session cookie (JWT strategy)
  // NextAuth v5 uses various cookie names depending on configuration
  // Check for common NextAuth cookie patterns
  const cookies = request.cookies;
  const hasSession = 
    cookies.has('authjs.session-token') ||
    cookies.has('__Secure-authjs.session-token') ||
    cookies.has('next-auth.session-token') ||
    cookies.has('__Secure-next-auth.session-token') ||
    cookies.has('authjs.callback-url') ||
    cookies.has('__Secure-authjs.callback-url');

  // Protect root page and dashboard - require login
  if (pathname === '/' || pathname.startsWith('/dashboard')) {
    if (!hasSession) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // Protect GET /api/errors (viewing errors requires auth)
  // But allow POST /api/errors/public (public endpoint)
  if (pathname === '/api/errors' && request.method === 'GET') {
    if (!hasSession) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
  }

  // Redirect authenticated users away from login page
  if (pathname === '/login' && hasSession) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/', '/dashboard/:path*', '/api/errors', '/login'],
};

