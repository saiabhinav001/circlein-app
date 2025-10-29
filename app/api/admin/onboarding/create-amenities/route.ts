import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

// Smart standard images mapping - High-quality Pexels images for all amenity types (WORKING IN PRODUCTION)
// NOTE: Order matters! More specific keywords FIRST (e.g., "badminton" before "court")
// PROTECTED (DO NOT CHANGE): Swimming Pool, Gym, Community Clubhouse, Tennis Court - these are PERFECT
const standardImages: Record<string, string> = {
  // Swimming & Water Activities - High Quality Pexels (PROTECTED - PERFECT)
  "swimming pool": "https://images.pexels.com/photos/261102/pexels-photo-261102.jpeg?auto=compress&cs=tinysrgb&w=1200",
  swimming: "https://images.pexels.com/photos/261102/pexels-photo-261102.jpeg?auto=compress&cs=tinysrgb&w=1200",
  pool: "https://images.pexels.com/photos/261102/pexels-photo-261102.jpeg?auto=compress&cs=tinysrgb&w=1200",
  swim: "https://images.pexels.com/photos/261102/pexels-photo-261102.jpeg?auto=compress&cs=tinysrgb&w=1200",
  jacuzzi: "https://images.pexels.com/photos/221457/pexels-photo-221457.jpeg?auto=compress&cs=tinysrgb&w=1200",
  "hot tub": "https://images.pexels.com/photos/221457/pexels-photo-221457.jpeg?auto=compress&cs=tinysrgb&w=1200",
  spa: "https://images.pexels.com/photos/3757946/pexels-photo-3757946.jpeg?auto=compress&cs=tinysrgb&w=1200",
  
  // Fitness & Sports - High Quality Pexels (Tennis & Gym PROTECTED - PERFECT)
  // RACKET SPORTS - Each sport gets unique image
  "badminton court": "https://images.pexels.com/photos/3660204/pexels-photo-3660204.jpeg?auto=compress&cs=tinysrgb&w=1200", // Indoor badminton
  badminton: "https://images.pexels.com/photos/3660204/pexels-photo-3660204.jpeg?auto=compress&cs=tinysrgb&w=1200",
  "tennis court": "https://images.pexels.com/photos/209977/pexels-photo-209977.jpeg?auto=compress&cs=tinysrgb&w=1200", // PROTECTED - PERFECT
  tennis: "https://images.pexels.com/photos/209977/pexels-photo-209977.jpeg?auto=compress&cs=tinysrgb&w=1200", // PROTECTED
  "table tennis": "https://images.pexels.com/photos/976873/pexels-photo-976873.jpeg?auto=compress&cs=tinysrgb&w=1200", // Table tennis table
  "ping pong": "https://images.pexels.com/photos/976873/pexels-photo-976873.jpeg?auto=compress&cs=tinysrgb&w=1200",
  "pickleball court": "https://images.pexels.com/photos/6224386/pexels-photo-6224386.jpeg?auto=compress&cs=tinysrgb&w=1200", // Pickleball court
  pickleball: "https://images.pexels.com/photos/6224386/pexels-photo-6224386.jpeg?auto=compress&cs=tinysrgb&w=1200",
  "squash court": "https://images.pexels.com/photos/6253913/pexels-photo-6253913.jpeg?auto=compress&cs=tinysrgb&w=1200", // Squash court
  squash: "https://images.pexels.com/photos/6253913/pexels-photo-6253913.jpeg?auto=compress&cs=tinysrgb&w=1200",
  "racquetball court": "https://images.pexels.com/photos/6253919/pexels-photo-6253919.jpeg?auto=compress&cs=tinysrgb&w=1200",
  racquetball: "https://images.pexels.com/photos/6253919/pexels-photo-6253919.jpeg?auto=compress&cs=tinysrgb&w=1200",
  
  // COURT SPORTS - Each gets unique image
  "basketball court": "https://images.pexels.com/photos/1080875/pexels-photo-1080875.jpeg?auto=compress&cs=tinysrgb&w=1200", // Outdoor basketball
  basketball: "https://images.pexels.com/photos/1080875/pexels-photo-1080875.jpeg?auto=compress&cs=tinysrgb&w=1200",
  "volleyball court": "https://images.pexels.com/photos/1263426/pexels-photo-1263426.jpeg?auto=compress&cs=tinysrgb&w=1200", // Beach volleyball
  volleyball: "https://images.pexels.com/photos/1263426/pexels-photo-1263426.jpeg?auto=compress&cs=tinysrgb&w=1200",
  "beach volleyball": "https://images.pexels.com/photos/1263426/pexels-photo-1263426.jpeg?auto=compress&cs=tinysrgb&w=1200",
  "handball court": "https://images.pexels.com/photos/1277386/pexels-photo-1277386.jpeg?auto=compress&cs=tinysrgb&w=1200",
  handball: "https://images.pexels.com/photos/1277386/pexels-photo-1277386.jpeg?auto=compress&cs=tinysrgb&w=1200",
  
  // FIELD SPORTS - Each gets unique image
  "cricket pitch": "https://images.pexels.com/photos/1510960/pexels-photo-1510960.jpeg?auto=compress&cs=tinysrgb&w=1200", // Cricket stadium
  "cricket ground": "https://images.pexels.com/photos/1510960/pexels-photo-1510960.jpeg?auto=compress&cs=tinysrgb&w=1200",
  cricket: "https://images.pexels.com/photos/1510960/pexels-photo-1510960.jpeg?auto=compress&cs=tinysrgb&w=1200",
  "football field": "https://images.pexels.com/photos/399187/pexels-photo-399187.jpeg?auto=compress&cs=tinysrgb&w=1200", // Soccer field
  football: "https://images.pexels.com/photos/399187/pexels-photo-399187.jpeg?auto=compress&cs=tinysrgb&w=1200",
  "soccer field": "https://images.pexels.com/photos/399187/pexels-photo-399187.jpeg?auto=compress&cs=tinysrgb&w=1200",
  soccer: "https://images.pexels.com/photos/399187/pexels-photo-399187.jpeg?auto=compress&cs=tinysrgb&w=1200",
  "rugby field": "https://images.pexels.com/photos/209956/pexels-photo-209956.jpeg?auto=compress&cs=tinysrgb&w=1200",
  rugby: "https://images.pexels.com/photos/209956/pexels-photo-209956.jpeg?auto=compress&cs=tinysrgb&w=1200",
  "baseball field": "https://images.pexels.com/photos/1661950/pexels-photo-1661950.jpeg?auto=compress&cs=tinysrgb&w=1200",
  baseball: "https://images.pexels.com/photos/1661950/pexels-photo-1661950.jpeg?auto=compress&cs=tinysrgb&w=1200",
  "softball field": "https://images.pexels.com/photos/1661950/pexels-photo-1661950.jpeg?auto=compress&cs=tinysrgb&w=1200",
  softball: "https://images.pexels.com/photos/1661950/pexels-photo-1661950.jpeg?auto=compress&cs=tinysrgb&w=1200",
  
  // TRACK & OUTDOOR FITNESS
  "running track": "https://images.pexels.com/photos/2803158/pexels-photo-2803158.jpeg?auto=compress&cs=tinysrgb&w=1200",
  "jogging track": "https://images.pexels.com/photos/2803158/pexels-photo-2803158.jpeg?auto=compress&cs=tinysrgb&w=1200",
  track: "https://images.pexels.com/photos/2803158/pexels-photo-2803158.jpeg?auto=compress&cs=tinysrgb&w=1200",
  athletics: "https://images.pexels.com/photos/2803158/pexels-photo-2803158.jpeg?auto=compress&cs=tinysrgb&w=1200",
  "outdoor gym": "https://images.pexels.com/photos/6455929/pexels-photo-6455929.jpeg?auto=compress&cs=tinysrgb&w=1200",
  "open gym": "https://images.pexels.com/photos/6455929/pexels-photo-6455929.jpeg?auto=compress&cs=tinysrgb&w=1200",
  
  // FITNESS CENTERS - Gym PROTECTED
  "fitness center": "https://images.pexels.com/photos/1552242/pexels-photo-1552242.jpeg?auto=compress&cs=tinysrgb&w=1200", // PROTECTED
  gym: "https://images.pexels.com/photos/1552242/pexels-photo-1552242.jpeg?auto=compress&cs=tinysrgb&w=1200", // PROTECTED - PERFECT
  fitness: "https://images.pexels.com/photos/1552242/pexels-photo-1552242.jpeg?auto=compress&cs=tinysrgb&w=1200", // PROTECTED
  workout: "https://images.pexels.com/photos/1552242/pexels-photo-1552242.jpeg?auto=compress&cs=tinysrgb&w=1200", // PROTECTED
  "weight room": "https://images.pexels.com/photos/1552252/pexels-photo-1552252.jpeg?auto=compress&cs=tinysrgb&w=1200",
  weights: "https://images.pexels.com/photos/1552252/pexels-photo-1552252.jpeg?auto=compress&cs=tinysrgb&w=1200",
  "cardio room": "https://images.pexels.com/photos/4162449/pexels-photo-4162449.jpeg?auto=compress&cs=tinysrgb&w=1200",
  cardio: "https://images.pexels.com/photos/4162449/pexels-photo-4162449.jpeg?auto=compress&cs=tinysrgb&w=1200",
  "aerobics room": "https://images.pexels.com/photos/3775566/pexels-photo-3775566.jpeg?auto=compress&cs=tinysrgb&w=1200",
  aerobics: "https://images.pexels.com/photos/3775566/pexels-photo-3775566.jpeg?auto=compress&cs=tinysrgb&w=1200",
  "dance studio": "https://images.pexels.com/photos/3775566/pexels-photo-3775566.jpeg?auto=compress&cs=tinysrgb&w=1200",
  dance: "https://images.pexels.com/photos/3775566/pexels-photo-3775566.jpeg?auto=compress&cs=tinysrgb&w=1200",
  zumba: "https://images.pexels.com/photos/3775566/pexels-photo-3775566.jpeg?auto=compress&cs=tinysrgb&w=1200",
  "spin class": "https://images.pexels.com/photos/3253501/pexels-photo-3253501.jpeg?auto=compress&cs=tinysrgb&w=1200",
  spinning: "https://images.pexels.com/photos/3253501/pexels-photo-3253501.jpeg?auto=compress&cs=tinysrgb&w=1200",
  cycling: "https://images.pexels.com/photos/3253501/pexels-photo-3253501.jpeg?auto=compress&cs=tinysrgb&w=1200",
  
  // MARTIAL ARTS & COMBAT SPORTS
  "boxing ring": "https://images.pexels.com/photos/260447/pexels-photo-260447.jpeg?auto=compress&cs=tinysrgb&w=1200",
  boxing: "https://images.pexels.com/photos/260447/pexels-photo-260447.jpeg?auto=compress&cs=tinysrgb&w=1200",
  "martial arts": "https://images.pexels.com/photos/7990302/pexels-photo-7990302.jpeg?auto=compress&cs=tinysrgb&w=1200",
  karate: "https://images.pexels.com/photos/7990302/pexels-photo-7990302.jpeg?auto=compress&cs=tinysrgb&w=1200",
  taekwondo: "https://images.pexels.com/photos/7990302/pexels-photo-7990302.jpeg?auto=compress&cs=tinysrgb&w=1200",
  judo: "https://images.pexels.com/photos/7990302/pexels-photo-7990302.jpeg?auto=compress&cs=tinysrgb&w=1200",
  "mma gym": "https://images.pexels.com/photos/4754146/pexels-photo-4754146.jpeg?auto=compress&cs=tinysrgb&w=1200",
  mma: "https://images.pexels.com/photos/4754146/pexels-photo-4754146.jpeg?auto=compress&cs=tinysrgb&w=1200",
  
  // SKATING & ROLLING SPORTS
  "skating rink": "https://images.pexels.com/photos/6266517/pexels-photo-6266517.jpeg?auto=compress&cs=tinysrgb&w=1200",
  skating: "https://images.pexels.com/photos/6266517/pexels-photo-6266517.jpeg?auto=compress&cs=tinysrgb&w=1200",
  "ice skating": "https://images.pexels.com/photos/6266517/pexels-photo-6266517.jpeg?auto=compress&cs=tinysrgb&w=1200",
  "roller skating": "https://images.pexels.com/photos/6266517/pexels-photo-6266517.jpeg?auto=compress&cs=tinysrgb&w=1200",
  "skate park": "https://images.pexels.com/photos/4676326/pexels-photo-4676326.jpeg?auto=compress&cs=tinysrgb&w=1200",
  skateboarding: "https://images.pexels.com/photos/4676326/pexels-photo-4676326.jpeg?auto=compress&cs=tinysrgb&w=1200",
  
  // GOLF & PRECISION SPORTS
  "golf course": "https://images.pexels.com/photos/424063/pexels-photo-424063.jpeg?auto=compress&cs=tinysrgb&w=1200",
  golf: "https://images.pexels.com/photos/424063/pexels-photo-424063.jpeg?auto=compress&cs=tinysrgb&w=1200",
  "mini golf": "https://images.pexels.com/photos/914682/pexels-photo-914682.jpeg?auto=compress&cs=tinysrgb&w=1200",
  "putting green": "https://images.pexels.com/photos/914682/pexels-photo-914682.jpeg?auto=compress&cs=tinysrgb&w=1200",
  "archery range": "https://images.pexels.com/photos/6256005/pexels-photo-6256005.jpeg?auto=compress&cs=tinysrgb&w=1200",
  archery: "https://images.pexels.com/photos/6256005/pexels-photo-6256005.jpeg?auto=compress&cs=tinysrgb&w=1200",
  
  // CLIMBING & ADVENTURE
  "rock climbing": "https://images.pexels.com/photos/2859547/pexels-photo-2859547.jpeg?auto=compress&cs=tinysrgb&w=1200",
  "climbing wall": "https://images.pexels.com/photos/2859547/pexels-photo-2859547.jpeg?auto=compress&cs=tinysrgb&w=1200",
  climbing: "https://images.pexels.com/photos/2859547/pexels-photo-2859547.jpeg?auto=compress&cs=tinysrgb&w=1200",
  bouldering: "https://images.pexels.com/photos/2859547/pexels-photo-2859547.jpeg?auto=compress&cs=tinysrgb&w=1200",
  
  court: "https://images.pexels.com/photos/209977/pexels-photo-209977.jpeg?auto=compress&cs=tinysrgb&w=1200", // Generic fallback
};

function getSmartImage(amenityName: string, providedUrl?: string): string {
  // If user provided an image URL, use it
  if (providedUrl && providedUrl.trim() !== '') {
    return providedUrl;
  }

  // Convert name to lowercase and remove extra spaces for robust matching
  const normalizedName = amenityName.toLowerCase().trim().replace(/\s+/g, ' ');
  
  // Sort keywords by length (longest first) to match "badminton court" before "court"
  const sortedKeywords = Object.keys(standardImages)
    .filter(k => k !== 'default')
    .sort((a, b) => b.length - a.length);
  
  // Check for keyword matches - handles variations like "Badminton", "badminton court", "BADMINTON COURT"
  for (const keyword of sortedKeywords) {
    if (normalizedName.includes(keyword)) {
      console.log(`✅ Image matched: "${amenityName}" → keyword: "${keyword}"`);
      return standardImages[keyword];
    }
  }
  
  // Return default image if no keywords match
  console.log(`⚠️ No keyword match for "${amenityName}", using default image`);
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