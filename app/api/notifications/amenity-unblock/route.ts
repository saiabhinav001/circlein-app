import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { adminDb } from '@/lib/firebase-admin';
import { emailTemplates, sendEmail } from '@/lib/email-service';

/**
 * API endpoint to send amenity unblock notification emails to all community residents
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

    console.log(`📧 Sending amenity unblock emails for: ${amenityName} in ${communityName}`);

    // Get all users in this community
    const usersSnapshot = await adminDb
      .collection('users')
      .where('communityId', '==', communityId)
      .get();

    if (usersSnapshot.empty) {
      console.log('⚠️ No users found in this community');
      return NextResponse.json({ message: 'No users found', sent: 0 }, { status: 200 });
    }

    const users = usersSnapshot.docs.map(doc => ({
      email: doc.data().email,
      name: doc.data().name || doc.data().email?.split('@')[0] || 'Resident',
      flatNumber: doc.data().flatNumber,
    }));

    console.log(`📬 Found ${users.length} users to notify`);

    // Send emails to all users
    let successCount = 0;
    let failCount = 0;

    for (const user of users) {
      try {
        const template = emailTemplates.amenityUnblocked({
          userName: user.name,
          amenityName: amenityName,
          communityName: communityName || 'Your Community',
          bookingUrl: `${process.env.NEXTAUTH_URL}/amenity`,
          flatNumber: user.flatNumber,
        });

        const result = await sendEmail({
          to: user.email,
          subject: template.subject,
          html: template.html,
        });

        if (result.success) {
          successCount++;
        } else {
          failCount++;
          console.error(`❌ Failed to send to ${user.email}:`, result.error);
        }
      } catch (error) {
        failCount++;
        console.error(`❌ Error sending to ${user.email}:`, error);
      }
    }

    console.log(`✅ Sent ${successCount}/${users.length} amenity unblock emails`);

    return NextResponse.json({
      success: true,
      message: `Amenity unblock notifications sent`,
      sent: successCount,
      failed: failCount,
      total: users.length,
    });

  } catch (error) {
    console.error('❌ Amenity unblock notification error:', error);
    return NextResponse.json(
      { error: 'Failed to send amenity unblock notifications', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
