// import { NextResponse } from "next/server"
// import { getToken } from "next-auth/jwt"

// export async function middleware(req) {
//   const { pathname } = req.nextUrl
//   console.log('🔥 Middleware running for:', pathname)
  
//   const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
//   console.log('🔑 Token exists:', !!token)

//   // Redirect authenticated users away from login/register pages
//   if ((pathname === "/login" || pathname === "/register") && token) {
//     console.log('↩️ Redirecting authenticated user away from auth pages')
//     return NextResponse.redirect(new URL("/", req.url))
//   }

//   // Allow access to login/register for unauthenticated users
//   if (pathname === "/login" || pathname === "/register") {
//     console.log('✅ Allowing access to auth pages')
//     return NextResponse.next()
//   }

//   // Require authentication for all other pages
//   if (!token) {
//     console.log('🚫 No token, redirecting to login')
//     return NextResponse.redirect(new URL("/login", req.url))
//   }

//   // Check admin access for admin routes
//   if (pathname.startsWith("/admin") && token.role !== "instructor") {
//     console.log('⛔ Non-admin trying to access admin route')
//     return NextResponse.redirect(new URL("/", req.url))
//   }

//   // Public routes are accessible to all
//   if (pathname.startsWith("/",) || pathname.startsWith("/course",) || pathname.startsWith("/course/:id",) || pathname.startsWith("/about") || pathname.startsWith("/contact") || pathname.startsWith("/privacy") || pathname.startsWith("/terms") || pathname.startsWith("/blog") || pathname.startsWith("/blog/") || pathname.startsWith("/blog/") || pathname.startsWith("/search") || pathname.startsWith("/search/")) {
//     console.log('✅ Allowing access to public route')
//     return NextResponse.next()
//   }

//   console.log('✅ Allowing access to protected route')
//   return NextResponse.next()
// }

// export const config = {
//   matcher: [
//     /*
//      * Match all request paths except for the ones starting with:
//      * - api (API routes)
//      * - _next/static (static files)
//      * - _next/image (image optimization files)
//      * - favicon.ico (favicon file)
//      */
//     '/((?!api|_next/static|_next/image|favicon.ico).*)',
//   ],
// }


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
  if (pathname.startsWith("/admin") && !token.permissions.includes("admin")) {
    console.log('⛔ Non-admin trying to access admin route')
    return NextResponse.redirect(new URL("/", req.url))
  }

  // Public routes are accessible to all
  if (!pathname.startsWith("/api") && !pathname.startsWith("/admin") && !pathname.startsWith("/login")) {
    console.log('✅ Allowing access to public route')
    return NextResponse.next()
  }

  // Catch-all for unknown routes
  console.log('🚫 Unknown route, returning 404')
  return NextResponse.rewrite(new URL("/404", req.url))
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