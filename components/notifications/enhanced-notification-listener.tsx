'use client';

import { useEffect, useRef, useCallback, createContext, useContext } from 'react';
import { useSession } from 'next-auth/react';
import { useNotifications } from './notification-system';
import { useCommunityTimeZone } from '@/components/providers/community-branding-provider';
import { formatDateInTimeZone } from '@/lib/timezone';

// ============================================================================
// ENHANCED NOTIFICATION LISTENER
// Simplified, enterprise-grade notification triggers
// ============================================================================

// Context for notification triggers
interface NotificationTriggersContextType {
  triggerBookingConfirmation: (amenityName: string, date: Date) => void;
  triggerBookingReminder: (amenityName: string, date: Date) => void;
  triggerBookingCancelled: (amenityName: string, date: Date) => void;
  triggerPaymentReminder: (amount: number, dueDate: Date) => void;
  triggerCommunityEvent: (eventName: string, eventTime: string) => void;
  triggerSystemAlert: (title: string, message: string) => void;
}

const NotificationTriggersContext = createContext<NotificationTriggersContextType | null>(null);

export function useRealNotificationTriggers() {
  const context = useContext(NotificationTriggersContext);
  if (!context) {
    // Return no-op functions when context not available
    return {
      triggerBookingConfirmation: () => {},
      triggerBookingReminder: () => {},
      triggerBookingCancelled: () => {},
      triggerPaymentReminder: () => {},
      triggerCommunityEvent: () => {},
      triggerSystemAlert: () => {},
    };
  }
  return context;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function EnhancedNotificationListener() {
  const { data: session } = useSession();
  const { addNotification } = useNotifications();
  const timeZone = useCommunityTimeZone();
  const mountedRef = useRef(true);
  const welcomeShownRef = useRef(false);

  const formatDate = useCallback((date: Date) => (
    formatDateInTimeZone(date, timeZone, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  ), [timeZone]);

  // Show welcome notification once per session
  const showWelcomeNotification = useCallback(() => {
    if (!mountedRef.current || !session?.user?.name || !session?.user?.email) {
      return;
    }
    
    if (welcomeShownRef.current) {
      return;
    }
    
    const welcomeKey = `welcomeSession_${session.user.email}`;
    const hasShownWelcome = sessionStorage.getItem(welcomeKey);
    
    if (hasShownWelcome) {
      welcomeShownRef.current = true;
      return;
    }
    
    welcomeShownRef.current = true;
    sessionStorage.setItem(welcomeKey, 'true');
    
    setTimeout(() => {
      if (!mountedRef.current) return;
      
      addNotification({
        title: `Welcome back, ${session.user.name?.split(' ')[0]}!`,
        message: 'Your community dashboard is ready.',
        type: 'system',
        priority: 'normal',
        autoHide: true,
        duration: 8000
      });
    }, 1500);
  }, [session?.user?.name, session?.user?.email, addNotification]);

  // Initialize on session
  useEffect(() => {
    if (!session?.user?.email) {
      welcomeShownRef.current = false;
      return;
    }

    mountedRef.current = true;

    const initTimer = setTimeout(() => {
      if (mountedRef.current && session?.user?.name) {
        showWelcomeNotification();
      }
    }, 1200);

    return () => {
      mountedRef.current = false;
      clearTimeout(initTimer);
    };
  }, [session?.user?.email, session?.user?.name, showWelcomeNotification]);

  // Notification trigger functions
  const triggerBookingConfirmation = useCallback((amenityName: string, date: Date) => {
    addNotification({
      title: 'Booking Confirmed',
      message: `Your ${amenityName} booking for ${formatDate(date)} has been confirmed.`,
      type: 'booking',
      priority: 'normal',
      autoHide: false
    });
  }, [addNotification, formatDate]);

  const triggerBookingReminder = useCallback((amenityName: string, date: Date) => {
    addNotification({
      title: 'Booking Reminder',
      message: `Your ${amenityName} booking is scheduled for ${formatDate(date)}.`,
      type: 'booking',
      priority: 'important',
      autoHide: false
    });
  }, [addNotification, formatDate]);

  const triggerBookingCancelled = useCallback((amenityName: string, date: Date) => {
    addNotification({
      title: 'Booking Cancelled',
      message: `Your ${amenityName} booking for ${formatDate(date)} has been cancelled.`,
      type: 'booking',
      priority: 'normal',
      autoHide: false
    });
  }, [addNotification, formatDate]);

  const triggerPaymentReminder = useCallback((amount: number, dueDate: Date) => {
    addNotification({
      title: 'Payment Due',
      message: `Payment of $${amount} is due on ${formatDate(dueDate)}.`,
      type: 'payment',
      priority: 'important',
      autoHide: false
    });
  }, [addNotification, formatDate]);

  const triggerCommunityEvent = useCallback((eventName: string, eventTime: string) => {
    addNotification({
      title: 'Community Event',
      message: `${eventName} at ${eventTime}. Join us!`,
      type: 'community',
      priority: 'normal',
      autoHide: false
    });
  }, [addNotification]);

  const triggerSystemAlert = useCallback((title: string, message: string) => {
    addNotification({
      title,
      message,
      type: 'system',
      priority: 'important',
      autoHide: false
    });
  }, [addNotification]);

  const triggers: NotificationTriggersContextType = {
    triggerBookingConfirmation,
    triggerBookingReminder,
    triggerBookingCancelled,
    triggerPaymentReminder,
    triggerCommunityEvent,
    triggerSystemAlert
  };

  return (
    <NotificationTriggersContext.Provider value={triggers}>
      {null}
    </NotificationTriggersContext.Provider>
  );
}
