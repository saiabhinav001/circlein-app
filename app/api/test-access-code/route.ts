import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

export async function POST(request: NextRequest) {
  try {
    const { accessCode } = await request.json();
    
    if (!accessCode) {
      return NextResponse.json({ error: 'Access code required' }, { status: 400 });
    }

    console.log('Testing access code:', accessCode);

    // Validate access code and get communityId
    const accessCodeDoc = await getDoc(doc(db, 'accessCodes', accessCode));
    
    console.log('Access code doc exists:', accessCodeDoc.exists());
    
    if (!accessCodeDoc.exists()) {
      return NextResponse.json({ 
        error: 'Access code not found',
        code: accessCode,
        exists: false
      }, { status: 404 });
    }

    const data = accessCodeDoc.data();
    console.log('Access code data:', data);

    if (data.isUsed) {
      return NextResponse.json({ 
        error: 'Access code already used',
        code: accessCode,
        data: data
      }, { status: 400 });
    }

    const communityId = data.communityId;

    if (!communityId) {
      return NextResponse.json({ 
        error: 'Access code does not have a valid community assignment',
        code: accessCode,
        data: data
      }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: 'Access code is valid',
      code: accessCode,
      communityId: communityId,
      data: data
    });

  } catch (error) {
    console.error('Error testing access code:', error);
    return NextResponse.json({
      error: 'Failed to test access code',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}