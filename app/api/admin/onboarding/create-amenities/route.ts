import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

// Smart standard images mapping - High-quality Unsplash images for all amenity types
const standardImages = {
  // Swimming & Water Activities - High Quality
  pool: "https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?w=1200&q=90",
  swim: "https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?w=1200&q=90",
  swimming: "https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?w=1200&q=90",
  jacuzzi: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=1200&q=90",
  spa: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=1200&q=90",
  
  // Fitness & Sports - High Quality
  gym: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=1200&q=90",
  fitness: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=1200&q=90",
  workout: "https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=1200&q=90",
  badminton: "https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=1200&q=90",
  tennis: "https://images.unsplash.com/photo-1622279457486-62dcc4a431d6?w=1200&q=90",
  court: "https://images.unsplash.com/photo-1622547748225-3fc4abd2cca0?w=1200&q=90",
  basketball: "https://images.unsplash.com/photo-1546519638-68e109498ffc?w=1200&q=90",
  volleyball: "https://images.unsplash.com/photo-1612872087720-bb876e2e67d1?w=1200&q=90",
  cricket: "https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=1200&q=90",
  football: "https://images.unsplash.com/photo-1452978259579-8e92e42d2292?w=1200&q=90",
  soccer: "https://images.unsplash.com/photo-1452978259579-8e92e42d2292?w=1200&q=90",
  squash: "https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=1200&q=90",
  
  // Community Spaces - High Quality
  clubhouse: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200&q=90",
  club: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200&q=90",
  hall: "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=1200&q=90",
  community: "https://images.unsplash.com/photo-1511578314322-379afb476865?w=1200&q=90",
  meeting: "https://images.unsplash.com/photo-1517502884422-41eaead166d4?w=1200&q=90",
  event: "https://images.unsplash.com/photo-1511578314322-379afb476865?w=1200&q=90",
  banquet: "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=1200&q=90",
  party: "https://images.unsplash.com/photo-1511578314322-379afb476865?w=1200&q=90",
  multipurpose: "https://images.unsplash.com/photo-1497366754035-f200968a6e72?w=1200&q=90",
  
  // Children & Family - High Quality
  playground: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1200&q=90",
  kids: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1200&q=90",
  children: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1200&q=90",
  play: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1200&q=90",
  daycare: "https://images.unsplash.com/photo-1587654780291-39c9404d746b?w=1200&q=90",
  
  // Outdoor & Nature - High Quality
  park: "https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?w=1200&q=90",
  garden: "https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?w=1200&q=90",
  lawn: "https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?w=1200&q=90",
  walking: "https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=1200&q=90",
  jogging: "https://images.unsplash.com/photo-1552674605-db6ffd4facb5?w=1200&q=90",
  trail: "https://images.unsplash.com/photo-1551632811-561732d1e306?w=1200&q=90",
  bbq: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=1200&q=90",
  barbecue: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=1200&q=90",
  picnic: "https://images.unsplash.com/photo-1534880606858-29b0e8a24e8d?w=1200&q=90",
  
  // Parking & Transportation - High Quality
  parking: "https://images.unsplash.com/photo-1590674899484-d5640e854abe?w=1200&q=90",
  garage: "https://images.unsplash.com/photo-1590674899484-d5640e854abe?w=1200&q=90",
  car: "https://images.unsplash.com/photo-1590674899484-d5640e854abe?w=1200&q=90",
  vehicle: "https://images.unsplash.com/photo-1590674899484-d5640e854abe?w=1200&q=90",
  
  // Security & Safety - High Quality
  security: "https://images.unsplash.com/photo-1557597774-9d273605dfa9?w=1200&q=90",
  gate: "https://images.unsplash.com/photo-1557597774-9d273605dfa9?w=1200&q=90",
  entrance: "https://images.unsplash.com/photo-1557597774-9d273605dfa9?w=1200&q=90",
  guard: "https://images.unsplash.com/photo-1557597774-9d273605dfa9?w=1200&q=90",
  
  // Learning & Study - High Quality
  library: "https://images.unsplash.com/photo-1521587760476-6c12a4b040da?w=1200&q=90",
  study: "https://images.unsplash.com/photo-1521587760476-6c12a4b040da?w=1200&q=90",
  reading: "https://images.unsplash.com/photo-1521587760476-6c12a4b040da?w=1200&q=90",
  books: "https://images.unsplash.com/photo-1521587760476-6c12a4b040da?w=1200&q=90",
  classroom: "https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=1200&q=90",
  computer: "https://images.unsplash.com/photo-1588508065123-287b28e013da?w=1200&q=90",
  internet: "https://images.unsplash.com/photo-1588508065123-287b28e013da?w=1200&q=90",
  lab: "https://images.unsplash.com/photo-1581092160607-ee67e5f6b119?w=1200&q=90",
  
  // Wellness & Meditation - High Quality
  massage: "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=1200&q=90",
  sauna: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=1200&q=90",
  yoga: "https://images.unsplash.com/photo-1588286840104-8957b019727f?w=1200&q=90",
  meditation: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=1200&q=90",
  wellness: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=1200&q=90",
  
  // Entertainment & Recreation - High Quality
  cinema: "https://images.unsplash.com/photo-1594909122845-11baa439b7bf?w=1200&q=90",
  theater: "https://images.unsplash.com/photo-1594909122845-11baa439b7bf?w=1200&q=90",
  movie: "https://images.unsplash.com/photo-1594909122845-11baa439b7bf?w=1200&q=90",
  games: "https://images.unsplash.com/photo-1578574577315-3fbeb0cecdc2?w=1200&q=90",
  gaming: "https://images.unsplash.com/photo-1578574577315-3fbeb0cecdc2?w=1200&q=90",
  arcade: "https://images.unsplash.com/photo-1578574577315-3fbeb0cecdc2?w=1200&q=90",
  billiards: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=1200&q=90",
  pool_table: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=1200&q=90",
  snooker: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=1200&q=90",
  chess: "https://images.unsplash.com/photo-1560174038-da43ac14f82b?w=1200&q=90",
  
  // Business & Work - High Quality
  office: "https://images.unsplash.com/photo-1497366754035-f200968a6e72?w=1200&q=90",
  workspace: "https://images.unsplash.com/photo-1497366754035-f200968a6e72?w=1200&q=90",
  coworking: "https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=1200&q=90",
  conference: "https://images.unsplash.com/photo-1517502884422-41eaead166d4?w=1200&q=90",
  boardroom: "https://images.unsplash.com/photo-1577415124269-fc1140ec09ae?w=1200&q=90",
  
  // Food & Dining - High Quality
  restaurant: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1200&q=90",
  dining: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1200&q=90",
  cafe: "https://images.unsplash.com/photo-1559925393-8be0ec4767c8?w=1200&q=90",
  coffee: "https://images.unsplash.com/photo-1559925393-8be0ec4767c8?w=1200&q=90",
  kitchen: "https://images.unsplash.com/photo-1556912173-3bb406ef7e77?w=1200&q=90",
  food: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1200&q=90",
  
  // Special Facilities - High Quality
  laundry: "https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=1200&q=90",
  medical: "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=1200&q=90",
  clinic: "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=1200&q=90",
  salon: "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=1200&q=90",
  beauty: "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=1200&q=90",
  barber: "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=1200&q=90",
  
  // Music & Arts - High Quality
  music: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=1200&q=90",
  dance: "https://images.unsplash.com/photo-1508807526345-15e9b5f4eaff?w=1200&q=90",
  art: "https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=1200&q=90",
  studio: "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=1200&q=90",
  
  // Pet Facilities - High Quality
  pet: "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=1200&q=90",
  dog: "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=1200&q=90",
  animal: "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=1200&q=90",
  
  // Default fallback - Modern building
  default: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1200&q=90",
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