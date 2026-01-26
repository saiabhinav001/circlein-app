import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { adminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

/**
 * DELETE /api/admin/delete-resident
 * 
 * Comprehensive resident deletion endpoint that:
 * 1. Deletes all user's bookings (past and future)
 * 2. Deletes all user's notifications
 * 3. Removes user from any shared data structures
 * 4. Deletes the user document
 * 5. Invalidates their session (forces sign-out)
 * 
 * This ensures no orphaned data remains in the database.
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Verify admin authentication
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized - No session found' },
        { status: 401 }
      );
    }

    if (session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }

    // 2. Parse request body
    const body = await request.json();
    const { userId, userEmail } = body;

    if (!userId || !userEmail) {
      return NextResponse.json(
        { error: 'Missing required fields: userId and userEmail' },
        { status: 400 }
      );
    }

    // 3. Get user document to verify they exist and get their communityId
    const userDoc = await adminDb.collection('users').doc(userId).get();
    
    if (!userDoc.exists) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const userData = userDoc.data();
    const userCommunityId = userData?.communityId;

    // 4. Security check: Ensure admin can only delete users from their own community
    if (userCommunityId !== session.user.communityId) {
      return NextResponse.json(
        { error: 'Forbidden - Cannot delete users from other communities' },
        { status: 403 }
      );
    }

    // 5. Prevent self-deletion
    if (userId === session.user.email || userEmail === session.user.email) {
      return NextResponse.json(
        { error: 'Cannot delete your own admin account' },
        { status: 400 }
      );
    }

    console.log(`🗑️ Starting comprehensive deletion for user: ${userEmail}`);

    // 6. Delete all user's bookings (both past and future)
    let deletedBookings = 0;
    try {
      const bookingsQuery = adminDb.collection('bookings')
        .where('userEmail', '==', userEmail);
      
      const bookingsSnapshot = await bookingsQuery.get();
      
      if (!bookingsSnapshot.empty) {
        const batch = adminDb.batch();
        bookingsSnapshot.docs.forEach((doc: any) => {
          batch.delete(doc.ref);
          deletedBookings++;
        });
        await batch.commit();
        console.log(`✅ Deleted ${deletedBookings} bookings for user ${userEmail}`);
      }
    } catch (error) {
      console.error('❌ Error deleting bookings:', error);
      // Continue with deletion even if bookings fail
    }

    // 7. Delete all notifications for this user (communityNotifications where recipientEmail matches)
    let deletedNotifications = 0;
    try {
      const notificationsQuery = adminDb.collection('communityNotifications')
        .where('recipientEmail', '==', userEmail);
      
      const notificationsSnapshot = await notificationsQuery.get();
      
      if (!notificationsSnapshot.empty) {
        const batch = adminDb.batch();
        notificationsSnapshot.docs.forEach((doc: any) => {
          batch.delete(doc.ref);
          deletedNotifications++;
        });
        await batch.commit();
        console.log(`✅ Deleted ${deletedNotifications} notifications for user ${userEmail}`);
      }
    } catch (error) {
      console.error('❌ Error deleting notifications:', error);
      // Continue with deletion even if notifications fail
    }

    // 8. Delete any user-specific subcollections (if they exist)
    // Add more collection deletions here if you have user-specific subcollections
    try {
      // Example: Delete user preferences if stored separately
      const userPrefsRef = adminDb.collection('userPreferences').doc(userId);
      const userPrefsDoc = await userPrefsRef.get();
      if (userPrefsDoc.exists) {
        await userPrefsRef.delete();
        console.log(`✅ Deleted user preferences for ${userEmail}`);
      }
    } catch (error) {
      console.error('❌ Error deleting user preferences:', error);
      // Continue even if this fails
    }

    // 9. DELETE access codes used by this user and CREATE NEW ONES
    let deletedAccessCodes: string[] = [];
    let newAccessCode: string | null = null;
    
    try {
      const accessCodesQuery = adminDb.collection('accessCodes')
        .where('usedBy', '==', userEmail);
      
      const accessCodesSnapshot = await accessCodesQuery.get();
      
      if (!accessCodesSnapshot.empty) {
        // DELETE each access code used by this user
        for (const codeDoc of accessCodesSnapshot.docs) {
          const codeId = codeDoc.id;
          await adminDb.collection('accessCodes').doc(codeId).delete();
          deletedAccessCodes.push(codeId);
          console.log(`✅ DELETED access code: ${codeId}`);
        }
        
        // Generate ONE new replacement code for the community
        const generateCode = (): string => {
          const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
          let result = '';
          for (let i = 0; i < 8; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
          }
          return result;
        };
        
        // Generate unique code
        let attempts = 0;
        while (attempts < 100) {
          const candidate = generateCode();
          const existing = await adminDb.collection('accessCodes').doc(candidate).get();
          if (!existing.exists) {
            newAccessCode = candidate;
            break;
          }
          attempts++;
        }
        
        if (newAccessCode && userCommunityId) {
          await adminDb.collection('accessCodes').doc(newAccessCode).set({
            code: newAccessCode,
            communityId: userCommunityId,
            isUsed: false,
            usedBy: null,
            createdAt: FieldValue.serverTimestamp(),
            createdBy: session.user.email,
            replacedCode: deletedAccessCodes[0] || null,
            reason: 'User deleted - replacement code',
          });
          console.log(`✅ Created NEW access code: ${newAccessCode}`);
        }
      }
    } catch (error) {
      console.error('❌ Error handling access codes:', error);
      // Continue even if this fails
    }

    // 10. Delete the user document itself
    try {
      await adminDb.collection('users').doc(userId).delete();
      console.log(`✅ Deleted user document for ${userEmail}`);
    } catch (error) {
      console.error('❌ Error deleting user document:', error);
      throw new Error('Failed to delete user document');
    }

    // 11. Invalidate any active sessions for this user
    // Note: NextAuth JWT sessions will automatically become invalid once the user doc is deleted
    // because the jwt callback checks if user exists in Firestore
    console.log(`🔒 User ${userEmail} will be signed out on next request`);

    // 12. Return success response with deletion summary
    return NextResponse.json({
      success: true,
      message: `User ${userEmail} and all associated data deleted successfully`,
      deletedData: {
        bookings: deletedBookings,
        notifications: deletedNotifications,
        userDocument: true,
        accessCodesDeleted: deletedAccessCodes,
        newAccessCode: newAccessCode
      }
    });

  } catch (error) {
    console.error('💥 Error in delete-resident API:', error);
    return NextResponse.json(
      { 
        error: 'Failed to delete resident',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
