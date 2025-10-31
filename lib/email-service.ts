import nodemailer from 'nodemailer';

// Email configuration with proper error handling
const createTransporter = () => {
  const emailUser = process.env.EMAIL_USER || 'circleinapp1@gmail.com';
  const emailPassword = process.env.EMAIL_PASSWORD;

  if (!emailPassword) {
    console.error('⚠️  EMAIL_PASSWORD not configured in environment variables');
    console.error('   Email notifications will NOT work!');
    console.error('   Please set EMAIL_PASSWORD in Vercel or .env.local');
  }

  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: emailUser,
      pass: emailPassword,
    },
    tls: {
      rejectUnauthorized: false // Allow self-signed certificates
    },
  });
};

const transporter = createTransporter();

// Verify email configuration on startup
transporter.verify((error, success) => {
  if (error) {
    console.error('❌ Email Configuration Error:', error);
    console.error('   Please check:');
    console.error('   1. EMAIL_USER is set correctly');
    console.error('   2. EMAIL_PASSWORD is a valid App Password (not regular Gmail password)');
    console.error('   3. 2-Step Verification is enabled on Gmail account');
  } else {
    console.log('✅ Email service is ready to send messages');
  }
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
    flatNumber?: string;
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
                  <span class="detail-label">🏠 Resident:</span>
                  <span class="detail-value">${data.userName}${data.flatNumber ? ` - Flat ${data.flatNumber}` : ''}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">🏊 Amenity:</span>
                  <span class="detail-value">${data.amenityName}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">📅 Date:</span>
                  <span class="detail-value">${formatDate(data.date)}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">⏰ Time Slot:</span>
                  <span class="detail-value">${data.timeSlot}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">🏘️ Community:</span>
                  <span class="detail-value">${data.communityName}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">🎫 Booking ID:</span>
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
                <a href="https://circlein-app.vercel.app/bookings" class="button">View My Bookings</a>
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
    flatNumber?: string;
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
                  <span class="detail-label">🏠 Resident:</span>
                  <span class="detail-value">${data.userName}${data.flatNumber ? ` - Flat ${data.flatNumber}` : ''}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">🏊 Amenity:</span>
                  <span class="detail-value">${data.amenityName}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">📅 Date:</span>
                  <span class="detail-value">${formatDate(data.date)}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">⏰ Time Slot:</span>
                  <span class="detail-value">${data.timeSlot}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">🎫 Booking ID:</span>
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
                <a href="https://circlein-app.vercel.app/bookings" class="button">View Booking Details</a>
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
    flatNumber?: string;
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
                  <span class="detail-label">🏠 Resident:</span>
                  <span class="detail-value">${data.userName}${data.flatNumber ? ` - Flat ${data.flatNumber}` : ''}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">🏊 Amenity:</span>
                  <span class="detail-value">${data.amenityName}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">📅 Date:</span>
                  <span class="detail-value">${formatDate(data.date)}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">⏰ Time Slot:</span>
                  <span class="detail-value">${data.timeSlot}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">🎫 Booking ID:</span>
                  <span class="detail-value">#${data.bookingId.substring(0, 8).toUpperCase()}</span>
                </div>
                ${data.isAdminCancellation ? `
                <div class="detail-row">
                  <span class="detail-label">👤 Cancelled By:</span>
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
                <a href="https://circlein-app.vercel.app/bookings" class="button">Make New Booking</a>
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
                <a href="https://circlein-app.vercel.app/dashboard" class="button">View Available Amenities</a>
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

  // 🆕 Waitlist Notification Template
  bookingWaitlist: (data: {
    userName: string;
    amenityName: string;
    date: string;
    timeSlot: string;
    waitlistPosition: number;
    communityName: string;
  }) => ({
    subject: `📋 Waitlist Confirmation - ${data.amenityName}`,
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
            .header h1 { font-size: 32px; margin-bottom: 10px; font-weight: 700; }
            .header p { font-size: 16px; opacity: 0.95; }
            .content { background: #ffffff; padding: 40px 30px; }
            .greeting { font-size: 18px; color: #2d3748; margin-bottom: 20px; }
            .greeting strong { color: #f59e0b; font-weight: 600; }
            .message { font-size: 16px; color: #4a5568; margin-bottom: 30px; line-height: 1.8; }
            .position-badge {
              background: linear-gradient(135deg, #fbbf24, #f59e0b);
              color: white;
              padding: 20px;
              border-radius: 12px;
              text-align: center;
              margin: 25px 0;
              font-size: 48px;
              font-weight: 700;
              box-shadow: 0 8px 16px rgba(251, 191, 36, 0.3);
            }
            .position-text {
              font-size: 16px;
              margin-top: 10px;
              opacity: 0.95;
            }
            .details-card { 
              background: linear-gradient(to bottom, #fef3c7, #fde68a); 
              padding: 25px; 
              border-radius: 12px; 
              margin: 25px 0;
              border: 2px solid #fbbf24;
            }
            .detail-row { 
              display: flex; 
              justify-content: space-between; 
              padding: 12px 0; 
              border-bottom: 1px solid #fbbf24;
            }
            .detail-row:last-child { border-bottom: none; }
            .detail-label { font-weight: 600; color: #92400e; }
            .detail-value { color: #78350f; font-weight: 500; }
            .info-box {
              background: #fffbeb;
              padding: 20px;
              border-radius: 8px;
              margin: 25px 0;
              border-left: 4px solid #fbbf24;
            }
            .info-title { color: #92400e; font-weight: 600; font-size: 16px; margin-bottom: 10px; }
            .info-text { color: #78350f; font-size: 14px; line-height: 1.6; }
            .footer { 
              text-align: center; 
              padding: 30px; 
              background: #f7fafc;
              color: #718096; 
              font-size: 13px;
              border-top: 1px solid #e2e8f0;
            }
            .footer-brand { color: #6366f1; font-weight: 600; font-size: 16px; margin-bottom: 10px; }
          </style>
        </head>
        <body>
          <div class="email-wrapper">
            <div class="header">
              <h1>📋 Waitlist Confirmed</h1>
              <p>You're in line for ${data.amenityName}</p>
            </div>
            <div class="content">
              <p class="greeting">Hi <strong>${data.userName}</strong>,</p>
              <p class="message">
                The ${data.amenityName} is currently at full capacity for your requested time slot. 
                We've added you to the waitlist and will notify you immediately if a spot opens up!
              </p>

              <div class="position-badge">
                #${data.waitlistPosition}
                <div class="position-text">Your Position in Line</div>
              </div>

              <div class="details-card">
                <div class="detail-row">
                  <span class="detail-label">📍 Amenity:</span>
                  <span class="detail-value">${data.amenityName}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">📅 Date:</span>
                  <span class="detail-value">${data.date}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">⏰ Time Slot:</span>
                  <span class="detail-value">${data.timeSlot}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">🏘️ Community:</span>
                  <span class="detail-value">${data.communityName}</span>
                </div>
              </div>

              <div class="info-box">
                <div class="info-title">💡 What Happens Next?</div>
                <div class="info-text">
                  ✓ If someone cancels, you'll be next in line<br>
                  ✓ We'll send you an email immediately when a spot opens<br>
                  ✓ You'll have 48 hours to confirm your booking<br>
                  ✓ Your position in the waitlist is secure
                </div>
              </div>

              <p style="margin-top: 25px; color: #718096; font-size: 14px; text-align: center;">
                We'll keep you updated. Thank you for your patience!
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

  // 🆕 Waitlist Promotion Template
  waitlistPromoted: (data: {
    userName: string;
    amenityName: string;
    startTime: string;
    endTime: string;
    confirmationUrl: string;
    deadline: string;
    waitlistPosition: number;
    flatNumber?: string;
  }) => ({
    subject: `🎉 You're Next! Confirm Your ${data.amenityName} Booking`,
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
              background: linear-gradient(135deg, #10b981 0%, #059669 100%); 
              color: white; 
              padding: 40px 30px; 
              text-align: center;
            }
            .header h1 { font-size: 32px; margin-bottom: 10px; font-weight: 700; }
            .header p { font-size: 16px; opacity: 0.95; }
            .content { background: #ffffff; padding: 40px 30px; }
            .greeting { font-size: 18px; color: #2d3748; margin-bottom: 20px; }
            .greeting strong { color: #059669; font-weight: 600; }
            .message { font-size: 16px; color: #4a5568; margin-bottom: 30px; line-height: 1.8; }
            .celebrate-banner {
              background: linear-gradient(135deg, #10b981, #059669);
              color: white;
              padding: 30px;
              border-radius: 12px;
              text-align: center;
              margin: 25px 0;
              font-size: 24px;
              font-weight: 700;
              box-shadow: 0 8px 16px rgba(16, 185, 129, 0.3);
            }
            .celebrate-icon { font-size: 48px; margin-bottom: 10px; }
            .details-card { 
              background: linear-gradient(to bottom, #d1fae5, #a7f3d0); 
              padding: 25px; 
              border-radius: 12px; 
              margin: 25px 0;
              border: 2px solid #10b981;
            }
            .detail-row { 
              display: flex; 
              justify-content: space-between; 
              padding: 12px 0; 
              border-bottom: 1px solid #10b981;
            }
            .detail-row:last-child { border-bottom: none; }
            .detail-label { font-weight: 600; color: #065f46; }
            .detail-value { color: #047857; font-weight: 500; }
            .button {
              display: inline-block;
              background: linear-gradient(135deg, #10b981, #059669);
              color: white;
              padding: 16px 40px;
              text-decoration: none;
              border-radius: 12px;
              font-weight: 600;
              font-size: 18px;
              box-shadow: 0 8px 16px rgba(16, 185, 129, 0.3);
              transition: all 0.3s;
            }
            .button:hover {
              transform: translateY(-2px);
              box-shadow: 0 12px 24px rgba(16, 185, 129, 0.4);
            }
            .deadline-warning {
              background: #fef3c7;
              padding: 20px;
              border-radius: 8px;
              margin: 25px 0;
              border-left: 4px solid #f59e0b;
              text-align: center;
            }
            .deadline-title { color: #92400e; font-weight: 600; font-size: 16px; margin-bottom: 10px; }
            .deadline-time { color: #78350f; font-size: 20px; font-weight: 700; }
            .footer { 
              text-align: center; 
              padding: 30px; 
              background: #f7fafc;
              color: #718096; 
              font-size: 13px;
              border-top: 1px solid #e2e8f0;
            }
            .footer-brand { color: #6366f1; font-weight: 600; font-size: 16px; margin-bottom: 10px; }
          </style>
        </head>
        <body>
          <div class="email-wrapper">
            <div class="header">
              <h1>🎉 Good News!</h1>
              <p>A spot just opened up for ${data.amenityName}</p>
            </div>
            <div class="content">
              <p class="greeting">Congratulations <strong>${data.userName}</strong>!</p>
              <p class="message">
                You were #${data.waitlistPosition} on the waitlist and a spot has become available! 
                You're now next in line to secure this booking. Please confirm within 48 hours to reserve your spot.
              </p>

              <div class="celebrate-banner">
                <div class="celebrate-icon">🎊</div>
                Your Spot is Reserved!
              </div>

              <div class="details-card">
                <div class="detail-row">
                  <span class="detail-label">🏠 Resident:</span>
                  <span class="detail-value">${data.userName}${data.flatNumber ? ` - Flat ${data.flatNumber}` : ''}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">🏊 Amenity:</span>
                  <span class="detail-value">${data.amenityName}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">🕐 Start Time:</span>
                  <span class="detail-value">${data.startTime}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">🕑 End Time:</span>
                  <span class="detail-value">${data.endTime}</span>
                </div>
              </div>

              <div class="deadline-warning">
                <div class="deadline-title">⏰ Confirmation Deadline</div>
                <div class="deadline-time">${data.deadline}</div>
                <p style="margin-top: 10px; color: #92400e; font-size: 14px;">
                  If you don't confirm by this time, the spot will be offered to the next person in line.
                </p>
              </div>

              <div style="text-align: center; margin: 30px 0;">
                <p style="font-size: 18px; font-weight: 600; color: #2d3748; margin-bottom: 20px;">
                  Do you want to confirm this booking?
                </p>
                <div style="display: inline-block;">
                  <a href="${data.confirmationUrl}?action=confirm" style="display: inline-block; background: linear-gradient(135deg, #10b981, #059669); color: white; padding: 16px 40px; text-decoration: none; border-radius: 12px; font-weight: 600; font-size: 18px; margin: 0 10px; box-shadow: 0 8px 16px rgba(16, 185, 129, 0.3);">
                    ✅ YES, Confirm
                  </a>
                  <a href="${data.confirmationUrl}?action=decline" style="display: inline-block; background: linear-gradient(135deg, #ef4444, #dc2626); color: white; padding: 16px 40px; text-decoration: none; border-radius: 12px; font-weight: 600; font-size: 18px; margin: 0 10px; box-shadow: 0 8px 16px rgba(239, 68, 68, 0.3);">
                    ❌ NO, Decline
                  </a>
                </div>
              </div>

              <p style="margin-top: 25px; color: #718096; font-size: 14px; text-align: center;">
                Click YES to secure your booking and receive your QR code!<br/>
                Click NO if you can't make it, so the next person can book the slot.
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

  // 🆕 Confirmation Reminder Template
  confirmationReminder: (data: {
    userName: string;
    amenityName: string;
    startTime: string;
    confirmationUrl: string;
    hoursRemaining: number;
  }) => ({
    subject: `⏰ Reminder: Confirm Your ${data.amenityName} Booking (${data.hoursRemaining}h left)`,
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
              background: linear-gradient(135deg, #f59e0b 0%, #dc2626 100%); 
              color: white; 
              padding: 40px 30px; 
              text-align: center;
            }
            .header h1 { font-size: 32px; margin-bottom: 10px; font-weight: 700; }
            .header p { font-size: 16px; opacity: 0.95; }
            .content { background: #ffffff; padding: 40px 30px; }
            .greeting { font-size: 18px; color: #2d3748; margin-bottom: 20px; }
            .greeting strong { color: #dc2626; font-weight: 600; }
            .message { font-size: 16px; color: #4a5568; margin-bottom: 30px; line-height: 1.8; }
            .urgent-banner {
              background: linear-gradient(135deg, #fbbf24, #f59e0b);
              color: white;
              padding: 30px;
              border-radius: 12px;
              text-align: center;
              margin: 25px 0;
              font-size: 28px;
              font-weight: 700;
              box-shadow: 0 8px 16px rgba(251, 191, 36, 0.3);
            }
            .urgent-icon { font-size: 64px; margin-bottom: 15px; }
            .button {
              display: inline-block;
              background: linear-gradient(135deg, #dc2626, #b91c1c);
              color: white;
              padding: 18px 50px;
              text-decoration: none;
              border-radius: 12px;
              font-weight: 700;
              font-size: 20px;
              box-shadow: 0 8px 16px rgba(220, 38, 38, 0.3);
              transition: all 0.3s;
            }
            .button:hover {
              transform: translateY(-2px);
              box-shadow: 0 12px 24px rgba(220, 38, 38, 0.4);
            }
            .footer { 
              text-align: center; 
              padding: 30px; 
              background: #f7fafc;
              color: #718096; 
              font-size: 13px;
              border-top: 1px solid #e2e8f0;
            }
            .footer-brand { color: #6366f1; font-weight: 600; font-size: 16px; margin-bottom: 10px; }
          </style>
        </head>
        <body>
          <div class="email-wrapper">
            <div class="header">
              <h1>⏰ Time Running Out!</h1>
              <p>Confirm your booking before it expires</p>
            </div>
            <div class="content">
              <p class="greeting">Hi <strong>${data.userName}</strong>,</p>
              <p class="message">
                This is a friendly reminder that your booking confirmation for ${data.amenityName} 
                is about to expire. You have only <strong>${data.hoursRemaining} hours</strong> remaining to confirm!
              </p>

              <div class="urgent-banner">
                <div class="urgent-icon">⏳</div>
                ${data.hoursRemaining} Hours Left
              </div>

              <p class="message">
                <strong>Booking Details:</strong><br>
                📍 ${data.amenityName}<br>
                ⏰ ${data.startTime}
              </p>

              <center>
                <a href="${data.confirmationUrl}" class="button">🚀 CONFIRM NOW</a>
              </center>

              <p style="margin-top: 25px; color: #dc2626; font-size: 14px; text-align: center; font-weight: 600;">
                ⚠️ If not confirmed in time, the spot will be offered to the next person in line.
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
export async function sendEmail(
  options: {
    to: string;
    subject: string;
    html: string;
  },
  retries = 3
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  // Validate inputs
  if (!options.to || !options.to.includes('@')) {
    console.error('❌ Invalid email address:', options.to);
    return { 
      success: false, 
      error: 'Invalid email address' 
    };
  }

  if (!process.env.EMAIL_PASSWORD) {
    console.error('❌ EMAIL_PASSWORD not configured');
    return { 
      success: false, 
      error: 'Email service not configured. Please set EMAIL_PASSWORD environment variable.' 
    };
  }

  let lastError: any = null;

  // Retry logic for transient failures
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`📧 Sending email (attempt ${attempt}/${retries})...`);
      console.log(`   To: ${options.to}`);
      console.log(`   Subject: ${options.subject}`);

      const info = await transporter.sendMail({
        from: '"CircleIn Community" <circleinapp1@gmail.com>',
        to: options.to,
        subject: options.subject,
        html: options.html,
        // Add these for better deliverability
        replyTo: 'circleinapp1@gmail.com',
        priority: 'high',
      });

      console.log(`✅ Email sent successfully!`);
      console.log(`   Message ID: ${info.messageId}`);
      console.log(`   Response: ${info.response}`);

      return { 
        success: true, 
        messageId: info.messageId 
      };

    } catch (error: any) {
      lastError = error;
      console.error(`❌ Email send failed (attempt ${attempt}/${retries}):`, error.message);

      // Log specific error types
      if (error.code === 'EAUTH') {
        console.error('   Authentication failed - Check EMAIL_PASSWORD');
        console.error('   Make sure you are using an App Password, not your regular Gmail password');
        break; // Don't retry auth errors
      } else if (error.code === 'ETIMEDOUT' || error.code === 'ECONNREFUSED') {
        console.error('   Network error - Will retry...');
        if (attempt < retries) {
          await new Promise(resolve => setTimeout(resolve, 2000 * attempt)); // Exponential backoff
        }
      } else if (error.responseCode === 550) {
        console.error('   Recipient address rejected - Invalid email');
        break; // Don't retry invalid emails
      } else {
        console.error('   Unknown error:', error);
      }
    }
  }

  // All retries failed
  console.error(`❌ Failed to send email after ${retries} attempts`);
  console.error('   Last error:', lastError?.message);

  return { 
    success: false, 
    error: lastError?.message || 'Unknown error' 
  };
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
