'use client';

import type { ComponentType } from 'react';
import Link from 'next/link';
import { Activity, AlertTriangle, ArrowUpRight, CalendarClock, Home, Wrench } from 'lucide-react';

interface OperationsSummaryWidgetProps {
  totalAmenities: number;
  availableAmenities: number;
  blockedAmenities: number;
  upcomingBookings: number;
}

export function OperationsSummaryWidget({
  totalAmenities,
  availableAmenities,
  blockedAmenities,
  upcomingBookings,
}: OperationsSummaryWidgetProps) {
  return (
    <section className="rounded-2xl border border-slate-200/90 bg-white/90 p-5 shadow-sm dark:border-slate-800/70 dark:bg-slate-900/75">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
            Operations Summary
          </p>
          <h3 className="mt-1 text-lg font-semibold text-slate-900 dark:text-white">Today at a glance</h3>
        </div>
        <Activity className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <MetricChip
          icon={Home}
          label="Total Amenities"
          value={totalAmenities}
          tone="neutral"
        />
        <MetricChip
          icon={CalendarClock}
          label="Upcoming"
          value={upcomingBookings}
          tone="info"
        />
        <MetricChip
          icon={Wrench}
          label="Available"
          value={availableAmenities}
          tone="success"
        />
        <MetricChip
          icon={AlertTriangle}
          label="Blocked"
          value={blockedAmenities}
          tone={blockedAmenities > 0 ? 'warning' : 'neutral'}
        />
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <Link
          href="/admin/settings"
          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
        >
          Configure Settings
          <ArrowUpRight className="h-3.5 w-3.5" />
        </Link>
        <Link
          href="/bookings"
          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
        >
          View Bookings
          <ArrowUpRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </section>
  );
}

function MetricChip({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: ComponentType<{ className?: string }>;
  label: string;
  value: number;
  tone: 'neutral' | 'success' | 'warning' | 'info';
}) {
  const toneClass =
    tone === 'success'
      ? 'border-emerald-200 bg-emerald-50/70 text-emerald-700 dark:border-emerald-800/60 dark:bg-emerald-900/20 dark:text-emerald-300'
      : tone === 'warning'
      ? 'border-amber-200 bg-amber-50/70 text-amber-700 dark:border-amber-800/60 dark:bg-amber-900/20 dark:text-amber-300'
      : tone === 'info'
      ? 'border-sky-200 bg-sky-50/70 text-sky-700 dark:border-sky-800/60 dark:bg-sky-900/20 dark:text-sky-300'
      : 'border-slate-200 bg-slate-50/70 text-slate-700 dark:border-slate-700 dark:bg-slate-800/40 dark:text-slate-300';

  return (
    <div className={`rounded-xl border px-3 py-2 ${toneClass}`}>
      <div className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide">
        <Icon className="h-3.5 w-3.5" />
        <span>{label}</span>
      </div>
      <p className="mt-1 text-xl font-semibold leading-none">{value}</p>
    </div>
  );
}
