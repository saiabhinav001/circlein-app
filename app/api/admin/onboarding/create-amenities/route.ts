import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

// Smart standard images mapping - Comprehensive community amenities
const standardImages = {
  // Swimming & Water Activities
  pool: "https://images.unsplash.com/photo-1530549387789-4c1017266635?w=800&q=80",
  swim: "https://images.unsplash.com/photo-1530549387789-4c1017266635?w=800&q=80",
  swimming: "https://images.unsplash.com/photo-1530549387789-4c1017266635?w=800&q=80",
  jacuzzi: "https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=800&q=80",
  
  // Fitness & Sports
  gym: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&q=80",
  fitness: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&q=80",
  workout: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&q=80",
  badminton: "https://images.unsplash.com/photo-1521587514292-b84742881141?w=800&q=80",
  tennis: "https://images.unsplash.com/photo-1622279457486-62dcc4a431d6?w=800&q=80",
  court: "https://images.unsplash.com/photo-1521587514292-b84742881141?w=800&q=80",
  basketball: "https://images.unsplash.com/photo-1546519638-68e109498ffc?w=800&q=80",
  volleyball: "https://images.unsplash.com/photo-1612872087720-bb876e2e67d1?w=800&q=80",
  cricket: "https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=800&q=80",
  football: "https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?w=800&q=80",
  soccer: "https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?w=800&q=80",
  
  // Community Spaces
  clubhouse: "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=800&q=80",
  club: "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=800&q=80",
  hall: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&q=80",
  community: "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=800&q=80",
  meeting: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&q=80",
  event: "https://images.unsplash.com/photo-1511578314322-379afb476865?w=800&q=80",
  banquet: "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=800&q=80",
  party: "https://images.unsplash.com/photo-1511578314322-379afb476865?w=800&q=80",
  
  // Children & Family
  playground: "https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=800&q=80",
  kids: "https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=800&q=80",
  children: "https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=800&q=80",
  play: "https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=800&q=80",
  daycare: "https://images.unsplash.com/photo-1587654780291-39c9404d746b?w=800&q=80",
  
  // Outdoor & Nature
  park: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800&q=80",
  garden: "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=800&q=80",
  lawn: "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=800&q=80",
  walking: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800&q=80",
  jogging: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800&q=80",
  trail: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800&q=80",
  bbq: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800&q=80",
  barbecue: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800&q=80",
  picnic: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80",
  
  // Parking & Transportation
  parking: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80",
  garage: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80",
  car: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80",
  vehicle: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80",
  
  // Security & Safety
  security: "https://images.unsplash.com/photo-1516733725897-1aa73b87c8e8?w=800&q=80",
  gate: "https://images.unsplash.com/photo-1516733725897-1aa73b87c8e8?w=800&q=80",
  entrance: "https://images.unsplash.com/photo-1516733725897-1aa73b87c8e8?w=800&q=80",
  guard: "https://images.unsplash.com/photo-1516733725897-1aa73b87c8e8?w=800&q=80",
  
  // Learning & Study
  library: "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=800&q=80",
  study: "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=800&q=80",
  reading: "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=800&q=80",
  books: "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=800&q=80",
  classroom: "https://images.unsplash.com/photo-1497486751825-1233686d5d80?w=800&q=80",
  computer: "https://images.unsplash.com/photo-1531297484001-80022131f5a1?w=800&q=80",
  internet: "https://images.unsplash.com/photo-1531297484001-80022131f5a1?w=800&q=80",
  
  // Wellness & Spa
  spa: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=800&q=80",
  massage: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=800&q=80",
  sauna: "https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=800&q=80",
  yoga: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800&q=80",
  meditation: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800&q=80",
  wellness: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=800&q=80",
  
  // Entertainment & Recreation
  cinema: "https://images.unsplash.com/photo-1489185078076-b4c1b1dac2b4?w=800&q=80",
  theater: "https://images.unsplash.com/photo-1489185078076-b4c1b1dac2b4?w=800&q=80",
  movie: "https://images.unsplash.com/photo-1489185078076-b4c1b1dac2b4?w=800&q=80",
  games: "https://images.unsplash.com/photo-1511512578047-dfb367046420?w=800&q=80",
  gaming: "https://images.unsplash.com/photo-1511512578047-dfb367046420?w=800&q=80",
  arcade: "https://images.unsplash.com/photo-1511512578047-dfb367046420?w=800&q=80",
  billiards: "https://images.unsplash.com/photo-1604586376495-48526febf9f6?w=800&q=80",
  pool_table: "https://images.unsplash.com/photo-1604586376495-48526febf9f6?w=800&q=80",
  snooker: "https://images.unsplash.com/photo-1604586376495-48526febf9f6?w=800&q=80",
  
  // Business & Work
  office: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&q=80",
  workspace: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&q=80",
  coworking: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&q=80",
  conference: "https://images.unsplash.com/photo-1517502884422-41eaead166d4?w=800&q=80",
  
  // Food & Dining
  restaurant: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&q=80",
  dining: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&q=80",
  cafe: "https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800&q=80",
  coffee: "https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800&q=80",
  kitchen: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&q=80",
  
  // Special Facilities
  laundry: "https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=800&q=80",
  medical: "https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=800&q=80",
  clinic: "https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=800&q=80",
  salon: "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800&q=80",
  beauty: "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800&q=80",
  
  // Default fallback
  default: "https://images.unsplash.com/photo-1584735935682-2f2b69d4e0d3?w=800&q=80",
};

function getSmartImage(amenityName: string, providedUrl?: string): string {
  // If user provided an image URL, use it
  if (providedUrl && providedUrl.trim() !== '') {
    return providedUrl;
  }

  // Convert name to lowercase for keyword matching
  const lowerName = amenityName.toLowerCase();
  
  // Check for keyword matches
  for (const [keyword, imageUrl] of Object.entries(standardImages)) {
    if (keyword !== 'default' && lowerName.includes(keyword)) {
      return imageUrl;
    }
  }
  
  // Return default image if no keywords match
  return standardImages.default;
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