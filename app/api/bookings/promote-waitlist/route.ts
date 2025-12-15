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

    // 2.5. CHECK IF TIME SLOT HAS ALREADY PASSED
    const now = Timestamp.now();
    if (startTimestamp.toMillis() < now.toMillis()) {
      console.log('   ⚠️  Time slot has already passed - no promotion needed');
      return NextResponse.json({
        success: true,
        message: 'Time slot has passed. No promotion needed.',
        promoted: false,
        reason: 'expired',
      });
    }

    // 2.6. CHECK AMENITY CAPACITY AND CURRENT BOOKINGS
    console.log('   📊 Checking capacity limits...');
    
    const amenityDoc = await adminDb.collection('amenities').doc(amenityId).get();
    if (!amenityDoc.exists) {
      return NextResponse.json(
        { error: 'Amenity not found' },
        { status: 404 }
      );
    }
    
    const amenityData = amenityDoc.data();
    const maxPeople = amenityData?.booking?.maxPeople || amenityData?.rules?.maxSlotsPerFamily || 30;
    console.log(`   📏 Max capacity: ${maxPeople} people`);
    
    // Count current confirmed bookings for this slot
    const confirmedBookingsQuery = adminDb
      .collection('bookings')
      .where('communityId', '==', communityId)
      .where('amenityId', '==', amenityId)
      .where('startTime', '==', startTimestamp)
      .where('status', '==', 'confirmed');
    
    const confirmedSnapshot = await confirmedBookingsQuery.get();
    const currentConfirmed = confirmedSnapshot.size;
    const availableSlots = maxPeople - currentConfirmed;
    
    console.log(`   ✅ Current confirmed: ${currentConfirmed}`);
    console.log(`   🎯 Available slots: ${availableSlots}`);
    
    if (availableSlots <= 0) {
      console.log('   ⚠️  No available slots - capacity full');
      return NextResponse.json({
        success: true,
        message: 'No available slots. Capacity is full.',
        promoted: false,
        reason: 'capacity_full',
      });
    }

    // 3. FIND NEXT PERSON(S) IN WAITLIST
    console.log(`   🔍 Finding next ${availableSlots} waitlist person(s)...`);

    const waitlistQuery = adminDb
      .collection('bookings')
      .where('communityId', '==', communityId)
      .where('amenityId', '==', amenityId)
      .where('startTime', '==', startTimestamp)
      .where('status', '==', 'waitlist')
      .orderBy('priorityScore', 'asc') // Use priorityScore for fairness
      .orderBy('waitlistPosition', 'asc') // Then by position
      .limit(availableSlots); // Promote multiple people if space available

    const waitlistSnapshot = await waitlistQuery.get();

    if (waitlistSnapshot.empty) {
      console.log('   ℹ️  No one in waitlist (slot will remain empty)');
      return NextResponse.json({
        success: true,
        message: 'No waitlist entries found. Slot is now available.',
        promoted: false,
      });
    }

    const promotedUsers: any[] = [];
    const amenityName = amenityData?.name || 'Unknown Amenity';

    console.log(`   🎯 Found ${waitlistSnapshot.size} person(s) to promote`);

    // 4-6. LOOP THROUGH AND PROMOTE ALL ELIGIBLE WAITLIST USERS
    for (const waitlistDoc of waitlistSnapshot.docs) {
      const nextBooking = waitlistDoc.data();
      
      console.log(`   👤 Promoting: ${nextBooking.userEmail} (Priority: ${nextBooking.priorityScore || 'N/A'})`);

      // 4. AUTO-CONFIRM - No need for manual confirmation, instant promotion
      await waitlistDoc.ref.update({
        status: 'confirmed',
        promotedAt: now,
        promotionReason: reason,
        waitlistPosition: null, // Remove waitlist position
        updatedAt: now,
      });

      console.log(`   ✅ ${nextBooking.userEmail} confirmed`);

      // 5. SEND EMAIL & CREATE IN-APP NOTIFICATION
      try {
        const startDate = nextBooking.startTime.toDate();
        const endDate = nextBooking.endTime.toDate();
        const bookingUrl = `${process.env.NEXTAUTH_URL}/bookings`;

        // Send email notification
        await fetch(`${process.env.NEXTAUTH_URL}/api/notifications/email`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: nextBooking.userEmail,
            type: 'waitlist_auto_promoted',
            data: {
              amenityName: amenityName,
              date: startDate.toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              }),
              timeSlot: `${startDate.toLocaleTimeString('en-US', { 
                hour: 'numeric', 
                minute: '2-digit' 
              })} - ${endDate.toLocaleTimeString('en-US', { 
                hour: 'numeric', 
                minute: '2-digit' 
              })}`,
              bookingUrl: bookingUrl,
              userName: nextBooking.userName || 'Resident',
              flatNumber: nextBooking.flatNumber,
            },
          }),
        });

        // Create in-app notification
        await adminDb.collection('notifications').add({
          userId: nextBooking.userId,
          userEmail: nextBooking.userEmail,
          communityId: communityId,
          type: 'waitlist_promoted',
          title: '🎉 Great News! You\'re Confirmed',
          message: `A slot opened up for ${amenityName} on ${startDate.toLocaleDateString()} at ${startDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}. You've been automatically confirmed!`,
          data: {
            bookingId: waitlistDoc.id,
            amenityId: amenityId,
            amenityName: amenityName,
            startTime: startDate.toISOString(),
            endTime: endDate.toISOString(),
            bookingUrl: bookingUrl,
          },
          read: false,
          createdAt: now,
          expiresAt: Timestamp.fromMillis(now.toMillis() + (7 * 24 * 60 * 60 * 1000)), // 7 days
        });

        console.log(`   ✅ Notifications sent to ${nextBooking.userEmail}`);
      } catch (error) {
        console.error(`   ⚠️  Notification error for ${nextBooking.userEmail}:`, error);
      }

      promotedUsers.push({
        id: waitlistDoc.id,
        userEmail: nextBooking.userEmail,
        userName: nextBooking.userName,
        priorityScore: nextBooking.priorityScore,
      });
    }

    console.log(`   🎊 Successfully promoted ${promotedUsers.length} user(s)!`);

    // 7. SUCCESS RESPONSE
    return NextResponse.json({
      success: true,
      message: `Successfully auto-promoted and confirmed ${promotedUsers.length} user(s) from waitlist.`,
      promoted: true,
      count: promotedUsers.length,
      users: promotedUsers,
      booking: promotedUsers.length > 0 ? {
        amenityName: amenityName,
        startTime: startTimestamp.toDate().toISOString(),
        status: 'confirmed',
        promotedAt: now.toDate().toISOString(),
      } : undefined,
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
