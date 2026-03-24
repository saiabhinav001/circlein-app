'use client';

import { useEffect } from 'react';
import { toast } from 'sonner';
import { useSession } from 'next-auth/react';
import { registerPushNotifications, setupForegroundPushListener } from '@/lib/push-notifications';

export default function PushNotificationsManager() {
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status !== 'authenticated' || !session?.user?.email) {
      return;
    }

    let isActive = true;
    let cleanupForegroundListener: (() => void) | null = null;

    const enablePush = async () => {
      const settingsKey = `resident-settings-${session.user.email}`;
      const rawSettings = localStorage.getItem(settingsKey);

      if (!rawSettings) {
        return;
      }

      try {
        const parsed = JSON.parse(rawSettings);
        if (!parsed?.notifications?.pushNotifications) {
          return;
        }
      } catch {
        return;
      }

      const token = await registerPushNotifications();
      if (!isActive) {
        return;
      }

      if (token) {
        cleanupForegroundListener = await setupForegroundPushListener((payload: any) => {
          const title = payload?.notification?.title || 'CircleIn';
          const body = payload?.notification?.body || 'You have a new notification.';
          toast.message(title, { description: body });
        });
      }
    };

    void enablePush();

    return () => {
      isActive = false;
      if (cleanupForegroundListener) {
        cleanupForegroundListener();
      }
    };
  }, [session?.user?.email, status]);

  return null;
}
