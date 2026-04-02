'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, CalendarDays, Repeat2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCommunityTimeZone } from '@/components/providers/community-branding-provider';
import { formatDateInTimeZone } from '@/lib/timezone';

interface BookingSummary {
  id: string;
  amenityId: string;
  amenityName: string;
  startTime: string | null;
}

interface SmartSuggestion {
  amenityId: string;
  amenityName: string;
  suggestedDate: string;
  suggestedStartTime: string;
  suggestedEndTime: string;
  message: string;
}

export function QuickBookingWidget() {
  const router = useRouter();
  const timeZone = useCommunityTimeZone();
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [refreshToken, setRefreshToken] = useState(0);
  const [bookings, setBookings] = useState<BookingSummary[]>([]);
  const [topSuggestion, setTopSuggestion] = useState<SmartSuggestion | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadBookings = async () => {
      setLoading(true);
      setLoadError(false);

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

        try {
          const suggestionsResponse = await fetch('/api/bookings/suggestions', { cache: 'no-store' });
          if (!suggestionsResponse.ok) {
            throw new Error('Failed to fetch smart suggestions');
          }

          const suggestionsData = await suggestionsResponse.json();
          const nextSuggestion = Array.isArray(suggestionsData?.suggestions)
            ? suggestionsData.suggestions[0] || null
            : null;

          if (isMounted) {
            setTopSuggestion(nextSuggestion);
          }
        } catch {
          if (isMounted) {
            setTopSuggestion(null);
          }
        }
      } catch (error) {
        if (isMounted) {
          setBookings([]);
          setTopSuggestion(null);
          setLoadError(true);
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
  }, [refreshToken]);

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

  const suggestionSlotLabel = useMemo(() => {
    if (!topSuggestion) {
      return null;
    }
    return `${topSuggestion.suggestedStartTime}-${topSuggestion.suggestedEndTime}`;
  }, [topSuggestion]);

  const goToBooking = () => {
    if (latestAmenityBooking?.amenityId) {
      router.push(`/amenity/${latestAmenityBooking.amenityId}`);
      return;
    }

    router.push('/calendar');
  };

  const goToSuggestedBooking = () => {
    if (!topSuggestion) {
      goToBooking();
      return;
    }

    const params = new URLSearchParams({
      date: topSuggestion.suggestedDate,
      slot: `${topSuggestion.suggestedStartTime}-${topSuggestion.suggestedEndTime}`,
    });
    router.push(`/amenity/${topSuggestion.amenityId}?${params.toString()}`);
  };

  return (
    <section className="group relative overflow-hidden rounded-2xl border border-slate-200/90 bg-gradient-to-br from-white via-sky-50/50 to-indigo-50/50 p-4 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-sky-200 hover:shadow-lg hover:shadow-sky-100/80 dark:border-slate-700/70 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800/90 dark:hover:border-sky-700/60 dark:hover:shadow-sky-950/40">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_80%_12%,rgba(59,130,246,0.2),transparent_42%),radial-gradient(circle_at_15%_78%,rgba(99,102,241,0.15),transparent_50%)] dark:bg-[radial-gradient(circle_at_80%_12%,rgba(59,130,246,0.18),transparent_42%),radial-gradient(circle_at_15%_78%,rgba(99,102,241,0.12),transparent_50%)]" />

      <div className="relative flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
        <Repeat2 className="h-4 w-4 text-blue-500" />
        Book Again
      </div>

      {loading ? (
        <div className="mt-4 animate-pulse space-y-2">
          <div className="h-4 w-24 rounded bg-slate-200 dark:bg-slate-700" />
          <div className="h-8 w-16 rounded bg-slate-200 dark:bg-slate-700" />
        </div>
      ) : loadError ? (
        <>
          <div className="mt-4 flex items-center gap-2 text-slate-500 dark:text-slate-400">
            <CalendarDays className="h-4 w-4" />
            <p className="text-sm">Unable to load recent bookings</p>
          </div>
          <Button
            type="button"
            onClick={() => setRefreshToken((prev) => prev + 1)}
            variant="outline"
            className="mt-4 h-10 w-full rounded-xl border-slate-300/80 bg-white/70 text-slate-700 hover:bg-white hover:text-slate-900 dark:border-slate-700/70 dark:bg-slate-800/60 dark:text-slate-200 dark:hover:bg-slate-800 dark:hover:text-white"
          >
            Retry
          </Button>
        </>
      ) : latestAmenityBooking ? (
        <>
          <p className="mt-4 text-lg font-semibold text-slate-900 dark:text-white">{latestAmenityBooking.amenityName}</p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            {latestBookingDate
              ? `Last booked on ${formatDateInTimeZone(latestBookingDate, timeZone, {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}`
              : 'Ready for your next reservation'}
          </p>

          {topSuggestion && suggestionSlotLabel ? (
            <div className="mt-3 rounded-xl border border-sky-200/80 bg-sky-50/80 px-3 py-2.5 dark:border-sky-800/70 dark:bg-sky-950/30">
              <p className="text-[11px] uppercase tracking-wide text-sky-700 dark:text-sky-300">Smart pick</p>
              <p className="mt-1 text-xs text-slate-700 dark:text-slate-200 line-clamp-2">{topSuggestion.message}</p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 break-words">
                {topSuggestion.suggestedDate} • {suggestionSlotLabel}
              </p>
            </div>
          ) : null}

          <Button onClick={topSuggestion ? goToSuggestedBooking : goToBooking} className="mt-4 h-10 w-full rounded-xl bg-blue-600 text-white shadow-sm transition-all duration-200 hover:bg-blue-500 hover:shadow-md hover:shadow-blue-300/50 dark:hover:shadow-blue-900/40">
            {topSuggestion ? 'Book Suggested Slot' : 'Book Now'}
            <ArrowRight className="ml-2 h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
          </Button>
        </>
      ) : (
        <>
          <div className="mt-4 flex items-center gap-2 text-slate-500 dark:text-slate-400">
            <CalendarDays className="h-4 w-4" />
            <p className="text-sm">No recent bookings yet</p>
          </div>
          <Button onClick={() => router.push('/calendar')} variant="outline" className="mt-4 h-10 w-full rounded-xl border-slate-300/80 bg-white/70 text-slate-700 hover:bg-white hover:text-slate-900 dark:border-slate-700/70 dark:bg-slate-800/60 dark:text-slate-200 dark:hover:bg-slate-800 dark:hover:text-white">
            Start booking
          </Button>
        </>
      )}
    </section>
  );
}
