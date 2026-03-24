'use client';

import { getApp, getApps, initializeApp } from 'firebase/app';
import { getMessaging, getToken, isSupported, onMessage } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const VAPID_KEY = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
const FOREGROUND_DEDUPE_WINDOW_MS = 15000;

let foregroundUnsubscribe: (() => void) | null = null;
let foregroundListenerInitialized = false;
let lastForegroundMessageKey = '';
let lastForegroundMessageAt = 0;

function getClientApp() {
  return getApps().length ? getApp() : initializeApp(firebaseConfig);
}

export async function registerPushNotifications(): Promise<string | null> {
  if (typeof window === 'undefined') {
    return null;
  }

  const supported = await isSupported().catch(() => false);
  if (!supported) {
    return null;
  }

  if (!VAPID_KEY) {
    console.warn('NEXT_PUBLIC_FIREBASE_VAPID_KEY is not set; push token registration skipped.');
    return null;
  }

  const existingPermission = Notification.permission;
  const permission = existingPermission === 'default'
    ? await Notification.requestPermission()
    : existingPermission;
  if (permission !== 'granted') {
    return null;
  }

  const existingRegistration = await navigator.serviceWorker.getRegistration('/firebase-messaging-sw.js');
  const swRegistration = existingRegistration || await navigator.serviceWorker.register('/firebase-messaging-sw.js');
  const app = getClientApp();
  const messaging = getMessaging(app);

  const token = await getToken(messaging, {
    vapidKey: VAPID_KEY,
    serviceWorkerRegistration: swRegistration,
  });

  if (!token) {
    return null;
  }

  await fetch('/api/notifications/push-token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token }),
  });

  return token;
}

export async function setupForegroundPushListener(onReceive?: (payload: unknown) => void): Promise<() => void> {
  if (typeof window === 'undefined') {
    return () => {};
  }

  const supported = await isSupported().catch(() => false);
  if (!supported) {
    return () => {};
  }

  if (foregroundListenerInitialized) {
    return () => {
      if (foregroundUnsubscribe) {
        foregroundUnsubscribe();
        foregroundUnsubscribe = null;
      }
      foregroundListenerInitialized = false;
      lastForegroundMessageKey = '';
      lastForegroundMessageAt = 0;
    };
  }

  const app = getClientApp();
  const messaging = getMessaging(app);

  foregroundUnsubscribe = onMessage(messaging, (payload) => {
    const title = payload?.notification?.title || '';
    const body = payload?.notification?.body || '';
    const messageId = (payload as any)?.messageId || (payload as any)?.data?.messageId || '';
    const key = [messageId, title, body].join('::');
    const now = Date.now();

    if (key && key === lastForegroundMessageKey && now - lastForegroundMessageAt < FOREGROUND_DEDUPE_WINDOW_MS) {
      return;
    }

    lastForegroundMessageKey = key;
    lastForegroundMessageAt = now;

    if (onReceive) {
      onReceive(payload);
    }
  });

  foregroundListenerInitialized = true;

  return () => {
    if (foregroundUnsubscribe) {
      foregroundUnsubscribe();
      foregroundUnsubscribe = null;
    }
    foregroundListenerInitialized = false;
    lastForegroundMessageKey = '';
    lastForegroundMessageAt = 0;
  };
}
