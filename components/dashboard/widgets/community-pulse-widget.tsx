import { CalendarClock, Sparkles } from 'lucide-react';

interface CommunityPulseWidgetProps {
  availableAmenities: number;
  blockedAmenities: number;
  upcomingBookings: number;
  upcomingEvents?: number;
}

export function CommunityPulseWidget({
  availableAmenities,
  blockedAmenities,
  upcomingBookings,
  upcomingEvents = 0,
}: CommunityPulseWidgetProps) {
  const eventsCount = Math.max(upcomingEvents, blockedAmenities > 0 ? 1 : 0);
  const bookingsToday = Math.max(upcomingBookings, 0);

  return (
    <section className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-gray-900 to-gray-800 p-4 shadow-lg transition-all duration-200 hover:-translate-y-0.5 hover:border-white/20 hover:shadow-xl">
      <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl bg-purple-500" />

      <div className="pl-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-white">
          <Sparkles className="h-4 w-4 text-purple-400" />
          Community Pulse
        </div>

        <div className="mt-4">
          <div className="flex items-end justify-between gap-3">
            <p className="text-3xl font-bold text-white">{bookingsToday}</p>
            <p className="text-xs uppercase tracking-wide text-gray-400">bookings today</p>
          </div>

          <div className="my-2 border-t border-white/5" />

          <div className="flex items-end justify-between gap-3">
            <p className="text-3xl font-bold text-white">{eventsCount}</p>
            <p className="text-xs uppercase tracking-wide text-gray-400">upcoming events</p>
          </div>

          <div className="mt-3 inline-flex items-center gap-1 text-xs text-gray-400">
            <CalendarClock className="h-3.5 w-3.5" />
            {availableAmenities} amenities currently available
          </div>
        </div>
      </div>
    </section>
  );
}
