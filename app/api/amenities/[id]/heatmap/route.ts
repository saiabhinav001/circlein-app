import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { adminDb } from '@/lib/firebase-admin';

export const dynamic = 'force-dynamic';

function toDate(value: unknown): Date | null {
  if (!value) {
    return null;
  }

  if (value instanceof Date) {
    return value;
  }

  if (typeof (value as { toDate?: () => Date }).toDate === 'function') {
    return (value as { toDate: () => Date }).toDate();
  }

  if (typeof value === 'string' || typeof value === 'number') {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  return null;
}

export async function GET(
  _request: NextRequest,
  props: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const communityId = (session.user as any).communityId;
    if (!communityId) {
      return NextResponse.json({ error: 'Community ID missing' }, { status: 400 });
    }

    const { id } = await props.params;
    if (!id) {
      return NextResponse.json({ error: 'Amenity ID missing' }, { status: 400 });
    }

    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 90);

    const snapshot = await adminDb.collection('bookings').where('amenityId', '==', id).get();

    const grid = Array.from({ length: 7 }, () => Array.from({ length: 24 }, () => 0));

    snapshot.docs.forEach((docSnapshot) => {
      const data = docSnapshot.data() as Record<string, unknown>;

      if (String(data.communityId || '') !== communityId) {
        return;
      }

      const status = String(data.status || '').toLowerCase();
      if (status === 'cancelled') {
        return;
      }

      const startDate = toDate(data.startTime);
      if (!startDate || startDate < cutoff) {
        return;
      }

      const day = startDate.getDay();
      const hour = startDate.getHours();

      if (day >= 0 && day <= 6 && hour >= 0 && hour <= 23) {
        grid[day][hour] += 1;
      }
    });

    const heatmap = grid.flatMap((hours, day) =>
      hours.map((count, hour) => ({ day, hour, count }))
    );

    return NextResponse.json({ heatmap });
  } catch (error: any) {
    console.error('Failed to build amenity heatmap:', error);
    return NextResponse.json(
      { error: 'Failed to build amenity heatmap', details: error?.message || 'Unknown error' },
      { status: 500 }
    );
  }
}
