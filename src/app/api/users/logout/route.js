import { NextResponse } from 'next/server';

export async function POST(request) {
  const response = NextResponse.json({ message: "Logout Success" });

  // Clear the 'token' cookie by setting it to empty and expiring it
  response.cookies.set('token', '', {
    httpOnly: true,
    path: '/',
    maxAge: 0, // expires immediately
  });

  return response;
}
