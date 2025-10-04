'use client';

// FIREBASE INTEGRATION - DISABLED DUE TO FIRESTORE INTERNAL ASSERTION FAILURES
// This file contains the real-time Firebase listeners that were causing the errors
// Enable this when Firebase issues are resolved

import { useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { collection, query, where, onSnapshot, orderBy, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useNotifications } from './NotificationSystem';

export function FirebaseNotificationListener() {
  const { data: session } = useSession();
  const { addNotification } = useNotifications();
  const processedBookings = useRef(new Set<string>());
  const processedMaintenance = useRef(new Set<string>());
  const processedEvents = useRef(new Set<string>());
  const isInitialLoad = useRef(true);
  const initializationTime = useRef(Date.now());
  const unsubscribeFunctions = useRef<(() => void)[]>([]);

  useEffect(() => {
    if (!session?.user?.email || !session?.user?.communityId) return;

    console.log('🔔 Setting up Firebase real-time notification listeners...');

    // Clear any existing unsubscribe functions
    unsubscribeFunctions.current = [];

    try {
      // Listen for new bookings in the community
      const bookingsQuery = query(
        collection(db, 'bookings'),
        where('communityId', '==', session.user.communityId),
        orderBy('createdAt', 'desc'),
        limit(20)
      );

      const unsubscribeBookings = onSnapshot(
        bookingsQuery,
        (snapshot) => {
          try {
            console.log('📅 Booking changes detected:', snapshot.size, 'bookings');
            
            snapshot.docChanges().forEach((change) => {
              try {
                const data = change.doc.data();
                const bookingId = change.doc.id;
                
                // Skip if we've already processed this booking
                if (processedBookings.current.has(bookingId)) return;
                
                const booking = {
                  id: bookingId,
                  userId: data.userId || '',
                  amenityId: data.amenityId || '',
                  amenityName: data.amenityName || 'Unknown Amenity',
                  startTime: data.startTime?.toDate(),
                  endTime: data.endTime?.toDate(),
                  createdAt: data.createdAt?.toDate(),
                  status: data.status || 'pending',
                  attendees: data.attendees || []
                };

                // Only process items created after we started listening
                const bookingTime = booking.createdAt ? booking.createdAt.getTime() : 0;
                const shouldProcess = !isInitialLoad.current || bookingTime > initializationTime.current;
                
                if (change.type === 'added' && shouldProcess) {
                  processedBookings.current.add(bookingId);
                  
                  if (booking.userId !== session.user.email) {
                    addNotification({
                      title: '🎯 New Community Booking',
                      message: `${booking.amenityName} has been booked for ${booking.startTime?.toLocaleDateString()}`,
                      type: 'community',
                      priority: 'low',
                      category: 'booking',
                      actionUrl: '/calendar',
                      actionLabel: 'View Calendar',
                      autoHide: true,
                      duration: 8000,
                      metadata: {
                        amenityName: booking.amenityName,
                        bookingId: booking.id,
                        userId: booking.userId
                      }
                    });
                  } else {
                    addNotification({
                      title: '✅ Booking Created Successfully',
                      message: `Your ${booking.amenityName} booking for ${booking.startTime?.toLocaleDateString()} has been created.`,
                      type: 'success',
                      priority: 'high',
                      category: 'booking',
                      actionUrl: '/bookings',
                      actionLabel: 'View My Bookings',
                      autoHide: true,
                      duration: 6000,
                      metadata: {
                        amenityName: booking.amenityName,
                        bookingId: booking.id
                      }
                    });
                  }
                }
              } catch (error) {
                console.error('❌ Error processing booking change:', error);
              }
            });
          } catch (error) {
            console.error('❌ Error processing booking snapshot:', error);
          }
        },
        (error) => {
          console.error('❌ Error listening to bookings:', error);
        }
      );

      unsubscribeFunctions.current.push(unsubscribeBookings);

      // Mark as no longer initial load
      setTimeout(() => {
        isInitialLoad.current = false;
      }, 3000);

    } catch (error) {
      console.error('❌ Error setting up Firebase notification listeners:', error);
    }

    // Cleanup function
    return () => {
      try {
        console.log('🔕 Cleaning up Firebase notification listeners');
        
        unsubscribeFunctions.current.forEach((unsubscribe, index) => {
          try {
            if (typeof unsubscribe === 'function') {
              unsubscribe();
            }
          } catch (error) {
            console.error(`❌ Error unsubscribing Firebase listener ${index}:`, error);
          }
        });
        
        unsubscribeFunctions.current = [];
        processedBookings.current.clear();
        processedMaintenance.current.clear();
        processedEvents.current.clear();
      } catch (error) {
        console.error('❌ Error during Firebase cleanup:', error);
      }
    };
  }, [session, addNotification]);

  return null;
}