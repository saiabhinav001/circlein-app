import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { adminDb } from '@/lib/firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';
import { formatDateInTimeZone, formatTimeInTimeZone, resolveTimeZone } from '@/lib/timezone';

/**
 * 📊 ADMIN WAITLIST MANAGEMENT API
 * 
 * Purpose: Provide admin dashboard with waitlist analytics and data
 * 
 * Features:
 * - Get all waitlist entries for community
 * - Calculate waitlist statistics
 * - Recent promotion tracking
 * - Waitlist by amenity breakdown
 * 
 * Security: Admin-only access
 */

export const dynamic = 'force-dynamic';
const REMINDER_COOLDOWN_MINUTES = 15;

export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    console.log('\n📊 === ADMIN WAITLIST DATA REQUEST ===');

    // 1. AUTHENTICATION & AUTHORIZATION CHECK
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      console.log('   ❌ Unauthorized: No session');
      return NextResponse.json(
        { error: 'Unauthorized. Please sign in.' },
        { status: 401 }
      );
    }

    const userRole = (session.user as any).role;
    const communityId = (session.user as any).communityId;

    console.log(`   👤 User: ${session.user.email} (${userRole})`);
    console.log(`   🏘️  Community: ${communityId}`);

    // Admin check
    if (userRole !== 'admin' && userRole !== 'super_admin') {
      console.log('   🚫 Access denied: Not an admin');
      return NextResponse.json(
        { error: 'Access denied. Admin privileges required.' },
        { status: 403 }
      );
    }

    if (!communityId) {
      return NextResponse.json(
        { error: 'Community ID not found' },
        { status: 400 }
      );
    }

    // 2. FETCH ALL WAITLIST ENTRIES FOR COMMUNITY
    console.log('   🔍 Fetching waitlist entries...');

    const waitlistQuery = adminDb
      .collection('bookings')
      .where('communityId', '==', communityId)
      .where('status', '==', 'waitlist')
      .orderBy('createdAt', 'asc');

    const waitlistSnapshot = await waitlistQuery.get();

    // 3. FETCH RECENT PROMOTIONS (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const promotionsQuery = adminDb
      .collection('bookings')
      .where('communityId', '==', communityId)
      .where('status', 'in', ['pending_confirmation', 'confirmed'])
      .where('promotedAt', '>=', sevenDaysAgo);

    const promotionsSnapshot = await promotionsQuery.get();
    const recentPromotions = promotionsSnapshot.docs.filter(doc => {
      const data = doc.data();
      return data.promotedAt && data.promotionReason; // Has promotion data
    }).length;

    // 4. PROCESS WAITLIST ENTRIES
    const waitlistEntries = waitlistSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        userEmail: data.userEmail,
        userName: data.userName,
        amenityId: data.amenityId,
        amenityName: data.amenityName,
        startTime: data.startTime,
        endTime: data.endTime,
        waitlistPosition: data.waitlistPosition,
        createdAt: data.createdAt,
        status: data.status,
        lastWaitlistReminderAt: data.lastWaitlistReminderAt || null,
        lastWaitlistReminderStatus: data.lastWaitlistReminderStatus || null,
        lastWaitlistReminderError: data.lastWaitlistReminderError || null,
      };
    });

    // 5. CALCULATE STATISTICS
    const byAmenity: { [key: string]: number } = {};

    waitlistEntries.forEach(entry => {
      const amenityName = entry.amenityName || 'Unknown';
      byAmenity[amenityName] = (byAmenity[amenityName] || 0) + 1;
    });

    const stats = {
      totalWaitlist: waitlistEntries.length,
      byAmenity,
      recentPromotions,
    };

    console.log(`   ✅ Found ${waitlistEntries.length} waitlist entries`);
    console.log(`   📊 ${Object.keys(byAmenity).length} amenities with waitlist`);
    console.log(`   🚀 ${recentPromotions} promotions in last 7 days`);

    // 6. SUCCESS RESPONSE
    return NextResponse.json({
      success: true,
      waitlist: waitlistEntries,
      stats,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('❌ Admin waitlist error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch waitlist data',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized. Please sign in.' }, { status: 401 });
    }

    const userRole = (session.user as any).role;
    const communityId = (session.user as any).communityId;

    if (userRole !== 'admin' && userRole !== 'super_admin') {
      return NextResponse.json({ error: 'Access denied. Admin privileges required.' }, { status: 403 });
    }

    if (!communityId) {
      return NextResponse.json({ error: 'Community ID not found' }, { status: 400 });
    }

    const body = await req.json();
    const bookingId = String(body?.bookingId || '').trim();

    if (!bookingId) {
      return NextResponse.json({ error: 'bookingId is required' }, { status: 400 });
    }

    const bookingRef = adminDb.collection('bookings').doc(bookingId);
    const bookingSnap = await bookingRef.get();

    if (!bookingSnap.exists) {
      return NextResponse.json({ error: 'Waitlist entry not found' }, { status: 404 });
    }

    const bookingData = bookingSnap.data() as any;
    if (bookingData.communityId !== communityId) {
      return NextResponse.json({ error: 'Forbidden for this community' }, { status: 403 });
    }

    if (bookingData.status !== 'waitlist') {
      return NextResponse.json({ error: 'Entry is no longer in waitlist status' }, { status: 409 });
    }

    const now = Date.now();
    const lastReminderAtMs = bookingData.lastWaitlistReminderAt?.toDate?.()?.getTime?.() || null;
    if (lastReminderAtMs && now - lastReminderAtMs < REMINDER_COOLDOWN_MINUTES * 60 * 1000) {
      const remainingMinutes = Math.max(
        1,
        Math.ceil((REMINDER_COOLDOWN_MINUTES * 60 * 1000 - (now - lastReminderAtMs)) / 60000)
      );

      return NextResponse.json(
        { error: `Reminder sent recently. Try again in ${remainingMinutes} minute(s).`, retryAfterMinutes: remainingMinutes },
        { status: 429 }
      );
    }

    const settingsSnapshot = await adminDb.collection('settings').doc(communityId).get();
    const settingsData = settingsSnapshot.data() as any;
    const communityTimeZone = resolveTimeZone(settingsData?.community?.timezone || settingsData?.timezone);

    const startDate = bookingData.startTime?.toDate?.();
    const endDate = bookingData.endTime?.toDate?.();

    if (!startDate || !endDate) {
      return NextResponse.json({ error: 'Invalid booking times for reminder' }, { status: 400 });
    }

    const origin = new URL(req.url).origin;
    const emailResponse = await fetch(`${origin}/api/notifications/email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: bookingData.userEmail,
        type: 'bookingWaitlist',
        data: {
          userName: bookingData.userName || 'Resident',
          amenityName: bookingData.amenityName || 'Amenity',
          date: formatDateInTimeZone(startDate, communityTimeZone, {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          }),
          timeSlot: `${formatTimeInTimeZone(startDate, communityTimeZone)} - ${formatTimeInTimeZone(endDate, communityTimeZone)}`,
          waitlistPosition: Number(bookingData.waitlistPosition || 0) || 1,
          communityName: settingsData?.community?.name || 'CircleIn Community',
        },
      }),
    });

    const emailPayload = await emailResponse.json().catch(() => null);
    if (!emailResponse.ok || emailPayload?.success === false) {
      await bookingRef.update({
        lastWaitlistReminderStatus: 'error',
        lastWaitlistReminderError: emailPayload?.error || 'Failed to send reminder email',
        updatedAt: Timestamp.now(),
      });

      return NextResponse.json(
        { error: emailPayload?.error || 'Failed to send reminder email' },
        { status: 500 }
      );
    }

    await adminDb.collection('notifications').add({
      userId: bookingData.userId,
      userEmail: bookingData.userEmail,
      communityId,
      type: 'waitlist_reminder',
      title: 'Waitlist Status Reminder',
      message: `You are currently #${bookingData.waitlistPosition || '?'} in queue for ${bookingData.amenityName || 'your booking slot'}.`,
      data: {
        bookingId,
        amenityId: bookingData.amenityId,
        amenityName: bookingData.amenityName,
        waitlistPosition: bookingData.waitlistPosition,
        startTime: startDate.toISOString(),
        endTime: endDate.toISOString(),
      },
      read: false,
      createdAt: Timestamp.now(),
      expiresAt: Timestamp.fromMillis(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    await bookingRef.update({
      lastWaitlistReminderAt: Timestamp.now(),
      lastWaitlistReminderStatus: 'success',
      lastWaitlistReminderError: null,
      updatedAt: Timestamp.now(),
    });

    return NextResponse.json({ success: true, message: 'Reminder sent successfully' });
  } catch (error) {
    console.error('❌ Admin waitlist reminder error:', error);
    return NextResponse.json(
      {
        error: 'Failed to send waitlist reminder',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
