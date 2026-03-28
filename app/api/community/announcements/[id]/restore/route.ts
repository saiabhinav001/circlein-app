import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { adminDb } from '@/lib/firebase-admin';

export const dynamic = 'force-dynamic';

export async function POST(_request: Request, props: { params: Promise<{ id: string }> }): Promise<NextResponse> {
  const params = await props.params;
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const role = (session.user as any).role;
    const communityId = (session.user as any).communityId;

    if (role !== 'admin' && role !== 'super_admin') {
      return NextResponse.json({ error: 'Admin privileges required' }, { status: 403 });
    }

    if (!communityId) {
      return NextResponse.json({ error: 'Community ID missing' }, { status: 400 });
    }

    const announcementRef = adminDb.collection('announcements').doc(params.id);
    const announcementDoc = await announcementRef.get();

    if (!announcementDoc.exists) {
      return NextResponse.json({ error: 'Announcement not found' }, { status: 404 });
    }

    const announcement = announcementDoc.data() as any;
    if (announcement.communityId !== communityId) {
      return NextResponse.json({ error: 'Cross-community access denied' }, { status: 403 });
    }

    await announcementRef.update({
      deletedAt: null,
      deletedBy: null,
      restoredAt: new Date(),
      restoredBy: session.user.email,
      updatedAt: new Date(),
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Failed to restore announcement:', error);
    return NextResponse.json(
      { error: 'Failed to restore announcement', details: error?.message || 'Unknown error' },
      { status: 500 }
    );
  }
}
