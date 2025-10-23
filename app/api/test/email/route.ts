import { NextResponse } from 'next/server';
import { sendEmail } from '@/lib/email-service';

export async function GET() {
  try {
    // Check if environment variables are set
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
      return NextResponse.json(
        { 
          error: 'Email configuration missing',
          details: {
            EMAIL_USER: process.env.EMAIL_USER ? 'Set' : 'Missing',
            EMAIL_PASSWORD: process.env.EMAIL_PASSWORD ? 'Set' : 'Missing'
          }
        },
        { status: 500 }
      );
    }

    // Send a test email
    const result = await sendEmail({
      to: process.env.EMAIL_USER, // Send to self for testing
      subject: 'CircleIn - Email System Test',
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
              .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
              .success { background: #4caf50; color: white; padding: 15px; border-radius: 5px; text-align: center; margin: 20px 0; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>✅ Email System Test</h1>
                <p>CircleIn Notification System</p>
              </div>
              <div class="content">
                <div class="success">
                  <h2>🎉 Success!</h2>
                  <p>Your email notification system is working perfectly!</p>
                </div>
                <p>This is a test email to verify that your CircleIn email notification system is properly configured and working.</p>
                <p><strong>Configuration Status:</strong></p>
                <ul>
                  <li>✅ Nodemailer configured</li>
                  <li>✅ Gmail SMTP connected</li>
                  <li>✅ Email templates working</li>
                  <li>✅ Environment variables set</li>
                </ul>
                <p>You can now safely use the following features:</p>
                <ul>
                  <li>📧 Booking confirmation emails</li>
                  <li>⏰ 1-hour reminder emails</li>
                  <li>🚫 Amenity block notifications</li>
                  <li>🎉 Festive block notifications</li>
                </ul>
                <p style="margin-top: 30px; color: #666; font-size: 12px;">
                  Test email sent at ${new Date().toLocaleString()}<br>
                  From: CircleIn Email System
                </p>
              </div>
            </div>
          </body>
        </html>
      `,
    });

    return NextResponse.json({
      success: true,
      message: 'Test email sent successfully! Check your inbox.',
      messageId: result.messageId,
      recipient: process.env.EMAIL_USER,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Email test failed:', error);
    return NextResponse.json(
      {
        error: 'Failed to send test email',
        details: error.message,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
