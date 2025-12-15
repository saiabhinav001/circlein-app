import { NextRequest, NextResponse } from 'next/server';

/**
 * AUTO-CANCELLATION CRON JOB
 * Simplified version that ALWAYS returns 200
 */

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  let cancelledCount = 0;
  let promotedCount = 0;
  const errors: string[] = [];
  const logs: string[] = [];

  try {
    // Verify cron secret
    const authHeader = request.headers.get('authorization');
    const cronHeader = request.headers.get('x-cron-secret');
    const expectedSecret = process.env.CRON_SECRET;
    
    logs.push('🔐 Checking authentication...');
    
    if (!authHeader && !cronHeader) {
      logs.push('❌ No auth headers provided');
      return NextResponse.json({ 
        success: false,
        error: 'No authentication headers',
        logs 
      }, { status: 401 });
    }
    
    const isValid = 
      authHeader === `Bearer ${expectedSecret}` || 
      cronHeader === expectedSecret;
    
    if (!isValid) {
      logs.push('❌ Invalid credentials');
      return NextResponse.json({ 
        success: false,
        error: 'Invalid credentials',
        logs 
      }, { status: 401 });
    }
    
    logs.push('✅ Authentication successful');
    logs.push('🔄 Starting auto-cancel check...');

    // Lazy load Firebase to catch initialization errors
    let db, collection, query, where, getDocs, updateDoc, doc, Timestamp, serverTimestamp, getDoc, setDoc, increment;
    
    try {
      const firebaseModule = await import('firebase/firestore');
      const firebaseConfig = await import('@/lib/firebase');
      
      db = firebaseConfig.db;
      collection = firebaseModule.collection;
      query = firebaseModule.query;
      where = firebaseModule.where;
      getDocs = firebaseModule.getDocs;
      updateDoc = firebaseModule.updateDoc;
      doc = firebaseModule.doc;
      Timestamp = firebaseModule.Timestamp;
      serverTimestamp = firebaseModule.serverTimestamp;
      getDoc = firebaseModule.getDoc;
      setDoc = firebaseModule.setDoc;
      increment = firebaseModule.increment;
      
      logs.push('✅ Firebase modules loaded');
    } catch (importError: any) {
      logs.push(`❌ Firebase import failed: ${importError.message}`);
      throw new Error(`Firebase initialization failed: ${importError.message}`);
    }

    const now = new Date();
    const gracePeriodCutoff = new Date(now.getTime() - (25 * 60 * 1000));
    logs.push(`📅 Grace period cutoff: ${gracePeriodCutoff.toISOString()}`);

    // Query bookings
    const bookingsRef = collection(db, 'bookings');
    const targetQuery = query(
      bookingsRef,
      where('status', '==', 'confirmed'),
      where('startTime', '<=', Timestamp.fromDate(gracePeriodCutoff))
    );

    let snapshot;
    try {
      snapshot = await getDocs(targetQuery);
      logs.push(`📊 Found ${snapshot.docs.length} bookings to process`);
    } catch (queryError: any) {
      logs.push(`❌ Query error: ${queryError.message}`);
      errors.push(`Query failed: ${queryError.message}`);
      // Return success with error details instead of throwing
      const duration = Date.now() - startTime;
      return NextResponse.json({ 
        success: true, // Return 200 to prevent cron retry
        cancelled: 0,
        promoted: 0,
        errors,
        logs,
        duration: `${duration}ms`,
        message: 'Query failed but endpoint is working'
      });
    }

    // Process bookings
    for (const bookingDoc of snapshot.docs) {
      try {
        const booking = bookingDoc.data();
        logs.push(`🔍 Processing booking ${bookingDoc.id}`);
        
        if (booking.checkInTime) {
          logs.push(`  ⏭️ Already checked in`);
          continue;
        }

        // Cancel booking
        try {
          await updateDoc(doc(db, 'bookings', bookingDoc.id), {
            status: 'no_show',
            autoCancelledAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          });
          cancelledCount++;
          logs.push(`  ✅ Cancelled`);
        } catch (updateError: any) {
          logs.push(`  ⚠️ Cancel failed: ${updateError.message}`);
          errors.push(`Cancel ${bookingDoc.id}: ${updateError.message}`);
          continue;
        }

        // Update stats (non-critical)
        try {
          const userStatsRef = doc(db, 'userBookingStats', booking.userId);
          const statsDoc = await getDoc(userStatsRef);
          
          let newNoShowCount = 1;
          
          if (statsDoc.exists()) {
            const currentStats = statsDoc.data();
            newNoShowCount = (currentStats.noShowCount || 0) + 1;
            
            await updateDoc(userStatsRef, {
              noShowCount: increment(1),
              updatedAt: serverTimestamp()
            });
          } else {
            await setDoc(userStatsRef, {
              userId: booking.userId,
              noShowCount: 1,
              totalBookings: 1,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp()
            });
          }
          logs.push(`  📊 Stats updated (no-shows: ${newNoShowCount})`);
          
          // Apply 30-day suspension if 3+ no-shows
          if (newNoShowCount >= 3) {
            const { applySuspension } = await import('@/lib/booking-service');
            const suspended = await applySuspension(booking.userId, newNoShowCount);
            if (suspended) {
              logs.push(`  🚫 User suspended for 30 days (${newNoShowCount} no-shows)`);
            }
          }
        } catch (statsError: any) {
          logs.push(`  ⚠️ Stats failed: ${statsError.message}`);
        }

        // Check waitlist
        try {
          const waitlistQuery = query(
            bookingsRef,
            where('amenityId', '==', booking.amenityId),
            where('startTime', '==', booking.startTime),
            where('status', '==', 'waitlist')
          );

          const waitlistSnapshot = await getDocs(waitlistQuery);
          
          if (waitlistSnapshot.empty) {
            logs.push(`  ℹ️ No waitlist`);
            continue;
          }

          const waitlistBookings = waitlistSnapshot.docs
            .map(d => ({ id: d.id, ...d.data() }))
            .sort((a: any, b: any) => {
              // Sort by priority score (higher first), then by waitlist position (lower first)
              const priorityDiff = (b.priorityScore || 50) - (a.priorityScore || 50);
              if (priorityDiff !== 0) return priorityDiff;
              return (a.waitlistPosition || 999) - (b.waitlistPosition || 999);
            });

          const nextInLine = waitlistBookings[0] as any;
          logs.push(`  👤 Next: Priority=${nextInLine.priorityScore || 50}, Pos=${nextInLine.waitlistPosition}`);
          const confirmationDeadline = new Date(now.getTime() + (30 * 60 * 1000));
          
          await updateDoc(doc(db, 'bookings', nextInLine.id), {
            status: 'pending_confirmation',
            waitlistPromotedAt: serverTimestamp(),
            confirmationDeadline: Timestamp.fromDate(confirmationDeadline),
            updatedAt: serverTimestamp()
          });

          promotedCount++;
          logs.push(`  🎉 Promoted ${nextInLine.id}`);

          // Send email (non-critical)
          try {
            const { emailTemplates, sendEmail } = await import('@/lib/email-service');
            
            const emailTemplate = emailTemplates.waitlistPromotion({
              userName: nextInLine.userName || 'Resident',
              amenityName: booking.amenityName,
              date: booking.startTime.toDate().toLocaleDateString('en-US', { 
                weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
              }),
              timeSlot: nextInLine.selectedSlot || 'Time slot',
              confirmationDeadline: confirmationDeadline.toLocaleString(),
              bookingId: nextInLine.id,
              flatNumber: nextInLine.userFlatNumber || ''
            });

            await sendEmail({
              to: nextInLine.userEmail,
              subject: emailTemplate.subject,
              html: emailTemplate.html
            });

            logs.push(`  📧 Email sent`);
          } catch (emailError: any) {
            logs.push(`  ⚠️ Email failed: ${emailError.message}`);
          }
        } catch (waitlistError: any) {
          logs.push(`  ⚠️ Waitlist error: ${waitlistError.message}`);
          errors.push(`Waitlist ${bookingDoc.id}: ${waitlistError.message}`);
        }
      } catch (bookingError: any) {
        logs.push(`  ❌ Booking error: ${bookingError.message}`);
        errors.push(`Booking ${bookingDoc.id}: ${bookingError.message}`);
      }
    }

    const duration = Date.now() - startTime;
    logs.push(`✅ Complete: ${cancelledCount} cancelled, ${promotedCount} promoted`);

    return NextResponse.json({ 
      success: true,
      cancelled: cancelledCount,
      promoted: promotedCount,
      errors: errors.length > 0 ? errors : undefined,
      logs: logs.slice(-20), // Last 20 logs only
      duration: `${duration}ms`,
      timestamp: now.toISOString()
    });

  } catch (error: any) {
    const duration = Date.now() - startTime;
    logs.push(`❌ FATAL ERROR: ${error.message}`);
    
    // ALWAYS return 200 to prevent cron retries
    return NextResponse.json({ 
      success: false,
      error: error.message,
      stack: error.stack?.split('\n').slice(0, 5).join('\n'), // First 5 lines only
      cancelled: cancelledCount,
      promoted: promotedCount,
      errors,
      logs,
      duration: `${duration}ms`
    }, { status: 200 }); // Changed from 500 to 200
  }
}
