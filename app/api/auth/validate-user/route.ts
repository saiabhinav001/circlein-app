import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { adminDb } from '@/lib/firebase-admin';

/**
 * GET /api/auth/validate-user
 * 
 * Validates if the current user still exists in the database.
 * Used to immediately detect if a user has been deleted and force logout.
 * 
 * Returns:
 * - 200: User exists and is valid
 * - 401: User doesn't exist (deleted) or no session
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { exists: false, error: 'No session found' },
        { status: 401 }
      );
    }

    // Check if user document exists in Firestore
    const userDoc = await adminDb.collection('users').doc(session.user.email).get();
    
    if (!userDoc.exists) {
      console.log(`❌ User ${session.user.email} no longer exists in database - account was deleted`);
      return NextResponse.json(
        { exists: false, error: 'User account no longer exists', deleted: true },
        { status: 401 }
      );
    }

    // User exists and is valid
    return NextResponse.json({
      exists: true,
      user: {
        email: session.user.email,
        role: session.user.role,
        communityId: session.user.communityId
      }
    });

  } catch (error) {
    console.error('Error validating user:', error);
    return NextResponse.json(
      { exists: false, error: 'Validation error' },
      { status: 500 }
    );
  }
}
