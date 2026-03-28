import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { adminDb } from '@/lib/firebase-admin';

export const dynamic = 'force-dynamic';

type ValidationResult =
  | {
      ok: false;
      error: NextResponse;
    }
  | {
      ok: true;
      session: any;
      communityId: string;
      announcementRef: FirebaseFirestore.DocumentReference;
      announcement: any;
    };

async function validateAdminAndAnnouncement(id: string): Promise<ValidationResult> {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return { ok: false, error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  }

  const role = (session.user as any).role;
  const communityId = (session.user as any).communityId;

  if (role !== 'admin' && role !== 'super_admin') {
    return { ok: false, error: NextResponse.json({ error: 'Admin privileges required' }, { status: 403 }) };
  }

  if (!communityId) {
    return { ok: false, error: NextResponse.json({ error: 'Community ID missing' }, { status: 400 }) };
  }

  const announcementRef = adminDb.collection('announcements').doc(id);
  const announcementDoc = await announcementRef.get();

  if (!announcementDoc.exists) {
    return { ok: false, error: NextResponse.json({ error: 'Announcement not found' }, { status: 404 }) };
  }

  const announcement = announcementDoc.data() as any;
  if (announcement.communityId !== communityId) {
    return { ok: false, error: NextResponse.json({ error: 'Cross-community access denied' }, { status: 403 }) };
  }

  return {
    ok: true,
    session,
    communityId,
    announcementRef,
    announcement,
  };
}

export async function PATCH(request: Request, props: { params: Promise<{ id: string }> }): Promise<NextResponse> {
  const params = await props.params;
  try {
    const validated = await validateAdminAndAnnouncement(params.id);
    if (!validated.ok) {
      return validated.error;
    }

    const body = await request.json().catch(() => ({}));
    const title = String(body?.title || '').trim();
    const content = String(body?.body || '').trim();

    if (!title || !content) {
      return NextResponse.json({ error: 'Title and body are required' }, { status: 400 });
    }

    await validated.announcementRef.update({
      title,
      body: content,
      updatedAt: new Date(),
      editedBy: validated.session?.user?.email || 'admin',
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Failed to update announcement:', error);
    return NextResponse.json(
      { error: 'Failed to update announcement', details: error?.message || 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function DELETE(_request: Request, props: { params: Promise<{ id: string }> }): Promise<NextResponse> {
  const params = await props.params;
  try {
    const validated = await validateAdminAndAnnouncement(params.id);
    if (!validated.ok) {
      return validated.error;
    }

    await validated.announcementRef.update({
      deletedAt: new Date(),
      deletedBy: validated.session?.user?.email || 'admin',
      updatedAt: new Date(),
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Failed to delete announcement:', error);
    return NextResponse.json(
      { error: 'Failed to delete announcement', details: error?.message || 'Unknown error' },
      { status: 500 }
    );
  }
}
