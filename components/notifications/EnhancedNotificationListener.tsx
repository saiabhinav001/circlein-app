'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useNotifications } from './NotificationSystem';

// Enhanced Notification listener component - Real-time only
export function EnhancedNotificationListener() {
  const { data: session } = useSession();
  const { addNotification } = useNotifications();
  const mountedRef = useRef(true);
  const welcomeShownRef = useRef(false); // Track if welcome was shown in current session

  // Show welcome notification once per session with bulletproof logic
  const showWelcomeNotification = useCallback(() => {
    if (!mountedRef.current || !session?.user?.name || !session?.user?.email) {
      console.log('🔔 Cannot show welcome notification - missing requirements', {
        mounted: mountedRef.current,
        userName: !!session?.user?.name,
        userEmail: !!session?.user?.email
      });
      return;
    }
    
    // Check if already shown in current session using ref (primary protection)
    if (welcomeShownRef.current) {
      console.log('🔔 Welcome notification already shown in this session (ref), skipping...');
      return;
    }
    
    // Double-check with session storage as backup protection
    const welcomeKey = `welcomeSession_${session.user.email}`;
    const hasShownWelcome = sessionStorage.getItem(welcomeKey);
    
    if (hasShownWelcome) {
      console.log('🔔 Welcome notification already shown (session storage), marking ref and skipping...');
      welcomeShownRef.current = true;
      return;
    }
    
    try {
      console.log('🔔 Showing welcome notification for:', session.user.name);
      
      // Mark as shown immediately to prevent duplicates (triple protection)
      welcomeShownRef.current = true;
      sessionStorage.setItem(welcomeKey, 'true');
      sessionStorage.setItem(`welcomeTime_${session.user.email}`, Date.now().toString());
      
      // Enhanced welcome notification on login with better timing
      const displayTimer = setTimeout(() => {
        if (!mountedRef.current) {
          console.log('🔔 Component unmounted during display timeout, skipping notification');
          return;
        }
        
        console.log('🔔 Adding welcome notification to system');
        addNotification({
          title: `🏠 Welcome back, ${session.user.name?.split(' ')[0]}!`,
          message: `Great to see you again! Your community dashboard is ready with all the latest updates. You'll receive real-time notifications for bookings, community events, and important announcements.`,
          type: 'info',
          priority: 'medium',
          category: 'system',
          autoHide: true,
          duration: 10000,
          actionLabel: 'Explore Dashboard',
          onAction: () => {
            window.location.href = '/dashboard';
          }
        });
        
        console.log('🔔 Welcome notification added successfully');
      }, 1500);

      // Store timer reference for cleanup
      return () => clearTimeout(displayTimer);

    } catch (error) {
      console.error('❌ Error showing welcome notification:', error);
      // Reset flags on error to allow retry
      welcomeShownRef.current = false;
      sessionStorage.removeItem(welcomeKey);
    }
  }, [session?.user?.name, session?.user?.email, addNotification]);

  // Enhanced signin detection with better timing
  useEffect(() => {
    if (!session?.user?.email) {
      console.log('🔔 No session found, waiting for user to sign in...');
      // Reset welcome shown flag when no session
      welcomeShownRef.current = false;
      return;
    }

    console.log('🔔 User session detected, initializing notification system...', session.user.email);
    mountedRef.current = true;

    // Enhanced signin detection - wait for session to be fully loaded
    const initTimer = setTimeout(() => {
      if (mountedRef.current && session?.user?.name) {
        console.log('🔔 Session fully loaded, showing welcome notification...');
        showWelcomeNotification();
      }
    }, 1200); // Increased delay for better reliability

    // Cleanup function
    return () => {
      mountedRef.current = false;
      clearTimeout(initTimer);
      console.log('🔔 Notification system cleaned up');
    };
  }, [session?.user?.email, session?.user?.name, showWelcomeNotification]);

  // Additional signin detection based on session status changes
  useEffect(() => {
    if (!session) return;
    
    // Detect fresh signin by checking if this is a new session
    const sessionChangeTimer = setTimeout(() => {
      if (session?.user?.email && session?.user?.name && mountedRef.current) {
        // Only show if we haven't shown welcome for this session yet
        if (!welcomeShownRef.current) {
          const welcomeKey = `welcomeSession_${session.user.email}`;
          const hasShownWelcome = sessionStorage.getItem(welcomeKey);
          
          if (!hasShownWelcome) {
            console.log('🔔 Fresh signin detected, ensuring welcome notification...');
            showWelcomeNotification();
          }
        }
      }
    }, 800);

    return () => clearTimeout(sessionChangeTimer);
  }, [session, showWelcomeNotification]);

  // Reset welcome flag when user changes and add session status change detection
  useEffect(() => {
    if (!session) {
      // User signed out - reset everything
      console.log('🔔 User session ended, resetting welcome flag');
      welcomeShownRef.current = false;
      return;
    }

    if (session?.user?.email) {
      console.log('🔔 Session change detected for user:', session.user.email);
      // This is a fresh session change, reset the flag to allow welcome notification
      welcomeShownRef.current = false;
    }
  }, [session?.user?.email]);

  // Additional effect to detect fresh browser sessions
  useEffect(() => {
    if (!session?.user?.email) return;

    const sessionKey = `sessionActive_${session.user.email}`;
    const wasSessionActive = sessionStorage.getItem(sessionKey);

    if (!wasSessionActive) {
      // This is a genuinely fresh session/tab
      console.log('🔔 Fresh browser session detected, clearing any previous welcome flags');
      welcomeShownRef.current = false;
      
      // Clear any stale welcome session data
      const welcomeKey = `welcomeSession_${session.user.email}`;
      sessionStorage.removeItem(welcomeKey);
      
      // Mark this session as active
      sessionStorage.setItem(sessionKey, 'true');
    }

    // Cleanup when session ends
    return () => {
      sessionStorage.removeItem(sessionKey);
    };
  }, [session?.user?.email]);

  return null; // This component doesn't render anything
}

