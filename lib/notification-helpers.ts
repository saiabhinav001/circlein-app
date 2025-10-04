// Notification Helper Functions
// Import these functions in your booking/admin components to trigger real-time notifications

// Type definitions for notification events
export interface NotificationEvent {
  type: 'booking_created' | 'booking_cancelled' | 'amenity_blocked' | 'admin_cancellation' | 'festive_booking' | 'payment_due' | 'maintenance_alert' | 'community_event';
  data: any;
  userId?: string; // If notification is for specific user
  broadcastToAll?: boolean; // If notification should go to all users
}

// Helper function to trigger notifications
// In a real app, this would send notifications via your backend/WebSocket/Firebase
export const triggerRealTimeNotification = async (event: NotificationEvent) => {
  console.log('🔔 Real-time notification triggered:', event);
  
  // In production, you would:
  // 1. Send to your backend API
  // 2. Backend broadcasts via WebSocket/Firebase to relevant users
  // 3. Users receive real-time notifications
  
  // For now, we'll just log it
  // You can integrate this with your actual notification system
};

// Specific helper functions for common events

export const notifyBookingCreated = async (
  userId: string,
  amenityName: string,
  date: Date,
  timeSlot: string,
  isFestiveSeason = false
) => {
  // Notify the user who made the booking
  await triggerRealTimeNotification({
    type: 'booking_created',
    data: { amenityName, date, timeSlot },
    userId
  });

  // If it's festive season, notify all users about high demand
  if (isFestiveSeason) {
    await triggerRealTimeNotification({
      type: 'festive_booking',
      data: { userName: 'A resident', amenityName, date },
      broadcastToAll: true
    });
  }
};

export const notifyBookingCancelled = async (
  userId: string,
  amenityName: string,
  date: Date,
  reason: string,
  isAdminCancellation = false
) => {
  await triggerRealTimeNotification({
    type: isAdminCancellation ? 'admin_cancellation' : 'booking_cancelled',
    data: { amenityName, date, reason },
    userId
  });
};

export const notifyAmenityBlocked = async (
  amenityName: string,
  reason: string,
  duration: string
) => {
  // Notify all users when an amenity is blocked
  await triggerRealTimeNotification({
    type: 'amenity_blocked',
    data: { amenityName, reason, duration },
    broadcastToAll: true
  });
};

export const notifyDateSpecificBlock = async (
  amenityName: string,
  blockedDates: Date[],
  reason: string
) => {
  const dateRange = blockedDates.length === 1 
    ? blockedDates[0].toLocaleDateString()
    : `${blockedDates[0].toLocaleDateString()} - ${blockedDates[blockedDates.length - 1].toLocaleDateString()}`;
    
  await triggerRealTimeNotification({
    type: 'amenity_blocked',
    data: { 
      amenityName, 
      reason: `Date-specific block: ${reason}`,
      duration: `${blockedDates.length} date(s): ${dateRange}`
    },
    broadcastToAll: true
  });
};

export const notifyPaymentDue = async (
  userId: string,
  amount: number,
  dueDate: Date
) => {
  await triggerRealTimeNotification({
    type: 'payment_due',
    data: { amount, dueDate },
    userId
  });
};

export const notifyMaintenanceAlert = async (
  area: string,
  duration: string,
  affectedUsers?: string[]
) => {
  await triggerRealTimeNotification({
    type: 'maintenance_alert',
    data: { area, duration },
    broadcastToAll: !affectedUsers,
    userId: affectedUsers ? affectedUsers[0] : undefined // For now, just first user
  });
};

export const notifyCommunityEvent = async (
  eventName: string,
  eventTime: string,
  location: string
) => {
  // Notify all users about community events
  await triggerRealTimeNotification({
    type: 'community_event',
    data: { eventName, eventTime, location },
    broadcastToAll: true
  });
};

// Helper function to reset welcome notifications (for testing)
export const resetWelcomeNotifications = () => {
  // Clear all welcome-related session storage
  const keysToRemove = [];
  for (let i = 0; i < sessionStorage.length; i++) {
    const key = sessionStorage.key(i);
    if (key && key.includes('welcomeSession_')) {
      keysToRemove.push(key);
    }
  }
  keysToRemove.forEach(key => sessionStorage.removeItem(key));
  console.log('🔄 Welcome notifications reset - you will see welcome message on next page refresh');
};

// Example usage in your components:
/*

// In your booking component:
import { notifyBookingCreated, notifyAmenityBlocked } from '@/lib/notification-helpers';

const handleBookingSubmit = async (bookingData) => {
  // ... your booking logic ...
  
  // Trigger real-time notification
  await notifyBookingCreated(
    userId,
    bookingData.amenityName,
    bookingData.date,
    bookingData.timeSlot,
    isCurrentlyFestiveSeason()
  );
};

// In your admin component:
const handleAmenityBlock = async (amenityId, reason, duration) => {
  // ... your admin logic ...
  
  // Notify all users
  await notifyAmenityBlocked(amenityName, reason, duration);
};

*/