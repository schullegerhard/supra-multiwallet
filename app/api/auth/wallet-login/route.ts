import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';

export const runtime = 'edge';

export async function POST(request: Request) {
  try {
    // Get the token from the request body
    const { token } = await request.json();
    
    if (!token) {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 });
    }
    
    // Verify the token (optional but recommended for security)
    const verified = await verifyToken(token);
    if (!verified) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
    
    // Create response and set the secure HttpOnly cookie
    const response = NextResponse.json({ success: true });
    
    response.cookies.set({
      name: 'authToken',
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24, // 24 hours
      path: '/'
    });
    
    return response;
  } catch (error) {
    console.error('Error setting auth cookie:', error);
    return NextResponse.json({ error: 'Failed to set auth cookie' }, { status: 500 });
  }
}