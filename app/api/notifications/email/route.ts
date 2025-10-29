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
    let recipientEmail = body.to || data.userEmail;

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

      case 'booking_cancellation':
        template = emailTemplates.bookingCancellation({
          userName: data.userName,
          amenityName: data.amenityName,
          date: data.date,
          timeSlot: data.timeSlot,
          bookingId: data.bookingId,
          cancelledBy: data.cancelledBy,
          isAdminCancellation: data.isAdminCancellation || false,
          cancellationReason: data.cancellationReason,
        });
        break;

      case 'bookingWaitlist':
        template = emailTemplates.bookingWaitlist({
          userName: data.userName,
          amenityName: data.amenityName,
          date: data.date,
          timeSlot: data.timeSlot,
          waitlistPosition: data.waitlistPosition,
          communityName: data.communityName,
        });
        break;

      case 'waitlistPromoted':
        template = emailTemplates.waitlistPromoted({
          userName: data.userName,
          amenityName: data.amenityName,
          startTime: data.startTime,
          endTime: data.endTime,
          confirmationUrl: data.confirmationUrl,
          deadline: data.deadline,
          waitlistPosition: data.waitlistPosition,
        });
        break;

      case 'confirmationReminder':
        template = emailTemplates.confirmationReminder({
          userName: data.userName,
          amenityName: data.amenityName,
          startTime: data.startTime,
          confirmationUrl: data.confirmationUrl,
          hoursRemaining: data.hoursRemaining,
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

    return NextResponse.json({ 
      success: true, 
      messageId: result.messageId 
    });
  } catch (error: any) {
    console.error('Email notification error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to send email notification' },
      { status: 500 }
    );
  }
}
