import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

/**
 * DELETE USER API - BULLETPROOF VERSION
 * 
 * 1. Find ALL access codes where usedBy === user's email
 * 2. DELETE every single one of them
 * 3. Generate NEW access code for the community
 * 4. DELETE user document
 * 
 * The old access code will be GONE. User CANNOT reuse it.
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
    
    console.log('🗑️ === DELETING USER ===');
    console.log('📧 Email:', email);
    console.log('🏘️ Community:', communityId);
    
    // ============================================
    // STEP 1: FIND AND DELETE ALL ACCESS CODES
    // ============================================
    const deletedCodes: string[] = [];
    
    // Get ALL access codes from database
    const allCodesSnapshot = await getDocs(collection(db, 'accessCodes'));
    console.log('📊 Total access codes in DB:', allCodesSnapshot.size);
    
    // Find and delete EVERY code associated with this user
    for (const codeDoc of allCodesSnapshot.docs) {
      const codeData = codeDoc.data();
      const codeId = codeDoc.id;
      
      // Check if this code was used by this user
      if (codeData.usedBy === email) {
        console.log('🎯 Found code used by user:', codeId, '- DELETING');
        await deleteDoc(doc(db, 'accessCodes', codeId));
        deletedCodes.push(codeId);
      }
    }
    
    // Also check if user has accessCodeUsed field and delete that too
    if (userData.accessCodeUsed && !deletedCodes.includes(userData.accessCodeUsed)) {
      const codeRef = doc(db, 'accessCodes', userData.accessCodeUsed);
      const codeExists = await getDoc(codeRef);
      if (codeExists.exists()) {
        console.log('🎯 Found code in user record:', userData.accessCodeUsed, '- DELETING');
        await deleteDoc(codeRef);
        deletedCodes.push(userData.accessCodeUsed);
      }
    }
    
    console.log('✅ Total codes DELETED:', deletedCodes.length, deletedCodes);
    
    // ============================================
    // STEP 2: GENERATE NEW ACCESS CODE
    // ============================================
    let newAccessCode: string | null = null;
    
    if (communityId) {
      // Generate unique code
      let attempts = 0;
      while (attempts < 100) {
        const candidate = generateAccessCode();
        const existing = await getDoc(doc(db, 'accessCodes', candidate));
        if (!existing.exists()) {
          newAccessCode = candidate;
          break;
        }
        attempts++;
      }
      
      if (newAccessCode) {
        // Create new access code with code as document ID
        await setDoc(doc(db, 'accessCodes', newAccessCode), {
          code: newAccessCode,
          communityId: communityId,
          isUsed: false,
          usedBy: null,
          createdAt: serverTimestamp(),
          createdBy: session.user.email,
          replacedCode: deletedCodes[0] || null,
          reason: reason || 'User deleted',
        });
        console.log('✅ NEW access code created:', newAccessCode);
      }
    }
    
    // ============================================
    // STEP 3: DELETE USER DOCUMENT
    // ============================================
    await deleteDoc(userRef);
    console.log('✅ User document DELETED:', email);
    
    console.log('🗑️ === DELETION COMPLETE ===');

    return NextResponse.json({
      success: true,
      message: `User deleted. ${deletedCodes.length} access code(s) removed. New code generated.`,
      deletedUser: email,
      deletedAccessCodes: deletedCodes,
      newAccessCode: newAccessCode,
      communityId: communityId,
    });

  } catch (error) {
    console.error('💥 Delete error:', error);
    return NextResponse.json({
      error: 'Failed to delete user',
      details: error instanceof Error ? error.message : 'Unknown'
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Delete User API - Deletes user AND their access code',
    usage: 'POST { email, reason }',
  });
}
