'use client';

import { useSession } from 'next-auth/react';
import { useNotifications } from '@/components/notifications/NotificationSystem';
import { collection, addDoc, serverTimestamp, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export interface CommunityNotificationData {
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'booking' | 'community' | 'system';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category: 'booking' | 'community' | 'system' | 'maintenance' | 'payment' | 'social' | 'amenity' | 'delivery' | 'feedback' | 'parking' | 'promotion';
  metadata?: Record<string, any>;
  autoHide?: boolean;
  duration?: number;
}

export function useCommunityNotifications() {
  const { data: session } = useSession();
  const { addNotification } = useNotifications();

  const sendCommunityNotification = async (notificationData: CommunityNotificationData & { targetUser?: string }) => {
    try {
      if (!session?.user?.communityId) {
        console.error('No community ID found');
        return;
      }

      // Add to local notification system for immediate feedback
      addNotification({
        ...notificationData,
        autoHide: notificationData.autoHide ?? true,
        duration: notificationData.duration ?? 5000
      });

      // Store in Firestore for persistence and cross-user notifications
      // In a real implementation, this would trigger push notifications to all community members
      const notificationDocData = {
        ...notificationData,
        communityId: session.user.communityId,
        senderEmail: session.user.email,
        senderName: session.user.name || session.user.email,
        timestamp: serverTimestamp(),
        recipients: notificationData.targetUser || 'all', // Target specific user or all
        delivered: false,
        read: false
      };

      await addDoc(collection(db, 'communityNotifications'), notificationDocData);
      
      console.log('📢 Community notification sent:', {
        title: notificationData.title,
        community: session.user.communityId,
        type: notificationData.type,
        targetUser: notificationData.targetUser || 'all'
      });

      return true;
    } catch (error) {
      console.error('Error sending community notification:', error);
      return false;
    }
  };

  const sendAmenityBlockNotification = async (amenityName: string, blockedDates: Date[], reason: string) => {
    const dateRange = blockedDates.length === 1 
      ? blockedDates[0].toLocaleDateString()
      : `${blockedDates[0].toLocaleDateString()} - ${blockedDates[blockedDates.length - 1].toLocaleDateString()}`;

    return await sendCommunityNotification({
      title: `🚫 ${amenityName} Blocked`,
      message: `${amenityName} has been blocked for ${blockedDates.length} date(s): ${dateRange}. Reason: ${reason}. Please plan accordingly.`,
      type: 'warning',
      priority: 'high',
      category: 'amenity',
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
      title: `✅ ${amenityName} Available`,
      message: `Great news! ${amenityName} is now available for booking on ${unblockedDate}. Book your slot now!`,
      type: 'success',
      priority: 'medium',
      category: 'amenity',
      autoHide: true,
      duration: 8000,
      metadata: {
        amenityName,
        unblockedDate
      }
    });
  };

  const sendInstantBlockNotification = async (amenityName: string, reason: string = 'Emergency maintenance') => {
    return await sendCommunityNotification({
      title: `⚠️ ${amenityName} Temporarily Unavailable`,
      message: `${amenityName} is temporarily unavailable due to ${reason}. We apologize for any inconvenience and will update you when it's available again.`,
      type: 'error',
      priority: 'urgent',
      category: 'amenity',
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