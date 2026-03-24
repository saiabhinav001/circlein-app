import { getMessaging } from 'firebase-admin/messaging';
import '@/lib/firebase-admin';
import { adminDb } from '@/lib/firebase-admin';

interface PushPayload {
  title: string;
  body: string;
  url?: string;
  data?: Record<string, string>;
}

async function collectCommunityTokens(communityId: string): Promise<string[]> {
  const snapshot = await adminDb.collection('users').where('communityId', '==', communityId).get();
  const tokens = snapshot.docs.flatMap((docSnapshot) => {
    const value = docSnapshot.data()?.pushTokens;
    if (!Array.isArray(value)) {
      return [];
    }
    return value.filter((token: unknown) => typeof token === 'string' && token.length > 0) as string[];
  });

  return Array.from(new Set(tokens));
}

export async function sendPushToCommunity(communityId: string, payload: PushPayload): Promise<void> {
  try {
    const tokens = await collectCommunityTokens(communityId);
    if (!tokens.length) {
      return;
    }

    await getMessaging().sendEachForMulticast({
      tokens,
      notification: {
        title: payload.title,
        body: payload.body,
      },
      data: {
        url: payload.url || '/notifications',
        ...payload.data,
      },
      webpush: {
        fcmOptions: {
          link: payload.url || '/notifications',
        },
      },
    });
  } catch (error) {
    console.warn('Push notification send (community) failed:', error);
  }
}

export async function sendPushToUserByEmail(userEmail: string, payload: PushPayload): Promise<void> {
  try {
    const userDoc = await adminDb.collection('users').doc(userEmail).get();
    const tokens = (userDoc.data()?.pushTokens || []).filter((token: unknown) => typeof token === 'string') as string[];

    if (!tokens.length) {
      return;
    }

    await getMessaging().sendEachForMulticast({
      tokens,
      notification: {
        title: payload.title,
        body: payload.body,
      },
      data: {
        url: payload.url || '/notifications',
        ...payload.data,
      },
      webpush: {
        fcmOptions: {
          link: payload.url || '/notifications',
        },
      },
    });
  } catch (error) {
    console.warn('Push notification send (user) failed:', error);
  }
}
