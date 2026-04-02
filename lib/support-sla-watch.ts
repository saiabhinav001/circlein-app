import { adminDb } from '@/lib/firebase-admin';
import {
  computeSupportDueAt,
  getSupportAutoEscalationPriority,
  getSupportSlaState,
  normalizeSupportPriority,
  normalizeSupportStatus,
  toDateValue,
} from '@/lib/support-ticket';

export type SupportSlaWatchReason = 'overdue' | 'at_risk';

type SourceKind = 'cron' | 'admin_manual';

type RunCommunitySummary = {
  communityId: string;
  scanned: number;
  escalated: number;
  notificationsCreated: number;
  skippedNoDueAt: number;
  byReason: Record<SupportSlaWatchReason, number>;
};

export interface SupportSlaWatchRunOptions {
  dryRun?: boolean;
  communityId?: string;
  source: SourceKind;
  triggeredBy?: string;
}

export interface SupportSlaWatchRunResult {
  dryRun: boolean;
  scanned: number;
  escalated: number;
  notificationsCreated: number;
  skipped: {
    noDueAt: number;
    noCommunityId: number;
  };
  byReason: Record<SupportSlaWatchReason, number>;
  escalatedTicketIds: string[];
  communities: RunCommunitySummary[];
  generatedAt: string;
}

const ACTIVE_SUPPORT_STATUSES = ['open', 'in_progress'];

function createEmptySummary(communityId: string): RunCommunitySummary {
  return {
    communityId,
    scanned: 0,
    escalated: 0,
    notificationsCreated: 0,
    skippedNoDueAt: 0,
    byReason: {
      overdue: 0,
      at_risk: 0,
    },
  };
}

function buildEscalationNote(params: {
  reason: SupportSlaWatchReason;
  fromPriority: string;
  toPriority: string;
  previousDueAt: Date;
  nextDueAt: Date;
}): string {
  const reasonLabel = params.reason === 'overdue' ? 'SLA overdue' : 'SLA at risk';
  return [
    '[auto-sla-watch]',
    `${reasonLabel}: escalated priority ${params.fromPriority} -> ${params.toPriority}.`,
    `Due moved ${params.previousDueAt.toISOString()} -> ${params.nextDueAt.toISOString()}.`,
  ].join(' ');
}

async function getCommunityAdminEmails(
  cache: Map<string, string[]>,
  communityId: string
): Promise<string[]> {
  const cached = cache.get(communityId);
  if (cached) {
    return cached;
  }

  const snapshot = await adminDb
    .collection('users')
    .where('communityId', '==', communityId)
    .get();

  const adminEmails = Array.from(
    new Set(
      snapshot.docs
        .map((docSnapshot) => docSnapshot.data() as Record<string, unknown>)
        .filter((user) => {
          const role = String(user.role || '').toLowerCase();
          return role === 'admin' || role === 'super_admin';
        })
        .map((user) => String(user.email || '').trim())
        .filter((email) => email.includes('@'))
    )
  );

  if (!adminEmails.length) {
    const fallback = String(process.env.SUPPORT_EMAIL || process.env.EMAIL_USER || '').trim();
    if (fallback.includes('@')) {
      adminEmails.push(fallback);
    }
  }

  cache.set(communityId, adminEmails);
  return adminEmails;
}

async function persistRunSummary(params: {
  summary: RunCommunitySummary;
  now: Date;
  dryRun: boolean;
  source: SourceKind;
  triggeredBy?: string;
}): Promise<void> {
  const runRef = adminDb
    .collection('automationRuns')
    .doc(`${params.summary.communityId}_support_sla_watch`);

  await runRef.set(
    {
      workflow: 'support_sla_watch',
      communityId: params.summary.communityId,
      source: params.source,
      triggeredBy: params.triggeredBy || null,
      dryRun: params.dryRun,
      runAt: params.now,
      scannedTickets: params.summary.scanned,
      escalatedTickets: params.summary.escalated,
      notificationsCreated: params.summary.notificationsCreated,
      skippedNoDueAt: params.summary.skippedNoDueAt,
      byReason: params.summary.byReason,
      updatedAt: params.now,
    },
    { merge: true }
  );
}

