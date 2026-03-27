import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { adminDb } from '@/lib/firebase-admin';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userEmail = String(session.user.email);
    const body = await request.json().catch(() => ({}));
    const confirmationText = String(body?.confirmationText || '').trim();
    const reason = String(body?.reason || '').trim();

    if (confirmationText !== 'DELETE') {
      return NextResponse.json(
        { error: 'Confirmation text mismatch. Type DELETE to confirm.' },
        { status: 400 }
      );
    }

    const userRef = adminDb.collection('users').doc(userEmail);
    const userSnap = await userRef.get();

    if (!userSnap.exists) {
      return NextResponse.json({ error: 'User record not found' }, { status: 404 });
    }

    const userData = userSnap.data() || {};
    const communityId = String(userData.communityId || (session.user as any)?.communityId || '');

    if (!communityId) {
      return NextResponse.json({ error: 'Community ID missing for user' }, { status: 400 });
    }

    const existingRequest = userData.deletionRequest;
    if (existingRequest?.status === 'requested') {
      return NextResponse.json(
        {
          success: true,
          message: 'A deletion request is already pending review.',
          alreadyPending: true,
        },
        { status: 200 }
      );
    }

    const nowIso = new Date().toISOString();
    const requestRef = adminDb.collection('accountDeletionRequests').doc();

    await Promise.all([
      userRef.set(
        {
          deletionRequest: {
            status: 'requested',
            requestedAt: nowIso,
            requestedBy: userEmail,
            reason: reason || 'Requested from resident settings.',
          },
          updatedAt: nowIso,
        },
        { merge: true }
      ),
      requestRef.set({
        id: requestRef.id,
        userEmail,
        userName: session.user.name || userEmail,
        communityId,
        reason: reason || 'Requested from resident settings.',
        status: 'requested',
        requestedAt: nowIso,
        requestedBy: userEmail,
      }),
    ]);

    const communityUsersSnap = await adminDb
      .collection('users')
      .where('communityId', '==', communityId)
      .get();

    const adminEmails = communityUsersSnap.docs
      .map((docSnapshot) => {
        const data = docSnapshot.data();
        const role = String(data.role || '').toLowerCase();
        if (role === 'admin' || role === 'super_admin') {
          return docSnapshot.id;
        }
        return '';
      })
      .filter(Boolean);

    const notificationWrites = adminEmails.map((adminEmail) => {
      const notificationRef = adminDb.collection('notifications').doc();
      return notificationRef.set({
        userEmail: adminEmail,
        recipientEmail: adminEmail,
        communityId,
        type: 'system',
        priority: 'important',
        title: 'Account deletion request received',
        message: `${userEmail} submitted a deletion request and needs review.`,
        read: false,
        actionUrl: '/admin/users',
        source: 'account_deletion_request',
        createdAt: nowIso,
        metadata: {
          requestId: requestRef.id,
          requestedUser: userEmail,
        },
      });
    });

    await Promise.all(notificationWrites);

    return NextResponse.json({
      success: true,
      message: 'Deletion request submitted successfully.',
      requestId: requestRef.id,
    });
  } catch (error: any) {
    console.error('Failed to submit deletion request:', error);
    return NextResponse.json(
      { error: 'Failed to submit deletion request', details: error?.message || 'Unknown error' },
      { status: 500 }
    );
  }
}
