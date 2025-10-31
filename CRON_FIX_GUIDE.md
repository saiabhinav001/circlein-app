# 🔧 Cron Job Fix Guide

## ❌ Problem
Your cron job is getting **307 Temporary Redirect** errors because the URL is incorrect.

## ✅ Solution

### Update Your Cron Job URL

1. **Login to cron-job.org:** https://console.cron-job.org/dashboard

2. **Click on "Cronjobs"** in the left sidebar

3. **Click "Edit"** on your CircleIn reminder job

4. **Update the URL to:**
   ```
   https://circlein-app-git-main-sai-abhinavs-projects.vercel.app/api/cron/send-reminders
   ```
   
   Or use your production domain:
   ```
   https://your-production-domain.com/api/cron/send-reminders
   ```

5. **Verify these settings:**
   - **Request Method:** GET (or POST - both work now)
   - **Header Name:** `authorization` (lowercase!)
   - **Header Value:** `Bearer 0d7f905718b1c485dd077f4649205339c921410f75db16004b44d5a111faa498`
   - **Schedule:** `*/15 * * * *` (every 15 minutes)

6. **Save** and **Enable** the job

---

## 🧪 Test It Now

### Option 1: Manual Test via curl

```bash
curl -X GET "https://circlein-app-git-main-sai-abhinavs-projects.vercel.app/api/cron/send-reminders" \
  -H "authorization: Bearer 0d7f905718b1c485dd077f4649205339c921410f75db16004b44d5a111faa498"
```

### Option 2: Test via cron-job.org

1. Go to your cron job
2. Click **"Test"** button
3. Should see: ✅ Success (200 OK)

Expected response:
```json
{
  "success": true,
  "message": "Reminder check completed",
  "checked": 0,
  "sent": 0,
  "failed": 0
}
```

---

## 🎯 Why This Happens

The 307 redirect occurs when:
- ❌ URL has trailing slash: `/api/cron/send-reminders/`
- ❌ Wrong domain/subdomain
- ❌ HTTP instead of HTTPS

**Correct format:**
- ✅ No trailing slash
- ✅ HTTPS only
- ✅ Full Vercel URL or custom domain

---

## 📊 After Fix - Expected Behavior

Once fixed, in cron-job.org dashboard you'll see:
- ✅ **Status:** Enabled
- ✅ **Last execution:** Success (200 OK)
- ✅ **Response time:** ~500-2000ms
- ✅ **Next execution:** [timestamp]

---

## 🔍 Debugging

If still failing:

1. **Check Vercel deployment is live:**
   - Go to: https://vercel.com/saiabhinav001/circlein-app
   - Latest deployment should be "Ready" ✅

2. **Check CRON_SECRET is configured:**
   - Vercel → Settings → Environment Variables
   - Should see: `CRON_SECRET` = (hidden value)

3. **Check Vercel logs:**
   - Deployments → Functions
   - Look for: `/api/cron/send-reminders`
   - Should see: "🔔 === BOOKING REMINDER CHECK ==="

---

## ✅ What I Fixed

1. ✅ Added POST support (some cron services prefer POST)
2. ✅ Removed redundant Time Slots menu (use amenity settings instead)
3. ✅ Removed redundant Waitlist menu (visible in calendar)

**Commit:** `806d0b6`

---

**Status:** 🚀 Ready - Just update the cron job URL!
