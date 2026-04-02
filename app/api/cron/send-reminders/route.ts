import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { emailTemplates, sendEmail } from '@/lib/email-service';
import { formatDateInTimeZone, formatTimeInTimeZone, resolveTimeZone } from '@/lib/timezone';
import { toDateValue } from '@/lib/support-ticket';

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

function hasValidCronSecret(request: NextRequest): boolean {
  const expected = process.env.CRON_SECRET;
  if (!expected) {
    return false;
  }

  const authHeader = request.headers.get('authorization') || '';
  const bearerToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
  const headerToken = request.headers.get('x-cron-secret') || '';
  const queryToken = request.nextUrl.searchParams.get('secret') || '';

  return bearerToken === expected || headerToken === expected || queryToken === expected;
}

async function handleReminderCheck(request: NextRequest) {
  try {
    if (!hasValidCronSecret(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 1. CALCULATE TIME WINDOW (45-75 minutes from now)
    const now = new Date();
    const minTime = new Date(now.getTime() + 45 * 60 * 1000); // 45 minutes
    const maxTime = new Date(now.getTime() + 75 * 60 * 1000); // 75 minutes

    // 2. QUERY CONFIRMED BOOKINGS IN TIME WINDOW
    const snapshot = await adminDb
      .collection('bookings')
      .where('startTime', '>=', minTime)
      .where('startTime', '<=', maxTime)
      .get();

    const candidates = snapshot.docs.filter((docSnapshot) => {
      const booking = docSnapshot.data() as Record<string, unknown>;
      const status = String(booking.status || '').toLowerCase();
      const sentTypes = Array.isArray(booking.reminderSentTypes)
        ? booking.reminderSentTypes.map((value) => String(value))
        : [];
      const alreadySent = Boolean(booking.reminderSent) || sentTypes.includes('1h');
      return status === 'confirmed' && !alreadySent;
    });


    if (candidates.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No reminders to send',
        checked: snapshot.size,
        eligible: 0,
        sent: 0,
      });
    }

    // 3. SEND REMINDERS
    let sent = 0;
    let failed = 0;
    const errors: string[] = [];
    const timeZoneCache = new Map<string, string>();

    for (const docSnapshot of candidates) {
      const booking = docSnapshot.data() as Record<string, unknown>;
      
      try {
        const bookingStart = toDateValue(booking.startTime);
        if (!bookingStart) {
          throw new Error('Missing or invalid booking startTime');
        }

        const communityId = String(booking.communityId || 'default');
        let communityTimeZone = timeZoneCache.get(communityId);
        if (!communityTimeZone) {
          if (booking.communityId) {
            const settingsSnapshot = await adminDb.collection('settings').doc(String(booking.communityId)).get();
            const settingsData = settingsSnapshot.data() as Record<string, unknown> | undefined;
            const nestedCommunity = settingsData?.community;
            const communityRecord = nestedCommunity && typeof nestedCommunity === 'object'
              ? (nestedCommunity as Record<string, unknown>)
              : undefined;
            const timezoneValue = communityRecord?.timezone ?? settingsData?.timezone;
            communityTimeZone = resolveTimeZone(typeof timezoneValue === 'string' ? timezoneValue : undefined);
          } else {
            communityTimeZone = 'UTC';
          }
          timeZoneCache.set(communityId, communityTimeZone);
        }

        // Get amenity details if needed
        const amenityName = String(booking.amenityName || 'Amenity');
        const timeSlot = String(booking.timeSlot || `${formatTimeInTimeZone(bookingStart, communityTimeZone)}`);
        const recipientEmail = String(booking.userEmail || '').trim();
        if (!recipientEmail || !recipientEmail.includes('@')) {
          throw new Error('Missing recipient email');
        }

        // Generate email template
        const template = emailTemplates.bookingReminder({
          userName: String(booking.userName || recipientEmail.split('@')[0]),
          amenityName: amenityName,
          date: formatDateInTimeZone(bookingStart, communityTimeZone, {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          }),
          timeSlot: timeSlot,
          bookingId: docSnapshot.id,
          flatNumber: String(booking.flatNumber || ''),
        });

        // Send email
        const result = await sendEmail({
          to: recipientEmail,
          subject: template.subject,
          html: template.html,
        });

        if (result.success) {
          // Mark reminder as sent in Firestore
          const reminderTypes = Array.isArray(booking.reminderSentTypes)
            ? booking.reminderSentTypes.map((value) => String(value))
            : [];
          if (!reminderTypes.includes('1h')) {
            reminderTypes.push('1h');
          }

          await docSnapshot.ref.update({
            reminderSent: true,
            reminderSentAt: now,
            reminderSentTypes: reminderTypes,
            updatedAt: now,
          });

          sent++;
        } else {
          errors.push(`${recipientEmail}: ${result.error}`);
          failed++;
        }

      } catch (error: any) {
        errors.push(`${docSnapshot.id}: ${error.message}`);
        failed++;
      }

      // Add small delay between emails to avoid rate limits
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // 4. SUMMARY
    

    return NextResponse.json({
      success: true,
      message: 'Reminder check completed',
      checked: snapshot.size,
      eligible: candidates.length,
      sent: sent,
      failed: failed,
      errors: errors.length > 0 ? errors : undefined,
      timestamp: new Date().toISOString(),
    });

  } catch (error: any) {
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
