import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { generateWeeklyReport } from '@/lib/report-generator';

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

function getLastWeekRange(referenceDate = new Date()): { weekStart: Date; weekEnd: Date } {
  const reference = new Date(referenceDate);
  reference.setHours(0, 0, 0, 0);

  const dayOfWeek = reference.getDay();
  const offsetToMonday = (dayOfWeek + 6) % 7;

  const thisWeekMonday = new Date(reference);
  thisWeekMonday.setDate(reference.getDate() - offsetToMonday);

  const weekStart = new Date(thisWeekMonday);
  weekStart.setDate(thisWeekMonday.getDate() - 7);
  weekStart.setHours(0, 0, 0, 0);

  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  weekEnd.setHours(23, 59, 59, 999);

  return { weekStart, weekEnd };
}

function toDateString(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    if (!isAuthorized(request)) {
      return NextResponse.json({ error: 'Unauthorized cron call' }, { status: 401 });
    }

    const { weekStart, weekEnd } = getLastWeekRange();

    const snapshot = await adminDb
      .collection('bookings')
      .where('startTime', '>=', weekStart)
      .where('startTime', '<=', weekEnd)
      .get();

    const bookingInput = snapshot.docs.map((docSnapshot) => {
      const data = docSnapshot.data() as Record<string, unknown>;
      const startDate = toDate(data.startTime);

      return {
        amenityId: String(data.amenityId || ''),
        amenityName: String(data.amenityName || 'Amenity'),
        status: String(data.status || ''),
        date: String(data.selectedDate || (startDate ? toDateString(startDate) : '')),
        startTime: startDate
          ? startDate.toISOString()
          : String(data.startTime || ''),
      };
    });

    const report = generateWeeklyReport(bookingInput, weekStart, weekEnd);

    await adminDb.collection('weekly_reports').doc(report.weekStart).set(report);

    return NextResponse.json({
      success: true,
      report: {
        weekStart: report.weekStart,
        weekEnd: report.weekEnd,
        totalBookings: report.totalBookings,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Failed to generate weekly report' },
      { status: 500 }
    );
  }
}
