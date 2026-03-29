export type BookingRecord = {
  amenityId: string;
  amenityName: string;
  date: string;
  startTime: string;
  endTime: string;
  status: string;
};

export type BookingSuggestion = {
  type: 'usual-time-available' | 'not-booked-recently';
  amenityId: string;
  amenityName: string;
  suggestedDate: string;
  suggestedStartTime: string;
  suggestedEndTime: string;
  message: string;
};

type GroupedAmenity = {
  amenityId: string;
  amenityName: string;
  records: BookingRecord[];
};

type RankedSuggestion = {
  score: number;
  suggestion: BookingSuggestion;
};

const DAYS_14_MS = 14 * 24 * 60 * 60 * 1000;

function toDate(value: string): Date | null {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function formatDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function tomorrowFrom(today: Date): string {
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  return formatDate(tomorrow);
}

function groupByAmenity(records: BookingRecord[]): GroupedAmenity[] {
  const groups = new Map<string, GroupedAmenity>();

  records.forEach((record) => {
    const existing = groups.get(record.amenityId);
    if (existing) {
      existing.records.push(record);
      return;
    }

    groups.set(record.amenityId, {
      amenityId: record.amenityId,
      amenityName: record.amenityName,
      records: [record],
    });
  });

  return Array.from(groups.values());
}

function getMostCommonSlot(records: BookingRecord[]): {
  startTime: string;
  endTime: string;
  count: number;
} | null {
  const slotCounts = new Map<string, number>();

  records.forEach((record) => {
    const slotKey = `${record.startTime}-${record.endTime}`;
    slotCounts.set(slotKey, (slotCounts.get(slotKey) || 0) + 1);
  });

  let bestSlot = '';
  let bestCount = 0;

  slotCounts.forEach((count, slot) => {
    if (count > bestCount) {
      bestSlot = slot;
      bestCount = count;
    }
  });

  if (!bestSlot) {
    return null;
  }

  const [startTime, endTime] = bestSlot.split('-');
  if (!startTime || !endTime) {
    return null;
  }

  return { startTime, endTime, count: bestCount };
}

function getMostRecentDate(records: BookingRecord[]): Date | null {
  const dates = records
    .map((record) => toDate(record.date))
    .filter((date): date is Date => date !== null)
    .sort((a, b) => b.getTime() - a.getTime());

  return dates[0] || null;
}

export function analyzeBookingPatterns(
  bookingHistory: BookingRecord[],
  today: Date
): BookingSuggestion[] {
  if (!Array.isArray(bookingHistory) || bookingHistory.length === 0) {
    return [];
  }

  const normalizedToday = new Date(today);
  normalizedToday.setHours(0, 0, 0, 0);

  const relevantBookings = bookingHistory.filter((record) => {
    if (!record || typeof record !== 'object') {
      return false;
    }

    const amenityId = typeof record.amenityId === 'string' ? record.amenityId.trim() : '';
    const amenityName = typeof record.amenityName === 'string' ? record.amenityName.trim() : '';
    const date = typeof record.date === 'string' ? record.date.trim() : '';
    const startTime = typeof record.startTime === 'string' ? record.startTime.trim() : '';
    const endTime = typeof record.endTime === 'string' ? record.endTime.trim() : '';

    if (!amenityId || !amenityName || !date || !startTime || !endTime) {
      return false;
    }

    const status = String(record.status || '').toLowerCase();
    return status === 'confirmed' || status === 'completed';
  });

  if (relevantBookings.length === 0) {
    return [];
  }

  const grouped = groupByAmenity(relevantBookings);
  const ranked: RankedSuggestion[] = [];
  const suggestedDate = tomorrowFrom(normalizedToday);

  grouped.forEach((group) => {
    const commonSlot = getMostCommonSlot(group.records);
    const mostRecentDate = getMostRecentDate(group.records);

    if (commonSlot && commonSlot.count >= 3) {
      ranked.push({
        score: 100 + commonSlot.count,
        suggestion: {
          type: 'usual-time-available',
          amenityId: group.amenityId,
          amenityName: group.amenityName,
          suggestedDate,
          suggestedStartTime: commonSlot.startTime,
          suggestedEndTime: commonSlot.endTime,
          message: `You usually book ${group.amenityName} at ${commonSlot.startTime}. Tomorrow's slot is likely available - book it now.`,
        },
      });
    }

    if (mostRecentDate) {
      const diffMs = normalizedToday.getTime() - mostRecentDate.getTime();
      if (diffMs > DAYS_14_MS) {
        const fallbackSlot = commonSlot || {
          startTime: group.records[0].startTime,
          endTime: group.records[0].endTime,
        };

        ranked.push({
          score: 50 + Math.floor(diffMs / (24 * 60 * 60 * 1000)),
          suggestion: {
            type: 'not-booked-recently',
            amenityId: group.amenityId,
            amenityName: group.amenityName,
            suggestedDate,
            suggestedStartTime: fallbackSlot.startTime,
            suggestedEndTime: fallbackSlot.endTime,
            message: `You haven't booked ${group.amenityName} in over 2 weeks.`,
          },
        });
      }
    }
  });

  return ranked
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map((entry) => entry.suggestion);
}
