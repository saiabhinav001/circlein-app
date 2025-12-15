import { NextResponse } from 'next/server';
import { collection, getDocs, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

/**
 * AMENITY DATA MIGRATION API
 * Adds sample data (weather, directions, manager contact) to existing amenities
 * 
 * Access: GET https://circlein-app.vercel.app/api/admin/migrate-amenities
 */

export const dynamic = 'force-dynamic';

const AMENITY_SAMPLES: Record<string, any> = {
  'Swimming Pool': {
    isOutdoor: true,
    latitude: 40.7128,
    longitude: -74.0060,
    managerName: 'John Smith',
    managerPhone: '+1-555-123-4567',
    managerEmail: 'pool.manager@community.com',
    buildingName: 'Main Building',
    floorNumber: 'Ground Floor',
    directions: 'Exit the main lobby, turn right, and walk through the garden path to the pool area.',
    type: 'sports'
  },
  'Gym': {
    isOutdoor: false,
    latitude: 40.7128,
    longitude: -74.0060,
    managerName: 'Sarah Johnson',
    managerPhone: '+1-555-234-5678',
    managerEmail: 'gym.manager@community.com',
    buildingName: 'Tower A',
    floorNumber: '2nd Floor',
    directions: 'Take the elevator to the 2nd floor, turn left, and the gym is at the end of the hallway.',
    type: 'fitness'
  },
  'BBQ Area': {
    isOutdoor: true,
    latitude: 40.7130,
    longitude: -74.0062,
    managerName: 'Mike Davis',
    managerPhone: '+1-555-345-6789',
    managerEmail: 'bbq.manager@community.com',
    buildingName: 'Outdoor Recreation Area',
    floorNumber: 'Ground Level',
    directions: 'Walk past the swimming pool towards the back garden. The BBQ area is on the left side.',
    type: 'recreation'
  },
  'Tennis Court': {
    isOutdoor: true,
    latitude: 40.7132,
    longitude: -74.0058,
    managerName: 'Lisa Martinez',
    managerPhone: '+1-555-456-7890',
    managerEmail: 'tennis.manager@community.com',
    buildingName: 'Sports Complex',
    floorNumber: 'Ground Level',
    directions: 'Exit through the south gate and walk 100 meters towards the sports complex.',
    type: 'sports'
  },
  'Party Hall': {
    isOutdoor: false,
    latitude: 40.7129,
    longitude: -74.0061,
    managerName: 'Robert Wilson',
    managerPhone: '+1-555-567-8901',
    managerEmail: 'events.manager@community.com',
    buildingName: 'Club House',
    floorNumber: '1st Floor',
    directions: 'Enter the Club House and take the stairs to the 1st floor. The Party Hall is the large room on your right.',
    type: 'events'
  },
  'Conference Room': {
    isOutdoor: false,
    latitude: 40.7128,
    longitude: -74.0060,
    managerName: 'Emily Brown',
    managerPhone: '+1-555-678-9012',
    managerEmail: 'conference.manager@community.com',
    buildingName: 'Business Center',
    floorNumber: '3rd Floor',
    directions: 'Take the elevator to the 3rd floor of the Business Center. The conference room is immediately to your left.',
    type: 'business'
  }
};

export async function GET() {
  try {
    console.log('🔄 Starting amenity data migration...');
    
    const amenitiesRef = collection(db, 'amenities');
    const snapshot = await getDocs(amenitiesRef);
    
    const results = [];
    let updatedCount = 0;
    
    for (const amenityDoc of snapshot.docs) {
      const amenity = amenityDoc.data();
      const amenityName = amenity.name || amenity.title;
      
      // Find matching sample data
      const sampleData = AMENITY_SAMPLES[amenityName];
      
      if (sampleData) {
        await updateDoc(doc(db, 'amenities', amenityDoc.id), {
          ...sampleData,
          amenityLocation: {
            latitude: sampleData.latitude,
            longitude: sampleData.longitude
          },
          updatedAt: serverTimestamp()
        });
        
        results.push({ id: amenityDoc.id, name: amenityName, status: '✅ Updated' });
        updatedCount++;
      } else {
        results.push({ id: amenityDoc.id, name: amenityName, status: '⚠️ No sample data' });
      }
    }
    
    return NextResponse.json({
      success: true,
      message: `Migration complete! Updated ${updatedCount}/${snapshot.docs.length} amenities`,
      updated: updatedCount,
      total: snapshot.docs.length,
      results
    });
    
  } catch (error: any) {
    console.error('❌ Migration failed:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}
