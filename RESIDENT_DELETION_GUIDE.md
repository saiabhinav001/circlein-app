# Comprehensive Resident Deletion Feature

## Overview
When an admin deletes a resident from the Community Users page, the system now performs a **comprehensive deletion** that removes all traces of the user from the database and forces them to sign out from all devices.

## What Gets Deleted

When you delete a resident, the following data is **permanently removed**:

### 1. **User Account** ✅
- User profile document from `users` collection
- User authentication credentials
- User preferences and settings

### 2. **All Bookings** ✅
- Past bookings (completed)
- Current bookings (active)
- Future bookings (upcoming)
- All booking history from `bookings` collection

### 3. **All Notifications** ✅
- All notifications sent to the user
- Notification preferences
- Notification history from `communityNotifications` collection

### 4. **Access Code Release** ✅
- The access code used by the resident is marked as "unused"
- The access code becomes available for reuse by new residents
- Access code usage history is cleared

### 5. **Session Invalidation** 🔒
- The user's JWT token becomes invalid immediately
- On their next request, they will be automatically signed out
- They cannot access any protected pages anymore
- Forces sign-out from all devices (mobile, desktop, tablet)

## Security Features

### Admin-Only Access
- Only users with `admin` role can delete residents
- Admins can only delete users from their own community
- Admins cannot delete themselves

### Confirmation Dialog
The UI shows a detailed confirmation dialog with:
- Warning icon
- List of what will be deleted
- Clear warning that action is irreversible
- Cancel and Confirm buttons

### Comprehensive Error Handling
- Validates admin authentication
- Checks user exists before deletion
- Verifies community ownership
- Prevents self-deletion
- Continues deletion even if some steps fail (graceful degradation)
- Logs all operations for debugging

## Technical Implementation

### API Endpoint
```
POST /api/admin/delete-resident
```

**Request Body:**
```json
{
  "userId": "user@example.com",
  "userEmail": "user@example.com"
}
```

**Success Response:**
```json
{
  "success": true,
  "message": "User user@example.com and all associated data deleted successfully",
  "deletedData": {
    "bookings": 5,
    "notifications": 12,
    "userDocument": true
  }
}
```

**Error Responses:**
- `401`: Unauthorized (not signed in)
- `403`: Forbidden (not admin or wrong community)
- `404`: User not found
- `400`: Missing fields or self-deletion attempt
- `500`: Server error

### Session Invalidation Strategy

The system uses NextAuth JWT tokens. When a user is deleted:

1. **Immediate Effect**: User document is deleted from Firestore
2. **JWT Callback**: On next request, the JWT callback in `lib/auth.ts` checks if user exists:
   ```typescript
   const userDoc = await getDoc(doc(db, 'users', token.email));
   if (!userDoc.exists) {
     // User document missing - token is invalid
     return null; // This invalidates the session
   }
   ```
3. **Automatic Sign-Out**: NextAuth detects invalid token and signs user out
4. **Redirect**: User is redirected to sign-in page
5. **No Re-access**: Deleted user cannot sign in again (account doesn't exist)

### Database Operations

The deletion uses **Firebase Admin SDK** for server-side operations:

```typescript
// Delete bookings
const bookingsQuery = adminDb.collection('bookings')
  .where('userEmail', '==', userEmail);
const bookingsSnapshot = await bookingsQuery.get();
const batch = adminDb.batch();
bookingsSnapshot.docs.forEach(doc => batch.delete(doc.ref));
await batch.commit();

// Delete notifications
const notificationsQuery = adminDb.collection('communityNotifications')
  .where('recipientEmail', '==', userEmail);
// ... similar batch delete

// Delete user document
await adminDb.collection('users').doc(userId).delete();
```

## User Experience

### Admin View
1. Navigate to **Admin → Manage Users**
2. Find the resident to delete
3. Click the red **trash icon** next to their name
4. Review the deletion warning dialog
5. Click **"Delete Permanently"**
6. See a loading toast: "Deleting user and all associated data..."
7. See success toast with deletion summary: "User deleted successfully! Removed X bookings and Y notifications."
8. User is removed from the list immediately

### Deleted User Experience
1. User is currently using the app
2. Admin deletes their account
3. User's current session continues working
4. **On next page navigation or API call:**
   - JWT callback detects missing user document
   - Session becomes invalid
   - User is automatically signed out
   - Redirected to sign-in page
5. If user tries to sign in again:
   - "Invalid email or password" (account doesn't exist)

## Best Practices

### Before Deleting a User
1. **Verify it's the correct user** - Double-check email and name
2. **Consider data backup** - Take a Firestore export if needed
3. **Communicate with resident** - Inform them their account will be deleted
4. **Check pending bookings** - Note any upcoming bookings that will be cancelled

### After Deletion
1. **Verify deletion** - Check that user no longer appears in list
2. **Check calendar** - Verify their bookings are removed from calendar
3. **Monitor logs** - Check server logs for successful deletion confirmation
4. **Reuse access code** - The freed access code can be given to a new resident

## Troubleshooting

### User still seeing their bookings
**Cause**: User's browser cache may be showing old data
**Solution**: 
- User should refresh the page (Ctrl+R or Cmd+R)
- User should clear browser cache
- User will be signed out on next API call

### "Failed to delete user" error
**Possible causes:**
1. Network issues - Check internet connection
2. Permission issues - Verify Firebase Admin SDK credentials
3. Firestore rules - Check firestore.rules allows admin operations
4. User doesn't exist - User may already be deleted

**Solution:**
- Check browser console for detailed error
- Check server logs for backend errors
- Verify Firebase credentials in environment variables

### Access code not released
**Cause**: Access code deletion failed but user was deleted
**Solution:**
- Manually mark access code as unused in Firebase Console
- Or generate a new access code

## Environment Variables Required

For the API to work, ensure these are set:

```env
# Firebase Admin SDK (for server-side operations)
FIREBASE_CLIENT_EMAIL=your-service-account@project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
```

## Testing Checklist

Before deploying to production, test:

- [ ] Admin can delete a resident
- [ ] Deleted user's bookings are removed
- [ ] Deleted user's notifications are removed
- [ ] Deleted user is signed out automatically
- [ ] Deleted user cannot sign in again
- [ ] Access code is released for reuse
- [ ] Admin cannot delete themselves
- [ ] Admin cannot delete users from other communities
- [ ] Non-admin users cannot access deletion API
- [ ] Error messages are clear and helpful
- [ ] Success toast shows deletion summary

## Future Enhancements

Potential improvements for later:

1. **Soft Delete**: Mark user as inactive instead of permanent deletion
2. **Deletion Audit Log**: Track who deleted whom and when
3. **Bulk Delete**: Delete multiple users at once
4. **Export Before Delete**: Automatically export user data before deletion
5. **Undo Feature**: Allow 24-hour window to restore deleted accounts
6. **Email Notification**: Send email to deleted user confirming deletion
7. **Data Retention Policy**: Automatically delete inactive users after X days

## Support

If you encounter issues with resident deletion:

1. Check server logs in production (Vercel logs)
2. Check browser console for frontend errors
3. Verify Firebase Admin SDK is properly configured
4. Check Firestore security rules
5. Contact support with error details and user email

---

**Last Updated**: October 10, 2025
**Feature Version**: 1.0.0
**Production Ready**: ✅ Yes
