import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(request: NextRequest) {
  try {
    const { to, subject, message, senderName, senderEmail } = await request.json();

    if (!to || !subject || !message) {
      return NextResponse.json(
        { error: 'Missing required fields: to, subject, message' },
        { status: 400 }
      );
    }

    // Create transporter using Gmail SMTP
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER || 'circleinapp1@gmail.com',
        pass: process.env.EMAIL_PASSWORD, // App-specific password
      },
    });

    // HTML email template
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
            .footer { margin-top: 20px; padding: 15px; text-align: center; color: #6b7280; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0;">📬 CircleIn Contact Form</h1>
              <p style="margin: 5px 0;">New message from resident</p>
            </div>
            <div class="content">
              <div class="info-box">
                <p><strong>From:</strong> ${senderName || 'Anonymous'}</p>
                <p><strong>Email:</strong> ${senderEmail || 'Not provided'}</p>
                <p><strong>Subject:</strong> ${subject}</p>
              </div>
              <div class="message-box">
                <h3 style="margin-top: 0;">Message:</h3>
                <p>${message.replace(/\n/g, '<br>')}</p>
              </div>
              <div class="footer">
                <p>© ${new Date().getFullYear()} CircleIn Community Management</p>
                <p style="margin-top: 5px;">Powered by CircleIn Platform</p>
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
