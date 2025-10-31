import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { adminDb } from '@/lib/firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';

/**
 * 🚀 WAITLIST AUTO-PROMOTION ENDPOINT
 * 
 * Purpose: When a booking is cancelled, automatically promote next waitlist person
 * 
 * Flow:
 * 1. User cancels booking (status → 'cancelled')
 * 2. This endpoint finds next person in waitlist (lowest position number)
 * 3. Update their status to 'pending_confirmation'
 * 4. Set 48-hour confirmation deadline
 * 5. Send promotion email with confirmation link
 * 6. If deadline passes without confirmation → Promote next person (recursive)
 * 
 * Called from:
 * - Booking cancellation API
 * - Confirmation deadline expiry check
 * - Admin manual promotion
 */

interface PromoteWaitlistRequest {
  amenityId: string;
  startTime: string; // ISO string
  reason?: 'cancellation' | 'expiry' | 'manual';
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    console.log('\n🚀 === WAITLIST PROMOTION REQUEST ===');

    // 1. AUTHENTICATION CHECK (Admin or system internal call)
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      console.log('   ❌ Unauthorized: No session');
      return NextResponse.json(
        { error: 'Unauthorized. Please sign in.' },
        { status: 401 }
      );
    }

    const communityId = (session.user as any).communityId;
    const userRole = (session.user as any).role;

    console.log(`   👤 User: ${session.user.email} (${userRole})`);
    console.log(`   🏘️  Community: ${communityId}`);

    if (!communityId) {
      return NextResponse.json(
        { error: 'Community ID not found' },
        { status: 400 }
      );
    }

    // 2. PARSE REQUEST
    const body: PromoteWaitlistRequest = await req.json();
    const { amenityId, startTime, reason = 'cancellation' } = body;

    console.log(`   📋 Amenity: ${amenityId}`);
    console.log(`   🕐 Time: ${startTime}`);
    console.log(`   📌 Reason: ${reason}`);

    if (!amenityId || !startTime) {
      return NextResponse.json(
        { error: 'Missing required fields: amenityId, startTime' },
        { status: 400 }
      );
    }

    // Convert startTime to Firestore Timestamp
    const startTimestamp = Timestamp.fromDate(new Date(startTime));

    // 3. FIND NEXT PERSON IN WAITLIST
    console.log('   🔍 Finding next waitlist person...');

    const waitlistQuery = adminDb
      .collection('bookings')
      .where('communityId', '==', communityId)
      .where('amenityId', '==', amenityId)
      .where('startTime', '==', startTimestamp)
      .where('status', '==', 'waitlist')
      .orderBy('waitlistPosition', 'asc')
      .limit(1);

    const waitlistSnapshot = await waitlistQuery.get();

    if (waitlistSnapshot.empty) {
      console.log('   ℹ️  No one in waitlist (slot will remain empty)');
      return NextResponse.json({
        success: true,
        message: 'No waitlist entries found. Slot is now available.',
        promoted: false,
      });
    }

    const nextBookingDoc = waitlistSnapshot.docs[0];
    const nextBooking = nextBookingDoc.data();

    console.log(`   🎯 Next person: ${nextBooking.userEmail} (Position #${nextBooking.waitlistPosition})`);

    // 4. SET CONFIRMATION DEADLINE (48 hours from now)
    const now = Timestamp.now();
    const confirmationDeadline = Timestamp.fromMillis(
      now.toMillis() + (48 * 60 * 60 * 1000) // 48 hours
    );

    console.log(`   ⏰ Deadline: ${confirmationDeadline.toDate().toLocaleString()}`);

    // 5. UPDATE BOOKING STATUS
    await nextBookingDoc.ref.update({
      status: 'pending_confirmation',
      promotedAt: now,
      confirmationDeadline: confirmationDeadline,
      promotionReason: reason,
      updatedAt: now,
    });

    console.log('   ✅ Status updated to pending_confirmation');

    // 6. SEND PROMOTION EMAIL
    try {
      console.log('   📧 Sending promotion email...');

      const amenityDoc = await adminDb.collection('amenities').doc(amenityId).get();
      const amenityName = amenityDoc.exists 
        ? amenityDoc.data()?.name 
        : 'Unknown Amenity';

      const confirmationUrl = `${process.env.NEXTAUTH_URL}/bookings/confirm/${nextBookingDoc.id}`;

      const emailResponse = await fetch(`${process.env.NEXTAUTH_URL}/api/notifications/email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: nextBooking.userEmail,
          type: 'waitlist_promoted',
          data: {
            amenityName: amenityName,
            startTime: nextBooking.startTime.toDate().toLocaleString(),
            endTime: nextBooking.endTime.toDate().toLocaleString(),
            confirmationUrl: confirmationUrl,
            deadline: confirmationDeadline.toDate().toLocaleString(),
            waitlistPosition: nextBooking.waitlistPosition,
            userName: nextBooking.userName || 'Resident',
            flatNumber: nextBooking.flatNumber,
          },
        }),
      });

      if (!emailResponse.ok) {
        console.log('   ⚠️  Email send failed (non-critical)');
      } else {
        console.log('   ✅ Promotion email sent!');
      }
    } catch (emailError) {
      console.log('   ⚠️  Email error (non-critical):', emailError);
    }

    // 7. SUCCESS RESPONSE
    return NextResponse.json({
      success: true,
      message: `Successfully promoted ${nextBooking.userEmail} from waitlist.`,
      promoted: true,
      booking: {
        id: nextBookingDoc.id,
        userEmail: nextBooking.userEmail,
        amenityName: nextBooking.amenityName,
        startTime: nextBooking.startTime,
        status: 'pending_confirmation',
        confirmationDeadline: confirmationDeadline.toDate().toISOString(),
        waitlistPosition: nextBooking.waitlistPosition,
      },
    });

  } catch (error) {
    console.error('❌ Waitlist promotion error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to promote waitlist entry',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * GET endpoint - Check current waitlist for a slot
 * Useful for admins to see who's next in line
 */
export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const communityId = (session.user as any).communityId;
    const { searchParams } = new URL(req.url);
    const amenityId = searchParams.get('amenityId');
    const startTime = searchParams.get('startTime');

    if (!amenityId || !startTime) {
      return NextResponse.json(
        { error: 'Missing query parameters: amenityId, startTime' },
        { status: 400 }
      );
    }

    const startTimestamp = Timestamp.fromDate(new Date(startTime));

    // Get all waitlist entries for this slot
    const waitlistQuery = adminDb
      .collection('bookings')
      .where('communityId', '==', communityId)
      .where('amenityId', '==', amenityId)
      .where('startTime', '==', startTimestamp)
      .where('status', '==', 'waitlist')
      .orderBy('waitlistPosition', 'asc');

    const waitlistSnapshot = await waitlistQuery.get();

    const waitlistEntries = waitlistSnapshot.docs.map(doc => ({
      id: doc.id,
      userEmail: doc.data().userEmail,
      userName: doc.data().userName,
      waitlistPosition: doc.data().waitlistPosition,
      createdAt: doc.data().createdAt?.toDate().toISOString(),
    }));

    return NextResponse.json({
      success: true,
      count: waitlistEntries.length,
      waitlist: waitlistEntries,
    });

  } catch (error) {
    console.error('❌ Get waitlist error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch waitlist' },
      { status: 500 }
    );
  }
}
