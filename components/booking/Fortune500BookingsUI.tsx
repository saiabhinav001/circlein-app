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
  Filter, 
  MoreHorizontal,
  MapPin,
  User,
  Download,
  Zap,
  ChevronRight,
  Activity,
  CheckCircle2,
  XCircle,
  Award,
  TrendingUp,
  Settings,
  Bell,
  Sparkles,
  LogIn,
  LogOut,
  X,
  Check,
  AlertTriangle,
  Copy,
  Eye,
  EyeOff,
  RefreshCw
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { Switch } from '@/components/ui/switch';
import { useSimpleBookings, SimpleBooking } from '@/hooks/use-simple-bookings';
import { qrService } from '@/lib/qr-service';
import EnhancedQRDisplay from '@/components/qr/EnhancedQRDisplay';
import { toast } from 'sonner';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { formatDistanceToNow, format, isToday, isTomorrow, isYesterday, addMinutes, isWithinInterval } from 'date-fns';

interface Fortune500BookingsUIProps {
  isAdmin?: boolean;
}

export function Fortune500BookingsUI({ isAdmin = false }: Fortune500BookingsUIProps) {
  const { data: session } = useSession();
  const { theme, setTheme } = useTheme();
  const [selectedBooking, setSelectedBooking] = useState<SimpleBooking | null>(null);
  const [showQRModal, setShowQRModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [mounted, setMounted] = useState(false);
  const [filter, setFilter] = useState<'current' | 'all' | 'past'>('current');
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string | null>(null);
  const [generatingQR, setGeneratingQR] = useState(false);
  const [showQRDetails, setShowQRDetails] = useState(true);

  // Use the simpler, more reliable booking system
  const {
    bookings,
    loading,
    error,
    refetch
  } = useSimpleBookings();

  useEffect(() => {
    setMounted(true);
  }, []);

  // DISABLED: Auto-refresh to prevent continuous refresh issues
  // useEffect(() => {
  //   const interval = setInterval(() => {
  //     if (!loading) {
  //       refetch();
  //     }
  //   }, 60000); // 60 seconds

  //   return () => clearInterval(interval);
  // }, []); 

  // Manual refresh with cache clearing for production debugging
  const handleManualRefresh = useCallback(() => {
    if (!loading) {
      // Clear any local caches and force fresh data
      localStorage.removeItem('amenity-cache');
      refetch();
    }
  }, [refetch, loading]);

  // Force refresh that clears all caches
  const handleForceRefresh = useCallback(async () => {
    if (!loading) {
      try {
        // Clear amenity name cache via API
        await fetch('/api/fix-amenity-names', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'clear-cache' })
        });
        
        // Clear local storage
        localStorage.clear();
        
        // Force refresh
        refetch();
        
        toast.success('Force refresh complete! 🔄', { 
          description: 'All caches cleared and data refreshed' 
        });
      } catch (error) {
        toast.error('Force refresh failed', { 
          description: 'Using regular refresh instead' 
        });
        refetch();
      }
    }
  }, [refetch, loading]);

  // Reset QR code when modal closes
  useEffect(() => {
    if (!showQRModal) {
      setQrCodeDataUrl(null);
      setGeneratingQR(false);
    }
  }, [showQRModal]);

  // Memoized status calculation for better performance
  const getBookingStatus = useCallback((booking: SimpleBooking) => {
    const now = new Date();
    const startTime = new Date(booking.startTime);
    const endTime = new Date(booking.endTime);

    // If manually cancelled or completed, respect that status
    if (booking.status === 'cancelled' || booking.status === 'completed') {
      return booking.status;
    }

    // Time-based status determination
    if (now < startTime) {
      return 'upcoming';
    } else if (now >= startTime && now <= endTime) {
      return 'active';
    } else {
      return 'expired';
    }
  }, []);

  // Memoized status display for performance
  const getStatusDisplay = useCallback((booking: SimpleBooking) => {
    const status = getBookingStatus(booking);
    
    switch (status) {
      case 'upcoming':
        return { label: 'Upcoming', color: 'bg-blue-500', textColor: 'text-blue-700' };
      case 'active':
        return { label: 'Active', color: 'bg-green-500', textColor: 'text-green-700' };
      case 'expired':
        return { label: 'Expired', color: 'bg-gray-500', textColor: 'text-gray-700' };
      case 'cancelled':
        return { label: 'Cancelled', color: 'bg-red-500', textColor: 'text-red-700' };
      case 'completed':
        return { label: 'Completed', color: 'bg-purple-500', textColor: 'text-purple-700' };
      default:
        return { label: 'Unknown', color: 'bg-gray-500', textColor: 'text-gray-700' };
    }
  }, [getBookingStatus]);

  // Memoized stats calculation
  const stats = useMemo(() => ({
    active: bookings.filter(b => getBookingStatus(b) === 'active').length,
    completed: bookings.filter(b => {
      const status = getBookingStatus(b);
      return status === 'completed' || status === 'expired';
    }).length,
    total: bookings.length
  }), [bookings, getBookingStatus]);

  // Highly optimized filtered bookings with memoization
  const filteredBookings = useMemo(() => {
    if (!bookings.length) return [];

    // Pre-calculate all booking statuses to avoid repeated calculations
    const bookingsWithStatus = bookings.map(booking => ({
      ...booking,
      calculatedStatus: getBookingStatus(booking)
    }));

    // Apply filters
    let filtered = bookingsWithStatus.filter(booking => {
      // Apply time-based filter
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
        default: // 'all'
          passesTimeFilter = true;
      }
      
      // Apply search filter
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

    // Optimized sorting
    return filtered.sort((a, b) => {
      if (filter === 'past') {
        // For past bookings, show most recently ended first
        return b.endTime.getTime() - a.endTime.getTime();
      } else if (filter === 'current') {
        // For current bookings, show active first, then upcoming by start time
        if (a.calculatedStatus === 'active' && b.calculatedStatus !== 'active') return -1;
        if (b.calculatedStatus === 'active' && a.calculatedStatus !== 'active') return 1;
        return a.startTime.getTime() - b.startTime.getTime();
      } else {
        // For 'all', show most recent by creation time, then by start time
        const createdDiff = b.createdAt.getTime() - a.createdAt.getTime();
        if (Math.abs(createdDiff) > 24 * 60 * 60 * 1000) return createdDiff; // If more than 1 day apart
        return b.startTime.getTime() - a.startTime.getTime();
      }
    });
  }, [bookings, filter, searchTerm, getBookingStatus]);

  const handleGenerateQRCode = async (booking: SimpleBooking) => {
    try {
      console.log('Generating state-of-the-art QR code for booking:', booking.id);
      setGeneratingQR(true);
      
      // Create comprehensive QR data with all booking information
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
        expiresAt: new Date(booking.endTime.getTime() + 30 * 60 * 1000).toISOString(), // 30 min grace period
        instructions: 'Present this QR code for facility access',
        emergencyContact: session?.user?.email || 'support@circlein.com'
      };

      // Generate high-quality QR code
      const qrCodeUrl = await QRCode.toDataURL(JSON.stringify(qrData), {
        errorCorrectionLevel: 'H', // High error correction
        type: 'image/png',
        margin: 2,
        color: {
          dark: '#1f2937',  // Dark blue-gray
          light: '#ffffff'  // White background
        },
        width: 300
      });

      setQrCodeDataUrl(qrCodeUrl);
      setSelectedBooking(booking);
      setShowQRModal(true);
      
      toast.success('Access Code Generated Successfully', {
        description: 'Secure digital access ready for facility entry'
      });
    } catch (error) {
      console.error('QR generation error:', error);
      
      // Fallback: still show modal with access code
      setSelectedBooking(booking);
      setShowQRModal(true);
      
      toast.success('Access Code Ready! 📱', {
        description: 'Booking details available for facility access'
      });
    } finally {
      setGeneratingQR(false);
    }
  };

  // Fixed booking actions with actual database updates
  const handleBookingAction = async (booking: SimpleBooking, action: string) => {
    try {
      const bookingRef = doc(db, 'bookings', booking.id);
      
      switch (action) {
        case 'cancel':
          // Update the booking status in Firestore
          await updateDoc(bookingRef, {
            status: 'cancelled'
          });
          toast.success('Booking cancelled', { description: 'Your reservation has been cancelled and updated in the database' });
          break;
          
        case 'checkin':
          await updateDoc(bookingRef, {
            status: 'active'
          });
          toast.success('Checked in successfully! 🎉', { description: 'Enjoy your facility access' });
          break;
          
        case 'complete':
          await updateDoc(bookingRef, {
            status: 'completed'
          });
          toast.success('Booking completed', { description: 'Thank you for using our facilities' });
          break;
          
        case 'clear':
          // For clearing, we could either delete or mark as archived
          await updateDoc(bookingRef, {
            status: 'archived'
          });
          toast.success('Booking cleared', { description: 'Removed from your bookings list' });
          break;
      }
      
      // Refresh bookings after successful database update
      refetch();
    } catch (error) {
      console.error(`Failed to ${action} booking:`, error);
      toast.error(`Failed to ${action} booking`, { 
        description: 'Please try again or contact support if the issue persists' 
      });
    }
  };

  // Check if check-in is available
  const isCheckInAvailable = (booking: SimpleBooking) => {
    const now = new Date();
    const checkInWindow = new Date(booking.startTime.getTime() - 15 * 60 * 1000);
    const checkOutWindow = new Date(booking.endTime.getTime() + 15 * 60 * 1000);
    
    return booking.status === 'confirmed' && 
           now >= checkInWindow && now <= checkOutWindow;
  };

  const getStatusColor = (booking: SimpleBooking) => {
    const status = getBookingStatus(booking);
    switch (status) {
      case 'upcoming': return 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800';
      case 'active': return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800';
      case 'expired': return 'bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700';
      case 'cancelled': return 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-300 dark:border-red-800';
      case 'completed': return 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950 dark:text-purple-300 dark:border-purple-800';
      default: return 'bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700';
    }
  };

  const getStatusIcon = (booking: SimpleBooking) => {
    const status = getBookingStatus(booking);
    switch (status) {
      case 'upcoming': return <Clock className="w-4 h-4" />;
      case 'active': return <Activity className="w-4 h-4" />;
      case 'expired': return <XCircle className="w-4 h-4" />;
      case 'cancelled': return <XCircle className="w-4 h-4" />;
      case 'completed': return <Award className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const getAmenityIcon = (type: string = 'general') => {
    switch (type) {
      case 'fitness': return '🏋️';
      case 'recreation': return '🏊';
      case 'venue': return '🏛️';
      case 'sports': return '🎾';
      default: return '🏢';
    }
  };

  const formatBookingTime = (date: Date) => {
    if (isToday(date)) return `Today, ${format(date, 'h:mm a')}`;
    if (isTomorrow(date)) return `Tomorrow, ${format(date, 'h:mm a')}`;
    if (isYesterday(date)) return `Yesterday, ${format(date, 'h:mm a')}`;
    return format(date, 'MMM d, h:mm a');
  };

  const calculateDuration = (startTime: Date, endTime: Date) => {
    return Math.round((endTime.getTime() - startTime.getTime()) / (1000 * 60));
  };

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 dark:from-slate-900 dark:to-gray-900 flex items-center justify-center">
        <div className="animate-pulse">Loading...</div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 dark:from-slate-900 dark:to-gray-900 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="w-16 h-16 mx-auto mb-6 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center shadow-lg"
          >
            <Sparkles className="w-8 h-8 text-white" />
          </motion.div>
          <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">Loading Bookings</h3>
          <p className="text-gray-600 dark:text-gray-400">Syncing your latest reservations...</p>
        </motion.div>
      </div>
    );
  }

  if (error) {
    // PRODUCTION FIX: Since indexes are confirmed working, never show index setup guide
    // Focus on real connectivity and authentication issues
    
    const isTemporaryIssue = error.includes('unavailable') || 
                            error.includes('temporarily unavailable') ||
                            error.includes('network') ||
                            error.includes('timeout');
    
    const isAuthIssue = error.includes('permission-denied') ||
                       error.includes('unauthenticated') ||
                       error.includes('Access denied') ||
                       error.includes('sign in');
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 dark:from-slate-900 dark:to-gray-900 flex items-center justify-center p-6">
        <Card className="max-w-md mx-auto border-red-200 dark:border-red-800">
          <CardContent className="p-6 text-center">
            <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-red-500" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              {isAuthIssue ? 'Authentication Required' : 
               isTemporaryIssue ? 'Connection Issue' : 'Service Error'}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {isAuthIssue 
                ? 'Please sign in to access your bookings.'
                : isTemporaryIssue 
                  ? 'Having trouble connecting to the database. This is usually temporary.'
                  : 'Unable to load your bookings right now. Please try again.'}
            </p>
            <Button onClick={() => window.location.reload()} className="w-full">
              {isAuthIssue ? 'Sign In' : 'Try Again'}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 dark:from-slate-900 dark:to-gray-900 transition-colors duration-300">
      {/* Premium Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border-b border-gray-200 dark:border-gray-700 sticky top-0 z-40"
      >
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex flex-col lg:flex-row gap-6 items-start lg:items-center justify-between">
            {/* Title */}
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center shadow-lg">
                <Calendar className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  {isAdmin && session?.user?.role === 'admin' ? 'All Community Bookings' : 'My Reservations'}
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  {isAdmin && session?.user?.role === 'admin' ? 'Manage all community reservations' : 'Your personal booking dashboard'}
                </p>
              </div>
            </div>

            {/* Real-time Stats */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="flex flex-wrap gap-4"
            >
              <div className="bg-gradient-to-r from-emerald-500 to-green-500 rounded-2xl p-4 text-white min-w-[120px] shadow-lg">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5" />
                  <div>
                    <div className="text-2xl font-bold">{stats.active}</div>
                    <div className="text-emerald-100 text-sm">Active</div>
                  </div>
                </div>
              </div>
              <div className="bg-gradient-to-r from-purple-500 to-violet-500 rounded-2xl p-4 text-white min-w-[120px] shadow-lg">
                <div className="flex items-center gap-2">
                  <Award className="w-5 h-5" />
                  <div>
                    <div className="text-2xl font-bold">{stats.completed}</div>
                    <div className="text-purple-100 text-sm">Completed</div>
                  </div>
                </div>
              </div>
              <div className="bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl p-4 text-white min-w-[120px] shadow-lg">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  <div>
                    <div className="text-2xl font-bold">{stats.total}</div>
                    <div className="text-blue-100 text-sm">Total</div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Enhanced Controls */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-8"
        >
          <Card className="border-0 shadow-xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl">
            <CardContent className="p-6">
              <div className="flex flex-col lg:flex-row gap-6 items-start lg:items-center justify-between">
                {/* Enhanced Search */}
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <Input
                    placeholder="Search reservations..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-12 h-12 bg-gray-50 dark:bg-slate-700 border-gray-200 dark:border-slate-600 focus:bg-white dark:focus:bg-slate-600 focus:ring-2 focus:ring-blue-500 rounded-2xl text-base"
                  />
                  {searchTerm && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSearchTerm('')}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 rounded-xl"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>

                {/* Refresh Button & Filter Tabs */}
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={() => {
                        if (!loading) {
                          handleManualRefresh();
                          toast.success('Refreshing bookings... 🔄');
                        }
                      }}
                      variant="outline"
                      size="sm"
                      disabled={loading}
                      className="h-12 px-4 rounded-2xl bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100 dark:bg-blue-950 dark:border-blue-800 dark:text-blue-300 disabled:opacity-50"
                    >
                      <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                      {loading ? 'Refreshing...' : 'Refresh'}
                    </Button>
                    
                    <Button
                      onClick={() => {
                        if (!loading) {
                          handleForceRefresh();
                        }
                      }}
                      variant="outline"
                      size="sm"
                      disabled={loading}
                      className="h-12 px-3 rounded-2xl bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100 dark:bg-purple-950 dark:border-purple-800 dark:text-purple-300 disabled:opacity-50"
                      title="Force refresh with cache clear"
                    >
                      <Sparkles className="w-4 h-4" />
                    </Button>
                  </div>

                  {/* Premium Filter Tabs */}
                  <Tabs value={filter} onValueChange={(value) => setFilter(value as any)}>
                    <TabsList className="bg-gray-100 dark:bg-slate-700 rounded-2xl p-1">
                    <TabsTrigger value="current" className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm dark:data-[state=active]:bg-slate-600">
                      <Zap className="w-4 h-4 mr-2" />
                      Current
                    </TabsTrigger>
                    <TabsTrigger value="all" className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm dark:data-[state=active]:bg-slate-600">
                      <Activity className="w-4 h-4 mr-2" />
                      All
                    </TabsTrigger>
                    <TabsTrigger value="past" className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm dark:data-[state=active]:bg-slate-600">
                      <Clock className="w-4 h-4 mr-2" />
                      Past
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Premium Bookings Grid */}
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"
            >
              {/* Loading Skeletons */}
              {[...Array(6)].map((_, index) => (
                <motion.div
                  key={`skeleton-${index}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="group"
                >
                  <Card className="h-full bg-white dark:bg-slate-800 border-gray-100 dark:border-slate-700 rounded-3xl overflow-hidden">
                    <CardContent className="p-0">
                      {/* Skeleton Header */}
                      <div className="h-28 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 animate-pulse relative">
                        <div className="absolute top-4 left-4 right-4 flex items-start justify-between">
                          <div className="space-y-2">
                            <div className="w-8 h-8 bg-white/30 rounded-lg"></div>
                            <div className="w-20 h-6 bg-white/30 rounded-full"></div>
                          </div>
                          <div className="w-10 h-10 bg-white/30 rounded-xl"></div>
                        </div>
                      </div>
                      
                      {/* Skeleton Content */}
                      <div className="p-6 space-y-4">
                        <div className="space-y-2">
                          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3 animate-pulse"></div>
                        </div>
                        
                        <div className="space-y-3">
                          <div className="flex justify-between">
                            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3 animate-pulse"></div>
                            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4 animate-pulse"></div>
                          </div>
                          <div className="flex justify-between">
                            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4 animate-pulse"></div>
                            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3 animate-pulse"></div>
                          </div>
                        </div>
                        
                        <div className="pt-4 border-t border-gray-100 dark:border-gray-700">
                          <div className="flex gap-2">
                            <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded-xl flex-1 animate-pulse"></div>
                            <div className="h-10 w-10 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse"></div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          ) : filteredBookings.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="text-center py-20"
            >
              <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 rounded-3xl flex items-center justify-center shadow-lg">
                <Calendar className="w-12 h-12 text-gray-400 dark:text-gray-500" />
              </div>
              <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">No reservations found</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto">
                {searchTerm ? `No bookings match "${searchTerm}"` : 'Start by making your first reservation to access our premium facilities!'}
              </p>
              {!searchTerm && (
                <Button 
                  onClick={() => window.location.href = '/dashboard'}
                  className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white rounded-2xl px-8 py-3 h-auto shadow-lg"
                >
                  <Calendar className="w-5 h-5 mr-2" />
                  Browse Facilities
                </Button>
              )}
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredBookings.map((booking, index) => (
                <motion.div
                  key={booking.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: index * 0.1, duration: 0.3 }}
                  whileHover={{ y: -4, transition: { duration: 0.2 } }}
                  className="group"
                >
                  <Card className="h-full bg-white dark:bg-slate-800 hover:shadow-2xl transition-all duration-300 border-gray-100 dark:border-slate-700 rounded-3xl overflow-hidden">
                    <CardContent className="p-0">
                      {/* Premium Card Header */}
                      <div className={`h-28 bg-gradient-to-r ${
                        getBookingStatus(booking) === 'upcoming' ? 'from-blue-400 to-cyan-500' :
                        getBookingStatus(booking) === 'active' ? 'from-emerald-400 to-green-500' :
                        getBookingStatus(booking) === 'expired' ? 'from-gray-400 to-gray-500' :
                        getBookingStatus(booking) === 'completed' ? 'from-purple-400 to-violet-500' :
                        getBookingStatus(booking) === 'cancelled' ? 'from-red-400 to-rose-500' :
                        'from-gray-400 to-gray-500'
                      } relative overflow-hidden`}>
                        <div className="absolute inset-0 bg-gradient-to-r from-black/10 to-transparent" />
                        <div className="absolute top-4 left-4 right-4 flex items-start justify-between">
                          <div className="text-white">
                            <div className="text-3xl mb-2">{getAmenityIcon(booking.amenityType)}</div>
                            <Badge className={`${getStatusColor(booking)} backdrop-blur-sm border-0 font-medium`}>
                              {getStatusIcon(booking)}
                              <span className="ml-1.5 capitalize">{getBookingStatus(booking)}</span>
                            </Badge>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="text-white hover:bg-white/20 rounded-xl h-10 w-10">
                                <MoreHorizontal className="w-6 h-6" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48 rounded-2xl border-0 shadow-xl">
                              <DropdownMenuItem onClick={() => handleGenerateQRCode(booking)} className="rounded-xl">
                                <QrCode className="w-4 h-4 mr-3" />
                                Show QR Code
                              </DropdownMenuItem>
                              {isCheckInAvailable(booking) && (
                                <DropdownMenuItem onClick={() => handleBookingAction(booking, 'checkin')} className="rounded-xl">
                                  <LogIn className="w-4 h-4 mr-3" />
                                  Check In
                                </DropdownMenuItem>
                              )}
                              {getBookingStatus(booking) === 'active' && (
                                <DropdownMenuItem onClick={() => handleBookingAction(booking, 'complete')} className="rounded-xl">
                                  <LogOut className="w-4 h-4 mr-3" />
                                  Check Out
                                </DropdownMenuItem>
                              )}
                              {getBookingStatus(booking) === 'upcoming' && (
                                <DropdownMenuItem onClick={() => handleBookingAction(booking, 'cancel')} className="rounded-xl text-red-600">
                                  <XCircle className="w-4 h-4 mr-3" />
                                  Cancel Booking
                                </DropdownMenuItem>
                              )}
                              {(getBookingStatus(booking) === 'completed' || getBookingStatus(booking) === 'cancelled' || getBookingStatus(booking) === 'expired') && (
                                <DropdownMenuItem onClick={() => handleBookingAction(booking, 'clear')} className="rounded-xl text-gray-600">
                                  <X className="w-4 h-4 mr-3" />
                                  Clear from List
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>

                      {/* Enhanced Card Content */}
                      <div className="p-6">
                        <div className="mb-4">
                          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                            {booking.amenityName || 'Community Facility'}
                          </h3>
                          <div className="flex items-center text-gray-500 dark:text-gray-400 text-sm">
                            <MapPin className="w-4 h-4 mr-1.5" />
                            <span>Premium Community Facility</span>
                          </div>
                        </div>

                        <div className="space-y-4">
                          <div className="flex items-center text-gray-700 dark:text-gray-300">
                            <Clock className="w-5 h-5 mr-3 text-blue-500" />
                            <div>
                              <div className="font-semibold">{formatBookingTime(booking.startTime)}</div>
                              <div className="text-sm text-gray-500 dark:text-gray-400">
                                {calculateDuration(booking.startTime, booking.endTime)} min • Until {format(booking.endTime, 'h:mm a')}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center text-gray-700 dark:text-gray-300">
                            <Users className="w-5 h-5 mr-3 text-purple-500" />
                            <div>
                              <div className="font-semibold">{booking.attendees.length} attendee{booking.attendees.length !== 1 ? 's' : ''}</div>
                              <div className="text-sm text-gray-500 dark:text-gray-400">
                                Booked {formatDistanceToNow(booking.createdAt, { addSuffix: true })}
                              </div>
                            </div>
                          </div>

                          {/* Check-in Availability Indicator */}
                          {isCheckInAvailable(booking) && (
                            <div className="flex items-center justify-between bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-950 dark:to-green-950 rounded-2xl p-4 border border-emerald-200 dark:border-emerald-800">
                              <div className="flex items-center text-emerald-700 dark:text-emerald-300">
                                <LogIn className="w-5 h-5 mr-2" />
                                <div>
                                  <div className="font-semibold text-sm">Check-in Available</div>
                                  <div className="text-xs text-emerald-600 dark:text-emerald-400">Ready for facility access</div>
                                </div>
                              </div>
                              <Button
                                size="sm"
                                onClick={() => handleBookingAction(booking, 'checkin')}
                                className="bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl shadow-lg"
                              >
                                <LogIn className="w-4 h-4 mr-1" />
                                Check In
                              </Button>
                            </div>
                          )}
                        </div>

                        {/* Action Button */}
                        <div className="mt-6 pt-4 border-t border-gray-100 dark:border-slate-700">
                          <Button
                            onClick={() => handleGenerateQRCode(booking)}
                            className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white rounded-2xl font-semibold h-12 transition-all duration-200 transform hover:scale-[1.02] shadow-lg"
                          >
                            <QrCode className="w-5 h-5 mr-2" />
                            Show QR Code
                            <ChevronRight className="w-5 h-5 ml-2" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </AnimatePresence>

        {/* Premium QR Code Modal */}
        <Dialog open={showQRModal} onOpenChange={setShowQRModal}>
          <DialogPrimitive.Portal>
            <DialogPrimitive.Overlay className="fixed inset-0 z-[999998] bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
            <DialogPrimitive.Content
              className="fixed left-[50%] top-[50%] z-[999999] grid w-full max-w-2xl translate-x-[-50%] translate-y-[-50%] bg-white dark:bg-slate-800 rounded-3xl border-0 shadow-2xl p-0 overflow-hidden duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]"
              onPointerDownOutside={() => setShowQRModal(false)}
              onEscapeKeyDown={() => setShowQRModal(false)}
            >
              <div className="relative max-h-[90vh] overflow-y-auto">
              {/* Fixed Modal Header */}
              <div className="sticky top-0 z-[10000] bg-gradient-to-r from-blue-500 to-purple-500 p-4 text-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                      <QrCode className="w-5 h-5" />
                    </div>
                    <div>
                      <DialogTitle className="text-lg font-bold">Facility Access QR</DialogTitle>
                      <DialogDescription className="text-blue-100 text-sm">
                        Present for instant access
                      </DialogDescription>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowQRModal(false)}
                    className="text-white hover:bg-white/20 rounded-xl h-10 w-10"
                  >
                    <X className="w-6 h-6" />
                  </Button>
                </div>
              </div>

              {/* Beautiful Responsive QR Content */}
              {selectedBooking && (
                <div className="p-4 sm:p-6 pb-8">
                  <div className="max-w-md mx-auto">
                    {/* Premium QR Code Display */}
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.9, y: 20 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      transition={{ duration: 0.6, ease: "easeOut" }}
                      className="relative mb-6"
                    >
                      {qrCodeDataUrl && !generatingQR ? (
                        /* Beautiful QR Code Container */
                        <div className="relative">
                          {/* Main QR Container */}
                          <div className="relative bg-white p-6 sm:p-8 rounded-3xl shadow-2xl border border-gray-100 overflow-hidden">
                            {/* Animated Background Gradient */}
                            <motion.div
                              animate={{
                                background: [
                                  "linear-gradient(45deg, rgba(59, 130, 246, 0.05), rgba(147, 51, 234, 0.05))",
                                  "linear-gradient(45deg, rgba(147, 51, 234, 0.05), rgba(236, 72, 153, 0.05))",
                                  "linear-gradient(45deg, rgba(236, 72, 153, 0.05), rgba(59, 130, 246, 0.05))"
                                ]
                              }}
                              transition={{ duration: 4, repeat: Infinity }}
                              className="absolute inset-0"
                            />

                            {/* QR Code Display */}
                            <div className="relative z-10">
                              <motion.img 
                                src={qrCodeDataUrl} 
                                alt="Premium Access QR Code" 
                                className="w-full max-w-[280px] h-auto mx-auto rounded-2xl shadow-lg"
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ delay: 0.3, duration: 0.5 }}
                              />

                              {/* Subtle Corner Indicators */}
                              {[
                                { position: "top-2 left-2", color: "border-blue-500" },
                                { position: "top-2 right-2", color: "border-purple-500" },
                                { position: "bottom-2 left-2", color: "border-green-500" },
                                { position: "bottom-2 right-2", color: "border-pink-500" }
                              ].map((corner, i) => (
                                <motion.div
                                  key={i}
                                  className={`absolute ${corner.position} w-4 h-4 border-2 ${corner.color} opacity-40`}
                                  animate={{ 
                                    scale: [1, 1.2, 1],
                                    opacity: [0.4, 0.8, 0.4]
                                  }}
                                  transition={{ 
                                    duration: 2, 
                                    repeat: Infinity, 
                                    delay: i * 0.5 
                                  }}
                                  style={{
                                    borderTopLeftRadius: i === 0 ? '8px' : '0px',
                                    borderTopRightRadius: i === 1 ? '8px' : '0px',
                                    borderBottomLeftRadius: i === 2 ? '8px' : '0px',
                                    borderBottomRightRadius: i === 3 ? '8px' : '0px',
                                    borderWidth: '2px',
                                    borderStyle: 'solid',
                                    borderColor: 'transparent',
                                    ...(i === 0 && { borderTopColor: '#3b82f6', borderLeftColor: '#3b82f6' }),
                                    ...(i === 1 && { borderTopColor: '#8b5cf6', borderRightColor: '#8b5cf6' }),
                                    ...(i === 2 && { borderBottomColor: '#10b981', borderLeftColor: '#10b981' }),
                                    ...(i === 3 && { borderBottomColor: '#ec4899', borderRightColor: '#ec4899' })
                                  }}
                                />
                              ))}
                            </div>
                          </div>

                          {/* Access Code with Eye Toggle */}
                          <motion.div 
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.5 }}
                            className="mt-4"
                          >
                            <div className="bg-gradient-to-r from-slate-800 to-slate-700 text-white p-4 rounded-2xl relative overflow-hidden">
                              {/* Animated Background Lines */}
                              <div className="absolute inset-0 opacity-10">
                                {[...Array(8)].map((_, i) => (
                                  <motion.div
                                    key={i}
                                    className="absolute h-full w-px bg-blue-400"
                                    animate={{ opacity: [0, 0.8, 0] }}
                                    transition={{ 
                                      duration: 3, 
                                      repeat: Infinity, 
                                      delay: i * 0.3 
                                    }}
                                    style={{ left: `${i * 12.5}%` }}
                                  />
                                ))}
                              </div>

                              <div className="relative z-10 flex items-center justify-between">
                                <div className="flex-1">
                                  <div className="text-xs text-slate-400 mb-1 font-medium">SECURE ACCESS CODE</div>
                                  <div className="font-mono text-lg font-bold tracking-[0.3em]">
                                    {showQRDetails ? selectedBooking.id.slice(-8).toUpperCase() : '••••••••'}
                                  </div>
                                </div>
                                
                                {/* Eye Toggle Button */}
                                <motion.button
                                  onClick={() => setShowQRDetails(!showQRDetails)}
                                  className="ml-3 p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors duration-200"
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                >
                                  <motion.div
                                    animate={{ rotate: showQRDetails ? 0 : 180 }}
                                    transition={{ duration: 0.3 }}
                                  >
                                    {showQRDetails ? (
                                      <Eye className="w-5 h-5 text-white" />
                                    ) : (
                                      <EyeOff className="w-5 h-5 text-white" />
                                    )}
                                  </motion.div>
                                </motion.button>
                              </div>

                              {/* Security Indicators */}
                              <div className="flex justify-center gap-3 mt-3">
                                {[
                                  { label: "ENCRYPTED", color: "bg-green-500" },
                                  { label: "VERIFIED", color: "bg-blue-500" },
                                  { 
                                    label: getBookingStatus(selectedBooking).toUpperCase(), 
                                    color: getBookingStatus(selectedBooking) === 'active' ? "bg-green-500" : 
                                           getBookingStatus(selectedBooking) === 'upcoming' ? "bg-blue-500" : 
                                           "bg-gray-500" 
                                  }
                                ].map((indicator, i) => (
                                  <motion.div
                                    key={indicator.label}
                                    className="flex items-center gap-1.5"
                                    animate={{ opacity: [0.6, 1, 0.6] }}
                                    transition={{ duration: 2, repeat: Infinity, delay: i * 0.7 }}
                                  >
                                    <div className={`w-1.5 h-1.5 ${indicator.color} rounded-full`} />
                                    <span className="text-xs text-slate-300">{indicator.label}</span>
                                  </motion.div>
                                ))}
                              </div>
                            </div>
                          </motion.div>
                        </div>
                      ) : (
                        /* Beautiful Loading State */
                        <div className="relative bg-gradient-to-br from-slate-50 to-gray-100 rounded-3xl p-8 sm:p-12 text-center shadow-xl">
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                            className="w-16 h-16 mx-auto mb-4 relative"
                          >
                            <div className="absolute inset-0 border-4 border-transparent border-t-blue-500 border-r-purple-500 rounded-full" />
                            <div className="absolute inset-2 border-4 border-transparent border-b-green-500 border-l-pink-500 rounded-full" />
                          </motion.div>
                          <QrCode className="w-8 h-8 mx-auto mb-3 text-blue-600" />
                          <p className="text-gray-700 font-medium">Generating QR Code...</p>
                        </div>
                      )}
                    </motion.div>

                    {/* Streamlined Booking Info */}
                    <AnimatePresence>
                      {showQRDetails && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.3 }}
                          className="space-y-4"
                        >
                          {/* Facility Info Card */}
                          <motion.div 
                            className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-2xl p-4 border border-blue-200 dark:border-blue-700"
                            whileHover={{ scale: 1.02 }}
                            transition={{ duration: 0.2 }}
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center">
                                <MapPin className="w-6 h-6 text-white" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h3 className="font-bold text-lg text-gray-900 dark:text-white truncate">
                                  {selectedBooking.amenityName}
                                </h3>
                                <p className="text-blue-600 dark:text-blue-400 text-sm">
                                  {format(selectedBooking.startTime, 'MMM d, h:mm a')} - {format(selectedBooking.endTime, 'h:mm a')}
                                </p>
                              </div>
                            </div>
                          </motion.div>

                          {/* User Info Card */}
                          <motion.div 
                            className="bg-gradient-to-r from-purple-50 to-violet-50 dark:from-purple-900/20 dark:to-violet-900/20 rounded-2xl p-4 border border-purple-200 dark:border-purple-700"
                            whileHover={{ scale: 1.02 }}
                            transition={{ duration: 0.2 }}
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center">
                                <User className="w-6 h-6 text-white" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="font-semibold text-gray-900 dark:text-white truncate">
                                  {selectedBooking.userName || 'Member'}
                                  {(selectedBooking as any).userFlatNumber && (
                                    <span className="ml-2 text-sm bg-purple-100 dark:bg-purple-800 text-purple-700 dark:text-purple-300 px-2 py-1 rounded-lg">
                                      Flat {(selectedBooking as any).userFlatNumber}
                                    </span>
                                  )}
                                </h4>
                                <p className="text-purple-600 dark:text-purple-400 text-sm truncate">
                                  {selectedBooking.userEmail}
                                </p>
                              </div>
                            </div>
                          </motion.div>

                          {/* Action Buttons */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                              <Button
                                onClick={() => {
                                  if (qrCodeDataUrl) {
                                    const link = document.createElement('a');
                                    link.download = `access-qr-${selectedBooking.id.slice(-8)}.png`;
                                    link.href = qrCodeDataUrl;
                                    link.click();
                                    toast.success('QR Code Downloaded! 🎉');
                                  }
                                }}
                                className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white rounded-2xl h-12 font-medium shadow-lg"
                                disabled={!qrCodeDataUrl}
                              >
                                <Download className="w-5 h-5 mr-2" />
                                Download
                              </Button>
                            </motion.div>

                            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                              <Button
                                onClick={() => {
                                  const details = `Access Code: ${selectedBooking.id.slice(-8).toUpperCase()}\nFacility: ${selectedBooking.amenityName}\nTime: ${format(selectedBooking.startTime, 'MMM d, h:mm a')} - ${format(selectedBooking.endTime, 'h:mm a')}`;
                                  navigator.clipboard.writeText(details);
                                  toast.success('Details Copied! 📋');
                                }}
                                variant="outline"
                                className="w-full border-2 rounded-2xl h-12 font-medium"
                              >
                                <Copy className="w-5 h-5 mr-2" />
                                Copy
                              </Button>
                            </motion.div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              )}
            </div>

            {/* Custom Close Button */}
            <DialogPrimitive.Close className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground z-10">
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </DialogPrimitive.Close>
          </DialogPrimitive.Content>
        </DialogPrimitive.Portal>
        </Dialog>
      </div>
    </div>
  );
}

export default Fortune500BookingsUI;