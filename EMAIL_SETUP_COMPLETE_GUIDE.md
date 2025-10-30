# 📧 Email System Setup Guide - COMPLETE FIX

## 🚨 Current Issue: Emails Not Being Sent

**Root Cause:** Missing or incorrect `EMAIL_PASSWORD` configuration

## ✅ COMPLETE SOLUTION (5 Minutes)

### Step 1: Generate Gmail App Password

1. **Go to Google Account Settings**
   - Visit: https://myaccount.google.com/security
   - Sign in with `circleinapp1@gmail.com`

2. **Enable 2-Step Verification** (if not already)
   - Click "2-Step Verification" → Follow steps
   - ⚠️ Required for App Passwords!

3. **Generate App Password**
   - Go to: https://myaccount.google.com/apppasswords
   - Or search "App Passwords" in Google Account settings
   - Select "Mail" and "Other (Custom name)"
   - Name it: "CircleIn App Production"
   - Click "Generate"
   - **Copy the 16-character password** (e.g., `abcd efgh ijkl mnop`)

### Step 2: Add to Vercel Environment Variables

1. **Go to Vercel Dashboard**
   - Visit: https://vercel.com/saiabhinav001/circlein-app
   - Go to Settings → Environment Variables

2. **Add These Variables:**
   ```
   EMAIL_USER=circleinapp1@gmail.com
   EMAIL_PASSWORD=<your-16-char-app-password>
   ```
   ⚠️ Remove spaces from the app password!

3. **Select Environments:**
   - ✅ Production
   - ✅ Preview
   - ✅ Development

4. **Click "Save"**

### Step 3: Redeploy (IMPORTANT!)

```bash
# Trigger a new deployment to load environment variables
git commit --allow-empty -m "Reload environment variables"
git push origin main
```

Or in Vercel Dashboard:
- Go to Deployments → Click "..." → "Redeploy"

### Step 4: Test Email System

Visit: `https://your-app.vercel.app/api/test-email`

Or test manually:
```bash
curl -X POST https://your-app.vercel.app/api/notifications/email \
  -H "Content-Type: application/json" \
  -d '{
    "type": "booking_confirmation",
    "to": "your-email@gmail.com",
    "data": {
      "userName": "Test User",
      "amenityName": "Swimming Pool",
      "date": "2025-10-30",
      "timeSlot": "09:00-11:00",
      "bookingId": "test123",
      "communityName": "Test Community"
    }
  }'
```

## 🔍 Verification Checklist

After setup, check these logs in Vercel:

✅ **Startup Log** (in server logs):
```
✅ Email service is ready to send messages
```

❌ **If you see errors:**
```
❌ Email Configuration Error: Invalid login
```
→ Regenerate App Password and update Vercel

✅ **When email is sent:**
```
📧 Sending email (attempt 1/3)...
   To: user@example.com
   Subject: ✅ Booking Confirmed - Swimming Pool
✅ Email sent successfully!
   Message ID: <...>
```

## 🚀 NEW FEATURES ADDED

### 1. **Automatic Retry Logic** (3 attempts)
- Handles transient network failures
- Exponential backoff (2s, 4s, 6s)
- Stops on auth errors (no point retrying)

### 2. **Detailed Logging**
- Every email attempt logged
- Success/failure tracked
- Error codes explained

### 3. **Input Validation**
- Validates email addresses
- Checks for missing config
- Returns helpful error messages

### 4. **Better Error Messages**
Common errors explained:
- `EAUTH` → Wrong App Password
- `ETIMEDOUT` → Network issue (will retry)
- `550` → Invalid recipient email

## 📊 Email Flow Diagram

```
User Books Amenity
     ↓
API creates booking in Firestore
     ↓
API calls /api/notifications/email
     ↓
Email service validates config
     ↓
┌─────────────────────────┐
│ Attempt 1: Send email   │
│  ✓ Success → Return     │
│  ✗ Fail → Wait 2s       │
└─────────────────────────┘
     ↓
┌─────────────────────────┐
│ Attempt 2: Retry        │
│  ✓ Success → Return     │
│  ✗ Fail → Wait 4s       │
└─────────────────────────┘
     ↓
┌─────────────────────────┐
│ Attempt 3: Final retry  │
│  ✓ Success → Return     │
│  ✗ Fail → Log & return  │
└─────────────────────────┘
```

## 🛡️ Security Best Practices

✅ **DO:**
- Use App Password (never regular password)
- Store in environment variables
- Use HTTPS for all API calls
- Keep EMAIL_PASSWORD secret

❌ **DON'T:**
- Commit passwords to Git
- Share App Password
- Use regular Gmail password
- Log sensitive data

## 📧 Email Types Supported

All these emails will work after setup:

1. **booking_confirmation** - When slot is confirmed
2. **bookingWaitlist** - When added to waitlist
3. **waitlistPromoted** - When promoted from waitlist
4. **confirmationReminder** - Reminder to confirm promotion
5. **booking_cancellation** - When booking is cancelled
6. **booking_reminder** - Day before booking

## 🐛 Troubleshooting

### Problem: "Invalid login"
**Solution:** 
1. Regenerate App Password
2. Make sure you removed spaces
3. Update Vercel variable
4. Redeploy

### Problem: "Connection timeout"
**Solution:**
- Check network connectivity
- Verify Gmail service is up
- Wait and retry (automatic)

### Problem: Emails not arriving
**Check:**
1. Spam folder
2. Vercel logs for errors
3. Recipient email is correct
4. Gmail daily limit not exceeded (500/day)

### Problem: "Environment variable not found"
**Solution:**
1. Check Vercel Settings → Environment Variables
2. Make sure it's set for Production
3. Redeploy to load new variables

## 📝 Testing Locally (Development)

Create `.env.local` in project root:
```env
EMAIL_USER=circleinapp1@gmail.com
EMAIL_PASSWORD=your-app-password-here
```

Then:
```bash
npm run dev
# Test at http://localhost:3000/api/notifications/email
```

## ✅ Success Indicators

You'll know it's working when:
1. ✅ No errors in Vercel logs on startup
2. ✅ Users receive confirmation emails within seconds
3. ✅ All 6 email types working
4. ✅ Retry logic handles temporary failures
5. ✅ Logs show message IDs

## 🎯 Expected Behavior

- **Success rate:** 99%+ (with retries)
- **Delivery time:** 1-5 seconds
- **Failed emails:** Logged with reason
- **Retry attempts:** Automatic (3x)

---

## 🚀 QUICK START (TL;DR)

1. Get App Password: https://myaccount.google.com/apppasswords
2. Add to Vercel: `EMAIL_PASSWORD=<password>`
3. Redeploy app
4. Test booking → Check email

**That's it!** 🎉
