import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, Timestamp } from 'firebase/firestore';

export async function POST(request: NextRequest) {
  try {
    const { communityId = 'default-community', userEmail } = await request.json();
    
    if (!userEmail) {
      return NextResponse.json({ error: 'userEmail is required' }, { status: 400 });
    }

    const sampleBookings = [
      {
        userId: userEmail,
        userEmail: userEmail,
        userName: userEmail.split('@')[0],
        communityId: communityId,
        amenityId: 'sample-gym',
        amenityName: 'Community Gym',
        amenityType: 'fitness',
        startTime: Timestamp.fromDate(new Date(Date.now() + 60 * 60 * 1000)), // 1 hour from now
        endTime: Timestamp.fromDate(new Date(Date.now() + 2 * 60 * 60 * 1000)), // 2 hours from now
        status: 'confirmed',
        attendees: [userEmail],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        qrCodeGenerated: false,
        adminCancellation: false,
        metadata: {
          duration: 60,
          isRecurring: false
        }
      },
      {
        userId: userEmail,
        userEmail: userEmail,
        userName: userEmail.split('@')[0],
        communityId: communityId,
        amenityId: 'sample-pool',
        amenityName: 'Swimming Pool',
        amenityType: 'recreation',
        startTime: Timestamp.fromDate(new Date(Date.now() + 24 * 60 * 60 * 1000)), // Tomorrow
        endTime: Timestamp.fromDate(new Date(Date.now() + 25 * 60 * 60 * 1000)), // Tomorrow + 1 hour
        status: 'confirmed',
        attendees: [userEmail],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        qrCodeGenerated: false,
        adminCancellation: false,
        metadata: {
          duration: 60,
          isRecurring: false
        }
      }
    ];

    const createdBookings = [];
    
    for (const booking of sampleBookings) {
      const docRef = await addDoc(collection(db, 'bookings'), booking);
      createdBookings.push({
        id: docRef.id,
        ...booking
      });
    }

    return NextResponse.json({
      success: true,
      message: `Created ${createdBookings.length} sample bookings`,
      bookings: createdBookings,
      communityId,
      userEmail
    });

  } catch (error: any) {
    console.error('Error creating sample bookings:', error);
    return NextResponse.json({
      error: 'Failed to create sample bookings',
      details: error.message
    }, { status: 500 });
  }
}