import { NextRequest, NextResponse } from "next/server";
import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";
const intlMiddleware = createMiddleware(routing);
export default function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const cleanPath = pathname.replace(/^\/(ar|en)(?=\/|$)/, "") || "/";
  if (
    cleanPath.startsWith("/dashboard") &&
    !request.cookies.get("mohasby_session")?.value
  ) {
    return NextResponse.redirect(
      new URL(pathname.startsWith("/en") ? "/en/login" : "/login", request.url),
    );
  }
  // Cookie presence is only a fast redirect. Layout/API verify the database session.
  // Node proxy may receive the target of an internal locale rewrite again.
  // Accept the explicit default-locale route instead of redirecting it back
  // to the same public URL. Authentication remains enforced above and in APIs.
  if (pathname === "/ar" || pathname.startsWith("/ar/")) {
    const headers = new Headers(request.headers);
    headers.set("X-NEXT-INTL-LOCALE", "ar");
    return NextResponse.next({ request: { headers } });
  }
  return intlMiddleware(request);
}
export const config = { matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"] };
