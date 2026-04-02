import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { adminDb } from '@/lib/firebase-admin';
import {
  getSupportSlaState,
  isSupportStatusActive,
  normalizeSupportPriority,
  toDateValue,
} from '@/lib/support-ticket';

export const dynamic = 'force-dynamic';

type RadarRiskLevel = 'stable' | 'guarded' | 'elevated' | 'critical';
type RadarAlertSeverity = 'good' | 'watch' | 'critical';

type RadarAlert = {
  id: string;
  severity: RadarAlertSeverity;
  title: string;
  detail: string;
  actionLabel: string;
  actionUrl: string;
};

function toIsoString(value: unknown): string | null {
  const parsed = toDateValue(value);
  return parsed ? parsed.toISOString() : null;
}

function toPercentDelta(current: number, previous: number): number {
  if (previous <= 0) {
    return current > 0 ? 100 : 0;
  }

  return Math.round(((current - previous) / previous) * 100);
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function toRiskLevel(score: number): RadarRiskLevel {
  if (score >= 75) {
    return 'critical';
  }

  if (score >= 50) {
    return 'elevated';
  }

  if (score >= 25) {
    return 'guarded';
  }

  return 'stable';
}

export async function GET(): Promise<NextResponse> {
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

    const [supportSnapshot, maintenanceSnapshot, bookingsSnapshot, slaWatchSnapshot] = await Promise.all([
      adminDb.collection('supportTickets').where('communityId', '==', communityId).get(),
      adminDb.collection('maintenanceRequests').where('communityId', '==', communityId).get(),
      adminDb.collection('bookings').where('communityId', '==', communityId).get(),
      adminDb.collection('automationRuns').doc(`${communityId}_support_sla_watch`).get(),
    ]);

    const now = new Date();
    const nowMs = now.getTime();
    const oneHourMs = 60 * 60 * 1000;
    const oneDayMs = 24 * oneHourMs;
    const sevenDaysMs = 7 * oneDayMs;

    const support = {
      total: supportSnapshot.size,
      active: 0,
      overdue: 0,
      atRisk: 0,
      urgentOrHigh: 0,
    };

    for (const docSnapshot of supportSnapshot.docs) {
      const data = docSnapshot.data() as Record<string, unknown>;
      const status = data.status;
      const priority = normalizeSupportPriority(data.priority);
      const dueAt = toDateValue(data.dueAt);

      if (isSupportStatusActive(status)) {
        support.active += 1;
      }

      if (priority === 'urgent' || priority === 'high') {
        support.urgentOrHigh += 1;
      }

      const slaState = getSupportSlaState({
        dueAt,
        status,
        now,
      });

      if (slaState === 'overdue') {
        support.overdue += 1;
      } else if (slaState === 'at_risk') {
        support.atRisk += 1;
      }
    }

    const maintenance = {
      total: maintenanceSnapshot.size,
      open: 0,
      urgentOrHigh: 0,
      stale: 0,
    };

    for (const docSnapshot of maintenanceSnapshot.docs) {
      const data = docSnapshot.data() as Record<string, unknown>;
      const status = String(data.status || '').toLowerCase();
      const priority = String(data.priority || '').toLowerCase();
      const createdAt = toDateValue(data.createdAt);
      const isOpen = status === 'new' || status === 'in_progress';

      if (!isOpen) {
        continue;
      }

      maintenance.open += 1;

      if (priority === 'high' || priority === 'urgent') {
        maintenance.urgentOrHigh += 1;
      }

      if (createdAt && nowMs - createdAt.getTime() > 72 * oneHourMs) {
        maintenance.stale += 1;
      }
    }

    let upcomingSevenDays = 0;
    let previousSevenDays = 0;
    let recentCount = 0;
    let recentCancelled = 0;
    let weekendUpcoming = 0;
    let peakHour = -1;
    let peakHourBookings = 0;
    const upcomingHourBuckets = Array.from({ length: 24 }, (_, hour) => ({ hour, count: 0 }));

    for (const docSnapshot of bookingsSnapshot.docs) {
      const data = docSnapshot.data() as Record<string, unknown>;
      const status = String(data.status || '').toLowerCase();
      const startAt = toDateValue(data.startTime) || toDateValue(data.createdAt);
      if (!startAt) {
        continue;
      }

      const startAtMs = startAt.getTime();
      const isCancelledLike =
        status === 'cancelled' || status === 'no_show' || status === 'expired' || status === 'declined';

      const inUpcomingWindow = startAtMs >= nowMs && startAtMs < nowMs + sevenDaysMs;
      if (inUpcomingWindow && !isCancelledLike) {
        upcomingSevenDays += 1;
        if (startAt.getDay() === 0 || startAt.getDay() === 6) {
          weekendUpcoming += 1;
        }

        const hour = startAt.getHours();
        upcomingHourBuckets[hour].count += 1;
        if (upcomingHourBuckets[hour].count > peakHourBookings) {
          peakHourBookings = upcomingHourBuckets[hour].count;
          peakHour = hour;
        }
      }

      const inPreviousWindow = startAtMs >= nowMs - sevenDaysMs && startAtMs < nowMs;
      if (inPreviousWindow && !isCancelledLike) {
        previousSevenDays += 1;
      }

      if (inPreviousWindow) {
        recentCount += 1;
        if (status === 'cancelled' || status === 'no_show') {
          recentCancelled += 1;
        }
      }
    }

    const demandDeltaPercent = toPercentDelta(upcomingSevenDays, previousSevenDays);
    const cancellationRateRecent = recentCount > 0 ? Math.round((recentCancelled / recentCount) * 100) : 0;

    const supportRisk = Math.min(38, support.overdue * 10 + support.atRisk * 5 + support.active * 2 + support.urgentOrHigh * 2);
    const maintenanceRisk = Math.min(32, maintenance.open * 2 + maintenance.urgentOrHigh * 4 + maintenance.stale * 6);
    const demandSpikeRisk = Math.min(18, Math.max(0, demandDeltaPercent) * 0.25 + (weekendUpcoming > 25 ? 4 : 0));
    const cancellationRisk = Math.min(12, cancellationRateRecent * 0.8);

    const riskScore = Math.round(
      clamp(supportRisk + maintenanceRisk + demandSpikeRisk + cancellationRisk, 0, 100)
    );
    const riskLevel = toRiskLevel(riskScore);

    const alerts: RadarAlert[] = [];

    if (support.overdue > 0) {
      alerts.push({
        id: 'support-overdue',
        severity: 'critical',
        title: 'Support cases need urgent follow-up',
        detail: `${support.overdue} support case(s) are overdue and need immediate action.`,
        actionLabel: 'Open support inbox',
        actionUrl: '/admin/contact-tickets',
      });
    }

    if (maintenance.stale > 0) {
      alerts.push({
        id: 'maintenance-stale',
        severity: 'watch',
        title: 'Maintenance requests are aging',
        detail: `${maintenance.stale} maintenance request(s) have remained open for over 72 hours.`,
        actionLabel: 'Open maintenance desk',
        actionUrl: '/admin/maintenance',
      });
    }

    if (demandDeltaPercent >= 40 && upcomingSevenDays >= 20) {
      alerts.push({
        id: 'demand-spike',
        severity: 'watch',
        title: 'Bookings are rising quickly',
        detail: `Upcoming demand is up ${demandDeltaPercent}% compared to the previous 7-day window.`,
        actionLabel: 'Open insights',
        actionUrl: '/admin/analytics',
      });
    }

    if (cancellationRateRecent >= 18) {
      alerts.push({
        id: 'cancel-rate',
        severity: 'watch',
        title: 'Cancellations are rising',
        detail: `Recent cancellation rate is ${cancellationRateRecent}%. Consider reminders and waitlist tuning.`,
        actionLabel: 'Open insights',
        actionUrl: '/admin/analytics',
      });
    }

    if (!alerts.length) {
      alerts.push({
        id: 'steady-state',
        severity: 'good',
        title: 'Operations are healthy',
        detail: 'No urgent issues were detected across support, maintenance, or booking demand.',
        actionLabel: 'View insights',
        actionUrl: '/admin/analytics',
      });
    }

    const slaWatchData = slaWatchSnapshot.exists
      ? (slaWatchSnapshot.data() as Record<string, unknown>)
      : null;
    const slaWatchByReason =
      slaWatchData && typeof slaWatchData.byReason === 'object' && slaWatchData.byReason !== null
        ? (slaWatchData.byReason as Record<string, unknown>)
        : null;
    const slaWatch = slaWatchData
      ? {
          runAt: toIsoString(slaWatchData.runAt),
          scannedTickets: Number(slaWatchData.scannedTickets || 0),
          escalatedTickets: Number(slaWatchData.escalatedTickets || 0),
          notificationsCreated: Number(slaWatchData.notificationsCreated || 0),
          dryRun: Boolean(slaWatchData.dryRun),
          source: String(slaWatchData.source || 'unknown'),
          byReason: {
            overdue: Number(slaWatchByReason?.overdue || 0),
            atRisk: Number(slaWatchByReason?.at_risk || 0),
          },
        }
      : null;

    return NextResponse.json({
      success: true,
      radar: {
        riskScore,
        riskLevel,
        generatedAt: now.toISOString(),
        support,
        maintenance,
        demand: {
          upcomingSevenDays,
          previousSevenDays,
          demandDeltaPercent,
          cancellationRateRecent,
          weekendUpcoming,
          peakHour: peakHour >= 0 ? peakHour : null,
          peakHourBookings,
        },
        slaWatch,
        alerts,
      },
    });
  } catch (error: any) {
    console.error('Failed to compute operations radar:', error);
    return NextResponse.json(
      { error: 'Failed to compute operations radar', details: error?.message || 'Unknown error' },
      { status: 500 }
    );
  }
}
