import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';

export async function POST(request: NextRequest) {
  try {
    const { code, communityId = 'sunny-meadows' } = await request.json();
    
    if (!code) {
      return NextResponse.json({ error: 'Access code is required' }, { status: 400 });
    }

    // Create access code
    await setDoc(doc(db, 'accessCodes', code), {
      communityId: communityId,
      isUsed: false,
      createdAt: serverTimestamp(),
      type: 'resident'
    });

    return NextResponse.json({
      success: true,
      message: `Access code ${code} created successfully`,
      code: code,
      communityId: communityId
    });
  } catch (error) {
    console.error('Error creating access code:', error);
    return NextResponse.json({
      error: 'Failed to create access code',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}