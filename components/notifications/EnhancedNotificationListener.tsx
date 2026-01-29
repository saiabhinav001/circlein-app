'use client';

import { useEffect, useRef, useCallback, createContext, useContext } from 'react';
import { useSession } from 'next-auth/react';
import { useNotifications } from './NotificationSystem';

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
  const mountedRef = useRef(true);
  const welcomeShownRef = useRef(false);

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
      message: `Your ${amenityName} booking for ${date.toLocaleDateString()} has been confirmed.`,
      type: 'booking',
      priority: 'normal',
      autoHide: false
    });
  }, [addNotification]);

  const triggerBookingReminder = useCallback((amenityName: string, date: Date) => {
    addNotification({
      title: 'Booking Reminder',
      message: `Your ${amenityName} booking is scheduled for ${date.toLocaleDateString()}.`,
      type: 'booking',
      priority: 'important',
      autoHide: false
    });
  }, [addNotification]);

  const triggerBookingCancelled = useCallback((amenityName: string, date: Date) => {
    addNotification({
      title: 'Booking Cancelled',
      message: `Your ${amenityName} booking for ${date.toLocaleDateString()} has been cancelled.`,
      type: 'booking',
      priority: 'normal',
      autoHide: false
    });
  }, [addNotification]);

  const triggerPaymentReminder = useCallback((amount: number, dueDate: Date) => {
    addNotification({
      title: 'Payment Due',
      message: `Payment of $${amount} is due on ${dueDate.toLocaleDateString()}.`,
      type: 'payment',
      priority: 'important',
      autoHide: false
    });
  }, [addNotification]);

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
