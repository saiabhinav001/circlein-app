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
  const hasStreak = streak > 0;

  return (
    <section
      className={`relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-gray-900 to-gray-800 p-4 shadow-lg transition-all duration-200 hover:-translate-y-0.5 hover:border-white/20 hover:shadow-xl ${
        streak >= 7 ? 'before:pointer-events-none before:absolute before:inset-0 before:bg-gradient-to-br before:from-orange-950/30 before:to-transparent' : ''
      }`}
    >
      <div className="relative">
        <div className="flex items-center gap-2 text-sm font-semibold text-white">
          <Flame className="h-4 w-4 text-orange-400" />
          Streak
        </div>

        {loading ? (
          <div className="mt-4 animate-pulse space-y-2">
            <div className="h-4 w-24 rounded bg-gray-700" />
            <div className="h-8 w-16 rounded bg-gray-700" />
          </div>
        ) : (
          <>
            <div className="mt-4 flex items-end justify-between gap-3">
              <div>
                {hasStreak ? <p className="text-4xl leading-none" aria-hidden="true">🔥</p> : null}
                <p className={`mt-2 text-3xl font-bold leading-none ${hasStreak ? 'text-orange-400' : 'text-gray-500'}`}>{streak}</p>
                <p className="mt-1 text-xs text-gray-400">day streak</p>
              </div>

              {streak >= 7 ? (
                <div className="inline-flex items-center gap-1 rounded-lg border border-amber-500/40 bg-amber-500/10 px-2 py-1 text-xs font-medium text-amber-300">
                  <Trophy className="h-3.5 w-3.5" />
                  Milestone
                </div>
              ) : null}
            </div>

            {hasStreak ? (
              <p className="mt-3 text-sm text-gray-300">{message}</p>
            ) : (
              <p className="mt-3 text-sm text-gray-500">🏃 Start your streak!</p>
            )}

            {streak >= 7 ? <p className="mt-2 text-xs italic text-yellow-400">Weekly consistency badge unlocked</p> : null}
          </>
        )}
      </div>
    </section>
  );
}
