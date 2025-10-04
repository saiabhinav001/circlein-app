import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { adminAuth } from '@/lib/firebase-admin';

export const dynamic = 'force-dynamic';

/**
 * API route to generate Firebase custom tokens
 * This allows NextAuth authenticated users to also authenticate with Firebase
 * so that Firestore security rules work correctly
 */
export async function POST(request: Request) {
  try {
    // Get NextAuth session
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const userEmail = session.user.email;
    
    console.log('🔐 Generating Firebase custom token for:', userEmail);

    // Generate custom token using Firebase Admin SDK
    // Use email as UID since that's how we identify users
    const customToken = await adminAuth.createCustomToken(userEmail, {
      email: userEmail,
      name: session.user.name || '',
      role: (session.user as any).role || 'resident',
      communityId: (session.user as any).communityId || null,
    });

    console.log('✅ Firebase custom token generated successfully');

    return NextResponse.json({ token: customToken });
  } catch (error: any) {
    console.error('❌ Error generating Firebase custom token:', error);
    return NextResponse.json(
      { error: 'Failed to generate token', details: error.message },
      { status: 500 }
    );
  }
}
