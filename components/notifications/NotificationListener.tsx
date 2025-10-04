'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useNotifications } from './NotificationSystem';

// Notification listener component - Firebase-free implementation
export function NotificationListener() {
  const { data: session } = useSession();
  const { addNotification } = useNotifications();
  const processedBookings = useRef(new Set<string>());
  const isInitialLoad = useRef(true);
  const initializationTime = useRef(Date.now());
  const cleanupRef = useRef<(() => void) | null>(null);
  const mountedRef = useRef(true);

  // Simplified notification system without Firebase real-time listeners
  // This prevents the Firestore internal assertion failures
  const showWelcomeNotification = useCallback(() => {
    if (!mountedRef.current || !session?.user?.name) return;
    
    try {
      setTimeout(() => {
        if (!mountedRef.current) return;
        
        addNotification({
          title: `👋 Welcome back, ${session.user.name?.split(' ')[0]}!`,
          message: 'Ready to explore amazing community amenities?',
          type: 'info',
          priority: 'low',
          category: 'system',
          autoHide: true,
          duration: 6000
        });
      }, 2000);
    } catch (error) {
      console.error('❌ Error showing welcome notification:', error);
    }
  }, [session?.user?.name, addNotification]);

  const showSystemNotifications = useCallback(() => {
    if (!mountedRef.current) return;

    try {
      // Show periodic system notifications instead of real-time Firebase ones
      const interval = setInterval(() => {
        if (!mountedRef.current) return;

        const now = new Date();
        const hour = now.getHours();
        const minute = now.getMinutes();
        
        // Peak hours reminder (only once per session)
        if (hour === 17 && minute === 0) {
          addNotification({
            title: '🏃‍♂️ Peak Hours Alert',
            message: 'It\'s peak time! Book your amenities early to avoid disappointment.',
            type: 'info',
            priority: 'low',
            category: 'system',
            autoHide: true,
            duration: 10000
          });
        }
        
        // Evening reminder
        if (hour === 20 && minute === 0) {
          addNotification({
            title: '� Good Evening!',
            message: 'Don\'t forget to check your upcoming bookings for tomorrow.',
            type: 'info',
            priority: 'low',
            category: 'system',
            autoHide: true,
            duration: 8000
          });
        }
      }, 60000); // Check every minute

      return () => {
        clearInterval(interval);
      };
    } catch (error) {
      console.error('❌ Error setting up system notifications:', error);
      return () => {};
    }
  }, [addNotification]);

  useEffect(() => {
    if (!session?.user?.email || !session?.user?.communityId) return;

    console.log('🔔 Setting up notification system (Firebase-free mode)...');
    mountedRef.current = true;

    try {
      // Show welcome notification
      showWelcomeNotification();

      // Set up system notifications
      const cleanupSystemNotifications = showSystemNotifications();
      
      // Store cleanup function
      cleanupRef.current = () => {
        try {
          if (cleanupSystemNotifications) {
            cleanupSystemNotifications();
          }
          processedBookings.current.clear();
        } catch (error) {
          console.error('❌ Error during cleanup:', error);
        }
      };

      // Mark as no longer initial load
      setTimeout(() => {
        isInitialLoad.current = false;
      }, 3000);

    } catch (error) {
      console.error('❌ Error setting up notification system:', error);
    }

    // Cleanup function
    return () => {
      try {
        mountedRef.current = false;
        if (cleanupRef.current) {
          cleanupRef.current();
          cleanupRef.current = null;
        }
      } catch (error) {
        console.error('❌ Error during component cleanup:', error);
      }
    };
  }, [session, showWelcomeNotification, showSystemNotifications]);

  return null; // This component doesn't render anything
}

