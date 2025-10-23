import { NextRequest, NextResponse } from 'next/server';
import { emailTemplates, sendBatchEmails } from '@/lib/email-service';
import { db } from '@/lib/firebase-admin';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      amenityName, 
      reason, 
      startDate, 
      endDate, 
      communityId, 
      communityName,
      isFestive 
    } = body;

    if (!amenityName || !reason || !startDate || !endDate || !communityId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get all residents' emails from the community
    const usersSnapshot = await db
      .collection('users')
      .where('communityId', '==', communityId)
      .where('role', '==', 'resident')
      .get();

    const residentEmails: string[] = [];
    usersSnapshot.forEach(doc => {
      const email = doc.data().email;
      if (email) residentEmails.push(email);
    });

    if (residentEmails.length === 0) {
      return NextResponse.json({ 
        success: true, 
        message: 'No residents to notify' 
      });
    }

    // Generate email template
    const template = emailTemplates.amenityBlocked({
      amenityName,
      reason,
      startDate,
      endDate,
      communityName: communityName || 'Your Community',
      isFestive: isFestive || false,
    });

    // Send batch emails
    console.log(`📧 Sending amenity block notifications to ${residentEmails.length} residents`);
    const results = await sendBatchEmails(residentEmails, template);

    const successCount = results.filter(r => r.success).length;
    const failCount = results.length - successCount;

    return NextResponse.json({ 
      success: true,
      sent: successCount,
      failed: failCount,
      total: residentEmails.length
    });

  } catch (error: any) {
    console.error('Amenity block notification error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to send notifications' },
      { status: 500 }
    );
  }
}
