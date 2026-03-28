'use client';

import { useEffect, useMemo, useState } from 'react';
import { Flame, Trophy } from 'lucide-react';
import { getUserBookingStreak } from '@/lib/gamification-service';

interface StreakWidgetProps {
  userEmail?: string;
  communityId?: string;
}

function getStreakMessage(streak: number): string {
  if (streak >= 14) {
    return 'Incredible consistency. Keep leading the way!';
  }

  if (streak >= 7) {
    return 'One full week of momentum. Great work.';
  }

  if (streak >= 3) {
    return 'You are building a healthy booking rhythm.';
  }

  if (streak >= 1) {
    return 'You started a streak. Book tomorrow to continue.';
  }

  return 'Start a booking streak by reserving an amenity today.';
}

export function StreakWidget({ userEmail, communityId }: StreakWidgetProps) {
  const [loading, setLoading] = useState(true);
  const [streak, setStreak] = useState(0);

  useEffect(() => {
    let isMounted = true;

    const loadStreak = async () => {
      if (!userEmail || !communityId) {
        if (isMounted) {
          setStreak(0);
          setLoading(false);
        }
        return;
      }

      setLoading(true);

      try {
        const value = await getUserBookingStreak(userEmail, communityId);
        if (isMounted) {
          setStreak(value);
        }
      } catch (error) {
        if (isMounted) {
          setStreak(0);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadStreak();

    return () => {
      isMounted = false;
    };
  }, [communityId, userEmail]);

  const message = useMemo(() => getStreakMessage(streak), [streak]);

  return (
    <section className="rounded-2xl border border-slate-200/90 dark:border-slate-800/70 bg-white/80 dark:bg-slate-900/70 p-4 sm:p-5 shadow-sm">
      <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
        <Flame className="h-4 w-4 text-orange-500" />
        Booking Streak
      </div>

      {loading ? (
        <div className="mt-4 space-y-2">
          <div className="h-8 w-20 rounded bg-slate-200 dark:bg-slate-700/70" />
          <div className="h-4 w-44 rounded bg-slate-100 dark:bg-slate-800/60" />
        </div>
      ) : (
        <>
          <div className="mt-4 flex items-end justify-between">
            <div>
              <p className="text-3xl font-bold leading-none text-slate-900 dark:text-white">{streak}</p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">consecutive day{streak === 1 ? '' : 's'}</p>
            </div>
            <div className="rounded-full bg-orange-100 px-3 py-1 text-xs font-medium text-orange-700 dark:bg-orange-900/20 dark:text-orange-300">
              {streak >= 7 ? 'On fire' : streak >= 1 ? 'Active' : 'Start now'}
            </div>
          </div>

          <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">{message}</p>

          {streak >= 7 && (
            <div className="mt-3 inline-flex items-center gap-1 rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700 dark:border-amber-800/60 dark:bg-amber-950/30 dark:text-amber-300">
              <Trophy className="h-3.5 w-3.5" />
              Weekly consistency badge unlocked
            </div>
          )}
        </>
      )}
    </section>
  );
}
