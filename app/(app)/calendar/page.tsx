'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { collection, query, where, getDocs, doc, updateDoc, deleteDoc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  MapPin, 
  Users, 
  Plus,
  Filter,
  Search,
  Eye,
  Edit,
  Trash2,
  CheckCircle,
  AlertCircle,
  XCircle,
  MoreHorizontal,
  RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useCommunityNotifications } from '@/hooks/use-community-notifications';
import Link from 'next/link';
import { CalendarErrorBoundary } from '@/components/calendar/CalendarErrorBoundary';

// Utility function for consistent date formatting
const formatDateConsistently = (date: Date): string => {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

// Utility function for consistent time formatting
const formatTimeConsistently = (date: Date): string => {
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const displayHour = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
  const displayMinutes = String(minutes).padStart(2, '0');
  return `${displayHour}:${displayMinutes} ${ampm}`;
};

// Utility function for consistent date comparison
const isSameDay = (date1: Date, date2: Date): boolean => {
  return formatDateConsistently(date1) === formatDateConsistently(date2);
};

// Interface for real booking data from Firebase
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
}

// Real bookings would come from your database/API
// For now, this will be empty until real bookings are made
const mockBookings: any[] = [];

const amenityTypes = [
  'All Amenities',
  'Community Clubhouse',
  'Gym',
  'Swimming Pool',
  'Tennis Court',
  'Basketball Court',
  'Playground'
];

const statusColors = {
  confirmed: 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 border-green-200 dark:border-green-800',
  pending: 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 border-yellow-200 dark:border-yellow-800',
  cancelled: 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 border-red-200 dark:border-red-800'
};

const statusIcons = {
  confirmed: CheckCircle,
  pending: AlertCircle,
  cancelled: XCircle
};

