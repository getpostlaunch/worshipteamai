import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

export async function middleware(req: NextRequest) {
  // Keep request headers when mutating cookies
  let res = NextResponse.next({ request: { headers: req.headers } });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        // Next 15-compatible adapters
        getAll() {
          return req.cookies.getAll().map(({ name, value }) => ({ name, value }));
        },
        setAll(cookies) {
          cookies.forEach(({ name, value, options }) => {
            res.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  const {
    data: { session },
  } = await supabase.auth.getSession();

  const { pathname, search } = req.nextUrl;

  // Protected routes
  const needsAuth =
    pathname === '/app' ||
    pathname.startsWith('/app/') ||
    pathname === '/account' ||
    pathname.startsWith('/account/');

  // If NOT signed in and hitting a protected route → /login?redirect=<path>
  if (needsAuth && !session) {
    const redirectUrl = new URL('/login', req.url);
    redirectUrl.searchParams.set('redirect', pathname + search);
    return NextResponse.redirect(redirectUrl);
  }

  // If signed in and visiting /login or /signup → /app
  if (session && (pathname === '/login' || pathname === '/signup')) {
    return NextResponse.redirect(new URL('/app', req.url));
  }

  return res;
}

export const config = {
  // Run for everything except static assets
  matcher: ['/((?!_next/static|_next/image|favicon.ico|images).*)'],
};
