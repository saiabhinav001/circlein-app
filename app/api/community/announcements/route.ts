import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { adminDb } from '@/lib/firebase-admin';
import { sendPushToCommunity } from '@/lib/push-service';
import { emailTemplates, sendBatchEmails } from '@/lib/email-service';

export const dynamic = 'force-dynamic';

function stripMarkdown(text: string): string {
  return text
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\!\[[^\]]*\]\([^\)]*\)/g, ' ')
    .replace(/\[[^\]]+\]\([^\)]*\)/g, '$1')
    .replace(/^\s{0,3}(#{1,6})\s+/gm, '')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/_([^_]+)_/g, '$1')
    .replace(/~~([^~]+)~~/g, '$1')
    .replace(/^\s*[-*+]\s+/gm, '')
    .replace(/^\s*\d+\.\s+/gm, '')
    .replace(/\n+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const role = (session.user as any).role;
    const communityId = (session.user as any).communityId;

    if (role !== 'admin' && role !== 'super_admin') {
      return NextResponse.json({ error: 'Admin privileges required' }, { status: 403 });
    }

    if (!communityId) {
      return NextResponse.json({ error: 'Community ID missing' }, { status: 400 });
    }

    const body = await request.json();
    const title = String(body?.title || '').trim();
    const content = String(body?.body || '').trim();
    const previewText = String(body?.previewText || '').trim();

    if (!title || !content) {
      return NextResponse.json({ error: 'Title and body are required' }, { status: 400 });
    }

    const now = new Date();

    const announcementRef = await adminDb.collection('announcements').add({
      title,
      body: content,
      authorId: session.user.email,
      authorName: session.user.name || session.user.email,
      communityId,
      reactionCounts: {},
      reactionsByUser: {},
      comments: [],
      pinnedAt: null,
      deletedAt: null,
      deletedBy: null,
      updatedAt: now,
      createdAt: now,
    });

    const usersSnapshot = await adminDb
      .collection('users')
      .where('communityId', '==', communityId)
      .get();

    const users = usersSnapshot.docs.map((docSnapshot) => ({
      id: docSnapshot.id,
      ...(docSnapshot.data() as any),
    }));

    const recipients = usersSnapshot.docs
      .map((docSnapshot) => {
        const user = docSnapshot.data() as any;
        return String(user.email || docSnapshot.id || '').trim();
      })
      .filter((email) => email.length > 0);

    for (let i = 0; i < recipients.length; i += 450) {
      const chunk = recipients.slice(i, i + 450);
      const batch = adminDb.batch();

      chunk.forEach((recipientEmail) => {
        const notificationRef = adminDb.collection('notifications').doc();
        batch.set(notificationRef, {
          userEmail: recipientEmail,
          communityId,
          type: 'announcement',
          priority: 'important',
          title: `New announcement: ${title}`,
          message: (previewText || stripMarkdown(content)).slice(0, 180),
          read: false,
          actionUrl: '/community',
          source: 'announcement',
          createdAt: now,
        });
      });

      await batch.commit();
    }

    try {
      const communityName =
        users.find((user: any) => user?.communityName)?.communityName ||
        'your community';

      const preview = (previewText || stripMarkdown(content)).slice(0, 220);
      const emailJobs = users
        .filter((user: any) => {
          const email = String(user.email || user.id || '').trim();
          if (!email || !email.includes('@')) {
            return false;
          }

          const prefs = user.notificationPreferences || user.residentSettings?.notifications || {};
          const wantsEmail = prefs.emailDigest !== false;
          const wantsCommunity = prefs.communityUpdates !== false;
          return wantsEmail && wantsCommunity;
        })
        .map((user: any) => {
          const email = String(user.email || user.id || '').trim();
          const template = emailTemplates.communityAnnouncement({
            userName: user.name || email.split('@')[0] || 'Resident',
            title,
            previewText: preview,
            authorName: session.user.name || session.user.email,
            communityName,
            actionUrl: '/community',
          });

          return {
            to: email,
            subject: template.subject,
            html: template.html,
          };
        });

      if (emailJobs.length > 0) {
        await sendBatchEmails(emailJobs, 'communityAnnouncement');
      }
    } catch (emailError) {
      console.warn('Announcement email send failed:', emailError);
    }

    try {
      await sendPushToCommunity(communityId, {
        title: `New announcement: ${title}`,
        body: (previewText || stripMarkdown(content)).slice(0, 140),
        url: '/community',
        data: {
          type: 'announcement',
          announcementId: announcementRef.id,
        },
      });
    } catch (error) {
      console.warn('Announcement push send failed:', error);
    }

    return NextResponse.json({
      success: true,
      announcementId: announcementRef.id,
    });
  } catch (error: any) {
    console.error('Failed to create announcement:', error);
    return NextResponse.json(
      { error: 'Failed to create announcement', details: error?.message || 'Unknown error' },
      { status: 500 }
    );
  }
}
