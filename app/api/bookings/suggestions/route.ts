import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { adminDb } from '@/lib/firebase-admin';
import { analyzeBookingPatterns, type BookingRecord } from '@/lib/booking-pattern-analyzer';

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

function toClock(date: Date): string {
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

function parseSlot(selectedSlot: unknown): { startTime: string; endTime: string } | null {
  if (typeof selectedSlot !== 'string') {
    return null;
  }

  const [startTime, endTime] = selectedSlot.split('-').map((value) => value.trim());
  if (!startTime || !endTime) {
    return null;
  }

  return { startTime, endTime };
}

export async function GET(): Promise<NextResponse> {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const communityId = (session.user as any).communityId;
    if (!communityId) {
      return NextResponse.json({ error: 'Community context missing' }, { status: 400 });
    }

    const snapshot = await adminDb
      .collection('bookings')
      .where('communityId', '==', communityId)
      .where('userEmail', '==', session.user.email)
      .get();

    const recordsWithMeta = snapshot.docs
      .map((docSnapshot) => {
        const data = docSnapshot.data() as Record<string, unknown>;
        const status = String(data.status || '');
        const statusLower = status.toLowerCase();

        if (statusLower !== 'confirmed' && statusLower !== 'completed') {
          return null;
        }

        const slot = parseSlot(data.selectedSlot);

        const startDate = toDate(data.startTime);
        const endDate = toDate(data.endTime);
        const createdAtDate = toDate(data.createdAt) || startDate;

        const startTime = slot?.startTime || (startDate ? toClock(startDate) : '');
        const endTime = slot?.endTime || (endDate ? toClock(endDate) : '');

        if (!startTime || !endTime) {
          return null;
        }

        const selectedDate = typeof data.selectedDate === 'string'
          ? data.selectedDate.slice(0, 10)
          : startDate
            ? startDate.toISOString().slice(0, 10)
            : '';

        if (!selectedDate) {
          return null;
        }

        return {
          createdAt: createdAtDate ? createdAtDate.getTime() : 0,
          amenityId: String(data.amenityId || ''),
          amenityName: String(data.amenityName || 'Amenity'),
          date: selectedDate,
          startTime,
          endTime,
          status,
        };
      })
      .filter((record): record is (BookingRecord & { createdAt: number }) => record !== null)
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, 30);

    const bookingHistory: BookingRecord[] = recordsWithMeta.map(({ createdAt, ...record }) => record);

    const suggestions = analyzeBookingPatterns(bookingHistory, new Date());

    return NextResponse.json({ suggestions });
  } catch {
    // Suggestions are an enhancement; degrade gracefully when upstream data is unavailable.
    return NextResponse.json({ suggestions: [] });
  }
}
