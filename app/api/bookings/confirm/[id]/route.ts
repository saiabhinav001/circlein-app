import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { adminDb } from '@/lib/firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';

/**
 * 🎯 BOOKING CONFIRMATION ENDPOINT
 * 
 * Purpose: Allow waitlisted users to confirm their booking when promoted
 * 
 * Flow:
 * 1. User receives email: "You're next! Confirm within 48 hours"
 * 2. User clicks confirmation link → This endpoint
 * 3. Verify booking status is 'pending_confirmation'
 * 4. Check 48-hour deadline hasn't passed
 * 5. Update status to 'confirmed'
 * 6. Send confirmation email with QR code
 * 
 * Security:
 * - Authenticated users only
 * - Can only confirm own bookings (communityId + userId check)
 * - 48-hour deadline enforcement
 * - Idempotent (can call multiple times safely)
 */

interface RouteParams {
  params: {
    id: string;
  };
}

export async function POST(
  req: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  try {
    // Parse action from request body (confirm or decline)
    const body = await req.json().catch(() => ({}));
    const action = body.action || 'confirm'; // Default to confirm for backward compatibility

    console.log('\n🎯 === BOOKING CONFIRMATION REQUEST ===');
    console.log(`   📋 Booking ID: ${params.id}`);
    console.log(`   🎬 Action: ${action}`);

    // 1. AUTHENTICATION CHECK
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      console.log('   ❌ Unauthorized: No session');
      return NextResponse.json(
        { error: 'Unauthorized. Please sign in.' },
        { status: 401 }
      );
    }

    const userEmail = session.user.email;
    const communityId = (session.user as any).communityId;

    console.log(`   👤 User: ${userEmail}`);
    console.log(`   🏘️  Community: ${communityId}`);

    if (!communityId) {
      console.log('   ❌ No community ID found');
      return NextResponse.json(
        { error: 'Community ID not found. Please contact support.' },
        { status: 400 }
      );
    }

    // 2. GET BOOKING DOCUMENT
    const bookingRef = adminDb.collection('bookings').doc(params.id);
    const bookingDoc = await bookingRef.get();

    if (!bookingDoc.exists) {
      console.log('   ❌ Booking not found');
      return NextResponse.json(
        { error: 'Booking not found.' },
        { status: 404 }
      );
    }

    const bookingData = bookingDoc.data();

    // 3. SECURITY CHECKS
    // 3a: Community match (multi-tenancy security)
    if (bookingData?.communityId !== communityId) {
      console.log('   🚨 Security: Community mismatch');
      return NextResponse.json(
        { error: 'Access denied. This booking belongs to a different community.' },
        { status: 403 }
      );
    }

    // 3b: User ownership (can only confirm own bookings)
    if (bookingData?.userEmail !== userEmail) {
      console.log('   🚨 Security: User mismatch');
      return NextResponse.json(
        { error: 'Access denied. You can only confirm your own bookings.' },
        { status: 403 }
      );
    }

    // 4. STATUS VALIDATION
    if (bookingData?.status === 'confirmed') {
      console.log('   ✅ Already confirmed (idempotent response)');
      return NextResponse.json({
        success: true,
        message: 'Booking already confirmed.',
        booking: {
          id: params.id,
          status: 'confirmed',
          amenityName: bookingData.amenityName,
          startTime: bookingData.startTime,
          qrId: bookingData.qrId,
        },
      });
    }

    if (bookingData?.status !== 'pending_confirmation') {
      console.log(`   ❌ Invalid status: ${bookingData?.status}`);
      return NextResponse.json(
        { 
          error: `Cannot confirm booking with status: ${bookingData?.status}. Only pending confirmations can be confirmed.` 
        },
        { status: 400 }
      );
    }

    // 5. DEADLINE CHECK (48 hours from promotion)
    const promotedAt = bookingData.promotedAt as Timestamp;
    const confirmationDeadline = bookingData.confirmationDeadline as Timestamp;

    if (!promotedAt || !confirmationDeadline) {
      console.log('   ⚠️  Missing deadline data');
      return NextResponse.json(
        { error: 'Booking promotion data is incomplete.' },
        { status: 400 }
      );
    }

    const now = Timestamp.now();
    if (now.toMillis() > confirmationDeadline.toMillis()) {
      console.log('   ⏰ Confirmation deadline passed');
      
      // Update status to 'expired' and promote next person
      await bookingRef.update({
        status: 'expired',
        expiredAt: now,
      });

      // TODO: Trigger next person promotion (separate API call)
      
      return NextResponse.json(
        { 
          error: 'Confirmation deadline has passed (48 hours). The booking has been offered to the next person in line.',
          deadlinePassed: true,
        },
        { status: 410 } // 410 Gone
      );
    }

    // 6. HANDLE ACTION: CONFIRM OR DECLINE
    if (action === 'decline') {
      console.log('   ❌ User declined booking');
      
      // Update booking status to declined
      await bookingRef.update({
        status: 'declined',
        declinedAt: now,
        updatedAt: now,
      });

      console.log('   ✅ Booking marked as declined');

      // 7. PROMOTE NEXT WAITLIST PERSON
      console.log('   🚀 Triggering next waitlist promotion...');
      
      try {
        const promotionResponse = await fetch(`${process.env.NEXTAUTH_URL}/api/bookings/promote-waitlist`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            amenityId: bookingData.amenityId,
            startTime: bookingData.startTime.toDate().toISOString(),
            reason: 'manual',
          }),
        });

        if (promotionResponse.ok) {
          const promotionData = await promotionResponse.json();
          console.log('   ✅ Next person promoted:', promotionData);
        }
      } catch (promoError) {
        console.error('   ⚠️  Promotion error:', promoError);
      }

      return NextResponse.json({
        success: true,
        message: 'Booking declined. The spot has been offered to the next person in line.',
        action: 'declined',
        bookingId: params.id,
      });
    }

    // 6. CONFIRM BOOKING (Default action)
    console.log('   ✅ Confirming booking...');

    await bookingRef.update({
      status: 'confirmed',
      confirmedAt: now,
      updatedAt: now,
    });

    console.log('   ✅ Booking confirmed successfully!');

    // 7. SEND CONFIRMATION EMAIL WITH QR CODE
    try {
      console.log('   📧 Sending confirmation email...');
      
      const emailResponse = await fetch(`${process.env.NEXTAUTH_URL}/api/notifications/email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: userEmail,
          type: 'booking_confirmed',
          data: {
            amenityName: bookingData.amenityName,
            startTime: bookingData.startTime.toDate().toLocaleString(),
            endTime: bookingData.endTime.toDate().toLocaleString(),
            qrId: bookingData.qrId,
            userName: session.user.name || 'Resident',
          },
        }),
      });

      if (!emailResponse.ok) {
        console.log('   ⚠️  Email send failed (non-critical)');
      } else {
        console.log('   ✅ Confirmation email sent!');
      }
    } catch (emailError) {
      console.log('   ⚠️  Email error (non-critical):', emailError);
    }

    // 8. SUCCESS RESPONSE
    return NextResponse.json({
      success: true,
      message: 'Booking confirmed successfully! You will receive a confirmation email with your QR code.',
      booking: {
        id: params.id,
        status: 'confirmed',
        amenityName: bookingData.amenityName,
        startTime: bookingData.startTime,
        endTime: bookingData.endTime,
        qrId: bookingData.qrId,
        confirmedAt: now.toDate().toISOString(),
      },
    });

  } catch (error) {
    console.error('❌ Booking confirmation error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to confirm booking. Please try again.',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * GET endpoint - Check booking confirmation status
 * Useful for showing current status before user confirms
 */
export async function GET(
  req: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const bookingRef = adminDb.collection('bookings').doc(params.id);
    const bookingDoc = await bookingRef.get();

    if (!bookingDoc.exists) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      );
    }

    const bookingData = bookingDoc.data();
    const userEmail = session.user.email;
    const communityId = (session.user as any).communityId;

    // Security checks
    if (bookingData?.communityId !== communityId || bookingData?.userEmail !== userEmail) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    // Calculate time remaining
    let timeRemaining = null;
    if (bookingData?.confirmationDeadline) {
      const deadline = (bookingData.confirmationDeadline as Timestamp).toMillis();
      const now = Timestamp.now().toMillis();
      timeRemaining = Math.max(0, deadline - now);
    }

    return NextResponse.json({
      success: true,
      booking: {
        id: params.id,
        status: bookingData?.status,
        amenityName: bookingData?.amenityName,
        startTime: bookingData?.startTime,
        endTime: bookingData?.endTime,
        waitlistPosition: bookingData?.waitlistPosition,
        confirmationDeadline: bookingData?.confirmationDeadline,
        timeRemainingMs: timeRemaining,
      },
    });

  } catch (error) {
    console.error('❌ Get booking status error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch booking status' },
      { status: 500 }
    );
  }
}
