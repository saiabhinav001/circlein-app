import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { adminDb } from '@/lib/firebase-admin';

export const dynamic = 'force-dynamic';

type AnyRecord = Record<string, unknown>;

type AuditEvent = {
  timestamp: string;
  category: string;
  action: string;
  actor: string;
  target: string;
  collection: string;
  documentId: string;
  details: AnyRecord;
};

function serializeFirestoreValue(value: unknown): unknown {
  if (value === null || value === undefined) {
    return value;
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (typeof value === 'object' && value !== null && 'toDate' in (value as AnyRecord)) {
    const maybeTimestamp = value as { toDate?: () => Date };
    if (typeof maybeTimestamp.toDate === 'function') {
      return maybeTimestamp.toDate().toISOString();
    }
  }

  if (Array.isArray(value)) {
    return value.map((item) => serializeFirestoreValue(item));
  }

  if (typeof value === 'object') {
    const input = value as AnyRecord;
    const output: AnyRecord = {};

    for (const [key, nestedValue] of Object.entries(input)) {
      output[key] = serializeFirestoreValue(nestedValue);
    }

    return output;
  }

  return value;
}

function toIsoString(value: unknown, fallback = new Date(0).toISOString()): string {
  const serialized = serializeFirestoreValue(value);
  if (typeof serialized === 'string') {
    const parsed = new Date(serialized);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toISOString();
    }
  }
  return fallback;
}

function toCsvCell(value: unknown): string {
  const stringValue = String(value ?? '');
  return `"${stringValue.replace(/"/g, '""')}"`;
}

function buildCsv(events: AuditEvent[]): string {
  const headers = [
    'timestamp',
    'category',
    'action',
    'actor',
    'target',
    'collection',
    'documentId',
    'details',
  ];

  const rows = events.map((event) => [
    event.timestamp,
    event.category,
    event.action,
    event.actor,
    event.target,
    event.collection,
    event.documentId,
    JSON.stringify(event.details),
  ]);

  return [headers, ...rows]
    .map((row) => row.map((cell) => toCsvCell(cell)).join(','))
    .join('\n');
}

