import { NextResponse } from "next/server"
import { getToken } from "next-auth/jwt"

export async function middleware(req) {
  const { pathname } = req.nextUrl
  console.log('🔥 Middleware running for:', pathname)
  
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
  console.log('🔑 Token exists:', !!token)

  // Redirect authenticated users away from login/register pages
  if ((pathname === "/login" || pathname === "/register") && token) {
    console.log('↩️ Redirecting authenticated user away from auth pages')
    return NextResponse.redirect(new URL("/", req.url))
  }

  // Allow access to login/register for unauthenticated users
  if (pathname === "/login" || pathname === "/register") {
    console.log('✅ Allowing access to auth pages')
    return NextResponse.next()
  }

  // Require authentication for all other pages
  if (!token) {
    console.log('🚫 No token, redirecting to login')
    return NextResponse.redirect(new URL("/login", req.url))
  }

  // Check admin access for admin routes
  if (pathname.startsWith("/admin") && token.role !== "admin") {
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
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}