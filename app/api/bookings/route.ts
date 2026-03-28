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

export async function GET(request: NextRequest): Promise<NextResponse> {
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

    const searchParams = request.nextUrl.searchParams;
    const limitParam = Number(searchParams.get('limit') || '20');
    const limit = Number.isFinite(limitParam) && limitParam > 0 ? Math.min(limitParam, 50) : 20;

    const snapshot = await adminDb
      .collection('bookings')
      .where('communityId', '==', communityId)
      .get();

    const bookings = snapshot.docs
      .map((docSnapshot) => {
        const data = docSnapshot.data() as Record<string, unknown>;
        const startTime = toDate(data.startTime);
        const endTime = toDate(data.endTime);

        return {
          id: docSnapshot.id,
          amenityId: String(data.amenityId || ''),
          amenityName: String(data.amenityName || ''),
          status: String(data.status || ''),
          userEmail: String(data.userEmail || data.userId || ''),
          startTime: startTime ? startTime.toISOString() : null,
          endTime: endTime ? endTime.toISOString() : null,
          selectedSlot: String(data.selectedSlot || ''),
          selectedDate: String(data.selectedDate || ''),
          createdAt: toDate(data.createdAt)?.toISOString() || null,
        };
      })
      .filter((booking) => {
        if (isAdmin) {
          return true;
        }

        return booking.userEmail === session.user.email;
      })
      .sort((a, b) => {
        const aTime = a.startTime ? new Date(a.startTime).getTime() : 0;
        const bTime = b.startTime ? new Date(b.startTime).getTime() : 0;
        return bTime - aTime;
      })
      .slice(0, limit);

    return NextResponse.json({ bookings });
  } catch (error: any) {
    console.error('Failed to fetch bookings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch bookings', details: error?.message || 'Unknown error' },
      { status: 500 }
    );
  }
}
