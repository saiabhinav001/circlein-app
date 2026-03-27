import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { adminDb } from '@/lib/firebase-admin';

export const dynamic = 'force-dynamic';

function serializeFirestoreValue(value: unknown): unknown {
  if (value === null || value === undefined) {
    return value;
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (typeof value === 'object' && value !== null && 'toDate' in (value as Record<string, unknown>)) {
    const maybeTimestamp = value as { toDate?: () => Date };
    if (typeof maybeTimestamp.toDate === 'function') {
      return maybeTimestamp.toDate().toISOString();
    }
  }

  if (Array.isArray(value)) {
    return value.map((item) => serializeFirestoreValue(item));
  }

  if (typeof value === 'object') {
    const input = value as Record<string, unknown>;
    const output: Record<string, unknown> = {};

    for (const [key, nestedValue] of Object.entries(input)) {
      output[key] = serializeFirestoreValue(nestedValue);
    }

    return output;
  }

  return value;
}

function dedupeById<T extends { id: string }>(items: T[]): T[] {
  const map = new Map<string, T>();
  for (const item of items) {
    map.set(item.id, item);
  }
  return Array.from(map.values());
}

function serializeDocData(value: unknown): Record<string, unknown> {
  const serialized = serializeFirestoreValue(value);
  if (serialized && typeof serialized === 'object' && !Array.isArray(serialized)) {
    return serialized as Record<string, unknown>;
  }
  return {};
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userEmail = String(session.user.email);

    const userSnap = await adminDb.collection('users').doc(userEmail).get();
    const userData = userSnap.exists ? userSnap.data() : null;
    const communityId = String((userData?.communityId || (session.user as any)?.communityId || '') as string);

    const [
      bookingsByEmailSnap,
      bookingsByUserIdSnap,
      maintenanceByUserIdSnap,
      maintenanceByEmailSnap,
      notificationsByUserEmailSnap,
      notificationsByRecipientSnap,
    ] = await Promise.all([
      adminDb.collection('bookings').where('userEmail', '==', userEmail).get(),
      adminDb.collection('bookings').where('userId', '==', userEmail).get(),
      adminDb.collection('maintenanceRequests').where('userId', '==', userEmail).get(),
      adminDb.collection('maintenanceRequests').where('userEmail', '==', userEmail).get(),
      adminDb.collection('notifications').where('userEmail', '==', userEmail).get(),
      adminDb.collection('notifications').where('recipientEmail', '==', userEmail).get(),
    ]);

    const bookingDocs = bookingsByEmailSnap.docs.concat(bookingsByUserIdSnap.docs);
    const maintenanceDocs = maintenanceByUserIdSnap.docs.concat(maintenanceByEmailSnap.docs);
    const notificationDocs = notificationsByUserEmailSnap.docs.concat(notificationsByRecipientSnap.docs);

    const bookings = dedupeById(
      bookingDocs.map((docSnapshot) => Object.assign({ id: docSnapshot.id }, serializeDocData(docSnapshot.data())))
    );

    const maintenanceRequests = dedupeById(
      maintenanceDocs.map((docSnapshot) => Object.assign({ id: docSnapshot.id }, serializeDocData(docSnapshot.data())))
    );

    const notifications = dedupeById(
      notificationDocs.map((docSnapshot) => Object.assign({ id: docSnapshot.id }, serializeDocData(docSnapshot.data())))
    );

    const exportPayload = {
      meta: {
        exportedAt: new Date().toISOString(),
        exportVersion: '1.0.0',
        app: 'CircleIn',
        userEmail,
        communityId,
      },
      user: userData ? serializeFirestoreValue(userData) : null,
      bookings,
      maintenanceRequests,
      notifications,
    };

    const fileDate = new Date().toISOString().slice(0, 10);
    const fileName = `circlein-data-export-${fileDate}.json`;

    return new NextResponse(JSON.stringify(exportPayload, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (error: any) {
    console.error('Failed to export account data:', error);
    return NextResponse.json(
      { error: 'Failed to export account data', details: error?.message || 'Unknown error' },
      { status: 500 }
    );
  }
}
