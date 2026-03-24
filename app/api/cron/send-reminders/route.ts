import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, query, where, getDoc, getDocs, Timestamp, updateDoc, doc as docRef } from 'firebase/firestore';
import { emailTemplates, sendEmail } from '@/lib/email-service';
import { formatDateInTimeZone, formatDateTimeInTimeZone, formatTimeInTimeZone, resolveTimeZone } from '@/lib/timezone';

/**
 * 🔔 1-HOUR BOOKING REMINDER ENDPOINT
 * 
 * Purpose: Send reminder emails to users 1 hour before their booking
 * 
 * Called by: External cron service (cron-job.org) every 15 minutes
 * URL: https://your-app.vercel.app/api/cron/send-reminders
 * 
 * Flow:
 * 1. Find all confirmed bookings starting in 45-75 minutes
 * 2. Check if reminder was already sent
 * 3. Send reminder email
 * 4. Mark reminder as sent in Firestore
 * 
 * Security: Publicly accessible (excluded from middleware), safe for production
 */

async function handleReminderCheck(request: NextRequest) {
  try {
    console.log('\n🔔 === BOOKING REMINDER CHECK ===');
    console.log(`   ⏰ Time: ${new Date().toISOString()}`);

    // 1. CALCULATE TIME WINDOW (45-75 minutes from now)
    const now = new Date();
    const minTime = new Date(now.getTime() + 45 * 60 * 1000); // 45 minutes
    const maxTime = new Date(now.getTime() + 75 * 60 * 1000); // 75 minutes

    console.log(`   📊 Checking bookings between:`);
    console.log(`      ${minTime.toISOString()} - ${maxTime.toISOString()}`);

    // 2. QUERY CONFIRMED BOOKINGS IN TIME WINDOW
    const bookingsRef = collection(db, 'bookings');
    const bookingsQuery = query(
      bookingsRef,
      where('status', '==', 'confirmed'),
      where('startTime', '>=', Timestamp.fromDate(minTime)),
      where('startTime', '<=', Timestamp.fromDate(maxTime)),
      where('reminderSent', '==', false) // Only send once
    );

    const snapshot = await getDocs(bookingsQuery);

    console.log(`   📋 Found ${snapshot.size} bookings needing reminders`);

    if (snapshot.empty) {
      return NextResponse.json({
        success: true,
        message: 'No reminders to send',
        checked: 0,
        sent: 0,
      });
    }

    // 3. SEND REMINDERS
    let sent = 0;
    let failed = 0;
    const errors: string[] = [];
    const timeZoneCache = new Map<string, string>();

    for (const doc of snapshot.docs) {
      const booking = doc.data();
      
      try {
        console.log(`   📧 Sending reminder for booking ${doc.id}`);
        console.log(`      User: ${booking.userEmail}`);
        console.log(`      Amenity: ${booking.amenityName}`);

        const communityId = booking.communityId || 'default';
        let communityTimeZone = timeZoneCache.get(communityId);
        if (!communityTimeZone) {
          if (booking.communityId) {
            const settingsSnapshot = await getDoc(docRef(db, 'settings', booking.communityId));
            const settingsData = settingsSnapshot.data() as any;
            communityTimeZone = resolveTimeZone(settingsData?.community?.timezone || settingsData?.timezone);
          } else {
            communityTimeZone = 'UTC';
          }
          timeZoneCache.set(communityId, communityTimeZone);
        }

        console.log(`      Time: ${formatDateTimeInTimeZone(booking.startTime.toDate(), communityTimeZone)}`);

        // Get amenity details if needed
        const amenityName = booking.amenityName || 'Amenity';
        const startTime = booking.startTime.toDate();
        const timeSlot = booking.timeSlot || 
          `${formatTimeInTimeZone(startTime, communityTimeZone)}`;

        // Generate email template
        const template = emailTemplates.bookingReminder({
          userName: booking.userName || booking.userEmail.split('@')[0],
          amenityName: amenityName,
          date: formatDateInTimeZone(startTime, communityTimeZone, {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          }),
          timeSlot: timeSlot,
          bookingId: doc.id,
          flatNumber: booking.flatNumber,
        });

        // Send email
        const result = await sendEmail({
          to: booking.userEmail,
          subject: template.subject,
          html: template.html,
        });

        if (result.success) {
          // Mark reminder as sent in Firestore
          const bookingRef = docRef(db, 'bookings', booking.id);
          await updateDoc(bookingRef, {
            reminderSent: true,
            reminderSentAt: Timestamp.now(),
          });

          console.log(`      ✅ Reminder sent successfully`);
          console.log(`      📨 Message ID: ${result.messageId}`);
          sent++;
        } else {
          console.error(`      ❌ Failed to send: ${result.error}`);
          errors.push(`${booking.userEmail}: ${result.error}`);
          failed++;
        }

      } catch (error: any) {
        console.error(`      ❌ Error processing booking ${doc.id}:`, error.message);
        errors.push(`${doc.id}: ${error.message}`);
        failed++;
      }

      // Add small delay between emails to avoid rate limits
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // 4. SUMMARY
    console.log('\n📊 === REMINDER SUMMARY ===');
    console.log(`   ✅ Sent: ${sent}`);
    console.log(`   ❌ Failed: ${failed}`);
    console.log(`   📝 Total: ${snapshot.size}`);
    
    if (errors.length > 0) {
      console.log(`   ⚠️  Errors:`, errors);
    }

    return NextResponse.json({
      success: true,
      message: 'Reminder check completed',
      checked: snapshot.size,
      sent: sent,
      failed: failed,
      errors: errors.length > 0 ? errors : undefined,
      timestamp: new Date().toISOString(),
    });

  } catch (error: any) {
    console.error('❌ Reminder cron error:', error);
    return NextResponse.json(
      { 
        error: error.message,
        success: false,
      },
      { status: 500 }
    );
  }
}

// Export as GET handler
export async function GET(request: NextRequest) {
  return handleReminderCheck(request);
}

// Also support POST for testing
export async function POST(request: NextRequest) {
  return handleReminderCheck(request);
}
