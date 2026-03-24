export interface QueuedBookingPayload {
  amenityId: string;
  amenityName: string;
  startTime: string;
  endTime: string;
  attendees: string[];
  selectedDate: string;
  selectedSlot: string;
  userName: string;
  userFlatNumber: string;
}

const QUEUE_KEY = 'circlein-offline-booking-queue-v1';

function readQueue(): QueuedBookingPayload[] {
  if (typeof window === 'undefined') {
    return [];
  }

  try {
    const raw = localStorage.getItem(QUEUE_KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeQueue(queue: QueuedBookingPayload[]): void {
  if (typeof window === 'undefined') {
    return;
  }
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
}

export function enqueueOfflineBooking(payload: QueuedBookingPayload): void {
  const queue = readQueue();
  queue.push(payload);
  writeQueue(queue);
}

export async function flushOfflineBookings(): Promise<number> {
  const queue = readQueue();
  if (!queue.length) {
    return 0;
  }

  const failed: QueuedBookingPayload[] = [];
  let successCount = 0;

  for (const payload of queue) {
    try {
      const response = await fetch('/api/bookings/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        failed.push(payload);
      } else {
        successCount += 1;
      }
    } catch {
      failed.push(payload);
    }
  }

  writeQueue(failed);
  return successCount;
}

export function getOfflineQueueSize(): number {
  return readQueue().length;
}
