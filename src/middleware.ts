import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });

  const {
    data: { session },
  } = await supabase.auth.getSession();

  const { pathname, search } = req.nextUrl;

  // Only these routes are protected
  const needsAuth =
    pathname === '/app' ||
    pathname.startsWith('/app/') ||
    pathname === '/account' ||
    pathname.startsWith('/account/');

  // If NOT signed in and hitting a protected route → send to /login
  if (needsAuth && !session) {
    const redirect = new URL('/login', req.url);
    redirect.searchParams.set('redirect', pathname + search);
    return NextResponse.redirect(redirect);
  }

  // If already signed in and hitting /login or /signup, push to /app
  if (session && (pathname === '/login' || pathname === '/signup')) {
    return NextResponse.redirect(new URL('/app', req.url));
  }

  return res;
}

export const config = {
  // Run for everything except static assets
  matcher: ['/((?!_next/static|_next/image|favicon.ico|images).*)'],
};
