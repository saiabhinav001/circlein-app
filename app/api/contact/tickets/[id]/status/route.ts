import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { adminDb } from '@/lib/firebase-admin';
import { sendEmail } from '@/lib/email-service';
import { SupportTicketStatusUpdateSchema } from '@/lib/schemas';

const STATUS_LABELS: Record<string, string> = {
  open: 'Open',
  in_progress: 'In Progress',
  resolved: 'Resolved',
  closed: 'Closed',
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function buildTicketUpdateEmailHtml(params: {
  subject: string;
  status: string;
  note: string;
  updatedByName: string;
  ticketReference: string;
}): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 640px; margin: 0 auto; color: #111827;">
      <h2 style="margin-bottom: 8px;">Support Ticket Update</h2>
      <p style="margin-top: 0; color: #6b7280;">Ticket ${escapeHtml(params.ticketReference)}</p>
      <div style="border: 1px solid #e5e7eb; border-radius: 10px; padding: 16px; background: #f9fafb;">
        <p><strong>Subject:</strong> ${escapeHtml(params.subject)}</p>
        <p><strong>Status:</strong> ${escapeHtml(params.status)}</p>
        <p><strong>Updated by:</strong> ${escapeHtml(params.updatedByName)}</p>
      </div>
      ${
        params.note
          ? `<div style="margin-top: 16px; border: 1px solid #e5e7eb; border-radius: 10px; padding: 16px;"><p style="margin-top: 0;"><strong>Note</strong></p><p style="line-height: 1.6;">${escapeHtml(params.note)}</p></div>`
          : ''
      }
    </div>
  `;
}

export async function PATCH(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const params = await props.params;

  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const role = (session.user as any).role;
    if (role !== 'admin' && role !== 'super_admin') {
      return NextResponse.json({ error: 'Admin privileges required' }, { status: 403 });
    }

    const communityId = (session.user as any).communityId;
    if (!communityId) {
      return NextResponse.json({ error: 'Community ID missing' }, { status: 400 });
    }

    const rawBody = await request.json().catch(() => null);
    const parsedBody = SupportTicketStatusUpdateSchema.safeParse(rawBody);
    if (!parsedBody.success) {
      return NextResponse.json(
        { error: 'Invalid status update payload', details: parsedBody.error.issues },
        { status: 400 }
      );
    }

    const nextStatus = parsedBody.data.status;
    const updateNote = (parsedBody.data.updateNote || '').trim();
    const assignedToRaw = parsedBody.data.assignedTo;

    const ticketRef = adminDb.collection('supportTickets').doc(params.id);
    const ticketDoc = await ticketRef.get();

    if (!ticketDoc.exists) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
    }

    const ticketData = ticketDoc.data() as any;
    if (ticketData.communityId !== communityId) {
      return NextResponse.json({ error: 'Cross-community access denied' }, { status: 403 });
    }

    const now = new Date();
    const existingHistory = Array.isArray(ticketData.history) ? ticketData.history : [];
    const nextAssignedTo =
      assignedToRaw === ''
        ? null
        : assignedToRaw || ticketData.assignedTo || session.user.email;

    await ticketRef.update({
      status: nextStatus,
      assignedTo: nextAssignedTo,
      updateNote,
      updatedAt: now,
      resolvedAt:
        nextStatus === 'resolved' || nextStatus === 'closed'
          ? now
          : ticketData.resolvedAt || null,
      closedAt: nextStatus === 'closed' ? now : ticketData.closedAt || null,
      history: [
        ...existingHistory,
        {
          id: `evt_${Date.now()}`,
          status: nextStatus,
          note: updateNote || `Status changed to ${STATUS_LABELS[nextStatus] || nextStatus}`,
          updatedBy: session.user.email,
          updatedByName: session.user.name || session.user.email,
          assignedTo: nextAssignedTo,
          timestamp: now,
        },
      ],
    });

    await adminDb.collection('notifications').add({
      userEmail: ticketData.userEmail,
      communityId,
      type: 'community',
      priority: nextStatus === 'resolved' || nextStatus === 'closed' ? 'normal' : 'important',
      title: `Support update: ${ticketData.subject || 'Support ticket'}`,
      message: `Status changed to ${STATUS_LABELS[nextStatus] || nextStatus}.`,
      read: false,
      actionUrl: '/contact',
      source: 'support_ticket_status',
      createdAt: now,
    });

    const recipientEmail = String(ticketData.userEmail || '').trim();
    if (recipientEmail.includes('@')) {
      const ticketReference = params.id.substring(0, 8).toUpperCase();
      const emailResult = await sendEmail(
        {
          to: recipientEmail,
          subject: `Support ticket ${ticketReference}: ${STATUS_LABELS[nextStatus] || nextStatus}`,
          html: buildTicketUpdateEmailHtml({
            subject: String(ticketData.subject || 'Support ticket'),
            status: STATUS_LABELS[nextStatus] || nextStatus,
            note: updateNote,
            updatedByName: session.user.name || session.user.email,
            ticketReference,
          }),
        },
        1
      );

      if (!emailResult.success) {
        console.error('Support ticket status email failed:', emailResult.error);
      }
    }

    return NextResponse.json({
      success: true,
      ticket: {
        id: params.id,
        status: nextStatus,
        assignedTo: nextAssignedTo,
        updatedAt: now.toISOString(),
      },
    });
  } catch (error: any) {
    console.error('Failed to update support ticket status:', error);
    return NextResponse.json(
      { error: 'Failed to update support ticket status', details: error?.message || 'Unknown error' },
      { status: 500 }
    );
  }
}
