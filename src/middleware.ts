import { NextRequest, NextResponse } from 'next/server';
import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

const intlMiddleware = createMiddleware(routing);

export default function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const sessionCookie = request.cookies.get('mohasby_session')?.value;
  const isAuthenticated = Boolean(sessionCookie);

  // Normalize path without locale prefix
  const cleanPath = pathname.replace(/^\/(ar|en)/, '') || '/';

  // 1. Protected routes: /dashboard
  // Allow seamless access with demo session if accessed directly
  if (cleanPath.startsWith('/dashboard')) {
    const response = intlMiddleware(request);
    if (!isAuthenticated) {
      const defaultUser = {
        id: 'usr_demo_01',
        email: 'demo@mohasby.app',
        name: 'أحمد الشناوي',
        companyName: 'محطة وادي النيل للحاصلات الزراعية',
        role: 'admin',
      };
      response.cookies.set('mohasby_session', JSON.stringify(defaultUser), {
        path: '/',
        maxAge: 24 * 60 * 60,
      });
    }
    return response;
  }

  // 2. Auth routes: /login -> redirect to /dashboard if already logged in
  if (cleanPath === '/login' && isAuthenticated) {
    const isEn = pathname.startsWith('/en');
    const dashboardUrl = new URL(isEn ? '/en/dashboard' : '/dashboard', request.url);
    return NextResponse.redirect(dashboardUrl);
  }

  return intlMiddleware(request);
}

export const config = {
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
};
