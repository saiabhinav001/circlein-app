import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { emailTemplates, sendEmail } from '@/lib/email-service';
import { sendPushToUserByEmail } from '@/lib/push-service';
import { generateICS } from '@/lib/ics-generator';

type ReminderType = '24h' | '1h' | '15min';

const REMINDER_WINDOWS: Array<{
  reminderType: ReminderType;
  targetMinutes: number;
  toleranceMinutes: number;
}> = [
  { reminderType: '24h', targetMinutes: 1440, toleranceMinutes: 30 },
  { reminderType: '1h', targetMinutes: 60, toleranceMinutes: 10 },
  { reminderType: '15min', targetMinutes: 15, toleranceMinutes: 5 },
];

function isAuthorized(request: NextRequest): boolean {
  const configuredSecret = process.env.CRON_SECRET;
  if (!configuredSecret) {
    return true;
  }

  const authHeader = request.headers.get('authorization') || '';
  const token = authHeader.replace('Bearer ', '').trim();
  const cronHeader = request.headers.get('x-cron-secret') || '';

  return token === configuredSecret || cronHeader === configuredSecret;
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

function parseDateTime(dateValue: string, timeValue: string): Date | null {
  if (!dateValue || !timeValue) {
    return null;
  }

  const candidate = new Date(`${dateValue}T${timeValue}`);
  return Number.isNaN(candidate.getTime()) ? null : candidate;
}

function parseTimeRange(selectedSlot: string): { start: string; end: string } | null {
  if (!selectedSlot || !selectedSlot.includes('-')) {
    return null;
  }

  const [start, end] = selectedSlot.split('-').map((value) => value.trim());
  if (!start || !end) {
    return null;
  }

  return { start, end };
}

function resolveBookingStart(booking: Record<string, unknown>): Date | null {
  const start = toDate(booking.startTime);
  if (start) {
    return start;
  }

  const fromDateAndTime = parseDateTime(String(booking.date || ''), String(booking.startTime || ''));
  if (fromDateAndTime) {
    return fromDateAndTime;
  }

  const selectedDate = String(booking.selectedDate || '');
  const slot = parseTimeRange(String(booking.selectedSlot || ''));
  if (selectedDate && slot) {
    return parseDateTime(selectedDate, slot.start);
  }

  return null;
}

function resolveBookingEnd(booking: Record<string, unknown>, bookingStart: Date): Date {
  const end = toDate(booking.endTime);
  if (end) {
    return end;
  }

  const fromDateAndTime = parseDateTime(String(booking.date || ''), String(booking.endTime || ''));
  if (fromDateAndTime) {
    return fromDateAndTime;
  }

  const selectedDate = String(booking.selectedDate || '');
  const slot = parseTimeRange(String(booking.selectedSlot || ''));
  if (selectedDate && slot) {
    const parsedEnd = parseDateTime(selectedDate, slot.end);
    if (parsedEnd) {
      return parsedEnd;
    }
  }

  return new Date(bookingStart.getTime() + 60 * 60 * 1000);
}

function getTimeSlotLabel(booking: Record<string, unknown>, bookingStart: Date, bookingEnd: Date): string {
  const selectedSlot = String(booking.selectedSlot || '').trim();
  if (selectedSlot) {
    return selectedSlot;
  }

  const startLabel = bookingStart.toISOString().slice(11, 16);
  const endLabel = bookingEnd.toISOString().slice(11, 16);
  return `${startLabel}-${endLabel}`;
}

function wasReminderAlreadySent(booking: Record<string, unknown>, reminderType: ReminderType): boolean {
  const sentTypes = Array.isArray(booking.reminderSentTypes)
    ? booking.reminderSentTypes.map((value) => String(value))
    : [];

  if (sentTypes.includes(reminderType)) {
    return true;
  }

  return reminderType === '1h' && Boolean(booking.reminderSent);
}

function normalizeSentTypes(booking: Record<string, unknown>, reminderType: ReminderType): string[] {
  const sentTypes = Array.isArray(booking.reminderSentTypes)
    ? booking.reminderSentTypes.map((value) => String(value))
    : [];

  if (!sentTypes.includes(reminderType)) {
    sentTypes.push(reminderType);
  }

  return sentTypes;
}

export async function GET(request: NextRequest) {
  try {
    if (!isAuthorized(request)) {
      return NextResponse.json({ error: 'Unauthorized cron call' }, { status: 401 });
    }

    const now = new Date();
    const bookingsSnapshot = await adminDb
      .collection('bookings')
      .where('status', '==', 'confirmed')
      .get();

    let remindersSent = 0;
    const sentByTier: Record<ReminderType, number> = {
      '24h': 0,
      '1h': 0,
      '15min': 0,
    };
    const tiersTriggered = new Set<ReminderType>();

    for (const doc of bookingsSnapshot.docs) {
      const booking = doc.data() as Record<string, unknown>;
      const bookingStart = resolveBookingStart(booking);
      if (!bookingStart) {
        continue;
      }

      const bookingEnd = resolveBookingEnd(booking, bookingStart);
      const minutesUntilStart = (bookingStart.getTime() - now.getTime()) / (1000 * 60);

      const matchedWindows = REMINDER_WINDOWS.filter((window) => {
        return Math.abs(minutesUntilStart - window.targetMinutes) <= window.toleranceMinutes;
      });

      if (matchedWindows.length === 0) {
        continue;
      }

      let userEmail = String(booking.userEmail || '').trim();
      let userName = String(booking.userName || '').trim();

      if ((!userEmail || !userName) && booking.userId) {
        const userDoc = await adminDb.collection('users').doc(String(booking.userId)).get();
        const user = userDoc.data() as Record<string, unknown> | undefined;

        if (!userEmail) {
          userEmail = String(user?.email || '').trim();
        }

        if (!userName) {
          userName = String(user?.name || '').trim();
        }
      }

      if (!userEmail) {
        continue;
      }

      const dateLabel = String(booking.date || booking.selectedDate || bookingStart.toISOString().slice(0, 10));
      const timeSlot = getTimeSlotLabel(booking, bookingStart, bookingEnd);

      for (const window of matchedWindows) {
        if (wasReminderAlreadySent(booking, window.reminderType)) {
          continue;
        }

        const template = emailTemplates.bookingReminder({
          userName: userName || 'Resident',
          amenityName: String(booking.amenityName || 'Amenity'),
          date: dateLabel,
          timeSlot,
          bookingId: doc.id,
        });

        const ics = generateICS({
          title: `${String(booking.amenityName || 'Amenity')} Booking - CircleIn`,
          description: `Your booking at ${String(booking.amenityName || 'Amenity')}`,
          location: String(booking.amenityName || 'Amenity'),
          startDate: bookingStart,
          endDate: bookingEnd,
          organizerEmail: process.env.EMAIL_USER || 'circleinapp1@gmail.com',
          attendeeEmail: userEmail,
        });

        const result = await sendEmail({
          to: userEmail,
          subject: template.subject,
          html: template.html,
          attachments: [
            {
              filename: 'booking.ics',
              content: ics,
              contentType: 'text/calendar; charset=utf-8; method=REQUEST',
            },
          ],
        });

        if (!result.success) {
          continue;
        }

        await sendPushToUserByEmail(userEmail, {
          title: `Upcoming booking: ${String(booking.amenityName || 'Amenity')}`,
          body: `Starts at ${timeSlot}. Tap to view details.`,
          url: '/bookings',
          data: {
            type: 'booking-reminder',
            bookingId: doc.id,
            reminderType: window.reminderType,
          },
        });

        const updatedReminderTypes = normalizeSentTypes(booking, window.reminderType);
        const updatePayload: Record<string, unknown> = {
          reminderSentTypes: updatedReminderTypes,
          reminderSentAt: new Date().toISOString(),
          reminderTypeLastSent: window.reminderType,
        };

        if (window.reminderType === '1h') {
          updatePayload.reminderSent = true;
        }

        await adminDb.collection('bookings').doc(doc.id).update(updatePayload);
        booking.reminderSentTypes = updatedReminderTypes;
        if (window.reminderType === '1h') {
          booking.reminderSent = true;
        }

        remindersSent += 1;
        sentByTier[window.reminderType] += 1;
        tiersTriggered.add(window.reminderType);
      }
    }

    return NextResponse.json({
      success: true,
      remindersSent,
      sentByTier,
      reminderTypesTriggered: Array.from(tiersTriggered),
      timestamp: new Date().toISOString(),
    });

  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
