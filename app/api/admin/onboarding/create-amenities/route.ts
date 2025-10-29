import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

// Smart Image Mapping System - PROTECTED AMENITIES: Swimming Pool, Gym, Community Clubhouse, Tennis Court
const standardImages: Record<string, string> = {
  // SWIMMING & WATER - PROTECTED
  "swimming pool": "https://images.pexels.com/photos/261102/pexels-photo-261102.jpeg?auto=compress&cs=tinysrgb&w=1200", // PROTECTED
  swimming: "https://images.pexels.com/photos/261102/pexels-photo-261102.jpeg?auto=compress&cs=tinysrgb&w=1200",
  pool: "https://images.pexels.com/photos/261102/pexels-photo-261102.jpeg?auto=compress&cs=tinysrgb&w=1200",
  
  // RACKET SPORTS - Tennis PROTECTED
  "tennis court": "https://images.pexels.com/photos/209977/pexels-photo-209977.jpeg?auto=compress&cs=tinysrgb&w=1200", // PROTECTED
  tennis: "https://images.pexels.com/photos/209977/pexels-photo-209977.jpeg?auto=compress&cs=tinysrgb&w=1200",
  "badminton court": "https://images.pexels.com/photos/3660204/pexels-photo-3660204.jpeg?auto=compress&cs=tinysrgb&w=1200",
  badminton: "https://images.pexels.com/photos/3660204/pexels-photo-3660204.jpeg?auto=compress&cs=tinysrgb&w=1200",
  "table tennis": "https://images.pexels.com/photos/976873/pexels-photo-976873.jpeg?auto=compress&cs=tinysrgb&w=1200",
  "ping pong": "https://images.pexels.com/photos/976873/pexels-photo-976873.jpeg?auto=compress&cs=tinysrgb&w=1200",
  "pickleball court": "https://images.pexels.com/photos/6224386/pexels-photo-6224386.jpeg?auto=compress&cs=tinysrgb&w=1200",
  pickleball: "https://images.pexels.com/photos/6224386/pexels-photo-6224386.jpeg?auto=compress&cs=tinysrgb&w=1200",
  
  // COURT SPORTS
  "basketball court": "https://images.pexels.com/photos/1544008/pexels-photo-1544008.jpeg?auto=compress&cs=tinysrgb&w=1200",
  basketball: "https://images.pexels.com/photos/1544008/pexels-photo-1544008.jpeg?auto=compress&cs=tinysrgb&w=1200",
  "volleyball court": "https://images.pexels.com/photos/1263426/pexels-photo-1263426.jpeg?auto=compress&cs=tinysrgb&w=1200",
  volleyball: "https://images.pexels.com/photos/1263426/pexels-photo-1263426.jpeg?auto=compress&cs=tinysrgb&w=1200",
  
  // FIELD SPORTS
  "cricket pitch": "https://images.pexels.com/photos/1510960/pexels-photo-1510960.jpeg?auto=compress&cs=tinysrgb&w=1200",
  cricket: "https://images.pexels.com/photos/1510960/pexels-photo-1510960.jpeg?auto=compress&cs=tinysrgb&w=1200",
  "football field": "https://images.pexels.com/photos/399187/pexels-photo-399187.jpeg?auto=compress&cs=tinysrgb&w=1200",
  football: "https://images.pexels.com/photos/399187/pexels-photo-399187.jpeg?auto=compress&cs=tinysrgb&w=1200",
  soccer: "https://images.pexels.com/photos/399187/pexels-photo-399187.jpeg?auto=compress&cs=tinysrgb&w=1200",
  
  // FITNESS - Gym PROTECTED
  "fitness center": "https://images.pexels.com/photos/1552242/pexels-photo-1552242.jpeg?auto=compress&cs=tinysrgb&w=1200", // PROTECTED
  gym: "https://images.pexels.com/photos/1552242/pexels-photo-1552242.jpeg?auto=compress&cs=tinysrgb&w=1200", // PROTECTED
  fitness: "https://images.pexels.com/photos/1552242/pexels-photo-1552242.jpeg?auto=compress&cs=tinysrgb&w=1200",
  workout: "https://images.pexels.com/photos/1552242/pexels-photo-1552242.jpeg?auto=compress&cs=tinysrgb&w=1200",
  yoga: "https://images.pexels.com/photos/3822621/pexels-photo-3822621.jpeg?auto=compress&cs=tinysrgb&w=1200",
  
  // COMMUNITY - Clubhouse PROTECTED
  "community clubhouse": "https://images.pexels.com/photos/1181406/pexels-photo-1181406.jpeg?auto=compress&cs=tinysrgb&w=1200", // PROTECTED
  clubhouse: "https://images.pexels.com/photos/1181406/pexels-photo-1181406.jpeg?auto=compress&cs=tinysrgb&w=1200",
  community: "https://images.pexels.com/photos/1181406/pexels-photo-1181406.jpeg?auto=compress&cs=tinysrgb&w=1200",
  hall: "https://images.pexels.com/photos/1579253/pexels-photo-1579253.jpeg?auto=compress&cs=tinysrgb&w=1200",
  playground: "https://images.pexels.com/photos/1770809/pexels-photo-1770809.jpeg?auto=compress&cs=tinysrgb&w=1200",
  garden: "https://images.pexels.com/photos/1105019/pexels-photo-1105019.jpeg?auto=compress&cs=tinysrgb&w=1200",
  park: "https://images.pexels.com/photos/3889906/pexels-photo-3889906.jpeg?auto=compress&cs=tinysrgb&w=1200",
};

