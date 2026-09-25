
import { NextResponse, NextRequest } from "next/server"
import { logger } from "@/utils/logger/logger.edge/logger.edge";
import { getToken } from "next-auth/jwt"
import type { JWT } from "next-auth/jwt"
import { RateLimit as rateLimit } from "@repo/shared/config/redisConfig/rate-limiters/rate-limit";
import { checkIp, GLOBAL_IP_KEY } from "@repo/shared";

export async function proxy(req: NextRequest) {
  const { pathname }: { pathname: string } = req.nextUrl
  const requestId: string = crypto.randomUUID();
  const start: number = Date.now();

  if (pathname.startsWith('/api')) {
    const { allowed, remaining, retryAfterSec, ip } = await checkIp(req, GLOBAL_IP_KEY.namespace, GLOBAL_IP_KEY.max, GLOBAL_IP_KEY.windowSec);
    try {
      if (allowed) {
        return NextResponse.json(
          { message: 'Too many requests' },
          { status: 429, headers: { 'Retry-After': String(retryAfterSec) } },
        );
      }
    } catch (error: unknown) {
      logger.error('Global limiter unavailable', { error, ip: ip });
      // fail open
    }
    return NextResponse.next();
  }
  const token: JWT | null = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
    cookieName: process.env.NODE_ENV === 'production'
      ? '__Secure-authjs.session-token'
      : 'authjs.session-token'
  }) as JWT | null
  const log = (message: string, data?: any) => {
    logger.info({ requestId, message, duration: `${Date.now() - start}ms`, path: req.nextUrl.pathname, tokenPresent: !!token, ...data })
  }

  // Define public routes that don't require authentication
  const publicRoutes: string[] = [
    "/",
    "/login",
    "/register",
    "/about",
    "/contact",
    "/privacy",
    "/terms",
    "/blog",
    "/search",
    "/courses"
  ]

  const isPublicRoute: boolean | null = publicRoutes.some(route =>
    pathname === route ||
    pathname.startsWith("/blog/") ||
    pathname.startsWith("/search/")
  ) || (pathname.match(/^\/courses\/[^/]+$/) && pathname !== '/courses/liked-courses')

  // Allow access to public routes without authentication
  if (isPublicRoute) {
    // But redirect authenticated users away from login/register pages
    if ((pathname === "/login" || pathname === "/register") && token) {
      log('Redirecting authenticated user away from auth pages');
      return NextResponse.redirect(new URL("/", req.url))
    }
    log('Allowing access to public route')
    return NextResponse.next()
  }

  // Require authentication for protected routes
  if (!token) {
    log('No token, redirecting to login')
    return NextResponse.redirect(new URL("/login", req.url))
  }

  // Check admin access for admin routes
  if (pathname.startsWith("/admin") && token.role !== "instructor" && token.role !== "admin") {
    log('Non-admin trying to access admin route')
    return NextResponse.redirect(new URL("/", req.url))
  }

  log('Allowing access to protected route')
  const res: NextResponse = NextResponse.next()
  res.headers.set("X-Request-ID", requestId);
  res.headers.set("X-Response-Time", `${Date.now() - start}ms`);
  return res
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - reviews (static JSON files)
     */
    '/((?!_next/static|_next/image|favicon.ico|reviews|assets).*)',
  ],
}