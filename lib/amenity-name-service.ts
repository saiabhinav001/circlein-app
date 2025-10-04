'use client';

import { doc, getDoc, collection, getDocs, updateDoc, writeBatch } from 'firebase/firestore';
import { db } from '@/lib/firebase';

// Production-ready amenity name service
export class AmenityNameService {
  private static cache = new Map<string, { name: string; type: string; timestamp: number }>();
  private static readonly CACHE_DURATION = 15 * 60 * 1000; // 15 minutes

  // Master facility mappings for production use
  private static readonly FACILITY_MAPPINGS: { [key: string]: string } = {
    // Swimming & Water
    'pool': 'Swimming Pool',
    'swim': 'Swimming Pool',
    'swimming': 'Swimming Pool',
    'water': 'Water Activities',
    'aqua': 'Aquatic Center',
    'jacuzzi': 'Jacuzzi',
    'spa-pool': 'Spa Pool',
    'hot-tub': 'Hot Tub',

    // Fitness & Gym
    'gym': 'Fitness Center',
    'fitness': 'Fitness Center',
    'exercise': 'Exercise Room',
    'workout': 'Workout Area',
    'cardio': 'Cardio Center',
    'weights': 'Weight Training',
    'crossfit': 'CrossFit Box',
    'pilates': 'Pilates Studio',
    'yoga': 'Yoga Studio',
    'aerobics': 'Aerobics Studio',
    'spinning': 'Spinning Room',

    // Sports Courts
    'tennis': 'Tennis Court',
    'basketball': 'Basketball Court',
    'volleyball': 'Volleyball Court',
    'badminton': 'Badminton Court',
    'squash': 'Squash Court',
    'racquetball': 'Racquetball Court',
    'court': 'Sports Court',
    'sports': 'Sports Facility',

    // Social & Community
    'clubhouse': 'Clubhouse',
    'club': 'Clubhouse',
    'lounge': 'Community Lounge',
    'social': 'Social Area',
    'community': 'Community Center',
    'common': 'Common Area',
    'lobby': 'Lobby Area',
    'reception': 'Reception Area',

    // Meeting & Business
    'meeting': 'Meeting Room',
    'conference': 'Conference Room',
    'boardroom': 'Boardroom',
    'office': 'Office Space',
    'business': 'Business Center',
    'coworking': 'Coworking Space',
    'study': 'Study Room',
    'library': 'Community Library',

    // Entertainment
    'theater': 'Community Theater',
    'theatre': 'Community Theatre',
    'cinema': 'Private Cinema',
    'movie': 'Movie Room',
    'gaming': 'Gaming Lounge',
    'game': 'Game Room',
    'billiards': 'Billiards Room',
    'pool-table': 'Pool Table Room',
    'arcade': 'Arcade Room',

    // Events & Parties
    'party': 'Party Hall',
    'event': 'Event Hall',
    'banquet': 'Banquet Hall',
    'celebration': 'Celebration Hall',
    'wedding': 'Wedding Venue',
    'multipurpose': 'Multipurpose Hall',

    // Outdoor & Recreation
    'playground': 'Children\'s Playground',
    'kids': 'Kids Play Area',
    'children': 'Children\'s Area',
    'park': 'Community Park',
    'garden': 'Community Garden',
    'bbq': 'BBQ Area',
    'barbecue': 'BBQ Area',
    'grill': 'Grilling Area',
    'picnic': 'Picnic Area',
    'outdoor': 'Outdoor Recreation',
    'rooftop': 'Rooftop Terrace',
    'terrace': 'Terrace',
    'deck': 'Deck Area',
    'patio': 'Patio',

    // Dining & Kitchen
    'kitchen': 'Community Kitchen',
    'dining': 'Dining Hall',
    'restaurant': 'Community Restaurant',
    'cafe': 'Community Cafe',
    'bar': 'Community Bar',
    'food': 'Food Area',

    // Wellness & Spa
    'spa': 'Spa & Wellness',
    'wellness': 'Wellness Center',
    'sauna': 'Sauna',
    'steam': 'Steam Room',
    'massage': 'Massage Room',
    'meditation': 'Meditation Room',
    'zen': 'Zen Garden',

    // Creative & Arts
    'art': 'Art Studio',
    'music': 'Music Room',
    'dance': 'Dance Studio',
    'creative': 'Creative Studio',
    'workshop': 'Workshop Space',
    'maker': 'Maker Space',
    'craft': 'Craft Room',

    // Utility & Services
    'parking': 'Parking Area',
    'garage': 'Garage',
    'storage': 'Storage Area',
    'laundry': 'Laundry Room',
    'mailroom': 'Mail Room',
    'mail': 'Mail Area',
    'concierge': 'Concierge Desk',
    'security': 'Security Office',
    'maintenance': 'Maintenance Room'
  };

  /**
   * PRODUCTION-READY: Generate intelligent amenity name
   */
  static generateIntelligentName(input: string): string {
    if (!input || input === 'unknown' || input.length < 2) {
      return 'Community Facility';
    }

    // Clean the input
    const cleaned = input
      .toLowerCase()
      .trim()
      .replace(/[0-9]+/g, '') // Remove numbers
      .replace(/[^a-zA-Z\s]/g, ' ') // Replace special chars with spaces
      .replace(/\s+/g, ' ') // Normalize spaces
      .trim();

    // Check for direct matches
    for (const [key, value] of Object.entries(this.FACILITY_MAPPINGS)) {
      if (cleaned.includes(key) || key.includes(cleaned)) {
        return value;
      }
    }

    // Try to extract meaningful words
    const words = cleaned.split(' ').filter(word => word.length > 2);
    
    for (const word of words) {
      for (const [key, value] of Object.entries(this.FACILITY_MAPPINGS)) {
        if (word.includes(key) || key.includes(word)) {
          return value;
        }
      }
    }

    // If input looks like a booking ID (long, random), use generic name
    if (input.length > 15 || /^[A-Z][a-z]+\s[A-Z][a-z0-9]+\s[A-Z][a-z0-9]+/.test(input)) {
      return 'Premium Community Facility';
    }

    // Try to capitalize first meaningful word
    if (words.length > 0) {
      const firstWord = words[0];
      return `${firstWord.charAt(0).toUpperCase() + firstWord.slice(1)} Facility`;
    }

    return 'Community Amenity';
  }

