import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  addDoc,
  doc,
  getDoc,
  Timestamp,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

/**
 * RECURRING BOOKINGS API
 * Allows users to book same slot for multiple weeks
 */

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const communityId = (session.user as any).communityId;
    if (!communityId) {
      return NextResponse.json({ error: 'Community ID not found' }, { status: 400 });
    }

    const body = await request.json();
    const {
      amenityId,
      amenityName,
      startTime, // First booking start time
      endTime,
      selectedSlot,
      weeks, // Number of weeks to book (e.g., 4)
      frequency // 'weekly' | 'biweekly'
    } = body;

    if (!amenityId || !startTime || !endTime || !weeks || !frequency) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    console.log(`🔄 Creating recurring booking: ${amenityName} for ${weeks} weeks (${frequency})`);

    // Get amenity capacity
    const amenityRef = doc(db, 'communities', communityId, 'amenities', amenityId);
    const amenitySnap = await getDoc(amenityRef);
    
    if (!amenitySnap.exists()) {
      return NextResponse.json({ error: 'Amenity not found' }, { status: 404 });
    }

    const amenityData = amenitySnap.data();
    const maxCapacity = amenityData.maxPeople || 1;

    const firstStartTime = new Date(startTime);
    const firstEndTime = new Date(endTime);
    const weekIncrement = frequency === 'weekly' ? 1 : 2;

    const results: Array<{ week: number; status: string; bookingId?: string; reason?: string }> = [];
    const parentBookingId = `recurring-${Date.now()}`;

    // Check availability for all slots first
    for (let i = 0; i < weeks; i++) {
      const weekNum = i * weekIncrement;
      const slotStart = new Date(firstStartTime);
      slotStart.setDate(slotStart.getDate() + (weekNum * 7));
      
      const slotEnd = new Date(firstEndTime);
      slotEnd.setDate(slotEnd.getDate() + (weekNum * 7));

      // Check existing bookings
      const bookingsQuery = query(
        collection(db, 'bookings'),
        where('amenityId', '==', amenityId),
        where('startTime', '==', Timestamp.fromDate(slotStart)),
        where('status', 'in', ['confirmed', 'pending_confirmation'])
      );

      const existingBookings = await getDocs(bookingsQuery);

      if (existingBookings.size >= maxCapacity) {
        results.push({
          week: weekNum + 1,
          status: 'unavailable',
          reason: 'Slot fully booked'
        });
        continue;
      }

      // Create booking
      try {
        const bookingData = {
          userId: session.user.email,
          userEmail: session.user.email,
          userName: session.user.name || session.user.email.split('@')[0],
          userFlatNumber: (session.user as any).flatNumber || '',
          communityId: communityId,
          amenityId,
          amenityName,
          amenityType: amenityData.category || 'general',
          startTime: Timestamp.fromDate(slotStart),
          endTime: Timestamp.fromDate(slotEnd),
          selectedSlot,
          status: 'confirmed',
          attendees: [],
          qrId: Math.random().toString(36).substring(2, 15),
          isRecurring: true,
          recurringParentId: parentBookingId,
          recurringFrequency: frequency,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          reminderSent: false
        };

        const bookingRef = await addDoc(collection(db, 'bookings'), bookingData);
        
        results.push({
          week: weekNum + 1,
          status: 'confirmed',
          bookingId: bookingRef.id
        });

        console.log(`   ✅ Week ${weekNum + 1}: Booked (${bookingRef.id})`);

      } catch (error: any) {
        results.push({
          week: weekNum + 1,
          status: 'failed',
          reason: error.message
        });
        console.error(`   ❌ Week ${weekNum + 1}: Failed -`, error.message);
      }
    }

    const successCount = results.filter(r => r.status === 'confirmed').length;

    // Send email summary
    try {
      const { sendEmail } = await import('@/lib/email-service');
      
      const emailHtml = `
        <h2>Recurring Booking Summary</h2>
        <p>Hi ${session.user.name},</p>
        <p>Your recurring booking request for <strong>${amenityName}</strong> has been processed.</p>
        <h3>Results:</h3>
        <ul>
          ${results.map(r => `
            <li>
              Week ${r.week}: ${r.status.toUpperCase()} 
              ${r.bookingId ? `(ID: ${r.bookingId.substring(0, 8)})` : ''}
              ${r.reason ? `- ${r.reason}` : ''}
            </li>
          `).join('')}
        </ul>
        <p>Successfully booked: <strong>${successCount}/${weeks} weeks</strong></p>
      `;

      await sendEmail({
        to: session.user.email,
        subject: `Recurring Booking Summary - ${amenityName}`,
        html: emailHtml
      });
    } catch (emailError) {
      console.error('Failed to send summary email:', emailError);
    }

    return NextResponse.json({
      success: true,
      message: `Successfully booked ${successCount}/${weeks} weeks`,
      parentBookingId,
      results
    });

  } catch (error: any) {
    console.error('Error creating recurring booking:', error);
    return NextResponse.json({ 
      error: 'Failed to create recurring booking',
      message: error.message 
    }, { status: 500 });
  }
}
