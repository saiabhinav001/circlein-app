'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { collection, query, where, onSnapshot, orderBy, getDocs, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface Booking {
  id: string;
  status?: string;
  amenityName?: string;
  amenity?: string;
  date?: string;
  timeSlot?: string;
  userEmail?: string;
  userName?: string;
  createdAt?: any;
  [key: string]: any;
}

interface BookingStats {
  totalBookings: number;
  activeBookings: number;
  favoriteAmenities: number;
  recentBookings: Booking[];
  mostBookedAmenity: string;
  loading: boolean;
  error: string | null;
  isAdmin?: boolean;
  // Admin-specific stats
  allBookings?: number;
  allConfirmed?: number;
  pendingBookings?: number;
  mostBookedAmenityGlobal?: string;
  topUsers?: { email: string; count: number }[];
}

export function useBookingStats() {
  const { data: session } = useSession();
  const isAdmin = (session?.user as any)?.role === 'admin';
  
  const [stats, setStats] = useState<BookingStats>({
    totalBookings: 0,
    activeBookings: 0,
    favoriteAmenities: 0,
    recentBookings: [],
    mostBookedAmenity: '',
    loading: true,
    error: null,
    isAdmin,
    // Admin-specific stats
    allBookings: 0,
    allConfirmed: 0,
    pendingBookings: 0,
    mostBookedAmenityGlobal: '',
    topUsers: []
  });

  useEffect(() => {
    if (!session?.user?.email) {
      setStats(prev => ({ 
        ...prev, 
        loading: false, 
        error: 'Please sign in to view booking statistics' 
      }));
      return;
    }

    const userEmail = session.user.email;
    const userRole = (session.user as any)?.role;
    const isAdminUser = userRole === 'admin';

    let unsubscribe: (() => void) | null = null;
    let adminUnsubscribe: (() => void) | null = null;

    const setupListener = async () => {
      try {
        if (!db) {
          throw new Error('Firebase database not initialized');
        }

        // For admins, set up TWO listeners: one for their personal bookings, one for all bookings
        if (isAdminUser) {
          
          // Listener 1: Admin's personal bookings
          const personalBookingsQuery = query(
            collection(db, 'bookings'),
            where('userEmail', '==', userEmail),
            orderBy('createdAt', 'desc')
          );

          // Listener 2: All bookings for admin overview
          const allBookingsQuery = query(
            collection(db, 'bookings'),
            orderBy('createdAt', 'desc')
          );

          // Store personal and global data separately
          let personalBookings: Booking[] = [];
          let globalBookings: Booking[] = [];

          // Subscribe to personal bookings
          unsubscribe = onSnapshot(
            personalBookingsQuery,
            (snapshot) => {
              personalBookings = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
              }));
              updateAdminStats(personalBookings, globalBookings);
            },
            (error) => {
              console.error('Error in admin personal bookings listener:', error);
            }
          );

          // Subscribe to all bookings (admin overview)
          adminUnsubscribe = onSnapshot(
            allBookingsQuery,
            (snapshot) => {
              globalBookings = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
              }));
              updateAdminStats(personalBookings, globalBookings);
            },
            (error) => {
              console.error('Error in admin global bookings listener:', error);
            }
          );

          // Function to calculate admin stats
          const updateAdminStats = (personal: Booking[], global: Booking[]) => {
            // Personal stats
            const sortedPersonal = personal.sort((a, b) => {
              const dateA = a.createdAt?.toDate?.() || new Date(a.createdAt || 0);
              const dateB = b.createdAt?.toDate?.() || new Date(b.createdAt || 0);
              return dateB.getTime() - dateA.getTime();
            });

            // Active = bookings that are currently happening (between startTime and endTime)
            const now = new Date();
            const activePersonal = personal.filter(b => {
              if (b.status === 'cancelled' || b.status === 'completed' || b.status === 'archived') {
                return false;
              }
              const startTime = b.startTime ? new Date(b.startTime) : null;
              const endTime = b.endTime ? new Date(b.endTime) : null;
              if (startTime && endTime) {
                return now >= startTime && now <= endTime;
              }
              return false;
            });

            const personalAmenityCounts = personal.reduce((acc: Record<string, number>, booking) => {
              const amenityName = booking.amenityName || booking.amenity || 'Unknown';
              acc[amenityName] = (acc[amenityName] || 0) + 1;
              return acc;
            }, {});

            const favoriteAmenities = Object.values(personalAmenityCounts).filter(
              (count: number) => count >= 2
            ).length;

            const mostBookedPersonal = Object.entries(personalAmenityCounts).reduce(
              (max: { amenity: string; count: number }, [amenity, count]: [string, number]) => 
                count > max.count ? { amenity, count } : max,
              { amenity: '', count: 0 }
            ).amenity;

            // Global stats (admin overview)
            // Active bookings = currently happening across all community
            const allConfirmed = global.filter(b => {
              if (b.status === 'cancelled' || b.status === 'completed' || b.status === 'archived') {
                return false;
              }
              const startTime = b.startTime ? new Date(b.startTime) : null;
              const endTime = b.endTime ? new Date(b.endTime) : null;
              if (startTime && endTime) {
                return now >= startTime && now <= endTime;
              }
              return false;
            }).length;

            const pendingBookings = global.filter(b => b.status === 'pending').length;

            // Most booked amenity globally
            const globalAmenityCounts = global.reduce((acc: Record<string, number>, booking) => {
              const amenityName = booking.amenityName || booking.amenity || 'Unknown';
              acc[amenityName] = (acc[amenityName] || 0) + 1;
              return acc;
            }, {});

            const mostBookedGlobal = Object.entries(globalAmenityCounts).reduce(
              (max: { amenity: string; count: number }, [amenity, count]: [string, number]) => 
                count > max.count ? { amenity, count } : max,
              { amenity: '', count: 0 }
            ).amenity;

            // Top users by booking count
            const userBookingCounts = global.reduce((acc: Record<string, number>, booking) => {
              const email = booking.userEmail || 'Unknown';
              acc[email] = (acc[email] || 0) + 1;
              return acc;
            }, {});

            const topUsers = Object.entries(userBookingCounts)
              .map(([email, count]) => ({ email, count: count as number }))
              .sort((a, b) => b.count - a.count)
              .slice(0, 5);

            const newStats = {
              // Personal stats
              totalBookings: personal.length,
              activeBookings: activePersonal.length,
              favoriteAmenities,
              recentBookings: sortedPersonal.slice(0, 5),
              mostBookedAmenity: mostBookedPersonal,
              // Admin global stats
              allBookings: global.length,
              allConfirmed,
              pendingBookings,
              mostBookedAmenityGlobal: mostBookedGlobal,
              topUsers,
              // Meta
              isAdmin: true,
              loading: false,
              error: null
            };

            setStats(newStats);
          };

        } else {
          // Regular user - only show their bookings
          const bookingsQuery = query(
            collection(db, 'bookings'),
            where('userEmail', '==', userEmail),
            orderBy('createdAt', 'desc')
          );

          unsubscribe = onSnapshot(
            bookingsQuery,
            (snapshot) => {
              try {
                const bookings: Booking[] = snapshot.docs.map(doc => ({
                  id: doc.id,
                  ...doc.data()
                }));

                // Sort bookings by date
                const sortedBookings = bookings.sort((a, b) => {
                  const dateA = a.createdAt?.toDate?.() || new Date(a.createdAt || 0);
                  const dateB = b.createdAt?.toDate?.() || new Date(b.createdAt || 0);
                  return dateB.getTime() - dateA.getTime();
                });

                // Active = bookings that are currently happening (between startTime and endTime)
                const now = new Date();
                const activeBookings = bookings.filter(booking => {
                  if (booking.status === 'cancelled' || booking.status === 'completed' || booking.status === 'archived') {
                    return false;
                  }
                  const startTime = booking.startTime ? new Date(booking.startTime) : null;
                  const endTime = booking.endTime ? new Date(booking.endTime) : null;
                  if (startTime && endTime) {
                    return now >= startTime && now <= endTime;
                  }
                  return false;
                });

                // Calculate favorite amenities (count unique amenities with 2+ bookings)
                const amenityCounts = bookings.reduce((acc: Record<string, number>, booking) => {
                  const amenityName = booking.amenityName || booking.amenity || 'Unknown';
                  acc[amenityName] = (acc[amenityName] || 0) + 1;
                  return acc;
                }, {});

                const favoriteAmenities = Object.values(amenityCounts).filter(
                  (count: number) => count >= 2
                ).length;

                // Find most booked amenity
                const mostBookedAmenity = Object.entries(amenityCounts).reduce(
                  (max: { amenity: string; count: number }, [amenity, count]: [string, number]) => 
                    count > max.count ? { amenity, count } : max,
                  { amenity: '', count: 0 }
                ).amenity;

                // Get recent bookings (last 5)
                const recentBookings = sortedBookings.slice(0, 5);

                const newStats = {
                  totalBookings: bookings.length,
                  activeBookings: activeBookings.length,
                  favoriteAmenities,
                  recentBookings,
                  mostBookedAmenity,
                  isAdmin: false,
                  loading: false,
                  error: null
                };

                setStats(newStats);

              } catch (error) {
                console.error('Error processing user booking stats:', error);
                setStats(prev => ({
                  ...prev,
                  loading: false,
                  error: 'Failed to process booking data'
                }));
              }
            },
            (error) => {
              console.error('Error setting up user booking stats listener:', error);
              setStats(prev => ({
                ...prev,
                loading: false,
                error: `Connection error: ${error.message}`
              }));
            }
          );
        }

      } catch (error: any) {
        console.error('Error initializing Firebase connection:', error);
        setStats(prev => ({
          ...prev,
          loading: false,
          error: `Setup failed: ${error.message}`
        }));
      }
    };

    setupListener();

    // Cleanup listeners on unmount
    return () => {
      if (unsubscribe) unsubscribe();
      if (adminUnsubscribe) adminUnsubscribe();
    };
  }, [session?.user?.email, isAdmin]);

  return stats;
}

export default useBookingStats;