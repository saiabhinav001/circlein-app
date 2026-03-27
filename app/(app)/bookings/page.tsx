'use client';

// Disable static generation for this page
export const dynamic = 'force-dynamic';

import { useSession } from 'next-auth/react';
import { motion } from 'framer-motion';
import AdminBookingsLayout from '@/components/booking/AdminBookingsLayout';
import BookingErrorBoundary from '@/components/booking/BookingErrorBoundary';
import { Calendar } from 'lucide-react';

export default function MyBookings() {
  const { data: session, status } = useSession();

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          {/* Premium loader */}
          <div className="relative w-16 h-16 mx-auto mb-6">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="absolute inset-0 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-600 opacity-20"
            />
            <motion.div
              animate={{ rotate: -360 }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
              className="absolute inset-1 rounded-lg bg-gradient-to-br from-emerald-400 to-teal-500 opacity-40"
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <Calendar className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            </div>
          </div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
            Loading Bookings
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Preparing your schedule...
          </p>
        </motion.div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center p-8 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm max-w-sm mx-4"
        >
          <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
            <Calendar className="w-6 h-6 text-slate-400" />
          </div>
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">
            Sign in required
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Please sign in to view your bookings.
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <BookingErrorBoundary>
      <AdminBookingsLayout />
    </BookingErrorBoundary>
  );
}
