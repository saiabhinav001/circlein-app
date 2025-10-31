import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { adminDb } from '@/lib/firebase-admin';

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
