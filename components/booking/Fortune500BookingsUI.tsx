'use client';

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSession } from 'next-auth/react';
import { useTheme } from 'next-themes';
import QRCode from 'qrcode';
import { 
  Calendar, 
  Clock, 
  Users, 
  QrCode, 
  Search, 
  MoreHorizontal,
  User,
  Download,
  CheckCircle2,
  XCircle,
  LogIn,
  LogOut,
  X,
  Check,
  AlertTriangle,
  Copy,
  Eye,
  EyeOff,
  Timer,
  Building2,
  Shield,
  ArrowRight,
  Circle,
  Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { useSimpleBookings, SimpleBooking } from '@/hooks/useSimpleBookings';
import { toast } from 'sonner';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { formatDistanceToNow, format, isToday, isTomorrow, isYesterday } from 'date-fns';
import { cn } from '@/lib/utils';

interface Fortune500BookingsUIProps {
  isAdmin?: boolean;
}

export function Fortune500BookingsUI({ isAdmin = false }: Fortune500BookingsUIProps) {
  const { data: session } = useSession();
  const { theme } = useTheme();
  const [selectedBooking, setSelectedBooking] = useState<SimpleBooking | null>(null);
  const [showQRModal, setShowQRModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [mounted, setMounted] = useState(false);
  const [filter, setFilter] = useState<'current' | 'all' | 'past'>('current');
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string | null>(null);
  const [generatingQR, setGeneratingQR] = useState(false);
  const [showQRDetails, setShowQRDetails] = useState(true);
  const searchRef = useRef<HTMLInputElement>(null);

  const { bookings, loading, error, refetch } = useSimpleBookings();

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleManualRefresh = useCallback(() => {
    if (!loading) {
      localStorage.removeItem('amenity-cache');
      refetch();
    }
  }, [refetch, loading]);

  useEffect(() => {
    if (!showQRModal) {
      setQrCodeDataUrl(null);
      setGeneratingQR(false);
    }
  }, [showQRModal]);

  const getBookingStatus = useCallback((booking: SimpleBooking) => {
    if (booking.status === 'waitlist') return 'waitlist';
    if (booking.status === 'pending_confirmation') return 'pending_confirmation';
    if (booking.status === 'cancelled') return 'cancelled';
    if (booking.status === 'completed') return 'completed';
    if (booking.status === 'archived') return 'archived';

    const now = new Date();
    const startTime = new Date(booking.startTime);
    const endTime = new Date(booking.endTime);

    if (now < startTime) return 'upcoming';
    if (now >= startTime && now <= endTime) return 'active';
    return 'expired';
  }, []);

  const getStatusDisplay = useCallback((status: string) => {
    switch (status) {
      case 'upcoming':
        return { 
          label: 'Upcoming', 
          color: 'text-blue-600 dark:text-blue-400',
          bg: 'bg-blue-50 dark:bg-blue-500/10',
          dot: 'bg-blue-500'
        };
      case 'active':
        return { 
          label: 'Live', 
          color: 'text-emerald-600 dark:text-emerald-400',
          bg: 'bg-emerald-50 dark:bg-emerald-500/10',
          dot: 'bg-emerald-500'
        };
      case 'waitlist':
        return { 
          label: 'Waitlist', 
          color: 'text-amber-600 dark:text-amber-400',
          bg: 'bg-amber-50 dark:bg-amber-500/10',
          dot: 'bg-amber-500'
        };
      case 'pending_confirmation':
        return { 
          label: 'Pending', 
          color: 'text-sky-600 dark:text-sky-400',
          bg: 'bg-sky-50 dark:bg-sky-500/10',
          dot: 'bg-sky-500'
        };
      case 'expired':
        return { 
          label: 'Expired', 
          color: 'text-slate-500 dark:text-slate-400',
          bg: 'bg-slate-100 dark:bg-slate-500/10',
          dot: 'bg-slate-400'
        };
      case 'cancelled':
        return { 
          label: 'Cancelled', 
          color: 'text-slate-500 dark:text-slate-400',
          bg: 'bg-slate-100 dark:bg-slate-500/10',
          dot: 'bg-slate-400'
        };
      case 'completed':
        return { 
          label: 'Completed', 
          color: 'text-violet-600 dark:text-violet-400',
          bg: 'bg-violet-50 dark:bg-violet-500/10',
          dot: 'bg-violet-500'
        };
      default:
        return { 
          label: 'Unknown', 
          color: 'text-slate-500 dark:text-slate-400',
          bg: 'bg-slate-100 dark:bg-slate-500/10',
          dot: 'bg-slate-400'
        };
    }
  }, []);

  const stats = useMemo(() => ({
    active: bookings.filter(b => getBookingStatus(b) === 'active').length,
    completed: bookings.filter(b => {
      const status = getBookingStatus(b);
      return status === 'completed' || status === 'expired';
    }).length,
    total: bookings.length
  }), [bookings, getBookingStatus]);

  const filteredBookings = useMemo(() => {
    if (!bookings.length) return [];

    const bookingsWithStatus = bookings.map(booking => ({
      ...booking,
      calculatedStatus: getBookingStatus(booking)
    }));

    let filtered = bookingsWithStatus.filter(booking => {
      let passesTimeFilter = true;
      switch (filter) {
        case 'current':
          passesTimeFilter = booking.calculatedStatus === 'upcoming' || booking.calculatedStatus === 'active';
          break;
        case 'past':
          passesTimeFilter = booking.calculatedStatus === 'expired' || 
                            booking.calculatedStatus === 'completed' || 
                            booking.calculatedStatus === 'cancelled';
          break;
        default:
          passesTimeFilter = true;
      }
      
      let passesSearchFilter = true;
      if (searchTerm.trim()) {
        const searchLower = searchTerm.toLowerCase().trim();
        passesSearchFilter = 
          booking.amenityName?.toLowerCase().includes(searchLower) ||
          booking.userName?.toLowerCase().includes(searchLower) ||
          booking.calculatedStatus.toLowerCase().includes(searchLower) ||
          booking.amenityType?.toLowerCase().includes(searchLower);
      }
      
      return passesTimeFilter && passesSearchFilter;
    });

    return filtered.sort((a, b) => {
      if (filter === 'past') {
        return b.endTime.getTime() - a.endTime.getTime();
      } else if (filter === 'current') {
        if (a.calculatedStatus === 'active' && b.calculatedStatus !== 'active') return -1;
        if (b.calculatedStatus === 'active' && a.calculatedStatus !== 'active') return 1;
        return a.startTime.getTime() - b.startTime.getTime();
      } else {
        const createdDiff = b.createdAt.getTime() - a.createdAt.getTime();
        if (Math.abs(createdDiff) > 24 * 60 * 60 * 1000) return createdDiff;
        return b.startTime.getTime() - a.startTime.getTime();
      }
    });
  }, [bookings, filter, searchTerm, getBookingStatus]);

  const handleGenerateQRCode = async (booking: SimpleBooking) => {
    try {
      setGeneratingQR(true);
      
      const qrData = {
        type: 'FACILITY_ACCESS',
        version: '2.0',
        bookingId: booking.id,
        userId: booking.userId,
        userEmail: booking.userEmail,
        userName: booking.userName || 'Community Member',
        userFlatNumber: (booking as any).userFlatNumber || '',
        communityId: booking.communityId,
        amenityId: booking.amenityId,
        amenityName: booking.amenityName || 'Community Facility',
        amenityType: booking.amenityType || 'general',
        startTime: booking.startTime.toISOString(),
        endTime: booking.endTime.toISOString(),
        status: booking.status,
        accessCode: `${booking.id.slice(-8).toUpperCase()}`,
        securityHash: btoa(`${booking.id}-${booking.userId}-${Date.now()}`),
        timestamp: new Date().toISOString(),
        expiresAt: new Date(booking.endTime.getTime() + 30 * 60 * 1000).toISOString(),
        instructions: 'Present this QR code for facility access',
        emergencyContact: session?.user?.email || 'support@circlein.com'
      };

      const qrCodeUrl = await QRCode.toDataURL(JSON.stringify(qrData), {
        errorCorrectionLevel: 'H',
        type: 'image/png',
        margin: 2,
        color: {
          dark: '#0f172a',
          light: '#ffffff'
        },
        width: 240
      });

      setQrCodeDataUrl(qrCodeUrl);
      setSelectedBooking(booking);
      setShowQRModal(true);
    } catch (error) {
      console.error('QR generation error:', error);
      setSelectedBooking(booking);
      setShowQRModal(true);
    } finally {
      setGeneratingQR(false);
    }
  };

  const handleBookingAction = async (booking: SimpleBooking, action: string) => {
    try {
      const bookingRef = doc(db, 'bookings', booking.id);
      
      switch (action) {
        case 'cancel':
          await updateDoc(bookingRef, {
            status: 'cancelled',
            cancelledAt: new Date(),
            cancelledBy: booking.userId
          });
          
          try {
            await fetch('/api/notifications/email', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                type: 'booking_cancellation',
                data: {
                  userEmail: booking.userId,
                  userName: 'Resident',
                  amenityName: booking.amenityName,
                  date: new Date(booking.startTime).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  }),
                  timeSlot: `${new Date(booking.startTime).toLocaleTimeString('en-US', {
                    hour: 'numeric',
                    minute: '2-digit',
                    hour12: true
                  })} - ${new Date(booking.endTime).toLocaleTimeString('en-US', {
                    hour: 'numeric',
                    minute: '2-digit',
                    hour12: true
                  })}`,
                  bookingId: booking.id,
                  isAdminCancellation: false,
                }
              })
            });
          } catch (emailError) {
            console.error('Failed to send cancellation email:', emailError);
          }
          
          toast.success('Booking cancelled');
          break;
          
        case 'checkin':
          await updateDoc(bookingRef, { status: 'active' });
          toast.success('Checked in successfully');
          break;
          
        case 'complete':
          await updateDoc(bookingRef, { status: 'completed' });
          toast.success('Booking completed');
          break;
          
        case 'clear':
          await updateDoc(bookingRef, { status: 'archived' });
          toast.success('Booking cleared');
          break;
      }
      
      refetch();
    } catch (error) {
      console.error(`Failed to ${action} booking:`, error);
      toast.error(`Failed to ${action} booking`);
    }
  };

  const isCheckInAvailable = (booking: SimpleBooking) => {
    const now = new Date();
    const checkInWindow = new Date(booking.startTime.getTime() - 15 * 60 * 1000);
    const checkOutWindow = new Date(booking.endTime.getTime() + 15 * 60 * 1000);
    
    return booking.status === 'confirmed' && 
           now >= checkInWindow && now <= checkOutWindow;
  };

  const formatBookingTime = (date: Date) => {
    if (isToday(date)) return `Today at ${format(date, 'h:mm a')}`;
    if (isTomorrow(date)) return `Tomorrow at ${format(date, 'h:mm a')}`;
    if (isYesterday(date)) return `Yesterday at ${format(date, 'h:mm a')}`;
    return format(date, 'MMM d, h:mm a');
  };

  const calculateDuration = (startTime: Date, endTime: Date) => {
    const mins = Math.round((endTime.getTime() - startTime.getTime()) / (1000 * 60));
    if (mins >= 60) {
      const hrs = Math.floor(mins / 60);
      const remainingMins = mins % 60;
      return remainingMins > 0 ? `${hrs}h ${remainingMins}m` : `${hrs}h`;
    }
    return `${mins}m`;
  };

  if (!mounted) return null;

  // Loading State
  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-slate-950">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
          {/* Header skeleton */}
          <div className="mb-10">
            <div className="h-9 w-48 bg-slate-100 dark:bg-slate-800 rounded-lg animate-pulse mb-2" />
            <div className="h-5 w-72 bg-slate-100 dark:bg-slate-800 rounded animate-pulse" />
          </div>
          
          {/* Stats skeleton */}
          <div className="h-12 w-64 bg-slate-50 dark:bg-slate-900 rounded-xl animate-pulse mb-8" />
          
          {/* Search skeleton */}
          <div className="h-11 w-full bg-slate-50 dark:bg-slate-900 rounded-xl animate-pulse mb-8" />
          
          {/* Cards skeleton */}
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-24 bg-slate-50 dark:bg-slate-900 rounded-2xl animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Error State
  if (error) {
    const isAuthIssue = error.includes('permission-denied') || error.includes('unauthenticated');
    
    return (
      <div className="min-h-screen bg-white dark:bg-slate-950 flex items-center justify-center p-6">
        <div className="max-w-sm w-full text-center">
          <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-slate-500" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
            {isAuthIssue ? 'Authentication Required' : 'Unable to Load'}
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
            {isAuthIssue 
              ? 'Please sign in to view your bookings.'
              : 'Something went wrong. Please try again.'}
          </p>
          <Button 
            onClick={() => window.location.reload()} 
            className="h-10 px-5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 rounded-lg"
          >
            {isAuthIssue ? 'Sign In' : 'Try Again'}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 transition-colors duration-200">
      <div className="max-w-4xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-10 md:py-12">
        
        {/* Page Header - Very Calm */}
        <header className="mb-6 sm:mb-10">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-semibold text-slate-900 dark:text-white tracking-tight">
            {isAdmin && session?.user?.role === 'admin' ? 'All Bookings' : 'My Bookings'}
          </h1>
          <p className="mt-1 sm:mt-1.5 text-sm sm:text-base text-slate-500 dark:text-slate-400">
            {isAdmin 
              ? 'Manage facility reservations across your community.' 
              : 'Track and manage your facility reservations.'}
          </p>
        </header>

        {/* Silent Status Overview - Inline indicators, not cards */}
        <div className="mb-6 sm:mb-8 overflow-x-auto">
          <div className="inline-flex items-center gap-4 sm:gap-6 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/50 min-w-max">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
              <span className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 whitespace-nowrap">
                <span className="font-medium text-slate-900 dark:text-white">{stats.active}</span> Active
              </span>
            </div>
            <div className="w-px h-4 bg-slate-200 dark:bg-slate-700 shrink-0" />
            <div className="flex items-center gap-1.5 sm:gap-2">
              <span className="w-2 h-2 rounded-full bg-violet-500 shrink-0" />
              <span className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 whitespace-nowrap">
                <span className="font-medium text-slate-900 dark:text-white">{stats.completed}</span> Completed
              </span>
            </div>
            <div className="w-px h-4 bg-slate-200 dark:bg-slate-700 shrink-0" />
            <div className="flex items-center gap-1.5 sm:gap-2">
              <span className="w-2 h-2 rounded-full bg-slate-400 shrink-0" />
              <span className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 whitespace-nowrap">
                <span className="font-medium text-slate-900 dark:text-white">{stats.total}</span> Total
              </span>
            </div>
          </div>
        </div>

        {/* Search + Filter - Unified, Subtle */}
        <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 sm:left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <Input
              ref={searchRef}
              placeholder="Search bookings..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={cn(
                "w-full h-10 sm:h-11 pl-9 sm:pl-10 pr-9 sm:pr-10",
                "text-sm text-slate-900 dark:text-white",
                "placeholder:text-slate-400 dark:placeholder:text-slate-500",
                "bg-slate-50 dark:bg-slate-900",
                "border-0 ring-1 ring-slate-200 dark:ring-slate-800",
                "hover:ring-slate-300 dark:hover:ring-slate-700",
                "focus:ring-2 focus:ring-slate-900 dark:focus:ring-slate-300",
                "rounded-xl transition-shadow duration-150"
              )}
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 sm:right-3 top-1/2 -translate-y-1/2 p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Segmented Filter */}
          <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-900 rounded-xl w-full sm:w-auto">
            {[
              { key: 'current', label: 'Current' },
              { key: 'all', label: 'All' },
              { key: 'past', label: 'Past' }
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key as any)}
                className={cn(
                  "flex-1 sm:flex-initial px-3 sm:px-4 py-2 text-sm font-medium rounded-lg transition-all duration-150",
                  filter === tab.key
                    ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Bookings List */}
        <AnimatePresence mode="wait">
          {filteredBookings.length === 0 ? (
            /* Empty State - Premium Guidance */
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="py-20 flex flex-col items-center text-center"
            >
              <div className="w-16 h-16 mb-6 rounded-2xl bg-slate-100 dark:bg-slate-900 flex items-center justify-center">
                <Calendar className="w-7 h-7 text-slate-400" />
              </div>
              <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">
                {searchTerm ? 'No results found' : 'No reservations yet'}
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xs mb-6">
                {searchTerm 
                  ? `We couldn't find any bookings matching "${searchTerm}".`
                  : 'Your reservations will appear here when you book a facility.'}
              </p>
              {!searchTerm && (
                <Button 
                  onClick={() => window.location.href = '/dashboard'}
                  className="h-10 px-5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 rounded-lg font-medium"
                >
                  Browse Amenities
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              )}
            </motion.div>
          ) : (
            /* Booking Cards */
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="space-y-3"
            >
              {filteredBookings.map((booking, index) => {
                const status = getBookingStatus(booking);
                const statusDisplay = getStatusDisplay(status);
                const checkInAvailable = isCheckInAvailable(booking);

                return (
                  <motion.div
                    key={booking.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, delay: Math.min(index * 0.03, 0.12) }}
                  >
                    <div className={cn(
                      "group relative",
                      "bg-white dark:bg-slate-900",
                      "rounded-2xl p-4 sm:p-5",
                      "ring-1 ring-slate-200/80 dark:ring-slate-800",
                      "hover:ring-slate-300 dark:hover:ring-slate-700",
                      "hover:shadow-lg hover:shadow-slate-200/50 dark:hover:shadow-slate-900/50",
                      "transition-all duration-200"
                    )}>
                      <div className="flex items-start gap-3 sm:gap-4">
                        {/* Facility Icon - Hidden on smallest screens */}
                        <div className={cn(
                          "shrink-0 w-10 h-10 sm:w-11 sm:h-11 rounded-xl hidden xs:flex items-center justify-center",
                          status === 'active' 
                            ? "bg-emerald-100 dark:bg-emerald-500/10" 
                            : "bg-slate-100 dark:bg-slate-800"
                        )}>
                          <Building2 className={cn(
                            "w-4 h-4 sm:w-5 sm:h-5",
                            status === 'active' 
                              ? "text-emerald-600 dark:text-emerald-400" 
                              : "text-slate-500 dark:text-slate-400"
                          )} />
                        </div>

                        {/* Main Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-3">
                            <div className="min-w-0">
                              {/* Facility Name */}
                              <h3 className="font-medium text-slate-900 dark:text-white truncate">
                                {booking.amenityName || 'Community Facility'}
                              </h3>
                              
                              {/* Time */}
                              <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
                                {formatBookingTime(booking.startTime)} · {calculateDuration(booking.startTime, booking.endTime)}
                              </p>
                            </div>

                            {/* Status Badge - Quiet */}
                            <div className={cn(
                              "shrink-0 self-start mt-0.5 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium",
                              statusDisplay.bg
                            )}>
                              <span className={cn("w-1.5 h-1.5 rounded-full", statusDisplay.dot)} />
                              <span className={statusDisplay.color}>{statusDisplay.label}</span>
                            </div>
                          </div>

                          {/* Live Indicator */}
                          {status === 'active' && (
                            <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-500/10 rounded-lg">
                              <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                              </span>
                              <span className="text-xs font-medium text-emerald-700 dark:text-emerald-400">
                                Session in progress
                              </span>
                            </div>
                          )}

                          {/* Waitlist Info */}
                          {status === 'waitlist' && (booking as any).waitlistPosition && (
                            <div className="mt-3 text-sm text-amber-700 dark:text-amber-400">
                              Position #{(booking as any).waitlistPosition} in queue
                            </div>
                          )}

                          {/* Pending Confirmation */}
                          {status === 'pending_confirmation' && (booking as any).confirmationDeadline && (
                            <div className="mt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-3 p-3 bg-sky-50 dark:bg-sky-500/10 rounded-xl">
                              <span className="text-xs sm:text-sm text-sky-700 dark:text-sky-400">
                                Confirm by {new Date((booking as any).confirmationDeadline.seconds * 1000).toLocaleString()}
                              </span>
                              <Button
                                size="sm"
                                onClick={async () => {
                                  try {
                                    const response = await fetch(`/api/bookings/confirm/${booking.id}`, { method: 'POST' });
                                    if (response.ok) {
                                      toast.success('Booking confirmed');
                                      refetch();
                                    } else {
                                      toast.error('Failed to confirm');
                                    }
                                  } catch {
                                    toast.error('Confirmation error');
                                  }
                                }}
                                className="h-8 px-3 text-xs font-medium bg-sky-600 hover:bg-sky-700 text-white rounded-lg w-full sm:w-auto"
                              >
                                Confirm
                              </Button>
                            </div>
                          )}

                          {/* Check-in Available */}
                          {checkInAvailable && (
                            <div className="mt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-3 p-3 bg-emerald-50 dark:bg-emerald-500/10 rounded-xl">
                              <span className="text-xs sm:text-sm text-emerald-700 dark:text-emerald-400">
                                Check-in available
                              </span>
                              <Button
                                size="sm"
                                onClick={() => handleBookingAction(booking, 'checkin')}
                                className="h-8 px-3 text-xs font-medium bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg w-full sm:w-auto"
                              >
                                <LogIn className="w-3.5 h-3.5 mr-1" />
                                Check In
                              </Button>
                            </div>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleGenerateQRCode(booking)}
                            className={cn(
                              "h-8 sm:h-9 px-2 sm:px-3 rounded-lg text-xs sm:text-sm font-medium",
                              "text-slate-600 dark:text-slate-300",
                              "hover:text-slate-900 dark:hover:text-white",
                              "hover:bg-slate-100 dark:hover:bg-slate-800"
                            )}
                          >
                            <QrCode className="w-4 h-4 sm:mr-1.5" />
                            <span className="hidden sm:inline">QR</span>
                          </Button>

                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-8 w-8 sm:h-9 sm:w-9 p-0 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                              >
                                <MoreHorizontal className="w-4 h-4 text-slate-500" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent 
                              align="end" 
                              className="w-44 p-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl"
                            >
                              <DropdownMenuItem 
                                onClick={() => handleGenerateQRCode(booking)} 
                                className="rounded-lg text-sm cursor-pointer"
                              >
                                <QrCode className="w-4 h-4 mr-2 text-slate-500" />
                                View QR Code
                              </DropdownMenuItem>
                              {checkInAvailable && (
                                <DropdownMenuItem 
                                  onClick={() => handleBookingAction(booking, 'checkin')} 
                                  className="rounded-lg text-sm cursor-pointer text-emerald-600 dark:text-emerald-400"
                                >
                                  <LogIn className="w-4 h-4 mr-2" />
                                  Check In
                                </DropdownMenuItem>
                              )}
                              {status === 'active' && (
                                <DropdownMenuItem 
                                  onClick={() => handleBookingAction(booking, 'complete')} 
                                  className="rounded-lg text-sm cursor-pointer"
                                >
                                  <LogOut className="w-4 h-4 mr-2 text-slate-500" />
                                  Check Out
                                </DropdownMenuItem>
                              )}
                              {status === 'upcoming' && (
                                <DropdownMenuItem 
                                  onClick={() => handleBookingAction(booking, 'cancel')} 
                                  className="rounded-lg text-sm cursor-pointer text-rose-600 dark:text-rose-400"
                                >
                                  <XCircle className="w-4 h-4 mr-2" />
                                  Cancel
                                </DropdownMenuItem>
                              )}
                              {(status === 'completed' || status === 'cancelled' || status === 'expired') && (
                                <DropdownMenuItem 
                                  onClick={() => handleBookingAction(booking, 'clear')} 
                                  className="rounded-lg text-sm cursor-pointer text-slate-500"
                                >
                                  <X className="w-4 h-4 mr-2" />
                                  Remove
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>

        {/* QR Code Modal - Security Feel */}
        <DialogPrimitive.Root open={showQRModal} onOpenChange={setShowQRModal}>
          <DialogPrimitive.Portal>
            <DialogPrimitive.Overlay 
              className={cn(
                "fixed inset-0 z-[9999]",
                "bg-slate-900/60 dark:bg-slate-950/80",
                "backdrop-blur-sm",
                "data-[state=open]:animate-in data-[state=closed]:animate-out",
                "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
                "duration-200"
              )} 
            />
            <DialogPrimitive.Content
              className={cn(
                "fixed left-[50%] top-[50%] z-[10000]",
                "w-[calc(100%-2rem)] max-w-sm translate-x-[-50%] translate-y-[-50%]",
                "bg-white dark:bg-slate-900",
                "rounded-2xl shadow-2xl",
                "ring-1 ring-slate-200 dark:ring-slate-800",
                "overflow-hidden",
                "data-[state=open]:animate-in data-[state=closed]:animate-out",
                "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
                "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
                "data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%]",
                "data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]",
                "duration-200"
              )}
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                    <Shield className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                  </div>
                  <div>
                    <h2 className="font-semibold text-slate-900 dark:text-white">Facility Access</h2>
                    <p className="text-xs text-slate-500">Present for entry</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowQRModal(false)}
                  className="p-2 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {selectedBooking && (
                <div className="p-5">
                  {/* QR Code - Centered, Breathing */}
                  <div className="flex justify-center mb-5">
                    {qrCodeDataUrl && !generatingQR ? (
                      <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
                        <img 
                          src={qrCodeDataUrl} 
                          alt="Access QR Code" 
                          className="w-48 h-48"
                        />
                      </div>
                    ) : (
                      <div className="w-56 h-56 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center">
                        <div className="text-center">
                          <div className="w-6 h-6 mx-auto mb-2 border-2 border-slate-300 dark:border-slate-600 border-t-slate-600 dark:border-t-slate-400 rounded-full animate-spin" />
                          <p className="text-xs text-slate-500">Generating...</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Access Code */}
                  <div className="mb-5 p-3.5 bg-slate-900 dark:bg-slate-800 rounded-xl">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-[10px] text-slate-400 font-medium uppercase tracking-wider mb-0.5">Access Code</div>
                        <div className="font-mono text-lg font-semibold text-white tracking-widest">
                          {showQRDetails ? selectedBooking.id.slice(-8).toUpperCase() : '••••••••'}
                        </div>
                      </div>
                      <button
                        onClick={() => setShowQRDetails(!showQRDetails)}
                        className="p-2 rounded-lg hover:bg-slate-800 dark:hover:bg-slate-700 transition-colors"
                      >
                        {showQRDetails ? (
                          <Eye className="w-4 h-4 text-slate-400" />
                        ) : (
                          <EyeOff className="w-4 h-4 text-slate-400" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Booking Details */}
                  <AnimatePresence>
                    {showQRDetails && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.15 }}
                        className="space-y-2 mb-5"
                      >
                        <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                          <Building2 className="w-4 h-4 text-slate-400 shrink-0" />
                          <div className="min-w-0">
                            <div className="text-sm font-medium text-slate-900 dark:text-white truncate">
                              {selectedBooking.amenityName}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                          <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                          <div className="min-w-0">
                            <div className="text-sm text-slate-700 dark:text-slate-300">
                              {format(selectedBooking.startTime, 'EEE, MMM d')} · {format(selectedBooking.startTime, 'h:mm a')} – {format(selectedBooking.endTime, 'h:mm a')}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Actions - Subtle */}
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      onClick={() => {
                        if (qrCodeDataUrl) {
                          const link = document.createElement('a');
                          link.download = `access-${selectedBooking.id.slice(-8)}.png`;
                          link.href = qrCodeDataUrl;
                          link.click();
                          toast.success('QR code downloaded');
                        }
                      }}
                      disabled={!qrCodeDataUrl}
                      className="h-10 bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 rounded-lg text-sm font-medium disabled:opacity-50"
                    >
                      <Download className="w-4 h-4 mr-1.5" />
                      Download
                    </Button>

                    <Button
                      onClick={() => {
                        const details = `Access Code: ${selectedBooking.id.slice(-8).toUpperCase()}\nFacility: ${selectedBooking.amenityName}\nTime: ${format(selectedBooking.startTime, 'MMM d, h:mm a')} - ${format(selectedBooking.endTime, 'h:mm a')}`;
                        navigator.clipboard.writeText(details);
                        toast.success('Copied to clipboard');
                      }}
                      variant="outline"
                      className="h-10 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg text-sm font-medium"
                    >
                      <Copy className="w-4 h-4 mr-1.5" />
                      Copy
                    </Button>
                  </div>
                </div>
              )}
            </DialogPrimitive.Content>
          </DialogPrimitive.Portal>
        </DialogPrimitive.Root>
      </div>
    </div>
  );
}

export default Fortune500BookingsUI;