  /**
   * PRODUCTION-READY: Get amenity details with caching
   */
  static async getAmenityDetails(
    amenityId: string, 
    communityId: string, 
    existingName?: string
  ): Promise<{ name: string; type: string }> {
    
    // Check cache first
    const cacheKey = `${communityId}-${amenityId}`;
    const cached = this.cache.get(cacheKey);
    
    if (cached && (Date.now() - cached.timestamp) < this.CACHE_DURATION) {
      return { name: cached.name, type: cached.type };
    }

    // If existing name is good, use it
    if (this.isGoodAmenityName(existingName)) {
      const result = {
        name: existingName!,
        type: this.inferType(existingName!, amenityId)
      };
      
      this.cache.set(cacheKey, { ...result, timestamp: Date.now() });
      return result;
    }

    // Try Firestore lookup
    try {
      const amenityRef = doc(db, 'communities', communityId, 'amenities', amenityId);
      const amenitySnap = await getDoc(amenityRef);
      
      if (amenitySnap.exists()) {
        const data = amenitySnap.data();
        const firestoreName = data.name || data.title;
        
        if (this.isGoodAmenityName(firestoreName)) {
          const result = {
            name: firestoreName,
            type: data.type || data.category || this.inferType(firestoreName, amenityId)
          };
          
          this.cache.set(cacheKey, { ...result, timestamp: Date.now() });
          return result;
        }
      }
    } catch (error) {
      console.log('Firestore lookup failed:', error);
    }

    // Generate intelligent name as fallback
    const intelligentName = this.generateIntelligentName(amenityId);
    const intelligentType = this.inferType(intelligentName, amenityId);
    
    const result = {
      name: intelligentName,
      type: intelligentType
    };
    
    this.cache.set(cacheKey, { ...result, timestamp: Date.now() });
    return result;
  }

  /**
   * Check if an amenity name is good quality
   */
  private static isGoodAmenityName(name?: string): boolean {
    if (!name || name.length < 3 || name.length > 50) return false;
    if (name.includes('undefined') || name === 'Community Facility') return false;
    if (/^[A-Za-z0-9\s]{3,}[0-9]{3,}/.test(name)) return false; // Looks like ID
    if (/^[A-Z][a-z]+\s[A-Z][a-z0-9]+\s[A-Z][a-z0-9]+/.test(name)) return false; // Booking ID pattern
    return true;
  }

  /**
   * Infer facility type from name and ID
   */
  private static inferType(name: string, amenityId: string = ''): string {
    const combined = `${name} ${amenityId}`.toLowerCase();
    
    if (combined.includes('pool') || combined.includes('swim') || combined.includes('water')) return 'recreation';
    if (combined.includes('gym') || combined.includes('fitness') || combined.includes('workout')) return 'fitness';
    if (combined.includes('tennis') || combined.includes('basketball') || combined.includes('court') || combined.includes('sport')) return 'sports';
    if (combined.includes('meeting') || combined.includes('conference') || combined.includes('business')) return 'business';
    if (combined.includes('party') || combined.includes('event') || combined.includes('hall')) return 'events';
    if (combined.includes('club') || combined.includes('lounge') || combined.includes('social')) return 'social';
    if (combined.includes('spa') || combined.includes('wellness') || combined.includes('yoga')) return 'wellness';
    if (combined.includes('theater') || combined.includes('cinema') || combined.includes('entertainment')) return 'entertainment';
    if (combined.includes('kitchen') || combined.includes('dining') || combined.includes('food')) return 'dining';
    if (combined.includes('library') || combined.includes('study') || combined.includes('education')) return 'education';
    if (combined.includes('playground') || combined.includes('kids') || combined.includes('children')) return 'family';
    
    return 'general';
  }

  /**
   * PRODUCTION-READY: Batch update booking amenity names
   */
  static async updateBookingAmenityNames(communityId: string): Promise<void> {
    try {
      const bookingsRef = collection(db, 'bookings');
      const snapshot = await getDocs(bookingsRef);
      
      const batch = writeBatch(db);
      let updateCount = 0;

      for (const doc of snapshot.docs) {
        const data = doc.data();
        
        if (data.communityId === communityId && !this.isGoodAmenityName(data.amenityName)) {
          const amenityDetails = await this.getAmenityDetails(
            data.amenityId || 'unknown',
            communityId,
            data.amenityName
          );

          batch.update(doc.ref, {
            amenityName: amenityDetails.name,
            amenityType: amenityDetails.type,
            updatedAt: new Date()
          });

          updateCount++;
          
          // Firestore batch limit is 500
          if (updateCount >= 400) {
            await batch.commit();
            console.log(`Updated ${updateCount} booking amenity names`);
            return;
          }
        }
      }

      if (updateCount > 0) {
        await batch.commit();
        console.log(`Updated ${updateCount} booking amenity names`);
      }

    } catch (error) {
      console.error('Failed to update booking amenity names:', error);
    }
  }

  /**
   * Clear cache (useful for testing)
   */
  static clearCache(): void {
    this.cache.clear();
  }
}