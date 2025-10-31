import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc, Timestamp } from 'firebase/firestore';
import { emailTemplates, sendEmail } from '@/lib/email-service';

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

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
    const bookingId = params.id;
    console.log('\n🚫 === BOOKING CANCELLATION ===');
    console.log(`   📋 Booking ID: ${bookingId}`);

    // 1. AUTHENTICATION CHECK
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      console.log('   ❌ Unauthorized: No session');
      return NextResponse.json(
        { error: 'Unauthorized. Please sign in.' },
        { status: 401 }
      );
    }

    const currentUserEmail = session.user.email;
    const isAdmin = (session.user as any).role === 'admin';
    const communityId = (session.user as any).communityId;

    console.log(`   👤 User: ${currentUserEmail} (${isAdmin ? 'Admin' : 'Resident'})`);
    console.log(`   🏘️  Community: ${communityId}`);

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
      console.log('   ❌ Booking not found');
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      );
    }

    const bookingData = {
      id: bookingSnap.id,
      ...bookingSnap.data()
    } as BookingData;

    console.log(`   📌 Status: ${bookingData.status}`);
    console.log(`   👤 Owner: ${bookingData.userEmail}`);
    console.log(`   🎯 Amenity: ${bookingData.amenityName}`);

    // 3. AUTHORIZATION CHECK
    const canCancel = isAdmin || bookingData.userEmail === currentUserEmail;

    if (!canCancel) {
      console.log('   ❌ Unauthorized: User cannot cancel this booking');
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

    // 5. UPDATE BOOKING TO CANCELLED
    console.log('   🔄 Updating booking status to cancelled...');
    
    await updateDoc(bookingRef, {
      status: 'cancelled',
      cancelledAt: Timestamp.now(),
      cancelledBy: currentUserEmail,
      adminCancellation: isAdmin && bookingData.userEmail !== currentUserEmail,
      updatedAt: Timestamp.now(),
    });

    console.log('   ✅ Booking cancelled successfully');

    // 6. SEND CANCELLATION EMAIL TO BOOKING OWNER
    console.log('   📧 Sending cancellation email...');
    
    const cancellationTemplate = emailTemplates.bookingCancellation({
      userName: bookingData.userName || 'Resident',
      amenityName: bookingData.amenityName,
      date: bookingData.startTime.toDate().toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }),
      timeSlot: `${bookingData.startTime.toDate().toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit' 
      })} - ${bookingData.endTime.toDate().toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit' 
      })}`,
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
      console.log('   ✅ Cancellation email sent successfully');
    } else {
      console.error('   ⚠️ Failed to send cancellation email:', emailResult.error);
    }

    // 7. PROMOTE NEXT WAITLIST PERSON (If booking was confirmed)
    if (bookingData.status === 'confirmed') {
      console.log('   🚀 Triggering waitlist promotion...');
      
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
          console.log('   ✅ Waitlist promotion triggered:', promotionData);
          
          return NextResponse.json({
            success: true,
            message: 'Booking cancelled successfully',
            bookingId,
            waitlistPromoted: promotionData.promoted,
            promotedUser: promotionData.booking?.userEmail || 'Next person',
          });
        } else {
          console.error('   ⚠️ Waitlist promotion failed');
        }
      } catch (promoError) {
        console.error('   ⚠️ Error triggering waitlist promotion:', promoError);
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
    console.error('❌ Error in booking cancellation:', error);
    return NextResponse.json(
      {
        error: error.message || 'Internal server error',
        success: false,
      },
      { status: 500 }
    );
  }
}
