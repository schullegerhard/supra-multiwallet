import { NextResponse } from 'next/server';

export const runtime = 'edge';

export async function POST() {
  const response = NextResponse.json({ success: true });
  
  // Clear the HttpOnly cookie by setting an expired date
  response.cookies.set({
    name: 'authToken',
    value: '',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0, // Expire immediately
    path: '/'
  });
  
  return response;
}