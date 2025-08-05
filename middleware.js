import { NextResponse } from "next/server"
import { auth } from "@/auth"

export async function middleware(req) {
  const { pathname } = req.nextUrl
  console.log('🔥 Middleware running for:', pathname)
  
  const session = await auth()
  console.log('🔑 Session exists:', !!session?.user)

  // Redirect authenticated users away from login/register pages
  if ((pathname === "/login" || pathname === "/register") && session?.user) {
    console.log('↩️ Redirecting authenticated user away from auth pages')
    return NextResponse.redirect(new URL("/", req.url))
  }

  // Allow access to login/register for unauthenticated users
  if (pathname === "/login" || pathname === "/register") {
    console.log('✅ Allowing access to auth pages')
    return NextResponse.next()
  }

  // Require authentication for all other pages
  if (!session?.user) {
    console.log('🚫 No session, redirecting to login')
    return NextResponse.redirect(new URL("/login", req.url))
  }

  // Check admin access for admin routes
  if (pathname.startsWith("/admin") && session.user.role !== "instructor") {
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