// Hook to trigger real notifications based on actual events
export function useRealNotificationTriggers() {
  const { addNotification } = useNotifications();

  // Real booking confirmation notification
  const triggerBookingConfirmation = useCallback((amenityName: string, date: Date, bookingId: string) => {
    addNotification({
      title: '🎉 Booking Confirmed!',
      message: `Your ${amenityName} booking for ${date.toLocaleDateString()} has been confirmed.`,
      type: 'success',
      priority: 'high',
      category: 'booking',
      autoHide: true,
      duration: 10000,
      actionLabel: 'View Details',
      onAction: () => {
        window.location.href = `/bookings/${bookingId}`;
      }
    });
  }, [addNotification]);

  // Real booking reminder notification
  const triggerBookingReminder = useCallback((amenityName: string, date: Date) => {
    addNotification({
      title: '⏰ Booking Reminder',
      message: `Don't forget! Your ${amenityName} booking is scheduled for ${date.toLocaleDateString()}.`,
      type: 'info',
      priority: 'medium',
      category: 'booking',
      autoHide: true,
      duration: 12000,
      actionLabel: 'View Booking',
      onAction: () => {
        window.location.href = '/bookings';
      }
    });
  }, [addNotification]);

  // Real booking creation notification
  const triggerBookingCreated = useCallback((amenityName: string, date: Date, timeSlot: string) => {
    addNotification({
      title: '✅ Booking Created',
      message: `Your ${amenityName} booking for ${date.toLocaleDateString()} at ${timeSlot} has been created successfully.`,
      type: 'success',
      priority: 'high',
      category: 'booking',
      autoHide: true,
      duration: 10000,
      actionLabel: 'View Details',
      onAction: () => {
        window.location.href = '/bookings';
      }
    });
  }, [addNotification]);

  // Real booking cancellation notification
  const triggerBookingCancelled = useCallback((amenityName: string, date: Date, refundAmount?: number) => {
    addNotification({
      title: '❌ Booking Cancelled',
      message: `Your ${amenityName} booking for ${date.toLocaleDateString()} has been cancelled${refundAmount ? `. Refund of $${refundAmount} will be processed.` : '.'}`,
      type: 'warning',
      priority: 'medium',
      category: 'booking',
      autoHide: true,
      duration: 12000,
      actionLabel: 'View Bookings',
      onAction: () => {
        window.location.href = '/bookings';
      }
    });
  }, [addNotification]);

  // Real payment reminder notification
  const triggerPaymentReminder = useCallback((amount: number, dueDate: Date) => {
    addNotification({
      title: '💰 Payment Due Soon',
      message: `Payment of $${amount} is due on ${dueDate.toLocaleDateString()}. Don't miss the deadline!`,
      type: 'warning',
      priority: 'high',
      category: 'payment',
      autoHide: true,
      duration: 15000,
      actionLabel: 'Pay Now',
      onAction: () => {
        window.location.href = '/payments';
      }
    });
  }, [addNotification]);

  // Real maintenance alert notification
  const triggerMaintenanceAlert = useCallback((area: string, duration: string) => {
    addNotification({
      title: '🔧 Maintenance Alert',
      message: `${area} will be under maintenance for ${duration}. Plan accordingly.`,
      type: 'warning',
      priority: 'high',
      category: 'maintenance',
      autoHide: true,
      duration: 12000
    });
  }, [addNotification]);

  // Real community event notification
  const triggerCommunityEvent = useCallback((eventName: string, eventTime: string, location: string) => {
    addNotification({
      title: '🎉 Community Event',
      message: `${eventName} at ${eventTime} in ${location}. Join us for fun!`,
      type: 'info',
      priority: 'medium',
      category: 'community',
      autoHide: true,
      duration: 15000,
      actionLabel: 'RSVP',
      onAction: () => {
        window.location.href = '/events';
      }
    });
  }, [addNotification]);

  // Test notification for demo purposes
  const triggerTestNotification = useCallback(() => {
    const testNotifications = [
      {
        title: '🎉 Test Success!',
        message: 'This is a test notification to verify your settings are working correctly.',
        type: 'success' as const,
        priority: 'medium' as const,
        category: 'system' as const
      },
      {
        title: '⚠️ Test Warning',
        message: 'This is a test warning notification to check alert functionality.',
        type: 'warning' as const,
        priority: 'high' as const,
        category: 'system' as const
      },
      {
        title: '📢 Test Info',
        message: 'This is a test information notification for general updates.',
        type: 'info' as const,
        priority: 'low' as const,
        category: 'system' as const
      }
    ];

    const randomNotification = testNotifications[Math.floor(Math.random() * testNotifications.length)];
    addNotification({
      ...randomNotification,
      autoHide: true,
      duration: 8000
    });
  }, [addNotification]);

  // Functions to trigger real-time notifications for specific events:
  
  // When admin blocks an amenity -> notify all users
  const triggerAmenityBlocked = useCallback((amenityName: string, reason: string, duration: string) => {
    addNotification({
      title: '🚫 Amenity Temporarily Blocked',
      message: `${amenityName} is temporarily unavailable due to ${reason}. Expected to reopen ${duration}.`,
      type: 'warning',
      priority: 'high',
      category: 'maintenance',
      autoHide: true,
      duration: 15000
    });
  }, [addNotification]);

  // When admin cancels a specific user's booking -> notify that user
  const triggerAdminBookingCancellation = useCallback((amenityName: string, date: Date, reason: string) => {
    addNotification({
      title: '❌ Booking Cancelled by Admin',
      message: `Your ${amenityName} booking for ${date.toLocaleDateString()} has been cancelled by management. Reason: ${reason}`,
      type: 'error',
      priority: 'urgent',
      category: 'booking',
      autoHide: false, // Don't auto-hide important admin actions
      actionLabel: 'Contact Support',
      onAction: () => {
        window.location.href = '/support';
      }
    });
  }, [addNotification]);

  // When someone makes a booking during festive season -> notify all users
  const triggerFestiveBookingAlert = useCallback((userName: string, amenityName: string, date: Date) => {
    addNotification({
      title: '🎊 Festive Season Booking',
      message: `${userName} just booked ${amenityName} for ${date.toLocaleDateString()}. High demand during festive season - book early!`,
      type: 'info',
      priority: 'medium',
      category: 'community',
      autoHide: true,
      duration: 10000,
      actionLabel: 'Book Now',
      onAction: () => {
        window.location.href = '/calendar';
      }
    });
  }, [addNotification]);

  return {
    // Test functions
    triggerTestNotification,
    
    // Real booking events
    triggerBookingConfirmation,
    triggerBookingReminder,
    triggerBookingCreated,
    triggerBookingCancelled,
    
    // Real admin events
    triggerPaymentReminder,
    triggerMaintenanceAlert,
    triggerCommunityEvent,
    
    // Real-time specific events
    triggerAmenityBlocked,
    triggerAdminBookingCancellation,
    triggerFestiveBookingAlert
  };
}