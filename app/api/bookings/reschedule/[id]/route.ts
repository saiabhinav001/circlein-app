import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/firebase';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  Timestamp,
  updateDoc,
  where,
} from 'firebase/firestore';
import { emailTemplates, sendEmail } from '@/lib/email-service';
import { formatDateTimeInTimeZone, formatTimeInTimeZone, resolveTimeZone } from '@/lib/timezone';

export async function POST(request: NextRequest, props: { params: Promise<{ id: string }> }): Promise<NextResponse> {
  const params = await props.params;
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const isAdmin = (session.user as any).role === 'admin';
    const communityId = (session.user as any).communityId;

    if (!isAdmin) {
      return NextResponse.json({ error: 'Only admins can reschedule bookings' }, { status: 403 });
    }

    if (!communityId) {
      return NextResponse.json({ error: 'Missing community context' }, { status: 400 });
    }

    const bookingId = params.id;
    const body = await request.json();

    const nextStart = new Date(body.startTime);
    const nextEnd = new Date(body.endTime);

    if (Number.isNaN(nextStart.getTime()) || Number.isNaN(nextEnd.getTime())) {
      return NextResponse.json({ error: 'Invalid start or end time' }, { status: 400 });
    }

    if (nextEnd <= nextStart) {
      return NextResponse.json({ error: 'End time must be after start time' }, { status: 400 });
    }

    let settingsData: any = {};
    try {
      const settingsSnap = await getDoc(doc(db, 'settings', communityId));
      settingsData = settingsSnap.data() || {};
    } catch {
      settingsData = {};
    }

    const bookingRules = settingsData?.bookingRules || {};
    const toPositiveNumber = (value: any): number | null => {
      const parsed = Number(value);
      return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
    };

    const maxBookingDurationHours = toPositiveNumber(bookingRules.maxBookingDuration);
    const advanceBookingDays = toPositiveNumber(bookingRules.advanceBookingDays);
    const allowWeekendBookings = bookingRules.weekendBookings !== false;
    const durationHours = (nextEnd.getTime() - nextStart.getTime()) / (1000 * 60 * 60);

    if (maxBookingDurationHours !== null && durationHours > maxBookingDurationHours) {
      return NextResponse.json(
        {
          error: `Booking duration cannot exceed ${maxBookingDurationHours} hour${maxBookingDurationHours === 1 ? '' : 's'}`,
        },
        { status: 400 }
      );
    }

    if (!allowWeekendBookings) {
      const dayOfWeek = nextStart.getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      if (isWeekend) {
        return NextResponse.json(
          { error: 'Weekend bookings are currently disabled by community policy' },
          { status: 400 }
        );
      }
    }

    if (advanceBookingDays !== null) {
      const maxAllowedDate = new Date();
      maxAllowedDate.setDate(maxAllowedDate.getDate() + advanceBookingDays);

      if (nextStart.getTime() > maxAllowedDate.getTime()) {
        return NextResponse.json(
          {
            error: `Bookings can only be made up to ${advanceBookingDays} day${advanceBookingDays === 1 ? '' : 's'} in advance`,
          },
          { status: 400 }
        );
      }
    }

    const bookingRef = doc(db, 'bookings', bookingId);
    const bookingSnap = await getDoc(bookingRef);

    if (!bookingSnap.exists()) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    const bookingData = bookingSnap.data() as any;

    if (bookingData.communityId !== communityId) {
      return NextResponse.json({ error: 'Booking is outside your community' }, { status: 403 });
    }

    if (bookingData.status === 'cancelled' || bookingData.status === 'completed') {
      return NextResponse.json({ error: 'Cannot reschedule this booking status' }, { status: 400 });
    }

    if (bookingData.checkInTime || bookingData.checkOutTime) {
      return NextResponse.json({ error: 'Cannot reschedule checked-in bookings' }, { status: 400 });
    }

    const sameAmenityQuery = query(
      collection(db, 'bookings'),
      where('communityId', '==', communityId),
      where('amenityId', '==', bookingData.amenityId)
    );

    const sameAmenitySnapshot = await getDocs(sameAmenityQuery);
    const hasOverlap = sameAmenitySnapshot.docs.some((docSnap) => {
      if (docSnap.id === bookingId) return false;

      const data = docSnap.data() as any;
      if (data.status === 'cancelled' || data.status === 'completed') return false;
      if (!data.startTime || !data.endTime) return false;

      const existingStart = data.startTime.toDate() as Date;
      const existingEnd = data.endTime.toDate() as Date;

      return nextStart < existingEnd && nextEnd > existingStart;
    });

    if (hasOverlap) {
      return NextResponse.json({ error: 'Selected slot overlaps with another booking' }, { status: 409 });
    }

    const previousStart = bookingData.startTime?.toDate?.() as Date | undefined;
    const previousEnd = bookingData.endTime?.toDate?.() as Date | undefined;

    const communityTimeZone = resolveTimeZone(settingsData?.community?.timezone || settingsData?.timezone);

    await updateDoc(bookingRef, {
      startTime: Timestamp.fromDate(nextStart),
      endTime: Timestamp.fromDate(nextEnd),
      selectedDate: nextStart.toISOString(),
      selectedSlot: `${String(nextStart.getHours()).padStart(2, '0')}:00-${String(nextEnd.getHours()).padStart(2, '0')}:00`,
      updatedAt: Timestamp.now(),
      updatedBy: session.user.email,
      rescheduledAt: Timestamp.now(),
      rescheduledBy: session.user.email,
    });

    try {
      const recipientEmail = String(bookingData.userEmail || bookingData.userId || '').trim();
      if (recipientEmail && recipientEmail.includes('@') && previousStart && previousEnd) {
        const oldDateTime = `${formatDateTimeInTimeZone(previousStart, communityTimeZone)} - ${formatTimeInTimeZone(previousEnd, communityTimeZone)}`;
        const newDateTime = `${formatDateTimeInTimeZone(nextStart, communityTimeZone)} - ${formatTimeInTimeZone(nextEnd, communityTimeZone)}`;

        const template = emailTemplates.bookingRescheduled({
          userName: bookingData.userName || recipientEmail.split('@')[0] || 'Resident',
          amenityName: bookingData.amenityName || 'Amenity',
          oldDateTime,
          newDateTime,
          updatedBy: String(session.user.name || session.user.email || 'Administrator'),
        });

        await sendEmail({
          to: recipientEmail,
          subject: template.subject,
          html: template.html,
        });
      }
    } catch (emailError) {
      console.error('Reschedule email send failed (non-critical):', emailError);
    }

    return NextResponse.json({
      success: true,
      bookingId,
      startTime: nextStart.toISOString(),
      endTime: nextEnd.toISOString(),
    });
  } catch (error: any) {
    console.error('Error rescheduling booking:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to reschedule booking' },
      { status: 500 }
    );
  }
}
