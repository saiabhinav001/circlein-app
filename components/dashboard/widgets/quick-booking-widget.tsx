'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, CalendarDays, Repeat2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface BookingSummary {
  id: string;
  amenityId: string;
  amenityName: string;
  startTime: string | null;
}

export function QuickBookingWidget() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState<BookingSummary[]>([]);

  useEffect(() => {
    let isMounted = true;

    const loadBookings = async () => {
      setLoading(true);

      try {
        const response = await fetch('/api/bookings?limit=8', { cache: 'no-store' });

        if (!response.ok) {
          throw new Error('Failed to fetch bookings');
        }

        const data = await response.json();
        const nextBookings = Array.isArray(data?.bookings)
          ? data.bookings.map((booking: any) => ({
              id: String(booking.id || ''),
              amenityId: String(booking.amenityId || ''),
              amenityName: String(booking.amenityName || 'Amenity'),
              startTime: booking.startTime || null,
            }))
          : [];

        if (isMounted) {
          setBookings(nextBookings);
        }
      } catch (error) {
        if (isMounted) {
          setBookings([]);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadBookings();

    return () => {
      isMounted = false;
    };
  }, []);

  const latestAmenityBooking = useMemo(() => {
    return bookings.find((booking) => booking.amenityId && booking.amenityName);
  }, [bookings]);

  const latestBookingDate = useMemo(() => {
    if (!latestAmenityBooking?.startTime) {
      return null;
    }

    const parsed = new Date(latestAmenityBooking.startTime);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }, [latestAmenityBooking]);

  const goToBooking = () => {
    if (latestAmenityBooking?.amenityId) {
      router.push(`/amenity/${latestAmenityBooking.amenityId}`);
      return;
    }

    router.push('/calendar');
  };

  return (
    <section className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-gray-900 to-gray-800 p-4 shadow-lg transition-all duration-200 hover:-translate-y-0.5 hover:border-white/20 hover:shadow-xl">
      <div className="flex items-center gap-2 text-sm font-semibold text-white">
        <Repeat2 className="h-4 w-4 text-blue-400" />
        Book Again
      </div>

      {loading ? (
        <div className="mt-4 animate-pulse space-y-2">
          <div className="h-4 w-24 rounded bg-gray-700" />
          <div className="h-8 w-16 rounded bg-gray-700" />
        </div>
      ) : latestAmenityBooking ? (
        <>
          <p className="mt-4 text-lg font-semibold text-white">{latestAmenityBooking.amenityName}</p>
          <p className="mt-1 text-xs text-gray-500">
            {latestBookingDate
              ? `Last booked on ${latestBookingDate.toLocaleDateString()}`
              : 'Ready for your next reservation'}
          </p>

          <Button onClick={goToBooking} className="mt-4 h-10 w-full rounded-xl bg-blue-600 text-white hover:bg-blue-500">
            Book Now
            <ArrowRight className="ml-2 h-3.5 w-3.5" />
          </Button>
        </>
      ) : (
        <>
          <div className="mt-4 flex items-center gap-2 text-gray-500">
            <CalendarDays className="h-4 w-4" />
            <p className="text-sm">No recent bookings yet</p>
          </div>
          <Button onClick={() => router.push('/calendar')} variant="outline" className="mt-4 h-10 w-full rounded-xl border-white/15 bg-black/10 text-gray-200 hover:bg-black/20 hover:text-white">
            Start booking
          </Button>
        </>
      )}
    </section>
  );
}
