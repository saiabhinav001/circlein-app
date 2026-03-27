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

    const cleanup = async () => {
      try {
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(registrations.map((registration) => registration.unregister()));

        if ('caches' in window) {
          const keys = await caches.keys();
          await Promise.all(keys.map((key) => caches.delete(key)));
        }

        if (!cancelled) {
          console.info('Dev mode: cleared stale service workers and caches for reliable HMR.');
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
