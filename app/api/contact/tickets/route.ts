import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { adminDb } from '@/lib/firebase-admin';
import { checkRateLimit, getClientIP } from '@/lib/rate-limiter';
import { sendEmail } from '@/lib/email-service';
import { SupportTicketCreateSchema } from '@/lib/schemas';
import {
  SUPPORT_PRIORITY_SLA_HOURS,
  computeSupportDueAt,
  getSupportPriorityRank,
  getSupportStatusRank,
  inferSupportPriority,
} from '@/lib/support-ticket';

export const dynamic = 'force-dynamic';

function toIsoDate(value: unknown): string | null {
  if (!value) {
    return null;
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (typeof (value as { toDate?: () => Date }).toDate === 'function') {
    return (value as { toDate: () => Date }).toDate().toISOString();
  }

  const parsed = new Date(String(value));
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function mapTicket(docSnapshot: FirebaseFirestore.QueryDocumentSnapshot<FirebaseFirestore.DocumentData>) {
  const data = docSnapshot.data() as Record<string, unknown>;

  return {
    id: docSnapshot.id,
    subject: String(data.subject || ''),
    message: String(data.message || ''),
    category: String(data.category || 'general'),
    status: String(data.status || 'open'),
    priority: String(data.priority || 'normal'),
    slaTargetHours: Number(data.slaTargetHours || 48),
    communityId: String(data.communityId || ''),
    userEmail: String(data.userEmail || ''),
    userName: String(data.userName || ''),
    assignedTo: data.assignedTo ? String(data.assignedTo) : null,
    createdAt: toIsoDate(data.createdAt),
    updatedAt: toIsoDate(data.updatedAt),
    dueAt: toIsoDate(data.dueAt),
    firstResponseAt: toIsoDate(data.firstResponseAt),
    escalatedAt: toIsoDate(data.escalatedAt),
    resolvedAt: toIsoDate(data.resolvedAt),
    closedAt: toIsoDate(data.closedAt),
    isEscalated: Boolean(data.escalatedAt),
    history: Array.isArray(data.history) ? data.history : [],
  };
}

function toSortTime(value: string | null): number {
  return value ? new Date(value).getTime() : Number.POSITIVE_INFINITY;
}

function compareAdminQueue(a: ReturnType<typeof mapTicket>, b: ReturnType<typeof mapTicket>): number {
  const statusDelta = getSupportStatusRank(a.status) - getSupportStatusRank(b.status);
  if (statusDelta !== 0) {
    return statusDelta;
  }

  const priorityDelta = getSupportPriorityRank(b.priority) - getSupportPriorityRank(a.priority);
  if (priorityDelta !== 0) {
    return priorityDelta;
  }

  const dueDelta = toSortTime(a.dueAt) - toSortTime(b.dueAt);
  if (dueDelta !== 0) {
    return dueDelta;
  }

  return toSortTime(a.createdAt) - toSortTime(b.createdAt);
}

function buildSupportTicketEmailHtml(params: {
  ticketReference: string;
  subject: string;
  message: string;
  category: string;
  priority: string;
  dueAt: string;
  userName: string;
  userEmail: string;
  communityId: string;
}): string {
  const safeSubject = escapeHtml(params.subject);
  const safeMessage = escapeHtml(params.message).replace(/\n/g, '<br>');
  const safeCategory = escapeHtml(params.category);
  const safePriority = escapeHtml(params.priority.toUpperCase());
  const safeDueAt = escapeHtml(params.dueAt);
  const safeName = escapeHtml(params.userName);
  const safeEmail = escapeHtml(params.userEmail);
  const safeCommunity = escapeHtml(params.communityId);

  return `
    <div style="font-family: Arial, sans-serif; max-width: 640px; margin: 0 auto; color: #111827;">
      <h2 style="margin-bottom: 8px;">New Support Ticket</h2>
      <p style="margin-top: 0; color: #6b7280;">Ticket ${escapeHtml(params.ticketReference)}</p>
      <div style="border: 1px solid #e5e7eb; border-radius: 10px; padding: 16px; background: #f9fafb;">
        <p><strong>Subject:</strong> ${safeSubject}</p>
        <p><strong>Category:</strong> ${safeCategory}</p>
        <p><strong>Priority:</strong> ${safePriority}</p>
        <p><strong>SLA Due:</strong> ${safeDueAt}</p>
        <p><strong>From:</strong> ${safeName} (${safeEmail})</p>
        <p><strong>Community:</strong> ${safeCommunity}</p>
      </div>
      <div style="margin-top: 16px; border: 1px solid #e5e7eb; border-radius: 10px; padding: 16px;">
        <p style="margin-top: 0;"><strong>Message</strong></p>
        <p style="white-space: normal; line-height: 1.6;">${safeMessage}</p>
      </div>
    </div>
  `;
}

export async function GET(): Promise<NextResponse> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const communityId = (session.user as any).communityId;
    if (!communityId) {
      return NextResponse.json({ error: 'Community ID missing' }, { status: 400 });
    }

    const role = (session.user as any).role;
    const isAdmin = role === 'admin' || role === 'super_admin';

    const snapshot = isAdmin
      ? await adminDb.collection('supportTickets').where('communityId', '==', communityId).get()
      : await adminDb
          .collection('supportTickets')
          .where('communityId', '==', communityId)
          .where('userEmail', '==', session.user.email)
          .get();

    const mappedTickets = snapshot.docs.map((docSnapshot) => mapTicket(docSnapshot));

    const tickets = isAdmin
      ? mappedTickets.sort(compareAdminQueue)
      : mappedTickets.sort((a, b) => {
          const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return bTime - aTime;
        });

    return NextResponse.json({ success: true, tickets });
  } catch (error: any) {
    console.error('Failed to fetch support tickets:', error);
    return NextResponse.json(
      { error: 'Failed to fetch support tickets', details: error?.message || 'Unknown error' },
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

    if (process.env.NODE_ENV !== 'development') {
      const ip = getClientIP(request);
      const rateLimit = await checkRateLimit(adminDb, `${ip}_${session.user.email}_support_ticket`, {
        maxRequests: 6,
        windowSeconds: 600,
      });

      if (!rateLimit.allowed) {
        return NextResponse.json(
          { error: 'Too many support requests. Please wait before submitting another ticket.' },
          { status: 429, headers: { 'Retry-After': String(rateLimit.retryAfterSeconds) } }
        );
      }
    }

    const rawBody = await request.json().catch(() => null);
    const parsedBody = SupportTicketCreateSchema.safeParse(rawBody);

    if (!parsedBody.success) {
      return NextResponse.json(
        { error: 'Invalid support ticket payload', details: parsedBody.error.issues },
        { status: 400 }
      );
    }

    const subject = parsedBody.data.subject.trim();
    const message = parsedBody.data.message.trim();
    const category = parsedBody.data.category || 'general';
    const now = new Date();
    const priority = inferSupportPriority({ subject, message, category });
    const slaTargetHours = SUPPORT_PRIORITY_SLA_HOURS[priority];
    const dueAt = computeSupportDueAt(now, priority);

    const ticketRef = adminDb.collection('supportTickets').doc();
    const ticketReference = ticketRef.id.substring(0, 8).toUpperCase();

    await ticketRef.set({
      subject,
      message,
      category,
      status: 'open',
      priority,
      slaTargetHours,
      communityId,
      userEmail: session.user.email,
      userName: session.user.name || session.user.email,
      assignedTo: null,
      createdAt: now,
      updatedAt: now,
      dueAt,
      firstResponseAt: null,
      escalatedAt: null,
      resolvedAt: null,
      closedAt: null,
      history: [
        {
          id: `evt_${Date.now()}`,
          status: 'open',
          note: `Ticket submitted (priority: ${priority})`,
          updatedBy: session.user.email,
          updatedByName: session.user.name || session.user.email,
          assignedTo: null,
          priority,
          timestamp: now,
        },
      ],
    });

    await adminDb.collection('notifications').add({
      userEmail: session.user.email,
      communityId,
      type: 'community',
      priority: priority === 'urgent' || priority === 'high' ? 'important' : 'normal',
      title: `Support ticket created: ${subject}`,
      message: `Ticket ${ticketReference} is now open. We will update you soon.`,
      read: false,
      actionUrl: '/contact',
      source: 'support_ticket',
      createdAt: now,
    });

    const supportInbox = process.env.SUPPORT_EMAIL || process.env.EMAIL_USER;
    if (supportInbox && supportInbox.includes('@')) {
      const emailResult = await sendEmail(
        {
          to: supportInbox,
          subject: `[CircleIn Support ${ticketReference}] ${subject}`,
          html: buildSupportTicketEmailHtml({
            ticketReference,
            subject,
            message,
            category,
            priority,
            dueAt: dueAt.toISOString(),
            userName: session.user.name || session.user.email,
            userEmail: session.user.email,
            communityId,
          }),
        },
        1
      );

      if (!emailResult.success) {
        console.error('Support ticket email delivery failed:', emailResult.error);
      }
    }

    return NextResponse.json({
      success: true,
      ticket: {
        id: ticketRef.id,
        reference: ticketReference,
        subject,
        category,
        status: 'open',
        priority,
        slaTargetHours,
        dueAt: dueAt.toISOString(),
        createdAt: now.toISOString(),
      },
    });
  } catch (error: any) {
    console.error('Failed to create support ticket:', error);
    return NextResponse.json(
      { error: 'Failed to create support ticket', details: error?.message || 'Unknown error' },
      { status: 500 }
    );
  }
}
