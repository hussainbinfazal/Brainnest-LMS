
import { NextResponse, NextRequest } from "next/server"
import { logger } from "@/utils/logger/logger.edge/logger.edge";
import { getToken } from "next-auth/jwt"
import type { JWT } from "next-auth/jwt"
export async function middleware(req: NextRequest) {
  const { pathname }: { pathname: string } = req.nextUrl
  const requestId: string = crypto.randomUUID();
  const start: number = Date.now();

  const token: JWT | null = await getToken({
    req,
    secret: process.env.AUTH_SECRET,
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
      logger.info('Redirecting authenticated user away from auth pages');
      return NextResponse.redirect(new URL("/", req.url))
    }
    logger.info('Allowing access to public route')
    return NextResponse.next()
  }

  // Require authentication for protected routes
  if (!token) {
    logger.warn('No token, redirecting to login')
    return NextResponse.redirect(new URL("/login", req.url))
  }

  // Check admin access for admin routes
  if (pathname.startsWith("/admin") && token.role !== "instructor") {
    logger.warn('Non-admin trying to access admin route')
    return NextResponse.redirect(new URL("/", req.url))
  }

  logger.info('Allowing access to protected route')
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
    '/((?!api|_next/static|_next/image|favicon.ico|reviews|assets).*)',
  ],
}