# Firebase Setup Instructions

## The authentication is working correctly, but there's a Firebase permissions issue that needs to be resolved.

### Problem:
The Google OAuth authentication is successful, but Firebase Firestore security rules are blocking user document creation with the error: `Missing or insufficient permissions`.

### Solution:

#### 1. Update Firestore Security Rules in Firebase Console

1. Go to the [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `circlein-f76c1`
3. Navigate to **Firestore Database** → **Rules**
4. Replace the current rules with the development-friendly rules below:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow all reads and writes for development
    // TODO: Make these more restrictive for production
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

5. Click **Publish** to save the rules

#### 2. Alternative: More Secure Rules (Recommended for Production)

If you want more secure rules that only allow authenticated users:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow authenticated users to read and write their own user document
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.token.email == userId;
    }
    
    // Allow authenticated users to read amenities
    match /amenities/{amenityId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
                     request.auth.token.email in ['admin@circlein.com']; // Add admin emails
    }
    
    // Allow authenticated users to read/write their bookings
    match /bookings/{bookingId} {
      allow read, write: if request.auth != null && 
                           request.auth.token.email == resource.data.userEmail;
    }
    
    // Allow authenticated users to read access codes
    match /accessCodes/{codeId} {
      allow read: if request.auth != null;
    }
  }
}
```

#### 3. Test the Authentication Flow

After updating the Firestore rules:

1. Go to http://localhost:3000
2. Click "Sign In" or "Get Started"
3. Choose "Sign in with Google"
4. Complete the Google OAuth flow
5. You should be redirected to the dashboard successfully

#### 4. Verify User Creation

You can check if users are being created properly by:

1. Going to Firebase Console → Firestore Database → Data
2. Looking for a `users` collection
3. Your user document should appear with your email as the document ID

### What's Working:
✅ Google OAuth integration
✅ NextAuth configuration
✅ Session management
✅ Routing and redirects
✅ User interface
✅ Build process

### What Needs Firebase Rules Update:
❌ User document creation in Firestore (blocked by security rules)

Once you update the Firebase security rules, the authentication will work completely and users will be created in the database successfully.