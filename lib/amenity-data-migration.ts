/**
 * SAMPLE AMENITY DATA MIGRATION SCRIPT
 * Run this to add all required fields to existing amenities
 * 
 * Usage: Call from browser console or create an API route
 */

import { collection, getDocs, updateDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export interface AmenitySampleData {
  isOutdoor?: boolean;
  latitude?: number;
  longitude?: number;
  managerName?: string;
  managerPhone?: string;
  managerEmail?: string;
  buildingName?: string;
  floorNumber?: string;
  directions?: string;
}

// Sample data for common amenities
export const AMENITY_SAMPLES: Record<string, AmenitySampleData> = {
  'Swimming Pool': {
    isOutdoor: true,
    latitude: 40.7128,  // Replace with your actual coordinates
    longitude: -74.0060,
    managerName: 'John Smith',
    managerPhone: '+1-555-123-4567',
    managerEmail: 'pool.manager@community.com',
    buildingName: 'Main Building',
    floorNumber: 'Ground Floor',
    directions: 'Exit the main lobby, turn right, and walk through the garden path to the pool area.'
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
    directions: 'Take the elevator to the 2nd floor, turn left, and the gym is at the end of the hallway.'
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
    directions: 'Walk past the swimming pool towards the back garden. The BBQ area is on the left side.'
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
    directions: 'Exit through the south gate and walk 100 meters towards the sports complex.'
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
    directions: 'Enter the Club House and take the stairs to the 1st floor. The Party Hall is the large room on your right.'
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
    directions: 'Take the elevator to the 3rd floor of the Business Center. The conference room is immediately to your left.'
  }
};

export async function migrateAmenityData() {
  try {
    console.log('🔄 Starting amenity data migration...');
    
    const amenitiesRef = collection(db, 'amenities');
    const snapshot = await getDocs(amenitiesRef);
    
    let updatedCount = 0;
    
    for (const amenityDoc of snapshot.docs) {
      const amenity = amenityDoc.data();
      const amenityName = amenity.name || amenity.title;
      
      // Find matching sample data
      const sampleData = AMENITY_SAMPLES[amenityName];
      
      if (sampleData) {
        await updateDoc(doc(db, 'amenities', amenityDoc.id), {
          ...sampleData,
          amenityLocation: sampleData.latitude && sampleData.longitude ? {
            latitude: sampleData.latitude,
            longitude: sampleData.longitude
          } : null,
          updatedAt: new Date()
        });
        
        console.log(`✅ Updated: ${amenityName}`);
        updatedCount++;
      } else {
        console.log(`⚠️  No sample data for: ${amenityName}`);
      }
    }
    
    console.log(`✅ Migration complete! Updated ${updatedCount}/${snapshot.docs.length} amenities`);
    return { success: true, updated: updatedCount, total: snapshot.docs.length };
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    return { success: false, error };
  }
}
