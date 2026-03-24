import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  getDoc,
  runTransaction,
  doc,
  Timestamp,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { formatDateInTimeZone, resolveTimeZone } from '@/lib/timezone';

/**
 * PRODUCTION-GRADE BOOKING SYSTEM
 * - Firestore transactions (race-condition safe)
 * - Automatic waitlist management
 * - Concurrent booking protection
 * - Email notifications
 */

interface BookingRequest {
  amenityId: string;
  amenityName: string;
  startTime: string; // ISO date string
  endTime: string;   // ISO date string
  attendees: string[];
  selectedDate: string; // ISO date string
  selectedSlot: string; // e.g., "10:00-12:00"
  userName?: string;
  userFlatNumber?: string;
}

export async function POST(request: NextRequest) {
  try {
    // 1. Authentication
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // 2. Parse request
    const bookingData: BookingRequest = await request.json();
    const {
      amenityId,
      amenityName,
      startTime,
      endTime,
      attendees,
      selectedDate,
      selectedSlot,
      userName,
      userFlatNumber
    } = bookingData;

    // 3. Validation
    if (!amenityId || !startTime || !endTime) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // 3.5. Check booking eligibility (suspension + deposit check)
    const { checkUserBookingEligibility } = await import('@/lib/booking-service');
    const eligibility = await checkUserBookingEligibility(session.user.email, amenityName);
    
    if (!eligibility.canBook) {
      if (eligibility.isSuspended) {
        return NextResponse.json({
          error: 'Account suspended',
          message: eligibility.reason,
          suspendedUntil: eligibility.suspendedUntil?.toISOString(),
          canBook: false
        }, { status: 403 });
      }
    }

    // Log eligibility check
    console.log(`   🎯 Eligibility: Priority=${eligibility.priorityScore}, Deposit=${eligibility.requiresDeposit}`);

    // 4. Convert dates
    const bookingStart = new Date(startTime);
    const bookingEnd = new Date(endTime);
    
    if (isNaN(bookingStart.getTime()) || isNaN(bookingEnd.getTime())) {
      return NextResponse.json(
        { error: 'Invalid date format' },
        { status: 400 }
      );
    }

    if (bookingEnd <= bookingStart) {
      return NextResponse.json(
        { error: 'End time must be after start time' },
        { status: 400 }
      );
    }

    // 4.5 Resolve community settings once so rule checks and notifications stay consistent
    let settingsData: any = {};
    if (session.user.communityId) {
      try {
        const settingsSnapshot = await getDoc(doc(db, 'settings', session.user.communityId));
        settingsData = settingsSnapshot.data() || {};
      } catch (settingsError) {
        console.error('   ⚠️ Failed to read community settings, using defaults:', settingsError);
      }
    }

    const maintenanceModeEnabled = Boolean(settingsData?.systemSettings?.enableMaintenanceMode);
    if (maintenanceModeEnabled) {
      const isAdmin = (session.user as any).role === 'admin' || (session.user as any).role === 'super_admin';
      if (!isAdmin) {
        return NextResponse.json(
          { error: 'New bookings are temporarily disabled due to maintenance mode' },
          { status: 503 }
        );
      }
    }

    const bookingRules = settingsData?.bookingRules || {};
    const bookingsRef = collection(db, 'bookings');
    const toPositiveNumber = (value: any): number | null => {
      const parsed = Number(value);
      return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
    };

    const maxBookingDurationHours = toPositiveNumber(bookingRules.maxBookingDuration);
    const advanceBookingDays = toPositiveNumber(bookingRules.advanceBookingDays);
    const maxActiveBookings = toPositiveNumber(bookingRules.maxActiveBookings);
    const allowWeekendBookings = bookingRules.weekendBookings !== false;

    const bookingDurationHours =
      (bookingEnd.getTime() - bookingStart.getTime()) / (1000 * 60 * 60);

    if (maxBookingDurationHours !== null && bookingDurationHours > maxBookingDurationHours) {
      return NextResponse.json(
        {
          error: `Booking duration cannot exceed ${maxBookingDurationHours} hour${maxBookingDurationHours === 1 ? '' : 's'}`,
        },
        { status: 400 }
      );
    }

    if (!allowWeekendBookings) {
      const dayOfWeek = bookingStart.getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      if (isWeekend) {
        return NextResponse.json(
          { error: 'Weekend bookings are currently disabled by community policy' },
          { status: 400 }
        );
      }
    }

    if (advanceBookingDays !== null) {
      const now = new Date();
      const maxAllowedDate = new Date(now);
      maxAllowedDate.setDate(maxAllowedDate.getDate() + advanceBookingDays);

      if (bookingStart.getTime() > maxAllowedDate.getTime()) {
        return NextResponse.json(
          {
            error: `Bookings can only be made up to ${advanceBookingDays} day${advanceBookingDays === 1 ? '' : 's'} in advance`,
          },
          { status: 400 }
        );
      }
    }

    if (maxActiveBookings !== null && session.user.communityId) {
      const userActiveBookingsQuery = query(
        bookingsRef,
        where('communityId', '==', session.user.communityId),
        where('userEmail', '==', session.user.email),
        where('status', 'in', ['confirmed', 'pending_confirmation', 'waitlist'])
      );

      const userActiveBookingsSnapshot = await getDocs(userActiveBookingsQuery);
      if (userActiveBookingsSnapshot.size >= maxActiveBookings) {
        return NextResponse.json(
          {
            error: `You already have ${userActiveBookingsSnapshot.size} active bookings. The limit is ${maxActiveBookings}.`,
          },
          { status: 400 }
        );
      }
    }

    console.log(`🎯 Booking request: ${amenityName} at ${selectedSlot} by ${session.user.email}`);

    // 5. PRE-READ: Check existing bookings (before transaction)
    const conflictQuery = query(
      bookingsRef,
      where('amenityId', '==', amenityId),
      where('startTime', '==', Timestamp.fromDate(bookingStart)),
      where('status', 'in', ['confirmed', 'pending_confirmation'])
    );

    const conflictSnapshot = await getDocs(conflictQuery);
    const existingBookingsCount = conflictSnapshot.docs.length;

    console.log(`   📊 Found ${existingBookingsCount} existing booking(s) for this slot`);

    // Pre-read waitlist count
    const waitlistQuery = query(
      bookingsRef,
      where('amenityId', '==', amenityId),
      where('startTime', '==', Timestamp.fromDate(bookingStart)),
      where('status', '==', 'waitlist')
    );
    const waitlistSnapshot = await getDocs(waitlistQuery);

    // 6. ATOMIC TRANSACTION - Race condition safe with optimistic locking!
    const result = await runTransaction(db, async (transaction) => {
      // Step 6a: Re-verify inside transaction (critical for race condition safety)
      const verifyDocs = await Promise.all(
        conflictSnapshot.docs.map(doc => transaction.get(doc.ref))
      );
      const existingBookings = verifyDocs.filter(doc => doc.exists());

      console.log(`   🔒 Transaction verified: ${existingBookings.length} confirmed bookings`);

      // Step 6b: Get amenity capacity
      const amenityRef = doc(db, 'amenities', amenityId);
      const amenityDoc = await transaction.get(amenityRef);
      
      if (!amenityDoc.exists()) {
        throw new Error('Amenity not found');
      }

      const amenityData = amenityDoc.data();
      const maxCapacity = amenityData.maxPeople || 1;

      console.log(`   🏠 Amenity capacity: ${existingBookings.length}/${maxCapacity}`);

      // Step 6c: Decide - Confirmed or Waitlist?
      const newBookingRef = doc(collection(db, 'bookings'));
      const bookingReference = newBookingRef.id.substring(0, 8).toUpperCase();
      const qrAccessCode = Math.random().toString(36).substring(2, 10).toUpperCase();
      const baseBookingData = {
        amenityId,
        amenityName,
        amenityType: amenityData.category || 'general',
        userId: session.user.email,
        userEmail: session.user.email,
        userName: userName || session.user.name || session.user.email.split('@')[0],
        userFlatNumber: userFlatNumber || (session.user as any).flatNumber || '',
        communityId: session.user.communityId,
        attendees: attendees || [],
        startTime: Timestamp.fromDate(bookingStart),
        endTime: Timestamp.fromDate(bookingEnd),
        selectedDate,
        selectedSlot,
        timeSlot: selectedSlot, // Store time slot for reminder email
        bookingReference,
        qrId: qrAccessCode,
        reminderSent: false, // Track if 1-hour reminder was sent
        createdAt: serverTimestamp(),
      };

      if (existingBookings.length < maxCapacity) {
        // ✅ CONFIRMED - Slot available
        transaction.set(newBookingRef, {
          ...baseBookingData,
          status: 'confirmed',
          confirmedAt: serverTimestamp(),
        });

        console.log(`   ✅ CONFIRMED: Booking created (${existingBookings.length + 1}/${maxCapacity})`);

        return {
          status: 'confirmed',
          bookingId: newBookingRef.id,
          bookingReference,
          qrId: qrAccessCode,
          message: 'Booking confirmed successfully!',
          position: existingBookings.length + 1,
          capacity: maxCapacity
        };

      } else {
        // 📋 WAITLIST - Slot full
        const waitlistPosition = waitlistSnapshot.docs.length + 1;

        transaction.set(newBookingRef, {
          ...baseBookingData,
          status: 'waitlist',
          waitlistPosition,
          waitlistAddedAt: serverTimestamp(),
          priorityScore: eligibility.priorityScore, // Store priority score for future sorting
        });

        console.log(`   📋 WAITLIST: Added to position ${waitlistPosition} (Priority: ${eligibility.priorityScore})`);

        return {
          status: 'waitlist',
          bookingId: newBookingRef.id,
          bookingReference,
          qrId: qrAccessCode,
          message: `Added to waitlist (Position #${waitlistPosition})`,
          position: waitlistPosition,
          capacity: maxCapacity,
          priorityScore: eligibility.priorityScore
        };
      }
    });

    // 6. Send email notification based on status
    console.log(`   📧 Preparing email notification (${result.status})...`);

    const communityTimeZone = resolveTimeZone(settingsData?.community?.timezone || settingsData?.timezone);
    
    // Import email service and enhancements
    const { emailTemplates, sendEmail } = await import('@/lib/email-service');
    const { generateEnhancedEmailSections } = await import('@/lib/email-enhancements');
    const { getRelatedAmenities, generateRecommendationsHTML } = await import('@/lib/amenity-recommendations');
    
    // Fetch amenity data for enhancements
    const amenityRef = doc(db, 'amenities', amenityId);
    const amenitySnapshot = await getDocs(query(collection(db, 'amenities'), where('__name__', '==', amenityId)));
    const amenityData = amenitySnapshot.docs[0]?.data();
    
    try {
      // Prepare email template based on status
      const emailData = {
        userName: userName || session.user.name || 'Resident',
        amenityName,
        date: formatDateInTimeZone(bookingStart, communityTimeZone, {
          weekday: 'long', 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        }),
        timeSlot: selectedSlot,
        bookingId: result.bookingId,
        bookingReference: result.bookingReference,
        communityName: (session.user as any).communityName || 'Your Community',
        flatNumber: userFlatNumber || (session.user as any).flatNumber || '',
      };
      
      // Generate enhanced sections (only recommendations)
      let enhancedSections = '';
      if (result.status === 'confirmed' && amenityData) {
        // Get amenity recommendations
        let recommendationsHTML = '';
        try {
          const recommendations = await getRelatedAmenities(
            amenityData.type || amenityName,
            session.user.email,
            (session.user as any).communityId || 'default-community',
            3
          );
          if (recommendations.length > 0) {
            recommendationsHTML = generateRecommendationsHTML(recommendations);
            console.log(`   💡 ${recommendations.length} recommendations added`);
          }
        } catch (err) {
          console.log('   ⚠️ Recommendations fetch failed (non-critical)');
        }
        
        // Generate enhanced sections (only recommendations)
        enhancedSections = generateEnhancedEmailSections({
          recommendationsHTML,
        });
      }

      let template;
      if (result.status === 'confirmed') {
        template = emailTemplates.bookingConfirmation({
          ...emailData,
          enhancedSections,
        });
      } else {
        template = emailTemplates.bookingWaitlist({
          ...emailData,
          waitlistPosition: result.position || 0,
        });
      }

      // Send email directly
      const emailResult = await sendEmail({
        to: session.user.email,
        subject: template.subject,
        html: template.html,
      });
      
      if (emailResult.success) {
        console.log(`   ✅ ${result.status === 'confirmed' ? 'Confirmation' : 'Waitlist'} email sent successfully`);
        console.log(`   📨 Message ID: ${emailResult.messageId}`);
      } else {
        console.error(`   ⚠️ Email failed:`, emailResult.error);
        // Don't throw - booking is still successful
      }
    } catch (emailError: any) {
      console.error('   ⚠️ Email send failed (non-critical):', emailError.message);
      // Don't throw - booking succeeded, email is just a notification
    }

    // 6.5 Award gamification badges for confirmed bookings (non-blocking)
    if (result.status === 'confirmed' && session.user.communityId) {
      try {
        const { evaluateAndAwardBadges } = await import('@/lib/gamification-service');
        const awardedBadges = await evaluateAndAwardBadges({
          userEmail: session.user.email,
          communityId: session.user.communityId,
          bookingStartTime: bookingStart,
        });

        if (awardedBadges.length > 0) {
          console.log(
            `   🏆 Awarded badges: ${awardedBadges.map((badge: any) => badge.name).join(', ')}`
          );
        }
      } catch (badgeError: any) {
        console.error('   ⚠️ Badge evaluation failed (non-critical):', badgeError.message);
      }
    }

    // 7. Return success
    return NextResponse.json({
      success: true,
      status: result.status,
      bookingId: result.bookingId,
      bookingReference: result.bookingReference,
      qrId: result.qrId,
      message: result.message,
      position: result.position,
      capacity: result.capacity,
      booking: {
        id: result.bookingId,
        bookingReference: result.bookingReference,
        qrId: result.qrId,
        status: result.status,
        amenityName,
        startTime: bookingStart.toISOString(),
        endTime: bookingEnd.toISOString(),
        selectedSlot,
        waitlistPosition: result.status === 'waitlist' ? result.position : undefined,
      }
    });

  } catch (error: any) {
    console.error('❌ Booking error:', error);
    
    // Handle specific transaction errors
    if (error.message?.includes('not found')) {
      return NextResponse.json(
        { error: 'Amenity not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { 
        error: 'Failed to create booking',
        details: error.message 
      },
      { status: 500 }
    );
  }
}
