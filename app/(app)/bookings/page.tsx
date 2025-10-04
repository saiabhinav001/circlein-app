'use client';

// Disable static generation for this page
export const dynamic = 'force-dynamic';

import { useSession } from 'next-auth/react';
import { motion } from 'framer-motion';
import { Skeleton } from '@/components/ui/skeleton';
import AdminBookingsLayout from '@/components/booking/AdminBookingsLayout';
import BookingErrorBoundary from '@/components/booking/BookingErrorBoundary';

export default function MyBookings() {
  const { data: session, status } = useSession();

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full flex items-center justify-center"
          >
            <div className="w-8 h-8 bg-white rounded-full"></div>
          </motion.div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Loading Your Bookings</h3>
          <p className="text-gray-600">Preparing your personalized experience...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Please sign in</h2>
          <p className="text-gray-600">You need to be signed in to view your bookings.</p>
        </div>
      </div>
    );
  }

  // Check if user is admin
  const isAdmin = (session.user as any)?.role === 'admin';

  return (
    <BookingErrorBoundary>
      <AdminBookingsLayout />
    </BookingErrorBoundary>
  );
}
