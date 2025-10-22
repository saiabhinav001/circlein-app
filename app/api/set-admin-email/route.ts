import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

/**
 * API endpoint to set admin email for all residents in a community
 * This ensures residents' emails go to their community admin
 * 
 * Usage: POST /api/set-admin-email
 * Body: { communityId: string, adminEmail: string }
 */
export async function POST(request: NextRequest) {
  try {
    const { communityId, adminEmail } = await request.json();

    if (!communityId || !adminEmail) {
      return NextResponse.json(
        { error: 'communityId and adminEmail are required' },
        { status: 400 }
      );
    }

    console.log(`Setting admin email ${adminEmail} for community ${communityId}`);

    // Get all users in the community
    const usersSnapshot = await adminDb
      .collection('users')
      .where('communityId', '==', communityId)
      .get();

    if (usersSnapshot.empty) {
      return NextResponse.json(
        { error: 'No users found in this community' },
        { status: 404 }
      );
    }

    // Update all residents (non-admin users) with admin email
    const batch = adminDb.batch();
    let updateCount = 0;

    usersSnapshot.forEach((doc) => {
      const userData = doc.data();
      // Only update residents, not admins
      if (userData.role !== 'admin') {
        batch.update(doc.ref, { adminEmail: adminEmail });
        updateCount++;
      }
    });

    await batch.commit();

    console.log(`✅ Updated ${updateCount} residents with admin email`);

    return NextResponse.json({
      success: true,
      message: `Updated ${updateCount} residents with admin email ${adminEmail}`,
      communityId,
      adminEmail,
      totalUsers: usersSnapshot.size,
      updatedResidents: updateCount
    });

  } catch (error: any) {
    console.error('❌ Error setting admin email:', error);
    return NextResponse.json(
      { error: 'Failed to set admin email', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * GET endpoint to retrieve admin email for a community
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const communityId = searchParams.get('communityId');

    if (!communityId) {
      return NextResponse.json(
        { error: 'communityId parameter is required' },
        { status: 400 }
      );
    }

    // Find admin in the community
    const adminSnapshot = await adminDb
      .collection('users')
      .where('communityId', '==', communityId)
      .where('role', '==', 'admin')
      .limit(1)
      .get();

    if (adminSnapshot.empty) {
      return NextResponse.json(
        { error: 'No admin found in this community' },
        { status: 404 }
      );
    }

    const adminData = adminSnapshot.docs[0].data();

    return NextResponse.json({
      success: true,
      communityId,
      adminEmail: adminData.email,
      adminName: adminData.name
    });

  } catch (error: any) {
    console.error('❌ Error getting admin email:', error);
    return NextResponse.json(
      { error: 'Failed to get admin email', details: error.message },
      { status: 500 }
    );
  }
}
