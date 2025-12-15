'use client';

import { useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { collection, query, where, onSnapshot, orderBy, Timestamp, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useNotifications } from './NotificationSystem';

/**
 * Real-time notification listener using Firestore notifications collection
 * Listens for notifications created by the server and displays them to users
 */
export function RealtimeNotificationListener() {
  const { data: session } = useSession();
  const { addNotification } = useNotifications();
  const processedNotifications = useRef(new Set<string>());
  const unsubscribeRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!session?.user?.email || !session?.user?.communityId) return;

    console.log('🔔 Setting up real-time notification listener...');

    try {
      // Listen for notifications for this user
      const notificationsQuery = query(
        collection(db, 'notifications'),
        where('userEmail', '==', session.user.email),
        where('communityId', '==', session.user.communityId),
        where('read', '==', false), // Only unread notifications
        orderBy('createdAt', 'desc')
      );

      unsubscribeRef.current = onSnapshot(
        notificationsQuery,
        (snapshot) => {
          console.log(`📬 Received ${snapshot.size} unread notifications`);

          snapshot.docChanges().forEach((change) => {
            if (change.type === 'added') {
              const notificationId = change.doc.id;
              
              // Skip if already processed
              if (processedNotifications.current.has(notificationId)) return;
              processedNotifications.current.add(notificationId);

              const data = change.doc.data();
              const createdAt = data.createdAt?.toDate();
              
              // Only show recent notifications (within last 5 minutes)
              const now = new Date();
              const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
              if (createdAt && createdAt < fiveMinutesAgo) {
                console.log('⏭️ Skipping old notification:', notificationId);
                return;
              }

              console.log('✨ New notification:', data.type, data.title);

              // Show notification in UI
              addNotification({
                title: data.title || '🔔 New Notification',
                message: data.message || '',
                type: mapNotificationType(data.type),
                priority: data.priority || 'medium',
                category: data.category || 'system',
                actionUrl: data.data?.bookingUrl || '/bookings',
                actionLabel: 'View Details',
                autoHide: true,
                duration: 8000,
                metadata: {
                  firestoreId: notificationId,
                  ...data.data,
                },
              });

              // Mark as read after showing (optional - keep for notification history)
              // Uncomment if you want notifications to auto-mark as read
              // setTimeout(() => {
              //   markAsRead(notificationId);
              // }, 1000);
            }
          });
        },
        (error) => {
          console.error('❌ Notification listener error:', error);
        }
      );

      console.log('✅ Real-time notification listener active');

    } catch (error) {
      console.error('❌ Failed to set up notification listener:', error);
    }

    // Cleanup on unmount
    return () => {
      if (unsubscribeRef.current) {
        console.log('🔇 Cleaning up notification listener');
        unsubscribeRef.current();
      }
    };
  }, [session?.user?.email, session?.user?.communityId, addNotification]);

  return null; // This is a listener component, no UI
}

/**
 * Map Firestore notification types to UI notification types
 */
function mapNotificationType(type: string): 'success' | 'error' | 'warning' | 'info' | 'community' {
  switch (type) {
    case 'waitlist_promoted':
    case 'booking_confirmed':
      return 'success';
    case 'booking_cancelled':
    case 'suspension':
      return 'warning';
    case 'booking_reminder':
    case 'system':
      return 'info';
    default:
      return 'info';
  }
}

/**
 * Mark a notification as read in Firestore
 */
export async function markNotificationAsRead(notificationId: string): Promise<void> {
  try {
    const notificationRef = doc(db, 'notifications', notificationId);
    await updateDoc(notificationRef, {
      read: true,
      readAt: Timestamp.now(),
    });
    console.log('✅ Notification marked as read:', notificationId);
  } catch (error) {
    console.error('❌ Failed to mark notification as read:', error);
  }
}

/**
 * Delete a notification from Firestore
 */
export async function deleteNotification(notificationId: string): Promise<void> {
  try {
    const notificationRef = doc(db, 'notifications', notificationId);
    await deleteDoc(notificationRef);
    console.log('🗑️ Notification deleted:', notificationId);
  } catch (error) {
    console.error('❌ Failed to delete notification:', error);
  }
}
