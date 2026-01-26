import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

/**
 * 🔧 FIX RELEASED ACCESS CODES
 * 
 * This API finds all access codes that were incorrectly released when users
 * were deleted and marks them as invalidated instead.
 * 
 * Access codes with `releasedAt` or `releasedReason` fields are the ones
 * that were released during user deletion - these need to be invalidated.
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
    const { getFirestore, collection, getDocs, doc, updateDoc, serverTimestamp } = await import('firebase/firestore');

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
    const alreadyInvalidated: string[] = [];
    const errors: { code: string; error: string }[] = [];

    for (const accessCodeDoc of accessCodesSnapshot.docs) {
      const data = accessCodeDoc.data();
      const codeId = accessCodeDoc.id;

      // Find codes that were released (have releasedAt or releasedReason)
      // These are codes that should have been invalidated, not released
      if (data.releasedAt || data.releasedReason || data.releasedBy) {
        
        // Skip if already invalidated
        if (data.invalidated === true) {
          alreadyInvalidated.push(codeId);
          continue;
        }

        try {
          // Fix: Mark as used AND invalidated
          await updateDoc(doc(db, 'accessCodes', codeId), {
            isUsed: true,
            invalidated: true,
            invalidatedAt: serverTimestamp(),
            invalidatedReason: data.releasedReason || 'Fixed: Code was incorrectly released',
            invalidatedBy: session.user.email,
            // Keep the release info for audit trail
            _fixedAt: serverTimestamp(),
            _fixedBy: session.user.email,
            _fixReason: 'Migrated from released to invalidated state',
          });
          
          fixedCodes.push(codeId);
          console.log(`✅ Fixed access code: ${codeId}`);
        } catch (err) {
          errors.push({ 
            code: codeId, 
            error: err instanceof Error ? err.message : 'Unknown error' 
          });
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Access codes fix completed',
      summary: {
        totalCodesScanned: accessCodesSnapshot.size,
        codesFixed: fixedCodes.length,
        alreadyInvalidated: alreadyInvalidated.length,
        errors: errors.length,
      },
      details: {
        fixedCodes,
        alreadyInvalidated,
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
    description: 'Finds all access codes that were incorrectly released and marks them as invalidated',
    usage: 'POST /api/fix-released-codes (requires admin auth)',
    note: 'This is a one-time fix for codes that were released when users were deleted'
  });
}
