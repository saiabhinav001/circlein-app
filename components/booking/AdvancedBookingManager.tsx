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
  Phone,
  FileText,
  AlertTriangle,
  Eye,
  Download,
  RefreshCw
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { useAdvancedBookings, AdvancedBooking, BookingFilter, BookingStatus } from '@/hooks/use-advanced-bookings';
import { qrService } from '@/lib/qr-service';
import QRCodeDisplay from '@/components/qr/QRCodeDisplay';
import QRScanner from '@/components/qr/QRScanner';
import IndexSetupGuide from '@/components/IndexSetupGuide';
import { toast } from 'sonner';
import { formatDistanceToNow, format } from 'date-fns';

interface AdvancedBookingManagerProps {
  isAdmin?: boolean;
}

export function AdvancedBookingManager({ isAdmin = false }: AdvancedBookingManagerProps) {
  const { data: session } = useSession();
  const [selectedBooking, setSelectedBooking] = useState<AdvancedBooking | null>(null);
  const [showQRCode, setShowQRCode] = useState(false);
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [showBookingDetails, setShowBookingDetails] = useState(false);
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

  // Auto-show QR code for newly confirmed bookings
  useEffect(() => {
    const newlyConfirmedBookings = bookings.filter(
      booking => 
        booking.status === 'confirmed' && 
        !booking.qrCodeGenerated &&
        booking.createdAt &&
        Date.now() - booking.createdAt.getTime() < 5000 // Created within last 5 seconds
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
        toast.success('🎉 Booking confirmed! QR code generated for easy access.');
      } else {
        toast.success('QR code generated successfully');
      }
    } catch (error) {
      console.error('QR generation error:', error);
      toast.error('Failed to generate QR code');
    }
  };

  const handleBookingAction = async (booking: AdvancedBooking, action: string) => {
    switch (action) {
      case 'view-qr':
        if (booking.qrCodeGenerated) {
          setSelectedBooking(booking);
          setShowQRCode(true);
        } else {
          await handleGenerateQRCode(booking);
        }
        break;
      
      case 'generate-qr':
        await handleGenerateQRCode(booking);
        break;
      
      case 'view-details':
        setSelectedBooking(booking);
        setShowBookingDetails(true);
        break;
      
      case 'cancel':
        if (window.confirm(`Are you sure you want to cancel this booking for ${booking.amenityName}?`)) {
          await actions.cancelBooking(booking.id, 'Cancelled by user');
        }
        break;
      
      case 'clear':
        if (window.confirm('This will permanently delete this cancelled booking. Continue?')) {
          await actions.clearCancelledBooking(booking.id);
        }
        break;
      
      case 'complete':
        await actions.completeBooking(booking.id);
        break;
      
      case 'check-in':
        await actions.checkInBooking(booking.id);
        break;
      
      default:
        toast.error('Unknown action');
    }
  };

  const getStatusIcon = (status: string) => {
    const iconClass = "h-4 w-4";
    switch (status) {
      case 'confirmed': return <CheckCircle2 className={`${iconClass} text-green-500`} />;
      case 'in-progress': return <PlayCircle className={`${iconClass} text-blue-500`} />;
      case 'completed': return <CheckCircle2 className={`${iconClass} text-purple-500`} />;
      case 'cancelled': return <XCircle className={`${iconClass} text-red-500`} />;
      case 'expired': return <StopCircle className={`${iconClass} text-gray-500`} />;
      default: return <AlertTriangle className={`${iconClass} text-yellow-500`} />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-800 border-green-200';
      case 'in-progress': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'completed': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
      case 'expired': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    }
  };

  const canCancelBooking = (booking: AdvancedBooking) => {
    const now = new Date();
    const hoursUntilStart = (booking.startTime.getTime() - now.getTime()) / (1000 * 60 * 60);
    return booking.status === 'confirmed' && hoursUntilStart > 24;
  };

  const formatDateTime = (date: Date) => {
    return format(date, 'MMM dd, yyyy • h:mm a');
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins > 0 ? `${mins}m` : ''}`;
    }
    return `${mins}m`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="h-8 w-8 animate-spin text-blue-500 mr-3" />
        <span className="text-lg">Loading bookings...</span>
      </div>
    );
  }

  if (error) {
    // Check if this is an index-related error
    const isIndexError = error.includes('Database index') || error.includes('create Firestore indexes') || error.includes('indexes required');
    
    if (isIndexError) {
      return <IndexSetupGuide show={true} />;
    }
    
    return (
      <Alert variant="destructive" className="my-4">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">
            {isAdmin ? 'Community Bookings' : 'My Bookings'}
          </h1>
          <p className="text-gray-600 mt-1">
            {isAdmin 
              ? 'Manage all community amenity bookings'
              : 'Track and manage your amenity reservations'
            }
          </p>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setShowQRScanner(true)}
            className="flex items-center gap-2"
          >
            <QrCode className="h-4 w-4" />
            Scan QR
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{stats.current}</p>
                <p className="text-sm text-gray-600">Current</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{stats.completed}</p>
                <p className="text-sm text-gray-600">Completed</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-red-500" />
              <div>
                <p className="text-2xl font-bold">{stats.cancelled}</p>
                <p className="text-sm text-gray-600">Cancelled</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <PlayCircle className="h-5 w-5 text-purple-500" />
              <div>
                <p className="text-2xl font-bold">{stats.inProgress}</p>
                <p className="text-sm text-gray-600">In Progress</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search bookings by amenity, user, or notes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Status: {statusFilter === 'all' ? 'All' : statusFilter}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => setStatusFilter('all')}>
              All Statuses
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setStatusFilter('confirmed')}>
              Confirmed
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setStatusFilter('in-progress')}>
              In Progress
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setStatusFilter('completed')}>
              Completed
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setStatusFilter('cancelled')}>
              Cancelled
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Booking Tabs */}
      <Tabs value={filter} onValueChange={(value) => setFilter(value as BookingFilter)}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="current" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Current ({stats.current})
          </TabsTrigger>
          <TabsTrigger value="all" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            All ({stats.total})
          </TabsTrigger>
          <TabsTrigger value="past" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Past ({stats.past})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={filter} className="space-y-4 mt-6">
          <AnimatePresence mode="wait">
            {bookings.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="text-center py-12"
              >
                <Calendar className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">No bookings found</h3>
                <p className="text-gray-600">
                  {filter === 'current' 
                    ? "You don't have any upcoming bookings"
                    : filter === 'past'
                    ? "No past bookings to display"
                    : "No bookings match your current filters"
                  }
                </p>
              </motion.div>
            ) : (
              <div className="space-y-4">
                {bookings.map((booking, index) => (
                  <motion.div
                    key={booking.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <BookingCard
                      booking={booking}
                      isAdmin={isAdmin}
                      onAction={handleBookingAction}
                      canCancel={canCancelBooking(booking)}
                    />
                  </motion.div>
                ))}
              </div>
            )}
          </AnimatePresence>
        </TabsContent>
      </Tabs>

      {/* QR Code Display Dialog */}
      {selectedBooking && (
        <QRCodeDisplay
          booking={selectedBooking}
          isOpen={showQRCode}
          onClose={() => {
            setShowQRCode(false);
            setSelectedBooking(null);
            setAutoShowQR(null);
          }}
        />
      )}

      {/* QR Scanner Dialog */}
      <QRScanner
        isOpen={showQRScanner}
        onClose={() => setShowQRScanner(false)}
        onScanSuccess={(result) => {
          console.log('QR Scan result:', result);
          if (result.success) {
            toast.success(result.message);
          }
        }}
      />

      {/* Booking Details Dialog */}
      {selectedBooking && (
        <BookingDetailsDialog
          booking={selectedBooking}
          isOpen={showBookingDetails}
          onClose={() => {
            setShowBookingDetails(false);
            setSelectedBooking(null);
          }}
          isAdmin={isAdmin}
        />
      )}
    </motion.div>
  );
}

// Booking Card Component
interface BookingCardProps {
  booking: AdvancedBooking;
  isAdmin: boolean;
  onAction: (booking: AdvancedBooking, action: string) => void;
  canCancel: boolean;
}

function BookingCard({ booking, isAdmin, onAction, canCancel }: BookingCardProps) {
  const getStatusIcon = (status: string) => {
    const iconClass = "h-4 w-4";
    switch (status) {
      case 'confirmed': return <CheckCircle2 className={`${iconClass} text-green-500`} />;
      case 'in-progress': return <PlayCircle className={`${iconClass} text-blue-500`} />;
      case 'completed': return <CheckCircle2 className={`${iconClass} text-purple-500`} />;
      case 'cancelled': return <XCircle className={`${iconClass} text-red-500`} />;
      case 'expired': return <StopCircle className={`${iconClass} text-gray-500`} />;
      default: return <AlertTriangle className={`${iconClass} text-yellow-500`} />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-800 border-green-200';
      case 'in-progress': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'completed': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
      case 'expired': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    }
  };

  const formatDateTime = (date: Date) => {
    return format(date, 'MMM dd, yyyy • h:mm a');
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins > 0 ? `${mins}m` : ''}`;
    }
    return `${mins}m`;
  };

  return (
    <Card className="hover:shadow-lg transition-shadow duration-300">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-xl font-semibold flex items-center gap-2">
              {booking.amenityName}
              {booking.qrCodeGenerated && (
                <QrCode className="h-4 w-4 text-blue-500" />
              )}
            </CardTitle>
            
            {isAdmin && (
              <p className="text-sm text-gray-600 mt-1">
                <User className="h-3 w-3 inline mr-1" />
                {booking.userName || booking.userEmail}
              </p>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Badge className={getStatusColor(booking.status)}>
              {getStatusIcon(booking.status)}
              <span className="ml-1">{booking.status.toUpperCase()}</span>
            </Badge>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuSeparator />
                
                <DropdownMenuItem onClick={() => onAction(booking, 'view-details')}>
                  <Eye className="h-4 w-4 mr-2" />
                  View Details
                </DropdownMenuItem>

                {booking.status === 'confirmed' && (
                  <>
                    <DropdownMenuItem onClick={() => onAction(booking, booking.qrCodeGenerated ? 'view-qr' : 'generate-qr')}>
                      <QrCode className="h-4 w-4 mr-2" />
                      {booking.qrCodeGenerated ? 'View QR Code' : 'Generate QR Code'}
                    </DropdownMenuItem>

                    {canCancel && (
                      <DropdownMenuItem onClick={() => onAction(booking, 'cancel')} className="text-red-600">
                        <XCircle className="h-4 w-4 mr-2" />
                        Cancel Booking
                      </DropdownMenuItem>
                    )}
                  </>
                )}

                {booking.status === 'cancelled' && (
                  <DropdownMenuItem onClick={() => onAction(booking, 'clear')} className="text-red-600">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Clear Booking
                  </DropdownMenuItem>
                )}

                {booking.status === 'in-progress' && (
                  <DropdownMenuItem onClick={() => onAction(booking, 'complete')}>
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Complete Booking
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Booking Time Info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-gray-500" />
            <span>{formatDateTime(booking.startTime)}</span>
          </div>
          
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-gray-500" />
            <span>{formatDuration(booking.metadata.duration)}</span>
          </div>

          {booking.attendees.length > 0 && (
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-gray-500" />
              <span>{booking.attendees.length} attendee{booking.attendees.length > 1 ? 's' : ''}</span>
            </div>
          )}

          {booking.checkInTime && (
            <div className="flex items-center gap-2">
              <PlayCircle className="h-4 w-4 text-green-500" />
              <span>Checked in {formatDistanceToNow(booking.checkInTime, { addSuffix: true })}</span>
            </div>
          )}
        </div>

        {/* Admin Cancellation Notice */}
        {booking.adminCancellation && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              This booking was cancelled by administration
              {booking.cancelledBy && ` by ${booking.cancelledBy}`}
              {booking.cancelledAt && ` on ${formatDateTime(booking.cancelledAt)}`}
            </AlertDescription>
          </Alert>
        )}

        {/* Quick Actions */}
        <div className="flex flex-wrap gap-2 pt-2">
          {booking.status === 'confirmed' && (
            <Button
              size="sm"
              onClick={() => onAction(booking, booking.qrCodeGenerated ? 'view-qr' : 'generate-qr')}
              className="flex items-center gap-2"
            >
              <QrCode className="h-3 w-3" />
              {booking.qrCodeGenerated ? 'View QR' : 'Generate QR'}
            </Button>
          )}

          {booking.status === 'confirmed' && canCancel && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => onAction(booking, 'cancel')}
              className="flex items-center gap-2 text-red-600 hover:text-red-700"
            >
              <XCircle className="h-3 w-3" />
              Cancel
            </Button>
          )}

          {booking.status === 'cancelled' && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => onAction(booking, 'clear')}
              className="flex items-center gap-2 text-red-600 hover:text-red-700"
            >
              <Trash2 className="h-3 w-3" />
              Clear
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Booking Details Dialog Component
interface BookingDetailsDialogProps {
  booking: AdvancedBooking;
  isOpen: boolean;
  onClose: () => void;
  isAdmin: boolean;
}

function BookingDetailsDialog({ booking, isOpen, onClose, isAdmin }: BookingDetailsDialogProps) {
  const formatDateTime = (date: Date) => {
    return format(date, 'EEEE, MMMM dd, yyyy • h:mm a');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Booking Details
          </DialogTitle>
          <DialogDescription>
            Complete information for this amenity booking
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{booking.amenityName}</CardTitle>
              <CardDescription>
                {booking.amenityType && `${booking.amenityType} • `}
                Booking ID: {booking.id.slice(-8)}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-600">Start Time</p>
                  <p className="text-sm">{formatDateTime(booking.startTime)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">End Time</p>
                  <p className="text-sm">{formatDateTime(booking.endTime)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Duration</p>
                  <p className="text-sm">{Math.round(booking.metadata.duration / 60)} hours</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Status</p>
                  <Badge className="text-xs">{booking.status.toUpperCase()}</Badge>
                </div>
              </div>

              {booking.attendees.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-2">Attendees</p>
                  <div className="flex flex-wrap gap-1">
                    {booking.attendees.map((attendee, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {attendee}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {booking.notes && (
                <div>
                  <p className="text-sm font-medium text-gray-600">Notes</p>
                  <p className="text-sm text-gray-800">{booking.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Check-in/Check-out Info */}
          {(booking.checkInTime || booking.checkOutTime) && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Activity Log</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {booking.checkInTime && (
                  <div className="flex items-center gap-2 text-sm">
                    <PlayCircle className="h-4 w-4 text-green-500" />
                    <span>Checked in: {formatDateTime(booking.checkInTime)}</span>
                  </div>
                )}
                {booking.checkOutTime && (
                  <div className="flex items-center gap-2 text-sm">
                    <StopCircle className="h-4 w-4 text-blue-500" />
                    <span>Checked out: {formatDateTime(booking.checkOutTime)}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Admin Info */}
          {isAdmin && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Administrative Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="font-medium text-gray-600">User</p>
                    <p>{booking.userName || booking.userEmail}</p>
                  </div>
                  <div>
                    <p className="font-medium text-gray-600">Created</p>
                    <p>{formatDateTime(booking.createdAt)}</p>
                  </div>
                  {booking.cancelledBy && (
                    <>
                      <div>
                        <p className="font-medium text-gray-600">Cancelled By</p>
                        <p>{booking.cancelledBy}</p>
                      </div>
                      <div>
                        <p className="font-medium text-gray-600">Cancelled At</p>
                        <p>{booking.cancelledAt ? formatDateTime(booking.cancelledAt) : 'N/A'}</p>
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default AdvancedBookingManager;