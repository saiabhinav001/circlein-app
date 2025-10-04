# CircleIn Firestore Database Schema

## Complete Database Structure for CircleIn Community Amenity Booking App

### 🏗️ **Database Collections Overview**

Your Firestore database should have the following collections:

1. **users** - Store user profiles and authentication data
2. **amenities** - Community amenities available for booking
3. **bookings** - User reservations and booking records
4. **accessCodes** - Registration access codes for community members
5. **settings** - Application configuration and rules

---

## 📋 **Collection 1: `users`**

**Purpose:** Store user profiles, roles, and authentication information

### Document Structure:
```javascript
// Document ID: user's email (e.g., "john.doe@gmail.com")
{
  "name": "John Doe",
  "email": "john.doe@gmail.com",
  "role": "resident", // "resident", "admin", "manager"
  "phoneNumber": "+1234567890", // optional
  "unitNumber": "A101", // optional
  "profileImage": "https://...", // optional
  "preferences": {
    "notifications": true,
    "emailUpdates": true
  },
  "createdAt": Timestamp,
  "lastLogin": Timestamp,
  "isActive": true
}
```

### Sample Documents to Create:

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

---

## 🏊 **Collection 2: `amenities`**

**Purpose:** Store community amenities available for booking

### Document Structure:
```javascript
// Document ID: auto-generated or custom (e.g., "swimming-pool")
{
  "name": "Swimming Pool",
  "description": "Olympic-sized swimming pool with heating system",
  "category": "Recreation", // "Recreation", "Fitness", "Meeting", "Outdoor"
  "imageUrl": "https://images.pexels.com/photos/261102/pexels-photo-261102.jpeg",
  "capacity": 20,
  "location": "Building A - Level 1",
  "amenityId": "swimming-pool",
  "rules": {
    "maxSlotsPerFamily": 2,
    "maxDurationHours": 2,
    "advanceBookingDays": 14,
    "blackoutDates": [], // Array of dates when not available
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
  "createdAt": Timestamp,
  "updatedAt": Timestamp
}
```

### Sample Documents to Create:

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

---

## 📅 **Collection 3: `bookings`**

**Purpose:** Store user reservations and booking records

### Document Structure:
```javascript
// Document ID: auto-generated
{
  "bookingId": "booking_12345",
  "userEmail": "john.doe@gmail.com",
  "userName": "John Doe",
  "amenityId": "swimming-pool",
  "amenityName": "Swimming Pool",
  "bookingDate": "2025-10-15", // Date of the booking
  "timeSlot": "14:00", // Start time
  "duration": 2, // hours
  "endTime": "16:00",
  "status": "confirmed", // "pending", "confirmed", "cancelled", "completed"
  "guestCount": 3,
  "totalGuests": 4, // including user
  "guestNames": ["Jane Doe", "Mike Smith", "Sarah Johnson"],
  "specialRequests": "Need pool chairs",
  "bookingType": "regular", // "regular", "recurring"
  "depositPaid": 0,
  "paymentStatus": "free", // "free", "paid", "pending"
  "createdAt": Timestamp,
  "updatedAt": Timestamp,
  "cancelledAt": null,
  "cancelReason": "",
  "adminNotes": ""
}
```

### Sample Documents to Create:

**Document ID:** Auto-generated
```json
{
  "bookingId": "booking_001",
  "userEmail": "resident@example.com",
  "userName": "Jane Smith",
  "amenityId": "swimming-pool",
  "amenityName": "Swimming Pool",
  "bookingDate": "2025-10-01",
  "timeSlot": "14:00",
  "duration": 2,
  "endTime": "16:00",
  "status": "confirmed",
  "guestCount": 2,
  "totalGuests": 3,
  "guestNames": ["John Smith", "Baby Smith"],
  "specialRequests": "",
  "bookingType": "regular",
  "depositPaid": 0,
  "paymentStatus": "free",
  "createdAt": "2025-09-29T10:00:00Z",
  "updatedAt": "2025-09-29T10:00:00Z",
  "cancelledAt": null,
  "cancelReason": "",
  "adminNotes": ""
}
```

**Document ID:** Auto-generated
```json
{
  "bookingId": "booking_002",
  "userEmail": "admin@circlein.com",
  "userName": "CircleIn Admin",
  "amenityId": "clubhouse",
  "amenityName": "Community Clubhouse",
  "bookingDate": "2025-10-05",
  "timeSlot": "17:00",
  "duration": 4,
  "endTime": "21:00",
  "status": "confirmed",
  "guestCount": 25,
  "totalGuests": 26,
  "guestNames": [],
  "specialRequests": "Birthday party setup needed",
  "bookingType": "regular",
  "depositPaid": 100,
  "paymentStatus": "paid",
  "createdAt": "2025-09-29T10:00:00Z",
  "updatedAt": "2025-09-29T10:00:00Z",
  "cancelledAt": null,
  "cancelReason": "",
  "adminNotes": "Deposit received via bank transfer"
}
```

---

## 🔑 **Collection 4: `accessCodes`**

**Purpose:** Registration access codes for community members

### Document Structure:
```javascript
// Document ID: the access code itself (e.g., "CIRCLE2025")
{
  "code": "CIRCLE2025",
  "description": "General access code for 2025",
  "isUsed": false,
  "usedBy": "", // email of user who used it
  "usedAt": null,
  "expiryDate": "2025-12-31",
  "maxUses": 1, // how many times it can be used
  "currentUses": 0,
  "createdBy": "admin@circlein.com",
  "createdAt": Timestamp,
  "isActive": true
}
```

### Sample Documents to Create:

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

---

## ⚙️ **Collection 5: `settings`**

**Purpose:** Application configuration and global settings

### Document Structure:
```javascript
// Document ID: "app-config"
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
  "updatedAt": Timestamp,
  "updatedBy": "admin@circlein.com"
}
```

### Sample Document to Create:

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

## 🚀 **Quick Setup Instructions**

### Step 1: Update Firestore Security Rules
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow all reads and writes for development
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

### Step 2: Create Collections in Order:
1. **users** - Add the sample user documents
2. **amenities** - Add the 4 sample amenity documents
3. **bookings** - Add the sample booking documents
4. **accessCodes** - Add the 3 access code documents
5. **settings** - Add the app-config document

### Step 3: Test Your Database
After creating these collections and documents, your app will have:
- ✅ User authentication and profiles
- ✅ 4 Different amenities to book
- ✅ Sample bookings to display
- ✅ Access codes for registration
- ✅ App configuration

This complete database structure will provide all the data needed for your CircleIn application to function properly with user authentication, amenity booking, and management features.