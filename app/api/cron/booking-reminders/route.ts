import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { emailTemplates, sendEmail } from '@/lib/email-service';

export async function GET(request: NextRequest) {
  try {
    console.log('🔔 Running booking reminder check...');

    // Get current time and 1 hour from now
    const now = new Date();
    const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);

    // Get all bookings that start in approximately 1 hour
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
      
      // Check if booking is approximately 1 hour away (within 5 minute window)
      const timeDiff = bookingDateTime.getTime() - now.getTime();
      const isOneHourAway = timeDiff > 55 * 60 * 1000 && timeDiff < 65 * 60 * 1000;

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

          const promise = sendEmail({
            to: user.email,
            subject: template.subject,
            html: template.html,
          }).then(async (result) => {
            if (result.success) {
              // Mark reminder as sent
              await adminDb.collection('bookings').doc(doc.id).update({
                reminderSent: true,
                reminderSentAt: new Date().toISOString(),
              });
              remindersSent++;
              console.log(`✅ Reminder sent for booking ${doc.id}`);
            }
          });

          promises.push(promise);
        }
      }
    }

    await Promise.all(promises);

    console.log(`✅ Sent ${remindersSent} booking reminders`);

    return NextResponse.json({
      success: true,
      remindersSent,
      timestamp: new Date().toISOString(),
    });

  } catch (error: any) {
    console.error('❌ Booking reminder cron error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
