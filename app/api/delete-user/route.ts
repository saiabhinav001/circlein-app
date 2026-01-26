import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

/**
 * 🔥 DELETE USER API
 * Properly deletes a user by marking as deleted, NOT removing the document
 * This prevents deleted users from signing in again
 */

export async function POST(request: NextRequest) {
  try {
    // Check if user is admin
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 403 }
      );
    }

    const { initializeApp, getApps } = await import('firebase/app');
    const { getFirestore, doc, updateDoc, serverTimestamp, getDoc } = await import('firebase/firestore');

    const firebaseConfig = {
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    };

    const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
    const db = getFirestore(app);

    const { email, reason } = await request.json();
    
    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // Check if user exists
    const userDoc = await getDoc(doc(db, 'users', email));
    
    if (!userDoc.exists()) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Prevent admin from deleting themselves
    if (email === session.user.email) {
      return NextResponse.json({ error: 'Cannot delete your own account' }, { status: 400 });
    }

    const userData = userDoc.data();
    const userCommunityId = userData.communityId;

    // Mark user as deleted (DO NOT remove document)
    await updateDoc(doc(db, 'users', email), {
      deleted: true,
      status: 'deleted',
      deletedAt: serverTimestamp(),
      deletedBy: session.user.email,
      deletionReason: reason || 'No reason provided',
      // Keep all original data for audit trail
    });

    console.log('✅ User marked as deleted:', email);

    // IMPORTANT: DO NOT release the access code - INVALIDATE it instead
    // This prevents the deleted user from re-registering with the same code
    // Admin should generate a NEW code if they want to add someone else
    const { collection, query, where, getDocs } = await import('firebase/firestore');
    const accessCodesQuery = query(
      collection(db, 'accessCodes'),
      where('usedBy', '==', email),
      where('isUsed', '==', true)
    );
    
    const accessCodeSnapshot = await getDocs(accessCodesQuery);
    
    if (!accessCodeSnapshot.empty) {
      // Mark access code as INVALIDATED (not released)
      // The code stays marked as used but is also invalidated
      for (const accessCodeDoc of accessCodeSnapshot.docs) {
        await updateDoc(doc(db, 'accessCodes', accessCodeDoc.id), {
          isUsed: true, // Keep as used
          invalidated: true, // Mark as invalidated
          invalidatedAt: serverTimestamp(),
          invalidatedReason: `User ${email} was deleted`,
          invalidatedBy: session.user.email,
        });
        console.log('✅ Access code invalidated (not released):', accessCodeDoc.id);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'User deleted successfully',
      data: {
        email: email,
        deletedAt: new Date().toISOString(),
        deletedBy: session.user.email,
        note: 'User marked as deleted. They will be signed out and cannot sign in again unless restored.'
      }
    });

  } catch (error) {
    console.error('Delete user error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to delete user',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Delete User API',
    usage: 'POST with { "email": "user@example.com", "reason": "Optional reason" }',
    security: 'Requires admin authentication',
    behavior: 'Marks user as deleted. User will be signed out and cannot sign in again.',
    note: 'User document is NOT removed - only marked as deleted for audit trail.'
  });
}
