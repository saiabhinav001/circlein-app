import { NextRequest, NextResponse } from 'next/server';
import { emailTemplates, sendEmail } from '@/lib/email-service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, data, to } = body;

    console.log('📧 Email API called:', { type, recipient: to || data?.userEmail });

    if (!type || !data) {
      console.error('❌ Missing required fields:', { type: !!type, data: !!data });
      return NextResponse.json(
        { success: false, error: 'Missing type or data' },
        { status: 400 }
      );
    }

    let template;
    let recipientEmail = to || data.userEmail;

    if (!recipientEmail || !recipientEmail.includes('@')) {
      console.error('❌ Invalid or missing recipient email:', recipientEmail);
      return NextResponse.json(
        { success: false, error: 'Invalid recipient email address' },
        { status: 400 }
      );
    }

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
      case 'bookingReminder':
        template = emailTemplates.bookingReminder({
          userName: data.userName,
          amenityName: data.amenityName,
          date: data.date,
          timeSlot: data.timeSlot,
          bookingId: data.bookingId,
        });
        break;

      case 'booking_cancellation':
      case 'bookingCancellation':
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
      case 'waitlist_promoted': // Support both naming conventions
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

      case 'waitlistAutoPromoted':
      case 'waitlist_auto_promoted': // Auto-promotion without confirmation
        template = emailTemplates.waitlistAutoPromoted({
          userName: data.userName,
          amenityName: data.amenityName,
          date: data.date,
          timeSlot: data.timeSlot,
          bookingUrl: data.bookingUrl,
          flatNumber: data.flatNumber,
        });
        break;

      case 'confirmationReminder':
      case 'confirmation_reminder': // Support both naming conventions
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

    console.log(`📧 Preparing to send ${type} email to ${recipientEmail}`);

    const result = await sendEmail({
      to: recipientEmail,
      subject: template.subject,
      html: template.html,
    });

    if (!result.success) {
      console.error(`❌ Failed to send ${type} email:`, result.error);
      return NextResponse.json(
        { 
          success: false,
          error: result.error,
          type: type,
          recipient: recipientEmail
        },
        { status: 500 }
      );
    }

    console.log(`✅ Successfully sent ${type} email to ${recipientEmail}`);
    
    return NextResponse.json({ 
      success: true, 
      messageId: result.messageId,
      type: type,
      recipient: recipientEmail
    });
  } catch (error: any) {
    console.error('❌ Email notification API error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error.message || 'Failed to send email notification',
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}
