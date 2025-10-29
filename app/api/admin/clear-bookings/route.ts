import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { collection, getDocs, deleteDoc, writeBatch, doc, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';

/**
 * ADMIN-ONLY ENDPOINT: Clear booking history safely
 * Used for production migration to new booking system
 * Includes safety checks and batch operations
 */

export async function POST(request: NextRequest) {
  try {
    // 1. CRITICAL: Verify admin authentication
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized - Authentication required' },
        { status: 401 }
      );
    }

    if (session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }

    const { confirmationToken, communityId } = await request.json();

    // 2. SAFETY: Require confirmation token
    if (confirmationToken !== 'CLEAR_ALL_BOOKINGS_CONFIRMED') {
      return NextResponse.json(
        { error: 'Invalid confirmation token. This is a destructive operation.' },
        { status: 400 }
      );
    }

    // 3. Community-specific deletion (multi-tenancy safe)
    const targetCommunityId = communityId || session.user.communityId;

    console.log(`🧹 Starting safe booking cleanup for community: ${targetCommunityId}`);

    // 4. Delete bookings in batches (Firestore limit: 500 per batch)
    const bookingsRef = collection(db, 'bookings');
    const bookingsQuery = query(
      bookingsRef,
      where('communityId', '==', targetCommunityId)
    );
    const bookingsSnapshot = await getDocs(bookingsQuery);

    let deletedBookings = 0;
    const batchSize = 500;

    // Process in batches
    for (let i = 0; i < bookingsSnapshot.docs.length; i += batchSize) {
      const batch = writeBatch(db);
      const batchDocs = bookingsSnapshot.docs.slice(i, i + batchSize);
      
      batchDocs.forEach((docSnapshot) => {
        batch.delete(docSnapshot.ref);
      });

      await batch.commit();
      deletedBookings += batchDocs.length;
      console.log(`   ✅ Deleted batch: ${batchDocs.length} bookings (Total: ${deletedBookings})`);
    }

    // 5. Delete calendar events (if exists)
    let deletedEvents = 0;
    try {
      const eventsRef = collection(db, 'events');
      const eventsQuery = query(
        eventsRef,
        where('communityId', '==', targetCommunityId)
      );
      const eventsSnapshot = await getDocs(eventsQuery);

      for (let i = 0; i < eventsSnapshot.docs.length; i += batchSize) {
        const batch = writeBatch(db);
        const batchDocs = eventsSnapshot.docs.slice(i, i + batchSize);
        
        batchDocs.forEach((docSnapshot) => {
          batch.delete(docSnapshot.ref);
        });

        await batch.commit();
        deletedEvents += batchDocs.length;
        console.log(`   ✅ Deleted batch: ${batchDocs.length} events (Total: ${deletedEvents})`);
      }
    } catch (eventError) {
      console.log('   ⚠️ No events collection or error deleting events (non-critical)');
    }

    console.log(`✅ Cleanup complete: ${deletedBookings} bookings, ${deletedEvents} events deleted`);

    return NextResponse.json({
      success: true,
      message: 'Booking history cleared successfully',
      stats: {
        bookingsDeleted: deletedBookings,
        eventsDeleted: deletedEvents,
        communityId: targetCommunityId,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error: any) {
    console.error('❌ Error clearing booking history:', error);
    return NextResponse.json(
      { 
        error: 'Failed to clear booking history',
        details: error.message 
      },
      { status: 500 }
    );
  }
}

// Health check endpoint
export async function GET() {
  return NextResponse.json({
    endpoint: 'Clear Booking History',
    status: 'ready',
    requiresAuth: true,
    requiresAdmin: true,
    destructive: true,
    confirmationRequired: 'CLEAR_ALL_BOOKINGS_CONFIRMED'
  });
}
