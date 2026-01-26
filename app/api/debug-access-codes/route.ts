import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

/**
 * DEBUG ACCESS CODES - See actual database state
 * Call this to understand why old codes are still working
 */

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { initializeApp, getApps } = await import('firebase/app');
    const { getFirestore, collection, getDocs } = await import('firebase/firestore');

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

    // Get ALL access codes
    const codesSnapshot = await getDocs(collection(db, 'accessCodes'));
    const accessCodes = codesSnapshot.docs.map(doc => ({
      docId: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || doc.data().createdAt,
      usedAt: doc.data().usedAt?.toDate?.()?.toISOString() || doc.data().usedAt,
    }));

    // Get ALL users
    const usersSnapshot = await getDocs(collection(db, 'users'));
    const users = usersSnapshot.docs.map(doc => ({
      email: doc.id,
      role: doc.data().role,
      communityId: doc.data().communityId,
      accessCodeUsed: doc.data().accessCodeUsed || 'NOT_SET',
      deleted: doc.data().deleted,
      createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || doc.data().createdAt,
    }));

    // Find problems
    const problems: string[] = [];
    
    // Check for codes with mismatched docId and code field
    accessCodes.forEach(code => {
      if (code.code && code.docId !== code.code) {
        problems.push(`Code "${code.code}" has mismatched docId "${code.docId}" - Auth fallback required`);
      }
    });
    
    // Check for used codes without usedBy
    accessCodes.forEach(code => {
      if (code.isUsed && !code.usedBy) {
        problems.push(`Code "${code.docId}" marked used but has no usedBy field`);
      }
    });
    
    // Check for users without accessCodeUsed
    users.filter(u => u.role === 'resident').forEach(user => {
      if (user.accessCodeUsed === 'NOT_SET') {
        problems.push(`User "${user.email}" has no accessCodeUsed field`);
      }
    });

    return NextResponse.json({
      accessCodes: {
        total: accessCodes.length,
        used: accessCodes.filter(c => c.isUsed).length,
        unused: accessCodes.filter(c => !c.isUsed).length,
        invalidated: accessCodes.filter(c => c.invalidated).length,
        list: accessCodes,
      },
      users: {
        total: users.length,
        admins: users.filter(u => u.role === 'admin').length,
        residents: users.filter(u => u.role === 'resident').length,
        list: users,
      },
      problems,
    });

  } catch (error) {
    console.error('Debug error:', error);
    return NextResponse.json({
      error: 'Failed to debug',
      details: error instanceof Error ? error.message : 'Unknown'
    }, { status: 500 });
  }
}
