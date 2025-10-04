import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, Timestamp } from 'firebase/firestore';

export async function POST(request: NextRequest) {
  try {
    const { userEmail, communityId } = await request.json();

    if (!userEmail || !communityId) {
      return NextResponse.json(
        { error: 'Missing userEmail or communityId' },
        { status: 400 }
      );
    }

    // Create sample bookings
    const now = new Date();
    const sampleBookings = [
      {
        userId: userEmail,
        userEmail: userEmail,
        userName: userEmail.split('@')[0],
        communityId: communityId,
        amenityId: 'gym-001',
        amenityName: 'Community Gym',
        amenityType: 'fitness',
        startTime: Timestamp.fromDate(new Date(now.getTime() + 1 * 60 * 60 * 1000)), // 1 hour from now
        endTime: Timestamp.fromDate(new Date(now.getTime() + 2 * 60 * 60 * 1000)), // 2 hours from now
        status: 'confirmed',
        attendees: [userEmail],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        qrCodeGenerated: false,
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
        amenityId: 'pool-001',
        amenityName: 'Swimming Pool',
        amenityType: 'recreation',
        startTime: Timestamp.fromDate(new Date(now.getTime() + 3 * 60 * 60 * 1000)), // 3 hours from now
        endTime: Timestamp.fromDate(new Date(now.getTime() + 4 * 60 * 60 * 1000)), // 4 hours from now
        status: 'confirmed',
        attendees: [userEmail],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        qrCodeGenerated: false,
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
        amenityId: 'hall-001',
        amenityName: 'Community Hall',
        amenityType: 'venue',
        startTime: Timestamp.fromDate(new Date(now.getTime() - 2 * 60 * 60 * 1000)), // 2 hours ago
        endTime: Timestamp.fromDate(new Date(now.getTime() - 1 * 60 * 60 * 1000)), // 1 hour ago
        status: 'completed',
        attendees: [userEmail],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        qrCodeGenerated: true,
        metadata: {
          duration: 60,
          isRecurring: false
        }
      }
    ];

    const bookingPromises = sampleBookings.map(booking => 
      addDoc(collection(db, 'bookings'), booking)
    );

    const results = await Promise.all(bookingPromises);

    return NextResponse.json({
      success: true,
      message: `Created ${results.length} sample bookings`,
      bookingIds: results.map(doc => doc.id)
    });

  } catch (error) {
    console.error('Error creating sample bookings:', error);
    return NextResponse.json(
      { error: 'Failed to create sample bookings' },
      { status: 500 }
    );
  }
}