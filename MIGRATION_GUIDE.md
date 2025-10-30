# Firebase Time Slots Migration Guide

## ⚠️ NOTE: Migration Script Removed

The migration script has been removed from production to avoid deployment issues.

## 🎯 Alternative: Use Admin UI Instead

You can set up time slots for all amenities using the **Admin UI**:

1. **Login as Admin**
2. **Go to** `/admin/time-slots`
3. **Edit each amenity** individually with the visual interface
4. **Preview and Save** - changes apply instantly!

This is **BETTER** than running a migration script because:
- ✅ No service account needed
- ✅ Visual preview before saving
- ✅ Can customize per amenity
- ✅ No deployment issues
- ✅ Changes reflect in real-time

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
