import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { 
  collection,
  query,
  where,
  getDocs,
  doc, 
  getDoc, 
  updateDoc, 
  serverTimestamp,
  arrayUnion,
  Timestamp,
  limit
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { isQRCodeValid, isLocationValid } from '@/lib/booking-enhancements';

/**
 * ENHANCED QR CODE VERIFICATION
 * - Time-based validation (only during booking window)
 * - Location verification
 * - One-time use enforcement
 * - Scan history tracking
 */

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { qrId, location } = body;

    if (!qrId) {
      return NextResponse.json({ error: 'QR ID required' }, { status: 400 });
    }

    console.log(`🔍 Verifying QR code: ${qrId}`);

    // Find booking by QR ID
    const bookingsRef = collection(db, 'bookings');
    const qrQuery = query(bookingsRef, where('qrId', '==', qrId), limit(1));
    const qrSnapshot = await getDocs(qrQuery);

    if (qrSnapshot.empty) {
      // Log failed attempt
      await logQRScanAttempt(qrId, location, false, 'QR code not found', session.user.email);
      
      return NextResponse.json({ 
        success: false,
        error: 'Invalid QR code' 
      }, { status: 404 });
    }

    const bookingDoc = qrSnapshot.docs[0];
    const booking = bookingDoc.data() as any;
    const bookingId = bookingDoc.id;

    // Check if already used
    if (booking.qrUsed) {
      await logQRScanAttempt(bookingId, location, false, 'QR code already used', session.user.email);
      
      return NextResponse.json({ 
        success: false,
        error: 'QR code already used',
        usedAt: booking.qrUsedAt?.toDate()?.toISOString()
      }, { status: 400 });
    }

    // Time-based validation
    const now = new Date();
    const startTime = booking.startTime.toDate();
    const endTime = booking.endTime.toDate();
    
    const timeValidation = isQRCodeValid(now, startTime, endTime, booking.qrUsed || false);
    
    if (!timeValidation.valid) {
      await logQRScanAttempt(bookingId, location, false, timeValidation.reason || 'Invalid time', session.user.email);
      
      return NextResponse.json({ 
        success: false,
        error: timeValidation.reason,
        bookingStartTime: startTime.toISOString(),
        bookingEndTime: endTime.toISOString()
      }, { status: 400 });
    }

    // Location verification (if amenity has location and user provided location)
    if (location && booking.amenityLocation) {
      const locationValid = isLocationValid(
        { latitude: location.latitude, longitude: location.longitude },
        { latitude: booking.amenityLocation.latitude, longitude: booking.amenityLocation.longitude },
        50 // 50 meters radius
      );

      if (!locationValid) {
        await logQRScanAttempt(bookingId, location, false, 'Location too far from amenity', session.user.email);
        
        return NextResponse.json({ 
          success: false,
          error: 'You must be at the amenity location to check in',
          amenityLocation: booking.amenityLocation
        }, { status: 400 });
      }
    }

    // Mark QR as used and log scan
    const bookingRef = doc(db, 'bookings', bookingId);
    await updateDoc(bookingRef, {
      qrUsed: true,
      qrUsedAt: serverTimestamp(),
      checkInTime: serverTimestamp(),
      qrScanHistory: arrayUnion({
        timestamp: Timestamp.now(),
        location: location || null,
        success: true,
        scannedBy: session.user.email
      })
    });

    console.log(`✅ QR verified and marked as used: ${qrId}`);

    // Check if deposit should be refunded (successful check-in)
    if (booking.depositPaid && !booking.depositRefunded) {
      try {
        const { refundDeposit } = await import('@/lib/booking-service');
        await refundDeposit(bookingId, booking.userId, booking.depositAmount);
      } catch (error) {
        console.error('Failed to refund deposit:', error);
      }
    }

    return NextResponse.json({ 
      success: true,
      message: 'Check-in successful!',
      booking: {
        id: bookingId,
        amenityName: booking.amenityName,
        userName: booking.userName,
        flatNumber: booking.userFlatNumber,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString()
      }
    });

  } catch (error: any) {
    console.error('QR verification error:', error);
    return NextResponse.json({ 
      error: 'Verification failed',
      message: error.message 
    }, { status: 500 });
  }
}

async function logQRScanAttempt(
  bookingId: string, 
  location: any, 
  success: boolean, 
  reason: string,
  scannedBy: string
) {
  try {
    const bookingRef = doc(db, 'bookings', bookingId);
    await updateDoc(bookingRef, {
      qrScanHistory: arrayUnion({
        timestamp: Timestamp.now(),
        location: location || null,
        success,
        reason,
        scannedBy
      })
    });
  } catch (error) {
    console.error('Failed to log scan attempt:', error);
  }
}

// GET endpoint to retrieve QR scan history (for admin)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const bookingId = searchParams.get('bookingId');

    if (!bookingId) {
      return NextResponse.json({ error: 'Booking ID required' }, { status: 400 });
    }

    const bookingRef = doc(db, 'bookings', bookingId);
    const bookingSnap = await getDoc(bookingRef);

    if (!bookingSnap.exists()) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    const booking = bookingSnap.data();

    return NextResponse.json({
      bookingId,
      qrId: booking.qrId,
      qrUsed: booking.qrUsed || false,
      qrUsedAt: booking.qrUsedAt?.toDate()?.toISOString(),
      scanHistory: booking.qrScanHistory || []
    });

  } catch (error: any) {
    console.error('Error fetching scan history:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch history',
      message: error.message 
    }, { status: 500 });
  }
}
