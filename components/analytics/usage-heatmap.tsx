'use client';

import { Fragment, useEffect, useMemo, useState } from 'react';

type HeatmapCell = {
  day: number;
  hour: number;
  count: number;
};

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function formatHourLabel(hour: number): string {
  if (hour === 0) return '12am';
  if (hour < 12) return `${hour}am`;
  if (hour === 12) return '12pm';
  return `${hour - 12}pm`;
}

function getCellColor(count: number): string {
  if (count === 0) return 'bg-slate-100 dark:bg-slate-800/60';
  if (count <= 2) return 'bg-blue-200 dark:bg-blue-900/40';
  if (count <= 5) return 'bg-blue-400 dark:bg-blue-700/70';
  return 'bg-blue-600 dark:bg-blue-500';
}

export default function UsageHeatmap({ amenityId, amenityName }: { amenityId: string; amenityName: string }) {
  const [loading, setLoading] = useState(true);
  const [cells, setCells] = useState<HeatmapCell[]>([]);

  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      setLoading(true);

      try {
        const response = await fetch(`/api/amenities/${amenityId}/heatmap`, { cache: 'no-store' });
        const payload = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(payload?.error || 'Failed to fetch usage heatmap');
        }

        if (isMounted) {
          setCells(Array.isArray(payload?.heatmap) ? payload.heatmap : []);
        }
      } catch {
        if (isMounted) {
          setCells([]);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    void load();

    return () => {
      isMounted = false;
    };
  }, [amenityId]);

  const cellMap = useMemo(() => {
    const map = new Map<string, number>();

    cells.forEach((cell) => {
      map.set(`${cell.day}-${cell.hour}`, Number(cell.count || 0));
    });

    return map;
  }, [cells]);

  const totalBookings = useMemo(() => {
    return Array.from(cellMap.values()).reduce((sum, value) => sum + value, 0);
  }, [cellMap]);

  if (loading) {
    return (
      <div className="mt-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
        <div className="h-5 w-52 rounded bg-slate-200 dark:bg-slate-700 animate-pulse" />
        <div className="mt-4 h-48 rounded bg-slate-100 dark:bg-slate-800/70 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="mt-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
        <div>
          <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">Usage Heatmap</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">Last 90 days for {amenityName}</p>
        </div>
        <div className="text-xs text-slate-500 dark:text-slate-400">Total tracked bookings: {totalBookings}</div>
      </div>

      {totalBookings === 0 ? (
        <p className="text-sm text-slate-500 dark:text-slate-400">No booking data yet for this amenity.</p>
      ) : (
        <>
          <div className="overflow-x-auto pb-1">
            <div className="min-w-[920px]">
              <div className="grid grid-cols-[56px_repeat(24,minmax(0,1fr))] gap-1 items-center">
                <div className="text-[10px] text-slate-400" />
                {Array.from({ length: 24 }).map((_, hour) => (
                  <div
                    key={`hour-${hour}`}
                    className="text-[10px] text-center text-slate-400 dark:text-slate-500"
                  >
                    {hour % 6 === 0 ? formatHourLabel(hour) : ''}
                  </div>
                ))}

                {DAY_LABELS.map((dayLabel, day) => (
                  <Fragment key={`day-row-${day}`}>
                    <div key={`day-${day}`} className="text-[11px] font-medium text-slate-500 dark:text-slate-400 pr-2">
                      {dayLabel}
                    </div>
                    {Array.from({ length: 24 }).map((_, hour) => {
                      const count = cellMap.get(`${day}-${hour}`) || 0;
                      return (
                        <div
                          key={`${day}-${hour}`}
                          title={`${count} booking${count === 1 ? '' : 's'} on ${dayLabel} at ${formatHourLabel(hour)}`}
                          className={`h-5 rounded-sm border border-white/60 dark:border-slate-900/50 ${getCellColor(count)}`}
                        />
                      );
                    })}
                  </Fragment>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-4 flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
            <span>Less busy</span>
            <div className="flex items-center gap-1">
              <span className="w-4 h-4 rounded-sm bg-slate-100 dark:bg-slate-800/60 border border-white/60 dark:border-slate-900/50" />
              <span className="w-4 h-4 rounded-sm bg-blue-200 dark:bg-blue-900/40 border border-white/60 dark:border-slate-900/50" />
              <span className="w-4 h-4 rounded-sm bg-blue-400 dark:bg-blue-700/70 border border-white/60 dark:border-slate-900/50" />
              <span className="w-4 h-4 rounded-sm bg-blue-600 dark:bg-blue-500 border border-white/60 dark:border-slate-900/50" />
            </div>
            <span>More busy</span>
          </div>
        </>
      )}
    </div>
  );
}
