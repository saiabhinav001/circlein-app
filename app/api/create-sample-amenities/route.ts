import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, doc, setDoc, serverTimestamp } from 'firebase/firestore';

export async function POST(request: NextRequest) {
  try {
    const { communityId } = await request.json();

    if (!communityId) {
      return NextResponse.json(
        { error: 'Missing communityId' },
        { status: 400 }
      );
    }

    // Create sample amenities
    const sampleAmenities = [
      {
        id: 'gym-001',
        name: 'Community Gym',
        type: 'fitness',
        description: 'Fully equipped fitness center with modern equipment',
        communityId: communityId,
        capacity: 20,
        isActive: true,
        bookingDuration: 60, // minutes
        advanceBookingDays: 7,
        rules: ['No outside food or drinks', 'Clean equipment after use', 'Proper gym attire required'],
        amenities: ['Cardio Equipment', 'Weight Training', 'Free Weights'],
        operatingHours: {
          monday: { open: '06:00', close: '22:00' },
          tuesday: { open: '06:00', close: '22:00' },
          wednesday: { open: '06:00', close: '22:00' },
          thursday: { open: '06:00', close: '22:00' },
          friday: { open: '06:00', close: '22:00' },
          saturday: { open: '08:00', close: '20:00' },
          sunday: { open: '08:00', close: '20:00' }
        },
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      },
      {
        id: 'pool-001',
        name: 'Swimming Pool',
        type: 'recreation',
        description: 'Olympic-size swimming pool with separate kids area',
        communityId: communityId,
        capacity: 30,
        isActive: true,
        bookingDuration: 60,
        advanceBookingDays: 7,
        rules: ['No diving in shallow end', 'Children must be supervised', 'Proper swimwear required'],
        amenities: ['Olympic Pool', 'Kids Pool', 'Pool Deck', 'Changing Rooms'],
        operatingHours: {
          monday: { open: '06:00', close: '21:00' },
          tuesday: { open: '06:00', close: '21:00' },
          wednesday: { open: '06:00', close: '21:00' },
          thursday: { open: '06:00', close: '21:00' },
          friday: { open: '06:00', close: '21:00' },
          saturday: { open: '07:00', close: '22:00' },
          sunday: { open: '07:00', close: '22:00' }
        },
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      },
      {
        id: 'hall-001',
        name: 'Community Hall',
        type: 'venue',
        description: 'Large multi-purpose hall for events and gatherings',
        communityId: communityId,
        capacity: 100,
        isActive: true,
        bookingDuration: 120,
        advanceBookingDays: 30,
        rules: ['No loud music after 10 PM', 'Clean up after use', 'No smoking or alcohol'],
        amenities: ['Sound System', 'Projector', 'Tables and Chairs', 'Kitchen Access'],
        operatingHours: {
          monday: { open: '09:00', close: '22:00' },
          tuesday: { open: '09:00', close: '22:00' },
          wednesday: { open: '09:00', close: '22:00' },
          thursday: { open: '09:00', close: '22:00' },
          friday: { open: '09:00', close: '23:00' },
          saturday: { open: '09:00', close: '23:00' },
          sunday: { open: '09:00', close: '22:00' }
        },
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      },
      {
        id: 'tennis-001',
        name: 'Tennis Court',
        type: 'sports',
        description: 'Professional tennis court with LED lighting',
        communityId: communityId,
        capacity: 4,
        isActive: true,
        bookingDuration: 90,
        advanceBookingDays: 14,
        rules: ['Tennis shoes required', 'Maximum 2 hours per booking', 'No food on court'],
        amenities: ['Professional Court', 'LED Lighting', 'Seating Area'],
        operatingHours: {
          monday: { open: '06:00', close: '21:00' },
          tuesday: { open: '06:00', close: '21:00' },
          wednesday: { open: '06:00', close: '21:00' },
          thursday: { open: '06:00', close: '21:00' },
          friday: { open: '06:00', close: '21:00' },
          saturday: { open: '07:00', close: '20:00' },
          sunday: { open: '07:00', close: '20:00' }
        },
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      }
    ];

    const amenityPromises = sampleAmenities.map(amenity => 
      setDoc(doc(db, 'amenities', amenity.id), amenity)
    );

    await Promise.all(amenityPromises);

    return NextResponse.json({
      success: true,
      message: `Created ${sampleAmenities.length} sample amenities`,
      amenityIds: sampleAmenities.map(a => a.id)
    });

  } catch (error) {
    console.error('Error creating sample amenities:', error);
    return NextResponse.json(
      { error: 'Failed to create sample amenities' },
      { status: 500 }
    );
  }
}