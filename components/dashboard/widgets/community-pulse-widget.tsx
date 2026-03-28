import { Activity, Ban, CalendarClock } from 'lucide-react';

interface CommunityPulseWidgetProps {
  availableAmenities: number;
  blockedAmenities: number;
  upcomingBookings: number;
}

export function CommunityPulseWidget({
  availableAmenities,
  blockedAmenities,
  upcomingBookings,
}: CommunityPulseWidgetProps) {
  const stats = [
    {
      label: 'Available',
      value: availableAmenities,
      caption: 'Amenities open now',
      icon: Activity,
      tone: 'text-emerald-600 dark:text-emerald-400',
    },
    {
      label: 'Upcoming',
      value: upcomingBookings,
      caption: 'Bookings on your calendar',
      icon: CalendarClock,
      tone: 'text-blue-600 dark:text-blue-400',
    },
    {
      label: 'Blocked',
      value: blockedAmenities,
      caption: blockedAmenities > 0 ? 'Temporarily unavailable' : 'Everything is operational',
      icon: Ban,
      tone: blockedAmenities > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-slate-500 dark:text-slate-400',
    },
  ];

  return (
    <section className="rounded-2xl border border-slate-200/90 dark:border-slate-800/70 bg-white/80 dark:bg-slate-900/70 p-4 sm:p-5 shadow-sm">
      <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Community Pulse</h3>
      <div className="mt-3 space-y-2.5">
        {stats.map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.label} className="rounded-xl border border-slate-200 dark:border-slate-700/80 bg-slate-50/70 dark:bg-slate-800/40 px-3 py-2.5">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Icon className={`h-3.5 w-3.5 ${item.tone}`} />
                  <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">{item.label}</p>
                </div>
                <p className="text-lg font-semibold text-slate-900 dark:text-white">{item.value}</p>
              </div>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{item.caption}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
