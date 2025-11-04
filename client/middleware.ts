import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { LOCALE_COOKIE_NAME, defaultLocale, locales } from './lib/i18n-config';

/**
 * Next.js Middleware with Authentication & Internationalization
 *
 * This middleware handles:
 * 1. Authentication - Server-side route protection using cookies
 * 2. Internationalization - Locale detection via cookies (no URL prefixes)
 * 3. Security - Proper redirect flows for auth/unauth users
 *
 * IMPORTANT CHANGES:
 * - Locale is now stored in cookies, not in URL paths
 * - All routes are locale-free: /feed, /posts/123, etc.
 * - Locale detection happens via NEXT_LOCALE cookie
 */

export default function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Get authentication token from cookies
  const token = request.cookies.get('syncspace_token')?.value;

  // Get locale from cookie, fallback to default
  const localeCookie = request.cookies.get(LOCALE_COOKIE_NAME)?.value;
  const locale = localeCookie && locales.includes(localeCookie as any)
    ? localeCookie
    : defaultLocale;

  // Define public routes (accessible without authentication)
  const publicPaths = [
    '/login',
    '/register',
    '/forgot-password',
    '/reset-password',
    '/confirm-email',
  ];

  // Check if current path is public
  const isPublicPath = publicPaths.some(path =>
    pathname === path || pathname.startsWith(path + '/')
  );

  // Home page is public but shows different content for authenticated users
  const isHomePage = pathname === '/';

  // Create response
  let response: NextResponse;

  // Redirect authenticated users away from auth pages to feed
  if (token && isPublicPath && !isHomePage) {
    response = NextResponse.redirect(new URL('/feed', request.url));
  }
  // Redirect unauthenticated users to login (except public paths and home)
  else if (!token && !isPublicPath && !isHomePage) {
    const redirectUrl = new URL('/login', request.url);
    // Store the intended destination for post-login redirect
    redirectUrl.searchParams.set('callbackUrl', pathname);
    response = NextResponse.redirect(redirectUrl);
  }
  // Allow the request to proceed
  else {
    response = NextResponse.next();
  }

  // Ensure locale cookie is set
  if (!localeCookie || !locales.includes(localeCookie as any)) {
    response.cookies.set(LOCALE_COOKIE_NAME, locale, {
      path: '/',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 365, // 1 year
    });
  }

  // Set x-locale header for next-intl to read
  response.headers.set('x-locale', locale);

  return response;
}

/**
 * Matcher configuration for middleware
 *
 * This tells Next.js which routes should trigger the middleware.
 * We exclude static files, images, and Next.js internal routes.
 */
export const config = {
  matcher: [
    // Enable routing on all routes except API and static files
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
