import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { adminDb } from '@/lib/firebase-admin';

export const dynamic = 'force-dynamic';

export async function GET(): Promise<NextResponse> {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const role = (session.user as any).role;
    const communityId = (session.user as any).communityId;

    if (!communityId) {
      return NextResponse.json({ error: 'Community ID missing' }, { status: 400 });
    }

    let requestQuery = adminDb
      .collection('maintenanceRequests')
      .where('communityId', '==', communityId);

    if (role !== 'admin' && role !== 'super_admin') {
      requestQuery = adminDb
        .collection('maintenanceRequests')
        .where('communityId', '==', communityId)
        .where('userId', '==', session.user.email);
    }

    const snapshot = await requestQuery.get();
    const requests = snapshot.docs
      .map((docSnapshot) => ({
        id: docSnapshot.id,
        ...docSnapshot.data(),
      }))
      .sort((a: any, b: any) => {
        const aTime = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : new Date(a.createdAt || 0).getTime();
        const bTime = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : new Date(b.createdAt || 0).getTime();
        return bTime - aTime;
      });

    return NextResponse.json({ success: true, requests });
  } catch (error: any) {
    console.error('Failed to fetch maintenance requests:', error);
    return NextResponse.json(
      { error: 'Failed to fetch maintenance requests', details: error?.message || 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const communityId = (session.user as any).communityId;

    if (!communityId) {
      return NextResponse.json({ error: 'Community ID missing' }, { status: 400 });
    }

    const body = await request.json();
    const title = String(body?.title || '').trim();
    const description = String(body?.description || '').trim();
    const category = String(body?.category || 'general').trim();
    const priority = String(body?.priority || 'medium').trim();
    const location = String(body?.location || '').trim();
    const imageUrls = Array.isArray(body?.imageUrls)
      ? body.imageUrls.map((url: unknown) => String(url || '').trim()).filter(Boolean)
      : [];

    if (!title || !description) {
      return NextResponse.json({ error: 'Title and description are required' }, { status: 400 });
    }

    if (!['low', 'medium', 'high', 'urgent'].includes(priority)) {
      return NextResponse.json({ error: 'Invalid priority' }, { status: 400 });
    }

    const now = new Date();

    const requestRef = await adminDb.collection('maintenanceRequests').add({
      title,
      description,
      category,
      location,
      priority,
      status: 'new',
      imageUrls,
      communityId,
      userId: session.user.email,
      userName: session.user.name || session.user.email,
      assignedTo: null,
      history: [
        {
          id: `evt_${Date.now()}`,
          status: 'new',
          note: 'Request submitted',
          updatedBy: session.user.email,
          updatedByName: session.user.name || session.user.email,
          assignedTo: null,
          timestamp: now,
        },
      ],
      createdAt: now,
      updatedAt: now,
      resolvedAt: null,
      closedAt: null,
    });

    const notificationRef = adminDb.collection('notifications').doc();
    await notificationRef.set({
      userEmail: session.user.email,
      communityId,
      type: 'community',
      priority: priority === 'urgent' ? 'urgent' : 'important',
      title: `Maintenance request submitted: ${title}`,
      message: 'Your request has been created and sent to administrators.',
      read: false,
      actionUrl: '/maintenance',
      source: 'maintenance_request',
      createdAt: now,
    });

    return NextResponse.json({ success: true, requestId: requestRef.id });
  } catch (error: any) {
    console.error('Failed to create maintenance request:', error);
    return NextResponse.json(
      { error: 'Failed to create maintenance request', details: error?.message || 'Unknown error' },
      { status: 500 }
    );
  }
}
