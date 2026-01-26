import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

/**
 * DELETE USER API
 * 
 * 1. Gets user's accessCodeUsed field
 * 2. DELETES that access code document immediately
 * 3. Generates new access code
 * 4. DELETES user document
 */

function generateAccessCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { initializeApp, getApps } = await import('firebase/app');
    const { 
      getFirestore, doc, getDoc, setDoc, deleteDoc, 
      collection, getDocs, serverTimestamp 
    } = await import('firebase/firestore');

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

    // Get user document
    const userRef = doc(db, 'users', email);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (email === session.user.email) {
      return NextResponse.json({ error: 'Cannot delete yourself' }, { status: 400 });
    }

    const userData = userDoc.data();
    const communityId = userData.communityId;
    const accessCodeUsed = userData.accessCodeUsed;
    
    console.log('🗑️ Deleting user:', email);
    console.log('📝 Access code used:', accessCodeUsed);
    
    // STEP 1: DELETE the access code FIRST
    let deletedAccessCode: string | null = null;
    
    if (accessCodeUsed) {
      // Direct delete using stored access code ID
      const codeRef = doc(db, 'accessCodes', accessCodeUsed);
      const codeDoc = await getDoc(codeRef);
      
      if (codeDoc.exists()) {
        await deleteDoc(codeRef);
        deletedAccessCode = accessCodeUsed;
        console.log('✅ Access code DELETED:', accessCodeUsed);
      }
    }
    
    // Also scan ALL access codes for any with usedBy = email (catch any missed)
    const allCodesSnapshot = await getDocs(collection(db, 'accessCodes'));
    for (const codeDoc of allCodesSnapshot.docs) {
      const data = codeDoc.data();
      if (data.usedBy === email) {
        await deleteDoc(doc(db, 'accessCodes', codeDoc.id));
        console.log('✅ Additional access code DELETED:', codeDoc.id);
        if (!deletedAccessCode) deletedAccessCode = codeDoc.id;
      }
    }
    
    // STEP 2: Generate NEW access code
    let newAccessCode: string | null = null;
    if (communityId) {
      let attempts = 0;
      do {
        newAccessCode = generateAccessCode();
        attempts++;
        const existing = await getDoc(doc(db, 'accessCodes', newAccessCode));
        if (!existing.exists()) break;
        newAccessCode = null;
      } while (attempts < 100);
      
      if (newAccessCode) {
        await setDoc(doc(db, 'accessCodes', newAccessCode), {
          code: newAccessCode,
          communityId: communityId,
          isUsed: false,
          usedBy: null,
          createdAt: serverTimestamp(),
          createdBy: session.user.email,
        });
        console.log('✅ New access code created:', newAccessCode);
      }
    }
    
    // STEP 3: DELETE user document
    await deleteDoc(userRef);
    console.log('✅ User DELETED:', email);

    return NextResponse.json({
      success: true,
      message: 'User and access code deleted',
      deletedAccessCode,
      newAccessCode,
    });

  } catch (error) {
    console.error('Delete error:', error);
    return NextResponse.json({
      error: 'Failed to delete user',
      details: error instanceof Error ? error.message : 'Unknown'
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Delete User API',
    usage: 'POST { email, reason }',
  });
}
