import QRCode from 'qrcode';
import { collection, doc, addDoc, updateDoc, getDoc, getDocs, query, where, Timestamp, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';

export interface QRCodeData {
  id: string;
  bookingId: string;
  userId: string;
  userEmail: string;
  userName?: string;
  communityId: string;
  amenityId: string;
  amenityName: string;
  amenityType?: string;
  amenityLocation?: string;
  amenityDescription?: string;
  startTime: Date;
  endTime: Date;
  status: 'active' | 'used' | 'expired' | 'cancelled';
  createdAt: Date;
  expiresAt: Date;
  scanCount: number;
  lastScannedAt?: Date;
  lastScannedBy?: string;
  checkInTime?: Date;
  checkOutTime?: Date;
  qrCodeUrl: string;
  securityHash: string;
  bookingDetails: {
    duration: number;
    attendees: string[];
    notes?: string;
    specialRequirements?: string[];
    contactInfo?: string;
  };
  currentAmenityBookings?: {
    id: string;
    userEmail: string;
    userName?: string;
    startTime: Date;
    endTime: Date;
    status: string;
    checkInTime?: Date;
    checkOutTime?: Date;
  }[];
  metadata: {
    userAgent?: string;
    ipAddress?: string;
    geolocation?: { lat: number; lng: number };
    deviceInfo?: string;
    scanLocation?: string;
  };
}

export interface QRScanResult {
  success: boolean;
  message: string;
  data?: QRCodeData;
  action?: 'check-in' | 'check-out' | 'view-details' | 'early-access' | 'expired';
  errors?: string[];
  warnings?: string[];
}

export interface QRGenerationOptions {
  autoShow?: boolean;
  includeUserInfo?: boolean;
  customExpiry?: Date;
  emergencyContact?: string;
}

class QRService {
  private generateSecurityHash(data: any): string {
    // Generate a secure hash for QR code validation
    const payload = JSON.stringify({
      bookingId: data.bookingId,
      userId: data.userId,
      timestamp: data.timestamp
    });
    return btoa(payload);
  }

  private validateSecurityHash(qrData: any, hash: string): boolean {
    const expectedHash = this.generateSecurityHash({
      bookingId: qrData.bookingId,
      userId: qrData.userId,
      timestamp: qrData.timestamp
    });
    return expectedHash === hash;
  }

  async generateQRCode(booking: any, options: QRGenerationOptions = {}): Promise<QRCodeData> {
    try {
      // Get real-time amenity information with comprehensive fallback
      let amenityDetails = {
        name: booking.amenityName || 'Community Facility',
        type: booking.amenityType || 'general',
        location: 'Premium Community Facility',
        description: `Access to ${booking.amenityName || 'Community Facility'}`
      };

      // Ensure we never show "Unknown Amenity"
      if (amenityDetails.name === 'Unknown Amenity' || !amenityDetails.name) {
        amenityDetails.name = 'Community Facility';
      }

      try {
        const amenityDoc = await getDoc(doc(db, 'amenities', booking.amenityId));
        if (amenityDoc.exists()) {
          const data = amenityDoc.data();
          amenityDetails = {
            name: data.name || booking.amenityName || 'Community Amenity',
            type: data.type || booking.amenityType || 'general',
            location: data.location || 'Community Facility',
            description: data.description || `${data.name || booking.amenityName} facility`
          };
        } else {
          // If amenity doc doesn't exist, use booking data with sensible defaults
          console.log('Amenity document not found, using booking data:', {
            amenityId: booking.amenityId,
            amenityName: booking.amenityName,
            amenityType: booking.amenityType
          });
        }
      } catch (err) {
        console.warn('Could not fetch amenity details, using booking fallback:', err);
        // Keep the fallback data we already set
      }

      // Get current bookings for this amenity (for security context)
      const currentAmenityBookings = await this.getCurrentAmenityBookings(booking.amenityId, booking.communityId);

      // Create comprehensive QR code data structure
      const qrData = {
        bookingId: booking.id,
        userId: booking.userId,
        userEmail: booking.userId, // userId is actually email in this system
        userName: booking.userName || booking.userEmail || booking.userId,
        communityId: booking.communityId,
        amenityId: booking.amenityId,
        amenityName: amenityDetails.name,
        amenityType: amenityDetails.type,
        amenityLocation: amenityDetails.location,
        amenityDescription: amenityDetails.description,
        startTime: booking.startTime,
        endTime: booking.endTime,
        timestamp: Date.now(),
        bookingDetails: {
          duration: Math.round((booking.endTime.getTime() - booking.startTime.getTime()) / (1000 * 60)),
          attendees: booking.attendees || [],
          notes: booking.notes || '',
          specialRequirements: booking.specialRequirements || [],
          contactInfo: options.emergencyContact || booking.contactInfo || ''
        },
        currentAmenityBookings
      };

      const securityHash = this.generateSecurityHash(qrData);

      // Create the QR code payload with enhanced security
      const qrPayload = {
        type: 'circlein-booking-access',
        version: '2.0',
        data: qrData,
        hash: securityHash,
        generated: new Date().toISOString(),
        expiryGrace: 30 // minutes after booking end
      };

      // Generate high-quality QR code
      const qrCodeUrl = await QRCode.toDataURL(JSON.stringify(qrPayload), {
        errorCorrectionLevel: 'H',
        type: 'image/png',
        margin: 2,
        color: {
          dark: '#1a1a1a',
          light: '#ffffff'
        },
        width: 512
      });

      // Calculate expiration time
      const expiresAt = options.customExpiry || new Date(booking.endTime.getTime() + 30 * 60 * 1000);

      // Save comprehensive QR code data to Firestore
      const qrDocRef = await addDoc(collection(db, 'qr-codes'), {
        bookingId: booking.id,
        userId: booking.userId,
        userEmail: booking.userId,
        userName: qrData.userName,
        communityId: booking.communityId,
        amenityId: booking.amenityId,
        amenityName: amenityDetails.name,
        amenityType: amenityDetails.type,
        amenityLocation: amenityDetails.location,
        amenityDescription: amenityDetails.description,
        startTime: Timestamp.fromDate(booking.startTime),
        endTime: Timestamp.fromDate(booking.endTime),
        status: 'active',
        createdAt: serverTimestamp(),
        expiresAt: Timestamp.fromDate(expiresAt),
        scanCount: 0,
        qrCodeUrl,
        securityHash,
        bookingDetails: qrData.bookingDetails,
        currentAmenityBookings: qrData.currentAmenityBookings,
        metadata: {
          generatedBy: booking.userId,
          autoShow: options.autoShow || false,
          includeUserInfo: options.includeUserInfo !== false
        }
      });

      // Update booking with QR code reference
      await updateDoc(doc(db, 'bookings', booking.id), {
        qrCodeId: qrDocRef.id,
        qrCodeGenerated: true,
        qrCodeGeneratedAt: serverTimestamp(),
        qrCodeAutoShow: options.autoShow || false
      });

      const result: QRCodeData = {
        id: qrDocRef.id,
        bookingId: qrData.bookingId,
        userId: qrData.userId,
        userEmail: qrData.userEmail,
        userName: qrData.userName,
        communityId: qrData.communityId,
        amenityId: qrData.amenityId,
        amenityName: qrData.amenityName,
        amenityType: qrData.amenityType,
        amenityLocation: qrData.amenityLocation,
        amenityDescription: qrData.amenityDescription,
        startTime: qrData.startTime,
        endTime: qrData.endTime,
        status: 'active' as const,
        createdAt: new Date(),
        expiresAt,
        scanCount: 0,
        qrCodeUrl,
        securityHash,
        bookingDetails: qrData.bookingDetails,
        currentAmenityBookings: qrData.currentAmenityBookings,
        metadata: {}
      };

      console.log('✅ QR Code generated successfully:', {
        bookingId: booking.id,
        qrCodeId: qrDocRef.id,
        amenity: amenityDetails.name,
        user: qrData.userEmail,
        autoShow: options.autoShow
      });

      return result;

    } catch (error) {
      console.error('❌ Error generating QR code:', error);
      throw new Error('Failed to generate QR code: ' + (error as Error).message);
    }
  }

  private async getCurrentAmenityBookings(amenityId: string, communityId: string) {
    try {
      const now = new Date();
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);

      const q = query(
        collection(db, 'bookings'),
        where('amenityId', '==', amenityId),
        where('communityId', '==', communityId),
        where('status', 'in', ['confirmed', 'in-progress'])
      );

      const snapshot = await getDocs(q);
      const bookings = [];

      for (const doc of snapshot.docs) {
        const data = doc.data();
        const startTime = data.startTime.toDate();
        
        // Only include bookings for today and near future
        if (startTime >= startOfDay && startTime <= endOfDay) {
          bookings.push({
            id: doc.id,
            userEmail: data.userId,
            userName: data.userName || data.userId,
            startTime,
            endTime: data.endTime.toDate(),
            status: data.status,
            checkInTime: data.checkInTime?.toDate(),
            checkOutTime: data.checkOutTime?.toDate()
          });
        }
      }

      return bookings.sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
    } catch (error) {
      console.warn('Could not fetch current amenity bookings:', error);
      return [];
    }
  }

  async scanQRCode(qrContent: string, scannerInfo?: any): Promise<QRScanResult> {
    try {
      // Parse QR code content
      let qrPayload;
      try {
        qrPayload = JSON.parse(qrContent);
      } catch {
        return {
          success: false,
          message: 'Invalid QR code format - not a valid JSON'
        };
      }

      // Validate QR code structure and type
      if (qrPayload.type !== 'circlein-booking-access' && qrPayload.type !== 'booking-access') {
        return {
          success: false,
          message: 'Invalid QR code type - not a CircleIn booking code'
        };
      }

      if (!qrPayload.data || !qrPayload.hash) {
        return {
          success: false,
          message: 'Corrupted QR code - missing required data'
        };
      }

      // Validate security hash
      if (!this.validateSecurityHash(qrPayload.data, qrPayload.hash)) {
        return {
          success: false,
          message: 'Security validation failed - QR code may be tampered with',
          errors: ['SECURITY_HASH_MISMATCH']
        };
      }

      // Get QR code document from Firestore
      const qrDocRef = doc(db, 'qr-codes', qrPayload.data.bookingId);
      const qrDoc = await getDoc(qrDocRef);

      if (!qrDoc.exists()) {
        return {
          success: false,
          message: 'QR code not found in system - may have been deleted',
          errors: ['QR_CODE_NOT_FOUND']
        };
      }

      const qrData = qrDoc.data();
      const now = new Date();
      const expiresAt = qrData.expiresAt.toDate();
      const startTime = qrData.startTime.toDate();
      const endTime = qrData.endTime.toDate();

      // Get current amenity bookings for security context
      const currentBookings = await this.getCurrentAmenityBookings(qrData.amenityId, qrData.communityId);

      // Check various conditions
      const warnings: string[] = [];
      
      // Check if QR code is expired
      if (now > expiresAt) {
        return {
          success: false,
          message: 'QR code has expired',
          action: 'expired',
          errors: ['QR_EXPIRED']
        };
      }

      // Check if booking is cancelled
      if (qrData.status === 'cancelled') {
        return {
          success: false,
          message: 'This booking has been cancelled',
          errors: ['BOOKING_CANCELLED']
        };
      }

      // Time-based validations and actions
      const gracePeriod = 15 * 60 * 1000; // 15 minutes grace period
      const earlyAccessPeriod = 30 * 60 * 1000; // 30 minutes early access
      
      const canEarlyAccess = now >= new Date(startTime.getTime() - earlyAccessPeriod) && now < startTime;
      const canCheckIn = now >= new Date(startTime.getTime() - gracePeriod) && now <= endTime;
      const canCheckOut = qrData.checkInTime && !qrData.checkOutTime && now <= endTime;
      const isExpiredBooking = now > endTime;

      let action: QRScanResult['action'] = 'view-details';
      let message = 'QR code scanned successfully';

      // Determine appropriate action
      if (canCheckOut) {
        action = 'check-out';
        message = 'Ready to check out from ' + qrData.amenityName;
        
        // Perform check-out
        await updateDoc(qrDocRef, {
          checkOutTime: serverTimestamp(),
          status: 'used',
          scanCount: qrData.scanCount + 1,
          lastScannedAt: serverTimestamp(),
          lastScannedBy: scannerInfo?.userId || 'security',
          metadata: {
            ...qrData.metadata,
            lastScanInfo: {
              ...scannerInfo,
              scanType: 'check-out',
              timestamp: now.toISOString()
            }
          }
        });

        // Update booking status
        await updateDoc(doc(db, 'bookings', qrData.bookingId), {
          status: 'completed',
          checkOutTime: serverTimestamp(),
          updatedAt: serverTimestamp()
        });

      } else if (canCheckIn && !qrData.checkInTime) {
        action = 'check-in';
        message = 'Successfully checked in to ' + qrData.amenityName;
        
        // Perform check-in
        await updateDoc(qrDocRef, {
          checkInTime: serverTimestamp(),
          status: 'active',
          scanCount: qrData.scanCount + 1,
          lastScannedAt: serverTimestamp(),
          lastScannedBy: scannerInfo?.userId || 'security',
          metadata: {
            ...qrData.metadata,
            lastScanInfo: {
              ...scannerInfo,
              scanType: 'check-in',
              timestamp: now.toISOString()
            }
          }
        });

        // Update booking status
        await updateDoc(doc(db, 'bookings', qrData.bookingId), {
          status: 'in-progress',
          checkInTime: serverTimestamp(),
          updatedAt: serverTimestamp()
        });

      } else if (canEarlyAccess) {
        action = 'early-access';
        message = 'Early access granted to ' + qrData.amenityName;
        warnings.push('Booking starts in ' + Math.round((startTime.getTime() - now.getTime()) / (1000 * 60)) + ' minutes');
        
        // Log the early access scan
        await updateDoc(qrDocRef, {
          scanCount: qrData.scanCount + 1,
          lastScannedAt: serverTimestamp(),
          lastScannedBy: scannerInfo?.userId || 'security',
          metadata: {
            ...qrData.metadata,
            lastScanInfo: {
              ...scannerInfo,
              scanType: 'early-access',
              timestamp: now.toISOString()
            }
          }
        });

      } else if (isExpiredBooking) {
        action = 'expired';
        message = 'Booking time has ended';
        warnings.push('This booking ended ' + Math.round((now.getTime() - endTime.getTime()) / (1000 * 60)) + ' minutes ago');
        
      } else {
        // Just log the scan for information
        await updateDoc(qrDocRef, {
          scanCount: qrData.scanCount + 1,
          lastScannedAt: serverTimestamp(),
          lastScannedBy: scannerInfo?.userId || 'security',
          metadata: {
            ...qrData.metadata,
            lastScanInfo: {
              ...scannerInfo,
              scanType: 'view-details',
              timestamp: now.toISOString()
            }
          }
        });

        if (now < startTime) {
          warnings.push('Booking starts in ' + Math.round((startTime.getTime() - now.getTime()) / (1000 * 60)) + ' minutes');
        }
      }

      // Prepare comprehensive scan result
      const scanResultData: QRCodeData = {
        id: qrDoc.id,
        bookingId: qrData.bookingId,
        userId: qrData.userId,
        userEmail: qrData.userEmail || qrData.userId,
        userName: qrData.userName,
        communityId: qrData.communityId,
        amenityId: qrData.amenityId,
        amenityName: qrData.amenityName,
        amenityType: qrData.amenityType,
        amenityLocation: qrData.amenityLocation,
        amenityDescription: qrData.amenityDescription,
        startTime: startTime,
        endTime: endTime,
        status: qrData.status,
        createdAt: qrData.createdAt.toDate(),
        expiresAt: expiresAt,
        scanCount: qrData.scanCount + 1,
        lastScannedAt: now,
        lastScannedBy: scannerInfo?.userId || 'security',
        checkInTime: qrData.checkInTime?.toDate(),
        checkOutTime: qrData.checkOutTime?.toDate(),
        qrCodeUrl: qrData.qrCodeUrl,
        securityHash: qrData.securityHash,
        bookingDetails: qrData.bookingDetails || {
          duration: Math.round((endTime.getTime() - startTime.getTime()) / (1000 * 60)),
          attendees: [],
          notes: ''
        },
        currentAmenityBookings: currentBookings,
        metadata: {
          ...qrData.metadata,
          scanLocation: scannerInfo?.location,
          scanDevice: scannerInfo?.deviceInfo
        }
      };

      return {
        success: true,
        message,
        action,
        data: scanResultData,
        warnings: warnings.length > 0 ? warnings : undefined
      };

    } catch (error) {
      console.error('❌ Error scanning QR code:', error);
      return {
        success: false,
        message: 'Error processing QR code scan: ' + (error as Error).message,
        errors: ['SCAN_PROCESSING_ERROR']
      };
    }
  }

  async getQRCodeStatus(qrCodeId: string): Promise<QRCodeData | null> {
    try {
      const qrDoc = await getDoc(doc(db, 'qr-codes', qrCodeId));
      if (!qrDoc.exists()) return null;

      const data = qrDoc.data();
      return {
        id: qrDoc.id,
        ...data,
        startTime: data.startTime.toDate(),
        endTime: data.endTime.toDate(),
        createdAt: data.createdAt.toDate(),
        expiresAt: data.expiresAt.toDate(),
        lastScannedAt: data.lastScannedAt?.toDate(),
        checkInTime: data.checkInTime?.toDate(),
        checkOutTime: data.checkOutTime?.toDate()
      } as QRCodeData;
    } catch (error) {
      console.error('Error getting QR code status:', error);
      return null;
    }
  }

  async regenerateQRCode(bookingId: string): Promise<QRCodeData> {
    // Implementation for regenerating QR codes if needed
    throw new Error('Not implemented yet');
  }
}

export const qrService = new QRService();
export default qrService;