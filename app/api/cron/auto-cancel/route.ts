import { NextRequest, NextResponse } from 'next/server';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  updateDoc, 
  doc, 
  Timestamp,
  serverTimestamp 
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
  try {
    // Verify cron secret (security)
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
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

    const snapshot = await getDocs(targetQuery);
    console.log(`   📊 Found ${snapshot.docs.length} bookings to check`);

    let cancelledCount = 0;
    let promotedCount = 0;

    for (const bookingDoc of snapshot.docs) {
      const booking = bookingDoc.data();
      
      // Skip if already checked in
      if (booking.checkInTime) {
        continue;
      }

      // Auto-cancel this booking
      await updateDoc(doc(db, 'bookings', bookingDoc.id), {
        status: 'no_show',
        autoCancelledAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      cancelledCount++;
      console.log(`   ❌ Auto-cancelled booking ${bookingDoc.id} (no check-in)`);

      // Increment user's no-show count
      try {
        const userStatsRef = doc(db, 'userBookingStats', booking.userId);
        const statsSnap = await getDocs(query(collection(db, 'userBookingStats'), where('userId', '==', booking.userId)));
        
        if (!statsSnap.empty) {
          const currentStats = statsSnap.docs[0].data();
          await updateDoc(statsSnap.docs[0].ref, {
            noShowCount: (currentStats.noShowCount || 0) + 1,
            updatedAt: serverTimestamp()
          });
        }
      } catch (error) {
        console.error('Failed to update user stats:', error);
      }

      // Check for waitlist to promote
      const waitlistQuery = query(
        bookingsRef,
        where('amenityId', '==', booking.amenityId),
        where('startTime', '==', booking.startTime),
        where('status', '==', 'waitlist')
      );

      const waitlistSnapshot = await getDocs(waitlistQuery);
      
      if (!waitlistSnapshot.empty) {
        // Sort by waitlist position
        const waitlistBookings = waitlistSnapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() }))
          .sort((a: any, b: any) => (a.waitlistPosition || 999) - (b.waitlistPosition || 999));

        const nextInLine = waitlistBookings[0] as any;
        
        // Promote to confirmed with 30-min deadline
        const confirmationDeadline = new Date(now.getTime() + (30 * 60 * 1000));
        
        await updateDoc(doc(db, 'bookings', nextInLine.id), {
          status: 'pending_confirmation',
          waitlistPromotedAt: serverTimestamp(),
          confirmationDeadline: Timestamp.fromDate(confirmationDeadline),
          updatedAt: serverTimestamp()
        });

        promotedCount++;
        console.log(`   🎉 Promoted waitlist booking ${nextInLine.id} (30-min to confirm)`);

        // Send promotion notification
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

          console.log(`   📧 Sent promotion email to ${nextInLine.userEmail}`);
        } catch (emailError) {
          console.error('Failed to send promotion email:', emailError);
        }
      }
    }

    console.log(`✅ [AUTO-CANCEL CRON] Complete: ${cancelledCount} cancelled, ${promotedCount} promoted`);

    return NextResponse.json({ 
      success: true, 
      cancelled: cancelledCount,
      promoted: promotedCount,
      timestamp: now.toISOString()
    });

  } catch (error: any) {
    console.error('❌ [AUTO-CANCEL CRON] Error:', error);
    return NextResponse.json({ 
      error: 'Cron job failed', 
      message: error.message 
    }, { status: 500 });
  }
}
