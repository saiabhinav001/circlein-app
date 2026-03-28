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
import { useToast } from '@/hooks/use-toast';
import { useResidentNotifications } from '@/hooks/use-community-notifications';
import { useCommunityTimeFormat, useCommunityTimeZone } from '@/components/providers/community-branding-provider';
import { formatDateInTimeZone, formatTimeInTimeZone } from '@/lib/timezone';
import Link from 'next/link';
import { CalendarErrorBoundary } from '@/components/calendar/calendar-error-boundary';

// ============================================================================
// UTILITIES
// ============================================================================

const formatDateConsistently = (date: Date, timeZone?: string): string => {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
};

const formatTimeConsistently = (date: Date, timeZone?: string, timeFormat: '12h' | '24h' = '12h'): string => {
  return formatTimeInTimeZone(date, timeZone || 'UTC', { hour12: timeFormat !== '24h' });
};

const isSameDay = (date1: Date, date2: Date, timeZone?: string): boolean => {
  return formatDateConsistently(date1, timeZone) === formatDateConsistently(date2, timeZone);
};

const getHourInTimeZone = (date: Date, timeZone?: string): number => {
  const formatted = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hour: '2-digit',
    hour12: false,
  }).format(date);
  return Number.parseInt(formatted, 10);
};

const toLocalDateTimeInputValue = (date: Date): string => {
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
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

interface AmenityOption {
  id: string;
  name: string;
  category?: string;
}

interface QuickBookDraft {
  date: Date;
  hour: number;
  amenityId: string;
}

interface RescheduleDraft {
  startTimeLocal: string;
  durationHours: number;
}

interface DropRescheduleDraft {
  booking: Booking;
  nextStart: Date;
  nextEnd: Date;
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

const GRID_HOURS = Array.from({ length: 17 }, (_, index) => index + 6); // 06:00-22:00

const AMENITY_COLOR_PALETTE = [
  'bg-teal-500',
  'bg-emerald-500',
  'bg-cyan-500',
  'bg-amber-500',
  'bg-amber-500',
  'bg-rose-500',
  'bg-slate-500',
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
  const { sendCommunityNotification } = useResidentNotifications();
  const timeZone = useCommunityTimeZone();
  const timeFormat = useCommunityTimeFormat();
  
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
  const [amenityOptions, setAmenityOptions] = useState<AmenityOption[]>([]);
  const [draggingBookingId, setDraggingBookingId] = useState<string | null>(null);
  const [dragTargetKey, setDragTargetKey] = useState<string | null>(null);
  const [quickBookDraft, setQuickBookDraft] = useState<QuickBookDraft | null>(null);
  const [showQuickBookDialog, setShowQuickBookDialog] = useState(false);
  const [rescheduleDraft, setRescheduleDraft] = useState<RescheduleDraft | null>(null);
  const [rescheduleSaving, setRescheduleSaving] = useState(false);
  const [dropRescheduleDraft, setDropRescheduleDraft] = useState<DropRescheduleDraft | null>(null);
  const [dropRescheduleSaving, setDropRescheduleSaving] = useState(false);

  // Hydration
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  // Fetch bookings
  useEffect(() => {
    if (session?.user?.email && session?.user?.communityId) {
      fetchBookings();
      fetchAmenities();
    }
  }, [session]);

  useEffect(() => {
    if (!selectedBooking) {
      setRescheduleDraft(null);
      return;
    }

    setRescheduleDraft({
      startTimeLocal: toLocalDateTimeInputValue(new Date(selectedBooking.startTime)),
      durationHours: Math.max(1, Math.round((selectedBooking.endTime.getTime() - selectedBooking.startTime.getTime()) / (1000 * 60 * 60))),
    });
  }, [selectedBooking]);

  const fetchAmenities = async () => {
    if (!session?.user?.communityId) return;

    try {
      const amenitiesQuery = query(
        collection(db, 'amenities'),
        where('communityId', '==', session.user.communityId)
      );
      const snapshot = await getDocs(amenitiesQuery);
      const list = snapshot.docs.map((docSnapshot) => {
        const data = docSnapshot.data() as any;
        return {
          id: docSnapshot.id,
          name: String(data.name || 'Amenity'),
          category: String(data.category || ''),
        } satisfies AmenityOption;
      });
      setAmenityOptions(list);
    } catch (error) {
      console.error('Error fetching amenities:', error);
      setAmenityOptions([]);
    }
  };

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
    return filteredBookings.filter(booking => isSameDay(new Date(booking.startTime), selectedDate, timeZone));
  }, [selectedDate, filteredBookings, timeZone]);

  const weekDays = useMemo(() => {
    const base = selectedDate || new Date();
    const start = new Date(base);
    const day = start.getDay();
    const diffToMonday = day === 0 ? -6 : 1 - day;
    start.setDate(start.getDate() + diffToMonday);
    start.setHours(0, 0, 0, 0);

    return Array.from({ length: 7 }, (_, index) => {
      const d = new Date(start);
      d.setDate(start.getDate() + index);
      return d;
    });
  }, [selectedDate]);

  const amenityColorMap = useMemo(() => {
    const uniqueAmenities = Array.from(new Set(bookings.map((booking) => booking.amenityName).filter(Boolean)));
    const map = new Map<string, string>();
    uniqueAmenities.forEach((amenityName, index) => {
      map.set(amenityName, AMENITY_COLOR_PALETTE[index % AMENITY_COLOR_PALETTE.length]);
    });
    return map;
  }, [bookings]);

  const getAmenityColorClass = (amenityName: string) => {
    return amenityColorMap.get(amenityName) || 'bg-slate-500';
  };

  const formatHourLabel = useCallback((hour: number) => {
    if (timeFormat === '24h') {
      return `${String(hour).padStart(2, '0')}:00`;
    }

    const normalizedHour = ((hour + 11) % 12) + 1;
    const meridiem = hour >= 12 ? 'PM' : 'AM';
    return `${normalizedHour}:00 ${meridiem}`;
  }, [timeFormat]);

  const getBookingsForSlot = (date: Date, hour: number) => {
    return filteredBookings.filter((booking) => {
      const bookingDate = new Date(booking.startTime);
      return isSameDay(bookingDate, date, timeZone) && getHourInTimeZone(bookingDate, timeZone) === hour;
    });
  };

  const getSlotHeatClass = (count: number) => {
    if (count >= 3) return 'bg-rose-50 dark:bg-rose-500/10';
    if (count === 2) return 'bg-amber-50 dark:bg-amber-500/10';
    if (count === 1) return 'bg-emerald-50 dark:bg-emerald-500/10';
    return '';
  };

  // Booking dates for calendar highlights
  const bookingDates = useMemo(() => {
    return filteredBookings
      .map((booking) => new Date(booking.startTime))
      .filter((date) => date.getMonth() === currentMonth.getMonth() && date.getFullYear() === currentMonth.getFullYear());
  }, [filteredBookings, currentMonth]);

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

  const jumpToToday = useCallback(() => {
    const now = new Date();
    setSelectedDate(now);
    setCurrentMonth(new Date(now));
  }, []);

  const jumpToNextBooking = useCallback(() => {
    const now = new Date();
    const nextBooking = [...filteredBookings]
      .filter((booking) => new Date(booking.startTime) >= now)
      .sort((a, b) => a.startTime.getTime() - b.startTime.getTime())[0];

    if (!nextBooking) {
      toast({
        title: 'No upcoming bookings',
        description: 'There are no upcoming bookings in this filtered view.',
      });
      return;
    }

    const targetDate = new Date(nextBooking.startTime);
    setSelectedDate(targetDate);
    setCurrentMonth(new Date(targetDate));
    toast({
      title: 'Jumped to next booking',
      description: `${nextBooking.amenityName} at ${formatTimeConsistently(targetDate, timeZone, timeFormat)}.`,
    });
  }, [filteredBookings, timeZone, timeFormat, toast]);

  const shiftSelectedPeriod = useCallback((direction: 'prev' | 'next') => {
    const delta = direction === 'prev' ? -1 : 1;
    const base = selectedDate ? new Date(selectedDate) : new Date();

    if (viewMode === 'week') {
      base.setDate(base.getDate() + (7 * delta));
    } else {
      base.setDate(base.getDate() + delta);
    }

    setSelectedDate(base);
    setCurrentMonth(new Date(base));
  }, [selectedDate, viewMode]);

  const submitAdminReschedule = async () => {
    if (!isAdmin || !selectedBooking || !rescheduleDraft) return;

    const nextStart = new Date(rescheduleDraft.startTimeLocal);
    if (Number.isNaN(nextStart.getTime())) {
      toast({
        title: 'Invalid date',
        description: 'Pick a valid new start date and time.',
        variant: 'destructive',
      });
      return;
    }

    const nextEnd = new Date(nextStart);
    nextEnd.setHours(nextEnd.getHours() + rescheduleDraft.durationHours);

    const hasClientConflict = bookings.some((booking) => {
      if (booking.id === selectedBooking.id) return false;
      if (booking.amenityId !== selectedBooking.amenityId) return false;
      if (booking.status === 'cancelled') return false;

      const existingStart = new Date(booking.startTime);
      const existingEnd = new Date(booking.endTime);
      return nextStart < existingEnd && nextEnd > existingStart;
    });

    if (hasClientConflict) {
      toast({
        title: 'Conflicting slot',
        description: 'This slot overlaps an existing booking for the same amenity.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setRescheduleSaving(true);
      const response = await fetch(`/api/bookings/reschedule/${selectedBooking.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          startTime: nextStart.toISOString(),
          endTime: nextEnd.toISOString(),
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to reschedule booking');
      }

      toast({
        title: 'Booking rescheduled',
        description: `${selectedBooking.amenityName} moved to ${formatDateConsistently(nextStart, timeZone)} ${formatTimeConsistently(nextStart, timeZone, timeFormat)}.`,
      });
      setShowBookingDialog(false);
      setRescheduleDraft(null);
      fetchBookings(true);
    } catch (error: any) {
      toast({
        title: 'Reschedule failed',
        description: error?.message || 'Unable to reschedule booking.',
        variant: 'destructive',
      });
    } finally {
      setRescheduleSaving(false);
    }
  };

  const adminReschedulePreview = useMemo(() => {
    if (!isAdmin || !selectedBooking || !rescheduleDraft?.startTimeLocal) return null;

    const nextStart = new Date(rescheduleDraft.startTimeLocal);
    if (Number.isNaN(nextStart.getTime())) {
      return { invalid: true, hasConflict: false, startsInPast: false, nextStart: null as Date | null, nextEnd: null as Date | null };
    }

    const nextEnd = new Date(nextStart);
    nextEnd.setHours(nextEnd.getHours() + rescheduleDraft.durationHours);

    const hasConflict = bookings.some((booking) => {
      if (booking.id === selectedBooking.id) return false;
      if (booking.amenityId !== selectedBooking.amenityId) return false;
      if (booking.status === 'cancelled') return false;

      const existingStart = new Date(booking.startTime);
      const existingEnd = new Date(booking.endTime);
      return nextStart < existingEnd && nextEnd > existingStart;
    });

    const startsInPast = nextStart.getTime() < Date.now();

    return {
      invalid: false,
      hasConflict,
      startsInPast,
      nextStart,
      nextEnd,
    };
  }, [isAdmin, selectedBooking, rescheduleDraft, bookings]);

  const handleDropReschedule = (bookingId: string, targetDate: Date, targetHour: number) => {
    if (!isAdmin) return;

    const booking = bookings.find((item) => item.id === bookingId);
    if (!booking) return;

    const durationMs = booking.endTime.getTime() - booking.startTime.getTime();
    const nextStart = new Date(targetDate);
    nextStart.setHours(targetHour, 0, 0, 0);
    const nextEnd = new Date(nextStart.getTime() + durationMs);

    const hasConflict = bookings.some((item) => {
      if (item.id === booking.id) return false;
      if (item.amenityId !== booking.amenityId) return false;
      if (item.status === 'cancelled') return false;

      const existingStart = new Date(item.startTime);
      const existingEnd = new Date(item.endTime);
      return nextStart < existingEnd && nextEnd > existingStart;
    });

    if (hasConflict) {
      toast({
        title: 'Conflicting slot',
        description: 'This slot overlaps an existing booking for the same amenity.',
        variant: 'destructive',
      });
      return;
    }

    setDropRescheduleDraft({ booking, nextStart, nextEnd });
  };

  const confirmDropReschedule = async () => {
    if (!dropRescheduleDraft) return;

    try {
      setDropRescheduleSaving(true);
      const response = await fetch(`/api/bookings/reschedule/${dropRescheduleDraft.booking.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          startTime: dropRescheduleDraft.nextStart.toISOString(),
          endTime: dropRescheduleDraft.nextEnd.toISOString(),
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to reschedule booking');
      }

      toast({
        title: 'Booking rescheduled',
        description: `${dropRescheduleDraft.booking.amenityName} moved to ${formatDateConsistently(dropRescheduleDraft.nextStart, timeZone)} ${formatTimeConsistently(dropRescheduleDraft.nextStart, timeZone, timeFormat)}.`,
      });

      setDropRescheduleDraft(null);
      fetchBookings(true);
    } catch (error: any) {
      toast({
        title: 'Reschedule failed',
        description: error?.message || 'Unable to reschedule booking.',
        variant: 'destructive',
      });
    } finally {
      setDropRescheduleSaving(false);
    }
  };

  const openQuickBook = (date: Date, hour: number) => {
    if (!amenityOptions.length) {
      toast({
        title: 'No amenities found',
        description: 'Create an amenity first before quick booking.',
        variant: 'destructive',
      });
      return;
    }

    setQuickBookDraft({
      date,
      hour,
      amenityId: amenityOptions[0].id,
    });
    setShowQuickBookDialog(true);
  };

  const submitQuickBook = async () => {
    if (!quickBookDraft || !session?.user?.email) return;

    const selectedAmenityOption = amenityOptions.find((amenity) => amenity.id === quickBookDraft.amenityId);
    if (!selectedAmenityOption) return;

    const bookingStart = new Date(quickBookDraft.date);
    bookingStart.setHours(quickBookDraft.hour, 0, 0, 0);
    const bookingEnd = new Date(bookingStart);
    bookingEnd.setHours(bookingStart.getHours() + 1);

    const slotStart = `${String(bookingStart.getHours()).padStart(2, '0')}:00`;
    const slotEnd = `${String(bookingEnd.getHours()).padStart(2, '0')}:00`;

    try {
      const response = await fetch('/api/bookings/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amenityId: selectedAmenityOption.id,
          amenityName: selectedAmenityOption.name,
          startTime: bookingStart.toISOString(),
          endTime: bookingEnd.toISOString(),
          attendees: [session.user.name || session.user.email.split('@')[0]],
          selectedDate: bookingStart.toISOString(),
          selectedSlot: `${slotStart}-${slotEnd}`,
          userName: session.user.name || session.user.email.split('@')[0],
          userFlatNumber: (session.user as any).flatNumber || '',
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Quick booking failed');
      }

      toast({
        title: 'Quick booking complete',
        description: `${selectedAmenityOption.name} booked for ${formatTimeConsistently(bookingStart, timeZone, timeFormat)}.`,
      });
      setShowQuickBookDialog(false);
      fetchBookings(true);
    } catch (error: any) {
      toast({
        title: 'Quick booking failed',
        description: error?.message || 'Please try again.',
        variant: 'destructive',
      });
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
          `${formatDateConsistently(booking.startTime, timeZone)} · ${formatTimeConsistently(booking.startTime, timeZone, timeFormat)}`
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
                  {formatTimeConsistently(booking.startTime, timeZone, timeFormat)} – {formatTimeConsistently(booking.endTime, timeZone, timeFormat)}
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
                    <span className="text-xs text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-500/10 px-2 py-0.5 rounded">
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
                    "h-10 px-3 sm:px-4 rounded-lg text-sm font-medium",
                    "border-slate-200 dark:border-slate-800",
                    "hover:bg-slate-50 dark:hover:bg-slate-900",
                    "transition-colors duration-150",
                    "flex items-center justify-center gap-2"
                  )}
                >
                  <RefreshCw className={cn("w-4 h-4 shrink-0", refreshing && "animate-spin")} />
                  <span className="hidden sm:inline">{refreshing ? 'Refreshing...' : 'Refresh'}</span>
                </Button>
                
                <Link href="/dashboard">
                  <Button className={cn(
                    "h-10 px-3 sm:px-4 rounded-lg text-sm font-medium",
                    "bg-slate-900 dark:bg-white",
                    "text-white dark:text-slate-900",
                    "hover:bg-slate-800 dark:hover:bg-slate-100",
                    "transition-colors duration-150",
                    "flex items-center justify-center gap-1.5"
                  )}>
                    <Plus className="w-4 h-4 shrink-0" />
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
                  "bg-teal-50 dark:bg-teal-500/10",
                  "border border-teal-100 dark:border-teal-500/20"
                )}
              >
                <Shield className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0" />
                <span className="text-sm text-teal-700 dark:text-teal-300">
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
                      {formatDateInTimeZone(currentMonth, timeZone, { month: 'long', year: 'numeric' })}
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
                    modifiersClassNames={{
                      hasBooking: 'calendar-day-has-booking',
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
                        "h-full w-full p-0 font-normal rounded-lg text-sm relative",
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
                        {viewMode === 'month' && selectedDate && formatDateInTimeZone(selectedDate, timeZone, {
                          weekday: 'long',
                          month: 'long',
                          day: 'numeric'
                        })}
                        {viewMode === 'week' && `Week of ${weekDays[0] ? formatDateInTimeZone(weekDays[0], timeZone, {
                          month: 'short',
                          day: 'numeric'
                        }) : ''}`}
                        {viewMode === 'day' && selectedDate && formatDateInTimeZone(selectedDate, timeZone, {
                          weekday: 'long',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </h2>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        {viewMode === 'month' && `${selectedDateBookings.length} booking${selectedDateBookings.length !== 1 ? 's' : ''}`}
                        {viewMode === 'week' && `${filteredBookings.filter((booking) => weekDays.some((day) => isSameDay(day, booking.startTime, timeZone))).length} booking${filteredBookings.filter((booking) => weekDays.some((day) => isSameDay(day, booking.startTime, timeZone))).length !== 1 ? 's' : ''} this week`}
                        {viewMode === 'day' && `${selectedDateBookings.length} booking${selectedDateBookings.length !== 1 ? 's' : ''} today`}
                      </p>
                    </div>
                    
                    {/* Tab switcher */}
                    <div className="flex items-center gap-2">
                      {(viewMode === 'week' || viewMode === 'day') && (
                        <div className="flex items-center gap-1">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={jumpToToday}
                            className="h-8 rounded-lg text-xs px-2.5"
                          >
                            Today
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={jumpToNextBooking}
                            className="h-8 rounded-lg text-xs px-2.5"
                          >
                            Next Booking
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => shiftSelectedPeriod('prev')}
                            className="h-8 w-8 p-0 rounded-lg"
                          >
                            <ChevronLeft className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => shiftSelectedPeriod('next')}
                            className="h-8 w-8 p-0 rounded-lg"
                          >
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
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
                      ) : viewMode === 'month' && selectedDateBookings.length === 0 ? (
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
                      ) : viewMode === 'month' ? (
                        <motion.div
                          key="bookings"
                          {...fadeIn}
                          className="space-y-3"
                        >
                          {selectedDateBookings.map((booking) => (
                            <BookingCard key={booking.id} booking={booking} />
                          ))}
                        </motion.div>
                      ) : (
                        <motion.div
                          key={`grid-${viewMode}`}
                          {...fadeIn}
                          className="space-y-3"
                        >
                          <div className="overflow-auto rounded-lg border border-slate-200 dark:border-slate-800">
                            {viewMode === 'week' && (
                              <div className="min-w-[700px] sm:min-w-[820px]">
                                <div className="grid grid-cols-8 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
                                  <div className="p-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Time</div>
                                  {weekDays.map((day) => (
                                    <div key={day.toISOString()} className="p-3 text-center border-l border-slate-200 dark:border-slate-800">
                                      <div className="text-xs text-slate-500 uppercase">{formatDateInTimeZone(day, timeZone, { weekday: 'short' })}</div>
                                      <div className="text-sm font-semibold text-slate-900 dark:text-white">{formatDateInTimeZone(day, timeZone, { day: 'numeric' })}</div>
                                    </div>
                                  ))}
                                </div>

                                {GRID_HOURS.map((hour) => (
                                  <div key={`week-hour-${hour}`} className="grid grid-cols-8 border-b border-slate-100 dark:border-slate-800/80 last:border-b-0">
                                    <div className="p-3 text-xs font-medium text-slate-500 bg-slate-50/70 dark:bg-slate-900/30">
                                      {formatHourLabel(hour)}
                                    </div>
                                    {weekDays.map((day) => {
                                      const slotBookings = getBookingsForSlot(day, hour);

                                      return (
                                        <div
                                          key={`${day.toISOString()}-${hour}`}
                                          className={cn(
                                            'relative min-h-[72px] border-l border-slate-100 dark:border-slate-800/80 p-1.5',
                                            isAdmin && 'cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-900/40',
                                            getSlotHeatClass(slotBookings.length),
                                            dragTargetKey === `${day.toISOString()}-${hour}` && 'ring-2 ring-teal-300 dark:ring-teal-500/60'
                                          )}
                                          onClick={() => {
                                            if (isAdmin && slotBookings.length === 0) {
                                              openQuickBook(day, hour);
                                            }
                                          }}
                                          onDragOver={(event) => {
                                            if (!isAdmin) return;
                                            event.preventDefault();
                                            setDragTargetKey(`${day.toISOString()}-${hour}`);
                                          }}
                                          onDragLeave={() => setDragTargetKey((current) => (current === `${day.toISOString()}-${hour}` ? null : current))}
                                          onDrop={() => {
                                            if (!isAdmin || !draggingBookingId) return;
                                            handleDropReschedule(draggingBookingId, day, hour);
                                            setDragTargetKey(null);
                                            setDraggingBookingId(null);
                                          }}
                                        >
                                          {slotBookings.length > 0 && (
                                            <span className="absolute right-1.5 top-1.5 rounded-full bg-slate-900/85 px-1.5 py-0.5 text-[10px] font-medium text-white">
                                              {slotBookings.length}
                                            </span>
                                          )}
                                          <div className="space-y-1">
                                            {slotBookings.map((booking) => (
                                              <button
                                                key={booking.id}
                                                type="button"
                                                draggable={isAdmin}
                                                onDragStart={() => setDraggingBookingId(booking.id)}
                                                onDragEnd={() => {
                                                  setDraggingBookingId(null);
                                                  setDragTargetKey(null);
                                                }}
                                                onClick={(event) => {
                                                  event.stopPropagation();
                                                  setSelectedBooking(booking);
                                                  setShowBookingDialog(true);
                                                }}
                                                className={cn(
                                                  'w-full rounded-md px-2 py-1.5 text-left text-white text-[11px] leading-tight shadow-sm',
                                                  getAmenityColorClass(booking.amenityName),
                                                  isAdmin && 'cursor-grab active:cursor-grabbing'
                                                )}
                                              >
                                                <p className="font-semibold truncate">{booking.amenityName}</p>
                                                <p className="opacity-90 truncate">{booking.userName || booking.userId}</p>
                                              </button>
                                            ))}
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                ))}
                              </div>
                            )}

                            {viewMode === 'day' && selectedDate && (
                              <div>
                                <div className="grid grid-cols-[96px_1fr] border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
                                  <div className="p-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Time</div>
                                  <div className="p-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Bookings</div>
                                </div>

                                {GRID_HOURS.map((hour) => {
                                  const slotBookings = getBookingsForSlot(selectedDate, hour);

                                  return (
                                    <div key={`day-hour-${hour}`} className="grid grid-cols-[96px_1fr] border-b border-slate-100 dark:border-slate-800/80 last:border-b-0">
                                      <div className="p-3 text-xs font-medium text-slate-500 bg-slate-50/70 dark:bg-slate-900/30">
                                        {formatHourLabel(hour)}
                                      </div>
                                      <div
                                        className={cn(
                                          'min-h-[72px] p-2 relative',
                                          isAdmin && 'cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-900/40',
                                          getSlotHeatClass(slotBookings.length),
                                          dragTargetKey === `day-${selectedDate.toISOString()}-${hour}` && 'ring-2 ring-teal-300 dark:ring-teal-500/60 rounded-md'
                                        )}
                                        onClick={() => {
                                          if (isAdmin && slotBookings.length === 0) {
                                            openQuickBook(selectedDate, hour);
                                          }
                                        }}
                                        onDragOver={(event) => {
                                          if (!isAdmin) return;
                                          event.preventDefault();
                                          setDragTargetKey(`day-${selectedDate.toISOString()}-${hour}`);
                                        }}
                                        onDragLeave={() => setDragTargetKey((current) => (current === `day-${selectedDate.toISOString()}-${hour}` ? null : current))}
                                        onDrop={() => {
                                          if (!isAdmin || !draggingBookingId) return;
                                          handleDropReschedule(draggingBookingId, selectedDate, hour);
                                          setDragTargetKey(null);
                                          setDraggingBookingId(null);
                                        }}
                                      >
                                        {slotBookings.length > 0 && (
                                          <span className="absolute right-2 top-2 rounded-full bg-slate-900/85 px-1.5 py-0.5 text-[10px] font-medium text-white">
                                            {slotBookings.length}
                                          </span>
                                        )}
                                        {slotBookings.length === 0 ? (
                                          <p className="text-xs text-slate-400">Open slot</p>
                                        ) : (
                                          <div className="space-y-1.5">
                                            {slotBookings.map((booking) => (
                                              <button
                                                key={booking.id}
                                                type="button"
                                                draggable={isAdmin}
                                                onDragStart={() => setDraggingBookingId(booking.id)}
                                                onDragEnd={() => {
                                                  setDraggingBookingId(null);
                                                  setDragTargetKey(null);
                                                }}
                                                onClick={(event) => {
                                                  event.stopPropagation();
                                                  setSelectedBooking(booking);
                                                  setShowBookingDialog(true);
                                                }}
                                                className={cn(
                                                  'w-full rounded-md px-2.5 py-2 text-left text-white text-xs leading-tight shadow-sm',
                                                  getAmenityColorClass(booking.amenityName),
                                                  isAdmin && 'cursor-grab active:cursor-grabbing'
                                                )}
                                              >
                                                <p className="font-semibold">{booking.amenityName}</p>
                                                <p className="opacity-90">{formatTimeConsistently(booking.startTime, timeZone, timeFormat)} - {formatTimeConsistently(booking.endTime, timeZone, timeFormat)}</p>
                                                <p className="opacity-90 truncate">{booking.userName || booking.userId}</p>
                                              </button>
                                            ))}
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>

                          {!isAdmin && (
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                              Tip: Switch to month view to quickly browse your bookings. Admins can drag bookings across slots in week/day view.
                            </p>
                          )}
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
                          {formatDateInTimeZone(selectedBooking.startTime, timeZone, { 
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
                          {formatTimeConsistently(selectedBooking.startTime, timeZone, timeFormat)} – {formatTimeConsistently(selectedBooking.endTime, timeZone, timeFormat)}
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

                      {isAdmin && selectedBooking.status !== 'cancelled' && (
                        <div className="rounded-lg border border-slate-200 dark:border-slate-800 p-3 space-y-3">
                          <p className="text-sm font-medium text-slate-900 dark:text-white">Reschedule booking</p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <Input
                              type="datetime-local"
                              value={rescheduleDraft?.startTimeLocal || ''}
                              onChange={(event) => setRescheduleDraft((draft) => ({
                                startTimeLocal: event.target.value,
                                durationHours: draft?.durationHours || 1,
                              }))}
                              className="h-10"
                            />
                            <Select
                              value={String(rescheduleDraft?.durationHours || 1)}
                              onValueChange={(value) => setRescheduleDraft((draft) => ({
                                startTimeLocal: draft?.startTimeLocal || toLocalDateTimeInputValue(selectedBooking.startTime),
                                durationHours: Number(value),
                              }))}
                            >
                              <SelectTrigger className="h-10">
                                <SelectValue placeholder="Duration" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="1">1 hour</SelectItem>
                                <SelectItem value="2">2 hours</SelectItem>
                                <SelectItem value="3">3 hours</SelectItem>
                                <SelectItem value="4">4 hours</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          {adminReschedulePreview && (
                            <div
                              className={cn(
                                'rounded-md border px-3 py-2 text-xs',
                                adminReschedulePreview.invalid
                                  ? 'border-red-200 bg-red-50 text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300'
                                  : adminReschedulePreview.hasConflict
                                  ? 'border-red-200 bg-red-50 text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300'
                                  : adminReschedulePreview.startsInPast
                                  ? 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300'
                                  : 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300'
                              )}
                            >
                              {adminReschedulePreview.invalid && 'Choose a valid date and time.'}
                              {!adminReschedulePreview.invalid && adminReschedulePreview.hasConflict && 'Conflicts with an existing booking for this amenity.'}
                              {!adminReschedulePreview.invalid && !adminReschedulePreview.hasConflict && adminReschedulePreview.startsInPast && 'Selected slot starts in the past. Choose a future slot.'}
                              {!adminReschedulePreview.invalid && !adminReschedulePreview.hasConflict && !adminReschedulePreview.startsInPast && `Slot is available: ${formatDateConsistently(adminReschedulePreview.nextStart as Date, timeZone)} ${formatTimeConsistently(adminReschedulePreview.nextStart as Date, timeZone, timeFormat)} - ${formatTimeConsistently(adminReschedulePreview.nextEnd as Date, timeZone, timeFormat)}.`}
                            </div>
                          )}
                          <Button
                            onClick={submitAdminReschedule}
                            disabled={
                              rescheduleSaving ||
                              !rescheduleDraft?.startTimeLocal ||
                              !!adminReschedulePreview?.invalid ||
                              !!adminReschedulePreview?.hasConflict ||
                              !!adminReschedulePreview?.startsInPast
                            }
                            className="h-10 w-full"
                          >
                            {rescheduleSaving ? 'Saving...' : 'Apply reschedule'}
                          </Button>
                        </div>
                      )}
                      
                      {/* Info notices */}
                      {!isAdmin && selectedBooking.userId !== session?.user?.email && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                          You can only modify your own bookings.
                        </p>
                      )}
                      
                      {isAdmin && selectedBooking.userId !== session?.user?.email && (
                        <p className="text-xs text-teal-600 dark:text-teal-400 p-3 bg-teal-50 dark:bg-teal-500/10 rounded-lg">
                          Admin access: Managing booking for {selectedBooking.userName || 'resident'}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </DialogContent>
            </Dialog>

            <Dialog open={showQuickBookDialog} onOpenChange={setShowQuickBookDialog}>
              <DialogContent className={cn(
                "max-w-md rounded-2xl",
                "bg-white dark:bg-slate-900",
                "border-slate-200 dark:border-slate-800"
              )}>
                <DialogHeader>
                  <DialogTitle className="text-lg font-semibold text-slate-900 dark:text-white">Quick Book Slot</DialogTitle>
                  <DialogDescription className="text-sm text-slate-500 dark:text-slate-400">
                    Create a one-hour reservation directly from the calendar grid.
                  </DialogDescription>
                </DialogHeader>

                {quickBookDraft && (
                  <div className="space-y-4 py-2">
                    <div className="rounded-lg bg-slate-50 dark:bg-slate-800/60 p-3 text-sm text-slate-700 dark:text-slate-300">
                      {formatDateInTimeZone(quickBookDraft.date, timeZone, {
                        weekday: 'long',
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                      <span className="mx-2">·</span>
                      {`${formatHourLabel(quickBookDraft.hour)} - ${formatHourLabel(quickBookDraft.hour + 1)}`}
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Amenity</label>
                      <Select
                        value={quickBookDraft.amenityId}
                        onValueChange={(value) => setQuickBookDraft((draft) => draft ? { ...draft, amenityId: value } : draft)}
                      >
                        <SelectTrigger className="h-10 rounded-lg">
                          <SelectValue placeholder="Select amenity" />
                        </SelectTrigger>
                        <SelectContent>
                          {amenityOptions.map((amenity) => (
                            <SelectItem key={amenity.id} value={amenity.id}>
                              {amenity.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-2">
                      <Button variant="outline" onClick={() => setShowQuickBookDialog(false)}>
                        Cancel
                      </Button>
                      <Button onClick={submitQuickBook}>
                        Confirm Booking
                      </Button>
                    </div>
                  </div>
                )}
              </DialogContent>
            </Dialog>

            <Dialog
              open={!!dropRescheduleDraft}
              onOpenChange={(open) => {
                if (!open && !dropRescheduleSaving) {
                  setDropRescheduleDraft(null);
                }
              }}
            >
              <DialogContent className={cn(
                "max-w-md rounded-2xl",
                "bg-white dark:bg-slate-900",
                "border-slate-200 dark:border-slate-800"
              )}>
                <DialogHeader>
                  <DialogTitle className="text-lg font-semibold text-slate-900 dark:text-white">
                    Confirm Reschedule
                  </DialogTitle>
                  <DialogDescription className="text-sm text-slate-500 dark:text-slate-400">
                    Review the new slot before applying this drag-and-drop change.
                  </DialogDescription>
                </DialogHeader>

                {dropRescheduleDraft && (
                  <div className="space-y-4 py-2">
                    <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 p-3 text-sm">
                      <p className="font-medium text-slate-900 dark:text-white">{dropRescheduleDraft.booking.amenityName}</p>
                      <p className="mt-1 text-slate-500 dark:text-slate-400">
                        Resident: {dropRescheduleDraft.booking.userName || dropRescheduleDraft.booking.userId}
                      </p>
                    </div>
                    <div className="space-y-2 text-sm">
                      <p className="text-slate-600 dark:text-slate-300">
                        Current: {formatDateConsistently(dropRescheduleDraft.booking.startTime, timeZone)} {formatTimeConsistently(dropRescheduleDraft.booking.startTime, timeZone, timeFormat)} - {formatTimeConsistently(dropRescheduleDraft.booking.endTime, timeZone, timeFormat)}
                      </p>
                      <p className="text-slate-900 dark:text-white font-medium">
                        New: {formatDateConsistently(dropRescheduleDraft.nextStart, timeZone)} {formatTimeConsistently(dropRescheduleDraft.nextStart, timeZone, timeFormat)} - {formatTimeConsistently(dropRescheduleDraft.nextEnd, timeZone, timeFormat)}
                      </p>
                    </div>
                    <div className="flex items-center justify-end gap-2 pt-2">
                      <Button
                        variant="outline"
                        onClick={() => setDropRescheduleDraft(null)}
                        disabled={dropRescheduleSaving}
                      >
                        Cancel
                      </Button>
                      <Button onClick={confirmDropReschedule} disabled={dropRescheduleSaving}>
                        {dropRescheduleSaving ? 'Applying...' : 'Confirm Reschedule'}
                      </Button>
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
