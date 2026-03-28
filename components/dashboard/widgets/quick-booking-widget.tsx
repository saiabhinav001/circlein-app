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
    <section className="rounded-2xl border border-slate-200/90 dark:border-slate-800/70 bg-white/80 dark:bg-slate-900/70 p-4 sm:p-5 shadow-sm">
      <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
        <Repeat2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
        Quick Booking
      </div>

      {loading ? (
        <div className="mt-4 space-y-2">
          <div className="h-4 w-32 rounded bg-slate-200 dark:bg-slate-700/70" />
          <div className="h-4 w-48 rounded bg-slate-100 dark:bg-slate-800/60" />
          <div className="h-9 w-full rounded-lg bg-slate-100 dark:bg-slate-800/60" />
        </div>
      ) : latestAmenityBooking ? (
        <>
          <p className="mt-4 text-sm text-slate-600 dark:text-slate-300">Continue with your most recent amenity:</p>
          <p className="mt-1 text-base font-semibold text-slate-900 dark:text-white">{latestAmenityBooking.amenityName}</p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            {latestBookingDate
              ? `Last booked on ${latestBookingDate.toLocaleDateString()}`
              : 'Ready for your next reservation'}
          </p>

          <Button onClick={goToBooking} className="mt-4 h-9 w-full rounded-lg bg-slate-900 text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100">
            Book Again
            <ArrowRight className="ml-2 h-3.5 w-3.5" />
          </Button>
        </>
      ) : (
        <>
          <p className="mt-4 text-sm text-slate-600 dark:text-slate-300">No recent amenity bookings found. Start a new reservation now.</p>
          <Button onClick={() => router.push('/calendar')} variant="outline" className="mt-4 h-9 w-full rounded-lg">
            <CalendarDays className="mr-2 h-3.5 w-3.5" />
            Open Calendar
          </Button>
        </>
      )}
    </section>
  );
}
