import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';

export const runtime = 'edge';

export async function GET() {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get('authToken')?.value;
    
    if (!token) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }
    
    const verified = await verifyToken(token);
    if (!verified) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }
    
    return NextResponse.json({ 
      authenticated: true,
      address: verified.address
    });
  } catch (error) {
    console.error('Auth check error:', error);
    return NextResponse.json({ authenticated: false }, { status: 500 });
  }
} 