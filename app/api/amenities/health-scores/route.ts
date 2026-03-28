import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { adminDb } from '@/lib/firebase-admin';
import { calculateAmenityHealthScore } from '@/lib/amenity-health-score';

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

function normalize(value: string): string {
  return value.trim().toLowerCase();
}

type AmenityDoc = {
  id: string;
  name?: unknown;
  booking?: unknown;
  rules?: unknown;
};

function isAmenityRelated(request: Record<string, unknown>, amenity: { id: string; name: string }): boolean {
  const requestAmenityId = String(request.amenityId || '').trim();
  if (requestAmenityId && requestAmenityId === amenity.id) {
    return true;
  }

  const amenityName = normalize(amenity.name);
  const requestAmenityName = normalize(String(request.amenityName || ''));
  if (requestAmenityName && requestAmenityName === amenityName) {
    return true;
  }

  const location = normalize(String(request.location || ''));
  if (location && location.includes(amenityName)) {
    return true;
  }

  const title = normalize(String(request.title || ''));
  if (title && title.includes(amenityName)) {
    return true;
  }

  return false;
}

export async function GET(): Promise<NextResponse> {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const communityId = (session.user as any).communityId;
    if (!communityId) {
      return NextResponse.json({ error: 'Community ID missing' }, { status: 400 });
    }

    const now = new Date();
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [amenitiesSnapshot, bookingsSnapshot, maintenanceSnapshot, reviewsSnapshot] = await Promise.all([
      adminDb.collection('amenities').where('communityId', '==', communityId).get(),
      adminDb.collection('bookings').where('communityId', '==', communityId).get(),
      adminDb.collection('maintenanceRequests').where('communityId', '==', communityId).get(),
      adminDb.collection('reviews').get(),
    ]);

    const amenities: AmenityDoc[] = amenitiesSnapshot.docs.map((docSnapshot) => ({
      id: docSnapshot.id,
      ...(docSnapshot.data() as Record<string, unknown>),
    }));
    const amenityIds = new Set(amenities.map((amenity) => String(amenity.id || '')));

    const bookings = bookingsSnapshot.docs.map((docSnapshot) => docSnapshot.data() as Record<string, unknown>);
    const maintenanceRequests = maintenanceSnapshot.docs.map((docSnapshot) => docSnapshot.data() as Record<string, unknown>);
    const reviews = reviewsSnapshot.docs
      .map((docSnapshot) => docSnapshot.data() as Record<string, unknown>)
      .filter((review) => amenityIds.has(String(review.amenityId || '')));

    const healthScores = amenities.map((amenity) => {
      const amenityId = String(amenity.id || '');
      const amenityName = String(amenity.name || 'Amenity');

      const capacity = Number(
        (amenity.booking as any)?.maxPeople || (amenity.rules as any)?.maxSlotsPerFamily || 1
      );

      const bookingCount = bookings.filter((booking) => {
        if (String(booking.amenityId || '') !== amenityId) {
          return false;
        }

        const status = String(booking.status || '').toLowerCase();
        if (status === 'cancelled') {
          return false;
        }

        const start = toDate(booking.startTime);
        if (!start) {
          return false;
        }

        return start >= thirtyDaysAgo && start <= now;
      }).length;

      const amenityMaintenance = maintenanceRequests.filter((request) =>
        isAmenityRelated(request, { id: amenityId, name: amenityName })
      );

      const maintenanceRequestCount = amenityMaintenance.filter((request) => {
        const status = String(request.status || '').toLowerCase();
        return status !== 'resolved' && status !== 'closed';
      }).length;

      const completedMaintenanceDates = amenityMaintenance
        .filter((request) => {
          const status = String(request.status || '').toLowerCase();
          return status === 'resolved' || status === 'closed';
        })
        .map((request) =>
          toDate(request.closedAt) || toDate(request.resolvedAt) || toDate(request.updatedAt) || toDate(request.createdAt)
        )
        .filter((date): date is Date => date !== null)
        .sort((a, b) => b.getTime() - a.getTime());

      const daysSinceLastMaintenance = completedMaintenanceDates[0]
        ? Math.max(0, Math.floor((now.getTime() - completedMaintenanceDates[0].getTime()) / (1000 * 60 * 60 * 24)))
        : 999;

      const amenityReviews = reviews.filter((review) => String(review.amenityId || '') === amenityId);
      const averageRating = amenityReviews.length
        ? amenityReviews.reduce((sum, review) => sum + Number(review.rating || 0), 0) / amenityReviews.length
        : null;

      const healthScore = calculateAmenityHealthScore({
        bookingCount,
        capacity: Number.isFinite(capacity) && capacity > 0 ? capacity : 1,
        maintenanceRequestCount,
        averageRating,
        daysSinceLastMaintenance,
      });

      return {
        amenityId,
        amenityName,
        healthScore,
      };
    });

    return NextResponse.json({ healthScores });
  } catch (error: any) {
    console.error('Failed to generate amenity health scores:', error);
    return NextResponse.json(
      { error: 'Failed to generate amenity health scores', details: error?.message || 'Unknown error' },
      { status: 500 }
    );
  }
}
