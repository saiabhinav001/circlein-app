import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getToken } from 'next-auth/jwt';

export async function GET(request: NextRequest) {
  try {
    // Get the session
    const session = await getServerSession(authOptions);
    
    // Get the raw JWT token
    const token = await getToken({ 
      req: request as any,
      secret: process.env.NEXTAUTH_SECRET 
    });

    return NextResponse.json({
      session: session,
      rawToken: token,
      diagnosis: {
        hasSession: !!session,
        hasToken: !!token,
        tokenHasCommunityId: !!(token?.communityId),
        sessionHasCommunityId: !!((session?.user as any)?.communityId),
        tokenCommunityId: token?.communityId || 'MISSING',
        tokenRole: token?.role || 'MISSING',
        tokenEmail: token?.email || 'MISSING'
      }
    }, { status: 200 });

  } catch (error: any) {
    console.error('Check Token Error:', error);
    return NextResponse.json({ 
      error: error.message 
    }, { status: 500 });
  }
}