export default function CalendarPage() {
  const { data: session } = useSession();
  const { toast } = useToast();
  const { sendCommunityNotification } = useCommunityNotifications();
  
  // Check if user is admin
  const isAdmin = session?.user?.role === 'admin';
  
  // Hydration state to prevent SSR mismatch
  const [isHydrated, setIsHydrated] = useState(false);
  
  // State for real bookings data
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'day'>('month');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAmenity, setSelectedAmenity] = useState('All Amenities');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [showBookingDialog, setShowBookingDialog] = useState(false);

  // Handle hydration
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  // Fetch real bookings from Firebase
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
      
      // Query all bookings for the community (not just user's bookings)
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
          communityId: data.communityId
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

  // Filter bookings based on search and filters
  const filteredBookings = useMemo(() => {
    return bookings.filter(booking => {
      const matchesSearch = booking.amenityName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           booking.userId?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesAmenity = selectedAmenity === 'All Amenities' || booking.amenityName === selectedAmenity;
      const matchesStatus = selectedStatus === 'all' || booking.status === selectedStatus;
      
      return matchesSearch && matchesAmenity && matchesStatus;
    });
  }, [bookings, searchQuery, selectedAmenity, selectedStatus]);

  // Get bookings for selected date
  const selectedDateBookings = useMemo(() => {
    if (!selectedDate) return [];
    return filteredBookings.filter(booking => {
      const bookingDate = new Date(booking.startTime);
      return isSameDay(bookingDate, selectedDate);
    });
  }, [selectedDate, filteredBookings]);

  // Get dates that have bookings for calendar highlighting
  const bookingDates = useMemo(() => {
    return filteredBookings.map(booking => new Date(booking.startTime));
  }, [filteredBookings]);

  const formatTime = (time: string) => {
    // Convert string time to Date for consistent formatting
    const [hours, minutes] = time.split(':');
    const date = new Date();
    date.setHours(parseInt(hours), parseInt(minutes), 0, 0);
    return formatTimeConsistently(date);
  };

  const formatDateRange = (startTime: string, endTime: string) => {
    return `${formatTime(startTime)} - ${formatTime(endTime)}`;
  };

  const handleBookingAction = async (action: string, booking: any) => {
    switch (action) {
      case 'view':
        setSelectedBooking(booking);
        setShowBookingDialog(true);
        break;
      case 'edit':
        toast({
          title: "Edit Booking",
          description: "Edit functionality would open here.",
        });
        break;
      case 'cancel':
        await handleCancelBooking(booking);
        break;
      case 'approve':
        toast({
          title: "Booking Approved",
          description: `${booking.amenityName} booking has been approved.`,
        });
        // Refresh bookings after action
        fetchBookings(true);
        break;
    }
  };

  const handleCancelBooking = async (booking: Booking) => {
    try {
      // Check if user can cancel this booking
      const canCancel = isAdmin || booking.userId === session?.user?.email;
      
      if (!canCancel) {
        toast({
          title: "Access Denied",
          description: "You can only cancel your own bookings.",
          variant: "destructive",
        });
        return;
      }

      // Confirm cancellation for admin actions on other users' bookings
      if (isAdmin && booking.userId !== session?.user?.email) {
        const confirmed = window.confirm(
          `Are you sure you want to cancel this booking for ${booking.userId}?\n\n` +
          `Amenity: ${booking.amenityName}\n` +
          `Date: ${formatDateConsistently(booking.startTime)}\n` +
          `Time: ${formatTimeConsistently(booking.startTime)} - ${formatTimeConsistently(booking.endTime)}\n\n` +
          `The user will be notified of this cancellation.`
        );
        
        if (!confirmed) {
          return;
        }
      }

      // Use the new cancel API endpoint (handles email + waitlist promotion automatically)
      console.log('🗑️ Cancelling booking via API:', {
        bookingId: booking.id,
        userId: booking.userId,
        amenity: booking.amenityName,
        isAdmin,
        currentUser: session?.user?.email
      });

      const cancelResponse = await fetch(`/api/bookings/cancel/${booking.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!cancelResponse.ok) {
        const errorData = await cancelResponse.json();
        throw new Error(errorData.error || 'Failed to cancel booking');
      }

      const cancelData = await cancelResponse.json();
      console.log('✅ Booking cancelled successfully:', cancelData);

      // Show success message with waitlist info
      if (cancelData.waitlistPromoted) {
        toast({
          title: "✅ Booking Cancelled & Waitlist Promoted",
          description: `${booking.amenityName} booking cancelled. The next person (${cancelData.promotedUser}) has been notified and will have 48 hours to confirm.`,
        });
      } else {
        toast({
          title: "Booking Cancelled",
          description: `${booking.amenityName} booking has been cancelled successfully.`,
          variant: "destructive",
        });
      }

      // Close dialog if open
      setShowBookingDialog(false);
      
      // Refresh bookings after cancellation
      fetchBookings(true);
    } catch (error) {
      console.error('Error cancelling booking:', error);
      toast({
        title: "Error",
        description: "Failed to cancel booking. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleRefresh = () => {
    fetchBookings(true);
    toast({
      title: "Calendar Refreshed",
      description: "Booking data has been updated.",
    });
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth(prev => {
      const newMonth = new Date(prev);
      if (direction === 'prev') {
        newMonth.setMonth(prev.getMonth() - 1);
      } else {
        newMonth.setMonth(prev.getMonth() + 1);
      }
      return newMonth;
    });
  };

  const BookingCard = ({ booking, isCompact = false }: { booking: Booking, isCompact?: boolean }) => {
    const StatusIcon = statusIcons[booking.status as keyof typeof statusIcons] || statusIcons.confirmed;
    
    const formatTimeFromDate = (date: Date) => {
      return formatTimeConsistently(date);
    };
    
    const formatDateRange = (startTime: Date, endTime: Date) => {
      return `${formatTimeFromDate(startTime)} - ${formatTimeFromDate(endTime)}`;
    };

    // Get user display name and flat number
    const getUserDisplay = () => {
      const userName = (booking as any).userName || 'Resident';
      const flatNumber = (booking as any).flatNumber;
      return flatNumber ? `${userName} - Flat ${flatNumber}` : userName;
    };
    
    return (
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -20, scale: 0.95 }}
        whileHover={{ scale: 1.02, y: -4 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        className={cn(
          "relative group booking-card rounded-2xl border-2 overflow-hidden",
          "bg-gradient-to-br from-white to-slate-50/50 dark:from-slate-800/90 dark:to-slate-900/90",
          "border-slate-200/60 dark:border-slate-700/60",
          "shadow-lg shadow-slate-200/50 dark:shadow-slate-900/50",
          "hover:shadow-2xl hover:shadow-slate-300/50 dark:hover:shadow-slate-900/80",
          "hover:border-blue-300 dark:hover:border-blue-600",
          "backdrop-blur-sm",
          isCompact ? "p-3 sm:p-4" : "p-4 sm:p-6"
        )}
      >
        {/* Animated gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-purple-500/5 to-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
        
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="flex-1 min-w-0 space-y-4">
            {/* Header with amenity name and status */}
            <div className="flex flex-wrap items-center gap-2">
              <motion.h3 
                className={cn(
                  "font-bold bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent",
                  isCompact ? "text-sm sm:text-base" : "text-base sm:text-lg"
                )}
                whileHover={{ scale: 1.02 }}
              >
                {booking.amenityName}
              </motion.h3>
              <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
                <Badge variant="outline" className={cn(
                  "text-xs font-semibold shadow-sm",
                  statusColors[booking.status as keyof typeof statusColors] || statusColors.confirmed
                )}>
                  <StatusIcon className="w-3 h-3 mr-1.5" />
                  {(booking.status || 'confirmed').toUpperCase()}
                </Badge>
              </motion.div>
              {/* Admin badge */}
              {isAdmin && booking.userId !== session?.user?.email && (
                <motion.div 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  whileHover={{ scale: 1.1 }}
                >
                  <Badge className="text-xs bg-gradient-to-r from-blue-500 to-purple-600 text-white border-0 shadow-lg shadow-blue-500/30">
                    🛡️ Admin
                  </Badge>
                </motion.div>
              )}
              {/* Own booking */}
              {booking.userId === session?.user?.email && (
                <motion.div 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  whileHover={{ scale: 1.1 }}
                >
                  <Badge className="text-xs bg-gradient-to-r from-green-500 to-emerald-600 text-white border-0 shadow-lg shadow-green-500/30">
                    ✓ Your Booking
                  </Badge>
                </motion.div>
              )}
            </div>
            
            {/* Enhanced booking details */}
            <div className="space-y-3">
              {/* Booked by - with flat number */}
              <motion.div 
                className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-blue-50 to-purple-50/50 dark:from-blue-950/30 dark:to-purple-950/30 border border-blue-200/50 dark:border-blue-800/50"
                whileHover={{ scale: 1.02, x: 2 }}
              >
                <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg shadow-lg shadow-blue-500/30">
                  <Users className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-slate-600 dark:text-slate-400 font-medium">Booked by</div>
                  <div className="text-sm font-bold text-slate-900 dark:text-white truncate">
                    {getUserDisplay()}
                  </div>
                </div>
              </motion.div>

              {/* Time slot */}
              <motion.div 
                className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-slate-50 to-slate-100/50 dark:from-slate-800/50 dark:to-slate-900/50 border border-slate-200/50 dark:border-slate-700/50"
                whileHover={{ scale: 1.02, x: 2 }}
              >
                <div className="p-2 bg-gradient-to-br from-slate-600 to-slate-800 rounded-lg shadow-lg">
                  <Clock className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-slate-600 dark:text-slate-400 font-medium">Time Slot</div>
                  <div className="text-sm font-bold text-slate-900 dark:text-white">
                    {formatDateRange(booking.startTime, booking.endTime)}
                  </div>
                </div>
              </motion.div>

              {/* Attendees count */}
              {!isCompact && (
                <motion.div 
                  className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-green-50 to-emerald-50/50 dark:from-green-950/30 dark:to-emerald-950/30 border border-green-200/50 dark:border-green-800/50"
                  whileHover={{ scale: 1.02, x: 2 }}
                >
                  <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg shadow-lg shadow-green-500/30">
                    <Users className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-slate-600 dark:text-slate-400 font-medium">Attendees</div>
                    <div className="text-sm font-bold text-slate-900 dark:text-white">
                      {booking.attendees?.length || 1} {(booking.attendees?.length || 1) === 1 ? 'person' : 'people'}
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <motion.div whileHover={{ scale: 1.1, rotate: 90 }} whileTap={{ scale: 0.9 }}>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-10 w-10 p-0 flex-shrink-0 rounded-xl bg-slate-100/50 dark:bg-slate-800/50 hover:bg-slate-200 dark:hover:bg-slate-700 border-2 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 transition-all shadow-sm"
                >
                  <MoreHorizontal className="w-5 h-5" />
                </Button>
              </motion.div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 rounded-xl border-2 shadow-2xl p-2">
              <DropdownMenuItem 
                onClick={() => handleBookingAction('view', booking)} 
                className="text-sm font-medium rounded-lg cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-950/50 focus:bg-blue-50 dark:focus:bg-blue-950/50 py-3"
              >
                <Eye className="w-4 h-4 mr-3 text-blue-600 dark:text-blue-400" />
                View Details
              </DropdownMenuItem>
              
              {/* Edit only for own bookings or if admin */}
              {(isAdmin || booking.userId === session?.user?.email) && (
                <DropdownMenuItem 
                  onClick={() => handleBookingAction('edit', booking)} 
                  className="text-sm font-medium rounded-lg cursor-pointer hover:bg-purple-50 dark:hover:bg-purple-950/50 focus:bg-purple-50 dark:focus:bg-purple-950/50 py-3"
                >
                  <Edit className="w-4 h-4 mr-3 text-purple-600 dark:text-purple-400" />
                  Edit Booking
                </DropdownMenuItem>
              )}
              
              {/* Approve only for admin and pending bookings */}
              {isAdmin && booking.status === 'pending' && (
                <DropdownMenuItem 
                  onClick={() => handleBookingAction('approve', booking)} 
                  className="text-sm font-medium rounded-lg cursor-pointer hover:bg-green-50 dark:hover:bg-green-950/50 focus:bg-green-50 dark:focus:bg-green-950/50 py-3"
                >
                  <CheckCircle className="w-4 h-4 mr-3 text-green-600 dark:text-green-400" />
                  Approve Booking
                </DropdownMenuItem>
              )}
              
              {/* Cancel: Own bookings or admin can cancel any booking */}
              {(isAdmin || booking.userId === session?.user?.email) && booking.status !== 'cancelled' && (
                <DropdownMenuItem 
                  onClick={() => handleBookingAction('cancel', booking)}
                  className="text-sm font-medium rounded-lg cursor-pointer hover:bg-red-50 dark:hover:bg-red-950/50 focus:bg-red-50 dark:focus:bg-red-950/50 text-red-600 dark:text-red-400 focus:text-red-600 dark:focus:text-red-400 py-3"
                >
                  <Trash2 className="w-4 h-4 mr-3" />
                  {isAdmin && booking.userId !== session?.user?.email ? 'Cancel (Admin)' : 'Cancel Booking'}
                </DropdownMenuItem>
              )}
              
              {/* Show read-only indicator for other users' bookings when not admin */}
              {!isAdmin && booking.userId !== session?.user?.email && (
                <DropdownMenuItem disabled className="text-sm font-medium rounded-lg text-gray-400 py-3">
                  <Eye className="w-4 h-4 mr-3" />
                  View Only
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </motion.div>
    );
  };

  // Prevent hydration issues by not rendering until client-side
  if (!isHydrated) {
    return (
      <CalendarErrorBoundary>
        <div className="container mx-auto p-3 sm:p-4 md:p-6 lg:p-8 max-w-7xl">
          <Card>
            <CardHeader className="px-4 sm:px-6">
              <CardTitle className="flex items-center gap-2 sm:gap-3 text-base sm:text-lg md:text-xl">
                <CalendarIcon className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 text-blue-600" />
                Loading Calendar...
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Preparing your calendar interface
              </CardDescription>
            </CardHeader>
            <CardContent className="px-4 sm:px-6">
              <div className="flex items-center justify-center py-8 sm:py-10 md:py-12">
                <div className="animate-spin rounded-full h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 border-b-2 border-blue-600"></div>
              </div>
            </CardContent>
          </Card>
        </div>
      </CalendarErrorBoundary>
    );
  }

  return (
    <CalendarErrorBoundary>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 dark:from-slate-950 dark:via-blue-950/10 dark:to-indigo-950/10">
        <div className="container mx-auto p-3 sm:p-4 md:p-6 lg:p-8 max-w-7xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="space-y-6 sm:space-y-7 md:space-y-8"
          >
          {/* Header - Enhanced with glassmorphism */}
          <motion.div 
            className="relative overflow-hidden rounded-3xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-white/20 dark:border-slate-700/50 shadow-2xl shadow-blue-500/10 p-6 sm:p-8"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            {/* Animated background gradient */}
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-purple-500/5 to-pink-500/5 dark:from-blue-500/10 dark:via-purple-500/10 dark:to-pink-500/10 animate-gradient-x"></div>
            
            <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-4 sm:gap-6">
              <div className="space-y-2">
                <motion.h1 
                  className="text-3xl sm:text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 dark:from-blue-400 dark:via-purple-400 dark:to-pink-400 bg-clip-text text-transparent flex items-center gap-3"
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                >
                  <motion.div
                    className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl shadow-lg shadow-blue-500/30"
                    whileHover={{ scale: 1.05, rotate: 5 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <CalendarIcon className="h-7 w-7 sm:h-8 sm:w-8 text-white" />
                  </motion.div>
                  Calendar
                  {isAdmin && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 200, delay: 0.4 }}
                    >
                      <Badge className="bg-gradient-to-r from-blue-500 to-purple-600 text-white border-0 shadow-lg shadow-blue-500/30 text-sm px-3 py-1">
                        Admin
                      </Badge>
                    </motion.div>
                  )}
                </motion.h1>
                <motion.p 
                  className="text-gray-600 dark:text-gray-300 text-base sm:text-lg font-medium"
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                >
                  {isAdmin 
                    ? "🎯 Manage all community bookings and events" 
                    : "📅 Your personal booking dashboard"
                  }
                </motion.p>
              </div>
              
              <motion.div 
                className="flex items-center gap-3"
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button 
                    variant="outline" 
                    onClick={handleRefresh} 
                    disabled={refreshing}
                    className="flex items-center gap-2 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm border-2 border-blue-200 dark:border-blue-700 hover:border-blue-400 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-all duration-300 shadow-lg shadow-blue-500/10"
                    size="default"
                  >
                    <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                    {refreshing ? 'Refreshing...' : 'Refresh'}
                  </Button>
                </motion.div>
                <Link href="/dashboard">
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-xl shadow-blue-500/30 hover:shadow-2xl hover:shadow-blue-500/40 transition-all duration-300">
                      <Plus className="h-4 w-4" />
                      <span className="font-semibold">New Booking</span>
                    </Button>
                  </motion.div>
                </Link>
              </motion.div>
            </div>
          </motion.div>

        {/* Admin Info Panel - Enhanced with animation */}
        {isAdmin && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.4, type: "spring", stiffness: 100 }}
          >
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 dark:from-blue-500/20 dark:via-purple-500/20 dark:to-pink-500/20 backdrop-blur-xl border-2 border-blue-300/50 dark:border-blue-600/50 shadow-xl shadow-blue-500/20">
              {/* Animated background pattern */}
              <div className="absolute inset-0 opacity-30">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-400/20 via-transparent to-purple-400/20 animate-pulse"></div>
              </div>
              
              <CardContent className="relative z-10 pt-6 px-6 pb-6">
                <div className="flex items-start gap-4">
                  <motion.div 
                    className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl shadow-lg shadow-blue-500/30"
                    animate={{ 
                      boxShadow: [
                        "0 10px 30px rgba(59, 130, 246, 0.3)",
                        "0 10px 40px rgba(168, 85, 247, 0.4)",
                        "0 10px 30px rgba(59, 130, 246, 0.3)"
                      ]
                    }}
                    transition={{ duration: 3, repeat: Infinity }}
                  >
                    <Users className="w-6 h-6 text-white" />
                  </motion.div>
                  <div className="flex-1 space-y-1">
                    <h3 className="font-bold text-blue-900 dark:text-blue-100 text-lg flex items-center gap-2">
                      Admin Privileges Active
                      <motion.span
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="inline-block w-2 h-2 bg-green-500 rounded-full shadow-lg shadow-green-500/50"
                      />
                    </h3>
                    <p className="text-sm text-blue-700 dark:text-blue-300 leading-relaxed">
                      Full access to view, edit, and manage all community bookings. Residents receive automatic notifications for any admin actions.
                    </p>
                  </div>
                </div>
              </CardContent>
            </div>
          </motion.div>
        )}

        {/* Filters - Enhanced with glassmorphism and animations */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          <div className="rounded-2xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-white/20 dark:border-slate-700/50 shadow-xl shadow-blue-500/5 overflow-hidden">
            <CardContent className="pt-6 px-6 pb-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <motion.div 
                  className="relative group"
                  whileHover={{ scale: 1.02 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 group-hover:text-blue-500 transition-colors duration-300" />
                  <Input
                    placeholder="Search bookings..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-12 h-12 bg-gradient-to-r from-slate-50 to-blue-50/50 dark:from-slate-800 dark:to-blue-900/20 border-2 border-gray-200 dark:border-slate-700 focus:border-blue-500 dark:focus:border-blue-500 rounded-xl text-base font-medium shadow-sm hover:shadow-md transition-all duration-300"
                  />
                </motion.div>
                
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <Select value={selectedAmenity} onValueChange={setSelectedAmenity}>
                    <SelectTrigger className="h-12 bg-gradient-to-r from-slate-50 to-purple-50/50 dark:from-slate-800 dark:to-purple-900/20 border-2 border-gray-200 dark:border-slate-700 focus:border-purple-500 dark:focus:border-purple-500 rounded-xl text-base font-medium shadow-sm hover:shadow-md transition-all duration-300">
                      <SelectValue placeholder="Filter by amenity" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-2 shadow-2xl">
                      {amenityTypes.map((amenity) => (
                        <SelectItem key={amenity} value={amenity} className="text-base hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors">
                          {amenity}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </motion.div>
                
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                    <SelectTrigger className="h-12 bg-gradient-to-r from-slate-50 to-pink-50/50 dark:from-slate-800 dark:to-pink-900/20 border-2 border-gray-200 dark:border-slate-700 focus:border-pink-500 dark:focus:border-pink-500 rounded-xl text-base font-medium shadow-sm hover:shadow-md transition-all duration-300">
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-2 shadow-2xl">
                      <SelectItem value="all" className="text-base hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">All Status</SelectItem>
                      <SelectItem value="confirmed" className="text-base hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors">✓ Confirmed</SelectItem>
                      <SelectItem value="pending" className="text-base hover:bg-yellow-50 dark:hover:bg-yellow-900/20 transition-colors">⏳ Pending</SelectItem>
                      <SelectItem value="cancelled" className="text-base hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">✗ Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </motion.div>
                
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <Select value={viewMode} onValueChange={(value: any) => setViewMode(value)}>
                    <SelectTrigger className="h-12 bg-gradient-to-r from-slate-50 to-indigo-50/50 dark:from-slate-800 dark:to-indigo-900/20 border-2 border-gray-200 dark:border-slate-700 focus:border-indigo-500 dark:focus:border-indigo-500 rounded-xl text-base font-medium shadow-sm hover:shadow-md transition-all duration-300">
                      <SelectValue placeholder="View mode" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-2 shadow-2xl">
                      <SelectItem value="month" className="text-base hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors">📅 Month View</SelectItem>
                      <SelectItem value="week" className="text-base hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors">📆 Week View</SelectItem>
                      <SelectItem value="day" className="text-base hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors">📋 Day View</SelectItem>
                    </SelectContent>
                  </Select>
                </motion.div>
              </div>
            </CardContent>
          </div>
        </motion.div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Calendar - Enhanced */}
          <motion.div 
            className="lg:col-span-1"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.7 }}
          >
            <div className="rounded-2xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-white/20 dark:border-slate-700/50 shadow-xl shadow-purple-500/5 overflow-hidden">
              <CardHeader className="pb-4 px-6 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/50 dark:to-pink-950/50 border-b border-purple-200/30 dark:border-purple-800/30">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-bold bg-gradient-to-r from-purple-600 to-pink-600 dark:from-purple-400 dark:to-pink-400 bg-clip-text text-transparent">
                    📅 {currentMonth.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigateMonth('prev')}
                        className="h-9 w-9 p-0 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 border-0 text-white shadow-lg shadow-purple-500/30 hover:shadow-xl hover:shadow-purple-500/40 transition-all"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                    </motion.div>
                    <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigateMonth('next')}
                        className="h-9 w-9 p-0 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 border-0 text-white shadow-lg shadow-purple-500/30 hover:shadow-xl hover:shadow-purple-500/40 transition-all"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </motion.div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="px-6 py-4">
                <div className="overflow-x-auto">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    month={currentMonth}
                    onMonthChange={setCurrentMonth}
                    modifiers={{
                      hasBooking: bookingDates
                    }}
                    modifiersStyles={{
                      hasBooking: {
                        backgroundColor: 'rgb(59 130 246 / 0.1)',
                        color: 'rgb(37 99 235)',
                        fontWeight: 'bold'
                      }
                    }}
                    className="rounded-md w-full"
                    classNames={{
                      months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
                      month: "space-y-4 w-full",
                      caption: "flex justify-center pt-1 relative items-center",
                      caption_label: "text-sm font-medium",
                      nav: "space-x-1 flex items-center",
                      nav_button: "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100",
                      nav_button_previous: "absolute left-1",
                      nav_button_next: "absolute right-1",
                      table: "w-full border-collapse space-y-1",
                      head_row: "flex w-full",
                      head_cell: "text-muted-foreground rounded-md w-full font-normal text-[0.65rem] sm:text-[0.8rem]",
                      row: "flex w-full mt-2",
                      cell: "text-center text-sm p-0 relative [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20 w-full aspect-square",
                      day: "h-full w-full p-0 font-normal aria-selected:opacity-100 hover:bg-accent hover:text-accent-foreground rounded-md text-xs sm:text-sm",
                      day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
                      day_today: "bg-accent text-accent-foreground",
                      day_outside: "text-muted-foreground opacity-50",
                      day_disabled: "text-muted-foreground opacity-50",
                      day_range_middle: "aria-selected:bg-accent aria-selected:text-accent-foreground",
                      day_hidden: "invisible",
                    }}
                  />
                </div>
              </CardContent>
            </div>

            {/* Quick Stats - Enhanced */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.6 }}
              className="mt-6"
            >
              <div className="rounded-2xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-white/20 dark:border-slate-700/50 shadow-xl shadow-blue-500/5 overflow-hidden">
                <CardHeader className="px-6 pb-4">
                  <CardTitle className="text-lg font-bold bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent">
                    📊 Quick Stats
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-6 pb-6">
                  <div className="grid grid-cols-2 gap-4">
                    {/* Total */}
                    <motion.div 
                      className="p-4 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/50 dark:to-blue-900/50 border-2 border-blue-200/50 dark:border-blue-800/50"
                      whileHover={{ scale: 1.05, y: -2 }}
                      transition={{ type: "spring", stiffness: 300 }}
                    >
                      <div className="text-3xl font-black bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-400 dark:to-blue-500 bg-clip-text text-transparent">
                        {filteredBookings.length}
                      </div>
                      <div className="text-xs font-semibold text-blue-700 dark:text-blue-300 mt-1">Total</div>
                    </motion.div>

                    {/* Confirmed */}
                    <motion.div 
                      className="p-4 rounded-xl bg-gradient-to-br from-green-50 to-green-100/50 dark:from-green-950/50 dark:to-green-900/50 border-2 border-green-200/50 dark:border-green-800/50"
                      whileHover={{ scale: 1.05, y: -2 }}
                      transition={{ type: "spring", stiffness: 300 }}
                    >
                      <div className="text-3xl font-black bg-gradient-to-r from-green-600 to-green-700 dark:from-green-400 dark:to-green-500 bg-clip-text text-transparent">
                        {filteredBookings.filter(b => b.status === 'confirmed').length}
                      </div>
                      <div className="text-xs font-semibold text-green-700 dark:text-green-300 mt-1">Confirmed</div>
                    </motion.div>

                    {/* Pending */}
                    <motion.div 
                      className="p-4 rounded-xl bg-gradient-to-br from-yellow-50 to-yellow-100/50 dark:from-yellow-950/50 dark:to-yellow-900/50 border-2 border-yellow-200/50 dark:border-yellow-800/50"
                      whileHover={{ scale: 1.05, y: -2 }}
                      transition={{ type: "spring", stiffness: 300 }}
                    >
                      <div className="text-3xl font-black bg-gradient-to-r from-yellow-600 to-yellow-700 dark:from-yellow-400 dark:to-yellow-500 bg-clip-text text-transparent">
                        {filteredBookings.filter(b => b.status === 'pending').length}
                      </div>
                      <div className="text-xs font-semibold text-yellow-700 dark:text-yellow-300 mt-1">Pending</div>
                    </motion.div>

                    {/* Cancelled */}
                    <motion.div 
                      className="p-4 rounded-xl bg-gradient-to-br from-red-50 to-red-100/50 dark:from-red-950/50 dark:to-red-900/50 border-2 border-red-200/50 dark:border-red-800/50"
                      whileHover={{ scale: 1.05, y: -2 }}
                      transition={{ type: "spring", stiffness: 300 }}
                    >
                      <div className="text-3xl font-black bg-gradient-to-r from-red-600 to-red-700 dark:from-red-400 dark:to-red-500 bg-clip-text text-transparent">
                        {filteredBookings.filter(b => b.status === 'cancelled').length}
                      </div>
                      <div className="text-xs font-semibold text-red-700 dark:text-red-300 mt-1">Cancelled</div>
                    </motion.div>
                  </div>
                </CardContent>
              </div>
            </motion.div>
          </motion.div>

          {/* Bookings List - Enhanced */}
          <motion.div 
            className="lg:col-span-2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.8 }}
          >
            <Tabs defaultValue="selected-date" className="space-y-6">
              <TabsList className="grid w-full grid-cols-2 h-auto p-1 rounded-2xl bg-gradient-to-r from-slate-100 to-blue-100/50 dark:from-slate-800 dark:to-blue-900/20 border-2 border-white/50 dark:border-slate-700/50 shadow-lg">
                <TabsTrigger 
                  value="selected-date" 
                  className="text-sm px-4 py-3 rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-500 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-blue-500/50 font-semibold transition-all duration-300"
                >
                  <span className="hidden sm:inline">📆 Selected Date ({selectedDate ? formatDateConsistently(selectedDate) : ''})</span>
                  <span className="sm:hidden">📆 Selected</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="all-bookings" 
                  className="text-sm px-4 py-3 rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-pink-500 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-purple-500/50 font-semibold transition-all duration-300"
                >
                  <span className="hidden sm:inline">📋 All Bookings ({filteredBookings.length})</span>
                  <span className="sm:hidden">📋 All ({filteredBookings.length})</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="selected-date" className="space-y-4">
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="rounded-2xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-white/20 dark:border-slate-700/50 shadow-xl overflow-hidden"
                >
                  <CardHeader className="px-6 pb-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/50 dark:to-purple-950/50 border-b border-blue-200/30 dark:border-blue-800/30">
                    <CardTitle className="flex items-center gap-3 text-lg font-bold">
                      <motion.div
                        className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl shadow-lg"
                        whileHover={{ rotate: 360, scale: 1.1 }}
                        transition={{ duration: 0.5 }}
                      >
                        <CalendarIcon className="h-5 w-5 text-white" />
                      </motion.div>
                      <span className="truncate bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent">
                        {selectedDate?.toLocaleDateString('en-GB', { 
                          weekday: 'long', 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })}
                      </span>
                    </CardTitle>
                    <CardDescription className="text-sm font-medium text-slate-600 dark:text-slate-400 ml-14">
                      {selectedDateBookings.length} booking{selectedDateBookings.length !== 1 ? 's' : ''} scheduled
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3 sm:space-y-4 px-4 sm:px-6">
                    <AnimatePresence>
                      {loading ? (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="text-center py-6 sm:py-8 text-gray-500 dark:text-gray-400"
                        >
                          <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-blue-600 mx-auto mb-3 sm:mb-4"></div>
                          <p className="text-sm sm:text-base">Loading bookings...</p>
                        </motion.div>
                      ) : selectedDateBookings.length === 0 ? (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ duration: 0.5 }}
                          className="text-center py-12"
                        >
                          <motion.div
                            animate={{ 
                              y: [0, -10, 0],
                              rotate: [0, 5, -5, 0]
                            }}
                            transition={{
                              duration: 3,
                              repeat: Infinity,
                              ease: "easeInOut"
                            }}
                            className="relative inline-block mb-6"
                          >
                            <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full blur-xl opacity-30"></div>
                            <CalendarIcon className="h-20 w-20 mx-auto relative text-slate-300 dark:text-slate-600" />
                          </motion.div>
                          <h3 className="text-xl font-bold text-slate-700 dark:text-slate-300 mb-2">
                            No bookings yet
                          </h3>
                          <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
                            This date is free. Book an amenity to get started!
                          </p>
                          <Link href="/dashboard">
                            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                              <Button 
                                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 rounded-xl px-6 py-3 font-semibold"
                                size="default"
                              >
                                <Plus className="h-5 w-5 mr-2" />
                                Create Booking
                              </Button>
                            </motion.div>
                          </Link>
                        </motion.div>
                      ) : (
                        selectedDateBookings.map((booking) => (
                          <BookingCard key={booking.id} booking={booking} />
                        ))
                      )}
                    </AnimatePresence>
                  </CardContent>
                </motion.div>
              </TabsContent>

              <TabsContent value="all-bookings" className="space-y-4">
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="rounded-2xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-white/20 dark:border-slate-700/50 shadow-xl overflow-hidden"
                >
                  <CardHeader className="px-6 pb-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/50 dark:to-pink-950/50 border-b border-purple-200/30 dark:border-purple-800/30">
                    <CardTitle className="flex items-center gap-3 text-lg font-bold">
                      <motion.div
                        className="p-2 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl shadow-lg"
                        whileHover={{ rotate: 360, scale: 1.1 }}
                        transition={{ duration: 0.5 }}
                      >
                        <Filter className="h-5 w-5 text-white" />
                      </motion.div>
                      <span className="bg-gradient-to-r from-purple-600 to-pink-600 dark:from-purple-400 dark:to-pink-400 bg-clip-text text-transparent">
                        All Bookings
                      </span>
                    </CardTitle>
                    <CardDescription className="text-sm font-medium text-slate-600 dark:text-slate-400 ml-14">
                      {filteredBookings.length} booking{filteredBookings.length !== 1 ? 's' : ''} found
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3 sm:space-y-4 px-4 sm:px-6">
                    <AnimatePresence>
                      {loading ? (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="text-center py-6 sm:py-8 text-gray-500 dark:text-gray-400"
                        >
                          <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-blue-600 mx-auto mb-3 sm:mb-4"></div>
                          <p className="text-sm sm:text-base">Loading bookings...</p>
                        </motion.div>
                      ) : filteredBookings.length === 0 ? (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ duration: 0.5 }}
                          className="text-center py-12"
                        >
                          {searchQuery || selectedAmenity !== 'All Amenities' || selectedStatus !== 'all' ? (
                            <>
                              <motion.div
                                animate={{ 
                                  scale: [1, 1.1, 1],
                                  rotate: [0, 10, -10, 0]
                                }}
                                transition={{
                                  duration: 2,
                                  repeat: Infinity,
                                  ease: "easeInOut"
                                }}
                                className="relative inline-block mb-6"
                              >
                                <div className="absolute inset-0 bg-gradient-to-r from-orange-400 to-red-400 rounded-full blur-xl opacity-30"></div>
                                <Search className="h-20 w-20 mx-auto relative text-slate-300 dark:text-slate-600" />
                              </motion.div>
                              <h3 className="text-xl font-bold text-slate-700 dark:text-slate-300 mb-2">
                                No matches found
                              </h3>
                              <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
                                Try adjusting your filters or search query
                              </p>
                              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                                <Button 
                                  className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white shadow-lg shadow-orange-500/30 hover:shadow-xl hover:shadow-orange-500/40 rounded-xl px-6 py-3 font-semibold"
                                  size="default" 
                                  onClick={() => {
                                    setSearchQuery('');
                                    setSelectedAmenity('All Amenities');
                                    setSelectedStatus('all');
                                  }}
                                >
                                  Clear Filters
                                </Button>
                              </motion.div>
                            </>
                          ) : (
                            <>
                              <motion.div
                                animate={{ 
                                  y: [0, -10, 0],
                                  rotate: [0, 5, -5, 0]
                                }}
                                transition={{
                                  duration: 3,
                                  repeat: Infinity,
                                  ease: "easeInOut"
                                }}
                                className="relative inline-block mb-6"
                              >
                                <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full blur-xl opacity-30"></div>
                                <CalendarIcon className="h-20 w-20 mx-auto relative text-slate-300 dark:text-slate-600" />
                              </motion.div>
                              <h3 className="text-xl font-bold text-slate-700 dark:text-slate-300 mb-2">
                                No bookings yet
                              </h3>
                              <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
                                Start by creating your first booking!
                              </p>
                              <Link href="/dashboard">
                                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                                  <Button 
                                    className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 rounded-xl px-6 py-3 font-semibold"
                                    size="default"
                                  >
                                    <Plus className="h-5 w-5 mr-2" />
                                    Make Your First Booking
                                  </Button>
                                </motion.div>
                              </Link>
                            </>
                          )}
                        </motion.div>
                      ) : (
                        filteredBookings.map((booking) => (
                          <BookingCard key={booking.id} booking={booking} />
                        ))
                      )}
                    </AnimatePresence>
                  </CardContent>
                </motion.div>
              </TabsContent>
            </Tabs>
          </motion.div>
        </div>

        {/* Booking Details Dialog - Enhanced */}
        <Dialog open={showBookingDialog} onOpenChange={setShowBookingDialog}>
          <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl bg-gradient-to-br from-white via-slate-50 to-white dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 border-2 border-white/20 dark:border-slate-700/50 shadow-2xl backdrop-blur-xl">
            <DialogHeader className="px-6 pb-4 border-b border-slate-200/50 dark:border-slate-700/50">
              <DialogTitle className="flex items-center gap-3 text-xl font-bold">
                <motion.div
                  className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl shadow-lg"
                  whileHover={{ rotate: 360, scale: 1.1 }}
                  transition={{ duration: 0.5 }}
                >
                  <CalendarIcon className="h-6 w-6 text-white" />
                </motion.div>
                <span className="bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent">
                  Booking Details
                </span>
              </DialogTitle>
              <DialogDescription className="text-sm text-slate-600 dark:text-slate-400 ml-14">
                Complete information about this booking
              </DialogDescription>
            </DialogHeader>
            
            {selectedBooking && (
              <div className="space-y-4 sm:space-y-6 px-4 sm:px-6 pb-4 sm:pb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                  <div className="space-y-3 sm:space-y-4">
                    <div>
                      <h3 className="font-semibold text-base sm:text-lg text-gray-900 dark:text-white">
                        {selectedBooking.amenityName}
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400 mt-1 text-xs sm:text-sm">
                        Community amenity booking
                      </p>
                    </div>
                    
                    <div className="space-y-2 sm:space-y-3">
                      <div className="flex items-center gap-2 sm:gap-3">
                        <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500 flex-shrink-0" />
                        <div className="min-w-0">
                          <div className="font-medium text-sm sm:text-base truncate">{selectedBooking.amenityName}</div>
                          <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                            Community Facility
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 sm:gap-3">
                        <CalendarIcon className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500 flex-shrink-0" />
                        <div className="min-w-0">
                          <div className="font-medium text-sm sm:text-base">
                            {selectedBooking.startTime.toLocaleDateString('en-GB', { 
                              weekday: 'long', 
                              year: 'numeric', 
                              month: 'long', 
                              day: 'numeric' 
                            })}
                          </div>
                          <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                            {formatTimeConsistently(selectedBooking.startTime)} - {formatTimeConsistently(selectedBooking.endTime)}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 sm:gap-3">
                        <Users className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500 flex-shrink-0" />
                        <div className="min-w-0">
                          <div className="font-medium text-sm sm:text-base">{selectedBooking.attendees?.length || 1} Attendees</div>
                          <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 truncate">
                            Booked by {selectedBooking.userId}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-3 sm:space-y-4">
                    <div>
                      <h4 className="font-medium mb-2 text-sm sm:text-base">Status</h4>
                      <Badge className={cn("text-xs sm:text-sm", statusColors[selectedBooking.status as keyof typeof statusColors] || statusColors.confirmed)}>
                        {React.createElement(statusIcons[selectedBooking.status as keyof typeof statusIcons] || statusIcons.confirmed, { className: "w-3 h-3 sm:w-4 sm:h-4 mr-2" })}
                        {(selectedBooking.status || 'confirmed').charAt(0).toUpperCase() + (selectedBooking.status || 'confirmed').slice(1)}
                      </Badge>
                    </div>
                    
                    <div className="space-y-2">
                      <h4 className="font-medium text-sm sm:text-base">Actions</h4>
                      <div className="flex flex-col gap-2">
                        {/* Edit only for own bookings or if admin */}
                        {(isAdmin || selectedBooking.userId === session?.user?.email) && (
                          <Button variant="outline" size="sm" onClick={() => handleBookingAction('edit', selectedBooking)} className="w-full justify-start text-xs sm:text-sm">
                            <Edit className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                            Edit Booking
                          </Button>
                        )}
                        
                        {/* Approve only for admin and pending bookings */}
                        {isAdmin && selectedBooking.status === 'pending' && (
                          <Button variant="outline" size="sm" onClick={() => handleBookingAction('approve', selectedBooking)} className="w-full justify-start text-xs sm:text-sm">
                            <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                            Approve Booking
                          </Button>
                        )}
                        
                        {/* Cancel: Own bookings or admin can cancel any booking */}
                        {(isAdmin || selectedBooking.userId === session?.user?.email) && selectedBooking.status !== 'cancelled' && (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => handleBookingAction('cancel', selectedBooking)}
                            className="w-full justify-start text-red-600 hover:text-red-700 text-xs sm:text-sm"
                          >
                            <Trash2 className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                            {isAdmin && selectedBooking.userId !== session?.user?.email ? 'Cancel Booking (Admin)' : 'Cancel Booking'}
                          </Button>
                        )}
                        
                        {/* Show permission info for residents viewing others' bookings */}
                        {!isAdmin && selectedBooking.userId !== session?.user?.email && (
                          <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 p-2 bg-gray-50 dark:bg-gray-800 rounded">
                            ℹ️ You can only modify your own bookings
                          </div>
                        )}
                        
                        {/* Show admin privileges info */}
                        {isAdmin && selectedBooking.userId !== session?.user?.email && (
                          <div className="text-xs sm:text-sm text-blue-600 dark:text-blue-400 p-2 bg-blue-50 dark:bg-blue-950 rounded">
                            🛡️ Admin: You can manage all community bookings
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
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