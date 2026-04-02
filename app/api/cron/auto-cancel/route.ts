import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { emailTemplates, sendEmail } from '@/lib/email-service';
import { formatDateInTimeZone, formatDateTimeInTimeZone, resolveTimeZone } from '@/lib/timezone';
import { toDateValue } from '@/lib/support-ticket';

/**
 * AUTO-CANCELLATION CRON JOB
 * Cancels unchecked confirmed bookings after grace period and promotes waitlist users.
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

function toNumber(value: unknown, fallback: number): number {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
}

export async function GET(request: NextRequest) {
  const startedAt = Date.now();
  let cancelledCount = 0;
  let promotedCount = 0;
  let checked = 0;
  const errors: string[] = [];

  try {
    if (!hasValidCronSecret(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const now = new Date();
    const gracePeriodCutoff = new Date(now.getTime() - 25 * 60 * 1000);

    // Use a single-field query to avoid composite index dependency.
    const snapshot = await adminDb
      .collection('bookings')
      .where('startTime', '<=', gracePeriodCutoff)
      .get();
    checked = snapshot.size;

    const candidates = snapshot.docs.filter((docSnapshot) => {
      const booking = docSnapshot.data() as Record<string, unknown>;
      const status = String(booking.status || '').toLowerCase();
      return status === 'confirmed' && !booking.checkInTime;
    });

    // Process bookings
    for (const bookingDoc of candidates) {
      try {
        const booking = bookingDoc.data() as Record<string, unknown>;

        // Cancel booking
        await bookingDoc.ref.update({
          status: 'no_show',
          autoCancelledAt: now,
          updatedAt: now,
          source: 'cron_auto_cancel',
        });
        cancelledCount++;

        // Update stats (non-critical)
        try {
          const userId = String(booking.userId || '').trim();
          if (userId) {
            const userStatsRef = adminDb.collection('userBookingStats').doc(userId);
            const statsDoc = await userStatsRef.get();
            const currentNoShowCount = statsDoc.exists
              ? toNumber(statsDoc.data()?.noShowCount, 0)
              : 0;
            const nextNoShowCount = currentNoShowCount + 1;

            const statsPayload: Record<string, unknown> = {
              userId,
              noShowCount: nextNoShowCount,
              updatedAt: now,
            };

            if (!statsDoc.exists) {
              statsPayload.totalBookings = 1;
              statsPayload.createdAt = now;
            }

            if (nextNoShowCount >= 3) {
              const suspendedUntil = new Date(now);
              suspendedUntil.setDate(suspendedUntil.getDate() + 7);
              statsPayload.suspendedUntil = suspendedUntil;
              statsPayload.suspensionReason = `${nextNoShowCount} no-shows`;
            }

            await userStatsRef.set(statsPayload, { merge: true });
          }
        } catch (statsError: any) {
          errors.push(`Stats ${bookingDoc.id}: ${statsError.message}`);
        }

        // Check waitlist
        try {
          const startTimeValue = booking.startTime;
          if (!startTimeValue) {
            continue;
          }

          const waitlistSnapshot = await adminDb
            .collection('bookings')
            .where('startTime', '==', startTimeValue)
            .get();

          const waitlistBookings = waitlistSnapshot.docs
            .map((docSnapshot) => ({
              id: docSnapshot.id,
              ref: docSnapshot.ref,
              data: docSnapshot.data() as Record<string, unknown>,
            }))
            .filter((candidate) => {
              const status = String(candidate.data.status || '').toLowerCase();
              return (
                status === 'waitlist' &&
                String(candidate.data.amenityId || '') === String(booking.amenityId || '')
              );
            })
            .sort((a, b) => {
              const priorityDiff =
                toNumber(b.data.priorityScore, 50) - toNumber(a.data.priorityScore, 50);
              if (priorityDiff !== 0) {
                return priorityDiff;
              }
              return (
                toNumber(a.data.waitlistPosition, 999) -
                toNumber(b.data.waitlistPosition, 999)
              );
            });

          const nextInLine = waitlistBookings[0];
          if (!nextInLine) {
            continue;
          }

          const confirmationDeadline = new Date(now.getTime() + (30 * 60 * 1000));

          await nextInLine.ref.update({
            status: 'pending_confirmation',
            waitlistPromotedAt: now,
            confirmationDeadline,
            updatedAt: now,
            source: 'cron_auto_cancel',
          });

          promotedCount++;

          // Send email (non-critical)
          try {
            const recipientEmail = String(nextInLine.data.userEmail || '').trim();
            if (!recipientEmail || !recipientEmail.includes('@')) {
              continue;
            }

            const communityId = String(booking.communityId || '').trim();
            let communityTimeZone = 'UTC';
            if (communityId) {
              const settingsSnapshot = await adminDb.collection('settings').doc(communityId).get();
              const settingsData = settingsSnapshot.data() as Record<string, unknown> | undefined;
              const nestedCommunity = settingsData?.community;
              const communityRecord = nestedCommunity && typeof nestedCommunity === 'object'
                ? (nestedCommunity as Record<string, unknown>)
                : undefined;
              const timezoneValue = communityRecord?.timezone ?? settingsData?.timezone;
              communityTimeZone = resolveTimeZone(
                typeof timezoneValue === 'string' ? timezoneValue : undefined
              );
            }

            const bookingStart = toDateValue(booking.startTime) || now;
            const emailTemplate = emailTemplates.waitlistPromotion({
              userName: String(nextInLine.data.userName || 'Resident'),
              amenityName: String(booking.amenityName || 'Amenity'),
              date: formatDateInTimeZone(bookingStart, communityTimeZone, {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              }),
              timeSlot: String(nextInLine.data.selectedSlot || 'Time slot'),
              confirmationDeadline: formatDateTimeInTimeZone(
                confirmationDeadline,
                communityTimeZone
              ),
              bookingId: nextInLine.id,
              flatNumber: String(nextInLine.data.userFlatNumber || ''),
            });

            await sendEmail({
              to: recipientEmail,
              subject: emailTemplate.subject,
              html: emailTemplate.html,
            });
          } catch (emailError: any) {
            errors.push(`Promotion email ${bookingDoc.id}: ${emailError.message}`);
          }
        } catch (waitlistError: any) {
          errors.push(`Waitlist ${bookingDoc.id}: ${waitlistError.message}`);
        }
      } catch (bookingError: any) {
        errors.push(`Booking ${bookingDoc.id}: ${bookingError.message}`);
      }
    }

    return NextResponse.json({ 
      success: true,
      message: 'Auto-cancel check completed',
      checked,
      eligible: candidates.length,
      cancelled: cancelledCount,
      promoted: promotedCount,
      failed: errors.length,
      errors: errors.length > 0 ? errors : undefined,
      durationMs: Date.now() - startedAt,
      timestamp: now.toISOString()
    });

  } catch (error: any) {
    return NextResponse.json({ 
      success: false,
      error: error.message,
      cancelled: cancelledCount,
      promoted: promotedCount,
      errors,
      durationMs: Date.now() - startedAt,
    }, { status: 500 });
  }
}
