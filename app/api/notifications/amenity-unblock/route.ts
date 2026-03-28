import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { adminDb } from '@/lib/firebase-admin';
import { emailTemplates, sendBatchEmails } from '@/lib/email-service';

/**
 * API endpoint to send amenity unblock notification emails to all community residents
 * Uses batch processing for immediate parallel email delivery
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify admin role
    const userRole = (session.user as any).role;
    if (userRole !== 'admin') {
      return NextResponse.json({ error: 'Only admins can send amenity unblock notifications' }, { status: 403 });
    }

    const body = await req.json();
    const { amenityName, communityId, communityName } = body;

    if (!amenityName || !communityId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }


    // Get all RESIDENTS in this community (exclude admins)
    const usersSnapshot = await adminDb
      .collection('users')
      .where('communityId', '==', communityId)
      .where('role', '==', 'resident')
      .get();

    if (usersSnapshot.empty) {
      return NextResponse.json({ 
        success: true,
        message: 'No residents to notify',
        sent: 0,
        failed: 0,
        total: 0
      }, { status: 200 });
    }

    // Prepare all emails for batch sending
    const emails: Array<{ to: string; subject: string; html: string }> = [];
    
    usersSnapshot.forEach((doc: any) => {
      const userData = doc.data();
      if (userData.email) {
        const template = emailTemplates.amenityUnblocked({
          userName: userData.name || userData.email?.split('@')[0] || 'Resident',
          amenityName: amenityName,
          communityName: communityName || 'Your Community',
          bookingUrl: `${process.env.NEXTAUTH_URL}/amenity`,
          flatNumber: userData.flatNumber,
        });

        emails.push({
          to: userData.email,
          subject: template.subject,
          html: template.html,
        });
      }
    });


    // Send all emails in parallel batches (10 at a time) - MUCH FASTER!
    const results = await sendBatchEmails(emails, 'amenityUnblocked');


    return NextResponse.json({
      success: true,
      message: `Amenity unblock notifications sent`,
      sent: results.sent,
      failed: results.failed,
      total: emails.length,
    });

  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to send amenity unblock notifications', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
