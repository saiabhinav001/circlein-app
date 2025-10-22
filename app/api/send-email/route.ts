import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(request: NextRequest) {
  try {
    const { to, subject, message, senderName, senderEmail, senderRole } = await request.json();

    if (!to || !subject || !message) {
      return NextResponse.json(
        { error: 'Missing required fields: to, subject, message' },
        { status: 400 }
      );
    }
    
    console.log('📧 Email request:', { to, senderRole, senderName, senderEmail });

    // Create transporter using Gmail SMTP
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER || 'circleinapp1@gmail.com',
        pass: process.env.EMAIL_PASSWORD, // App-specific password
      },
    });

    // HTML email template
    const roleLabel = senderRole === 'admin' ? 'Admin' : 'Resident';
    const roleColor = senderRole === 'admin' ? '#3B82F6' : '#10B981';
    
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; background: #f9fafb; }
            .header { background: linear-gradient(135deg, #3B82F6, #8B5CF6); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center; }
            .content { background: white; padding: 30px; border-radius: 0 0 10px 10px; }
            .info-box { background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #3B82F6; }
            .message-box { background: #fefce8; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #eab308; }
            .role-badge { background: ${roleColor}; color: white; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: bold; }
            .footer { margin-top: 20px; padding: 15px; text-align: center; color: #6b7280; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0;">📬 CircleIn Contact Form</h1>
              <p style="margin: 5px 0;">New message from <span class="role-badge">${roleLabel}</span></p>
            </div>
            <div class="content">
              <div class="info-box">
                <p style="margin: 5px 0;"><strong>From:</strong> ${senderName || 'Anonymous'}</p>
                <p style="margin: 5px 0;"><strong>Email:</strong> ${senderEmail || 'Not provided'}</p>
                <p style="margin: 5px 0;"><strong>Role:</strong> <span style="background: ${roleColor}; color: white; padding: 2px 8px; border-radius: 4px; font-size: 12px;">${roleLabel}</span></p>
                <p style="margin: 5px 0;"><strong>Subject:</strong> ${subject}</p>
                <p style="margin: 5px 0;"><strong>Sent:</strong> ${new Date().toLocaleString()}</p>
              </div>
              <div class="message-box">
                <h3 style="margin-top: 0;">Message:</h3>
                <p style="white-space: pre-wrap;">${message.replace(/\n/g, '<br>')}</p>
              </div>
              <div class="footer">
                <p>© ${new Date().getFullYear()} CircleIn Community Management</p>
                <p style="margin-top: 5px;">Please reply directly to ${senderEmail}</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;

    // Send email
    const info = await transporter.sendMail({
      from: `"CircleIn Support" <${process.env.EMAIL_USER || 'circleinapp1@gmail.com'}>`,
      to: to,
      subject: `[CircleIn] ${subject}`,
      text: message,
      html: htmlContent,
      replyTo: senderEmail || process.env.EMAIL_USER,
    });

    console.log('✅ Email sent successfully:', info.messageId);

    return NextResponse.json({
      success: true,
      messageId: info.messageId,
      message: 'Email sent successfully'
    });

  } catch (error: any) {
    console.error('❌ Email sending error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to send email', 
        details: error.message 
      },
      { status: 500 }
    );
  }
}
