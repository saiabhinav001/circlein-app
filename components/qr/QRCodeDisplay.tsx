'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { QrCode, Download, RefreshCw, Clock, CheckCircle, XCircle, AlertTriangle, Eye, EyeOff } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { qrService, QRCodeData } from '@/lib/qr-service';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';

interface QRCodeDisplayProps {
  booking: any;
  isOpen: boolean;
  onClose: () => void;
}

export function QRCodeDisplay({ booking, isOpen, onClose }: QRCodeDisplayProps) {
  const [qrData, setQrData] = useState<QRCodeData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showQR, setShowQR] = useState(true);

  useEffect(() => {
    if (isOpen && booking) {
      generateQRCode();
    }
  }, [isOpen, booking]);

  const generateQRCode = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const qrCodeData = await qrService.generateQRCode(booking);
      setQrData(qrCodeData);
      toast.success('QR code generated successfully');
    } catch (err) {
      setError('Failed to generate QR code');
      toast.error('Failed to generate QR code');
      console.error('QR generation error:', err);
    } finally {
      setLoading(false);
    }
  };

  const downloadQRCode = () => {
    if (!qrData?.qrCodeUrl) return;

    const link = document.createElement('a');
    link.download = `booking-qr-${booking.amenityName}-${new Date().toISOString().split('T')[0]}.png`;
    link.href = qrData.qrCodeUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('QR code downloaded');
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'used':
        return <CheckCircle className="h-4 w-4 text-blue-500" />;
      case 'expired':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'cancelled':
        return <XCircle className="h-4 w-4 text-gray-500" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 border-green-200';
      case 'used': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'expired': return 'bg-red-100 text-red-800 border-red-200';
      case 'cancelled': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    }
  };

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    }).format(date);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }).format(date);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md mx-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5" />
            Booking QR Code
          </DialogTitle>
          <DialogDescription>
            Use this QR code to access {booking?.amenityName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-8 w-8 animate-spin text-blue-500" />
              <span className="ml-2 text-sm text-gray-600">Generating QR code...</span>
            </div>
          ) : qrData ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-4"
            >
              {/* QR Code Display */}
              <Card>
                <CardContent className="p-4">
                  <div className="flex flex-col items-center space-y-4">
                    <div className="relative">
                      <AnimatePresence mode="wait">
                        {showQR ? (
                          <motion.img
                            key="qr-visible"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            src={qrData.qrCodeUrl}
                            alt="Booking QR Code"
                            className="w-48 h-48 border-2 border-gray-200 rounded-lg"
                          />
                        ) : (
                          <motion.div
                            key="qr-hidden"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="w-48 h-48 border-2 border-gray-200 rounded-lg bg-gray-100 flex items-center justify-center"
                          >
                            <div className="text-center">
                              <EyeOff className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                              <p className="text-sm text-gray-500">QR Code Hidden</p>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        className="absolute top-2 right-2"
                        onClick={() => setShowQR(!showQR)}
                      >
                        {showQR ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>

                    <div className="text-center space-y-2">
                      <div className="flex items-center justify-center gap-2">
                        {getStatusIcon(qrData.status)}
                        <Badge className={getStatusColor(qrData.status)}>
                          {qrData.status.toUpperCase()}
                        </Badge>
                      </div>
                      
                      <p className="text-sm text-gray-600">
                        Scan count: {qrData.scanCount}
                      </p>
                      
                      {qrData.lastScannedAt && (
                        <p className="text-xs text-gray-500">
                          Last scanned {formatDistanceToNow(qrData.lastScannedAt, { addSuffix: true })}
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Booking Details */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Booking Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500">Amenity</p>
                      <p className="font-medium">{booking.amenityName}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Date</p>
                      <p className="font-medium">{formatDate(booking.startTime)}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Time</p>
                      <p className="font-medium">
                        {formatTime(booking.startTime)} - {formatTime(booking.endTime)}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500">Expires</p>
                      <p className="font-medium text-xs">
                        {formatDistanceToNow(qrData.expiresAt, { addSuffix: true })}
                      </p>
                    </div>
                  </div>

                  {/* Check-in/Check-out Status */}
                  {(qrData.checkInTime || qrData.checkOutTime) && (
                    <div className="pt-2 border-t space-y-2">
                      {qrData.checkInTime && (
                        <div className="flex items-center gap-2 text-sm">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <span>Checked in: {formatTime(qrData.checkInTime)}</span>
                        </div>
                      )}
                      {qrData.checkOutTime && (
                        <div className="flex items-center gap-2 text-sm">
                          <CheckCircle className="h-4 w-4 text-blue-500" />
                          <span>Checked out: {formatTime(qrData.checkOutTime)}</span>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <Button
                  onClick={downloadQRCode}
                  className="flex-1"
                  variant="outline"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
                <Button
                  onClick={generateQRCode}
                  variant="outline"
                  size="icon"
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>

              {/* Security Notice */}
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription className="text-xs">
                  Keep this QR code secure. It provides access to your booking. Do not share with others.
                </AlertDescription>
              </Alert>
            </motion.div>
          ) : (
            <div className="text-center py-8">
              <QrCode className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">No QR code generated yet</p>
              <Button onClick={generateQRCode}>
                Generate QR Code
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default QRCodeDisplay;