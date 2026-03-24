import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { emailTemplates, sendEmail } from '@/lib/email-service';
import { formatDateInTimeZone, formatTimeInTimeZone, resolveTimeZone } from '@/lib/timezone';

interface DigestUser {
  email: string;
  name: string;
  communityId?: string;
  notificationPreferences?: Record<string, boolean>;
}

function isAuthorized(request: NextRequest): boolean {
  const configuredSecret = process.env.CRON_SECRET;
  if (!configuredSecret) {
    return true;
  }

  const authHeader = request.headers.get('authorization') || '';
  const token = authHeader.replace('Bearer ', '').trim();
  return token === configuredSecret;
}

async function handleWeeklyDigest(request: NextRequest): Promise<NextResponse> {
  try {
    if (!isAuthorized(request)) {
      return NextResponse.json({ error: 'Unauthorized cron call' }, { status: 401 });
    }

    const usersSnapshot = await adminDb.collection('users').get();
    const users = usersSnapshot.docs
      .map((docSnap) => ({ ...(docSnap.data() as any), email: docSnap.id } as DigestUser))
      .filter((user) => !!user.email);

    const digestUsers = users.filter((user) => {
      const prefs = user.notificationPreferences || (user as any).residentSettings?.notifications || {};
      return Boolean(prefs.weeklyDigest) && Boolean(prefs.emailDigest);
    });

    const now = new Date();
    const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    let sent = 0;
    let failed = 0;

    for (const user of digestUsers) {
      try {
        const settingsDoc = user.communityId
          ? await adminDb.collection('settings').doc(user.communityId).get()
          : null;
        const settingsData = settingsDoc?.data() as any;
        const communityTimeZone = resolveTimeZone(settingsData?.community?.timezone || settingsData?.timezone);

        const bookingsSnapshot = await adminDb
          .collection('bookings')
          .where('userEmail', '==', user.email)
          .where('status', '==', 'confirmed')
          .get();

        const upcomingBookings = bookingsSnapshot.docs
          .map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }))
          .filter((booking: any) => {
            const start = booking.startTime?.toDate?.() ? booking.startTime.toDate() : new Date(booking.startTime);
            return start >= now && start <= weekFromNow;
          })
          .sort((a: any, b: any) => {
            const aTime = a.startTime?.toDate?.() ? a.startTime.toDate().getTime() : new Date(a.startTime).getTime();
            const bTime = b.startTime?.toDate?.() ? b.startTime.toDate().getTime() : new Date(b.startTime).getTime();
            return aTime - bTime;
          });

        const mappedBookings = upcomingBookings.slice(0, 8).map((booking: any) => {
          const start = booking.startTime?.toDate?.() ? booking.startTime.toDate() : new Date(booking.startTime);
          const end = booking.endTime?.toDate?.() ? booking.endTime.toDate() : new Date(booking.endTime);
          return {
            amenityName: booking.amenityName || 'Amenity',
            dateLabel: formatDateInTimeZone(start, communityTimeZone, {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
            }),
            timeLabel: `${formatTimeInTimeZone(start, communityTimeZone)} - ${formatTimeInTimeZone(end, communityTimeZone)}`,
          };
        });

        const template = emailTemplates.weeklyDigest({
          userName: user.name || user.email.split('@')[0],
          communityName: (user as any).communityName || 'your community',
          upcomingBookings: mappedBookings,
        });

        const emailResult = await sendEmail({
          to: user.email,
          subject: template.subject,
          html: template.html,
        });

        if (emailResult.success) {
          sent += 1;
        } else {
          failed += 1;
        }
      } catch (userError) {
        console.error('Failed weekly digest for user:', user.email, userError);
        failed += 1;
      }
    }

    return NextResponse.json({
      success: true,
      scannedUsers: users.length,
      eligibleUsers: digestUsers.length,
      sent,
      failed,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Weekly digest cron failed:', error);
    return NextResponse.json(
      { error: error.message || 'Weekly digest cron failed' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  return handleWeeklyDigest(request);
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  return handleWeeklyDigest(request);
}
