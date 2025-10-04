import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, getDoc, collection, getDocs } from 'firebase/firestore';

// Mark this route as dynamic
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    
    if (code) {
      // Check specific access code
      const accessCodeDoc = await getDoc(doc(db, 'accessCodes', code));
      
      if (accessCodeDoc.exists()) {
        return NextResponse.json({
          exists: true,
          data: accessCodeDoc.data(),
          code: code
        });
      } else {
        return NextResponse.json({
          exists: false,
          code: code,
          message: 'Access code not found'
        });
      }
    } else {
      // List all access codes
      const snapshot = await getDocs(collection(db, 'accessCodes'));
      const accessCodes: any[] = [];
      
      snapshot.forEach(doc => {
        accessCodes.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      return NextResponse.json({
        total: accessCodes.length,
        codes: accessCodes
      });
    }
  } catch (error) {
    console.error('Error checking access code:', error);
    return NextResponse.json({
      error: 'Failed to check access code',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}