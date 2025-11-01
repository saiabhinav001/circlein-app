import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

/**
 * 🔄 RESTORE USER API
 * Restores a deleted user account
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

    const { email } = await request.json();
    
    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // Check if user exists
    const userDoc = await getDoc(doc(db, 'users', email));
    
    if (!userDoc.exists()) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const userData = userDoc.data();

    if (!userData.deleted) {
      return NextResponse.json({ error: 'User is not deleted' }, { status: 400 });
    }

    // Restore user account
    await updateDoc(doc(db, 'users', email), {
      deleted: false,
      status: 'active',
      restoredAt: serverTimestamp(),
      restoredBy: session.user.email,
      // Keep deletion history for audit trail
    });

    console.log('✅ User restored:', email);

    return NextResponse.json({
      success: true,
      message: 'User restored successfully',
      data: {
        email: email,
        restoredAt: new Date().toISOString(),
        restoredBy: session.user.email,
        note: 'User can now sign in again with their credentials.'
      }
    });

  } catch (error) {
    console.error('Restore user error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to restore user',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Restore User API',
    usage: 'POST with { "email": "user@example.com" }',
    security: 'Requires admin authentication',
    behavior: 'Restores a deleted user account. User can sign in again.'
  });
}
