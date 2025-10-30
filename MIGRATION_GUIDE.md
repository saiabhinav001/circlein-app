# Firebase Time Slots Migration Guide

## 🚀 Quick Setup & Run

### Step 1: Download Firebase Service Account Key

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: **circlein-f76c1**
3. Click the ⚙️ gear icon (Project Settings) → **Service accounts**
4. Click **"Generate new private key"**
5. Save the downloaded JSON file as `serviceAccountKey.json` in the **root directory** of this project

### Step 2: Run the Migration

```bash
# Make sure you're in the project directory
cd c:\Users\Abhi\Downloads\circlein-app

# Run the migration script
node scripts/migrate-time-slots.js
```

## 📊 What This Migration Does

Sets up **smart default time slots** for all amenities based on their category:

### 🏋️ Gym
- **Weekdays:** 6 AM - 10 PM (2-hour slots)
- **Weekends:** 8 AM - 8 PM (2-hour slots)

### 🏊 Pool
- **Weekdays:** 6 AM - 9 PM (2-hour slots)
- **Weekends:** 8 AM - 7 PM (2-hour slots)

### 🏛️ Clubhouse
- **Weekdays:** 9 AM - 9 PM (3-hour slots)
- **Weekends:** 10 AM - 10 PM (3-hour slots)

### 🎉 Party Hall
- **Custom slots:** Morning (10-2), Evening (3-7), Night (8-12)

### 🎾 Tennis/Badminton Court
- **Weekday slots:** Early morning + evening peak hours
- **Weekend slots:** Extended daytime availability

### 🔧 Default (Other amenities)
- **All days:** 9 AM - 9 PM (2-hour slots)

## ✅ Safety Features

- **Won't overwrite** existing time slot configurations
- **Batch operation** - all updates in one transaction
- **Detailed logging** - shows exactly what's being updated
- **Error handling** - stops if something goes wrong

## 🔍 After Migration

Check your Firestore console to see the new fields added:
- `weekdayHours` / `weekendHours`
- `slotDuration`
- Or `timeSlots` / `weekdaySlots` / `weekendSlots` for custom configurations

Your booking pages will **immediately** reflect these changes (real-time updates)!

## 🛠️ Troubleshooting

**Error: Service account key not found**
→ Make sure `serviceAccountKey.json` is in the root directory

**Error: Permission denied**
→ Your service account needs Firestore read/write permissions

**No amenities updated?**
→ All amenities might already have time slot configurations

## 📝 Next Steps

After migration:
1. Test booking pages - time slots should update automatically
2. Use Admin UI at `/admin/time-slots` to customize any amenity
3. Changes will reflect instantly without page refresh!
