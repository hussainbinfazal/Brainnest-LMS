
import { NextResponse } from "next/server"
import { getToken } from "next-auth/jwt"

export async function middleware(req) {
  const { pathname } = req.nextUrl
  
  const token = await getToken({ 
    req, 
    secret: process.env.AUTH_SECRET,
    cookieName: process.env.NODE_ENV === 'production' 
      ? '__Secure-authjs.session-token' 
      : 'authjs.session-token'
  })

  // Define public routes that don't require authentication
  const publicRoutes = [
    "/",
    "/login", 
    "/register",
    "/about",
    "/contact", 
    "/privacy",
    "/terms",
    "/blog",
    "/search"
  ]
  
  const isPublicRoute = publicRoutes.some(route => 
    pathname === route || 
    pathname.startsWith("/blog/") || 
    pathname.startsWith("/search/")
  ) || (pathname.match(/^\/courses\/[^/]+$/) && pathname !== '/courses/liked-courses')

  // Allow access to public routes without authentication
  if (isPublicRoute) {
    // But redirect authenticated users away from login/register pages
    if ((pathname === "/login" || pathname === "/register") && token) {
      console.log('↩️ Redirecting authenticated user away from auth pages')
      return NextResponse.redirect(new URL("/", req.url))
    }
    console.log('✅ Allowing access to public route')
    return NextResponse.next()
  }

  // Require authentication for protected routes
  if (!token) {
    console.log('🚫 No token, redirecting to login')
    return NextResponse.redirect(new URL("/login", req.url))
  }

  // Check admin access for admin routes
  if (pathname.startsWith("/admin") && token.role !== "instructor") {
    console.log('⛔ Non-admin trying to access admin route')
    return NextResponse.redirect(new URL("/", req.url))
  }

  console.log('✅ Allowing access to protected route')
  return NextResponse.next()
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