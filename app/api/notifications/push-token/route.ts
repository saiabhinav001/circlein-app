import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { adminDb } from '@/lib/firebase-admin';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { token } = await request.json();
    if (!token || typeof token !== 'string') {
      return NextResponse.json({ error: 'Invalid token' }, { status: 400 });
    }

    const userEmail = String(session.user.email);
    const userRef = adminDb.collection('users').doc(userEmail);
    const userSnap = await userRef.get();

    const prevTokens = (userSnap.data()?.pushTokens || []) as string[];
    const mergedTokens = Array.from(new Set([...prevTokens, token]));

    await userRef.set(
      {
        email: userEmail,
        pushTokens: mergedTokens,
        pushPermission: 'granted',
        pushUpdatedAt: new Date().toISOString(),
      },
      { merge: true }
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to register push token', details: error?.message || 'Unknown error' },
      { status: 500 }
    );
  }
}
