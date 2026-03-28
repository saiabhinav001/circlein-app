'use client';

import { useSession } from 'next-auth/react';
import { useNotifications } from '@/components/notifications/notification-system';
import { useCommunityTimeZone } from '@/components/providers/community-branding-provider';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { formatDateInTimeZone } from '@/lib/timezone';

// ============================================================================
// COMMUNITY NOTIFICATIONS HOOK
// Simplified to match new notification type system
// ============================================================================

export interface CommunityNotificationData {
  title: string;
  message: string;
  type: 'booking' | 'system' | 'community' | 'admin' | 'payment';
  priority: 'normal' | 'important' | 'urgent';
  metadata?: Record<string, unknown>;
  autoHide?: boolean;
  duration?: number;
}

export function useResidentNotifications() {
  const { data: session } = useSession();
  const { addNotification } = useNotifications();
  const timeZone = useCommunityTimeZone();

  const sendCommunityNotification = async (
    notificationData: CommunityNotificationData & { targetUser?: string }
  ) => {
    try {
      if (!session?.user?.communityId) {
        console.error('No community ID found');
        return false;
      }

      // Add to local notification system for immediate feedback
      addNotification({
        title: notificationData.title,
        message: notificationData.message,
        type: notificationData.type,
        priority: notificationData.priority,
        autoHide: notificationData.autoHide ?? false, // Default to persistent notifications
        duration: notificationData.duration ?? 5000
      });

      // Store in Firestore for persistence
      const notificationDocData = {
        title: notificationData.title,
        message: notificationData.message,
        type: notificationData.type,
        priority: notificationData.priority,
        communityId: session.user.communityId,
        senderEmail: session.user.email,
        senderName: session.user.name || session.user.email,
        timestamp: serverTimestamp(),
        recipients: notificationData.targetUser || 'all',
        delivered: false,
        read: false,
        metadata: notificationData.metadata || {}
      };

      await addDoc(collection(db, 'communityNotifications'), notificationDocData);
      
      console.log('📢 Community notification sent:', {
        title: notificationData.title,
        community: session.user.communityId,
        type: notificationData.type
      });

      return true;
    } catch (error) {
      console.error('Error sending community notification:', error);
      return false;
    }
  };

  const sendAmenityBlockNotification = async (
    amenityName: string, 
    blockedDates: Date[], 
    reason: string
  ) => {
    const formatDate = (date: Date) => formatDateInTimeZone(date, timeZone, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });

    const dateRange = blockedDates.length === 1 
      ? formatDate(blockedDates[0])
      : `${formatDate(blockedDates[0])} - ${formatDate(blockedDates[blockedDates.length - 1])}`;

    return await sendCommunityNotification({
      title: `${amenityName} Blocked`,
      message: `${amenityName} has been blocked for ${blockedDates.length} date(s): ${dateRange}. Reason: ${reason}.`,
      type: 'admin',
      priority: 'important',
      autoHide: false,
      metadata: {
        amenityName,
        blockedDatesCount: blockedDates.length,
        dateRange,
        reason
      }
    });
  };

  const sendAmenityUnblockNotification = async (amenityName: string, unblockedDate: string) => {
    return await sendCommunityNotification({
      title: `${amenityName} Available`,
      message: `${amenityName} is now available for booking on ${unblockedDate}.`,
      type: 'system',
      priority: 'normal',
      autoHide: false,
      metadata: {
        amenityName,
        unblockedDate
      }
    });
  };

  const sendInstantBlockNotification = async (
    amenityName: string, 
    reason: string = 'Emergency maintenance'
  ) => {
    return await sendCommunityNotification({
      title: `${amenityName} Temporarily Unavailable`,
      message: `${amenityName} is temporarily unavailable due to ${reason}. We will update you when it's available again.`,
      type: 'admin',
      priority: 'urgent',
      autoHide: false,
      metadata: {
        amenityName,
        reason,
        blockType: 'instant'
      }
    });
  };

  return {
    sendCommunityNotification,
    sendAmenityBlockNotification,
    sendAmenityUnblockNotification,
    sendInstantBlockNotification
  };
}
