'use client';

import React, { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { motion } from 'framer-motion';
import { 
  QrCode, 
  Download, 
  Share2, 
  Clock, 
  MapPin, 
  User, 
  CalendarDays,
  Copy,
  Check,
  Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface EnhancedQRDisplayProps {
  booking: any;
  showDetails?: boolean;
  className?: string;
  size?: number;
}

export function EnhancedQRDisplay({ 
  booking, 
  showDetails = true, 
  className = '',
  size = 200
}: EnhancedQRDisplayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [qrGenerated, setQrGenerated] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    generateQRCode();
  }, [booking]);

  const generateQRCode = async () => {
    if (!canvasRef.current || !booking) return;

    try {
      // Create comprehensive QR data
      const qrData = {
        type: 'circlein-booking',
        version: '2.0',
        bookingId: booking.id,
        userId: booking.userId,
        userEmail: booking.userEmail || booking.userId,
        userName: booking.userName || booking.userEmail?.split('@')[0] || 'Guest',
        communityId: booking.communityId,
        amenityId: booking.amenityId,
        amenityName: booking.amenityName || 'Community Facility',
        amenityType: booking.amenityType || 'general',
        startTime: booking.startTime.toISOString(),
        endTime: booking.endTime.toISOString(),
        status: booking.status,
        timestamp: Date.now(),
        bookingDetails: {
          duration: booking.metadata?.duration || 60,
          attendees: booking.attendees || [],
          checkInTime: booking.checkInTime?.toISOString(),
          checkOutTime: booking.checkOutTime?.toISOString(),
          notes: booking.notes || ''
        },
        securityHash: btoa(`${booking.id}-${booking.userId}-${Date.now()}`)
      };

      const qrString = JSON.stringify(qrData);

      await QRCode.toCanvas(canvasRef.current, qrString, {
        width: size,
        margin: 2,
        color: {
          dark: '#1f2937',
          light: '#ffffff'
        },
        errorCorrectionLevel: 'M'
      });

      setQrGenerated(true);
    } catch (error) {
      console.error('Error generating QR code:', error);
      toast.error('Failed to generate QR code');
    }
  };

  const handleDownload = () => {
    if (!canvasRef.current) return;

    const link = document.createElement('a');
    link.download = `booking-${booking.id}-qr.png`;
    link.href = canvasRef.current.toDataURL();
    link.click();
    
    toast.success('QR code downloaded!');
  };

  const handleShare = async () => {
    if (!canvasRef.current) return;

    try {
      const blob = await new Promise<Blob>((resolve) => {
        canvasRef.current!.toBlob(resolve as any, 'image/png');
      });

      if (navigator.share && navigator.canShare({ files: [new File([blob], 'qr-code.png', { type: 'image/png' })] })) {
        await navigator.share({
          title: `Booking QR - ${booking.amenityName}`,
          text: `QR code for ${booking.amenityName} booking`,
          files: [new File([blob], 'qr-code.png', { type: 'image/png' })]
        });
      } else {
        // Fallback to copying
        handleCopy();
      }
    } catch (error) {
      console.error('Error sharing:', error);
      handleCopy();
    }
  };

  const handleCopy = async () => {
    if (!canvasRef.current) return;

    try {
      const blob = await new Promise<Blob>((resolve) => {
        canvasRef.current!.toBlob(resolve as any, 'image/png');
      });

      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': blob })
      ]);

      setCopied(true);
      toast.success('QR code copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Error copying:', error);
      toast.error('Failed to copy QR code');
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

  return (
    <div className={`space-y-6 ${className}`}>
      {/* QR Code Display */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="relative"
      >
        <div className="bg-white p-6 rounded-3xl shadow-2xl border border-gray-100 relative overflow-hidden">
          {/* Background decoration */}
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 via-white to-purple-50" />
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-indigo-200/30 to-purple-200/30 rounded-full -translate-y-16 translate-x-16" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-indigo-200/20 to-purple-200/20 rounded-full translate-y-12 -translate-x-12" />
          
          <div className="relative z-10 flex flex-col items-center">
            {/* Header */}
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center">
                <QrCode className="w-5 h-5 text-white" />
              </div>
              <div className="text-center">
                <h3 className="font-bold text-gray-900">Booking QR Code</h3>
                <p className="text-sm text-gray-600">Scan for facility access</p>
              </div>
            </div>

            {/* QR Code */}
            <div className="bg-white p-4 rounded-2xl shadow-lg border-2 border-gray-100 mb-4">
              <canvas
                ref={canvasRef}
                className="block"
                style={{ imageRendering: 'pixelated' }}
              />
            </div>

            {/* Status indicator */}
            {qrGenerated && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="flex items-center gap-2 text-green-600 mb-4"
              >
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-sm font-medium">QR Code Ready</span>
              </motion.div>
            )}

            {/* Action buttons - Enhanced for better visibility */}
            <div className="flex gap-3 w-full">
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownload}
                className="flex-1 rounded-xl border-gray-200 hover:bg-gray-50 dark:border-slate-600 dark:hover:bg-slate-700 px-4 py-2"
                title="Download QR Code as PNG"
              >
                <Download className="w-4 h-4 mr-2" />
                <span className="whitespace-nowrap">Download</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopy}
                className="flex-1 rounded-xl border-gray-200 hover:bg-gray-50 dark:border-slate-600 dark:hover:bg-slate-700 px-4 py-2"
                title="Copy QR data to clipboard"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 mr-2 text-emerald-500" />
                    <span className="whitespace-nowrap">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 mr-2" />
                    <span className="whitespace-nowrap">Copy</span>
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleShare}
                className="flex-1 rounded-xl border-gray-200 hover:bg-gray-50 dark:border-slate-600 dark:hover:bg-slate-700 px-4 py-2"
                title="Share QR Code"
              >
                <Share2 className="w-4 h-4 mr-2" />
                <span className="whitespace-nowrap">Share</span>
              </Button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Booking Details */}
      {showDetails && (
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="space-y-4"
        >
          {/* Main info card */}
          <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-4 border border-indigo-100">
            <div className="flex items-start gap-4">
              <div className="text-3xl">{getAmenityIcon(booking.amenityType || 'general')}</div>
              <div className="flex-1">
                <h4 className="font-bold text-gray-900 text-lg mb-1">
                  {booking.amenityName || 'Community Facility'}
                </h4>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-gray-600">
                    <CalendarDays className="w-4 h-4" />
                    <span className="text-sm">
                      {format(booking.startTime, 'EEEE, MMMM d, yyyy')}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Clock className="w-4 h-4" />
                    <span className="text-sm">
                      {format(booking.startTime, 'h:mm a')} - {format(booking.endTime, 'h:mm a')}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <User className="w-4 h-4" />
                    <span className="text-sm">
                      {booking.userName || booking.userEmail?.split('@')[0] || 'Guest'}
                    </span>
                  </div>
                </div>
              </div>
              <Badge className="bg-green-100 text-green-700 border-green-200">
                <Sparkles className="w-3 h-3 mr-1" />
                Active
              </Badge>
            </div>
          </div>

          {/* Additional details */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white rounded-xl p-3 border border-gray-100">
              <div className="text-sm text-gray-600 mb-1">Duration</div>
              <div className="font-semibold text-gray-900">
                {booking.metadata?.duration || 60} minutes
              </div>
            </div>
            <div className="bg-white rounded-xl p-3 border border-gray-100">
              <div className="text-sm text-gray-600 mb-1">Attendees</div>
              <div className="font-semibold text-gray-900">
                {booking.attendees?.length || 1} person{(booking.attendees?.length || 1) !== 1 ? 's' : ''}
              </div>
            </div>
          </div>

          {/* Security note */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
            <div className="flex items-start gap-2">
              <div className="w-4 h-4 bg-amber-400 rounded-full mt-0.5 flex-shrink-0" />
              <div>
                <div className="font-medium text-amber-800 text-sm">Security Information</div>
                <div className="text-amber-700 text-xs mt-1">
                  This QR code contains encrypted booking data for facility access. 
                  Present to security or scan at the facility entrance.
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}

export default EnhancedQRDisplay;