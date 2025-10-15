import { NextResponse } from 'next/server';
import { createNonce } from '@/lib/auth';

export const runtime = 'edge';

export async function GET() {
  try {
    // Generate a cryptographically signed, time-based nonce
    // No server-side storage required - validation happens via signature + timestamp
    const nonce = await createNonce();
    
    return new NextResponse(nonce, {
      headers: {
        'Content-Type': 'text/plain',
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      }
    });
  } catch (error) {
    console.error('Nonce generation error:', error);
    return new NextResponse('Failed to generate nonce', { 
      status: 500,
      headers: {
        'Content-Type': 'text/plain'
      }
    });
  }
} 