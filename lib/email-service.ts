import nodemailer from 'nodemailer';

// Email configuration
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER || 'circleinapp1@gmail.com',
    pass: process.env.EMAIL_PASSWORD,
  },
});

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
    subject: `Booking Confirmed: ${data.amenityName}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
            .detail-label { font-weight: bold; color: #667eea; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
            .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>✅ Booking Confirmed!</h1>
              <p>Your amenity booking has been successfully confirmed</p>
            </div>
            <div class="content">
              <p>Hi <strong>${data.userName}</strong>,</p>
              <p>Great news! Your booking has been confirmed. Here are the details:</p>
              
              <div class="details">
                <div class="detail-row">
                  <span class="detail-label">Amenity</span>
                  <span>${data.amenityName}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Date</span>
                  <span>${data.date}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Time Slot</span>
                  <span>${data.timeSlot}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Booking ID</span>
                  <span>${data.bookingId}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Community</span>
                  <span>${data.communityName}</span>
                </div>
              </div>

              <p><strong>Important Reminders:</strong></p>
              <ul>
                <li>Please arrive on time for your booking</li>
                <li>If you need to cancel, please do so in advance</li>
                <li>Follow all community guidelines while using the amenity</li>
              </ul>

              <p>You will receive another reminder email 1 hour before your booking.</p>
              
              <div style="text-align: center;">
                <a href="https://circlein-app.vercel.app/bookings" class="button">View My Bookings</a>
              </div>
            </div>
            <div class="footer">
              <p>This is an automated message from CircleIn. Please do not reply to this email.</p>
              <p>&copy; 2025 CircleIn - Community Management Platform</p>
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
    subject: `⏰ Reminder: ${data.amenityName} booking in 1 hour`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .alert-box { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 5px; }
            .details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>⏰ Booking Reminder</h1>
              <p>Your booking starts in 1 hour!</p>
            </div>
            <div class="content">
              <p>Hi <strong>${data.userName}</strong>,</p>
              
              <div class="alert-box">
                <strong>⚠️ Your ${data.amenityName} booking is coming up soon!</strong>
              </div>

              <div class="details">
                <p><strong>Amenity:</strong> ${data.amenityName}</p>
                <p><strong>Date:</strong> ${data.date}</p>
                <p><strong>Time:</strong> ${data.timeSlot}</p>
                <p><strong>Booking ID:</strong> ${data.bookingId}</p>
              </div>

              <p><strong>Quick Reminders:</strong></p>
              <ul>
                <li>🕐 Please arrive on time</li>
                <li>📋 Bring any required items</li>
                <li>🤝 Follow community guidelines</li>
                <li>❌ If you can't make it, please cancel ASAP</li>
              </ul>

              <p>Have a great time!</p>
            </div>
            <div class="footer">
              <p>This is an automated reminder from CircleIn. Please do not reply to this email.</p>
              <p>&copy; 2025 CircleIn</p>
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
    subject: `❌ Booking Cancelled: ${data.amenityName}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .alert-box { background: #fee2e2; border-left: 4px solid #ef4444; padding: 15px; margin: 20px 0; border-radius: 5px; }
            .details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
            .detail-label { font-weight: bold; color: #ef4444; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
            .button { display: inline-block; padding: 12px 30px; background: #3b82f6; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>❌ Booking Cancelled</h1>
              <p>${data.isAdminCancellation ? 'This booking was cancelled by administration' : 'Your booking has been cancelled'}</p>
            </div>
            <div class="content">
              <p>Hi <strong>${data.userName}</strong>,</p>
              
              ${data.isAdminCancellation ? `
                <div class="alert-box">
                  <strong>⚠️ Your booking was cancelled by an administrator.</strong>
                  ${data.cancellationReason ? `<br><br><strong>Reason:</strong> ${data.cancellationReason}` : ''}
                </div>
              ` : `
                <p>Your booking cancellation has been processed successfully.</p>
              `}

              <div class="details">
                <div class="detail-row">
                  <span class="detail-label">Amenity</span>
                  <span>${data.amenityName}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Date</span>
                  <span>${data.date}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Time</span>
                  <span>${data.timeSlot}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Booking ID</span>
                  <span>${data.bookingId}</span>
                </div>
                ${data.isAdminCancellation && data.cancelledBy ? `
                  <div class="detail-row">
                    <span class="detail-label">Cancelled By</span>
                    <span>${data.cancelledBy}</span>
                  </div>
                ` : ''}
                <div class="detail-row">
                  <span class="detail-label">Status</span>
                  <span style="color: #ef4444; font-weight: bold;">Cancelled</span>
                </div>
              </div>

              ${data.isAdminCancellation ? `
                <p><strong>What to do next:</strong></p>
                <ul>
                  <li>If you have questions about this cancellation, please contact the admin team</li>
                  <li>You can make a new booking for a different date/time</li>
                  <li>Check the amenity schedule for availability</li>
                </ul>
              ` : `
                <p>You can book the amenity again at any time through your dashboard.</p>
              `}
              
              <div style="text-align: center;">
                <a href="https://circlein-app.vercel.app/bookings" class="button">View My Bookings</a>
              </div>
            </div>
            <div class="footer">
              <p>This is an automated message from CircleIn. Please do not reply to this email.</p>
              <p>If you need assistance, please contact your community administrator.</p>
              <p>&copy; 2025 CircleIn - Community Management Platform</p>
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
    subject: `🚫 ${data.isFestive ? 'Festive Block' : 'Amenity Blocked'}: ${data.amenityName}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .notice-box { background: #f8d7da; border-left: 4px solid #dc3545; padding: 20px; margin: 20px 0; border-radius: 5px; }
            .details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>${data.isFestive ? '🎉 Festive Block Notice' : '🚫 Amenity Block Notice'}</h1>
              <p>${data.communityName}</p>
            </div>
            <div class="content">
              <p>Dear Residents,</p>
              
              <div class="notice-box">
                <h3 style="margin-top: 0;">${data.amenityName} - Temporarily Unavailable</h3>
                <p><strong>Reason:</strong> ${data.reason}</p>
              </div>

              <div class="details">
                <p><strong>📅 Block Period:</strong></p>
                <p>From: ${data.startDate}</p>
                <p>To: ${data.endDate}</p>
              </div>

              ${data.isFestive ? `
                <p>This is a festive block. The amenity will be unavailable during this celebration period.</p>
              ` : `
                <p>The amenity is temporarily blocked for ${data.reason.toLowerCase()}. We apologize for any inconvenience.</p>
              `}

              <p><strong>Impact on Your Bookings:</strong></p>
              <ul>
                <li>Any existing bookings during this period will be automatically cancelled</li>
                <li>You will be notified if your booking is affected</li>
                <li>New bookings cannot be made for this period</li>
              </ul>

              <p>Thank you for your understanding and cooperation!</p>
            </div>
            <div class="footer">
              <p>This is an automated notification from CircleIn. Please do not reply to this email.</p>
              <p>&copy; 2025 CircleIn - ${data.communityName}</p>
            </div>
          </div>
        </body>
      </html>
    `,
  }),
};

// Send email function
export async function sendEmail(options: {
  to: string | string[];
  subject: string;
  html: string;
}) {
  try {
    const info = await transporter.sendMail({
      from: '"CircleIn" <circleinapp1@gmail.com>', // No-reply format
      to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
      subject: options.subject,
      html: options.html,
    });

    console.log('✅ Email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error: any) {
    console.error('❌ Email send failed:', error);
    return { success: false, error: error.message };
  }
}

// Batch send emails (for blocking notifications to all residents)
export async function sendBatchEmails(emails: string[], template: { subject: string; html: string }) {
  const results = [];
  
  // Send in batches of 10 to avoid rate limits
  for (let i = 0; i < emails.length; i += 10) {
    const batch = emails.slice(i, i + 10);
    const promises = batch.map(email => 
      sendEmail({ to: email, subject: template.subject, html: template.html })
    );
    const batchResults = await Promise.all(promises);
    results.push(...batchResults);
    
    // Wait 1 second between batches
    if (i + 10 < emails.length) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  return results;
}
