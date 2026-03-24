import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { adminDb } from '@/lib/firebase-admin';

export const dynamic = 'force-dynamic';

export async function POST(): Promise<NextResponse> {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const communityId = (session.user as any).communityId;
    if (!communityId) {
      return NextResponse.json({ error: 'Community ID missing' }, { status: 400 });
    }

    const now = new Date();

    // Query by community and status, then filter deadline in memory to avoid composite-index dependency.
    const snapshot = await adminDb
      .collection('polls')
      .where('communityId', '==', communityId)
      .where('status', '==', 'open')
      .get();

    const expired = snapshot.docs.filter((docSnapshot) => {
      const data = docSnapshot.data() as any;
      const deadline = data.deadline?.toDate ? data.deadline.toDate() : new Date(data.deadline);
      return deadline instanceof Date && !Number.isNaN(deadline.getTime()) && deadline <= now;
    });

    for (let i = 0; i < expired.length; i += 450) {
      const chunk = expired.slice(i, i + 450);
      const batch = adminDb.batch();
      chunk.forEach((docSnapshot) => {
        batch.update(docSnapshot.ref, {
          status: 'closed',
          closedAt: now,
          updatedAt: now,
        });
      });
      await batch.commit();
    }

    return NextResponse.json({ success: true, closed: expired.length });
  } catch (error: any) {
    console.error('Failed to close expired polls:', error);
    return NextResponse.json(
      { error: 'Failed to close expired polls', details: error?.message || 'Unknown error' },
      { status: 500 }
    );
  }
}
