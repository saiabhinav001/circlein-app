import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

/**
 * DELETE COMMUNITY API - CASCADE DELETE
 * 
 * When an admin invite is deleted, this deletes EVERYTHING:
 * 1. Admin user document
 * 2. Community document
 * 3. ALL access codes for that community
 * 4. ALL users in that community
 * 5. ALL amenities for that community
 * 6. ALL bookings for that community
 * 7. ALL notifications for that community
 * 
 * This is a DESTRUCTIVE operation - use with caution!
 */

export async function POST(request: NextRequest) {
  try {
    // This endpoint should only be called by developers/super-admins
    // Add your own authentication check here if needed
    
    const body = await request.json();
    const { adminEmail, communityId, confirmDelete } = body;

    if (!adminEmail && !communityId) {
      return NextResponse.json(
        { error: 'Either adminEmail or communityId is required' },
        { status: 400 }
      );
    }

    if (confirmDelete !== 'DELETE_EVERYTHING') {
      return NextResponse.json(
        { error: 'Must confirm deletion with confirmDelete: "DELETE_EVERYTHING"' },
        { status: 400 }
      );
    }

    let targetCommunityId = communityId;
    let targetAdminEmail = adminEmail;

    // If only admin email provided, find their community
    if (adminEmail && !communityId) {
      const adminDoc = await adminDb.collection('users').doc(adminEmail).get();
      if (adminDoc.exists) {
        targetCommunityId = adminDoc.data()?.communityId;
      }
      
      // Also check adminInvites
      const invitesSnapshot = await adminDb.collection('adminInvites')
        .where('email', '==', adminEmail)
        .get();
      
      if (!invitesSnapshot.empty) {
        targetCommunityId = targetCommunityId || invitesSnapshot.docs[0].data().communityId;
      }
    }

    if (!targetCommunityId) {
      return NextResponse.json(
        { error: 'Could not determine community to delete' },
        { status: 404 }
      );
    }

    console.log('🗑️ === CASCADE DELETE COMMUNITY ===');
    console.log('📍 Community ID:', targetCommunityId);
    console.log('👤 Admin Email:', targetAdminEmail);

    const deletionSummary = {
      community: false,
      adminInvites: 0,
      adminUsers: 0,
      accessCodes: 0,
      users: 0,
      amenities: 0,
      bookings: 0,
      notifications: 0,
    };

    // 1. Delete all admin invites for this community
    try {
      const invitesSnapshot = await adminDb.collection('adminInvites')
        .where('communityId', '==', targetCommunityId)
        .get();
      
      for (const doc of invitesSnapshot.docs) {
        await doc.ref.delete();
        deletionSummary.adminInvites++;
      }
      console.log(`✅ Deleted ${deletionSummary.adminInvites} admin invites`);
    } catch (e) {
      console.error('Error deleting admin invites:', e);
    }

    // 2. Delete all access codes for this community
    try {
      const codesSnapshot = await adminDb.collection('accessCodes')
        .where('communityId', '==', targetCommunityId)
        .get();
      
      for (const doc of codesSnapshot.docs) {
        await doc.ref.delete();
        deletionSummary.accessCodes++;
      }
      console.log(`✅ Deleted ${deletionSummary.accessCodes} access codes`);
    } catch (e) {
      console.error('Error deleting access codes:', e);
    }

    // 3. Delete all users in this community (and their related data)
    try {
      const usersSnapshot = await adminDb.collection('users')
        .where('communityId', '==', targetCommunityId)
        .get();
      
      for (const userDoc of usersSnapshot.docs) {
        const userEmail = userDoc.id;
        
        // Delete user's bookings
        const userBookingsSnapshot = await adminDb.collection('bookings')
          .where('userEmail', '==', userEmail)
          .get();
        
        for (const booking of userBookingsSnapshot.docs) {
          await booking.ref.delete();
          deletionSummary.bookings++;
        }
        
        // Delete user's notifications
        const userNotifSnapshot = await adminDb.collection('communityNotifications')
          .where('recipientEmail', '==', userEmail)
          .get();
        
        for (const notif of userNotifSnapshot.docs) {
          await notif.ref.delete();
          deletionSummary.notifications++;
        }
        
        // Delete user document
        await userDoc.ref.delete();
        
        if (userDoc.data().role === 'admin') {
          deletionSummary.adminUsers++;
        } else {
          deletionSummary.users++;
        }
      }
      console.log(`✅ Deleted ${deletionSummary.adminUsers} admins and ${deletionSummary.users} users`);
    } catch (e) {
      console.error('Error deleting users:', e);
    }

    // 4. Delete all amenities for this community
    try {
      const amenitiesSnapshot = await adminDb.collection('amenities')
        .where('communityId', '==', targetCommunityId)
        .get();
      
      for (const doc of amenitiesSnapshot.docs) {
        await doc.ref.delete();
        deletionSummary.amenities++;
      }
      console.log(`✅ Deleted ${deletionSummary.amenities} amenities`);
    } catch (e) {
      console.error('Error deleting amenities:', e);
    }

    // 5. Delete any remaining bookings for this community
    try {
      const bookingsSnapshot = await adminDb.collection('bookings')
        .where('communityId', '==', targetCommunityId)
        .get();
      
      for (const doc of bookingsSnapshot.docs) {
        await doc.ref.delete();
        deletionSummary.bookings++;
      }
    } catch (e) {
      console.error('Error deleting remaining bookings:', e);
    }

    // 6. Delete any remaining notifications for this community
    try {
      const notifsSnapshot = await adminDb.collection('communityNotifications')
        .where('communityId', '==', targetCommunityId)
        .get();
      
      for (const doc of notifsSnapshot.docs) {
        await doc.ref.delete();
        deletionSummary.notifications++;
      }
    } catch (e) {
      console.error('Error deleting remaining notifications:', e);
    }

    // 7. Delete the community document itself
    try {
      const communityRef = adminDb.collection('communities').doc(targetCommunityId);
      const communityDoc = await communityRef.get();
      
      if (communityDoc.exists) {
        await communityRef.delete();
        deletionSummary.community = true;
        console.log(`✅ Deleted community document: ${targetCommunityId}`);
      }
    } catch (e) {
      console.error('Error deleting community:', e);
    }

    console.log('🗑️ === CASCADE DELETE COMPLETE ===');
    console.log('📊 Summary:', deletionSummary);

    return NextResponse.json({
      success: true,
      message: `Community ${targetCommunityId} and all associated data deleted`,
      deletionSummary,
    });

  } catch (error) {
    console.error('💥 Error in delete-community API:', error);
    return NextResponse.json(
      { 
        error: 'Failed to delete community',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Delete Community API - CASCADE DELETES everything',
    usage: 'POST { adminEmail OR communityId, confirmDelete: "DELETE_EVERYTHING" }',
    warning: 'This is DESTRUCTIVE and cannot be undone!',
  });
}
