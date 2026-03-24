'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, TrendingUp, Clock, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

interface SmartBookingSuggestion {
  id: string;
  type: 'habit' | 'opportunity';
  amenityId: string;
  amenityName: string;
  selectedDate: string;
  selectedSlot: string;
  confidence: number;
  reason: string;
  text: string;
}

function buildBookingRange(selectedDate: string, selectedSlot: string): { start: Date; end: Date } | null {
  const [slotStart, slotEnd] = selectedSlot.split('-');
  if (!slotStart || !slotEnd) {
    return null;
  }

  const [startHours, startMinutes] = slotStart.split(':').map(Number);
  const [endHours, endMinutes] = slotEnd.split(':').map(Number);

  if (
    Number.isNaN(startHours) || Number.isNaN(startMinutes) ||
    Number.isNaN(endHours) || Number.isNaN(endMinutes)
  ) {
    return null;
  }

  const start = new Date(`${selectedDate}T00:00:00`);
  const end = new Date(`${selectedDate}T00:00:00`);

  start.setHours(startHours, startMinutes, 0, 0);
  end.setHours(endHours, endMinutes, 0, 0);

  return { start, end };
}

export function SmartSuggestionsCard() {
  const [loading, setLoading] = useState(true);
  const [bookingIdInProgress, setBookingIdInProgress] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<SmartBookingSuggestion[]>([]);
  const router = useRouter();

  useEffect(() => {
    let isMounted = true;

    const fetchSuggestions = async () => {
      try {
        const response = await fetch('/api/recommendations/smart', { cache: 'no-store' });
        const data = await response.json();

        if (isMounted) {
          setSuggestions(Array.isArray(data?.suggestions) ? data.suggestions : []);
        }
      } catch (error) {
        console.error('Failed to load smart suggestions:', error);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchSuggestions();

    return () => {
      isMounted = false;
    };
  }, []);

  const hasSuggestions = useMemo(() => suggestions.length > 0, [suggestions]);

  const handleQuickBook = async (suggestion: SmartBookingSuggestion) => {
    const range = buildBookingRange(suggestion.selectedDate, suggestion.selectedSlot);
    if (!range) {
      toast.error('Could not parse suggested time slot.');
      return;
    }

    try {
      setBookingIdInProgress(suggestion.id);

      const response = await fetch('/api/bookings/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amenityId: suggestion.amenityId,
          amenityName: suggestion.amenityName,
          startTime: range.start.toISOString(),
          endTime: range.end.toISOString(),
          attendees: [],
          selectedDate: range.start.toISOString(),
          selectedSlot: suggestion.selectedSlot,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || 'Unable to create booking from suggestion');
      }

      if (data.status === 'confirmed') {
        toast.success(`Booked ${suggestion.amenityName} for ${suggestion.selectedSlot}`);
      } else {
        toast.success(`Added to waitlist for ${suggestion.amenityName} at ${suggestion.selectedSlot}`);
      }

      router.push('/bookings');
      router.refresh();
    } catch (error) {
      console.error('Smart booking failed:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create booking.');
    } finally {
      setBookingIdInProgress(null);
    }
  };

  if (loading) {
    return (
      <div className="mb-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/70 p-4 sm:p-5">
        <div className="h-5 w-48 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
        <div className="mt-3 h-4 w-full animate-pulse rounded bg-slate-100 dark:bg-slate-800" />
        <div className="mt-2 h-4 w-4/5 animate-pulse rounded bg-slate-100 dark:bg-slate-800" />
      </div>
    );
  }

  if (!hasSuggestions) {
    return null;
  }

  return (
    <section className="mb-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-950 p-4 sm:p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="rounded-full bg-amber-100 p-2 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-semibold text-slate-900 dark:text-slate-100">Smart Suggestions</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">Personalized from your booking patterns and crowd trends</p>
          </div>
        </div>
        <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-300">
          Free local AI
        </Badge>
      </div>

      <div className="space-y-3">
        {suggestions.map((suggestion) => {
          const inProgress = bookingIdInProgress === suggestion.id;
          return (
            <article key={suggestion.id} className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white/80 dark:bg-slate-900/70 p-3 sm:p-4">
              <div className="mb-2 flex items-start justify-between gap-2">
                <p className="text-sm text-slate-800 dark:text-slate-200">{suggestion.text}</p>
                <Badge className={suggestion.type === 'habit' ? 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300'}>
                  {suggestion.type === 'habit' ? <TrendingUp className="mr-1 h-3 w-3" /> : <Clock className="mr-1 h-3 w-3" />}
                  {suggestion.type === 'habit' ? 'Habit' : 'Best time'}
                </Badge>
              </div>

              <div className="mb-3 flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                <span>{suggestion.amenityName}</span>
                <span>•</span>
                <span>{suggestion.selectedDate}</span>
                <span>•</span>
                <span>{suggestion.selectedSlot}</span>
                <span>•</span>
                <span>AI confidence {Math.round(suggestion.confidence * 100)}%</span>
              </div>

              <p className="mb-3 text-xs text-slate-500 dark:text-slate-400">{suggestion.reason}</p>

              <div className="flex items-center gap-2">
                <Button
                  onClick={() => handleQuickBook(suggestion)}
                  disabled={inProgress}
                  className="h-9 rounded-lg bg-slate-900 px-4 text-sm text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
                >
                  {inProgress ? (
                    <span className="inline-flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Booking...
                    </span>
                  ) : (
                    'Book now'
                  )}
                </Button>

                <Button
                  variant="outline"
                  className="h-9 rounded-lg text-sm"
                  onClick={() => router.push(`/amenity/${suggestion.amenityId}`)}
                >
                  Review slot
                </Button>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
