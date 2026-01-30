'use client';

import React, { useState, useMemo, useEffect, memo, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  Users, 
  Plus,
  Search,
  Eye,
  Edit,
  Trash2,
  CheckCircle,
  AlertCircle,
  XCircle,
  MoreHorizontal,
  RefreshCw,
  Building2,
  X,
  Shield
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/useToast';
import { useCommunityNotifications } from '@/hooks/useCommunityNotifications';
import Link from 'next/link';
import { CalendarErrorBoundary } from '@/components/calendar/CalendarErrorBoundary';

// ============================================================================
// UTILITIES
// ============================================================================

const formatDateConsistently = (date: Date): string => {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

const formatTimeConsistently = (date: Date): string => {
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const displayHour = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
  const displayMinutes = String(minutes).padStart(2, '0');
  return `${displayHour}:${displayMinutes} ${ampm}`;
};

const isSameDay = (date1: Date, date2: Date): boolean => {
  return formatDateConsistently(date1) === formatDateConsistently(date2);
};

// ============================================================================
// TYPES
// ============================================================================

interface Booking {
  id: string;
  amenityId: string;
  amenityName: string;
  startTime: Date;
  endTime: Date;
  attendees: string[];
  status: string;
  qrId: string;
  userId: string;
  communityId: string;
  checkInTime?: Date;
  checkOutTime?: Date;
  userName?: string;
  userFlatNumber?: string;
  userEmail?: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const amenityTypes = [
  'All Amenities',
  'Community Clubhouse',
  'Gym',
  'Swimming Pool',
  'Tennis Court',
  'Basketball Court',
  'Playground'
];

// Status configurations - minimal, functional
const statusConfig = {
  confirmed: { 
    color: 'bg-emerald-500', 
    text: 'text-emerald-700 dark:text-emerald-400',
    bg: 'bg-emerald-50 dark:bg-emerald-500/10',
    label: 'Confirmed',
    Icon: CheckCircle
  },
  pending: { 
    color: 'bg-amber-500', 
    text: 'text-amber-700 dark:text-amber-400',
    bg: 'bg-amber-50 dark:bg-amber-500/10',
    label: 'Pending',
    Icon: AlertCircle
  },
  cancelled: { 
    color: 'bg-slate-400', 
    text: 'text-slate-600 dark:text-slate-400',
    bg: 'bg-slate-100 dark:bg-slate-800',
    label: 'Cancelled',
    Icon: XCircle
  }
};

// ============================================================================
// ANIMATION VARIANTS - Subtle, professional
// ============================================================================

const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: 0.15 }
};

const slideUp = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.2, ease: "easeOut" as const }
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function CalendarPage() {
  const { data: session } = useSession();
  const { toast } = useToast();
  const { sendCommunityNotification } = useCommunityNotifications();
  
  const isAdmin = session?.user?.role === 'admin';
  
  // State
  const [isHydrated, setIsHydrated] = useState(false);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'day'>('month');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAmenity, setSelectedAmenity] = useState('All Amenities');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [showBookingDialog, setShowBookingDialog] = useState(false);

  // Hydration
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  // Fetch bookings
  useEffect(() => {
    if (session?.user?.email && session?.user?.communityId) {
      fetchBookings();
    }
  }, [session]);

  const fetchBookings = async (isRefresh = false) => {
    if (!session?.user?.email || !session?.user?.communityId) return;

    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      
      const q = query(
        collection(db, 'bookings'),
        where('communityId', '==', session.user.communityId)
      );

      const querySnapshot = await getDocs(q);
      const bookingList: Booking[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        bookingList.push({
          id: doc.id,
          amenityId: data.amenityId,
          amenityName: data.amenityName,
          startTime: data.startTime.toDate(),
          endTime: data.endTime.toDate(),
          attendees: data.attendees || [],
          status: data.status || 'confirmed',
          qrId: data.qrId,
          userId: data.userId,
          communityId: data.communityId,
          userName: data.userName,
          userFlatNumber: data.userFlatNumber || data.flatNumber,
          userEmail: data.userEmail
        });
      });

      setBookings(bookingList);
    } catch (error) {
      console.error('Error fetching bookings:', error);
      setBookings([]);
      toast({
        title: "Error",
        description: "Failed to load bookings. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Filtered bookings
  const filteredBookings = useMemo(() => {
    return bookings.filter(booking => {
      const matchesSearch = booking.amenityName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           booking.userId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           booking.userName?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesAmenity = selectedAmenity === 'All Amenities' || booking.amenityName === selectedAmenity;
      const matchesStatus = selectedStatus === 'all' || booking.status === selectedStatus;
      return matchesSearch && matchesAmenity && matchesStatus;
    });
  }, [bookings, searchQuery, selectedAmenity, selectedStatus]);

  // Selected date bookings
  const selectedDateBookings = useMemo(() => {
    if (!selectedDate) return [];
    return filteredBookings.filter(booking => isSameDay(new Date(booking.startTime), selectedDate));
  }, [selectedDate, filteredBookings]);

  // Booking dates for calendar highlights
  const bookingDates = useMemo(() => {
    return filteredBookings.map(booking => new Date(booking.startTime));
  }, [filteredBookings]);

  // Stats
  const stats = useMemo(() => ({
    total: filteredBookings.length,
    confirmed: filteredBookings.filter(b => b.status === 'confirmed').length,
    pending: filteredBookings.filter(b => b.status === 'pending').length,
    cancelled: filteredBookings.filter(b => b.status === 'cancelled').length,
  }), [filteredBookings]);

  // Handlers
  const handleRefresh = useCallback(() => {
    fetchBookings(true);
    toast({ title: "Refreshed", description: "Calendar data updated." });
  }, []);

  const navigateMonth = useCallback((direction: 'prev' | 'next') => {
    setCurrentMonth(prev => {
      const newMonth = new Date(prev);
      newMonth.setMonth(prev.getMonth() + (direction === 'prev' ? -1 : 1));
      return newMonth;
    });
  }, []);

  const handleBookingAction = async (action: string, booking: Booking) => {
    switch (action) {
      case 'view':
        setSelectedBooking(booking);
        setShowBookingDialog(true);
        break;
      case 'edit':
        toast({ title: "Edit Booking", description: "Edit functionality would open here." });
        break;
      case 'cancel':
        await handleCancelBooking(booking);
        break;
      case 'approve':
        toast({ title: "Booking Approved", description: `${booking.amenityName} booking approved.` });
        fetchBookings(true);
        break;
    }
  };

  const handleCancelBooking = async (booking: Booking) => {
    try {
      if (booking.checkInTime || booking.checkOutTime) {
        toast({
          title: "Cannot Cancel",
          description: "This booking has already been checked in.",
          variant: "destructive",
        });
        return;
      }

      const now = new Date();
      if (new Date(booking.endTime) < now) {
        toast({
          title: "Cannot Cancel",
          description: "This booking has already ended.",
          variant: "destructive",
        });
        return;
      }

      const canCancel = isAdmin || booking.userId === session?.user?.email;
      if (!canCancel) {
        toast({
          title: "Access Denied",
          description: "You can only cancel your own bookings.",
          variant: "destructive",
        });
        return;
      }

      if (isAdmin && booking.userId !== session?.user?.email) {
        const confirmed = window.confirm(
          `Cancel this booking for ${booking.userName || booking.userId}?\n\n` +
          `${booking.amenityName}\n` +
          `${formatDateConsistently(booking.startTime)} · ${formatTimeConsistently(booking.startTime)}`
        );
        if (!confirmed) return;
      }

      const cancelResponse = await fetch(`/api/bookings/cancel/${booking.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!cancelResponse.ok) {
        const errorData = await cancelResponse.json();
        throw new Error(errorData.error || 'Failed to cancel booking');
      }

      const cancelData = await cancelResponse.json();

      if (cancelData.waitlistPromoted) {
        toast({
          title: "Cancelled & Waitlist Promoted",
          description: `Booking cancelled. Next person (${cancelData.promotedUser}) has been notified.`,
        });
      } else {
        const isAdminCancellation = isAdmin && booking.userId !== session?.user?.email;
        toast({ 
          title: isAdminCancellation ? "Booking Cancelled (Admin)" : "Booking Cancelled", 
          description: isAdminCancellation 
            ? `The booking for ${booking.userName || 'resident'} has been cancelled. They will receive an email notification.`
            : "Your booking has been successfully cancelled."
        });
      }

      setShowBookingDialog(false);
      fetchBookings(true);
    } catch (error) {
      console.error('Error cancelling booking:', error);
      toast({
        title: "Error",
        description: "Failed to cancel booking.",
        variant: "destructive",
      });
    }
  };

  // ============================================================================
  // BOOKING CARD COMPONENT - Premium, minimal
  // ============================================================================

  const BookingCard = memo(function BookingCard({ 
    booking, 
    isCompact = false 
  }: { 
    booking: Booking; 
    isCompact?: boolean;
  }) {
    const config = statusConfig[booking.status as keyof typeof statusConfig] || statusConfig.confirmed;
    const isOwn = booking.userId === session?.user?.email;
    const isCheckedIn = !!(booking.checkInTime || booking.checkOutTime);
    
    return (
      <motion.div
        layout
        {...fadeIn}
        className={cn(
          "group relative rounded-xl border transition-all duration-150",
          "bg-white dark:bg-slate-900",
          "border-slate-200 dark:border-slate-800",
          "hover:border-slate-300 dark:hover:border-slate-700",
          "hover:shadow-sm"
        )}
      >
        {/* Status accent line */}
        <div className={cn("absolute left-0 top-3 bottom-3 w-0.5 rounded-full", config.color)} />
        
        <div className={cn("p-4", isCompact ? "py-3" : "py-4", "pl-5")}>
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              {/* Header */}
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <h3 className={cn(
                  "font-semibold text-slate-900 dark:text-white truncate",
                  isCompact ? "text-sm" : "text-base"
                )}>
                  {booking.amenityName}
                </h3>
                
                {/* Minimal status indicator */}
                <span className={cn(
                  "shrink-0 text-xs font-medium px-2 py-0.5 rounded-md",
                  config.bg, config.text
                )}>
                  {config.label}
                </span>
                
                {isCheckedIn && (
                  <span className="shrink-0 text-xs font-medium px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400">
                    Checked In
                  </span>
                )}
              </div>
              
              {/* Meta info */}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-500 dark:text-slate-400">
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  {formatTimeConsistently(booking.startTime)} – {formatTimeConsistently(booking.endTime)}
                </span>
                <span className="flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5" />
                  {booking.userName || 'Resident'}
                  {booking.userFlatNumber && (
                    <span className="text-slate-400 dark:text-slate-500">
                      · Flat {booking.userFlatNumber}
                    </span>
                  )}
                </span>
              </div>
              
              {/* Tags */}
              {!isCompact && (
                <div className="flex items-center gap-2 mt-2">
                  {isOwn && (
                    <span className="text-xs text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                      Your booking
                    </span>
                  )}
                  {isAdmin && !isOwn && (
                    <span className="text-xs text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 px-2 py-0.5 rounded">
                      Admin view
                    </span>
                  )}
                </div>
              )}
            </div>
            
            {/* Actions - always visible on mobile, hover on desktop */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-8 w-8 p-0 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
                >
                  <MoreHorizontal className="w-4 h-4 text-slate-500" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 rounded-xl border-slate-200 dark:border-slate-800 shadow-lg">
                <DropdownMenuItem 
                  onClick={() => handleBookingAction('view', booking)} 
                  className="rounded-lg cursor-pointer"
                >
                  <Eye className="w-4 h-4 mr-2 text-slate-500" />
                  View Details
                </DropdownMenuItem>
                
                {(isAdmin || isOwn) && (
                  <DropdownMenuItem 
                    onClick={() => handleBookingAction('edit', booking)} 
                    className="rounded-lg cursor-pointer"
                  >
                    <Edit className="w-4 h-4 mr-2 text-slate-500" />
                    Edit
                  </DropdownMenuItem>
                )}
                
                {isAdmin && booking.status === 'pending' && (
                  <DropdownMenuItem 
                    onClick={() => handleBookingAction('approve', booking)} 
                    className="rounded-lg cursor-pointer"
                  >
                    <CheckCircle className="w-4 h-4 mr-2 text-emerald-500" />
                    Approve
                  </DropdownMenuItem>
                )}
                
                {!isCheckedIn && (isAdmin || isOwn) && booking.status !== 'cancelled' && (
                  <DropdownMenuItem 
                    onClick={() => handleBookingAction('cancel', booking)}
                    className="rounded-lg cursor-pointer text-red-600 dark:text-red-400 focus:text-red-600 dark:focus:text-red-400"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Cancel
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </motion.div>
    );
  });

  // ============================================================================
  // LOADING STATE
  // ============================================================================

  if (!isHydrated) {
    return (
      <CalendarErrorBoundary>
        <div className="min-h-screen bg-white dark:bg-slate-950">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="animate-pulse space-y-6">
              <div className="h-8 w-32 bg-slate-200 dark:bg-slate-800 rounded-lg" />
              <div className="h-4 w-64 bg-slate-100 dark:bg-slate-900 rounded" />
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="h-80 bg-slate-100 dark:bg-slate-900 rounded-xl" />
                <div className="lg:col-span-2 h-80 bg-slate-100 dark:bg-slate-900 rounded-xl" />
              </div>
            </div>
          </div>
        </div>
      </CalendarErrorBoundary>
    );
  }

  // ============================================================================
  // MAIN RENDER
  // ============================================================================

  return (
    <CalendarErrorBoundary>
      <div className="min-h-screen bg-white dark:bg-slate-950 transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10">
          <motion.div {...slideUp} className="space-y-6 sm:space-y-8">
            
            {/* ================================================================
                HEADER - Executive-grade, calm
            ================================================================ */}
            <header className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
              <div>
                <div className="flex items-center gap-3 mb-1.5">
                  <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-900">
                    <CalendarIcon className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                  </div>
                  <h1 className="text-xl sm:text-2xl lg:text-3xl font-semibold text-slate-900 dark:text-white tracking-tight">
                    Calendar
                  </h1>
                </div>
                <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400">
                  {isAdmin ? 'Manage community bookings and events.' : 'View and manage your reservations.'}
                </p>
              </div>
              
              <div className="flex items-center gap-2 sm:gap-3">
                <Button 
                  variant="outline" 
                  onClick={handleRefresh} 
                  disabled={refreshing}
                  className={cn(
                    "h-9 w-9 sm:h-10 sm:w-auto sm:px-4 rounded-lg text-sm font-medium",
                    "border-slate-200 dark:border-slate-800",
                    "hover:bg-slate-50 dark:hover:bg-slate-900",
                    "transition-colors duration-150",
                    "flex items-center justify-center"
                  )}
                >
                  <RefreshCw className={cn("w-4 h-4 sm:mr-2", refreshing && "animate-spin")} />
                  <span className="hidden sm:inline">{refreshing ? 'Refreshing...' : 'Refresh'}</span>
                </Button>
                
                <Link href="/dashboard">
                  <Button className={cn(
                    "h-9 w-9 sm:h-10 sm:w-auto sm:px-4 rounded-lg text-sm font-medium",
                    "bg-slate-900 dark:bg-white",
                    "text-white dark:text-slate-900",
                    "hover:bg-slate-800 dark:hover:bg-slate-100",
                    "transition-colors duration-150",
                    "flex items-center justify-center"
                  )}>
                    <Plus className="w-4 h-4 sm:mr-1.5" />
                    <span className="hidden sm:inline">New Booking</span>
                  </Button>
                </Link>
              </div>
            </header>

            {/* ================================================================
                ADMIN BANNER - Subtle status strip
            ================================================================ */}
            {isAdmin && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.15, delay: 0.1 }}
                className={cn(
                  "flex items-center gap-3 px-4 py-2.5 rounded-xl",
                  "bg-blue-50 dark:bg-blue-500/10",
                  "border border-blue-100 dark:border-blue-500/20"
                )}
              >
                <Shield className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                <span className="text-sm text-blue-700 dark:text-blue-300">
                  Admin access · View and manage all community bookings
                </span>
              </motion.div>
            )}

            {/* ================================================================
                FILTERS - Unified control bar
            ================================================================ */}
            <div className="flex flex-col gap-3">
              {/* Search - full width on mobile */}
              <div className="relative w-full sm:max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                <Input
                  placeholder="Search bookings..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={cn(
                    "w-full h-10 pl-9 pr-9 text-sm",
                    "bg-slate-50 dark:bg-slate-900",
                    "border-0 ring-1 ring-slate-200 dark:ring-slate-800",
                    "focus:ring-2 focus:ring-slate-900 dark:focus:ring-slate-300",
                    "rounded-lg transition-shadow duration-150"
                  )}
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
              
              {/* Filter controls - grid on mobile, flex on desktop */}
              <div className="grid grid-cols-2 sm:flex gap-2">
                <Select value={selectedAmenity} onValueChange={setSelectedAmenity}>
                  <SelectTrigger className={cn(
                    "h-10 w-full sm:w-44 text-sm rounded-lg",
                    "bg-slate-50 dark:bg-slate-900",
                    "border-0 ring-1 ring-slate-200 dark:ring-slate-800",
                    "focus:ring-2 focus:ring-slate-900 dark:focus:ring-slate-300"
                  )}>
                    <SelectValue placeholder="Amenity" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-slate-200 dark:border-slate-800">
                    {amenityTypes.map((amenity) => (
                      <SelectItem key={amenity} value={amenity} className="rounded-lg">
                        {amenity}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                  <SelectTrigger className={cn(
                    "h-10 w-full sm:w-36 text-sm rounded-lg",
                    "bg-slate-50 dark:bg-slate-900",
                    "border-0 ring-1 ring-slate-200 dark:ring-slate-800",
                    "focus:ring-2 focus:ring-slate-900 dark:focus:ring-slate-300"
                  )}>
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-slate-200 dark:border-slate-800">
                    <SelectItem value="all" className="rounded-lg">All Status</SelectItem>
                    <SelectItem value="confirmed" className="rounded-lg">Confirmed</SelectItem>
                    <SelectItem value="pending" className="rounded-lg">Pending</SelectItem>
                    <SelectItem value="cancelled" className="rounded-lg">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
                
                {/* View mode - full width on mobile row, auto on desktop */}
                <div className="col-span-2 sm:col-span-1 flex items-center p-1 bg-slate-100 dark:bg-slate-900 rounded-lg w-full sm:w-auto">
                  {(['month', 'week', 'day'] as const).map((mode) => (
                    <button
                      key={mode}
                      onClick={() => setViewMode(mode)}
                      className={cn(
                        "flex-1 sm:flex-initial px-3 py-1.5 text-sm font-medium rounded-md transition-all duration-150 capitalize",
                        viewMode === mode
                          ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm"
                          : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
                      )}
                    >
                      {mode}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* ================================================================
                MAIN CONTENT - Two-pane layout
            ================================================================ */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
              
              {/* LEFT COLUMN - Calendar & Stats */}
              <div className="space-y-4 sm:space-y-6">
                
                {/* Calendar */}
                <div className={cn(
                  "rounded-xl border p-3 sm:p-4",
                  "bg-white dark:bg-slate-900",
                  "border-slate-200 dark:border-slate-800"
                )}>
                  {/* Month navigation */}
                  <div className="flex items-center justify-between mb-3 sm:mb-4">
                    <h2 className="text-sm sm:text-base font-semibold text-slate-900 dark:text-white">
                      {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                    </h2>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigateMonth('prev')}
                        className="h-8 w-8 p-0 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigateMonth('next')}
                        className="h-8 w-8 p-0 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  {/* Calendar grid */}
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    month={currentMonth}
                    onMonthChange={setCurrentMonth}
                    modifiers={{ hasBooking: bookingDates }}
                    modifiersStyles={{
                      hasBooking: {
                        backgroundColor: 'rgb(59 130 246 / 0.1)',
                        fontWeight: '600'
                      }
                    }}
                    className="w-full"
                    classNames={{
                      months: "flex flex-col",
                      month: "space-y-4 w-full",
                      caption: "hidden",
                      nav: "hidden",
                      table: "w-full border-collapse",
                      head_row: "flex w-full",
                      head_cell: "text-slate-500 dark:text-slate-400 rounded-md w-full font-medium text-xs",
                      row: "flex w-full mt-1",
                      cell: "text-center text-sm p-0 relative w-full aspect-square",
                      day: cn(
                        "h-full w-full p-0 font-normal rounded-lg text-sm",
                        "hover:bg-slate-100 dark:hover:bg-slate-800",
                        "transition-colors duration-100"
                      ),
                      day_selected: "bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-900 dark:hover:bg-white",
                      day_today: "ring-1 ring-slate-300 dark:ring-slate-700",
                      day_outside: "text-slate-300 dark:text-slate-700 opacity-50",
                      day_disabled: "text-slate-300 dark:text-slate-700 opacity-50",
                      day_hidden: "invisible",
                    }}
                  />
                </div>
                
                {/* Stats - Inline indicators (hidden on mobile, shown on lg+) */}
                <div className={cn(
                  "hidden lg:block rounded-xl border p-4",
                  "bg-white dark:bg-slate-900",
                  "border-slate-200 dark:border-slate-800"
                )}>
                  <h3 className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-4">
                    Overview
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                      <div className="text-2xl font-semibold text-slate-900 dark:text-white">
                        {stats.total}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">Total</div>
                    </div>
                    <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-500/10">
                      <div className="text-2xl font-semibold text-emerald-700 dark:text-emerald-400">
                        {stats.confirmed}
                      </div>
                      <div className="text-xs text-emerald-600 dark:text-emerald-500">Confirmed</div>
                    </div>
                    <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-500/10">
                      <div className="text-2xl font-semibold text-amber-700 dark:text-amber-400">
                        {stats.pending}
                      </div>
                      <div className="text-xs text-amber-600 dark:text-amber-500">Pending</div>
                    </div>
                    <div className="p-3 rounded-lg bg-slate-100 dark:bg-slate-800">
                      <div className="text-2xl font-semibold text-slate-500 dark:text-slate-400">
                        {stats.cancelled}
                      </div>
                      <div className="text-xs text-slate-400 dark:text-slate-500">Cancelled</div>
                    </div>
                  </div>
                </div>
                
                {/* Mobile stats - horizontal scroll */}
                <div className="lg:hidden overflow-x-auto -mx-3 px-3">
                  <div className="inline-flex items-center gap-3 py-1 min-w-max">
                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-900">
                      <span className="text-lg font-semibold text-slate-900 dark:text-white">{stats.total}</span>
                      <span className="text-xs text-slate-500">Total</span>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-50 dark:bg-emerald-500/10">
                      <span className="text-lg font-semibold text-emerald-700 dark:text-emerald-400">{stats.confirmed}</span>
                      <span className="text-xs text-emerald-600 dark:text-emerald-500">Confirmed</span>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-50 dark:bg-amber-500/10">
                      <span className="text-lg font-semibold text-amber-700 dark:text-amber-400">{stats.pending}</span>
                      <span className="text-xs text-amber-600 dark:text-amber-500">Pending</span>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-800">
                      <span className="text-lg font-semibold text-slate-500 dark:text-slate-400">{stats.cancelled}</span>
                      <span className="text-xs text-slate-400">Cancelled</span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* RIGHT COLUMN - Selected date details */}
              <div className="lg:col-span-2">
                <div className={cn(
                  "rounded-xl border h-full",
                  "bg-white dark:bg-slate-900",
                  "border-slate-200 dark:border-slate-800"
                )}>
                  {/* Header */}
                  <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-slate-200 dark:border-slate-800">
                    <div>
                      <h2 className="text-base sm:text-lg font-semibold text-slate-900 dark:text-white">
                        {selectedDate?.toLocaleDateString('en-US', { 
                          weekday: 'long', 
                          month: 'long', 
                          day: 'numeric' 
                        })}
                      </h2>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        {selectedDateBookings.length} booking{selectedDateBookings.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                    
                    {/* Tab switcher */}
                    <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
                      <button
                        className={cn(
                          "px-3 py-1.5 text-xs sm:text-sm font-medium rounded-md transition-all duration-150",
                          "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm"
                        )}
                      >
                        <span className="hidden sm:inline">Selected Date</span>
                        <span className="sm:hidden">Day</span>
                      </button>
                    </div>
                  </div>
                  
                  {/* Content */}
                  <div className="p-4 sm:p-6">
                    <AnimatePresence mode="wait">
                      {loading ? (
                        <motion.div
                          key="loading"
                          {...fadeIn}
                          className="flex items-center justify-center py-16"
                        >
                          <div className="animate-spin rounded-full h-6 w-6 border-2 border-slate-900 dark:border-white border-t-transparent" />
                        </motion.div>
                      ) : selectedDateBookings.length === 0 ? (
                        <motion.div
                          key="empty"
                          {...fadeIn}
                          className="text-center py-16"
                        >
                          <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                            <CalendarIcon className="w-6 h-6 text-slate-400" />
                          </div>
                          <h3 className="text-base font-medium text-slate-900 dark:text-white mb-1">
                            No bookings
                          </h3>
                          <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
                            This day is open for reservations.
                          </p>
                          <Link href="/dashboard">
                            <Button className={cn(
                              "h-10 px-4 rounded-lg text-sm font-medium",
                              "bg-slate-900 dark:bg-white",
                              "text-white dark:text-slate-900",
                              "hover:bg-slate-800 dark:hover:bg-slate-100"
                            )}>
                              <Plus className="w-4 h-4 mr-1.5" />
                              Book Amenity
                            </Button>
                          </Link>
                        </motion.div>
                      ) : (
                        <motion.div
                          key="bookings"
                          {...fadeIn}
                          className="space-y-3"
                        >
                          {selectedDateBookings.map((booking) => (
                            <BookingCard key={booking.id} booking={booking} />
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </div>
            </div>

            {/* ================================================================
                BOOKING DETAILS DIALOG - Clean, functional
            ================================================================ */}
            <Dialog open={showBookingDialog} onOpenChange={setShowBookingDialog}>
              <DialogContent className={cn(
                "max-w-lg rounded-2xl",
                "bg-white dark:bg-slate-900",
                "border-slate-200 dark:border-slate-800"
              )}>
                <DialogHeader className="pb-4 border-b border-slate-200 dark:border-slate-800">
                  <DialogTitle className="flex items-center gap-3 text-lg font-semibold text-slate-900 dark:text-white">
                    <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800">
                      <Building2 className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                    </div>
                    Booking Details
                  </DialogTitle>
                  <DialogDescription className="text-sm text-slate-500 dark:text-slate-400">
                    Complete information about this reservation
                  </DialogDescription>
                </DialogHeader>
                
                {selectedBooking && (
                  <div className="space-y-6 py-4">
                    {/* Amenity & Status */}
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                          {selectedBooking.amenityName}
                        </h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                          Community amenity
                        </p>
                      </div>
                      <span className={cn(
                        "text-xs font-medium px-2.5 py-1 rounded-md",
                        statusConfig[selectedBooking.status as keyof typeof statusConfig]?.bg,
                        statusConfig[selectedBooking.status as keyof typeof statusConfig]?.text
                      )}>
                        {statusConfig[selectedBooking.status as keyof typeof statusConfig]?.label}
                      </span>
                    </div>
                    
                    {/* Details grid */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 text-sm">
                        <CalendarIcon className="w-4 h-4 text-slate-400 shrink-0" />
                        <span className="text-slate-900 dark:text-white">
                          {selectedBooking.startTime.toLocaleDateString('en-US', { 
                            weekday: 'long', 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric' 
                          })}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-sm">
                        <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                        <span className="text-slate-900 dark:text-white">
                          {formatTimeConsistently(selectedBooking.startTime)} – {formatTimeConsistently(selectedBooking.endTime)}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-sm">
                        <Users className="w-4 h-4 text-slate-400 shrink-0" />
                        <div className="text-slate-900 dark:text-white">
                          {selectedBooking.userName || 'Resident'}
                          {selectedBooking.userFlatNumber && (
                            <span className="ml-2 text-xs px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded">
                              Flat {selectedBooking.userFlatNumber}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-3 text-sm">
                        <Users className="w-4 h-4 text-slate-400 shrink-0" />
                        <span className="text-slate-900 dark:text-white">
                          {selectedBooking.attendees?.length || 1} attendee{(selectedBooking.attendees?.length || 1) !== 1 ? 's' : ''}
                        </span>
                      </div>
                    </div>
                    
                    {/* Actions */}
                    <div className="flex flex-col gap-2 pt-4 border-t border-slate-200 dark:border-slate-800">
                      {(isAdmin || selectedBooking.userId === session?.user?.email) && (
                        <Button 
                          variant="outline" 
                          onClick={() => handleBookingAction('edit', selectedBooking)} 
                          className="justify-start h-10 rounded-lg"
                        >
                          <Edit className="w-4 h-4 mr-2" />
                          Edit Booking
                        </Button>
                      )}
                      
                      {isAdmin && selectedBooking.status === 'pending' && (
                        <Button 
                          variant="outline" 
                          onClick={() => handleBookingAction('approve', selectedBooking)} 
                          className="justify-start h-10 rounded-lg text-emerald-600 hover:text-emerald-700 border-emerald-200 hover:border-emerald-300"
                        >
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Approve
                        </Button>
                      )}
                      
                      {!selectedBooking.checkInTime && 
                       !selectedBooking.checkOutTime && 
                       (isAdmin || selectedBooking.userId === session?.user?.email) && 
                       selectedBooking.status !== 'cancelled' && (
                        <Button 
                          variant="outline" 
                          onClick={() => handleBookingAction('cancel', selectedBooking)}
                          className="justify-start h-10 rounded-lg text-red-600 hover:text-red-700 border-red-200 hover:border-red-300"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Cancel Booking
                        </Button>
                      )}
                      
                      {/* Info notices */}
                      {!isAdmin && selectedBooking.userId !== session?.user?.email && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                          You can only modify your own bookings.
                        </p>
                      )}
                      
                      {isAdmin && selectedBooking.userId !== session?.user?.email && (
                        <p className="text-xs text-blue-600 dark:text-blue-400 p-3 bg-blue-50 dark:bg-blue-500/10 rounded-lg">
                          Admin access: Managing booking for {selectedBooking.userName || 'resident'}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </DialogContent>
            </Dialog>
            
          </motion.div>
        </div>
      </div>
    </CalendarErrorBoundary>
  );
}
