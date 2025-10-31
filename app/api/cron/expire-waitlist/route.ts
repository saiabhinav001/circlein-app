import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, Timestamp, updateDoc, doc as docRef } from 'firebase/firestore';

/**
 * 🕐 WAITLIST EXPIRY CRON ENDPOINT
 * 
 * Purpose: Automatically expire waitlist bookings that are in the past
 * 
 * Flow:
 * 1. Find all bookings with status 'waitlist' or 'pending_confirmation'
 * 2. Check if their end time has passed
 * 3. Update status to 'expired'
 * 4. Add expiry timestamp
 * 
 * Called by: External cron service (cron-job.org) every hour
 * URL: https://your-app.vercel.app/api/cron/expire-waitlist
 * 
 * Security: Publicly accessible (excluded from middleware), safe for production
 */

async function handleWaitlistExpiry(request: NextRequest) {
  try {
    console.log('\n🕐 === WAITLIST EXPIRY CHECK ===');
    console.log(`   ⏰ Time: ${new Date().toISOString()}`);

    const now = new Date();
    const nowTimestamp = Timestamp.fromDate(now);

    console.log(`   📊 Checking for expired waitlist entries...`);

    // 1. QUERY WAITLIST BOOKINGS THAT HAVE PASSED
    const bookingsRef = collection(db, 'bookings');
    
    // Find waitlist entries with end time in the past
    const waitlistQuery = query(
      bookingsRef,
      where('status', 'in', ['waitlist', 'pending_confirmation']),
      where('endTime', '<=', nowTimestamp)
    );

    const snapshot = await getDocs(waitlistQuery);

    console.log(`   📋 Found ${snapshot.size} expired waitlist entries`);

    if (snapshot.empty) {
      return NextResponse.json({
        success: true,
        message: 'No expired waitlist entries',
        checked: 0,
        expired: 0,
      });
    }

    // 2. EXPIRE EACH BOOKING
    let expired = 0;
    let failed = 0;
    const errors: string[] = [];

    for (const doc of snapshot.docs) {
      const booking = doc.data();
      
      try {
        console.log(`   ⏰ Expiring waitlist booking ${doc.id}`);
        console.log(`      User: ${booking.userEmail}`);
        console.log(`      Amenity: ${booking.amenityName}`);
        console.log(`      End Time: ${booking.endTime.toDate().toLocaleString()}`);
        console.log(`      Status: ${booking.status}`);

        // Update booking status to expired
        const bookingDocRef = docRef(db, 'bookings', doc.id);
        await updateDoc(bookingDocRef, {
          status: 'expired',
          expiredAt: Timestamp.now(),
          expiredReason: 'Time slot passed while in waitlist',
        });

        console.log(`      ✅ Expired successfully`);
        expired++;

      } catch (error: any) {
        console.error(`      ❌ Error expiring booking ${doc.id}:`, error.message);
        errors.push(`${doc.id}: ${error.message}`);
        failed++;
      }

      // Small delay to avoid rate limits
      await new Promise(resolve => setTimeout(resolve, 50));
    }

    // 3. SUMMARY
    console.log('\n📊 === EXPIRY SUMMARY ===');
    console.log(`   ✅ Expired: ${expired}`);
    console.log(`   ❌ Failed: ${failed}`);
    console.log(`   📝 Total: ${snapshot.size}`);
    
    if (errors.length > 0) {
      console.log(`   ⚠️  Errors:`, errors);
    }

    return NextResponse.json({
      success: true,
      message: 'Waitlist expiry check completed',
      checked: snapshot.size,
      expired: expired,
      failed: failed,
      errors: errors.length > 0 ? errors : undefined,
      timestamp: new Date().toISOString(),
    });

  } catch (error: any) {
    console.error('❌ Waitlist expiry cron error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to process waitlist expiry',
        details: error.message,
      },
      { status: 500 }
    );
  }
}

// Export both GET and POST handlers
export async function GET(request: NextRequest) {
  return handleWaitlistExpiry(request);
}

export async function POST(request: NextRequest) {
  return handleWaitlistExpiry(request);
}
