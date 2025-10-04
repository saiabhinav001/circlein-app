# 🎯 Complete Database Setup Guide for CircleIn

## 📋 Quick Summary

Your CircleIn authentication is **working perfectly!** You just need to complete the database setup with these exact steps:

---

## 🔥 **Step 1: Update Firebase Security Rules**

1. **Go to:** [Firebase Console](https://console.firebase.google.com/)
2. **Select:** Your project `circlein-f76c1`
3. **Navigate:** Firestore Database → Rules
4. **Replace with this code:**

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

5. **Click:** "Publish"

---

## 🚀 **Step 2: Initialize Database (Choose One Method)**

### **Method A: Automatic Setup (Recommended)**

1. **Visit:** http://localhost:3000/database-setup
2. **Click:** "Initialize Database" button
3. **Done!** All collections created automatically

### **Method B: Manual Setup**

**Go to Firebase Console → Firestore Database → Data**

#### **Collection: `users`**

**Document ID:** `admin@circlein.com`
```json
{
  "name": "CircleIn Admin",
  "email": "admin@circlein.com",
  "role": "admin",
  "phoneNumber": "+1234567890",
  "unitNumber": "Admin",
  "preferences": {
    "notifications": true,
    "emailUpdates": true
  },
  "createdAt": "2025-09-29T10:00:00Z",
  "lastLogin": "2025-09-29T10:00:00Z",
  "isActive": true
}
```

**Document ID:** `resident@example.com`
```json
{
  "name": "Jane Smith",
  "email": "resident@example.com", 
  "role": "resident",
  "phoneNumber": "+1234567891",
  "unitNumber": "B205",
  "preferences": {
    "notifications": true,
    "emailUpdates": false
  },
  "createdAt": "2025-09-29T09:00:00Z",
  "lastLogin": "2025-09-29T09:30:00Z",
  "isActive": true
}
```

#### **Collection: `amenities`**

**Document ID:** `swimming-pool`
```json
{
  "name": "Swimming Pool",
  "description": "Olympic-sized swimming pool with heating system and lifeguard on duty",
  "category": "Recreation",
  "imageUrl": "https://images.pexels.com/photos/261102/pexels-photo-261102.jpeg?auto=compress&cs=tinysrgb&w=600",
  "capacity": 20,
  "location": "Building A - Level 1",
  "amenityId": "swimming-pool",
  "rules": {
    "maxSlotsPerFamily": 2,
    "maxDurationHours": 2,
    "advanceBookingDays": 14,
    "blackoutDates": [],
    "requiresDeposit": false,
    "depositAmount": 0
  },
  "availability": {
    "monday": { "start": "06:00", "end": "22:00", "slots": ["06:00", "08:00", "10:00", "12:00", "14:00", "16:00", "18:00", "20:00"] },
    "tuesday": { "start": "06:00", "end": "22:00", "slots": ["06:00", "08:00", "10:00", "12:00", "14:00", "16:00", "18:00", "20:00"] },
    "wednesday": { "start": "06:00", "end": "22:00", "slots": ["06:00", "08:00", "10:00", "12:00", "14:00", "16:00", "18:00", "20:00"] },
    "thursday": { "start": "06:00", "end": "22:00", "slots": ["06:00", "08:00", "10:00", "12:00", "14:00", "16:00", "18:00", "20:00"] },
    "friday": { "start": "06:00", "end": "22:00", "slots": ["06:00", "08:00", "10:00", "12:00", "14:00", "16:00", "18:00", "20:00"] },
    "saturday": { "start": "08:00", "end": "20:00", "slots": ["08:00", "10:00", "12:00", "14:00", "16:00", "18:00"] },
    "sunday": { "start": "08:00", "end": "20:00", "slots": ["08:00", "10:00", "12:00", "14:00", "16:00", "18:00"] }
  },
  "isActive": true,
  "createdAt": "2025-09-29T10:00:00Z",
  "updatedAt": "2025-09-29T10:00:00Z"
}
```

**Document ID:** `gym`
```json
{
  "name": "Fitness Center",
  "description": "Fully equipped gym with cardio machines, weights, and exercise classes",
  "category": "Fitness", 
  "imageUrl": "https://images.pexels.com/photos/1552242/pexels-photo-1552242.jpeg?auto=compress&cs=tinysrgb&w=600",
  "capacity": 15,
  "location": "Building B - Level 2",
  "amenityId": "gym",
  "rules": {
    "maxSlotsPerFamily": 3,
    "maxDurationHours": 2,
    "advanceBookingDays": 7,
    "blackoutDates": [],
    "requiresDeposit": false,
    "depositAmount": 0
  },
  "availability": {
    "monday": { "start": "05:00", "end": "23:00", "slots": ["05:00", "07:00", "09:00", "11:00", "13:00", "15:00", "17:00", "19:00", "21:00"] },
    "tuesday": { "start": "05:00", "end": "23:00", "slots": ["05:00", "07:00", "09:00", "11:00", "13:00", "15:00", "17:00", "19:00", "21:00"] },
    "wednesday": { "start": "05:00", "end": "23:00", "slots": ["05:00", "07:00", "09:00", "11:00", "13:00", "15:00", "17:00", "19:00", "21:00"] },
    "thursday": { "start": "05:00", "end": "23:00", "slots": ["05:00", "07:00", "09:00", "11:00", "13:00", "15:00", "17:00", "19:00", "21:00"] },
    "friday": { "start": "05:00", "end": "23:00", "slots": ["05:00", "07:00", "09:00", "11:00", "13:00", "15:00", "17:00", "19:00", "21:00"] },
    "saturday": { "start": "07:00", "end": "21:00", "slots": ["07:00", "09:00", "11:00", "13:00", "15:00", "17:00", "19:00"] },
    "sunday": { "start": "07:00", "end": "21:00", "slots": ["07:00", "09:00", "11:00", "13:00", "15:00", "17:00", "19:00"] }
  },
  "isActive": true,
  "createdAt": "2025-09-29T10:00:00Z",
  "updatedAt": "2025-09-29T10:00:00Z"
}
```

**Document ID:** `clubhouse`
```json
{
  "name": "Community Clubhouse",
  "description": "Multi-purpose room perfect for parties, meetings, and events",
  "category": "Meeting",
  "imageUrl": "https://images.pexels.com/photos/1181406/pexels-photo-1181406.jpeg?auto=compress&cs=tinysrgb&w=600", 
  "capacity": 50,
  "location": "Building C - Level 1",
  "amenityId": "clubhouse",
  "rules": {
    "maxSlotsPerFamily": 1,
    "maxDurationHours": 4,
    "advanceBookingDays": 30,
    "blackoutDates": [],
    "requiresDeposit": true,
    "depositAmount": 100
  },
  "availability": {
    "monday": { "start": "09:00", "end": "22:00", "slots": ["09:00", "13:00", "17:00"] },
    "tuesday": { "start": "09:00", "end": "22:00", "slots": ["09:00", "13:00", "17:00"] },
    "wednesday": { "start": "09:00", "end": "22:00", "slots": ["09:00", "13:00", "17:00"] },
    "thursday": { "start": "09:00", "end": "22:00", "slots": ["09:00", "13:00", "17:00"] },
    "friday": { "start": "09:00", "end": "23:00", "slots": ["09:00", "13:00", "17:00", "21:00"] },
    "saturday": { "start": "10:00", "end": "23:00", "slots": ["10:00", "14:00", "18:00"] },
    "sunday": { "start": "10:00", "end": "22:00", "slots": ["10:00", "14:00", "18:00"] }
  },
  "isActive": true,
  "createdAt": "2025-09-29T10:00:00Z",
  "updatedAt": "2025-09-29T10:00:00Z"
}
```

**Document ID:** `tennis-court`
```json
{
  "name": "Tennis Court",
  "description": "Professional tennis court with lighting for evening play",
  "category": "Outdoor",
  "imageUrl": "https://images.pexels.com/photos/209977/pexels-photo-209977.jpeg?auto=compress&cs=tinysrgb&w=600",
  "capacity": 4,
  "location": "Outdoor Area - Level 1", 
  "amenityId": "tennis-court",
  "rules": {
    "maxSlotsPerFamily": 2,
    "maxDurationHours": 1,
    "advanceBookingDays": 7,
    "blackoutDates": [],
    "requiresDeposit": false,
    "depositAmount": 0
  },
  "availability": {
    "monday": { "start": "06:00", "end": "21:00", "slots": ["06:00", "07:00", "08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00", "20:00"] },
    "tuesday": { "start": "06:00", "end": "21:00", "slots": ["06:00", "07:00", "08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00", "20:00"] },
    "wednesday": { "start": "06:00", "end": "21:00", "slots": ["06:00", "07:00", "08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00", "20:00"] },
    "thursday": { "start": "06:00", "end": "21:00", "slots": ["06:00", "07:00", "08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00", "20:00"] },
    "friday": { "start": "06:00", "end": "21:00", "slots": ["06:00", "07:00", "08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00", "20:00"] },
    "saturday": { "start": "07:00", "end": "20:00", "slots": ["07:00", "08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00"] },
    "sunday": { "start": "07:00", "end": "20:00", "slots": ["07:00", "08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00"] }
  },
  "isActive": true,
  "createdAt": "2025-09-29T10:00:00Z",
  "updatedAt": "2025-09-29T10:00:00Z"
}
```

#### **Collection: `accessCodes`**

**Document ID:** `CIRCLE2025`
```json
{
  "code": "CIRCLE2025",
  "description": "General access code for 2025 residents",
  "isUsed": false,
  "usedBy": "",
  "usedAt": null,
  "expiryDate": "2025-12-31",
  "maxUses": 100,
  "currentUses": 0,
  "createdBy": "admin@circlein.com",
  "createdAt": "2025-09-29T10:00:00Z",
  "isActive": true
}
```

**Document ID:** `NEWRESIDENT`
```json
{
  "code": "NEWRESIDENT",
  "description": "Access code for new residents",
  "isUsed": false,
  "usedBy": "",
  "usedAt": null,
  "expiryDate": "2025-12-31",
  "maxUses": 50,
  "currentUses": 0,
  "createdBy": "admin@circlein.com",
  "createdAt": "2025-09-29T10:00:00Z",
  "isActive": true
}
```

**Document ID:** `FAMILY2025`
```json
{
  "code": "FAMILY2025",
  "description": "Family access code", 
  "isUsed": false,
  "usedBy": "",
  "usedAt": null,
  "expiryDate": "2025-12-31",
  "maxUses": 1,
  "currentUses": 0,
  "createdBy": "admin@circlein.com",
  "createdAt": "2025-09-29T10:00:00Z",
  "isActive": true
}
```

#### **Collection: `settings`**

**Document ID:** `app-config`
```json
{
  "appName": "CircleIn",
  "version": "1.0.0",
  "maintenanceMode": false,
  "maintenanceMessage": "",
  "maxBookingsPerUser": 5,
  "defaultBookingDuration": 2,
  "cancellationPolicy": {
    "allowCancellation": true,
    "cancellationDeadlineHours": 24,
    "refundPolicy": "Full refund if cancelled 24 hours before"
  },
  "notifications": {
    "bookingConfirmation": true,
    "bookingReminder": true,
    "cancellationNotice": true,
    "reminderHoursBefore": 2
  },
  "operatingHours": {
    "weekdays": { "start": "06:00", "end": "23:00" },
    "weekends": { "start": "08:00", "end": "22:00" }
  },
  "contactInfo": {
    "email": "support@circlein.com",
    "phone": "+1-234-567-8900",
    "address": "123 Community Street, City, State 12345"
  },
  "updatedAt": "2025-09-29T10:00:00Z",
  "updatedBy": "admin@circlein.com"
}
```

---

## 🎯 **Step 3: Test Your Application**

1. **Visit:** http://localhost:3000
2. **Click:** "Sign In with Google"
3. **Complete:** Google OAuth flow
4. **You should now see:** Full dashboard with amenities!

---

## ✅ **What You'll Have After Setup:**

- 🔐 **Working Google OAuth authentication**
- 👥 **2 Sample users** (admin and resident)
- 🏊 **4 Amenities** (Pool, Gym, Clubhouse, Tennis Court)
- 🔑 **3 Access codes** for registration
- ⚙️ **Complete app configuration**
- 📱 **Fully functional booking system**

---

## 🚀 **Your App Will Include:**

✅ **Landing page** with authentication  
✅ **Dashboard** with amenity listings  
✅ **Booking system** for reservations  
✅ **User management** with roles  
✅ **Access code** registration  
✅ **Responsive design** for all devices  

**🎉 After completing these steps, your CircleIn community amenity booking application will be fully functional!**