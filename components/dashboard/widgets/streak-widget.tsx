'use client';

import { useEffect, useMemo, useState } from 'react';
import { Flame, Trophy } from 'lucide-react';
import { getUserBookingStreak } from '@/lib/gamification-service';
import { Button } from '@/components/ui/button';

interface StreakWidgetProps {
  userEmail?: string;
  communityId?: string;
}

function getNextMilestone(streak: number): number {
  if (streak < 3) return 3;
  if (streak < 7) return 7;
  if (streak < 14) return 14;
  if (streak < 21) return 21;
  return streak;
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
  const [loadError, setLoadError] = useState(false);
  const [refreshToken, setRefreshToken] = useState(0);

  useEffect(() => {
    let isMounted = true;

    const loadStreak = async () => {
      if (!userEmail || !communityId) {
        if (isMounted) {
          setStreak(0);
          setLoadError(false);
          setLoading(false);
        }
        return;
      }

      setLoading(true);
      setLoadError(false);

      try {
        const value = await getUserBookingStreak(userEmail, communityId);
        if (isMounted) {
          setStreak(value);
        }
      } catch (error) {
        if (isMounted) {
          setStreak(0);
          setLoadError(true);
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
  }, [communityId, refreshToken, userEmail]);

  const message = useMemo(() => getStreakMessage(streak), [streak]);
  const hasStreak = streak > 0;
  const nextMilestone = useMemo(() => getNextMilestone(streak), [streak]);
  const milestoneProgress = useMemo(() => {
    if (nextMilestone === 0) return 0;
    return Math.min(100, Math.round((streak / nextMilestone) * 100));
  }, [nextMilestone, streak]);

  return (
    <section
      className={`group relative overflow-hidden rounded-2xl border border-slate-200/90 bg-gradient-to-br from-white via-amber-50/60 to-orange-50/60 p-4 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-amber-200 hover:shadow-lg hover:shadow-amber-100/80 dark:border-slate-700/70 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800/90 dark:hover:border-amber-700/60 dark:hover:shadow-amber-950/40 ${
        streak >= 7 ? 'before:pointer-events-none before:absolute before:inset-0 before:bg-gradient-to-br before:from-orange-500/12 before:to-transparent dark:before:from-orange-900/40' : ''
      }`}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_84%_14%,rgba(251,191,36,0.2),transparent_42%),radial-gradient(circle_at_14%_84%,rgba(249,115,22,0.16),transparent_50%)] dark:bg-[radial-gradient(circle_at_84%_14%,rgba(251,191,36,0.14),transparent_42%),radial-gradient(circle_at_14%_84%,rgba(249,115,22,0.12),transparent_50%)]" />

      <div className="relative">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
          <Flame className="h-4 w-4 text-orange-500" />
          Streak
        </div>

        {loading ? (
          <div className="mt-4 animate-pulse space-y-2">
            <div className="h-4 w-24 rounded bg-slate-200 dark:bg-slate-700" />
            <div className="h-8 w-16 rounded bg-slate-200 dark:bg-slate-700" />
          </div>
        ) : loadError ? (
          <div className="mt-4 space-y-2">
            <p className="text-sm text-slate-500 dark:text-slate-400">Could not load your streak right now.</p>
            <Button
              type="button"
              variant="outline"
              onClick={() => setRefreshToken((prev) => prev + 1)}
              className="h-8 rounded-lg border-slate-300/80 bg-white/70 px-3 text-xs text-slate-700 hover:bg-white hover:text-slate-900 dark:border-slate-700/70 dark:bg-slate-800/70 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              Retry streak
            </Button>
          </div>
        ) : (
          <>
            <div className="mt-4 flex items-end justify-between gap-3">
              <div>
                {hasStreak ? <p className="text-4xl leading-none" aria-hidden="true">🔥</p> : null}
                <p className={`mt-2 text-3xl font-bold leading-none ${hasStreak ? 'text-orange-500 dark:text-orange-400' : 'text-slate-500 dark:text-slate-500'}`}>{streak}</p>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">day streak</p>
              </div>

              {streak >= 7 ? (
                <div className="inline-flex items-center gap-1 rounded-lg border border-amber-300 bg-amber-100/80 px-2 py-1 text-xs font-medium text-amber-700 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-300">
                  <Trophy className="h-3.5 w-3.5" />
                  Milestone
                </div>
              ) : null}
            </div>

            <div className="mt-3 rounded-lg border border-white/60 bg-white/65 px-2.5 py-2 backdrop-blur-sm dark:border-slate-700/70 dark:bg-slate-800/70">
              <div className="flex items-center justify-between text-[11px] uppercase tracking-wide text-slate-500 dark:text-slate-400">
                <span>Next milestone</span>
                <span>{nextMilestone} days</span>
              </div>
              <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-500"
                  style={{ width: `${milestoneProgress}%` }}
                />
              </div>
            </div>

            {hasStreak ? (
              <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">{message}</p>
            ) : (
              <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">Start your streak with a booking today.</p>
            )}

            {streak >= 7 ? <p className="mt-2 text-xs italic text-amber-700 dark:text-yellow-400">Weekly consistency badge unlocked</p> : null}
          </>
        )}
      </div>
    </section>
  );
}
