'use client';

import { CalendarClock, Sparkles } from 'lucide-react';

interface CommunityPulseWidgetProps {
  totalAmenities?: number;
  availableAmenities: number;
  blockedAmenities: number;
  upcomingBookings: number;
  upcomingEvents?: number;
}

export function CommunityPulseWidget({
  totalAmenities,
  availableAmenities,
  blockedAmenities,
  upcomingBookings,
  upcomingEvents = 0,
}: CommunityPulseWidgetProps) {
  const total = Math.max(totalAmenities || availableAmenities + blockedAmenities, 1);
  const eventsCount = Math.max(upcomingEvents, blockedAmenities > 0 ? 1 : 0);
  const bookingsToday = Math.max(upcomingBookings, 0);
  const occupancySignal = availableAmenities > blockedAmenities ? 'Steady' : 'Needs attention';

  const availabilityScore = Math.round((availableAmenities / total) * 60);
  const demandScore = Math.min(30, bookingsToday * 6);
  const maintenancePenalty = Math.min(20, blockedAmenities * 8);
  const pulseScore = Math.max(0, Math.min(100, availabilityScore + demandScore - maintenancePenalty));

  const pulseLabel =
    pulseScore >= 75 ? 'Excellent' : pulseScore >= 55 ? 'Healthy' : pulseScore >= 35 ? 'Watchlist' : 'At risk';

  const pulseHint =
    blockedAmenities > 0
      ? 'Maintenance impact detected. Highlight alternatives to reduce resident friction.'
      : bookingsToday >= 4
        ? 'Strong activity today. Consider spotlighting high-demand amenities.'
        : 'Capacity is calm. Good time to drive engagement with announcements or polls.';

  return (
    <section className="group relative overflow-hidden rounded-2xl border border-slate-200/90 bg-gradient-to-br from-white via-fuchsia-50/50 to-rose-50/50 p-4 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-fuchsia-200 hover:shadow-lg hover:shadow-fuchsia-100/70 dark:border-slate-700/70 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800/90 dark:hover:border-fuchsia-700/60 dark:hover:shadow-fuchsia-950/35">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_85%_12%,rgba(217,70,239,0.18),transparent_45%),radial-gradient(circle_at_16%_85%,rgba(244,63,94,0.16),transparent_48%)] dark:bg-[radial-gradient(circle_at_85%_12%,rgba(217,70,239,0.15),transparent_45%),radial-gradient(circle_at_16%_85%,rgba(244,63,94,0.12),transparent_48%)]" />

      <div className="relative">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
          <Sparkles className="h-4 w-4 text-fuchsia-500" />
          Community Pulse
        </div>

        <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
          <div className="rounded-xl border border-white/50 bg-white/65 px-3 py-2.5 backdrop-blur-sm dark:border-slate-700/70 dark:bg-slate-800/70">
            <p className="text-[11px] uppercase tracking-wide text-slate-500 dark:text-slate-400">bookings today</p>
            <p className="mt-1 text-2xl font-semibold text-slate-900 dark:text-white">{bookingsToday}</p>
          </div>

          <div className="rounded-xl border border-white/50 bg-white/65 px-3 py-2.5 backdrop-blur-sm dark:border-slate-700/70 dark:bg-slate-800/70">
            <p className="text-[11px] uppercase tracking-wide text-slate-500 dark:text-slate-400">pulse score</p>
            <p className="mt-1 text-2xl font-semibold text-slate-900 dark:text-white">{pulseScore}</p>
          </div>

          <div className="rounded-xl border border-white/50 bg-white/65 px-3 py-2.5 backdrop-blur-sm sm:col-span-2 dark:border-slate-700/70 dark:bg-slate-800/70">
            <div className="flex items-center justify-between gap-3">
              <div className="inline-flex items-center gap-1 text-xs text-slate-600 dark:text-slate-300">
                <CalendarClock className="h-3.5 w-3.5" />
                {availableAmenities}/{total} amenities available
              </div>
              <span className="rounded-full bg-fuchsia-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-fuchsia-700 dark:bg-fuchsia-900/40 dark:text-fuchsia-300">
                {occupancySignal}
              </span>
            </div>

            <div className="mt-2 flex items-center justify-between gap-3">
              <span className="text-[11px] uppercase tracking-wide text-slate-500 dark:text-slate-400">community health</span>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-700 dark:bg-slate-700/70 dark:text-slate-200">
                {pulseLabel}
              </span>
            </div>

            {blockedAmenities > 0 && (
              <p className="mt-1.5 text-xs text-amber-700 dark:text-amber-300">
                {blockedAmenities} amenit{blockedAmenities === 1 ? 'y is' : 'ies are'} temporarily unavailable.
              </p>
            )}

            <p className="mt-1.5 text-xs text-slate-600 dark:text-slate-300">{pulseHint}</p>
            <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">{eventsCount} event signal{eventsCount === 1 ? '' : 's'} tracked this week.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
