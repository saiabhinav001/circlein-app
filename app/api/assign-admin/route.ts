import { NextRequest, NextResponse } from 'next/server';

// Admin assignment API - for development use only
export async function POST(request: NextRequest) {
  try {
    // Import Firebase client SDK
    const { initializeApp, getApps } = await import('firebase/app');
    const { getFirestore, doc, setDoc, serverTimestamp } = await import('firebase/firestore');

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

    const { email, communityId = 'sunny-meadows', role = 'admin' } = await request.json();
    
    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // Check if user already exists to preserve data
    const { getDoc } = await import('firebase/firestore');
    const existingUserDoc = await getDoc(doc(db, 'users', email));
    const existingData = existingUserDoc.exists() ? existingUserDoc.data() : {};

    // Update user document with communityId and admin role
    const userDoc = {
      email: email,
      communityId: communityId,
      role: role,
      name: existingData.name || email.split('@')[0], // Preserve existing name
      authProvider: existingData.authProvider || 'google',
      profileCompleted: true, // CRITICAL: Ensure profile is marked as complete
      createdAt: existingData.createdAt || serverTimestamp(),
      updatedAt: serverTimestamp(),
      lastLogin: serverTimestamp(),
    };

    await setDoc(doc(db, 'users', email), userDoc, { merge: true });

    // Create admin invite record
    const inviteDoc = {
      email: email,
      communityId: communityId,
      role: role,
      status: 'accepted',
      invitedBy: 'system',
      createdAt: serverTimestamp(),
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 year
    };

    await setDoc(doc(db, 'invites', `admin-${email.replace('@', '-at-').replace('.', '-dot-')}`), inviteDoc);

    return NextResponse.json({
      success: true,
      message: 'Admin assigned successfully!',
      data: {
        email: email,
        communityId: communityId,
        role: role,
        instructions: [
          '1. Sign out of the application',
          '2. Sign back in with your Google account',
          '3. You should now have admin access to the ' + communityId + ' community'
        ]
      }
    });

  } catch (error) {
    console.error('Admin assignment error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to assign admin role',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Admin Assignment API',
    usage: 'POST with { "email": "your@email.com", "communityId": "sunny-meadows", "role": "admin" }',
    example: {
      email: 'abhinav.sadineni@gmail.com',
      communityId: 'sunny-meadows',
      role: 'admin'
    }
  });
}