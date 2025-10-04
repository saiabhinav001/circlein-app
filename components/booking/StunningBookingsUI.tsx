'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSession } from 'next-auth/react';
import { 
  Calendar, 
  Clock, 
  Users, 
  QrCode, 
  Search, 
  Filter, 
  Trash2, 
  CheckCircle2, 
  XCircle, 
  PlayCircle,
  StopCircle,
  MoreHorizontal,
  MapPin,
  User,
  Eye,
  Download,
  RefreshCw,
  Zap,
  Star,
  ChevronRight,
  Activity,
  Timer,
  CalendarDays,
  Sparkles,
  TrendingUp,
  Award,
  Heart
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAdvancedBookings, AdvancedBooking, BookingFilter, BookingStatus } from '@/hooks/use-advanced-bookings';
import { qrService } from '@/lib/qr-service';
import EnhancedQRDisplay from '@/components/qr/EnhancedQRDisplay';
import IndexSetupGuide from '@/components/IndexSetupGuide';
import { toast } from 'sonner';
import { formatDistanceToNow, format, isToday, isTomorrow, isYesterday } from 'date-fns';

interface StunningBookingsUIProps {
  isAdmin?: boolean;
}

export function StunningBookingsUI({ isAdmin = false }: StunningBookingsUIProps) {
  const { data: session } = useSession();
  const [selectedBooking, setSelectedBooking] = useState<AdvancedBooking | null>(null);
  const [showQRCode, setShowQRCode] = useState(false);
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [autoShowQR, setAutoShowQR] = useState<string | null>(null);

  const {
    bookings,
    loading,
    error,
    filter,
    setFilter,
    statusFilter,
    setStatusFilter,
    searchTerm,
    setSearchTerm,
    stats,
    actions
  } = useAdvancedBookings({
    userEmail: session?.user?.email,
    communityId: session?.user?.communityId,
    isAdmin
  });

  // Auto-show QR for newly confirmed bookings
  useEffect(() => {
    const newlyConfirmedBookings = bookings.filter(booking => 
      booking.status === 'confirmed' && 
      !booking.qrCodeGenerated &&
      booking.createdAt &&
      Date.now() - booking.createdAt.getTime() < 5000
    );

    if (newlyConfirmedBookings.length > 0 && !autoShowQR) {
      const booking = newlyConfirmedBookings[0];
      setAutoShowQR(booking.id);
      handleGenerateQRCode(booking, true);
    }
  }, [bookings, autoShowQR]);

  const handleGenerateQRCode = async (booking: AdvancedBooking, autoShow = false) => {
    try {
      await qrService.generateQRCode(booking, { 
        autoShow,
        includeUserInfo: true,
        emergencyContact: session?.user?.email 
      });
      
      setSelectedBooking(booking);
      setShowQRCode(true);
      
      if (autoShow) {
        toast.success('QR Code generated! 🎉', {
          description: 'Your booking QR code is ready for check-in'
        });
      }
    } catch (error) {
      console.error('QR generation error:', error);
      toast.error('Failed to generate QR code');
    }
  };

  const handleBookingAction = async (booking: AdvancedBooking, action: string) => {
    try {
      switch (action) {
        case 'cancel':
          await actions.cancelBooking(booking.id);
          toast.success('Booking cancelled successfully');
          break;
        case 'clear':
          await actions.clearCancelledBooking(booking.id);
          toast.success('Booking cleared from view');
          break;
        case 'complete':
          await actions.completeBooking(booking.id);
          toast.success('Booking marked as completed');
          break;
        case 'checkin':
          await actions.checkInBooking(booking.id);
          toast.success('Checked in successfully');
          break;
        default:
          toast.error('Unknown action');
      }
    } catch (error) {
      toast.error(`Failed to ${action} booking`);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed': return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case 'cancelled': return <XCircle className="w-4 h-4 text-red-500" />;
      case 'completed': return <Award className="w-4 h-4 text-purple-500" />;
      case 'in-progress': return <Activity className="w-4 h-4 text-blue-500" />;
      default: return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-green-50 text-green-700 border-green-200';
      case 'cancelled': return 'bg-red-50 text-red-700 border-red-200';
      case 'completed': return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'in-progress': return 'bg-blue-50 text-blue-700 border-blue-200';
      default: return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const getAmenityIcon = (type: string) => {
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full flex items-center justify-center"
          >
            <Sparkles className="w-8 h-8 text-white" />
          </motion.div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Loading Your Bookings</h3>
          <p className="text-gray-600">Preparing your personalized experience...</p>
        </motion.div>
      </div>
    );
  }

  if (error) {
    const isIndexError = error.includes('Database index') || error.includes('create Firestore indexes') || error.includes('indexes required');
    
    if (isIndexError) {
      return <IndexSetupGuide show={true} />;
    }
    
    return (
      <Alert variant="destructive" className="my-4">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {/* Hero Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white shadow-xl border-b border-gray-100"
      >
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex flex-col lg:flex-row gap-6 items-start lg:items-center justify-between">
            {/* Title Section */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center">
                  <CalendarDays className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                    {isAdmin ? 'Community Bookings' : 'My Bookings'}
                  </h1>
                  <p className="text-gray-600">
                    {isAdmin ? 'Manage all community reservations' : 'Your personal booking dashboard'}
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Stats Cards */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="flex flex-wrap gap-4"
            >
              <div className="bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl p-4 text-white min-w-[120px]">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5" />
                  <div>
                    <div className="text-2xl font-bold">{stats.active}</div>
                    <div className="text-green-100 text-sm">Active</div>
                  </div>
                </div>
              </div>
              <div className="bg-gradient-to-r from-purple-500 to-violet-500 rounded-xl p-4 text-white min-w-[120px]">
                <div className="flex items-center gap-2">
                  <Award className="w-5 h-5" />
                  <div>
                    <div className="text-2xl font-bold">{stats.completed}</div>
                    <div className="text-purple-100 text-sm">Completed</div>
                  </div>
                </div>
              </div>
              <div className="bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl p-4 text-white min-w-[120px]">
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
        {/* Controls */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-8"
        >
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
            <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
              {/* Search */}
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  placeholder="Search bookings..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-gray-50 border-gray-200 focus:bg-white focus:ring-2 focus:ring-indigo-500 rounded-xl"
                />
              </div>

              {/* Filters */}
              <div className="flex gap-3">
                <Tabs value={filter} onValueChange={(value) => setFilter(value as BookingFilter)}>
                  <TabsList className="bg-gray-100 rounded-xl">
                    <TabsTrigger value="current" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
                      <Zap className="w-4 h-4 mr-2" />
                      Current
                    </TabsTrigger>
                    <TabsTrigger value="all" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
                      <Activity className="w-4 h-4 mr-2" />
                      All
                    </TabsTrigger>
                    <TabsTrigger value="past" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
                      <Timer className="w-4 h-4 mr-2" />
                      Past
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Bookings Grid */}
        <AnimatePresence>
          {bookings.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="text-center py-16"
            >
              <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-r from-gray-100 to-gray-200 rounded-full flex items-center justify-center">
                <Calendar className="w-12 h-12 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No bookings found</h3>
              <p className="text-gray-600 mb-6">Start by making your first reservation!</p>
              <Button className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600">
                <CalendarDays className="w-4 h-4 mr-2" />
                Browse Amenities
              </Button>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {bookings.map((booking, index) => (
                <motion.div
                  key={booking.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: index * 0.1, duration: 0.3 }}
                  whileHover={{ y: -4, transition: { duration: 0.2 } }}
                  className="group"
                >
                  <Card className="h-full bg-white hover:shadow-2xl transition-all duration-300 border-gray-100 rounded-2xl overflow-hidden">
                    <CardContent className="p-0">
                      {/* Card Header with Gradient */}
                      <div className={`h-24 bg-gradient-to-r ${
                        booking.status === 'confirmed' ? 'from-green-400 to-emerald-500' :
                        booking.status === 'completed' ? 'from-purple-400 to-violet-500' :
                        booking.status === 'cancelled' ? 'from-red-400 to-rose-500' :
                        'from-blue-400 to-cyan-500'
                      } relative overflow-hidden`}>
                        <div className="absolute inset-0 bg-black/10" />
                        <div className="absolute top-4 left-4 right-4 flex items-start justify-between">
                          <div className="text-white">
                            <div className="text-2xl mb-1">{getAmenityIcon(booking.amenityType || 'general')}</div>
                            <Badge className={`${getStatusColor(booking.status)} backdrop-blur-sm`}>
                              {getStatusIcon(booking.status)}
                              <span className="ml-1 capitalize">{booking.status}</span>
                            </Badge>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="text-white hover:bg-white/20 rounded-full">
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                              <DropdownMenuItem onClick={() => handleGenerateQRCode(booking)}>
                                <QrCode className="w-4 h-4 mr-2" />
                                Generate QR Code
                              </DropdownMenuItem>
                              {booking.status === 'confirmed' && (
                                <DropdownMenuItem onClick={() => handleBookingAction(booking, 'checkin')}>
                                  <PlayCircle className="w-4 h-4 mr-2" />
                                  Check In
                                </DropdownMenuItem>
                              )}
                              {booking.status === 'confirmed' && (
                                <DropdownMenuItem onClick={() => handleBookingAction(booking, 'cancel')}>
                                  <XCircle className="w-4 h-4 mr-2" />
                                  Cancel Booking
                                </DropdownMenuItem>
                              )}
                              {booking.status === 'cancelled' && (
                                <DropdownMenuItem onClick={() => handleBookingAction(booking, 'clear')}>
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Clear from View
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>

                      {/* Card Content */}
                      <div className="p-6">
                        <div className="mb-4">
                          <h3 className="text-xl font-bold text-gray-900 mb-1 group-hover:text-indigo-600 transition-colors">
                            {booking.amenityName}
                          </h3>
                          <div className="flex items-center text-gray-500 text-sm">
                            <MapPin className="w-4 h-4 mr-1" />
                            <span>Community Facility</span>
                          </div>
                        </div>

                        <div className="space-y-3">
                          <div className="flex items-center text-gray-700">
                            <Clock className="w-4 h-4 mr-3 text-indigo-500" />
                            <div>
                              <div className="font-medium">{formatBookingTime(booking.startTime)}</div>
                              <div className="text-sm text-gray-500">
                                {booking.metadata.duration} minutes • {format(booking.endTime, 'h:mm a')}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center text-gray-700">
                            <Users className="w-4 h-4 mr-3 text-purple-500" />
                            <div>
                              <div className="font-medium">{booking.attendees.length} attendee{booking.attendees.length !== 1 ? 's' : ''}</div>
                              <div className="text-sm text-gray-500">
                                {formatDistanceToNow(booking.createdAt, { addSuffix: true })}
                              </div>
                            </div>
                          </div>

                          {booking.qrCodeGenerated && (
                            <div className="flex items-center justify-between bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-3">
                              <div className="flex items-center text-indigo-700">
                                <QrCode className="w-4 h-4 mr-2" />
                                <span className="text-sm font-medium">QR Ready</span>
                              </div>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleGenerateQRCode(booking)}
                                className="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-100 rounded-lg"
                              >
                                <Eye className="w-4 h-4 mr-1" />
                                View
                              </Button>
                            </div>
                          )}
                        </div>

                        {/* Action Button */}
                        <div className="mt-6 pt-4 border-t border-gray-100">
                          <Button
                            onClick={() => handleGenerateQRCode(booking)}
                            className="w-full bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white rounded-xl font-medium transition-all duration-200 transform hover:scale-[1.02]"
                          >
                            <QrCode className="w-4 h-4 mr-2" />
                            Show QR Code
                            <ChevronRight className="w-4 h-4 ml-2" />
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

        {/* Enhanced QR Code Dialog */}
        <Dialog open={showQRCode} onOpenChange={setShowQRCode}>
          <DialogContent className="sm:max-w-md bg-white rounded-3xl border-0 shadow-2xl">
            <DialogHeader className="text-center pb-4">
              <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full flex items-center justify-center">
                <QrCode className="w-8 h-8 text-white" />
              </div>
              <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Your QR Code
              </DialogTitle>
              <DialogDescription className="text-gray-600">
                Show this QR code for quick check-in at the facility
              </DialogDescription>
            </DialogHeader>
            
            {selectedBooking && (
              <div className="space-y-6">
                {/* QR Code Display */}
                <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-6">
                  <EnhancedQRDisplay 
                    booking={selectedBooking}
                    showDetails={true}
                    className="mx-auto"
                  />
                </div>

                {/* Booking Details Card */}
                <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="text-2xl">{getAmenityIcon(selectedBooking.amenityType || 'general')}</div>
                    <div>
                      <h4 className="font-semibold text-gray-900">{selectedBooking.amenityName}</h4>
                      <p className="text-sm text-gray-600">{formatBookingTime(selectedBooking.startTime)}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Duration:</span>
                    <span className="font-medium">{selectedBooking.metadata.duration} minutes</span>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Status:</span>
                    <Badge className={getStatusColor(selectedBooking.status)}>
                      {getStatusIcon(selectedBooking.status)}
                      <span className="ml-1 capitalize">{selectedBooking.status}</span>
                    </Badge>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setShowQRCode(false)}
                    className="flex-1 rounded-xl border-gray-200 hover:bg-gray-50"
                  >
                    Close
                  </Button>
                  <Button
                    onClick={() => {
                      // Trigger download
                      const canvas = document.querySelector('canvas');
                      if (canvas) {
                        const link = document.createElement('a');
                        link.download = `booking-${selectedBooking.id}.png`;
                        link.href = canvas.toDataURL();
                        link.click();
                      }
                    }}
                    className="flex-1 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 rounded-xl"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

export default StunningBookingsUI;