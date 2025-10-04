'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  doc, 
  updateDoc, 
  deleteDoc,
  getDocs,
  Timestamp 
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { toast } from 'sonner';

export interface AdvancedBooking {
  id: string;
  userId: string;
  userEmail: string;
  userName?: string;
  communityId: string;
  amenityId: string;
  amenityName: string;
  amenityType?: string;
  startTime: Date;
  endTime: Date;
  status: 'confirmed' | 'cancelled' | 'completed' | 'in-progress' | 'expired';
  attendees: string[];
  createdAt: Date;
  updatedAt: Date;
  qrCodeId?: string;
  qrCodeGenerated?: boolean;
  qrCodeGeneratedAt?: Date;
  checkInTime?: Date;
  checkOutTime?: Date;
  cancelledAt?: Date;
  cancelledBy?: string;
  adminCancellation?: boolean;
  notes?: string;
  metadata: {
    duration: number;
    isRecurring?: boolean;
    parentBookingId?: string;
    price?: number;
    paymentStatus?: string;
    cancellationReason?: string;
  };
}

export type BookingFilter = 'current' | 'all' | 'past';
export type BookingStatus = 'all' | 'confirmed' | 'cancelled' | 'completed' | 'in-progress' | 'expired';

interface UseAdvancedBookingsProps {
  userEmail?: string;
  communityId?: string;
  isAdmin?: boolean;
}

