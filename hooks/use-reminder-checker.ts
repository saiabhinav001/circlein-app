'use client';

import { useEffect, useRef } from 'react';

/**
 * Hook to periodically check for booking reminders
 * Runs every 15 minutes when user is active on the app
 */
export function useReminderChecker() {
  const lastCheckRef = useRef<number>(0);

  useEffect(() => {
    const checkReminders = async () => {
      const now = Date.now();
      const fifteenMinutes = 15 * 60 * 1000;

      // Only check if it's been at least 15 minutes since last check
      if (now - lastCheckRef.current < fifteenMinutes) {
        return;
      }

      try {
        lastCheckRef.current = now;
        
        const response = await fetch('/api/check-reminders', {
          method: 'POST',
        });

        if (response.ok) {
          const data = await response.json();
          if (data.remindersSent > 0) {
            console.log(`✅ Sent ${data.remindersSent} reminder(s)`);
          }
        }
      } catch (error) {
        console.error('Failed to check reminders:', error);
      }
    };

    // Check on mount
    checkReminders();

    // Check every 15 minutes
    const interval = setInterval(checkReminders, 15 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);
}
