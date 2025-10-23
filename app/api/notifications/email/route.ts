import { NextRequest, NextResponse } from 'next/server';
import { emailTemplates, sendEmail } from '@/lib/email-service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, data } = body;

    if (!type || !data) {
      return NextResponse.json(
        { error: 'Missing type or data' },
        { status: 400 }
      );
    }

    let template;
    let recipientEmail = data.userEmail;

    switch (type) {
      case 'booking_confirmation':
        template = emailTemplates.bookingConfirmation({
          userName: data.userName,
          amenityName: data.amenityName,
          date: data.date,
          timeSlot: data.timeSlot,
          bookingId: data.bookingId,
          communityName: data.communityName,
        });
        break;

      case 'booking_reminder':
        template = emailTemplates.bookingReminder({
          userName: data.userName,
          amenityName: data.amenityName,
          date: data.date,
          timeSlot: data.timeSlot,
          bookingId: data.bookingId,
        });
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid notification type' },
          { status: 400 }
        );
    }

    const result = await sendEmail({
      to: recipientEmail,
      subject: template.subject,
      html: template.html,
    });

    if (result.success) {
      return NextResponse.json({ 
        success: true, 
        messageId: result.messageId 
      });
    } else {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('Email notification error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to send email notification' },
      { status: 500 }
    );
  }
}
