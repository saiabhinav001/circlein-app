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

      // Update booking status to cancelled in database
      console.log('🗑️ Updating booking in database:', {
        bookingId: booking.id,
        userId: booking.userId,
        amenity: booking.amenityName,
        isAdmin,
        currentUser: session?.user?.email
      });

      await updateDoc(doc(db, 'bookings', booking.id), {
        status: 'cancelled',
        cancelledAt: new Date(),
        cancelledBy: session?.user?.email,
        adminCancellation: isAdmin && booking.userId !== session?.user?.email
      });

      console.log('✅ Booking successfully updated to cancelled in database');

      // Get user details for email notification
      const userDoc = await getDoc(doc(db, 'users', booking.userId));
      const userData = userDoc.data();

      // Send cancellation email to the user
      if (userData?.email) {
        try {
          await fetch('/api/notifications/email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              type: 'booking_cancellation',
              data: {
                userEmail: userData.email,
                userName: userData.name || 'Resident',
                amenityName: booking.amenityName,
                date: formatDateConsistently(booking.startTime),
                timeSlot: `${formatTimeConsistently(booking.startTime)} - ${formatTimeConsistently(booking.endTime)}`,
                bookingId: booking.id,
                cancelledBy: session?.user?.email,
                isAdminCancellation: isAdmin && booking.userId !== session?.user?.email,
                cancellationReason: isAdmin && booking.userId !== session?.user?.email ? 
                  'Cancelled by administration' : undefined,
              }
            })
          });
          console.log('✅ Cancellation email sent to:', userData.email);
        } catch (emailError) {
          console.error('⚠️ Failed to send cancellation email:', emailError);
          // Don't fail the cancellation if email fails
        }
      }

      // Send notification for admin cancellations
      if (isAdmin && booking.userId !== session?.user?.email) {
        // Send targeted notification to the specific user
        await sendCommunityNotification({
          title: `🚫 Booking Cancelled by Admin`,
          message: `Your ${booking.amenityName} booking for ${formatDateConsistently(booking.startTime)} at ${formatTimeConsistently(booking.startTime)} has been cancelled by administration. If you have questions, please contact the admin team.`,
          type: 'warning',
          priority: 'high',
          category: 'booking',
          autoHide: false,
          targetUser: booking.userId, // Target the specific user
          metadata: {
            bookingId: booking.id,
            amenityName: booking.amenityName,
            originalUser: booking.userId,
            cancelledBy: session?.user?.email,
            targetUser: booking.userId // Add target user for better filtering
          }
        });

        console.log('📢 Admin cancellation notification sent for booking:', {
          bookingId: booking.id,
          originalUser: booking.userId,
          amenity: booking.amenityName,
          date: formatDateConsistently(booking.startTime)
        });
      }

      toast({
        title: "Booking Cancelled",
        description: `${booking.amenityName} booking has been cancelled successfully.`,
        variant: "destructive",
      });

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
    
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ scale: 1.02 }}
        className={cn(
          "p-3 sm:p-4 rounded-lg border bg-white dark:bg-slate-800/50 shadow-sm hover:shadow-md transition-all duration-200",
          isCompact ? "p-2 sm:p-3" : "p-3 sm:p-4"
        )}
      >
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-2">
              <h3 className={cn(
                "font-semibold text-gray-900 dark:text-white truncate",
                isCompact ? "text-xs sm:text-sm" : "text-sm sm:text-base"
              )}>
                {booking.amenityName}
              </h3>
              <Badge variant="outline" className={cn("text-[10px] sm:text-xs", statusColors[booking.status as keyof typeof statusColors] || statusColors.confirmed)}>
                <StatusIcon className="w-2 h-2 sm:w-3 sm:h-3 mr-1" />
                {booking.status || 'confirmed'}
              </Badge>
              {/* Admin badge for bookings they can manage */}
              {isAdmin && booking.userId !== session?.user?.email && (
                <Badge variant="outline" className="text-[10px] sm:text-xs bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800">
                  Admin Access
                </Badge>
              )}
              {/* Own booking indicator */}
              {booking.userId === session?.user?.email && (
                <Badge variant="outline" className="text-[10px] sm:text-xs bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800">
                  Your Booking
                </Badge>
              )}
            </div>
            
            <div className="space-y-1 text-xs sm:text-sm text-gray-600 dark:text-gray-400">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <MapPin className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                <span className="truncate">{booking.amenityName}</span>
              </div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <Clock className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                <span className="truncate">{formatDateRange(booking.startTime, booking.endTime)}</span>
              </div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <Users className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                <span>{booking.attendees?.length || 1} attendees</span>
              </div>
              {!isCompact && (
                <div className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-500 mt-2 truncate">
                  Booked by {booking.userId}
                </div>
              )}
            </div>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-7 w-7 sm:h-8 sm:w-8 p-0 flex-shrink-0">
                <MoreHorizontal className="w-3 h-3 sm:w-4 sm:h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => handleBookingAction('view', booking)} className="text-xs sm:text-sm">
                <Eye className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                View Details
              </DropdownMenuItem>
              
              {/* Edit only for own bookings or if admin */}
              {(isAdmin || booking.userId === session?.user?.email) && (
                <DropdownMenuItem onClick={() => handleBookingAction('edit', booking)} className="text-xs sm:text-sm">
                  <Edit className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                  Edit Booking
                </DropdownMenuItem>
              )}
              
              {/* Approve only for admin and pending bookings */}
              {isAdmin && booking.status === 'pending' && (
                <DropdownMenuItem onClick={() => handleBookingAction('approve', booking)} className="text-xs sm:text-sm">
                  <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                  Approve
                </DropdownMenuItem>
              )}
              
              {/* Cancel: Own bookings or admin can cancel any booking */}
              {(isAdmin || booking.userId === session?.user?.email) && booking.status !== 'cancelled' && (
                <DropdownMenuItem 
                  onClick={() => handleBookingAction('cancel', booking)}
                  className="text-red-600 focus:text-red-600 text-xs sm:text-sm"
                >
                  <Trash2 className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                  {isAdmin && booking.userId !== session?.user?.email ? 'Cancel (Admin)' : 'Cancel'}
                </DropdownMenuItem>
              )}
              
              {/* Show read-only indicator for other users' bookings when not admin */}
              {!isAdmin && booking.userId !== session?.user?.email && (
                <DropdownMenuItem disabled className="text-gray-400 text-xs sm:text-sm">
                  <Eye className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
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
      <div className="container mx-auto p-3 sm:p-4 md:p-6 lg:p-8 max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-4 sm:space-y-5 md:space-y-6"
        >
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 sm:gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 dark:text-white flex items-center gap-2 sm:gap-3">
              <CalendarIcon className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 text-blue-600" />
              Calendar
              {isAdmin && (
                <Badge className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 border-blue-200 dark:border-blue-800 text-xs sm:text-sm">
                  Admin
                </Badge>
              )}
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1 sm:mt-2 text-sm sm:text-base">
              {isAdmin 
                ? "Manage all community bookings and view events" 
                : "Manage your bookings and view community events"
              }
            </p>
          </div>
          
          <div className="flex items-center gap-2 sm:gap-3">
            <Button 
              variant="outline" 
              onClick={handleRefresh} 
              disabled={refreshing}
              className="flex items-center gap-2 text-xs sm:text-sm"
              size="sm"
            >
              <RefreshCw className={`h-3 h-3 sm:h-4 sm:w-4 ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </Button>
            <Link href="/dashboard">
              <Button className="flex items-center gap-2 text-xs sm:text-sm" size="sm">
                <Plus className="h-3 h-3 sm:h-4 sm:w-4" />
                <span className="hidden xs:inline">New Booking</span>
                <span className="xs:hidden">New</span>
              </Button>
            </Link>
          </div>
        </div>

        {/* Admin Info Panel */}
        {isAdmin && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-blue-200 dark:border-blue-800">
              <CardContent className="pt-4 sm:pt-5 md:pt-6 px-4 sm:px-6">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="p-1.5 sm:p-2 bg-blue-100 dark:bg-blue-900 rounded-full">
                    <Users className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-blue-900 dark:text-blue-100 text-sm sm:text-base">Admin Privileges Active</h3>
                    <p className="text-xs sm:text-sm text-blue-700 dark:text-blue-300">
                      You can view, edit, and cancel all community bookings. Residents will be notified of admin actions.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Filters */}
        <Card>
          <CardContent className="pt-4 sm:pt-5 md:pt-6 px-4 sm:px-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-3 h-3 sm:w-4 sm:h-4 text-gray-400" />
                <Input
                  placeholder="Search bookings..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 sm:pl-10 text-sm sm:text-base h-9 sm:h-10"
                />
              </div>
              
              <Select value={selectedAmenity} onValueChange={setSelectedAmenity}>
                <SelectTrigger className="text-sm sm:text-base h-9 sm:h-10">
                  <SelectValue placeholder="Filter by amenity" />
                </SelectTrigger>
                <SelectContent>
                  {amenityTypes.map((amenity) => (
                    <SelectItem key={amenity} value={amenity} className="text-sm sm:text-base">
                      {amenity}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="text-sm sm:text-base h-9 sm:h-10">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="text-sm sm:text-base">All Status</SelectItem>
                  <SelectItem value="confirmed" className="text-sm sm:text-base">Confirmed</SelectItem>
                  <SelectItem value="pending" className="text-sm sm:text-base">Pending</SelectItem>
                  <SelectItem value="cancelled" className="text-sm sm:text-base">Cancelled</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={viewMode} onValueChange={(value: any) => setViewMode(value)}>
                <SelectTrigger className="text-sm sm:text-base h-9 sm:h-10">
                  <SelectValue placeholder="View mode" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="month" className="text-sm sm:text-base">Month View</SelectItem>
                  <SelectItem value="week" className="text-sm sm:text-base">Week View</SelectItem>
                  <SelectItem value="day" className="text-sm sm:text-base">Day View</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5 md:gap-6">
          {/* Calendar */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader className="pb-3 sm:pb-4 px-4 sm:px-6">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base sm:text-lg">
                    {currentMonth.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}
                  </CardTitle>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigateMonth('prev')}
                      className="h-7 w-7 sm:h-8 sm:w-8 p-0"
                    >
                      <ChevronLeft className="h-3 w-3 sm:h-4 sm:w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigateMonth('next')}
                      className="h-7 w-7 sm:h-8 sm:w-8 p-0"
                    >
                      <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="px-4 sm:px-6">
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
            </Card>

            {/* Quick Stats */}
            <Card className="mt-4 sm:mt-5 md:mt-6">
              <CardHeader className="px-4 sm:px-6">
                <CardTitle className="text-base sm:text-lg">Quick Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 sm:space-y-4 px-4 sm:px-6">
                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                  <div className="text-center space-y-1">
                    <div className="text-xl sm:text-2xl font-bold text-blue-600">{filteredBookings.length}</div>
                    <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Total Bookings</div>
                  </div>
                  <div className="text-center space-y-1">
                    <div className="text-xl sm:text-2xl font-bold text-green-600">
                      {filteredBookings.filter(b => b.status === 'confirmed').length}
                    </div>
                    <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Confirmed</div>
                  </div>
                  <div className="text-center space-y-1">
                    <div className="text-xl sm:text-2xl font-bold text-yellow-600">
                      {filteredBookings.filter(b => b.status === 'pending').length}
                    </div>
                    <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Pending</div>
                  </div>
                  <div className="text-center space-y-1">
                    <div className="text-xl sm:text-2xl font-bold text-red-600">
                      {filteredBookings.filter(b => b.status === 'cancelled').length}
                    </div>
                    <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Cancelled</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Bookings List */}
          <div className="lg:col-span-2">
            <Tabs defaultValue="selected-date" className="space-y-4 sm:space-y-5 md:space-y-6">
              <TabsList className="grid w-full grid-cols-2 h-auto">
                <TabsTrigger value="selected-date" className="text-xs sm:text-sm px-2 py-2 sm:px-4">
                  <span className="hidden sm:inline">Selected Date ({selectedDate ? formatDateConsistently(selectedDate) : ''})</span>
                  <span className="sm:hidden">Selected</span>
                </TabsTrigger>
                <TabsTrigger value="all-bookings" className="text-xs sm:text-sm px-2 py-2 sm:px-4">
                  <span className="hidden sm:inline">All Bookings ({filteredBookings.length})</span>
                  <span className="sm:hidden">All ({filteredBookings.length})</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="selected-date" className="space-y-3 sm:space-y-4">
                <Card>
                  <CardHeader className="px-4 sm:px-6">
                    <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                      <CalendarIcon className="h-4 h-4 sm:h-5 sm:w-5" />
                      <span className="truncate text-sm sm:text-base">
                        {selectedDate?.toLocaleDateString('en-GB', { 
                          weekday: 'long', 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })}
                      </span>
                    </CardTitle>
                    <CardDescription className="text-xs sm:text-sm">
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
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="text-center py-6 sm:py-8 text-gray-500 dark:text-gray-400"
                        >
                          <CalendarIcon className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-3 sm:mb-4 opacity-50" />
                          <p className="text-sm sm:text-base">No bookings scheduled for this date</p>
                          <p className="text-xs sm:text-sm mt-2">Book an amenity to see it appear here</p>
                          <Link href="/dashboard">
                            <Button variant="outline" className="mt-3 sm:mt-4 text-xs sm:text-sm" size="sm">
                              <Plus className="h-3 h-3 sm:h-4 sm:w-4 mr-2" />
                              Create Booking
                            </Button>
                          </Link>
                        </motion.div>
                      ) : (
                        selectedDateBookings.map((booking) => (
                          <BookingCard key={booking.id} booking={booking} />
                        ))
                      )}
                    </AnimatePresence>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="all-bookings" className="space-y-3 sm:space-y-4">
                <Card>
                  <CardHeader className="px-4 sm:px-6">
                    <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                      <Filter className="h-4 h-4 sm:h-5 sm:w-5" />
                      All Bookings
                    </CardTitle>
                    <CardDescription className="text-xs sm:text-sm">
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
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="text-center py-6 sm:py-8 text-gray-500 dark:text-gray-400"
                        >
                          {searchQuery || selectedAmenity !== 'All Amenities' || selectedStatus !== 'all' ? (
                            <>
                              <Search className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-3 sm:mb-4 opacity-50" />
                              <p className="text-sm sm:text-base">No bookings match your current filters</p>
                              <Button variant="outline" className="mt-3 sm:mt-4 text-xs sm:text-sm" size="sm" onClick={() => {
                                setSearchQuery('');
                                setSelectedAmenity('All Amenities');
                                setSelectedStatus('all');
                              }}>
                                Clear Filters
                              </Button>
                            </>
                          ) : (
                            <>
                              <CalendarIcon className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-3 sm:mb-4 opacity-50" />
                              <p className="text-sm sm:text-base">No bookings yet</p>
                              <p className="text-xs sm:text-sm mt-2">Start by booking your first amenity to see it here</p>
                              <Link href="/dashboard">
                                <Button variant="outline" className="mt-3 sm:mt-4 text-xs sm:text-sm" size="sm">
                                  <Plus className="h-3 h-3 sm:h-4 sm:w-4 mr-2" />
                                  Make Your First Booking
                                </Button>
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
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>

        {/* Booking Details Dialog */}
        <Dialog open={showBookingDialog} onOpenChange={setShowBookingDialog}>
          <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader className="px-4 sm:px-6">
              <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
                <CalendarIcon className="h-4 h-4 sm:h-5 sm:w-5" />
                Booking Details
              </DialogTitle>
              <DialogDescription className="text-xs sm:text-sm">
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
    </CalendarErrorBoundary>
  );
}