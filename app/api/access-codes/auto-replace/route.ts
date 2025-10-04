import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/firebase';
import { doc, deleteDoc, setDoc, serverTimestamp } from 'firebase/firestore';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { usedCodeId } = await request.json();

    if (!usedCodeId) {
      return NextResponse.json({ error: 'Used code ID is required' }, { status: 400 });
    }

    // Delete the used access code
    const usedCodeRef = doc(db, 'accessCodes', usedCodeId);
    await deleteDoc(usedCodeRef);

    // Generate a new access code
    const newCode = Math.random().toString(36).substr(2, 8).toUpperCase();
    
    await setDoc(doc(db, 'accessCodes', newCode), {
      communityId: session.user.communityId,
      isUsed: false,
      createdAt: serverTimestamp(),
      type: 'resident',
      description: `Auto-generated replacement for used code`
    });

    return NextResponse.json({ 
      success: true, 
      newCode,
      message: 'Used code deleted and new code generated successfully'
    });

  } catch (error) {
    console.error('Error in auto-replace access code:', error);
    return NextResponse.json(
      { error: 'Failed to replace access code' },
      { status: 500 }
    );
  }
}