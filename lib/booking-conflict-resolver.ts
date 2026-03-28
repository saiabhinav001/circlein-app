export type BookingSlot = {
  amenityId: string;
  selectedDate: string;
  startTime: string;
  endTime: string;
};

export type ConflictResult =
  | { hasConflict: false }
  | { hasConflict: true; nextAvailableSlot: BookingSlot | null };

type NormalizedBooking = {
  status: string;
  startMinutes: number;
  endMinutes: number;
};

const SUGGESTION_DURATION_MINUTES = 60;
const END_OF_DAY_MINUTES = 22 * 60;

function parseClock(value: string): number | null {
  const [hoursRaw, minutesRaw] = value.split(':');
  const hours = Number(hoursRaw);
  const minutes = Number(minutesRaw);

  if (
    Number.isNaN(hours) ||
    Number.isNaN(minutes) ||
    hours < 0 ||
    hours > 23 ||
    minutes < 0 ||
    minutes > 59
  ) {
    return null;
  }

  return hours * 60 + minutes;
}

function formatClock(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

function roundUpToNextHour(totalMinutes: number): number {
  if (totalMinutes % 60 === 0) {
    return totalMinutes;
  }

  return totalMinutes + (60 - (totalMinutes % 60));
}

function toDate(value: unknown): Date | null {
  if (!value) {
    return null;
  }

  if (value instanceof Date) {
    return value;
  }

  if (typeof (value as { toDate?: () => Date }).toDate === 'function') {
    return (value as { toDate: () => Date }).toDate();
  }

  if (typeof value === 'string' || typeof value === 'number') {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  return null;
}

function extractSlot(data: Record<string, unknown>): { start: string; end: string } | null {
  const selectedSlot = typeof data.selectedSlot === 'string' ? data.selectedSlot : '';

  if (selectedSlot.includes('-')) {
    const [start, end] = selectedSlot.split('-').map((value) => value.trim());
    if (start && end) {
      return { start, end };
    }
  }

  const startDate = toDate(data.startTime);
  const endDate = toDate(data.endTime);

  if (!startDate || !endDate) {
    return null;
  }

  const start = `${String(startDate.getHours()).padStart(2, '0')}:${String(startDate.getMinutes()).padStart(2, '0')}`;
  const end = `${String(endDate.getHours()).padStart(2, '0')}:${String(endDate.getMinutes()).padStart(2, '0')}`;

  return { start, end };
}

function toNormalizedBooking(data: Record<string, unknown>): NormalizedBooking | null {
  const slot = extractSlot(data);
  if (!slot) {
    return null;
  }

  const startMinutes = parseClock(slot.start);
  const endMinutes = parseClock(slot.end);

  if (startMinutes === null || endMinutes === null || endMinutes <= startMinutes) {
    return null;
  }

  return {
    status: String(data.status || '').toLowerCase(),
    startMinutes,
    endMinutes,
  };
}

function timesOverlap(
  startA: number,
  endA: number,
  startB: number,
  endB: number
): boolean {
  return startA < endB && endA > startB;
}

export async function checkBookingConflict(
  db: FirebaseFirestore.Firestore,
  requested: BookingSlot
): Promise<ConflictResult> {
  const requestedStart = parseClock(requested.startTime);
  const requestedEnd = parseClock(requested.endTime);

  if (
    requestedStart === null ||
    requestedEnd === null ||
    requestedEnd <= requestedStart
  ) {
    return { hasConflict: false };
  }

  const snapshot = await db
    .collection('bookings')
    .where('amenityId', '==', requested.amenityId)
    .where('selectedDate', '==', requested.selectedDate)
    .get();

  const activeBookings = snapshot.docs
    .map((docSnapshot) => toNormalizedBooking(docSnapshot.data() as Record<string, unknown>))
    .filter((booking): booking is NormalizedBooking => booking !== null)
    .filter((booking) => booking.status !== 'cancelled');

  const overlappingBookings = activeBookings.filter((booking) =>
    timesOverlap(requestedStart, requestedEnd, booking.startMinutes, booking.endMinutes)
  );

  if (overlappingBookings.length === 0) {
    return { hasConflict: false };
  }

  const conflictEnd = Math.max(...overlappingBookings.map((booking) => booking.endMinutes));
  let candidateStart = roundUpToNextHour(conflictEnd);

  while (candidateStart + SUGGESTION_DURATION_MINUTES <= END_OF_DAY_MINUTES) {
    const candidateEnd = candidateStart + SUGGESTION_DURATION_MINUTES;

    const overlaps = activeBookings.some((booking) =>
      timesOverlap(candidateStart, candidateEnd, booking.startMinutes, booking.endMinutes)
    );

    if (!overlaps) {
      return {
        hasConflict: true,
        nextAvailableSlot: {
          amenityId: requested.amenityId,
          selectedDate: requested.selectedDate,
          startTime: formatClock(candidateStart),
          endTime: formatClock(candidateEnd),
        },
      };
    }

    candidateStart += SUGGESTION_DURATION_MINUTES;
  }

  return {
    hasConflict: true,
    nextAvailableSlot: null,
  };
}
