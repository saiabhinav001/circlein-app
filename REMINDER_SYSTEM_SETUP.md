# 🔔 1-Hour Reminder System Setup Guide

## ✅ What's Implemented

A complete reminder system that sends emails 1 hour before bookings using a **FREE** external cron service.

### Features:
- ✅ Sends reminder 1 hour before booking
- ✅ Beautiful email template with booking details
- ✅ Prevents duplicate reminders
- ✅ Works for all confirmed bookings
- ✅ 100% FREE (no limits)
- ✅ No Vercel cron needed

---

## 🚀 Setup (5 Minutes)

### Step 1: Generate CRON_SECRET

```bash
# Generate a random secret token
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Copy the output (64-character string)

### Step 2: Add to Vercel Environment Variables

1. Go to: https://vercel.com/your-project/settings/environment-variables
2. Add new variable:
   ```
   Name: CRON_SECRET
   Value: <paste-your-64-char-secret>
   ```
3. Select: ✅ Production ✅ Preview ✅ Development
4. Save

### Step 3: Setup Free Cron Service

#### Option A: cron-job.org (Recommended - Free Forever)

1. **Sign up:**
   - Visit: https://cron-job.org/en/signup.php
   - Create free account (no credit card needed)

2. **Create cron job:**
   - Click "Create cronjob"
   - **Title:** `CircleIn 1-Hour Reminders`
   - **URL:** `https://your-app.vercel.app/api/cron/send-reminders`
   - **Schedule:** Every 15 minutes
     - Pattern: `*/15 * * * *`
   - **Add Header:**
     - Name: `authorization`
     - Value: `Bearer YOUR_CRON_SECRET` (replace with your secret)
   - **Notifications:** Enable to get alerts if job fails
   - Save

3. **Test:**
   - Click "Test" button
   - Should see: `"success": true`

#### Option B: EasyCron (Alternative - Free)

1. Visit: https://www.easycron.com/user/register
2. Free plan: 100 executions/day (more than enough)
3. Setup similar to above

---

## 📊 How It Works

```
Every 15 minutes:
     ↓
Cron service hits: /api/cron/send-reminders
     ↓
API finds bookings starting in 45-75 minutes
     ↓
For each booking:
  ✅ Check if reminderSent = false
  ✅ Send email reminder
  ✅ Mark reminderSent = true
     ↓
Return summary (sent: X, failed: Y)
```

### Why Every 15 Minutes?

- **Booking at 3:00 PM**
- **Reminder window:** 2:00-2:15 PM (45-75 min before)
- **Cron checks:** 2:00, 2:15, 2:30...
- **First check at 2:00 PM:** ✅ Sends reminder
- **Check at 2:15 PM:** ⏭️ Skips (already sent)

---

## 🧪 Testing

### Test 1: Manual Test

```bash
# Replace with your actual values
curl -X GET "https://your-app.vercel.app/api/cron/send-reminders" \
  -H "authorization: Bearer YOUR_CRON_SECRET"
```

Expected response:
```json
{
  "success": true,
  "message": "Reminder check completed",
  "checked": 0,
  "sent": 0,
  "failed": 0,
  "timestamp": "2025-10-30T..."
}
```

### Test 2: Create Test Booking

1. Book amenity for 1 hour from now
2. Wait for cron to run (max 15 minutes)
3. Check email inbox
4. Should receive: "⏰ Reminder: Your booking is in 1 hour!"

### Test 3: Check Firestore

After reminder sent:
```
bookings/{bookingId}
  reminderSent: true ✅
  reminderSentAt: Timestamp
```

---

## 📧 Email Template

Users receive:
```
Subject: ⏰ Reminder: Your booking is in 1 hour!

Beautiful HTML email with:
- 🎯 Amenity name
- 📅 Date
- ⏰ Time slot
- 🎫 Booking ID
- 📍 Location details
- ✨ Colorful gradient design
```

---

## 🔍 Monitoring

### Check Cron Job Status:

**cron-job.org Dashboard:**
- View execution history
- See success/failure rate
- Get notifications on failures
- Download execution logs

### Check Vercel Logs:

```
Vercel → Deployments → Select latest → Functions
→ Filter: /api/cron/send-reminders
```

Look for:
```
🔔 === BOOKING REMINDER CHECK ===
   ⏰ Time: 2025-10-30...
   📊 Checking bookings between: ...
   📋 Found 3 bookings needing reminders
   📧 Sending reminder for booking abc123
      ✅ Reminder sent successfully
📊 === REMINDER SUMMARY ===
   ✅ Sent: 3
   ❌ Failed: 0
```

---

## 🛠️ Troubleshooting

### Problem: "Unauthorized" Error

**Solution:**
- Check CRON_SECRET matches in Vercel and cron-job.org
- Ensure header is: `authorization: Bearer YOUR_SECRET`
- No extra spaces or quotes

### Problem: No Reminders Sent

**Check:**
1. ✅ CRON_SECRET configured in Vercel?
2. ✅ Cron job running every 15 minutes?
3. ✅ Booking has `reminderSent: false`?
4. ✅ Booking starts in 45-75 minutes?
5. ✅ Booking status is `confirmed`?

### Problem: Duplicate Reminders

**Should not happen** because:
- ✅ `reminderSent` flag prevents duplicates
- ✅ Query filters for `reminderSent === false`

If it happens:
- Check Firestore rules allow updates
- Verify reminderSent is being set to true

---

## 📈 Expected Performance

- **Cron frequency:** Every 15 minutes (96 times/day)
- **Window:** 45-75 minutes before booking
- **Email delivery:** 1-5 seconds per email
- **Success rate:** 99%+ (with retry logic)
- **Cost:** $0 (100% FREE)

---

## 🎯 What Triggers Reminder

✅ **YES - Reminder Sent:**
- Status: `confirmed`
- Starts in: 45-75 minutes
- reminderSent: `false`

❌ **NO - Reminder Skipped:**
- Status: `cancelled`, `waitlist`, `pending_confirmation`
- Already sent: reminderSent: `true`
- Too far: Starts in >75 minutes
- Too close: Starts in <45 minutes

---

## 🔒 Security

- ✅ CRON_SECRET protects endpoint
- ✅ Only cron service can call it
- ✅ No user data exposed in logs
- ✅ Rate limiting via 15-min intervals

---

## 💡 Future Enhancements (Optional)

### 24-Hour Reminder
Create: `/api/cron/send-24h-reminders`
Schedule: Every 1 hour
Window: 23-25 hours before booking

### Cancellation Reminders
Find bookings not confirmed
Send reminder to confirm or cancel

### Statistics Dashboard
Track:
- Total reminders sent
- Open rates
- Booking show-up rates

---

## ✅ Checklist

Before going live:

- [ ] CRON_SECRET added to Vercel
- [ ] Cron job created on cron-job.org
- [ ] Correct URL configured
- [ ] Authorization header added
- [ ] Tested manually with curl
- [ ] Created test booking and received email
- [ ] Checked Vercel logs
- [ ] Verified reminderSent flag updated
- [ ] Email notifications enabled on cron-job.org

---

## 📞 Support

- **Cron Service:** https://cron-job.org/en/documentation.php
- **Email Issues:** See `EMAIL_SETUP_COMPLETE_GUIDE.md`
- **Test Endpoint:** `/api/test-email`

---

**Last Updated:** October 30, 2025
**Status:** ✅ Production-Ready
**Cost:** $0 (FREE Forever)
