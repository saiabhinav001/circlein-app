import { NextRequest, NextResponse } from 'next/server';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  updateDoc, 
  doc, 
  Timestamp,
  serverTimestamp,
  getDoc,
  setDoc,
  increment
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

/**
 * AUTO-CANCELLATION CRON JOB
 * Runs every 5 minutes to check for:
 * 1. Bookings that started >15 minutes ago without check-in
 * 2. Grace period: Allow 10 minutes late check-in (total 25 minutes)
 * 3. Auto-cancel and promote waitlist
 */

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  let cancelledCount = 0;
  let promotedCount = 0;
  let errors: string[] = [];

  try {
    // Verify cron secret (security) - check both formats
    const authHeader = request.headers.get('authorization');
    const cronHeader = request.headers.get('x-cron-secret');
    
    const expectedSecret = process.env.CRON_SECRET;
    const isValid = 
      authHeader === `Bearer ${expectedSecret}` || 
      cronHeader === expectedSecret;
    
    if (!isValid) {
      console.error('❌ [AUTO-CANCEL] Unauthorized access attempt');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('🔄 [AUTO-CANCEL CRON] Starting check...');

    const now = new Date();
    const gracePeriodCutoff = new Date(now.getTime() - (25 * 60 * 1000)); // 25 minutes ago (15 + 10 grace)

    // Find bookings that should be auto-cancelled
    const bookingsRef = collection(db, 'bookings');
    const targetQuery = query(
      bookingsRef,
      where('status', '==', 'confirmed'),
      where('startTime', '<=', Timestamp.fromDate(gracePeriodCutoff))
    );

    let snapshot;
    try {
      snapshot = await getDocs(targetQuery);
      console.log(`   📊 Found ${snapshot.docs.length} bookings to check`);
    } catch (queryError: any) {
      console.error('   ❌ Query failed:', queryError.message);
      throw new Error(`Firestore query failed: ${queryError.message}`);
    }

    // Process each booking individually with error isolation
    for (const bookingDoc of snapshot.docs) {
      try {
        const booking = bookingDoc.data();
        
        // Skip if already checked in
        if (booking.checkInTime) {
          console.log(`   ⏭️  Skipping ${bookingDoc.id} - already checked in`);
          continue;
        }

        // Auto-cancel this booking
        try {
          await updateDoc(doc(db, 'bookings', bookingDoc.id), {
            status: 'no_show',
            autoCancelledAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          });
          cancelledCount++;
          console.log(`   ❌ Auto-cancelled booking ${bookingDoc.id}`);
        } catch (updateError: any) {
          const errMsg = `Failed to cancel ${bookingDoc.id}: ${updateError.message}`;
          console.error(`   ⚠️  ${errMsg}`);
          errors.push(errMsg);
          continue; // Skip to next booking
        }

        // Increment user's no-show count
        try {
          const userStatsRef = doc(db, 'userBookingStats', booking.userId);
          const statsDoc = await getDoc(userStatsRef);
          
          if (statsDoc.exists()) {
            await updateDoc(userStatsRef, {
              noShowCount: increment(1),
              updatedAt: serverTimestamp()
            });
          } else {
            await setDoc(userStatsRef, {
              userId: booking.userId,
              noShowCount: 1,
              totalBookings: 1,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp()
            });
          }
          console.log(`   📊 Updated stats for user ${booking.userId}`);
        } catch (statsError: any) {
          console.error(`   ⚠️  Stats update failed: ${statsError.message}`);
          // Non-critical - continue
        }

        // Check for waitlist to promote
        try {
          const waitlistQuery = query(
            bookingsRef,
            where('amenityId', '==', booking.amenityId),
            where('startTime', '==', booking.startTime),
            where('status', '==', 'waitlist')
          );

          const waitlistSnapshot = await getDocs(waitlistQuery);
          
          if (waitlistSnapshot.empty) {
            console.log(`   ℹ️  No waitlist for ${booking.amenityName}`);
            continue;
          }

          // Sort by waitlist position
          const waitlistBookings = waitlistSnapshot.docs
            .map(doc => ({ id: doc.id, ...doc.data() }))
            .sort((a: any, b: any) => (a.waitlistPosition || 999) - (b.waitlistPosition || 999));

          const nextInLine = waitlistBookings[0] as any;
          
          // Promote to pending confirmation
          const confirmationDeadline = new Date(now.getTime() + (30 * 60 * 1000));
          
          await updateDoc(doc(db, 'bookings', nextInLine.id), {
            status: 'pending_confirmation',
            waitlistPromotedAt: serverTimestamp(),
            confirmationDeadline: Timestamp.fromDate(confirmationDeadline),
            updatedAt: serverTimestamp()
          });

          promotedCount++;
          console.log(`   🎉 Promoted ${nextInLine.id} from waitlist`);

          // Send promotion email
          try {
            const { emailTemplates, sendEmail } = await import('@/lib/email-service');
            
            const emailTemplate = emailTemplates.waitlistPromotion({
              userName: nextInLine.userName || 'Resident',
              amenityName: booking.amenityName,
              date: booking.startTime.toDate().toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              }),
              timeSlot: nextInLine.selectedSlot || `${booking.startTime.toDate().toLocaleTimeString()} - ${booking.endTime.toDate().toLocaleTimeString()}`,
              confirmationDeadline: confirmationDeadline.toLocaleString(),
              bookingId: nextInLine.id,
              flatNumber: nextInLine.userFlatNumber || ''
            });

            await sendEmail({
              to: nextInLine.userEmail,
              subject: emailTemplate.subject,
              html: emailTemplate.html
            });

            console.log(`   📧 Sent email to ${nextInLine.userEmail}`);
          } catch (emailError: any) {
            console.error(`   ⚠️  Email failed: ${emailError.message}`);
            // Non-critical - promotion already done
          }
        } catch (waitlistError: any) {
          const errMsg = `Waitlist promotion failed: ${waitlistError.message}`;
          console.error(`   ⚠️  ${errMsg}`);
          errors.push(errMsg);
          // Continue to next booking
        }
      } catch (bookingError: any) {
        const errMsg = `Error processing booking ${bookingDoc.id}: ${bookingError.message}`;
        console.error(`   ❌ ${errMsg}`);
        errors.push(errMsg);
        // Continue to next booking
      }
    }

    const duration = Date.now() - startTime;
    console.log(`✅ [AUTO-CANCEL CRON] Complete in ${duration}ms`);
    console.log(`   📊 Results: ${cancelledCount} cancelled, ${promotedCount} promoted`);
    if (errors.length > 0) {
      console.log(`   ⚠️  ${errors.length} non-critical errors occurred`);
    }

    return NextResponse.json({ 
      success: true, 
      cancelled: cancelledCount,
      promoted: promotedCount,
      errors: errors.length > 0 ? errors : undefined,
      duration: `${duration}ms`,
      timestamp: now.toISOString()
    });

  } catch (error: any) {
    const duration = Date.now() - startTime;
    console.error('❌ [AUTO-CANCEL CRON] Critical error:', error);
    console.error('   Stack:', error.stack);
    
    return NextResponse.json({ 
      success: false,
      error: 'Cron job failed', 
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      cancelled: cancelledCount,
      promoted: promotedCount,
      errors,
      duration: `${duration}ms`
    }, { status: 500 });
  }
}
