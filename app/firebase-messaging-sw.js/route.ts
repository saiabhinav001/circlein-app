import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function GET() {
  const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  };

  const body = `
importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-messaging-compat.js');

firebase.initializeApp(${JSON.stringify(firebaseConfig)});

const messaging = firebase.messaging();
let lastNotificationKey = '';
let lastNotificationAt = 0;
const DEDUPE_WINDOW_MS = 15000;

messaging.onBackgroundMessage((payload) => {
  const title = payload?.notification?.title || 'CircleIn';
  const body = payload?.notification?.body || 'You have a new update.';
  const messageId = payload?.messageId || payload?.data?.messageId || '';
  const key = [messageId, title, body].join('::');
  const now = Date.now();

  if (key && key === lastNotificationKey && now - lastNotificationAt < DEDUPE_WINDOW_MS) {
    return;
  }

  lastNotificationKey = key;
  lastNotificationAt = now;

  const options = {
    body,
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    data: payload?.data || {},
    tag: messageId || undefined,
  };

  self.registration.showNotification(title, options);
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = event.notification?.data?.url || '/notifications';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(targetUrl);
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
      return undefined;
    })
  );
});
`;

  return new NextResponse(body, {
    headers: {
      'Content-Type': 'application/javascript; charset=utf-8',
      'Cache-Control': 'no-store, max-age=0',
    },
  });
}
