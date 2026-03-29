export type WeeklyReportData = {
  weekStart: string;
  weekEnd: string;
  totalBookings: number;
  completedBookings: number;
  cancelledBookings: number;
  noShowRate: number;
  peakDay: string;
  peakHour: number;
  mostPopularAmenity: {
    amenityId: string;
    amenityName: string;
    bookingCount: number;
  } | null;
  generatedAt: string;
};

function toDate(value: string): Date | null {
  if (!value) {
    return null;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function toDateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function resolveBookingDate(booking: { date: string; startTime: string }): Date | null {
  const byStart = toDate(booking.startTime);
  if (byStart) {
    return byStart;
  }

  return toDate(booking.date);
}

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export function generateWeeklyReport(
  bookings: Array<{
    amenityId: string;
    amenityName: string;
    status: string;
    date: string;
    startTime: string;
  }>,
  weekStart: Date,
  weekEnd: Date
): WeeklyReportData {
  const start = new Date(weekStart);
  start.setHours(0, 0, 0, 0);

  const end = new Date(weekEnd);
  end.setHours(23, 59, 59, 999);

  const weekBookings = bookings.filter((booking) => {
    const date = resolveBookingDate(booking);
    return date ? date >= start && date <= end : false;
  });

  const totalBookings = weekBookings.length;
  const completedBookings = weekBookings.filter((booking) => String(booking.status).toLowerCase() === 'completed').length;
  const cancelledBookings = weekBookings.filter((booking) => String(booking.status).toLowerCase() === 'cancelled').length;
  const noShowRate = totalBookings > 0 ? cancelledBookings / totalBookings : 0;

  const bookingsByDay = new Map<number, number>();
  const bookingsByHour = new Map<number, number>();
  const bookingsByAmenity = new Map<string, { amenityName: string; bookingCount: number }>();

  weekBookings.forEach((booking) => {
    const bookingDate = resolveBookingDate(booking);
    if (!bookingDate) {
      return;
    }

    const day = bookingDate.getDay();
    bookingsByDay.set(day, (bookingsByDay.get(day) || 0) + 1);

    const hour = bookingDate.getHours();
    bookingsByHour.set(hour, (bookingsByHour.get(hour) || 0) + 1);

    const amenityId = String(booking.amenityId || 'unknown');
    const amenityName = String(booking.amenityName || 'Unknown Amenity');
    const current = bookingsByAmenity.get(amenityId) || { amenityName, bookingCount: 0 };
    current.bookingCount += 1;
    current.amenityName = amenityName;
    bookingsByAmenity.set(amenityId, current);
  });

  let peakDay = 'Monday';
  let peakDayCount = -1;
  bookingsByDay.forEach((count, dayIndex) => {
    if (count > peakDayCount) {
      peakDayCount = count;
      peakDay = DAY_NAMES[dayIndex] || 'Monday';
    }
  });

  let peakHour = 0;
  let peakHourCount = -1;
  bookingsByHour.forEach((count, hour) => {
    if (count > peakHourCount) {
      peakHourCount = count;
      peakHour = hour;
    }
  });

  let mostPopularAmenity: WeeklyReportData['mostPopularAmenity'] = null;
  bookingsByAmenity.forEach((value, amenityId) => {
    if (!mostPopularAmenity || value.bookingCount > mostPopularAmenity.bookingCount) {
      mostPopularAmenity = {
        amenityId,
        amenityName: value.amenityName,
        bookingCount: value.bookingCount,
      };
    }
  });

  return {
    weekStart: toDateKey(start),
    weekEnd: toDateKey(end),
    totalBookings,
    completedBookings,
    cancelledBookings,
    noShowRate,
    peakDay,
    peakHour,
    mostPopularAmenity,
    generatedAt: new Date().toISOString(),
  };
}
