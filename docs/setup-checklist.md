# ✅ Setup Checklist - Booking Emails + 1hr Reminder

## 🎯 Your CRON_SECRET Token

```
0d7f905718b1c485dd077f4649205339c921410f75db16004b44d5a111faa498
```

**⚠️ Keep this secret! Don't share publicly.**

---

## 📋 Step-by-Step Setup (10 minutes)

### ✅ Step 1: Add CRON_SECRET to Vercel (2 min)

1. Go to: https://vercel.com/saiabhinav001/circlein-app/settings/environment-variables

2. Click "Add New"

3. Enter:
   ```
   Name: CRON_SECRET
   Value: 0d7f905718b1c485dd077f4649205339c921410f75db16004b44d5a111faa498
   ```

4. Select environments:
   - ✅ Production
   - ✅ Preview  
   - ✅ Development

5. Click "Save"

6. **Redeploy** (important!):
   - Go to Deployments tab
   - Click "Redeploy" on latest deployment
   - Wait 2-3 minutes for completion

---

### ✅ Step 2: Create Free Cron Account (2 min)

1. Go to: https://cron-job.org/en/signup.php

2. Sign up (free, no credit card):
   - Email: [your email]
   - Password: [create strong password]
   - Verify email

---

### ✅ Step 3: Setup Cron Job (3 min)

1. Login to cron-job.org

2. Click **"Create cronjob"**

3. Fill in details:

   **Title:**
   ```
   CircleIn 1-Hour Reminders
   ```

   **URL:**
   ```
   https://circlein-app.vercel.app/api/cron/send-reminders
   ```
   (Replace `circlein-app` with your actual Vercel URL)

   **Schedule:**
   - Every 15 minutes
   - Pattern: `*/15 * * * *`

   **Request Method:**
   - GET

   **Add Header:**
   - Click "Add header"
   - Name: `authorization` (lowercase!)
   - Value: `Bearer 0d7f905718b1c485dd077f4649205339c921410f75db16004b44d5a111faa498`

   **Notifications:**
   - ✅ Enable "Notify me when execution fails"
   - Enter your email

4. Click **"Create cronjob"**

5. **Enable** the job (toggle switch)

---

### ✅ Step 4: Test Everything (3 min)

#### Test 1: Manual API Call

```bash
curl -X GET "https://circlein-app.vercel.app/api/cron/send-reminders" \
  -H "authorization: Bearer 0d7f905718b1c485dd077f4649205339c921410f75db16004b44d5a111faa498"
```

Expected response:
```json
{
  "success": true,
  "message": "Reminder check completed",
  "checked": 0,
  "sent": 0
}
```

#### Test 2: Booking Email

1. Login to your app
2. Book any amenity (confirmed slot)
3. Check email inbox immediately
4. Should receive: **"✅ Booking Confirmed"** email

#### Test 3: Reminder Email

1. Book amenity for **1 hour from now** (or longer)
2. Wait for cron to run (max 15 minutes)
3. When booking is 45-75 minutes away, you'll receive: **"⏰ Reminder: Your booking is in 1 hour!"**

---

## 🔍 Verification

### Check Vercel Logs:

1. Go to: https://vercel.com/saiabhinav001/circlein-app
2. Click latest deployment
3. Go to "Functions" tab
4. Look for `/api/cron/send-reminders` executions
5. Should see logs every 15 minutes

### Check Cron Job Status:

1. Login to cron-job.org
2. Go to "Cronjobs" page
3. Your job should show:
   - ✅ Status: Enabled
   - ✅ Last execution: Successful
   - ✅ Next execution: [time]

---

## 📊 Expected Behavior

| Time | Booking Time | Action |
|------|--------------|--------|
| 12:00 PM | Book for 2:00 PM | ✅ Confirmation email sent immediately |
| 12:15 PM | - | Cron runs, no reminders (>75 min away) |
| 12:30 PM | - | Cron runs, no reminders (>75 min away) |
| 12:45 PM | - | Cron runs, no reminders (still >75 min away) |
| 1:00 PM | - | **✅ REMINDER SENT!** (60 min before 2:00 PM) |
| 1:15 PM | - | Cron runs, skips (already sent) |

---

## 🛠️ Troubleshooting

### ❌ "Unauthorized" Error

**Fix:**
- Check CRON_SECRET matches in Vercel and cron-job.org
- Ensure header is EXACTLY: `authorization: Bearer YOUR_SECRET`
- No extra spaces!

### ❌ No Booking Emails

**Fix:**
- Check Vercel logs for errors
- Verify EMAIL_PASSWORD still configured
- Test: https://your-app.vercel.app/api/test-email

### ❌ No Reminders

**Check:**
- ✅ CRON_SECRET added to Vercel?
- ✅ Vercel redeployed after adding secret?
- ✅ Cron job enabled?
- ✅ Booking is 45-75 min away?
- ✅ Booking status is "confirmed"?

---

## 📞 Quick Links

- **Vercel Dashboard:** https://vercel.com/saiabhinav001/circlein-app
- **Cron Job Dashboard:** https://cron-job.org/en/members/jobs/
- **Test Email:** https://circlein-app.vercel.app/api/test-email
- **Setup Guide:** `REMINDER_SYSTEM_SETUP.md`

---

## ✅ Completion Checklist

- [ ] CRON_SECRET added to Vercel
- [ ] Vercel redeployed
- [ ] cron-job.org account created
- [ ] Cron job configured and enabled
- [ ] Manual API test successful
- [ ] Booking email received
- [ ] Reminder email received (wait 1 hour test)
- [ ] Checked Vercel logs
- [ ] Checked cron-job.org status

---

**Status:** 🚀 Ready to Deploy
**Cost:** $0 (100% FREE)
**Setup Time:** ~10 minutes
**Last Updated:** Now (commit: 6e2ea51)
