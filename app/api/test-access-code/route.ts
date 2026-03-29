import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

export async function POST(request: NextRequest) {
  // Development only - block in production
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Test endpoint disabled in production' }, { status: 403 });
  }

  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const role = (session.user as any).role;
  if (role !== 'admin' && role !== 'super_admin') {
    return NextResponse.json({ error: 'Admin privileges required' }, { status: 403 });
  }

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