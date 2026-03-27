import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { adminDb } from '@/lib/firebase-admin';

export const dynamic = 'force-dynamic';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const role = String((session.user as any)?.role || '').toLowerCase();
    if (role !== 'admin' && role !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const communityId = String((session.user as any)?.communityId || '').trim();
    if (!communityId) {
      return NextResponse.json({ error: 'Community ID missing' }, { status: 400 });
    }

    const requestId = String(params?.id || '').trim();
    if (!requestId) {
      return NextResponse.json({ error: 'Request ID is required' }, { status: 400 });
    }

    const body = await request.json().catch(() => ({}));
    const status = String(body?.status || '').trim().toLowerCase();
    const reviewNote = String(body?.reviewNote || '').trim();
    const executeDeletion = Boolean(body?.executeDeletion);
    const confirmationText = String(body?.confirmationText || '').trim().toUpperCase();

    if (status !== 'approved' && status !== 'rejected') {
      return NextResponse.json({ error: 'Status must be approved or rejected' }, { status: 400 });
    }

    if (status === 'approved' && executeDeletion && confirmationText !== 'DELETE') {
      return NextResponse.json(
        { error: 'Confirmation text required. Type DELETE to execute account deletion.' },
        { status: 400 }
      );
    }

    const requestRef = adminDb.collection('accountDeletionRequests').doc(requestId);
    const requestSnap = await requestRef.get();

    if (!requestSnap.exists) {
      return NextResponse.json({ error: 'Deletion request not found' }, { status: 404 });
    }

    const requestData = requestSnap.data() || {};
    if (String(requestData.communityId || '') !== communityId) {
      return NextResponse.json({ error: 'Forbidden for this community' }, { status: 403 });
    }

    if (String(requestData.status || '') !== 'requested') {
      return NextResponse.json({ error: 'Only requested items can be reviewed' }, { status: 400 });
    }

    const userEmail = String(requestData.userEmail || '').trim();
    const nowIso = new Date().toISOString();

    let deletionResult: {
      executed: boolean;
      success: boolean;
      details?: any;
      error?: string;
    } = {
      executed: false,
      success: false,
    };

    if (status === 'approved' && executeDeletion && userEmail) {
      const deleteResponse = await fetch(`${request.nextUrl.origin}/api/admin/delete-resident`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          cookie: request.headers.get('cookie') || '',
        },
        body: JSON.stringify({
          userId: userEmail,
          userEmail,
          confirmationText,
        }),
      });

      const deleteData = await deleteResponse.json().catch(() => ({}));

      if (!deleteResponse.ok) {
        return NextResponse.json(
          {
            error: deleteData?.error || 'Deletion execution failed after approval',
            details: deleteData?.details || null,
          },
          { status: deleteResponse.status || 500 }
        );
      }

      deletionResult = {
        executed: true,
        success: true,
        details: deleteData?.deletedData || null,
      };
    }

    await requestRef.set(
      {
        status,
        reviewedAt: nowIso,
        reviewedBy: session.user.email,
        reviewNote: reviewNote || null,
        deletionExecuted: deletionResult.executed,
        deletionExecutionResult: deletionResult.executed ? deletionResult.details || null : null,
      },
      { merge: true }
    );

    if (userEmail) {
      const userRef = adminDb.collection('users').doc(userEmail);
      await userRef.set(
        {
          deletionRequest: {
            status,
            requestedAt: requestData.requestedAt || null,
            requestedBy: requestData.requestedBy || userEmail,
            reason: requestData.reason || null,
            reviewedAt: nowIso,
            reviewedBy: session.user.email,
            reviewNote: reviewNote || null,
          },
          updatedAt: nowIso,
        },
        { merge: true }
      );

      const notificationRef = adminDb.collection('notifications').doc();
      await notificationRef.set({
        userEmail,
        recipientEmail: userEmail,
        communityId,
        type: 'system',
        priority: 'important',
        title: status === 'approved' ? 'Deletion request approved' : 'Deletion request rejected',
        message:
          status === 'approved'
            ? deletionResult.executed
              ? 'Your account deletion request has been approved and your account deletion has been executed.'
              : 'Your account deletion request has been approved by your community admin.'
            : 'Your account deletion request was reviewed and rejected. Contact your admin for details.',
        read: false,
        actionUrl: '/settings/resident',
        source: 'account_deletion_review',
        createdAt: nowIso,
        metadata: {
          requestId,
          reviewedBy: session.user.email,
          reviewNote: reviewNote || '',
          status,
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: `Deletion request ${status}`,
      requestId,
      deletionResult,
    });
  } catch (error: any) {
    console.error('Failed to review deletion request:', error);
    return NextResponse.json(
      { error: 'Failed to review deletion request', details: error?.message || 'Unknown error' },
      { status: 500 }
    );
  }
}
