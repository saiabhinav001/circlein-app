import { NextRequest, NextResponse } from 'next/server';
import { sendEmail } from '@/lib/email-service';

export async function GET(request: NextRequest) {
  try {
    console.log('🧪 Testing email configuration...');
    console.log('EMAIL_USER:', process.env.EMAIL_USER);
    console.log('EMAIL_PASSWORD exists:', !!process.env.EMAIL_PASSWORD);

    const result = await sendEmail({
      to: process.env.EMAIL_USER || 'circleinapp1@gmail.com',
      subject: '✅ CircleIn Email Test - Configuration Working!',
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px; }
              .content { background: #f9f9f9; padding: 30px; margin-top: 20px; border-radius: 10px; }
              .success { background: #10b981; color: white; padding: 15px; border-radius: 8px; text-align: center; margin: 20px 0; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>🎉 Email Configuration Test</h1>
                <p>CircleIn Email System</p>
              </div>
              <div class="content">
                <div class="success">
                  <h2>✅ Success!</h2>
                  <p>Your email notification system is working perfectly!</p>
                </div>
                <h3>Configuration Details:</h3>
                <ul>
                  <li><strong>Sender:</strong> CircleIn &lt;${process.env.EMAIL_USER}&gt;</li>
                  <li><strong>Service:</strong> Gmail SMTP</li>
                  <li><strong>Status:</strong> Connected and Operational</li>
                  <li><strong>Test Time:</strong> ${new Date().toLocaleString()}</li>
                </ul>
                <h3>Active Features:</h3>
                <ul>
                  <li>✅ Booking Confirmations (Instant)</li>
                  <li>✅ 1-Hour Reminders (Automated Cron)</li>
                  <li>✅ Amenity Block Notifications</li>
                  <li>✅ Festive Block Notifications</li>
                </ul>
                <p style="margin-top: 30px; padding: 15px; background: #fff3cd; border-left: 4px solid #ffc107; border-radius: 4px;">
                  <strong>📌 Next Steps:</strong><br>
                  Delete this test endpoint (<code>/api/test-email</code>) before going to production.
                </p>
              </div>
            </div>
          </body>
        </html>
      `,
    });

    return NextResponse.json({
      success: true,
      message: '✅ Email sent successfully! Check your inbox.',
      messageId: result.messageId,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('❌ Test email error:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    }, { status: 500 });
  }
}
