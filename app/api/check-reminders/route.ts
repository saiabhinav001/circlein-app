import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { emailTemplates, sendEmail } from '@/lib/email-service';

/**
 * This endpoint can be called from the client-side to check and send reminders
 * Alternative to Vercel Cron (which requires Pro plan)
 */
export async function POST() {
  try {
    console.log('🔔 Checking for booking reminders...');

    const now = new Date();
    const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);

    // Get all confirmed bookings
    const bookingsSnapshot = await adminDb
      .collection('bookings')
      .where('status', '==', 'confirmed')
      .get();

    let remindersSent = 0;
    const promises = [];

    for (const doc of bookingsSnapshot.docs) {
      const booking = doc.data();
      
      // Parse booking date and time
      const bookingDateTime = new Date(`${booking.date}T${booking.startTime}`);
      
      // Check if booking is approximately 1 hour away (within 10 minute window)
      const timeDiff = bookingDateTime.getTime() - now.getTime();
      const isOneHourAway = timeDiff > 50 * 60 * 1000 && timeDiff < 70 * 60 * 1000;

      if (isOneHourAway && !booking.reminderSent) {
        // Get user details
        const userDoc = await adminDb.collection('users').doc(booking.userId).get();
        const user = userDoc.data();

        if (user?.email) {
          const template = emailTemplates.bookingReminder({
            userName: user.name || 'Resident',
            amenityName: booking.amenityName || 'Amenity',
            date: booking.date,
            timeSlot: `${booking.startTime} - ${booking.endTime}`,
            bookingId: doc.id,
          });

          // Send reminder email
          const emailPromise = sendEmail({
            to: user.email,
            subject: template.subject,
            html: template.html,
          }).then(() => {
            // Mark reminder as sent
            return adminDb.collection('bookings').doc(doc.id).update({
              reminderSent: true,
              reminderSentAt: new Date().toISOString(),
            });
          });

          promises.push(emailPromise);
          remindersSent++;
        }
      }
    }

    // Wait for all emails to be sent
    await Promise.all(promises);

    console.log(`✅ Sent ${remindersSent} reminder(s)`);

    return NextResponse.json({
      success: true,
      remindersSent,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('❌ Reminder check failed:', error);
    return NextResponse.json(
      {
        error: 'Failed to check reminders',
        details: error.message,
      },
      { status: 500 }
    );
  }
}
