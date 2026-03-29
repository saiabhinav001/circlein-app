import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const role = (session.user as any).role;
    if (role !== 'admin' && role !== 'super_admin') {
      return NextResponse.json({ error: 'Admin privileges required' }, { status: 403 });
    }

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