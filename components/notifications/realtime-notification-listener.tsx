'use client';

import { useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { collection, query, where, onSnapshot, orderBy, Timestamp, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useNotifications } from './notification-system';

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
                return;
              }


              // Show notification in UI
              addNotification({
                title: data.title || '🔔 New Notification',
                message: data.message || '',
                type: mapNotificationType(data.type),
                priority: data.priority || 'normal',
                actionUrl: data.actionUrl || '/notifications',
                source: data.source || data.type || 'system',
                autoHide: false
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
        }
      );


    } catch (error) {
            // TODO: add error handling
    }

    // Cleanup on unmount
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, [session?.user?.email, session?.user?.communityId, addNotification]);

  return null; // This is a listener component, no UI
}

/**
 * Map Firestore notification types to UI notification types
 */
function mapNotificationType(type: string): 'booking' | 'system' | 'community' | 'admin' | 'payment' {
  switch (type) {
    case 'waitlist_promoted':
    case 'booking_confirmed':
    case 'booking_created':
    case 'booking_reminder':
      return 'booking';
    case 'booking_cancelled':
    case 'suspension':
    case 'amenity_blocked':
      return 'admin';
    case 'community':
    case 'announcement':
      return 'community';
    case 'payment':
      return 'payment';
    case 'system':
    default:
      return 'system';
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
  } catch (error) {
        // TODO: add error handling
  }
}

/**
 * Delete a notification from Firestore
 */
export async function deleteNotification(notificationId: string): Promise<void> {
  try {
    const notificationRef = doc(db, 'notifications', notificationId);
    await deleteDoc(notificationRef);
  } catch (error) {
        // TODO: add error handling
  }
}
