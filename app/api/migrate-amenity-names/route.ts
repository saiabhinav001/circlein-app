import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, getDocs, updateDoc, doc, writeBatch } from 'firebase/firestore';

export async function POST(request: NextRequest) {
  try {
    const { communityId = 'default-community' } = await request.json();
    
    console.log('🔧 Starting amenity name migration for community:', communityId);
    
    // Enhanced amenity mappings
    const enhancedMappings: { [key: string]: string } = {
      // Common patterns from your screenshot
      'nllela': 'Swimming Pool',
      'cn2bqkur': 'Tennis Court', 
      'rr04us': 'Fitness Center',
      'fw1i': 'Community Lounge',
      'msoyf': 'Meeting Room',
      'wu6b': 'Basketball Court',
      'yskq': 'Spa & Wellness',
      
      // Standard mappings
      'pool': 'Swimming Pool',
      'gym': 'Fitness Center',
      'tennis': 'Tennis Court',
      'basketball': 'Basketball Court',
      'clubhouse': 'Clubhouse',
      'meeting': 'Meeting Room',
      'conference': 'Conference Room',
      'party': 'Party Hall',
      'bbq': 'BBQ Area',
      'playground': 'Playground',
      'spa': 'Spa & Wellness',
      'library': 'Community Library',
      'coworking': 'Coworking Space',
      'theater': 'Community Theater',
      'studio': 'Fitness Studio',
      'lounge': 'Community Lounge',
      'kitchen': 'Community Kitchen',
      'dining': 'Dining Hall',
      'garden': 'Community Garden',
      'rooftop': 'Rooftop Terrace',
      'yoga': 'Yoga Studio',
      'dance': 'Dance Studio',
      'music': 'Music Room',
      'game': 'Game Room',
      'study': 'Study Room',
      'business': 'Business Center',
      'parking': 'Parking Area'
    };

    // Function to generate proper amenity name
    const generateProperName = (amenityId: string, currentName: string): string => {
      // If current name is already good, keep it
      if (currentName && 
          currentName !== 'Community Facility' && 
          currentName.length > 2 && 
          currentName.length < 50 &&
          !currentName.includes('undefined') &&
          !/^[A-Z][a-z]+\s[A-Z][a-z0-9]+\s[A-Z][a-z0-9]+/.test(currentName)) {
        return currentName;
      }

      // Check amenityId for mappings
      const lowerAmenityId = amenityId.toLowerCase();
      for (const [key, value] of Object.entries(enhancedMappings)) {
        if (lowerAmenityId.includes(key)) {
          return value;
        }
      }

      // Check current name for mappings
      const lowerCurrentName = currentName.toLowerCase();
      for (const [key, value] of Object.entries(enhancedMappings)) {
        if (lowerCurrentName.includes(key)) {
          return value;
        }
      }

      // Generate from amenityId patterns
      if (amenityId) {
        // Remove numbers and special chars
        const cleaned = amenityId
          .replace(/[0-9]+/g, '')
          .replace(/[^a-zA-Z\s]/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();

        if (cleaned.length > 2) {
          // Check cleaned version against mappings
          for (const [key, value] of Object.entries(enhancedMappings)) {
            if (cleaned.toLowerCase().includes(key)) {
              return value;
            }
          }

          // Capitalize first word as fallback
          const words = cleaned.split(' ').filter(w => w.length > 2);
          if (words.length > 0) {
            return `${words[0].charAt(0).toUpperCase() + words[0].slice(1)} Facility`;
          }
        }
      }

      return 'Premium Community Facility';
    };

    // Fetch all bookings for the community
    const bookingsRef = collection(db, 'bookings');
    const snapshot = await getDocs(bookingsRef);
    
    const batch = writeBatch(db);
    let updateCount = 0;
    const updates: any[] = [];

    for (const docSnap of snapshot.docs) {
      const data = docSnap.data();
      
      if (data.communityId === communityId) {
        const currentName = data.amenityName || '';
        const amenityId = data.amenityId || '';
        
        const properName = generateProperName(amenityId, currentName);
        
        if (properName !== currentName) {
          batch.update(docSnap.ref, {
            amenityName: properName,
            amenityType: 'general', // Will be inferred properly in the UI
            updatedAt: new Date(),
            migrationTimestamp: new Date()
          });

          updates.push({
            id: docSnap.id,
            oldName: currentName,
            newName: properName,
            amenityId: amenityId
          });

          updateCount++;

          // Firestore batch limit
          if (updateCount >= 400) {
            break;
          }
        }
      }
    }

    if (updateCount > 0) {
      await batch.commit();
      console.log(`✅ Successfully updated ${updateCount} booking amenity names`);
      
      return NextResponse.json({ 
        success: true, 
        message: `Successfully updated ${updateCount} booking amenity names`,
        updates: updates.slice(0, 10), // Show first 10 updates
        totalUpdated: updateCount
      });
    } else {
      return NextResponse.json({ 
        success: true, 
        message: 'No bookings needed updating',
        totalUpdated: 0
      });
    }

  } catch (error) {
    console.error('❌ Migration failed:', error);
    return NextResponse.json({ 
      error: 'Migration failed', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}