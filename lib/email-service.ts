import nodemailer from 'nodemailer';

// Email configuration
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER || 'circleinapp1@gmail.com',
    pass: process.env.EMAIL_PASSWORD,
  },
});

// Helper function to format dates beautifully
const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  const options: Intl.DateTimeFormatOptions = { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  };
  return date.toLocaleDateString('en-US', options);
};

// Email templates with beautiful HTML
export const emailTemplates = {
  bookingConfirmation: (data: {
    userName: string;
    amenityName: string;
    date: string;
    timeSlot: string;
    bookingId: string;
    communityName: string;
  }) => ({
    subject: `✅ Booking Confirmed - ${data.amenityName}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
              line-height: 1.6; 
              color: #1a202c;
              background: #f7fafc;
            }
            .email-wrapper { 
              max-width: 600px; 
              margin: 0 auto; 
              background: #ffffff;
              box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            }
            .header { 
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
              color: white; 
              padding: 40px 30px; 
              text-align: center;
            }
            .header h1 { 
              font-size: 32px; 
              margin-bottom: 10px; 
              font-weight: 700;
            }
            .header p { 
              font-size: 16px; 
              opacity: 0.95;
            }
            .content { 
              background: #ffffff; 
              padding: 40px 30px;
            }
            .greeting { 
              font-size: 18px; 
              color: #2d3748; 
              margin-bottom: 20px;
            }
            .greeting strong { 
              color: #667eea; 
              font-weight: 600;
            }
            .message { 
              font-size: 16px; 
              color: #4a5568; 
              margin-bottom: 30px;
              line-height: 1.8;
            }
            .details-card { 
              background: linear-gradient(to bottom, #f7fafc, #edf2f7); 
              padding: 25px; 
              border-radius: 12px; 
              margin: 25px 0;
              border: 2px solid #e2e8f0;
            }
            .detail-row { 
              display: flex; 
              justify-content: space-between; 
              align-items: center;
              padding: 15px 0; 
              border-bottom: 1px solid #e2e8f0;
            }
            .detail-row:last-child { 
              border-bottom: none;
            }
            .detail-label { 
              font-weight: 600; 
              color: #667eea;
              font-size: 15px;
            }
            .detail-value {
              font-weight: 500;
              color: #2d3748;
              font-size: 15px;
              text-align: right;
            }
            .button { 
              display: inline-block; 
              padding: 14px 35px; 
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white; 
              text-decoration: none; 
              border-radius: 8px; 
              margin: 25px 0;
              font-weight: 600;
              font-size: 16px;
              box-shadow: 0 4px 6px rgba(102, 126, 234, 0.4);
            }
            .reminder-box {
              background: #fffbeb;
              border-left: 4px solid #f59e0b;
              padding: 20px;
              border-radius: 8px;
              margin: 25px 0;
            }
            .reminder-title {
              color: #92400e;
              font-weight: 600;
              font-size: 16px;
              margin-bottom: 10px;
            }
            .reminder-list {
              list-style: none;
              padding: 0;
            }
            .reminder-list li {
              padding: 8px 0;
              color: #78350f;
              font-size: 14px;
            }
            .footer { 
              text-align: center; 
              padding: 30px; 
              background: #f7fafc;
              color: #718096; 
              font-size: 13px;
              border-top: 1px solid #e2e8f0;
            }
            .footer-brand {
              color: #667eea;
              font-weight: 600;
              font-size: 16px;
              margin-bottom: 10px;
            }
          </style>
        </head>
        <body>
          <div class="email-wrapper">
            <div class="header">
              <h1>✅ Booking Confirmed!</h1>
              <p>Your amenity booking has been successfully confirmed</p>
            </div>
            <div class="content">
              <p class="greeting">Hi <strong>${data.userName}</strong>,</p>
              <p class="message">Great news! Your booking has been confirmed. We're excited to have you use our facilities!</p>
              
              <div class="details-card">
                <div class="detail-row">
                  <span class="detail-label">Amenity:</span>
                  <span class="detail-value">${data.amenityName}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Date:</span>
                  <span class="detail-value">${formatDate(data.date)}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Time Slot:</span>
                  <span class="detail-value">${data.timeSlot}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Community:</span>
                  <span class="detail-value">${data.communityName}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Booking ID:</span>
                  <span class="detail-value">#${data.bookingId.substring(0, 8).toUpperCase()}</span>
                </div>
              </div>

              <div class="reminder-box">
                <div class="reminder-title">📌 Important Reminders</div>
                <ul class="reminder-list">
                  <li>✓ You'll receive a reminder 1 hour before your booking</li>
                  <li>✓ Please arrive on time to make the most of your slot</li>
                  <li>✓ To cancel, please do so at least 2 hours in advance</li>
                </ul>
              </div>

              <center>
                <a href="#" class="button">View My Bookings</a>
              </center>

              <p style="margin-top: 25px; color: #718096; font-size: 14px; text-align: center;">
                Need help? Contact your community administrator for assistance.
              </p>
            </div>
            <div class="footer">
              <div class="footer-brand">CircleIn</div>
              <p>Your Community Management Platform</p>
              <p style="margin-top: 10px;">This is an automated message. Please do not reply to this email.</p>
            </div>
          </div>
        </body>
      </html>
    `,
  }),

  bookingReminder: (data: {
    userName: string;
    amenityName: string;
    date: string;
    timeSlot: string;
    bookingId: string;
  }) => ({
    subject: `⏰ Reminder: Your ${data.amenityName} booking is in 1 hour`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
              line-height: 1.6; 
              color: #1a202c;
              background: #f7fafc;
            }
            .email-wrapper { 
              max-width: 600px; 
              margin: 0 auto; 
              background: #ffffff;
              box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            }
            .header { 
              background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%); 
              color: white; 
              padding: 40px 30px; 
              text-align: center;
            }
            .header h1 { 
              font-size: 32px; 
              margin-bottom: 10px; 
              font-weight: 700;
            }
            .header p { 
              font-size: 16px; 
              opacity: 0.95;
            }
            .content { 
              background: #ffffff; 
              padding: 40px 30px;
            }
            .greeting { 
              font-size: 18px; 
              color: #2d3748; 
              margin-bottom: 20px;
            }
            .greeting strong { 
              color: #f59e0b; 
              font-weight: 600;
            }
            .message { 
              font-size: 16px; 
              color: #4a5568; 
              margin-bottom: 30px;
              line-height: 1.8;
            }
            .details-card { 
              background: linear-gradient(to bottom, #fefcbf, #fef3c7); 
              padding: 25px; 
              border-radius: 12px; 
              margin: 25px 0;
              border: 2px solid #fde68a;
            }
            .detail-row { 
              display: flex; 
              justify-content: space-between; 
              align-items: center;
              padding: 15px 0; 
              border-bottom: 1px solid #fde68a;
            }
            .detail-row:last-child { 
              border-bottom: none;
            }
            .detail-label { 
              font-weight: 600; 
              color: #d97706;
              font-size: 15px;
            }
            .detail-value {
              font-weight: 500;
              color: #92400e;
              font-size: 15px;
              text-align: right;
            }
            .urgent-box {
              background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
              padding: 25px;
              border-radius: 12px;
              margin: 25px 0;
              text-align: center;
              border: 2px solid #f59e0b;
            }
            .urgent-title {
              font-size: 24px;
              color: #d97706;
              font-weight: 700;
              margin-bottom: 10px;
            }
            .urgent-text {
              font-size: 16px;
              color: #92400e;
            }
            .button { 
              display: inline-block; 
              padding: 14px 35px; 
              background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
              color: white; 
              text-decoration: none; 
              border-radius: 8px; 
              margin: 25px 0;
              font-weight: 600;
              font-size: 16px;
              box-shadow: 0 4px 6px rgba(245, 158, 11, 0.4);
            }
            .checklist-box {
              background: #ecfdf5;
              border-left: 4px solid #10b981;
              padding: 20px;
              border-radius: 8px;
              margin: 25px 0;
            }
            .checklist-title {
              color: #065f46;
              font-weight: 600;
              font-size: 16px;
              margin-bottom: 10px;
            }
            .checklist {
              list-style: none;
              padding: 0;
            }
            .checklist li {
              padding: 8px 0;
              color: #047857;
              font-size: 14px;
            }
            .footer { 
              text-align: center; 
              padding: 30px; 
              background: #f7fafc;
              color: #718096; 
              font-size: 13px;
              border-top: 1px solid #e2e8f0;
            }
            .footer-brand {
              color: #f59e0b;
              font-weight: 600;
              font-size: 16px;
              margin-bottom: 10px;
            }
          </style>
        </head>
        <body>
          <div class="email-wrapper">
            <div class="header">
              <h1>⏰ Booking Reminder</h1>
              <p>Your booking starts in 1 hour!</p>
            </div>
            <div class="content">
              <p class="greeting">Hi <strong>${data.userName}</strong>,</p>
              <p class="message">This is a friendly reminder that your amenity booking is coming up soon!</p>
              
              <div class="urgent-box">
                <div class="urgent-title">⏰ Starting in 1 Hour</div>
                <div class="urgent-text">Please make sure you're ready!</div>
              </div>

              <div class="details-card">
                <div class="detail-row">
                  <span class="detail-label">Amenity:</span>
                  <span class="detail-value">${data.amenityName}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Date:</span>
                  <span class="detail-value">${formatDate(data.date)}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Time Slot:</span>
                  <span class="detail-value">${data.timeSlot}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Booking ID:</span>
                  <span class="detail-value">#${data.bookingId.substring(0, 8).toUpperCase()}</span>
                </div>
              </div>

              <div class="checklist-box">
                <div class="checklist-title">✅ Quick Checklist</div>
                <ul class="checklist">
                  <li>☑ Check the weather if needed</li>
                  <li>☑ Bring any necessary equipment or accessories</li>
                  <li>☑ Arrive a few minutes early</li>
                  <li>☑ Follow community guidelines</li>
                </ul>
              </div>

              <center>
                <a href="#" class="button">View Booking Details</a>
              </center>

              <p style="margin-top: 25px; color: #718096; font-size: 14px; text-align: center;">
                If you need to cancel, please contact your administrator immediately.
              </p>
            </div>
            <div class="footer">
              <div class="footer-brand">CircleIn</div>
              <p>Your Community Management Platform</p>
              <p style="margin-top: 10px;">This is an automated message. Please do not reply to this email.</p>
            </div>
          </div>
        </body>
      </html>
    `,
  }),

  bookingCancellation: (data: {
    userName: string;
    amenityName: string;
    date: string;
    timeSlot: string;
    bookingId: string;
    cancelledBy?: string;
    isAdminCancellation?: boolean;
    cancellationReason?: string;
  }) => ({
    subject: `❌ Booking Cancelled - ${data.amenityName}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
              line-height: 1.6; 
              color: #1a202c;
              background: #f7fafc;
            }
            .email-wrapper { 
              max-width: 600px; 
              margin: 0 auto; 
              background: #ffffff;
              box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            }
            .header { 
              background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); 
              color: white; 
              padding: 40px 30px; 
              text-align: center;
            }
            .header h1 { 
              font-size: 32px; 
              margin-bottom: 10px; 
              font-weight: 700;
            }
            .header p { 
              font-size: 16px; 
              opacity: 0.95;
            }
            .content { 
              background: #ffffff; 
              padding: 40px 30px;
            }
            .greeting { 
              font-size: 18px; 
              color: #2d3748; 
              margin-bottom: 20px;
            }
            .greeting strong { 
              color: #ef4444; 
              font-weight: 600;
            }
            .message { 
              font-size: 16px; 
              color: #4a5568; 
              margin-bottom: 30px;
              line-height: 1.8;
            }
            .details-card { 
              background: linear-gradient(to bottom, #fef2f2, #fee2e2); 
              padding: 25px; 
              border-radius: 12px; 
              margin: 25px 0;
              border: 2px solid #fecaca;
            }
            .detail-row { 
              display: flex; 
              justify-content: space-between; 
              align-items: center;
              padding: 15px 0; 
              border-bottom: 1px solid #fecaca;
            }
            .detail-row:last-child { 
              border-bottom: none;
            }
            .detail-label { 
              font-weight: 600; 
              color: #dc2626;
              font-size: 15px;
            }
            .detail-value {
              font-weight: 500;
              color: #991b1b;
              font-size: 15px;
              text-align: right;
            }
            .reason-box {
              background: #fffbeb;
              border-left: 4px solid #f59e0b;
              padding: 20px;
              border-radius: 8px;
              margin: 25px 0;
            }
            .reason-title {
              color: #92400e;
              font-weight: 600;
              font-size: 16px;
              margin-bottom: 10px;
            }
            .reason-text {
              color: #78350f;
              font-size: 14px;
              line-height: 1.6;
            }
            .button { 
              display: inline-block; 
              padding: 14px 35px; 
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white; 
              text-decoration: none; 
              border-radius: 8px; 
              margin: 25px 0;
              font-weight: 600;
              font-size: 16px;
              box-shadow: 0 4px 6px rgba(102, 126, 234, 0.4);
            }
            .info-box {
              background: #ecfdf5;
              border-left: 4px solid #10b981;
              padding: 20px;
              border-radius: 8px;
              margin: 25px 0;
            }
            .info-title {
              color: #065f46;
              font-weight: 600;
              font-size: 16px;
              margin-bottom: 10px;
            }
            .info-text {
              color: #047857;
              font-size: 14px;
              line-height: 1.6;
            }
            .footer { 
              text-align: center; 
              padding: 30px; 
              background: #f7fafc;
              color: #718096; 
              font-size: 13px;
              border-top: 1px solid #e2e8f0;
            }
            .footer-brand {
              color: #667eea;
              font-weight: 600;
              font-size: 16px;
              margin-bottom: 10px;
            }
          </style>
        </head>
        <body>
          <div class="email-wrapper">
            <div class="header">
              <h1>❌ Booking Cancelled</h1>
              <p>Your booking has been cancelled</p>
            </div>
            <div class="content">
              <p class="greeting">Hi <strong>${data.userName}</strong>,</p>
              <p class="message">${data.isAdminCancellation 
                ? `We're writing to inform you that your booking has been cancelled by ${data.cancelledBy || 'the administrator'}.`
                : 'Your booking has been successfully cancelled as per your request.'
              }</p>
              
              <div class="details-card">
                <div class="detail-row">
                  <span class="detail-label">Amenity:</span>
                  <span class="detail-value">${data.amenityName}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Date:</span>
                  <span class="detail-value">${formatDate(data.date)}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Time Slot:</span>
                  <span class="detail-value">${data.timeSlot}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Booking ID:</span>
                  <span class="detail-value">#${data.bookingId.substring(0, 8).toUpperCase()}</span>
                </div>
                ${data.isAdminCancellation ? `
                <div class="detail-row">
                  <span class="detail-label">Cancelled By:</span>
                  <span class="detail-value">${data.cancelledBy || 'Administrator'}</span>
                </div>
                ` : ''}
              </div>

              ${data.cancellationReason ? `
              <div class="reason-box">
                <div class="reason-title">📝 Cancellation Reason</div>
                <div class="reason-text">${data.cancellationReason}</div>
              </div>
              ` : ''}

              <div class="info-box">
                <div class="info-title">💡 What's Next?</div>
                <div class="info-text">
                  ${data.isAdminCancellation 
                    ? 'If you have any questions about this cancellation, please contact your community administrator for more information.'
                    : 'You can make a new booking anytime through the CircleIn app. We hope to see you soon!'
                  }
                </div>
              </div>

              <center>
                <a href="#" class="button">Make New Booking</a>
              </center>

              <p style="margin-top: 25px; color: #718096; font-size: 14px; text-align: center;">
                Thank you for understanding. We appreciate your cooperation.
              </p>
            </div>
            <div class="footer">
              <div class="footer-brand">CircleIn</div>
              <p>Your Community Management Platform</p>
              <p style="margin-top: 10px;">This is an automated message. Please do not reply to this email.</p>
            </div>
          </div>
        </body>
      </html>
    `,
  }),

  amenityBlocked: (data: {
    amenityName: string;
    reason: string;
    startDate: string;
    endDate: string;
    communityName: string;
    isFestive?: boolean;
  }) => ({
    subject: `🚫 Amenity Blocked - ${data.amenityName}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
              line-height: 1.6; 
              color: #1a202c;
              background: #f7fafc;
            }
            .email-wrapper { 
              max-width: 600px; 
              margin: 0 auto; 
              background: #ffffff;
              box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            }
            .header { 
              background: ${data.isFestive 
                ? 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)'
                : 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)'}; 
              color: white; 
              padding: 40px 30px; 
              text-align: center;
            }
            .header h1 { 
              font-size: 32px; 
              margin-bottom: 10px; 
              font-weight: 700;
            }
            .header p { 
              font-size: 16px; 
              opacity: 0.95;
            }
            .content { 
              background: #ffffff; 
              padding: 40px 30px;
            }
            .greeting { 
              font-size: 18px; 
              color: #2d3748; 
              margin-bottom: 20px;
            }
            .message { 
              font-size: 16px; 
              color: #4a5568; 
              margin-bottom: 30px;
              line-height: 1.8;
            }
            .details-card { 
              background: linear-gradient(to bottom, #f0f9ff, #e0f2fe); 
              padding: 25px; 
              border-radius: 12px; 
              margin: 25px 0;
              border: 2px solid #bae6fd;
            }
            .detail-row { 
              display: flex; 
              justify-content: space-between; 
              align-items: center;
              padding: 15px 0; 
              border-bottom: 1px solid #bae6fd;
            }
            .detail-row:last-child { 
              border-bottom: none;
            }
            .detail-label { 
              font-weight: 600; 
              color: #0369a1;
              font-size: 15px;
            }
            .detail-value {
              font-weight: 500;
              color: #075985;
              font-size: 15px;
              text-align: right;
            }
            .reason-box {
              background: ${data.isFestive ? '#fef3c7' : '#fef3c7'};
              border-left: 4px solid ${data.isFestive ? '#f97316' : '#f59e0b'};
              padding: 20px;
              border-radius: 8px;
              margin: 25px 0;
            }
            .reason-title {
              color: ${data.isFestive ? '#9a3412' : '#92400e'};
              font-weight: 600;
              font-size: 16px;
              margin-bottom: 10px;
            }
            .reason-text {
              color: ${data.isFestive ? '#7c2d12' : '#78350f'};
              font-size: 14px;
              line-height: 1.6;
            }
            .festive-box {
              background: linear-gradient(135deg, #fef3c7 0%, #fed7aa 100%);
              padding: 25px;
              border-radius: 12px;
              margin: 25px 0;
              text-align: center;
              border: 2px solid #f97316;
            }
            .festive-title {
              font-size: 24px;
              color: #9a3412;
              font-weight: 700;
              margin-bottom: 10px;
            }
            .festive-text {
              font-size: 16px;
              color: #7c2d12;
            }
            .button { 
              display: inline-block; 
              padding: 14px 35px; 
              background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
              color: white; 
              text-decoration: none; 
              border-radius: 8px; 
              margin: 25px 0;
              font-weight: 600;
              font-size: 16px;
              box-shadow: 0 4px 6px rgba(99, 102, 241, 0.4);
            }
            .info-box {
              background: #ecfdf5;
              border-left: 4px solid #10b981;
              padding: 20px;
              border-radius: 8px;
              margin: 25px 0;
            }
            .info-title {
              color: #065f46;
              font-weight: 600;
              font-size: 16px;
              margin-bottom: 10px;
            }
            .info-text {
              color: #047857;
              font-size: 14px;
              line-height: 1.6;
            }
            .footer { 
              text-align: center; 
              padding: 30px; 
              background: #f7fafc;
              color: #718096; 
              font-size: 13px;
              border-top: 1px solid #e2e8f0;
            }
            .footer-brand {
              color: #6366f1;
              font-weight: 600;
              font-size: 16px;
              margin-bottom: 10px;
            }
          </style>
        </head>
        <body>
          <div class="email-wrapper">
            <div class="header">
              <h1>🚫 Amenity Blocked</h1>
              <p>Important update about ${data.amenityName}</p>
            </div>
            <div class="content">
              <p class="greeting">Dear Residents,</p>
              <p class="message">We would like to inform you that the following amenity has been temporarily blocked:</p>
              
              ${data.isFestive ? `
              <div class="festive-box">
                <div class="festive-title">🎉 Festival/Special Occasion</div>
                <div class="festive-text">This amenity is blocked for a special event</div>
              </div>
              ` : ''}

              <div class="details-card">
                <div class="detail-row">
                  <span class="detail-label">Amenity:</span>
                  <span class="detail-value">${data.amenityName}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Start Date:</span>
                  <span class="detail-value">${formatDate(data.startDate)}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">End Date:</span>
                  <span class="detail-value">${formatDate(data.endDate)}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Community:</span>
                  <span class="detail-value">${data.communityName}</span>
                </div>
              </div>

              <div class="reason-box">
                <div class="reason-title">📝 Reason for Blocking</div>
                <div class="reason-text">${data.reason}</div>
              </div>

              <div class="info-box">
                <div class="info-title">💡 Important Information</div>
                <div class="info-text">
                  • Any existing bookings during this period may be automatically cancelled<br>
                  • The amenity will be available again after ${formatDate(data.endDate)}<br>
                  • You can book other available amenities in the meantime<br>
                  • For urgent queries, please contact your community administrator
                </div>
              </div>

              <center>
                <a href="#" class="button">View Available Amenities</a>
              </center>

              <p style="margin-top: 25px; color: #718096; font-size: 14px; text-align: center;">
                We apologize for any inconvenience caused. Thank you for your understanding and cooperation.
              </p>
            </div>
            <div class="footer">
              <div class="footer-brand">CircleIn</div>
              <p>Your Community Management Platform</p>
              <p style="margin-top: 10px;">This is an automated message. Please do not reply to this email.</p>
            </div>
          </div>
        </body>
      </html>
    `,
  }),
};

// Send a single email
export async function sendEmail(options: {
  to: string;
  subject: string;
  html: string;
}) {
  try {
    const info = await transporter.sendMail({
      from: '"CircleIn" <circleinapp1@gmail.com>',
      to: options.to,
      subject: options.subject,
      html: options.html,
    });

    console.log('Email sent successfully:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
}

// Send batch emails with rate limiting (to avoid Gmail limits)
export async function sendBatchEmails(
  emails: Array<{ to: string; subject: string; html: string }>,
  template: string
) {
  const results = {
    sent: 0,
    failed: 0,
    errors: [] as string[],
  };

  // Send emails in batches of 10 with 1 second delay between batches
  const batchSize = 10;
  for (let i = 0; i < emails.length; i += batchSize) {
    const batch = emails.slice(i, i + batchSize);
    
    await Promise.all(
      batch.map(async (email) => {
        try {
          await sendEmail(email);
          results.sent++;
        } catch (error) {
          results.failed++;
          results.errors.push(`Failed to send to ${email.to}: ${error}`);
        }
      })
    );

    // Wait 1 second between batches to avoid rate limits
    if (i + batchSize < emails.length) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  return results;
}