function pickString(value: unknown, fallback = ''): string {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback;
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const role = String((session.user as AnyRecord)?.role || '').toLowerCase();
    if (role !== 'admin' && role !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const communityId = pickString((session.user as AnyRecord)?.communityId);
    if (!communityId) {
      return NextResponse.json({ error: 'Community ID missing' }, { status: 400 });
    }

    const format = String(request.nextUrl.searchParams.get('format') || 'csv').toLowerCase();
    if (format !== 'csv' && format !== 'json') {
      return NextResponse.json({ error: 'Format must be csv or json' }, { status: 400 });
    }

    const [
      usersSnap,
      bookingsSnap,
      maintenanceSnap,
      deletionRequestsSnap,
      accessCodesSnap,
      notificationsSnap,
      communityNotificationsSnap,
    ] = await Promise.all([
      adminDb.collection('users').where('communityId', '==', communityId).get(),
      adminDb.collection('bookings').where('communityId', '==', communityId).get(),
      adminDb.collection('maintenanceRequests').where('communityId', '==', communityId).get(),
      adminDb.collection('accountDeletionRequests').where('communityId', '==', communityId).get(),
      adminDb.collection('accessCodes').where('communityId', '==', communityId).get(),
      adminDb.collection('notifications').where('communityId', '==', communityId).get(),
      adminDb.collection('communityNotifications').where('communityId', '==', communityId).get(),
    ]);

    const events: AuditEvent[] = [];

    for (const doc of usersSnap.docs) {
      const data = serializeFirestoreValue(doc.data()) as AnyRecord;
      const createdAt = toIsoString(data.createdAt || data.updatedAt);
      events.push({
        timestamp: createdAt,
        category: 'user',
        action: 'user_registered',
        actor: pickString(data.createdBy, 'system'),
        target: pickString(data.email, doc.id),
        collection: 'users',
        documentId: doc.id,
        details: {
          role: pickString(data.role, 'resident'),
          name: pickString(data.name || data.displayName),
        },
      });
    }

    for (const doc of bookingsSnap.docs) {
      const data = serializeFirestoreValue(doc.data()) as AnyRecord;
      const status = pickString(data.status, 'created');
      const action = status === 'cancelled' ? 'booking_cancelled' : status === 'waitlisted' ? 'booking_waitlisted' : 'booking_created';
      const timestamp = toIsoString(data.updatedAt || data.cancelledAt || data.createdAt || data.startTime);
      events.push({
        timestamp,
        category: 'booking',
        action,
        actor: pickString(data.updatedBy || data.cancelledBy || data.createdBy || data.userEmail, 'system'),
        target: pickString(data.userEmail || data.userId, 'unknown'),
        collection: 'bookings',
        documentId: doc.id,
        details: {
          amenityId: pickString(data.amenityId),
          amenityName: pickString(data.amenityName),
          startTime: pickString(data.startTime),
          endTime: pickString(data.endTime),
          status,
        },
      });
    }

    for (const doc of maintenanceSnap.docs) {
      const data = serializeFirestoreValue(doc.data()) as AnyRecord;
      const status = pickString(data.status, 'submitted');
      events.push({
        timestamp: toIsoString(data.updatedAt || data.createdAt || data.reportedAt),
        category: 'maintenance',
        action: `maintenance_${status}`,
        actor: pickString(data.updatedBy || data.userEmail, 'system'),
        target: pickString(data.userEmail || data.userId, 'unknown'),
        collection: 'maintenanceRequests',
        documentId: doc.id,
        details: {
          title: pickString(data.title),
          priority: pickString(data.priority),
          location: pickString(data.location),
          status,
        },
      });
    }

    for (const doc of deletionRequestsSnap.docs) {
      const data = serializeFirestoreValue(doc.data()) as AnyRecord;
      const status = pickString(data.status, 'requested');
      events.push({
        timestamp: toIsoString(data.reviewedAt || data.requestedAt || data.createdAt),
        category: 'account',
        action: `account_deletion_${status}`,
        actor: pickString(data.reviewedBy || data.requestedBy || data.userEmail, 'system'),
        target: pickString(data.userEmail, 'unknown'),
        collection: 'accountDeletionRequests',
        documentId: doc.id,
        details: {
          reason: pickString(data.reason),
          reviewNote: pickString(data.reviewNote),
          deletionExecuted: Boolean(data.deletionExecuted),
          deletionExecutionResult: (data.deletionExecutionResult || null) as unknown,
        },
      });
    }

    for (const doc of accessCodesSnap.docs) {
      const data = serializeFirestoreValue(doc.data()) as AnyRecord;
      const isUsed = Boolean(data.isUsed);
      events.push({
        timestamp: toIsoString(data.usedAt || data.createdAt),
        category: 'access',
        action: isUsed ? 'access_code_used' : 'access_code_generated',
        actor: pickString(data.createdBy || data.usedBy || 'system'),
        target: isUsed ? pickString(data.usedBy, 'unknown') : pickString(data.communityId, communityId),
        collection: 'accessCodes',
        documentId: doc.id,
        details: {
          type: pickString(data.type),
          description: pickString(data.description),
          isUsed,
        },
      });
    }

    const allNotifications = notificationsSnap.docs.concat(communityNotificationsSnap.docs);
    const seenNotificationIds = new Set<string>();
    for (const doc of allNotifications) {
      if (seenNotificationIds.has(doc.id)) {
        continue;
      }
      seenNotificationIds.add(doc.id);

      const data = serializeFirestoreValue(doc.data()) as AnyRecord;
      events.push({
        timestamp: toIsoString(data.createdAt),
        category: 'notification',
        action: 'notification_sent',
        actor: pickString(data.sentBy || data.createdBy || 'system'),
        target: pickString(data.recipientEmail || data.userEmail || 'community'),
        collection: doc.ref.parent.id,
        documentId: doc.id,
        details: {
          type: pickString(data.type),
          source: pickString(data.source),
          title: pickString(data.title),
          priority: pickString(data.priority),
        },
      });
    }

    events.sort((a, b) => {
      const aTime = new Date(a.timestamp).getTime();
      const bTime = new Date(b.timestamp).getTime();
      return bTime - aTime;
    });

    const now = new Date();
    const fileDate = now.toISOString().slice(0, 10);

    if (format === 'json') {
      const payload = {
        meta: {
          exportedAt: now.toISOString(),
          exportVersion: '1.0.0',
          app: 'CircleIn',
          communityId,
          exportedBy: session.user.email,
          totalEvents: events.length,
        },
        events,
      };

      return new NextResponse(JSON.stringify(payload, null, 2), {
        status: 200,
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Content-Disposition': `attachment; filename="circlein-audit-logs-${fileDate}.json"`,
          'Cache-Control': 'no-store',
        },
      });
    }

    const csvContent = buildCsv(events);
    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="circlein-audit-logs-${fileDate}.csv"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (error: any) {
    console.error('Failed to export community audit logs:', error);
    return NextResponse.json(
      { error: 'Failed to export community audit logs', details: error?.message || 'Unknown error' },
      { status: 500 }
    );
  }
}