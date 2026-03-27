import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { adminDb } from '@/lib/firebase-admin';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const role = String((session.user as any)?.role || '').toLowerCase();
    if (role !== 'admin' && role !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const communityId = String((session.user as any)?.communityId || '').trim();
    if (!communityId) {
      return NextResponse.json({ error: 'Community ID missing' }, { status: 400 });
    }

    const statusFilter = String(request.nextUrl.searchParams.get('status') || 'requested').trim().toLowerCase();
    const validStatuses = new Set(['requested', 'approved', 'rejected', 'all']);
    if (!validStatuses.has(statusFilter)) {
      return NextResponse.json({ error: 'Invalid status filter' }, { status: 400 });
    }

    let queryRef = adminDb.collection('accountDeletionRequests').where('communityId', '==', communityId);
    if (statusFilter !== 'all') {
      queryRef = queryRef.where('status', '==', statusFilter);
    }

    const snapshot = await queryRef.get();
    const requests = snapshot.docs
      .map((docSnapshot) => ({ id: docSnapshot.id, ...docSnapshot.data() }))
      .sort((a: any, b: any) => {
        const aTs = new Date(a.requestedAt || 0).getTime();
        const bTs = new Date(b.requestedAt || 0).getTime();
        return bTs - aTs;
      });

    return NextResponse.json({ success: true, requests });
  } catch (error: any) {
    console.error('Failed to fetch deletion requests:', error);
    return NextResponse.json(
      { error: 'Failed to fetch deletion requests', details: error?.message || 'Unknown error' },
      { status: 500 }
    );
  }
}
