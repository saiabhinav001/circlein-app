import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

/**
 * 🔧 CLEANUP ACCESS CODES API
 * 
 * This API:
 * 1. Finds all duplicate access code documents (same code value, different doc IDs)
 * 2. Merges them into a single document with code as ID
 * 3. Deletes orphaned/invalid documents
 * 4. Reports what was cleaned up
 */

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 403 }
      );
    }

    const { initializeApp, getApps } = await import('firebase/app');
    const { 
      getFirestore, 
      collection, 
      getDocs, 
      doc, 
      setDoc, 
      deleteDoc,
      serverTimestamp 
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

    // Get all access codes
    const accessCodesSnapshot = await getDocs(collection(db, 'accessCodes'));
    
    // Group by code value
    const codeMap: { [code: string]: { docId: string; data: any }[] } = {};
    
    for (const codeDoc of accessCodesSnapshot.docs) {
      const data = codeDoc.data();
      const codeValue = data.code || codeDoc.id;
      
      if (!codeMap[codeValue]) {
        codeMap[codeValue] = [];
      }
      codeMap[codeValue].push({ docId: codeDoc.id, data });
    }
    
    const results = {
      totalScanned: accessCodesSnapshot.size,
      duplicatesFound: 0,
      documentsMerged: 0,
      documentsDeleted: 0,
      cleanedCodes: [] as string[],
      errors: [] as { code: string; error: string }[],
    };
    
    // Process each code
    for (const [codeValue, docs] of Object.entries(codeMap)) {
      try {
        if (docs.length > 1) {
          // Found duplicates!
          results.duplicatesFound++;
          console.log(`🔍 Found ${docs.length} documents for code: ${codeValue}`);
          
          // Find the most complete data (prefer one with usedBy set)
          let bestData = docs[0].data;
          let bestDocId = docs[0].docId;
          
          for (const d of docs) {
            if (d.data.usedBy && !bestData.usedBy) {
              bestData = d.data;
              bestDocId = d.docId;
            }
            // Merge all relevant fields
            if (d.data.isUsed) bestData.isUsed = true;
            if (d.data.usedBy) bestData.usedBy = d.data.usedBy;
            if (d.data.usedAt) bestData.usedAt = d.data.usedAt;
            if (d.data.communityId) bestData.communityId = d.data.communityId;
            if (d.data.invalidated) bestData.invalidated = d.data.invalidated;
          }
          
          // Create/update the canonical document with code as ID
          await setDoc(doc(db, 'accessCodes', codeValue), {
            ...bestData,
            code: codeValue,
            _cleanedAt: serverTimestamp(),
            _cleanedBy: session.user.email,
            _mergedFrom: docs.map(d => d.docId),
          });
          results.documentsMerged++;
          
          // Delete all other documents
          for (const d of docs) {
            if (d.docId !== codeValue) {
              await deleteDoc(doc(db, 'accessCodes', d.docId));
              results.documentsDeleted++;
              console.log(`🗑️ Deleted duplicate document: ${d.docId}`);
            }
          }
          
          results.cleanedCodes.push(codeValue);
        } else if (docs.length === 1 && docs[0].docId !== codeValue) {
          // Single document but ID doesn't match code - migrate it
          const d = docs[0];
          
          await setDoc(doc(db, 'accessCodes', codeValue), {
            ...d.data,
            code: codeValue,
            _migratedAt: serverTimestamp(),
            _migratedFrom: d.docId,
          });
          
          await deleteDoc(doc(db, 'accessCodes', d.docId));
          results.documentsMerged++;
          results.documentsDeleted++;
          results.cleanedCodes.push(codeValue);
          console.log(`🔄 Migrated code ${codeValue} from doc ID ${d.docId}`);
        }
      } catch (err) {
        results.errors.push({
          code: codeValue,
          error: err instanceof Error ? err.message : 'Unknown error'
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Access codes cleanup completed',
      results
    });

  } catch (error) {
    console.error('Cleanup access codes error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to cleanup access codes',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Cleanup Access Codes API',
    description: 'Finds and fixes duplicate/mismatched access code documents',
    usage: 'POST /api/cleanup-access-codes (requires admin auth)',
    actions: [
      '1. Finds duplicate documents for the same code',
      '2. Merges data and keeps single document with code as ID',
      '3. Migrates documents where ID doesn\'t match code value',
      '4. Reports all changes made'
    ]
  });
}
