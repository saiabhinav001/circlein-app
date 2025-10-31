'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, Clock, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function BookingConfirmPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { data: session, status: sessionStatus } = useSession();

  const bookingId = params?.id as string;
  const action = searchParams?.get('action'); // 'confirm' or 'decline'

  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [bookingData, setBookingData] = useState<any>(null);

  // Fetch booking details
  useEffect(() => {
    if (sessionStatus === 'authenticated' && bookingId) {
      fetchBookingDetails();
    }
  }, [sessionStatus, bookingId]);

  // Auto-execute action if provided in URL
  useEffect(() => {
    if (bookingData && action && !processing && !result) {
      handleAction(action);
    }
  }, [bookingData, action]);

  const fetchBookingDetails = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/bookings/confirm/${bookingId}`);
      const data = await response.json();

      if (response.ok) {
        setBookingData(data.booking);
      } else {
        setError(data.error || 'Failed to load booking details');
      }
    } catch (err) {
      setError('Failed to load booking details');
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (selectedAction: string) => {
    setProcessing(true);
    setError(null);

    try {
      const response = await fetch(`/api/bookings/confirm/${bookingId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: selectedAction }),
      });

      const data = await response.json();

      if (response.ok) {
        setResult({
          success: true,
          action: selectedAction,
          message: data.message,
        });

        // Redirect after 3 seconds
        setTimeout(() => {
          router.push('/bookings');
        }, 3000);
      } else {
        setError(data.error || `Failed to ${selectedAction} booking`);
      }
    } catch (err) {
      setError(`Failed to ${selectedAction} booking`);
    } finally {
      setProcessing(false);
    }
  };

  // Loading state
  if (sessionStatus === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-slate-600 dark:text-slate-400">Loading booking details...</p>
        </div>
      </div>
    );
  }

  // Authentication required
  if (sessionStatus === 'unauthenticated') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8 max-w-md w-full mx-4"
        >
          <AlertCircle className="w-16 h-16 text-orange-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-center mb-4">Sign In Required</h1>
          <p className="text-slate-600 dark:text-slate-400 text-center mb-6">
            Please sign in to confirm your booking.
          </p>
          <Button
            onClick={() => router.push('/auth/signin')}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            Sign In
          </Button>
        </motion.div>
      </div>
    );
  }

  // Success state
  if (result?.success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8 max-w-md w-full"
        >
          {result.action === 'confirm' ? (
            <>
              <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-6" />
              <h1 className="text-3xl font-bold text-center mb-4 text-green-600">
                🎉 Booking Confirmed!
              </h1>
              <p className="text-slate-600 dark:text-slate-400 text-center mb-6">
                {result.message || 'Your booking has been confirmed successfully. You will receive a confirmation email with your QR code shortly.'}
              </p>
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 mb-6">
                <p className="text-sm text-green-800 dark:text-green-200 text-center">
                  ✅ Redirecting you to My Bookings in 3 seconds...
                </p>
              </div>
            </>
          ) : (
            <>
              <XCircle className="w-20 h-20 text-red-500 mx-auto mb-6" />
              <h1 className="text-3xl font-bold text-center mb-4 text-red-600">
                Booking Declined
              </h1>
              <p className="text-slate-600 dark:text-slate-400 text-center mb-6">
                {result.message || 'You have declined this booking. The spot has been offered to the next person in the waitlist.'}
              </p>
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
                <p className="text-sm text-blue-800 dark:text-blue-200 text-center">
                  ✅ Redirecting you to My Bookings in 3 seconds...
                </p>
              </div>
            </>
          )}
          <Button
            onClick={() => router.push('/bookings')}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            Go to My Bookings Now
          </Button>
        </motion.div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8 max-w-md w-full"
        >
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-center mb-4 text-red-600">Error</h1>
          <p className="text-slate-600 dark:text-slate-400 text-center mb-6">{error}</p>
          <Button
            onClick={() => router.push('/bookings')}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            Go to My Bookings
          </Button>
        </motion.div>
      </div>
    );
  }

  // Confirmation UI (when no action in URL)
  if (bookingData && !action) {
    const deadline = bookingData.confirmationDeadline 
      ? new Date(bookingData.confirmationDeadline._seconds * 1000)
      : null;
    const timeRemaining = bookingData.timeRemainingMs 
      ? Math.floor(bookingData.timeRemainingMs / (1000 * 60 * 60))
      : null;

    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8 max-w-2xl w-full"
        >
          <div className="text-center mb-8">
            <div className="text-6xl mb-4">🎉</div>
            <h1 className="text-3xl font-bold mb-2">You're Next in Line!</h1>
            <p className="text-slate-600 dark:text-slate-400">
              A spot has opened up for your waitlisted booking
            </p>
          </div>

          <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4">Booking Details</h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-slate-600 dark:text-slate-400">Amenity:</span>
                <span className="font-semibold">{bookingData.amenityName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600 dark:text-slate-400">Start Time:</span>
                <span className="font-semibold">
                  {bookingData.startTime?.toDate?.()?.toLocaleString() || 'N/A'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600 dark:text-slate-400">End Time:</span>
                <span className="font-semibold">
                  {bookingData.endTime?.toDate?.()?.toLocaleString() || 'N/A'}
                </span>
              </div>
            </div>
          </div>

          {deadline && timeRemaining !== null && (
            <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4 mb-8">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-5 h-5 text-orange-600" />
                <span className="font-semibold text-orange-800 dark:text-orange-200">
                  Confirmation Deadline
                </span>
              </div>
              <p className="text-sm text-orange-700 dark:text-orange-300">
                You have <strong>{timeRemaining} hours</strong> remaining to confirm this booking.
              </p>
              <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">
                Deadline: {deadline.toLocaleString()}
              </p>
            </div>
          )}

          <div className="mb-8">
            <p className="text-center text-lg font-semibold mb-4">
              Do you want to confirm this booking?
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Button
              onClick={() => handleAction('confirm')}
              disabled={processing}
              className="bg-green-600 hover:bg-green-700 text-white py-6 text-lg font-semibold"
            >
              {processing ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>✅ Yes, Confirm</>
              )}
            </Button>
            <Button
              onClick={() => handleAction('decline')}
              disabled={processing}
              className="bg-red-600 hover:bg-red-700 text-white py-6 text-lg font-semibold"
            >
              {processing ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>❌ No, Decline</>
              )}
            </Button>
          </div>

          <p className="text-center text-sm text-slate-500 dark:text-slate-400 mt-6">
            If you don't respond by the deadline, the spot will be offered to the next person.
          </p>
        </motion.div>
      </div>
    );
  }

  return null;
}
