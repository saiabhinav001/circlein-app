import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { toDateValue } from '@/lib/support-ticket';

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

async function handleWaitlistExpiry(request: NextRequest) {
  try {
    if (!hasValidCronSecret(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const now = new Date();
    const snapshot = await adminDb
      .collection('bookings')
      .where('endTime', '<=', now)
      .get();

    const eligible = snapshot.docs.filter((docSnapshot) => {
      const status = String(docSnapshot.data().status || '').toLowerCase();
      return status === 'waitlist' || status === 'pending_confirmation';
    });


    if (eligible.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No expired waitlist entries',
        checked: snapshot.size,
        eligible: 0,
        expired: 0,
      });
    }

    // 2. EXPIRE EACH BOOKING
    let expired = 0;
    let failed = 0;
    const errors: string[] = [];

    for (const docSnapshot of eligible) {
      const booking = docSnapshot.data();
      
      try {
        const endTime = toDateValue(booking.endTime);
        if (!endTime || endTime.getTime() > now.getTime()) {
          continue;
        }

        // Update booking status to expired
        await docSnapshot.ref.update({
          status: 'expired',
          expiredAt: now,
          expiredReason: 'Time slot passed while in waitlist',
          updatedAt: now,
          source: 'cron_expire_waitlist',
        });

        expired++;

      } catch (error: any) {
        errors.push(`${docSnapshot.id}: ${error.message}`);
        failed++;
      }

      // Small delay to avoid rate limits
      await new Promise(resolve => setTimeout(resolve, 50));
    }

    // 3. SUMMARY
    

    return NextResponse.json({
      success: true,
      message: 'Waitlist expiry check completed',
      checked: snapshot.size,
      eligible: eligible.length,
      expired: expired,
      failed: failed,
      errors: errors.length > 0 ? errors : undefined,
      timestamp: new Date().toISOString(),
    });

  } catch (error: any) {
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
