/**
 * BOOKING ENHANCEMENTS - Advanced Features
 * - Auto-cancellation with grace period
 * - Priority system
 * - Deposit system for no-shows
 * - Waitlist countdown
 */

import { Timestamp } from 'firebase/firestore';

export interface EnhancedBooking {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  userFlatNumber?: string;
  amenityId: string;
  amenityName: string;
  startTime: Timestamp;
  endTime: Timestamp;
  status: 'confirmed' | 'waitlist' | 'cancelled' | 'completed' | 'pending_confirmation' | 'no_show';
  
  // Auto-cancellation fields
  checkInTime?: Timestamp;
  checkInGraceExpiry?: Timestamp; // startTime + 10 minutes
  autoCancelledAt?: Timestamp;
  
  // Recurring bookings
  isRecurring?: boolean;
  recurringParentId?: string;
  recurringEndDate?: Timestamp;
  recurringFrequency?: 'weekly' | 'biweekly' | 'monthly';
  
  // Waitlist enhancements
  waitlistPosition?: number;
  waitlistPromotedAt?: Timestamp;
  confirmationDeadline?: Timestamp; // 30 minutes to confirm
  estimatedWaitTime?: number; // in minutes
  
  // Priority system
  userPriorityScore?: number; // Lower = higher priority
  userBookingCount?: number; // Last 30 days
  
  // Deposit system
  depositRequired?: boolean;
  depositAmount?: number;
  depositPaid?: boolean;
  depositRefunded?: boolean;
  noShowCount?: number;
  
  // QR enhancements
  qrId: string;
  qrUsed?: boolean;
  qrUsedAt?: Timestamp;
  qrScanHistory?: QRScanAttempt[];
  qrExpiryStart?: Timestamp; // Can only use during booking window
  qrExpiryEnd?: Timestamp;
  
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface QRScanAttempt {
  timestamp: Timestamp;
  location?: {
    latitude: number;
    longitude: number;
  };
  success: boolean;
  reason?: string;
  scannedBy?: string;
}

export interface UserBookingStats {
  userId: string;
  totalBookings: number;
  completedBookings: number;
  noShowCount: number;
  cancellationCount: number;
  averageUsage: number; // percentage of booking time actually used
  priorityScore: number; // 0-100, lower = higher priority
  depositRequired: boolean;
  lastBookingDate?: Timestamp;
}

export interface WaitlistEntry {
  bookingId: string;
  userId: string;
  position: number;
  promotedAt?: Timestamp;
  confirmationDeadline?: Timestamp;
  estimatedWaitTime: number;
  notificationSent: boolean;
}

// Calculate user priority score based on booking history
export function calculatePriorityScore(stats: Partial<UserBookingStats>): number {
  const {
    totalBookings = 0,
    noShowCount = 0,
    cancellationCount = 0,
    averageUsage = 100
  } = stats;

  // Lower score = higher priority
  let score = 50; // Base score

  // Penalty for power users (book too frequently)
  if (totalBookings > 20) score += 20;
  else if (totalBookings > 10) score += 10;
  else if (totalBookings < 3) score -= 10; // Reward infrequent users

  // Penalty for no-shows
  score += (noShowCount * 15);

  // Penalty for cancellations
  score += (cancellationCount * 5);

  // Penalty for low usage
  if (averageUsage < 50) score += 10;

  return Math.max(0, Math.min(100, score));
}

// Calculate deposit requirement
export function requiresDeposit(noShowCount: number): boolean {
  return noShowCount >= 3;
}

// Calculate deposit amount (in credits/points)
export function calculateDepositAmount(amenityType: string): number {
  const depositMap: { [key: string]: number } = {
    'pool': 50,
    'gym': 30,
    'tennis': 40,
    'clubhouse': 100,
    'bbq': 60,
    'default': 30
  };
  
  return depositMap[amenityType.toLowerCase()] || depositMap.default;
}

// Calculate estimated wait time based on historical data
export function calculateEstimatedWaitTime(
  position: number,
  historicalData: { avgTimeToPromotion: number }
): number {
  // Base wait time: 30 minutes per position
  const baseTime = position * 30;
  
  // Adjust based on historical data
  const historicalAvg = historicalData.avgTimeToPromotion || 30;
  
  return Math.round((baseTime + historicalAvg) / 2);
}

// Check if QR code is valid for current time
export function isQRCodeValid(
  currentTime: Date,
  bookingStartTime: Date,
  bookingEndTime: Date,
  alreadyUsed: boolean
): { valid: boolean; reason?: string } {
  if (alreadyUsed) {
    return { valid: false, reason: 'QR code already used' };
  }

  const now = currentTime.getTime();
  const start = bookingStartTime.getTime();
  const end = bookingEndTime.getTime();

  // Allow 10 minutes before start time (early check-in)
  const earlyWindow = start - (10 * 60 * 1000);

  if (now < earlyWindow) {
    return { valid: false, reason: 'Too early - booking not started yet' };
  }

  if (now > end) {
    return { valid: false, reason: 'Booking time expired' };
  }

  return { valid: true };
}

// Validate location (basic haversine distance)
export function isLocationValid(
  scanLocation: { latitude: number; longitude: number },
  amenityLocation: { latitude: number; longitude: number },
  radiusMeters: number = 50
): boolean {
  const R = 6371e3; // Earth radius in meters
  const φ1 = scanLocation.latitude * Math.PI / 180;
  const φ2 = amenityLocation.latitude * Math.PI / 180;
  const Δφ = (amenityLocation.latitude - scanLocation.latitude) * Math.PI / 180;
  const Δλ = (amenityLocation.longitude - scanLocation.longitude) * Math.PI / 180;

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  const distance = R * c; // in meters

  return distance <= radiusMeters;
}

// Generate .ics calendar file content
export function generateICSFile(booking: {
  title: string;
  startTime: Date;
  endTime: Date;
  location: string;
  description: string;
}): string {
  const formatDate = (date: Date): string => {
    return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  };

  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//CircleIn//Booking System//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:REQUEST',
    'BEGIN:VEVENT',
    `DTSTART:${formatDate(booking.startTime)}`,
    `DTEND:${formatDate(booking.endTime)}`,
    `SUMMARY:${booking.title}`,
    `DESCRIPTION:${booking.description}`,
    `LOCATION:${booking.location}`,
    'STATUS:CONFIRMED',
    'SEQUENCE:0',
    `UID:${Date.now()}@circlein.app`,
    `DTSTAMP:${formatDate(new Date())}`,
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\r\n');

  return icsContent;
}
