'use client';

import { useEffect } from 'react';

export default function DevServiceWorkerCleanup() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') {
      return;
    }

    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      return;
    }

    let cancelled = false;
    const SERWIST_SW_PATH = '/sw.js';

    const cleanup = async () => {
      try {
        const registrations = await navigator.serviceWorker.getRegistrations();
        const serwistRegistrations = registrations.filter((registration) => {
          const scriptUrls = [
            registration.active?.scriptURL,
            registration.waiting?.scriptURL,
            registration.installing?.scriptURL,
          ].filter(Boolean) as string[];

          return scriptUrls.some((url) => url.includes(SERWIST_SW_PATH));
        });

        await Promise.all(serwistRegistrations.map((registration) => registration.unregister()));

        if ('caches' in window) {
          const keys = await caches.keys();
          const pwaCacheKeys = keys.filter(
            (key) =>
              key.includes('serwist') ||
              key.includes('workbox') ||
              key.includes('precache') ||
              key.includes('runtime')
          );
          await Promise.all(pwaCacheKeys.map((key) => caches.delete(key)));
        }

        if (!cancelled) {
          console.info('Dev mode: cleared Serwist service worker and related PWA caches for reliable HMR.');
        }
      } catch (error) {
        console.warn('Dev mode cleanup failed:', error);
      }
    };

    void cleanup();

    return () => {
      cancelled = true;
    };
  }, []);

  return null;
}