// Hook to trigger notifications manually (without Firebase dependencies)
export function useRealNotificationTriggers() {
  const { addNotification } = useNotifications();

  const triggerBookingConfirmation = useCallback((amenityName: string, date: Date, bookingId: string) => {
    addNotification({
      title: '🎉 Booking Confirmed!',
      message: `Your ${amenityName} booking for ${date.toLocaleDateString()} has been confirmed.`,
      type: 'success',
      priority: 'high',
      category: 'booking',
      actionUrl: '/bookings',
      actionLabel: 'View Booking',
      autoHide: true,
      duration: 8000,
      metadata: {
        amenityName,
        bookingId
      }
    });
  }, [addNotification]);

  const triggerBookingReminder = useCallback((amenityName: string, date: Date, bookingId: string) => {
    addNotification({
      title: '⏰ Booking Reminder',
      message: `Your ${amenityName} booking is scheduled for ${date.toLocaleDateString()} at ${date.toLocaleTimeString()}.`,
      type: 'info',
      priority: 'medium',
      category: 'booking',
      actionUrl: '/bookings',
      actionLabel: 'View Details',
      autoHide: false,
      metadata: {
        amenityName,
        bookingId
      }
    });
  }, [addNotification]);

  const triggerPaymentReminder = useCallback((amount: string, dueDate: string) => {
    addNotification({
      title: '💳 Payment Due',
      message: `Your payment of ${amount} is due on ${dueDate}.`,
      type: 'warning',
      priority: 'high',
      category: 'payment',
      actionUrl: '/payments',
      actionLabel: 'Pay Now',
      autoHide: false,
      metadata: {
        amount,
        dueDate
      }
    });
  }, [addNotification]);

  const triggerMaintenanceAlert = useCallback((facility: string, startTime: string, endTime: string) => {
    addNotification({
      title: '� Maintenance Alert',
      message: `${facility} will be closed for maintenance from ${startTime} to ${endTime}.`,
      type: 'warning',
      priority: 'medium',
      category: 'maintenance',
      autoHide: false,
      metadata: {
        amenityName: facility
      }
    });
  }, [addNotification]);

  const triggerCommunityEvent = useCallback((eventName: string, date: string, location: string) => {
    addNotification({
      title: '🎊 Community Event',
      message: `${eventName} is happening on ${date} at ${location}. Join us!`,
      type: 'community',
      priority: 'medium',
      category: 'community',
      actionUrl: '/events',
      actionLabel: 'Learn More',
      autoHide: false
    });
  }, [addNotification]);

  const triggerTestNotification = useCallback(() => {
    const testTypes = ['success', 'info', 'warning', 'booking', 'community'] as const;
    const randomType = testTypes[Math.floor(Math.random() * testTypes.length)];
    
    addNotification({
      title: `🧪 Test Notification - ${randomType.toUpperCase()}`,
      message: 'This is a test notification to preview your settings and animations.',
      type: randomType,
      priority: 'medium',
      category: 'system',
      autoHide: true,
      duration: 5000
    });
  }, [addNotification]);

  const triggerBookingCreated = useCallback((amenityName: string, date: Date) => {
    addNotification({
      title: '✅ Booking Created Successfully',
      message: `Your ${amenityName} booking for ${date.toLocaleDateString()} has been created.`,
      type: 'success',
      priority: 'high',
      category: 'booking',
      actionUrl: '/bookings',
      actionLabel: 'View My Bookings',
      autoHide: true,
      duration: 6000,
      metadata: {
        amenityName
      }
    });
  }, [addNotification]);

  const triggerBookingCancelled = useCallback((amenityName: string, date: Date) => {
    addNotification({
      title: '❌ Booking Cancelled',
      message: `Your ${amenityName} booking for ${date.toLocaleDateString()} has been cancelled.`,
      type: 'warning',
      priority: 'high',
      category: 'booking',
      actionUrl: '/bookings',
      actionLabel: 'View Details',
      autoHide: false,
      metadata: {
        amenityName
      }
    });
  }, [addNotification]);

  return {
    triggerBookingConfirmation,
    triggerBookingReminder,
    triggerPaymentReminder,
    triggerMaintenanceAlert,
    triggerCommunityEvent,
    triggerTestNotification,
    triggerBookingCreated,
    triggerBookingCancelled
  };
}