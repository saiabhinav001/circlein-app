import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { adminDb } from '@/lib/firebase-admin';
import { emailTemplates, sendEmail } from '@/lib/email-service';

export const dynamic = 'force-dynamic';

const STATUS_LABELS: Record<string, string> = {
  new: 'New',
  in_progress: 'In Progress',
  resolved: 'Resolved',
  closed: 'Closed',
};

export async function PATCH(request: NextRequest, props: { params: Promise<{ id: string }> }): Promise<NextResponse> {
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

    const body = await request.json();
    const status = String(body?.status || '').trim();
    const assignedTo = String(body?.assignedTo || session.user.email).trim();
    const updateNote = String(body?.updateNote || '').trim();

    if (!['new', 'in_progress', 'resolved', 'closed'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    const requestRef = adminDb.collection('maintenanceRequests').doc(params.id);
    const requestDoc = await requestRef.get();

    if (!requestDoc.exists) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 });
    }

    const requestData = requestDoc.data() as any;

    if (requestData.communityId !== communityId) {
      return NextResponse.json({ error: 'Cross-community access denied' }, { status: 403 });
    }

    const now = new Date();
    const existingHistory = Array.isArray(requestData.history) ? requestData.history : [];
    const nextAssignedTo = assignedTo || requestData.assignedTo || null;

    await requestRef.update({
      status,
      assignedTo: nextAssignedTo,
      updateNote,
      updatedAt: now,
      resolvedAt: status === 'resolved' || status === 'closed' ? now : requestData.resolvedAt || null,
      closedAt: status === 'closed' ? now : requestData.closedAt || null,
      history: [
        ...existingHistory,
        {
          id: `evt_${Date.now()}`,
          status,
          note: updateNote || `Status changed to ${STATUS_LABELS[status] || status}`,
          updatedBy: session.user.email,
          updatedByName: session.user.name || session.user.email,
          assignedTo: nextAssignedTo,
          timestamp: now,
        },
      ],
    });

    const notificationRef = adminDb.collection('notifications').doc();
    await notificationRef.set({
      userEmail: requestData.userId,
      communityId,
      type: 'community',
      priority: status === 'resolved' ? 'normal' : 'important',
      title: `Maintenance update: ${requestData.title}`,
      message: `Status changed to ${STATUS_LABELS[status] || status}.`,
      read: false,
      actionUrl: '/maintenance',
      source: 'maintenance_status',
      createdAt: now,
    });

    try {
      if (requestData.userId) {
        const template = emailTemplates.maintenanceStatusUpdate({
          userName: requestData.userName || 'Resident',
          requestTitle: requestData.title || 'Maintenance request',
          status: STATUS_LABELS[status] || status,
          updateNote,
          category: requestData.category,
          priority: requestData.priority,
        });

        await sendEmail({
          to: requestData.userId,
          subject: template.subject,
          html: template.html,
        });
      }
    } catch (emailError) {
      console.error('Maintenance status email failed:', emailError);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Failed to update maintenance status:', error);
    return NextResponse.json(
      { error: 'Failed to update maintenance status', details: error?.message || 'Unknown error' },
      { status: 500 }
    );
  }
}
