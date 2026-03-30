import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  setDoc,
  Timestamp,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { RecurringBookingCreateSchema } from '@/lib/schemas';

type BookingWindow = {
  start: Date;
  end: Date;
};

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

function overlaps(startA: Date, endA: Date, startB: Date, endB: Date): boolean {
  return startA.getTime() < endB.getTime() && endA.getTime() > startB.getTime();
}

function formatDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function toClock(date: Date): string {
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

/**
 * RECURRING BOOKINGS API
 * Allows users to book same slot for multiple weeks
 */

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const communityId = (session.user as any).communityId;
    if (!communityId) {
      return NextResponse.json({ error: 'Community ID not found' }, { status: 400 });
    }

    const body = await request.json();
    const parsedBody = RecurringBookingCreateSchema.safeParse(body);

    if (!parsedBody.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: parsedBody.error.issues },
        { status: 400 }
      );
    }

    const {
      amenityId,
      amenityName,
      startTime, // First booking start time
      endTime,
      selectedSlot,
      weeks, // Number of weeks to book (e.g., 4)
      frequency, // 'weekly' | 'biweekly'
    } = parsedBody.data;

    const firstStartTime = new Date(startTime);
    const firstEndTime = new Date(endTime);

    if (Number.isNaN(firstStartTime.getTime()) || Number.isNaN(firstEndTime.getTime())) {
      return NextResponse.json({ error: 'Invalid start or end time' }, { status: 400 });
    }

    if (firstEndTime <= firstStartTime) {
      return NextResponse.json({ error: 'End time must be after start time' }, { status: 400 });
    }

    let settingsData: any = {};
    try {
      const settingsSnapshot = await getDoc(doc(db, 'settings', communityId));
      settingsData = settingsSnapshot.data() || {};
    } catch {
      settingsData = {};
    }

    const maintenanceModeEnabled = Boolean(settingsData?.systemSettings?.enableMaintenanceMode);
    const isAdmin = (session.user as any).role === 'admin' || (session.user as any).role === 'super_admin';

    if (maintenanceModeEnabled && !isAdmin) {
      return NextResponse.json(
        { error: 'New bookings are temporarily disabled due to maintenance mode' },
        { status: 503 }
      );
    }

    const bookingRules = settingsData?.bookingRules || {};
    const toPositiveNumber = (value: any): number | null => {
      const parsed = Number(value);
      return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
    };

    const maxBookingDurationHours = toPositiveNumber(bookingRules.maxBookingDuration);
    const advanceBookingDays = toPositiveNumber(bookingRules.advanceBookingDays);
    const maxActiveBookings = toPositiveNumber(bookingRules.maxActiveBookings);
    const allowWeekendBookings = bookingRules.weekendBookings !== false;
    const bookingDurationHours =
      (firstEndTime.getTime() - firstStartTime.getTime()) / (1000 * 60 * 60);

    if (maxBookingDurationHours !== null && bookingDurationHours > maxBookingDurationHours) {
      return NextResponse.json(
        {
          error: `Booking duration cannot exceed ${maxBookingDurationHours} hour${maxBookingDurationHours === 1 ? '' : 's'}`,
        },
        { status: 400 }
      );
    }

    // Get amenity capacity
    let amenitySnap = await getDoc(doc(db, 'amenities', amenityId));
    if (!amenitySnap.exists()) {
      amenitySnap = await getDoc(doc(db, 'communities', communityId, 'amenities', amenityId));
    }

    if (!amenitySnap.exists()) {
      return NextResponse.json({ error: 'Amenity not found' }, { status: 404 });
    }

    const amenityData = amenitySnap.data() as any;
    if (typeof amenityData.communityId === 'string' && amenityData.communityId !== communityId) {
      return NextResponse.json({ error: 'Amenity does not belong to this community' }, { status: 403 });
    }

    const rawMaxPeople = Number(amenityData.maxPeople);
    const maxCapacity = Number.isFinite(rawMaxPeople) && rawMaxPeople > 0 ? rawMaxPeople : 1;

    let activeBookingCount = 0;
    if (maxActiveBookings !== null) {
      const userActiveBookingsQuery = query(
        collection(db, 'bookings'),
        where('communityId', '==', communityId),
        where('userEmail', '==', session.user.email),
        where('status', 'in', ['confirmed', 'pending_confirmation', 'waitlist'])
      );
      const userActiveBookingsSnapshot = await getDocs(userActiveBookingsQuery);
      activeBookingCount = userActiveBookingsSnapshot.size;
    }

    const activeAmenityBookingsQuery = query(
      collection(db, 'bookings'),
      where('communityId', '==', communityId),
      where('amenityId', '==', amenityId),
      where('status', 'in', ['confirmed', 'pending_confirmation'])
    );
    const activeAmenityBookingsSnapshot = await getDocs(activeAmenityBookingsQuery);
    const activeAmenityWindows: BookingWindow[] = activeAmenityBookingsSnapshot.docs
      .map((docSnapshot) => {
        const data = docSnapshot.data() as Record<string, unknown>;
        const start = toDate(data.startTime);
        const end = toDate(data.endTime);
        if (!start || !end || end <= start) {
          return null;
        }
        return { start, end };
      })
      .filter((window): window is BookingWindow => window !== null);

    const weekIncrement = frequency === 'weekly' ? 1 : 2;
    const now = new Date();

    const results: Array<{
      week: number;
      status: 'confirmed' | 'unavailable' | 'failed';
      bookingId?: string;
      reason?: string;
    }> = [];
    const parentBookingId = `recurring-${Date.now()}`;

    // Evaluate each recurring slot against current booking rules and capacity.
    for (let i = 0; i < weeks; i++) {
      const weekOffset = i * weekIncrement;
      const slotStart = new Date(firstStartTime);
      slotStart.setDate(slotStart.getDate() + weekOffset * 7);

      const slotEnd = new Date(firstEndTime);
      slotEnd.setDate(slotEnd.getDate() + weekOffset * 7);

      if (!allowWeekendBookings) {
        const dayOfWeek = slotStart.getDay();
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
        if (isWeekend) {
          results.push({
            week: weekOffset + 1,
            status: 'unavailable',
            reason: 'Weekend bookings are disabled by community policy',
          });
          continue;
        }
      }

      if (advanceBookingDays !== null) {
        const maxAllowedDate = new Date(now);
        maxAllowedDate.setDate(maxAllowedDate.getDate() + advanceBookingDays);
        if (slotStart.getTime() > maxAllowedDate.getTime()) {
          results.push({
            week: weekOffset + 1,
            status: 'unavailable',
            reason: `Booking exceeds advance booking limit (${advanceBookingDays} day${advanceBookingDays === 1 ? '' : 's'})`,
          });
          continue;
        }
      }

      if (maxActiveBookings !== null && activeBookingCount >= maxActiveBookings) {
        results.push({
          week: weekOffset + 1,
          status: 'unavailable',
          reason: `Active booking limit reached (${maxActiveBookings})`,
        });
        continue;
      }

      const overlappingBookingsCount = activeAmenityWindows.filter((bookingWindow) =>
        overlaps(slotStart, slotEnd, bookingWindow.start, bookingWindow.end)
      ).length;

      if (overlappingBookingsCount >= maxCapacity) {
        results.push({
          week: weekOffset + 1,
          status: 'unavailable',
          reason: 'Slot fully booked',
        });
        continue;
      }

      const recurringSlot = `${toClock(slotStart)}-${toClock(slotEnd)}`;

      // Create booking for this recurring slot.
      try {
        const bookingRef = doc(collection(db, 'bookings'));
        const bookingReference = bookingRef.id.substring(0, 8).toUpperCase();
        const qrAccessCode = Math.random().toString(36).substring(2, 10).toUpperCase();

        const bookingData = {
          userId: session.user.email,
          userEmail: session.user.email,
          userName: session.user.name || session.user.email.split('@')[0],
          userFlatNumber: (session.user as any).flatNumber || '',
          communityId: communityId,
          amenityId,
          amenityName,
          amenityType: amenityData.category || 'general',
          startTime: Timestamp.fromDate(slotStart),
          endTime: Timestamp.fromDate(slotEnd),
          selectedDate: formatDateKey(slotStart),
          selectedSlot: recurringSlot,
          timeSlot: recurringSlot,
          bookingReference,
          status: 'confirmed',
          attendees: [],
          qrId: qrAccessCode,
          isRecurring: true,
          recurringParentId: parentBookingId,
          recurringFrequency: frequency,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          reminderSent: false,
        };

        await setDoc(bookingRef, bookingData);

        activeAmenityWindows.push({ start: slotStart, end: slotEnd });
        activeBookingCount += 1;

        results.push({
          week: weekOffset + 1,
          status: 'confirmed',
          bookingId: bookingRef.id,
        });
      } catch (error: any) {
        results.push({
          week: weekOffset + 1,
          status: 'failed',
          reason: error?.message || 'Unknown error',
        });
      }
    }

    const successCount = results.filter((result) => result.status === 'confirmed').length;

    // Send email summary
    try {
      const { sendEmail } = await import('@/lib/email-service');

      const emailHtml = `
        <h2>Recurring Booking Summary</h2>
        <p>Hi ${session.user.name || session.user.email.split('@')[0]},</p>
        <p>Your recurring booking request for <strong>${amenityName}</strong> has been processed.</p>
        <h3>Results:</h3>
        <ul>
          ${results
            .map((result) => `
            <li>
              Week ${result.week}: ${result.status.toUpperCase()}
              ${result.bookingId ? `(ID: ${result.bookingId.substring(0, 8)})` : ''}
              ${result.reason ? `- ${result.reason}` : ''}
            </li>
          `)
            .join('')}
        </ul>
        <p>Successfully booked: <strong>${successCount}/${weeks} weeks</strong></p>
      `;

      await sendEmail({
        to: session.user.email,
        subject: `Recurring Booking Summary - ${amenityName}`,
        html: emailHtml,
      });
    } catch (emailError) {
      console.error('Failed to send summary email:', emailError);
    }

    return NextResponse.json({
      success: true,
      message: `Successfully booked ${successCount}/${weeks} weeks`,
      parentBookingId,
      results,
    });
  } catch (error: any) {
    console.error('Error creating recurring booking:', error);
    return NextResponse.json(
      {
      error: 'Failed to create recurring booking',
      message: error?.message || 'Unknown error',
      },
      { status: 500 }
    );
  }
}
