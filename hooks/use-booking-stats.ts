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

  // Generate test data for development
  const generateTestData = () => {
    const testBookings: Booking[] = [
      {
        id: 'test-1',
        status: 'confirmed',
        amenityName: 'Swimming Pool',
        date: '2024-01-15',
        timeSlot: '10:00 AM - 11:00 AM',
        userEmail: session?.user?.email || '',
        createdAt: new Date(Date.now() - 86400000) // 1 day ago
      },
      {
        id: 'test-2',
        status: 'confirmed',
        amenityName: 'Gym',
        date: '2024-01-14',
        timeSlot: '6:00 PM - 7:00 PM',
        userEmail: session?.user?.email || '',
        createdAt: new Date(Date.now() - 172800000) // 2 days ago
      },
      {
        id: 'test-3',
        status: 'pending',
        amenityName: 'Tennis Court',
        date: '2024-01-16',
        timeSlot: '2:00 PM - 3:00 PM',
        userEmail: session?.user?.email || '',
        createdAt: new Date(Date.now() - 43200000) // 12 hours ago
      },
      {
        id: 'test-4',
        status: 'confirmed',
        amenityName: 'Swimming Pool',
        date: '2024-01-13',
        timeSlot: '9:00 AM - 10:00 AM',
        userEmail: session?.user?.email || '',
        createdAt: new Date(Date.now() - 259200000) // 3 days ago
      }
    ];

    const activeBookings = testBookings.filter(b => b.status === 'confirmed');
    const amenityCounts = testBookings.reduce((acc: Record<string, number>, booking) => {
      const amenityName = booking.amenityName || 'Unknown';
      acc[amenityName] = (acc[amenityName] || 0) + 1;
      return acc;
    }, {});

    const favoriteAmenities = Object.values(amenityCounts).filter(count => count >= 2).length;
    const mostBookedAmenity = Object.entries(amenityCounts).reduce(
      (max, [amenity, count]: [string, number]) => 
        count > max.count ? { amenity, count } : max,
      { amenity: '', count: 0 }
    ).amenity;

    return {
      totalBookings: testBookings.length,
      activeBookings: activeBookings.length,
      favoriteAmenities,
      recentBookings: testBookings,
      mostBookedAmenity,
      loading: false,
      error: null
    };
  };

  useEffect(() => {
    if (!session?.user?.email) {
      console.log('❌ No user email found in session');
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

    console.log('🔄 Setting up real-time booking stats for:', userEmail, '| Role:', userRole);

    let unsubscribe: (() => void) | null = null;
    let adminUnsubscribe: (() => void) | null = null;

    const setupListener = async () => {
      try {
        // Test Firebase connection first
        if (!db) {
          throw new Error('Firebase database not initialized');
        }

        console.log('✅ Firebase connection established');

        // Try a simple test query first to check if collection exists
        try {
          const testQuery = query(collection(db, 'bookings'), limit(1));
          const testSnapshot = await getDocs(testQuery);
          console.log('📊 Bookings collection exists, total docs available:', testSnapshot.size);
        } catch (testError) {
          console.warn('⚠️ Bookings collection might not exist yet:', testError);
        }

        // For admins, set up TWO listeners: one for their personal bookings, one for all bookings
        if (isAdminUser) {
          console.log('👨‍💼 Admin detected - setting up dual listeners (personal + global)');
          
          // Listener 1: Admin's personal bookings
          let personalBookingsQuery;
          try {
            personalBookingsQuery = query(
              collection(db, 'bookings'),
              where('userEmail', '==', userEmail),
              orderBy('createdAt', 'desc')
            );
          } catch (indexError) {
            console.warn('⚠️ Index not available for personal bookings, using query without orderBy');
            personalBookingsQuery = query(
              collection(db, 'bookings'),
              where('userEmail', '==', userEmail)
            );
          }

          // Listener 2: All bookings for admin overview
          let allBookingsQuery;
          try {
            allBookingsQuery = query(
              collection(db, 'bookings'),
              orderBy('createdAt', 'desc')
            );
          } catch (indexError) {
            console.warn('⚠️ Index not available for all bookings, using query without orderBy');
            allBookingsQuery = query(collection(db, 'bookings'));
          }

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
              console.log('👤 Admin personal bookings updated:', personalBookings.length);
              updateAdminStats(personalBookings, globalBookings);
            },
            (error) => {
              console.error('❌ Error in admin personal bookings listener:', error);
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
              console.log('🌍 All bookings updated (admin view):', globalBookings.length);
              updateAdminStats(personalBookings, globalBookings);
            },
            (error) => {
              console.error('❌ Error in admin global bookings listener:', error);
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

            const activePersonal = personal.filter(b => 
              b.status === 'confirmed' || b.status === 'active'
            );

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
            const allConfirmed = global.filter(b => 
              b.status === 'confirmed' || b.status === 'active'
            ).length;

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

            console.log('📈 Admin stats calculated:', {
              personal: personal.length,
              global: global.length,
              confirmed: allConfirmed,
              pending: pendingBookings
            });

            setStats(newStats);
          };

        } else {
          // Regular user - only show their bookings
          console.log('👤 Regular user - setting up personal listener only');
          
          let bookingsQuery;
          try {
            bookingsQuery = query(
              collection(db, 'bookings'),
              where('userEmail', '==', userEmail),
              orderBy('createdAt', 'desc')
            );
          } catch (indexError) {
            console.warn('⚠️ Index not available, using query without orderBy');
            bookingsQuery = query(
              collection(db, 'bookings'),
              where('userEmail', '==', userEmail)
            );
          }

          unsubscribe = onSnapshot(
            bookingsQuery,
            (snapshot) => {
              try {
                console.log('📊 User bookings snapshot received, docs count:', snapshot.docs.length);
                
                const bookings: Booking[] = snapshot.docs.map(doc => {
                  const data = doc.data();
                  return {
                    id: doc.id,
                    ...data
                  };
                });

                console.log('📊 Real-time booking stats update for user:', userEmail, '| Count:', bookings.length);

                // Sort bookings by date
                const sortedBookings = bookings.sort((a, b) => {
                  const dateA = a.createdAt?.toDate?.() || new Date(a.createdAt || 0);
                  const dateB = b.createdAt?.toDate?.() || new Date(b.createdAt || 0);
                  return dateB.getTime() - dateA.getTime();
                });

                // Calculate active bookings (status: 'confirmed' or 'active')
                const activeBookings = bookings.filter(booking => 
                  booking.status === 'confirmed' || booking.status === 'active'
                );

                console.log('🎯 Active bookings found for user:', activeBookings.length);

                // Calculate favorite amenities (count unique amenities with 2+ bookings)
                const amenityCounts = bookings.reduce((acc: Record<string, number>, booking) => {
                  const amenityName = booking.amenityName || booking.amenity || 'Unknown';
                  acc[amenityName] = (acc[amenityName] || 0) + 1;
                  return acc;
                }, {});

                console.log('🏊 Amenity counts for user:', amenityCounts);

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

                console.log('📈 User stats calculated:', newStats);
                setStats(newStats);

              } catch (error) {
                console.error('❌ Error processing user booking stats:', error);
                setStats(prev => ({
                  ...prev,
                  loading: false,
                  error: 'Failed to process booking data'
                }));
              }
            },
            (error) => {
              console.error('❌ Error setting up user booking stats listener:', error);
              
              // Check if it's an index error
              if (error.code === 'failed-precondition' || error.message.includes('index')) {
                console.log('📊 Index error detected for user');
              }
              
              setStats(prev => ({
                ...prev,
                loading: false,
                error: `Connection error: ${error.message}`
              }));
            }
          );
        }


      } catch (error: any) {
        console.error('❌ Error initializing Firebase connection:', error);
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
      console.log('🔄 Cleaning up booking stats listeners');
      if (unsubscribe) {
        unsubscribe();
      }
      if (adminUnsubscribe) {
        adminUnsubscribe();
      }
    };
  }, [session?.user?.email, isAdmin]);

  return stats;
}

export default useBookingStats;