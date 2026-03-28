import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc, Timestamp } from 'firebase/firestore';
import { emailTemplates, sendEmail } from '@/lib/email-service';
import { formatDateInTimeZone, formatTimeInTimeZone, resolveTimeZone } from '@/lib/timezone';

/**
 * 🚫 BOOKING CANCELLATION ENDPOINT WITH AUTO-WAITLIST PROMOTION
 * 
 * Purpose: Cancel a booking and automatically promote next waitlist person
 * 
 * Flow:
 * 1. Validate user can cancel (owner or admin)
 * 2. Update booking status to 'cancelled'
 * 3. Send cancellation email to booking owner
 * 4. Find next person in waitlist for same slot
 * 5. Update waitlist person to 'pending_confirmation'
 * 6. Send promotion email with YES/NO confirmation links
 * 7. Set 48-hour deadline for confirmation
 * 8. If confirmed → status becomes 'confirmed'
 * 9. If not confirmed within 48h → Promote next person (automatic)
 * 
 * Security: Users can only cancel their own bookings, admins can cancel any
 */

interface BookingData {
  id: string;
  userId: string;
  userEmail: string;
  userName?: string;
  amenityId: string;
  amenityName: string;
  startTime: Timestamp;
  endTime: Timestamp;
  status: string;
  communityId: string;
  [key: string]: any;
}

export async function POST(request: NextRequest, props: { params: Promise<{ id: string }> }): Promise<NextResponse> {
  const params = await props.params;
  try {
    const bookingId = params.id;

    // 1. AUTHENTICATION CHECK
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized. Please sign in.' },
        { status: 401 }
      );
    }

    const currentUserEmail = session.user.email;
    const isAdmin = (session.user as any).role === 'admin';
    const communityId = (session.user as any).communityId;


    if (!communityId) {
      return NextResponse.json(
        { error: 'Community ID not found' },
        { status: 400 }
      );
    }

    // 2. FETCH BOOKING
    const bookingRef = doc(db, 'bookings', bookingId);
    const bookingSnap = await getDoc(bookingRef);

    if (!bookingSnap.exists()) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      );
    }

    const bookingData = {
      id: bookingSnap.id,
      ...bookingSnap.data()
    } as BookingData;


    // 3. AUTHORIZATION CHECK
    const canCancel = isAdmin || bookingData.userEmail === currentUserEmail;

    if (!canCancel) {
      return NextResponse.json(
        { error: 'You can only cancel your own bookings' },
        { status: 403 }
      );
    }

    // 4. VALIDATE BOOKING CAN BE CANCELLED
    if (bookingData.status === 'cancelled') {
      return NextResponse.json(
        { error: 'Booking is already cancelled' },
        { status: 400 }
      );
    }

    if (bookingData.status === 'completed') {
      return NextResponse.json(
        { error: 'Cannot cancel completed bookings' },
        { status: 400 }
      );
    }

    let settingsData: any = {};
    try {
      const settingsSnapshot = await getDoc(doc(db, 'settings', communityId));
      settingsData = settingsSnapshot.data() || {};
    } catch (settingsError) {
            // TODO: add error handling
    }

    const cancellationDeadlineRaw = Number(settingsData?.bookingRules?.cancellationDeadline);
    const cancellationDeadlineHours =
      Number.isFinite(cancellationDeadlineRaw) && cancellationDeadlineRaw >= 0
        ? cancellationDeadlineRaw
        : null;

    if (!isAdmin && cancellationDeadlineHours !== null) {
      const bookingStartTime = bookingData.startTime?.toDate?.();
      if (bookingStartTime) {
        const hoursUntilStart =
          (bookingStartTime.getTime() - Date.now()) / (1000 * 60 * 60);
        if (hoursUntilStart < cancellationDeadlineHours) {
          return NextResponse.json(
            {
              error: `Cancellations must be made at least ${cancellationDeadlineHours} hour${cancellationDeadlineHours === 1 ? '' : 's'} before start time`,
            },
            { status: 400 }
          );
        }
      }
    }

    // 5. UPDATE BOOKING TO CANCELLED
    
    await updateDoc(bookingRef, {
      status: 'cancelled',
      cancelledAt: Timestamp.now(),
      cancelledBy: currentUserEmail,
      adminCancellation: isAdmin && bookingData.userEmail !== currentUserEmail,
      updatedAt: Timestamp.now(),
    });


    // 6. SEND CANCELLATION EMAIL TO BOOKING OWNER

    const communityTimeZone = resolveTimeZone(settingsData?.community?.timezone || settingsData?.timezone);
    
    const cancellationTemplate = emailTemplates.bookingCancellation({
      userName: bookingData.userName || 'Resident',
      amenityName: bookingData.amenityName,
      date: formatDateInTimeZone(bookingData.startTime.toDate(), communityTimeZone, {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }),
      timeSlot: `${formatTimeInTimeZone(bookingData.startTime.toDate(), communityTimeZone)} - ${formatTimeInTimeZone(bookingData.endTime.toDate(), communityTimeZone)}`,
      bookingId: bookingId,
      cancelledBy: isAdmin && bookingData.userEmail !== currentUserEmail ? 'Administration' : 'You',
      isAdminCancellation: isAdmin && bookingData.userEmail !== currentUserEmail,
      cancellationReason: isAdmin && bookingData.userEmail !== currentUserEmail
        ? 'This booking was cancelled by administration. If you have questions, please contact your community admin.'
        : undefined,
      flatNumber: bookingData.flatNumber,
    });

    const emailResult = await sendEmail({
      to: bookingData.userEmail,
      subject: cancellationTemplate.subject,
      html: cancellationTemplate.html,
    });

    if (emailResult.success) {
    } else {
    }

    // 7. PROMOTE NEXT WAITLIST PERSON (If booking was confirmed)
    if (bookingData.status === 'confirmed') {
      
      try {
        const promotionResponse = await fetch(`${request.nextUrl.origin}/api/bookings/promote-waitlist`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Cookie': request.headers.get('cookie') || '',
          },
          body: JSON.stringify({
            amenityId: bookingData.amenityId,
            startTime: bookingData.startTime.toDate().toISOString(),
            reason: 'cancellation',
          }),
        });

        if (promotionResponse.ok) {
          const promotionData = await promotionResponse.json();
          
          return NextResponse.json({
            success: true,
            message: 'Booking cancelled successfully',
            bookingId,
            waitlistPromoted: promotionData.promoted,
            promotedUser: promotionData.booking?.userEmail || 'Next person',
          });
        } else {
        }
      } catch (promoError) {
                // TODO: add error handling
        // Don't fail the cancellation if promotion fails
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Booking cancelled successfully',
      bookingId,
      waitlistPromoted: false,
    });

  } catch (error: any) {
    return NextResponse.json(
      {
        error: error.message || 'Internal server error',
        success: false,
      },
      { status: 500 }
    );
  }
}
