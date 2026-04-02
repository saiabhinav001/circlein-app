import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import {
  getSupportSlaState,
  isSupportStatusActive,
  normalizeSupportPriority,
  toDateValue,
} from '@/lib/support-ticket';
import { adminDb } from '@/lib/firebase-admin';

export const dynamic = 'force-dynamic';

type PriorityBreakdown = {
  low: number;
  normal: number;
  high: number;
  urgent: number;
};

function average(values: number[]): number | null {
  if (!values.length) {
    return null;
  }

  const total = values.reduce((sum, value) => sum + value, 0);
  return Math.round((total / values.length) * 10) / 10;
}

function toMinutes(deltaMs: number): number {
  return deltaMs / (60 * 1000);
}

function toHours(deltaMs: number): number {
  return deltaMs / (60 * 60 * 1000);
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

    const snapshot = await adminDb
      .collection('supportTickets')
      .where('communityId', '==', communityId)
      .get();

    const now = new Date();
    const firstResponseMinutes: number[] = [];
    const resolutionHours: number[] = [];
    let activeCount = 0;
    let overdueCount = 0;
    let atRiskCount = 0;
    let escalatedCount = 0;
    let breachedResolvedCount = 0;

    const byPriority: PriorityBreakdown = {
      low: 0,
      normal: 0,
      high: 0,
      urgent: 0,
    };

    for (const docSnapshot of snapshot.docs) {
      const data = docSnapshot.data() as Record<string, unknown>;
      const status = String(data.status || 'open');
      const priority = normalizeSupportPriority(data.priority);
      const createdAt = toDateValue(data.createdAt);
      const firstResponseAt = toDateValue(data.firstResponseAt);
      const dueAt = toDateValue(data.dueAt);
      const resolvedAt = toDateValue(data.resolvedAt) || toDateValue(data.closedAt);
      const escalatedAt = toDateValue(data.escalatedAt);

      byPriority[priority] += 1;

      if (isSupportStatusActive(status)) {
        activeCount += 1;
      }

      const slaState = getSupportSlaState({ dueAt, status, now });
      if (slaState === 'overdue') {
        overdueCount += 1;
      }
      if (slaState === 'at_risk') {
        atRiskCount += 1;
      }

      if (escalatedAt) {
        escalatedCount += 1;
      }

      if (createdAt && firstResponseAt) {
        firstResponseMinutes.push(toMinutes(firstResponseAt.getTime() - createdAt.getTime()));
      }

      if (createdAt && resolvedAt) {
        resolutionHours.push(toHours(resolvedAt.getTime() - createdAt.getTime()));
      }

      if (resolvedAt && dueAt && resolvedAt.getTime() > dueAt.getTime()) {
        breachedResolvedCount += 1;
      }
    }

    return NextResponse.json({
      success: true,
      metrics: {
        totalTickets: snapshot.size,
        activeTickets: activeCount,
        overdueTickets: overdueCount,
        atRiskTickets: atRiskCount,
        escalatedTickets: escalatedCount,
        breachedResolvedTickets: breachedResolvedCount,
        averageFirstResponseMinutes: average(firstResponseMinutes),
        averageResolutionHours: average(resolutionHours),
        byPriority,
      },
    });
  } catch (error: any) {
    console.error('Failed to fetch support ticket metrics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch support ticket metrics', details: error?.message || 'Unknown error' },
      { status: 500 }
    );
  }
}
