import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

/**
 * 🔧 FIX RELEASED ACCESS CODES
 * 
 * This API does the following:
 * 1. Finds all access codes that were incorrectly released and marks them as invalidated
 * 2. Migrates old codes (created with auto-generated IDs) to use the code as document ID
 * 3. Reports all fixes made
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
    const { getFirestore, collection, getDocs, doc, updateDoc, setDoc, deleteDoc, serverTimestamp } = await import('firebase/firestore');

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

    // Get all access codes
    const accessCodesSnapshot = await getDocs(collection(db, 'accessCodes'));
    
    const fixedCodes: string[] = [];
    const migratedCodes: string[] = [];
    const invalidatedCodes: string[] = [];
    const alreadyCorrect: string[] = [];
    const errors: { code: string; error: string }[] = [];

    for (const accessCodeDoc of accessCodesSnapshot.docs) {
      const data = accessCodeDoc.data();
      const docId = accessCodeDoc.id;
      const actualCode = data.code;

      try {
        // Case 1: Document ID doesn't match the code field - needs migration
        if (actualCode && docId !== actualCode) {
          console.log(`🔄 Migrating code: ${actualCode} (old docId: ${docId})`);
          
          // Create new document with code as ID
          await setDoc(doc(db, 'accessCodes', actualCode), {
            ...data,
            _migratedFrom: docId,
            _migratedAt: serverTimestamp(),
            _migratedBy: session.user.email,
          });
          
          // Delete old document
          await deleteDoc(doc(db, 'accessCodes', docId));
          
          migratedCodes.push(actualCode);
          continue;
        }

        // Case 2: Code was released (has releasedAt/releasedReason) - needs invalidation
        if (data.releasedAt || data.releasedReason || data.releasedBy) {
          if (data.invalidated !== true) {
            await updateDoc(doc(db, 'accessCodes', docId), {
              isUsed: true,
              invalidated: true,
              invalidatedAt: serverTimestamp(),
              invalidatedReason: data.releasedReason || 'Fixed: Code was incorrectly released',
              invalidatedBy: session.user.email,
              _fixedAt: serverTimestamp(),
              _fixReason: 'Migrated from released to invalidated state',
            });
            
            invalidatedCodes.push(docId);
          } else {
            alreadyCorrect.push(docId);
          }
          continue;
        }

        // Case 3: Code is correct - no action needed
        alreadyCorrect.push(docId);

      } catch (err) {
        errors.push({ 
          code: docId, 
          error: err instanceof Error ? err.message : 'Unknown error' 
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Access codes fix completed',
      summary: {
        totalCodesScanned: accessCodesSnapshot.size,
        codesMigrated: migratedCodes.length,
        codesInvalidated: invalidatedCodes.length,
        alreadyCorrect: alreadyCorrect.length,
        errors: errors.length,
      },
      details: {
        migratedCodes,
        invalidatedCodes,
        alreadyCorrect: alreadyCorrect.slice(0, 10), // Only show first 10
        errors,
      }
    });

  } catch (error) {
    console.error('Fix released codes error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fix released codes',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Fix Released Access Codes API',
    description: 'Fixes all access code issues: migrates old codes to correct format and invalidates released codes',
    usage: 'POST /api/fix-released-codes (requires admin auth)',
    fixes: [
      '1. Migrates codes with auto-generated IDs to use the code as document ID',
      '2. Invalidates codes that were incorrectly released when users were deleted'
    ]
  });
}
