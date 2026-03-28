'use client';

import { useEffect, useRef, useState } from 'react';
import { CheckCircle2, RefreshCw, WifiOff } from 'lucide-react';
import { toast } from 'sonner';
import { flushOfflineBookings, getOfflineQueueSize } from '@/lib/offline-booking-queue';

export default function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(true);
  const [syncState, setSyncState] = useState<'idle' | 'syncing' | 'synced'>('idle');
  const [queuedCount, setQueuedCount] = useState(0);
  const resetTimerRef = useRef<number | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const handleOffline = () => {
      setIsOnline(false);
      setSyncState('idle');
      setQueuedCount(getOfflineQueueSize());
    };

    const handleOnline = async () => {
      setIsOnline(true);

      const pending = getOfflineQueueSize();
      if (!pending) {
        setSyncState('idle');
        setQueuedCount(0);
        return;
      }

      setQueuedCount(pending);
      setSyncState('syncing');

      try {
        const synced = await flushOfflineBookings();
        const remaining = getOfflineQueueSize();
        setQueuedCount(remaining);

        if (synced > 0) {
          toast.success(`Synced ${synced} queued booking${synced > 1 ? 's' : ''}.`);
        }

        setSyncState('synced');

        if (resetTimerRef.current) {
          window.clearTimeout(resetTimerRef.current);
        }

        resetTimerRef.current = window.setTimeout(() => {
          setSyncState('idle');
          setQueuedCount(getOfflineQueueSize());
        }, 3000);
      } catch {
        setSyncState('idle');
        toast.error('Failed to sync offline bookings.');
      }
    };

    const handleOnlineEvent = () => {
      void handleOnline();
    };

    setIsOnline(window.navigator.onLine);
    setQueuedCount(getOfflineQueueSize());

    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnlineEvent);

    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnlineEvent);

      if (resetTimerRef.current) {
        window.clearTimeout(resetTimerRef.current);
      }
    };
  }, []);

  if (!isOnline) {
    return (
      <div className="hidden md:flex items-center gap-1.5 rounded-md border border-amber-300 bg-amber-50 px-2 py-1 text-xs text-amber-800 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-200">
        <WifiOff className="h-3.5 w-3.5" />
        <span>You're offline - bookings will sync when reconnected</span>
      </div>
    );
  }

  if (syncState === 'syncing') {
    return (
      <div className="hidden md:flex items-center gap-1.5 rounded-md border border-blue-300 bg-blue-50 px-2 py-1 text-xs text-blue-700 dark:border-blue-800 dark:bg-blue-950/30 dark:text-blue-200">
        <RefreshCw className="h-3.5 w-3.5 animate-spin" />
        <span>Syncing {queuedCount} queued booking{queuedCount === 1 ? '' : 's'}...</span>
      </div>
    );
  }

  if (syncState === 'synced') {
    return (
      <div className="hidden md:flex items-center gap-1.5 rounded-md border border-emerald-300 bg-emerald-50 px-2 py-1 text-xs text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-200">
        <CheckCircle2 className="h-3.5 w-3.5" />
        <span>Synced!</span>
      </div>
    );
  }

  return null;
}
