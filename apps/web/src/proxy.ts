
import { NextResponse, NextRequest } from "next/server"
import { logger } from "@/utils/logger/logger.edge/logger.edge";
import { getToken } from "next-auth/jwt"
import type { JWT } from "next-auth/jwt"
import { getClientIp } from "@repo/shared/utils/getClientIp";
import { RateLimit as rateLimit } from "@repo/shared/config/redisConfig/rate-limiters/rate-limit";
import { getRedisClient } from "@repo/shared";

export async function middleware(req: NextRequest) {
  const { pathname }: { pathname: string } = req.nextUrl
  const requestId: string = crypto.randomUUID();
  const start: number = Date.now();
  const ip = getClientIp(req.headers);
  if (pathname.startsWith('/api')) {
    const ip = getClientIp(req.headers);
    try {
      const r = await rateLimit(getRedisClient(), { 
        key: `global:ip:${ip}`, max: 100, windowSec: 60,
      });
      if (!r.allowed) {
        return NextResponse.json(
          { message: 'Too many requests' },
          { status: 429, headers: { 'Retry-After': String(r.retryAfterSec) } },
        );
      }
    } catch (error) {
      logger.error('Global limiter unavailable', { error });   // fail open
    }
    return NextResponse.next();
  }
  try {
    const r = await rateLimit(getRedisClient(), { key: `global:ip:${ip}`, max: 100, windowSec: 60 });
    if (!r.allowed) {
      return NextResponse.json(
        { message: 'Too many requests' },
        { status: 429, headers: { 'Retry-After': String(r.retryAfterSec) } },
      );
    }
  } catch (error: unknown) {
    logger.error(error);
    // fail OPEN: the OTP route fails closed, but a Redis outage
    // should not take your whole API down
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
  runtime: 'nodejs',
}