export async function runSupportSlaWatch(
  options: SupportSlaWatchRunOptions
): Promise<SupportSlaWatchRunResult> {
  const dryRun = options.dryRun === true;
  const now = new Date();

  let requestQuery: FirebaseFirestore.Query = adminDb
    .collection('supportTickets')
    .where('status', 'in', ACTIVE_SUPPORT_STATUSES);

  if (options.communityId) {
    requestQuery = requestQuery.where('communityId', '==', options.communityId);
  }

  const snapshot = await requestQuery.get();

  let escalated = 0;
  let notificationsCreated = 0;
  let skippedNoDueAt = 0;
  let skippedNoCommunity = 0;

  const byReason: Record<SupportSlaWatchReason, number> = {
    overdue: 0,
    at_risk: 0,
  };

  const escalatedTicketIds: string[] = [];
  const adminEmailCache = new Map<string, string[]>();
  const communitySummaries = new Map<string, RunCommunitySummary>();

  for (const docSnapshot of snapshot.docs) {
    const data = docSnapshot.data() as Record<string, unknown>;
    const communityId = String(data.communityId || '').trim();

    if (!communityId) {
      skippedNoCommunity += 1;
      continue;
    }

    const summary =
      communitySummaries.get(communityId) || createEmptySummary(communityId);
    summary.scanned += 1;
    communitySummaries.set(communityId, summary);

    const dueAt = toDateValue(data.dueAt);
    if (!dueAt) {
      skippedNoDueAt += 1;
      summary.skippedNoDueAt += 1;
      continue;
    }

    const status = normalizeSupportStatus(data.status);
    const currentPriority = normalizeSupportPriority(data.priority);
    const slaState = getSupportSlaState({ dueAt, status, now });
    const nextPriority = getSupportAutoEscalationPriority({
      priority: currentPriority,
      slaState,
    });

    if (!nextPriority || nextPriority === currentPriority) {
      continue;
    }

    const reason: SupportSlaWatchReason =
      slaState === 'overdue' ? 'overdue' : 'at_risk';
    const nextStatus = status === 'open' ? 'in_progress' : status;
    const nextDueAt = computeSupportDueAt(now, nextPriority);
    const note = buildEscalationNote({
      reason,
      fromPriority: currentPriority,
      toPriority: nextPriority,
      previousDueAt: dueAt,
      nextDueAt,
    });
    const existingHistory = Array.isArray(data.history) ? data.history : [];

    if (!dryRun) {
      await docSnapshot.ref.update({
        status: nextStatus,
        priority: nextPriority,
        dueAt: nextDueAt,
        escalatedAt: now,
        autoEscalatedAt: now,
        autoEscalationReason: reason,
        updateNote: note,
        updatedAt: now,
        history: [
          ...existingHistory,
          {
            id: `evt_${Date.now()}_${docSnapshot.id}`,
            status: nextStatus,
            note,
            updatedBy:
              options.triggeredBy ||
              (options.source === 'cron'
                ? 'system:cron-support-sla-watch'
                : 'system:admin-support-sla-watch'),
            updatedByName:
              options.source === 'cron'
                ? 'SLA Watch Automation'
                : 'SLA Watch Manual Trigger',
            assignedTo: data.assignedTo || null,
            priority: nextPriority,
            escalated: true,
            source:
              options.source === 'cron'
                ? 'cron_support_sla_watch'
                : 'admin_support_sla_watch',
            timestamp: now,
          },
        ],
      });

      const adminEmails = await getCommunityAdminEmails(adminEmailCache, communityId);
      const ticketReference = docSnapshot.id.slice(0, 8).toUpperCase();
      const subject = String(data.subject || 'Support ticket').trim();

      for (const adminEmail of adminEmails) {
        await adminDb.collection('notifications').add({
          userEmail: adminEmail,
          communityId,
          type: 'community',
          priority: 'important',
          title: `SLA auto-escalation: ${subject}`,
          message: `Ticket ${ticketReference} was auto-escalated to ${nextPriority.toUpperCase()} (${reason.replace('_', ' ')}).`,
          read: false,
          actionUrl: '/admin/contact-tickets',
          source: 'support_sla_watch',
          createdAt: now,
        });
        notificationsCreated += 1;
        summary.notificationsCreated += 1;
      }
    }

    escalated += 1;
    summary.escalated += 1;
    byReason[reason] += 1;
    summary.byReason[reason] += 1;
    escalatedTicketIds.push(docSnapshot.id);
  }

  if (options.communityId && !communitySummaries.has(options.communityId)) {
    communitySummaries.set(options.communityId, createEmptySummary(options.communityId));
  }

  for (const summary of Array.from(communitySummaries.values())) {
    await persistRunSummary({
      summary,
      now,
      dryRun,
      source: options.source,
      triggeredBy: options.triggeredBy,
    });
  }

  return {
    dryRun,
    scanned: snapshot.size,
    escalated,
    notificationsCreated,
    skipped: {
      noDueAt: skippedNoDueAt,
      noCommunityId: skippedNoCommunity,
    },
    byReason,
    escalatedTicketIds,
    communities: Array.from(communitySummaries.values()),
    generatedAt: now.toISOString(),
  };
}
