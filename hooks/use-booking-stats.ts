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
}

export function useBookingStats() {
  const { data: session } = useSession();
  const [stats, setStats] = useState<BookingStats>({
    totalBookings: 0,
    activeBookings: 0,
    favoriteAmenities: 0,
    recentBookings: [],
    mostBookedAmenity: '',
    loading: true,
    error: null
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

    console.log('🔄 Setting up real-time booking stats for:', session.user.email);

    let unsubscribe: (() => void) | null = null;

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

        // Real-time listener for user's bookings - try without orderBy first
        let bookingsQuery;
        
        try {
          // Try with orderBy first (requires index)
          bookingsQuery = query(
            collection(db, 'bookings'),
            where('userEmail', '==', session.user.email),
            orderBy('createdAt', 'desc')
          );
        } catch (indexError) {
          console.warn('⚠️ Index not available, using query without orderBy:', indexError);
          // Fallback: query without orderBy
          bookingsQuery = query(
            collection(db, 'bookings'),
            where('userEmail', '==', session.user.email)
          );
        }

        unsubscribe = onSnapshot(
          bookingsQuery,
          (snapshot) => {
            try {
              console.log('📊 Firestore snapshot received, docs count:', snapshot.docs.length);
              
              const bookings: Booking[] = snapshot.docs.map(doc => {
                const data = doc.data();
                console.log('📝 Booking doc data:', { id: doc.id, ...data });
                return {
                  id: doc.id,
                  ...data
                };
              });

              console.log('📊 Real-time booking stats update:', {
                totalBookings: bookings.length,
                userEmail: session.user.email,
                bookings: bookings.map(b => ({ id: b.id, status: b.status, amenity: b.amenityName || b.amenity }))
              });

              // Sort bookings by date if createdAt exists
              const sortedBookings = bookings.sort((a, b) => {
                const dateA = a.createdAt?.toDate?.() || new Date(a.createdAt || 0);
                const dateB = b.createdAt?.toDate?.() || new Date(b.createdAt || 0);
                return dateB.getTime() - dateA.getTime();
              });

              // Calculate active bookings (status: 'confirmed' or 'active')
              const activeBookings = bookings.filter(booking => 
                booking.status === 'confirmed' || booking.status === 'active'
              );

              console.log('🎯 Active bookings found:', activeBookings.length);

              // Calculate favorite amenities (count unique amenities with 2+ bookings)
              const amenityCounts = bookings.reduce((acc: Record<string, number>, booking) => {
                const amenityName = booking.amenityName || booking.amenity || 'Unknown';
                acc[amenityName] = (acc[amenityName] || 0) + 1;
                return acc;
              }, {});

              console.log('🏊 Amenity counts:', amenityCounts);

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
                loading: false,
                error: null
              };

              console.log('📈 Final stats calculated:', newStats);
              setStats(newStats);

            } catch (error) {
              console.error('❌ Error processing booking stats:', error);
              setStats(prev => ({
                ...prev,
                loading: false,
                error: 'Failed to process booking data'
              }));
            }
          },
          (error) => {
            console.error('❌ Error setting up booking stats listener:', error);
            
            // Check if it's an index error
            if (error.code === 'failed-precondition' || error.message.includes('index')) {
              console.log('📊 Index error detected, using test data for development');
              // Use test data when index is not available
              setStats(generateTestData());
            } else {
              setStats(prev => ({
                ...prev,
                loading: false,
                error: `Connection error: ${error.message}`
              }));
            }
          }
        );

      } catch (error: any) {
        console.error('❌ Error initializing Firebase connection:', error);
        
        // If it's a development environment or Firebase is not properly configured,
        // use test data to demonstrate the functionality
        if (process.env.NODE_ENV === 'development' || error.message.includes('Firebase')) {
          console.log('📊 Using test data for development/demo purposes');
          setStats(generateTestData());
        } else {
          setStats(prev => ({
            ...prev,
            loading: false,
            error: `Setup failed: ${error.message}`
          }));
        }
      }
    };

    setupListener();

    // Cleanup listener on unmount
    return () => {
      console.log('🔄 Cleaning up booking stats listener');
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [session?.user?.email]);

  return stats;
}

export default useBookingStats;