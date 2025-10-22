# Gmail App Password Setup Instructions

To enable email sending functionality in CircleIn, you need to generate a Gmail App Password.

## Steps:

1. Go to your Google Account: https://myaccount.google.com/
2. Click on "Security" in the left sidebar
3. Under "Signing in to Google", enable "2-Step Verification" (if not already enabled)
4. After enabling 2-Step Verification, go back to Security
5. Under "Signing in to Google", click on "App passwords"
6. Click "Select app" and choose "Mail"
7. Click "Select device" and choose "Other (Custom name)"
8. Enter "CircleIn Email Service" as the name
9. Click "Generate"
10. Copy the 16-character app password (format: xxxx xxxx xxxx xxxx)

## Add to Vercel:

Run this command in your terminal (replace YOUR_APP_PASSWORD with the password you generated):

```bash
echo "YOUR_APP_PASSWORD" | vercel env add EMAIL_PASSWORD production
```

## For local development:

Update `.env.local` file and replace `your-gmail-app-password-here` with your actual app password.

## Important Notes:

- The app password is different from your regular Gmail password
- You can only see the app password once when it's generated
- If you lose it, you'll need to generate a new one
- This password allows CircleIn to send emails through your Gmail account
- Keep this password secure and never commit it to git

## Email Account Being Used:

- **From:** circleinapp1@gmail.com
- **Admin emails go to:** circleinapp1@gmail.com
- **Resident emails go to:** abhinav.sadineni@gmail.com

## After Setup:

Once you add the EMAIL_PASSWORD to Vercel, redeploy your application and the email functionality will work perfectly!
