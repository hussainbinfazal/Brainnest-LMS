import { NextResponse } from 'next/server';
import { clerkMiddleware } from '@clerk/nextjs/server';
import jwt from 'jsonwebtoken';

const decodeToken = (token) => {
  try {
    if (!process.env.JWT_SECRET) {
      // console.warn("JWT_SECRET not set!");
      return null;
    }
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    // console.error("JWT verification failed:", err.message);
    return null;
  }
};

function customMiddleware(request, auth) {
  const path = request.nextUrl.pathname;
  const token = request.cookies.get('token')?.value;
  const decodedToken = token ? decodeToken(token) : null;

  const isClerkUser = auth?.userId;
  const isJwtUser = !!decodedToken;

  const isAuthenticated = isClerkUser || isJwtUser;

  const publicPaths = ['/', '/login', '/register', '/courses', '/courses/view','/verifyemail'];
  const isPublicPath = publicPaths.some(p => path === p || path.startsWith(`${p}/`));

  // ✅ Authenticated users visiting login/register → redirect home
  if ((path === '/login' || path === '/register') && isAuthenticated) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // ✅ Unauthenticated user accessing private path → redirect login
  if (!isPublicPath && !isAuthenticated) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // ✅ Role-based check
  const role = isClerkUser
    ? auth.session?.user?.publicMetadata?.role
    : decodedToken?.role;

  if ((path.startsWith('/instructor') || path.startsWith('/courses/create')) && role !== 'INSTRUCTOR') {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

// ✅ Combine Clerk middleware with custom logic
export default clerkMiddleware({
  publicRoutes: ['/', '/login', '/register', '/courses/:path*'],
  afterAuth(auth, request) {
    return customMiddleware(request, auth);
  },
});

export const config = {
  matcher: [
    '/', 
    '/login', 
    '/register',
    '/users/:path*',
    '/courses/:path*',
    '/courses/create',
    '/profile/:path*',
    '/instructor/:path*',
    '/verifyemail',
  ],
};