export function useAdvancedBookings({ userEmail, communityId, isAdmin = false }: UseAdvancedBookingsProps = {}) {
  const { data: session } = useSession();
  const [bookings, setBookings] = useState<AdvancedBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [filter, setFilter] = useState<BookingFilter>('current');
  const [statusFilter, setStatusFilter] = useState<BookingStatus>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const activeUserEmail = userEmail || session?.user?.email;
  const activeCommunityId = communityId || session?.user?.communityId || 'default-community';

  // Real-time booking listener
  useEffect(() => {
    if (!activeUserEmail) {
      console.log('❌ No user email available for booking listener');
      setLoading(false);
      setError('User not authenticated');
      return;
    }

    if (!activeCommunityId || activeCommunityId === 'default-community') {
      console.log('⚠️ No community ID available, using default');
    }

    setLoading(true);
    setError(null);

    let q;
    
    // FIXED: Only actual admins can see all bookings, residents only see their own
    const userRole = session?.user?.role;
    const isActualAdmin = userRole === 'admin' || userRole === 'super_admin';
    
    if (isAdmin && isActualAdmin) {
      // Only verified admins see all community bookings
      q = query(
        collection(db, 'bookings'),
        where('communityId', '==', activeCommunityId),
        orderBy('startTime', 'desc')
      );
    } else {
      // Regular users and residents see only their own bookings
      q = query(
        collection(db, 'bookings'),
        where('userEmail', '==', activeUserEmail),
        where('communityId', '==', activeCommunityId),
        orderBy('startTime', 'desc')
      );
    }

    console.log('🔍 Setting up advanced booking listener:', {
      userEmail: activeUserEmail,
      communityId: activeCommunityId,
      isAdmin: isActualAdmin,
      queryType: isActualAdmin ? 'admin-all-bookings' : 'user-specific-bookings'
    });

    const unsubscribe = onSnapshot(q, async (querySnapshot) => {
      try {
        const timestamp = new Date().toLocaleTimeString();
        console.log(`📊 [${timestamp}] Advanced bookings snapshot:`, {
          totalDocs: querySnapshot.size,
          changes: querySnapshot.docChanges().length,
          fromCache: querySnapshot.metadata.fromCache
        });

        // Log individual changes
        querySnapshot.docChanges().forEach((change) => {
          const data = change.doc.data();
          console.log(`📝 [${timestamp}] Booking ${change.type}:`, {
            id: change.doc.id,
            status: data.status,
            amenity: data.amenityName,
            user: data.userId,
            adminCancellation: data.adminCancellation
          });
        });

        // Fetch amenity details for each booking
        const bookingPromises = querySnapshot.docs.map(async (bookingDoc) => {
          const bookingData = bookingDoc.data();
          
          console.log(`📖 Processing booking ${bookingDoc.id}:`, {
            userId: bookingData.userId,
            userEmail: bookingData.userEmail,
            amenityId: bookingData.amenityId,
            amenityName: bookingData.amenityName,
            status: bookingData.status
          });
          
          // Get amenity name (use cached name from booking data)
          let amenityName = bookingData.amenityName || 'Unknown Amenity';
          let amenityType = bookingData.amenityType || 'general';
          
          // Note: We're using cached amenity data from the booking to avoid 
          // real-time query issues. Amenity details are stored in booking when created.

          // Calculate current status based on time
          const now = new Date();
          const startTime = bookingData.startTime.toDate();
          const endTime = bookingData.endTime.toDate();
          
          let calculatedStatus = bookingData.status;
          if (calculatedStatus === 'confirmed') {
            if (now > endTime) {
              calculatedStatus = 'completed';
            } else if (now >= startTime && now <= endTime) {
              calculatedStatus = bookingData.checkInTime ? 'in-progress' : 'confirmed';
            }
          }

          return {
            id: bookingDoc.id,
            userId: bookingData.userId || bookingData.userEmail,
            userEmail: bookingData.userEmail || bookingData.userId,
            userName: bookingData.userName,
            communityId: bookingData.communityId,
            amenityId: bookingData.amenityId,
            amenityName,
            amenityType,
            startTime,
            endTime,
            status: calculatedStatus,
            attendees: bookingData.attendees || [],
            createdAt: bookingData.createdAt?.toDate() || new Date(),
            updatedAt: bookingData.updatedAt?.toDate() || new Date(),
            qrCodeId: bookingData.qrCodeId,
            qrCodeGenerated: bookingData.qrCodeGenerated || false,
            qrCodeGeneratedAt: bookingData.qrCodeGeneratedAt?.toDate(),
            checkInTime: bookingData.checkInTime?.toDate(),
            checkOutTime: bookingData.checkOutTime?.toDate(),
            cancelledAt: bookingData.cancelledAt?.toDate(),
            cancelledBy: bookingData.cancelledBy,
            adminCancellation: bookingData.adminCancellation || false,
            notes: bookingData.notes,
            metadata: {
              duration: Math.round((endTime.getTime() - startTime.getTime()) / (1000 * 60)), // minutes
              isRecurring: bookingData.isRecurring || false,
              parentBookingId: bookingData.parentBookingId,
              price: bookingData.price,
              paymentStatus: bookingData.paymentStatus,
              cancellationReason: bookingData.cancellationReason,
              ...bookingData.metadata
            }
          } as AdvancedBooking;
        });

        const bookingList = await Promise.all(bookingPromises);
        
        console.log(`📋 [${timestamp}] Updated bookings:`, {
          total: bookingList.length,
          confirmed: bookingList.filter(b => b.status === 'confirmed').length,
          cancelled: bookingList.filter(b => b.status === 'cancelled').length,
          completed: bookingList.filter(b => b.status === 'completed').length,
          inProgress: bookingList.filter(b => b.status === 'in-progress').length
        });

        setBookings(bookingList);
        setLoading(false);
      } catch (err) {
        console.error('Error processing bookings:', err);
        setError(`Failed to process bookings: ${err instanceof Error ? err.message : 'Unknown error'}`);
        setLoading(false);
        toast.error('Failed to load booking data');
      }
    }, (err) => {
      console.error('Booking listener error:', err);
      let errorMessage = 'Real-time updates failed';
      
      if (err.code === 'failed-precondition') {
        errorMessage = 'Database indexes required. Go to Firebase Console → Firestore → Indexes and create the required composite indexes.';
        console.error('🚨 FIRESTORE INDEX MISSING:', {
          error: err,
          requiredIndexes: [
            '1. Collection: bookings | Fields: userId(↑) + communityId(↑) + startTime(↓)',
            '2. Collection: bookings | Fields: communityId(↑) + startTime(↓)'
          ],
          firebaseConsole: 'https://console.firebase.google.com → Your Project → Firestore Database → Indexes',
          setupGuide: 'See FIRESTORE_INDEXES_SETUP.md for step-by-step instructions'
        });
        
        // Show detailed instructions in console
        console.log(`
🔥 FIRESTORE INDEX CREATION REQUIRED:

1. Go to: https://console.firebase.google.com
2. Select your project → Firestore Database → Indexes
3. Click "Create Index" and add these 2 indexes:

INDEX 1 (User Bookings):
- Collection: bookings
- Fields: userId (Ascending) + communityId (Ascending) + startTime (Descending)

INDEX 2 (Admin Bookings):  
- Collection: bookings
- Fields: communityId (Ascending) + startTime (Descending)

Indexes take 5-15 minutes to build. App will work normally once complete.
        `);
      } else if (err.code === 'permission-denied') {
        errorMessage = 'Permission denied. Please check Firestore rules.';
      } else if (err.code === 'unavailable') {
        errorMessage = 'Database temporarily unavailable. Retrying...';
      } else if (err instanceof Error) {
        errorMessage = `Connection error: ${err.message}`;
      }
      
      setError(errorMessage);
      setLoading(false);
      toast.error(errorMessage);
      
      // Retry logic for temporary failures
      if (err.code === 'unavailable' && retryCount < 3) {
        console.log(`🔄 Retrying connection (${retryCount + 1}/3) in 3 seconds...`);
        setTimeout(() => {
          setRetryCount(prev => prev + 1);
        }, 3000);
      } else if (err.code === 'failed-precondition' && retryCount === 0) {
        console.log('🔄 Trying fallback query without ordering...');
        // Try a simpler query without orderBy as fallback
        setTimeout(() => {
          setRetryCount(1); // Use retry count to switch to fallback
        }, 1000);
      }
    });

    return () => unsubscribe();
  }, [activeUserEmail, activeCommunityId, isAdmin, retryCount]);

  // Fallback query effect for when main query fails due to missing indexes
  useEffect(() => {
    if (retryCount !== 1 || !activeUserEmail) return;

    console.log('🔄 Using fallback query without orderBy...');
    setLoading(true);
    setError(null);

    let fallbackQuery;
    if (isAdmin) {
      fallbackQuery = query(
        collection(db, 'bookings'),
        where('communityId', '==', activeCommunityId)
      );
    } else {
      fallbackQuery = query(
        collection(db, 'bookings'),
        where('userId', '==', activeUserEmail)
      );
    }

    const unsubscribe = onSnapshot(fallbackQuery, async (querySnapshot) => {
      try {
        console.log('📊 Fallback query results:', querySnapshot.size);
        
        // Filter by community ID in memory for non-admin users
        let docs = querySnapshot.docs;
        if (!isAdmin) {
          docs = docs.filter(doc => doc.data().communityId === activeCommunityId);
        }

        const bookingPromises = docs.map(async (bookingDoc) => {
          const bookingData = bookingDoc.data();
          
          console.log(`📖 Processing booking ${bookingDoc.id}:`, {
            userId: bookingData.userId,
            userEmail: bookingData.userEmail,
            amenityId: bookingData.amenityId,
            amenityName: bookingData.amenityName,
            status: bookingData.status
          });
          
          // Get amenity name (use cached name from booking data)
          let amenityName = bookingData.amenityName || 'Unknown Amenity';
          let amenityType = bookingData.amenityType || 'general';
          
          // Note: We're using cached amenity data from the booking to avoid 
          // real-time query issues. Amenity details are stored in booking when created.

          // Calculate current status based on time
          const now = new Date();
          const startTime = bookingData.startTime.toDate();
          const endTime = bookingData.endTime.toDate();
          
          let calculatedStatus = bookingData.status;
          if (calculatedStatus === 'confirmed') {
            if (now > endTime) {
              calculatedStatus = 'completed';
            } else if (now >= startTime && now <= endTime) {
              calculatedStatus = bookingData.checkInTime ? 'in-progress' : 'confirmed';
            }
          }

          return {
            id: bookingDoc.id,
            userId: bookingData.userId || bookingData.userEmail,
            userEmail: bookingData.userEmail || bookingData.userId,
            userName: bookingData.userName,
            communityId: bookingData.communityId,
            amenityId: bookingData.amenityId,
            amenityName,
            amenityType,
            startTime,
            endTime,
            status: calculatedStatus,
            attendees: bookingData.attendees || [],
            createdAt: bookingData.createdAt?.toDate() || new Date(),
            updatedAt: bookingData.updatedAt?.toDate() || new Date(),
            qrCodeId: bookingData.qrCodeId,
            qrCodeGenerated: bookingData.qrCodeGenerated || false,
            qrCodeGeneratedAt: bookingData.qrCodeGeneratedAt?.toDate(),
            checkInTime: bookingData.checkInTime?.toDate(),
            checkOutTime: bookingData.checkOutTime?.toDate(),
            cancelledAt: bookingData.cancelledAt?.toDate(),
            cancelledBy: bookingData.cancelledBy,
            adminCancellation: bookingData.adminCancellation || false,
            notes: bookingData.notes,
            metadata: {
              duration: Math.round((endTime.getTime() - startTime.getTime()) / (1000 * 60)), // minutes
              isRecurring: bookingData.isRecurring || false,
              parentBookingId: bookingData.parentBookingId,
              price: bookingData.price,
              paymentStatus: bookingData.paymentStatus,
              cancellationReason: bookingData.cancellationReason,
              ...bookingData.metadata
            }
          } as AdvancedBooking;
        });

        const bookingList = await Promise.all(bookingPromises);
        
        // Sort in memory since we can't use orderBy
        bookingList.sort((a, b) => b.startTime.getTime() - a.startTime.getTime());
        
        console.log('📋 Fallback bookings loaded:', bookingList.length);
        
        setBookings(bookingList);
        setLoading(false);
        setError('Using simplified query - create Firestore indexes for better performance.');
      } catch (err) {
        console.error('Fallback query error:', err);
        setError('Failed to load bookings even with fallback query');
        setLoading(false);
      }
    }, (err) => {
      console.error('Fallback query listener error:', err);
      setError('Failed to establish database connection');
      setLoading(false);
    });

    return () => unsubscribe();
  }, [activeUserEmail, activeCommunityId, isAdmin, retryCount]);

  // Filter bookings based on current filter and search
  const filteredBookings = useMemo(() => {
    let filtered = [...bookings];
    const now = new Date();

    // Apply time-based filter
    switch (filter) {
      case 'current':
        filtered = filtered.filter(booking => 
          booking.status !== 'cancelled' && 
          booking.endTime >= now
        );
        break;
      case 'past':
        filtered = filtered.filter(booking => 
          booking.endTime < now || 
          booking.status === 'completed' || 
          booking.status === 'cancelled'
        );
        break;
      case 'all':
      default:
        // No additional filtering for 'all'
        break;
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(booking => booking.status === statusFilter);
    }

    // Apply search filter
    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(booking =>
        booking.amenityName.toLowerCase().includes(search) ||
        booking.userEmail.toLowerCase().includes(search) ||
        booking.userName?.toLowerCase().includes(search) ||
        booking.notes?.toLowerCase().includes(search)
      );
    }

    return filtered;
  }, [bookings, filter, statusFilter, searchTerm]);

  // Booking actions
  const cancelBooking = useCallback(async (bookingId: string, reason?: string) => {
    try {
      const booking = bookings.find(b => b.id === bookingId);
      if (!booking) throw new Error('Booking not found');

      await updateDoc(doc(db, 'bookings', bookingId), {
        status: 'cancelled',
        cancelledAt: Timestamp.now(),
        cancelledBy: session?.user?.email,
        adminCancellation: isAdmin && booking.userId !== session?.user?.email,
        cancellationReason: reason,
        updatedAt: Timestamp.now()
      });

      toast.success('Booking cancelled successfully');
      return true;
    } catch (err) {
      console.error('Error cancelling booking:', err);
      toast.error('Failed to cancel booking');
      return false;
    }
  }, [bookings, session?.user?.email, isAdmin]);

  const clearCancelledBooking = useCallback(async (bookingId: string) => {
    try {
      await deleteDoc(doc(db, 'bookings', bookingId));
      toast.success('Cancelled booking cleared');
      return true;
    } catch (err) {
      console.error('Error clearing booking:', err);
      toast.error('Failed to clear booking');
      return false;
    }
  }, []);

  const completeBooking = useCallback(async (bookingId: string) => {
    try {
      await updateDoc(doc(db, 'bookings', bookingId), {
        status: 'completed',
        checkOutTime: Timestamp.now(),
        updatedAt: Timestamp.now()
      });

      toast.success('Booking completed');
      return true;
    } catch (err) {
      console.error('Error completing booking:', err);
      toast.error('Failed to complete booking');
      return false;
    }
  }, []);

  const checkInBooking = useCallback(async (bookingId: string) => {
    try {
      await updateDoc(doc(db, 'bookings', bookingId), {
        status: 'in-progress',
        checkInTime: Timestamp.now(),
        updatedAt: Timestamp.now()
      });

      toast.success('Checked in successfully');
      return true;
    } catch (err) {
      console.error('Error checking in:', err);
      toast.error('Failed to check in');
      return false;
    }
  }, []);

  // Statistics
  const stats = useMemo(() => {
    const total = bookings.length;
    const current = bookings.filter(b => b.status !== 'cancelled' && b.endTime >= new Date()).length;
    const past = bookings.filter(b => b.endTime < new Date() || b.status === 'completed' || b.status === 'cancelled').length;
    const cancelled = bookings.filter(b => b.status === 'cancelled').length;
    const completed = bookings.filter(b => b.status === 'completed').length;
    const inProgress = bookings.filter(b => b.status === 'in-progress').length;

    return {
      total,
      current,
      past,
      cancelled,
      completed,
      inProgress,
      active: current - cancelled
    };
  }, [bookings]);

  return {
    bookings: filteredBookings,
    allBookings: bookings,
    loading,
    error,
    filter,
    setFilter,
    statusFilter,
    setStatusFilter,
    searchTerm,
    setSearchTerm,
    stats,
    actions: {
      cancelBooking,
      clearCancelledBooking,
      completeBooking,
      checkInBooking
    }
  };
}

export default useAdvancedBookings;