function getSmartImage(amenityName: string, providedUrl?: string): string {
  // If user provided a URL, use it
  if (providedUrl && providedUrl.trim()) {
    return providedUrl;
  }

  // Normalize the amenity name: lowercase and remove extra whitespace
  const normalizedName = amenityName.toLowerCase().trim().replace(/\s+/g, ' ');

  // Sort keywords by length (longest first) to match most specific first
  const sortedKeywords = Object.keys(standardImages).sort((a, b) => b.length - a.length);

  // Find the first (longest) matching keyword
  for (const keyword of sortedKeywords) {
    if (normalizedName.includes(keyword)) {
      console.log(`✅ Image matched: "${amenityName}" → keyword: "${keyword}"`);
      return standardImages[keyword];
    }
  }

  // Default fallback to Community Clubhouse (PROTECTED image)
  console.log(`⚠️ No keyword match for "${amenityName}", using clubhouse fallback`);
  return standardImages["clubhouse"];
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { communityId, amenities } = await request.json();

    if (!communityId || !amenities || !Array.isArray(amenities)) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Verify the user belongs to this community
    if (session.user.communityId !== communityId) {
      return NextResponse.json(
        { error: 'Unauthorized - Community mismatch' },
        { status: 401 }
      );
    }

    // Validate amenities
    for (const amenity of amenities) {
      if (!amenity.name || !amenity.description) {
        return NextResponse.json(
          { error: 'Each amenity must have a name and description' },
          { status: 400 }
        );
      }
      
      // Validate booking rules
      if (amenity.maxPeople && (amenity.maxPeople < 1 || amenity.maxPeople > 100)) {
        return NextResponse.json(
          { error: 'Max people must be between 1 and 100' },
          { status: 400 }
        );
      }
      
      if (amenity.slotDuration && (amenity.slotDuration < 0.5 || amenity.slotDuration > 8)) {
        return NextResponse.json(
          { error: 'Slot duration must be between 0.5 and 8 hours' },
          { status: 400 }
        );
      }
    }

    // Create amenities with smart image assignment
    const createdAmenities = [];
    
    console.log('Creating amenities for community:', communityId);
    console.log('Amenities to create:', amenities);
    
    for (const amenity of amenities) {
      const amenityData = {
        name: amenity.name.trim(),
        description: amenity.description.trim(),
        imageUrl: getSmartImage(amenity.name, amenity.imageUrl),
        communityId,
        createdAt: new Date(),
        updatedAt: new Date(),
        isActive: true,
        rules: {
          maxSlotsPerFamily: amenity.maxPeople || 2,
          blackoutDates: [],
        },
        booking: {
          maxPeople: amenity.maxPeople || 6,
          slotDuration: amenity.slotDuration || 2,
          weekdayHours: {
            startTime: amenity.weekdayStartTime || '09:00',
            endTime: amenity.weekdayEndTime || '21:00',
          },
          weekendHours: {
            startTime: amenity.weekendStartTime || '08:00',
            endTime: amenity.weekendEndTime || '22:00',
          },
        },
      };

      console.log('Creating amenity document:', amenityData);
      
      const docRef = await addDoc(collection(db, 'amenities'), amenityData);
      console.log('Created amenity with ID:', docRef.id);
      
      createdAmenities.push({
        id: docRef.id,
        ...amenityData,
      });
    }

    console.log('All amenities created successfully:', createdAmenities);

    return NextResponse.json({
      success: true,
      message: `Successfully created ${createdAmenities.length} amenities`,
      amenities: createdAmenities,
    });
  } catch (error) {
    console.error('Error creating amenities:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}