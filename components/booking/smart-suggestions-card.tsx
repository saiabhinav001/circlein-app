'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, TrendingUp, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface BookingSuggestion {
  type: 'usual-time-available' | 'not-booked-recently';
  amenityId: string;
  amenityName: string;
  suggestedDate: string;
  suggestedStartTime: string;
  suggestedEndTime: string;
  message: string;
}

export function SmartSuggestionsCard() {
  const [loading, setLoading] = useState(true);
  const [suggestions, setSuggestions] = useState<BookingSuggestion[]>([]);
  const router = useRouter();

  useEffect(() => {
    let isMounted = true;

    const fetchSuggestions = async () => {
      try {
        const response = await fetch('/api/bookings/suggestions', { cache: 'no-store' });
        if (!response.ok) {
          throw new Error('Failed to fetch suggestions');
        }

        const data = await response.json();

        if (isMounted) {
          setSuggestions(Array.isArray(data?.suggestions) ? data.suggestions : []);
        }
      } catch {
        if (isMounted) {
          setSuggestions([]);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    void fetchSuggestions();

    return () => {
      isMounted = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="mb-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/70 p-4 sm:p-5">
        <div className="h-5 w-48 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
        <div className="mt-3 h-4 w-full animate-pulse rounded bg-slate-100 dark:bg-slate-800" />
        <div className="mt-2 h-4 w-4/5 animate-pulse rounded bg-slate-100 dark:bg-slate-800" />
      </div>
    );
  }

  if (suggestions.length === 0) {
    return null;
  }

  return (
    <section className="mb-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-950 p-4 sm:p-5 shadow-sm">
      <div className="mb-4 flex flex-col xs:flex-row xs:items-center xs:justify-between gap-3">
        <div className="flex items-start xs:items-center gap-2.5 min-w-0">
          <div className="rounded-full bg-amber-100 p-2 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300 shrink-0">
            <Sparkles className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <h2 className="text-sm sm:text-base font-semibold text-slate-900 dark:text-slate-100">Smart Suggestions</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed break-words">Personalized from your booking history</p>
          </div>
        </div>
        <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-300 self-start xs:self-auto whitespace-normal text-center">
          Smart booking
        </Badge>
      </div>

      <div className="space-y-3">
        {suggestions.map((suggestion) => {
          const slotLabel = `${suggestion.suggestedStartTime}-${suggestion.suggestedEndTime}`;

          return (
            <article key={`${suggestion.type}-${suggestion.amenityId}-${suggestion.suggestedDate}-${slotLabel}`} className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white/80 dark:bg-slate-900/70 p-3 sm:p-4">
              <div className="mb-2 flex flex-col xs:flex-row xs:items-start xs:justify-between gap-2">
                <p className="text-sm text-slate-800 dark:text-slate-200 leading-relaxed break-words">{suggestion.message}</p>
                <Badge className={cn('self-start xs:self-auto whitespace-nowrap', suggestion.type === 'usual-time-available' ? 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300')}>
                  {suggestion.type === 'usual-time-available' ? <TrendingUp className="mr-1 h-3 w-3" /> : <Clock className="mr-1 h-3 w-3" />}
                  {suggestion.type === 'usual-time-available' ? 'Usual time' : 'Recent gap'}
                </Badge>
              </div>

              <div className="mb-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
                <span>{suggestion.amenityName}</span>
                <span>•</span>
                <span>{suggestion.suggestedDate}</span>
                <span>•</span>
                <span>{slotLabel}</span>
              </div>

              <div className="grid grid-cols-1 gap-2">
                <Button
                  onClick={() => router.push(`/amenity/${suggestion.amenityId}`)}
                  className="h-9 w-full rounded-lg bg-slate-900 px-4 text-sm text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
                >
                  Book now
                </Button>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
