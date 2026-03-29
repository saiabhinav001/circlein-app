import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { emailTemplates, sendEmail } from '@/lib/email-service';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const role = (session.user as any).role;
    if (role !== 'admin' && role !== 'super_admin') {
      return NextResponse.json({ error: 'Admin privileges required' }, { status: 403 });
    }

    const body = await request.json();
    const { type, data, to } = body;


    if (!type || !data) {
      return NextResponse.json(
        { success: false, error: 'Missing type or data' },
        { status: 400 }
      );
    }

    let template;
    let recipientEmail = to || data.userEmail;

    if (!recipientEmail || !recipientEmail.includes('@')) {
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

      case 'maintenance_status_update':
      case 'maintenanceStatusUpdate':
        template = emailTemplates.maintenanceStatusUpdate({
          userName: data.userName,
          requestTitle: data.requestTitle,
          status: data.status,
          updateNote: data.updateNote,
          category: data.category,
          priority: data.priority,
        });
        break;

      case 'booking_rescheduled':
      case 'bookingRescheduled':
        template = emailTemplates.bookingRescheduled({
          userName: data.userName,
          amenityName: data.amenityName,
          oldDateTime: data.oldDateTime,
          newDateTime: data.newDateTime,
          updatedBy: data.updatedBy,
        });
        break;

      case 'community_announcement':
      case 'communityAnnouncement':
        template = emailTemplates.communityAnnouncement({
          userName: data.userName,
          title: data.title,
          previewText: data.previewText,
          authorName: data.authorName,
          communityName: data.communityName,
          actionUrl: data.actionUrl,
        });
        break;

      case 'weekly_digest':
      case 'weeklyDigest':
        template = emailTemplates.weeklyDigest({
          userName: data.userName,
          communityName: data.communityName,
          upcomingBookings: data.upcomingBookings || [],
        });
        break;

      case 'no_show_warning':
      case 'noShowWarning':
        template = emailTemplates.noShowWarning({
          userName: data.userName,
          amenityName: data.amenityName,
          incidentDate: data.incidentDate,
          noShowCount: data.noShowCount,
          suspensionUntil: data.suspensionUntil,
        });
        break;

      case 'security_alert':
      case 'securityAlert':
        template = emailTemplates.securityAlert({
          userName: data.userName,
          alertTitle: data.alertTitle,
          alertDetails: data.alertDetails,
          occurredAt: data.occurredAt,
          actionUrl: data.actionUrl,
        });
        break;

      case 'monthly_pulse':
      case 'monthlyCommunityPulse':
        template = emailTemplates.monthlyCommunityPulse({
          userName: data.userName,
          communityName: data.communityName,
          highlights: data.highlights || [],
          actionUrl: data.actionUrl,
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

    if (!result.success) {
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

    
    return NextResponse.json({ 
      success: true, 
      messageId: result.messageId,
      type: type,
      recipient: recipientEmail
    });
  } catch (error: any) {
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
