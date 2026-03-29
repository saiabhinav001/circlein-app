import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

function isAuthorized(request: NextRequest): boolean {
  const configuredSecret = process.env.CRON_SECRET;
  if (!configuredSecret) {
    return true;
  }

  const authHeader = request.headers.get('authorization') || '';
  const token = authHeader.replace('Bearer ', '').trim();
  const cronHeader = request.headers.get('x-cron-secret') || '';

  return token === configuredSecret || cronHeader === configuredSecret;
}

function chunkArray<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];

  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }

  return chunks;
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    if (!isAuthorized(request)) {
      return NextResponse.json({ error: 'Unauthorized cron call' }, { status: 401 });
    }

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 90);

    const snapshot = await adminDb
      .collection('bookings')
      .where('startTime', '<=', cutoffDate)
      .get();

    const eligibleDocs = snapshot.docs.filter((docSnapshot) => {
      const status = String(docSnapshot.data().status || '').toLowerCase();
      return status === 'completed' || status === 'cancelled';
    });

    let archived = 0;
    let errors = 0;

    const chunks = chunkArray(eligibleDocs, 500);

    for (const chunk of chunks) {
      const batch = adminDb.batch();

      chunk.forEach((docSnapshot) => {
        const archiveRef = adminDb.collection('bookings_archive').doc(docSnapshot.id);
        batch.set(archiveRef, docSnapshot.data());
        batch.delete(docSnapshot.ref);
      });

      try {
        await batch.commit();
        archived += chunk.length;
      } catch {
        for (const docSnapshot of chunk) {
          const fallbackBatch = adminDb.batch();
          const archiveRef = adminDb.collection('bookings_archive').doc(docSnapshot.id);

          fallbackBatch.set(archiveRef, docSnapshot.data());
          fallbackBatch.delete(docSnapshot.ref);

          try {
            await fallbackBatch.commit();
            archived += 1;
          } catch {
            errors += 1;
          }
        }
      }
    }

    return NextResponse.json({
      archived,
      errors,
      cutoffDate: cutoffDate.toISOString(),
      scanned: snapshot.size,
      eligible: eligibleDocs.length,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Failed to archive old bookings' },
      { status: 500 }
    );
  }
}
