import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

/**
 * FIX USERS - Update all user documents to store their accessCodeUsed field
 * This fixes users created before the accessCodeUsed fix was added
 */

export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { initializeApp, getApps } = await import('firebase/app');
    const { 
      getFirestore, doc, getDoc, setDoc, 
      collection, getDocs, query, where 
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

    const results: any[] = [];
    
    // Get all users
    const usersSnapshot = await getDocs(collection(db, 'users'));
    
    for (const userDoc of usersSnapshot.docs) {
      const userData = userDoc.data();
      const email = userDoc.id;
      
      // Skip if user already has accessCodeUsed
      if (userData.accessCodeUsed) {
        results.push({ email, status: 'already_has_field', accessCodeUsed: userData.accessCodeUsed });
        continue;
      }
      
      // Skip admin users
      if (userData.role === 'admin') {
        results.push({ email, status: 'admin_skipped' });
        continue;
      }
      
      // Find access code used by this user
      const codesQuery = query(
        collection(db, 'accessCodes'),
        where('usedBy', '==', email)
      );
      const codesSnapshot = await getDocs(codesQuery);
      
      if (!codesSnapshot.empty) {
        const codeDoc = codesSnapshot.docs[0];
        const codeId = codeDoc.id;
        
        // Update user with accessCodeUsed
        await setDoc(doc(db, 'users', email), {
          accessCodeUsed: codeId
        }, { merge: true });
        
        results.push({ 
          email, 
          status: 'updated', 
          accessCodeUsed: codeId 
        });
      } else {
        results.push({ email, status: 'no_access_code_found' });
      }
    }

    return NextResponse.json({
      success: true,
      message: 'User accessCodeUsed fields updated',
      results,
      summary: {
        total: results.length,
        updated: results.filter(r => r.status === 'updated').length,
        alreadyHasField: results.filter(r => r.status === 'already_has_field').length,
        noCodeFound: results.filter(r => r.status === 'no_access_code_found').length,
        adminsSkipped: results.filter(r => r.status === 'admin_skipped').length,
      }
    });

  } catch (error) {
    console.error('Fix users error:', error);
    return NextResponse.json({
      error: 'Failed to fix users',
      details: error instanceof Error ? error.message : 'Unknown'
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Fix Users API - Updates accessCodeUsed field for existing users',
    usage: 'POST to this endpoint to run the migration',
  });
}
