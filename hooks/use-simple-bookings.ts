'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { 
  collection, 
  query, 
  where, 
  getDocs,
  doc, 
  getDoc,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

export interface SimpleBooking {
  id: string;
  userId: string;
  userEmail: string;
  userName?: string;
  communityId: string;
  amenityId: string;
  amenityName: string;
  amenityType: string;
  startTime: Date;
  endTime: Date;
  status: string;
  attendees: string[];
  createdAt: Date;
}

// Enhanced global cache with better management
const amenityCache = new Map<string, { name: string; type: string; timestamp: number }>();
const CACHE_DURATION = 15 * 60 * 1000; // 15 minutes cache for production

export function useSimpleBookings() {
  const { data: session } = useSession();
  const [bookings, setBookings] = useState<SimpleBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const activeUserEmail = session?.user?.email;
  const activeCommunityId = session?.user?.communityId || 'default-community';
  const isAdmin = session?.user?.role === 'admin' || session?.user?.role === 'super_admin';

  // PRODUCTION-READY: Advanced amenity name resolution
  const generateIntelligentName = (input: string): string => {
    if (!input || input === 'unknown' || input.length < 2) return 'Community Facility';
    
    // Step 1: Handle common exact matches first
    const exactMappings: { [key: string]: string } = {
      'pool': 'Swimming Pool',
      'gym': 'Fitness Center', 
      'tennis': 'Tennis Court',
      'basketball': 'Basketball Court',
      'clubhouse': 'Clubhouse',
      'spa': 'Spa & Wellness',
      'library': 'Community Library',
      'playground': 'Children\'s Playground',
      'parking': 'Parking Area',
      'garden': 'Community Garden',
      'rooftop': 'Rooftop Terrace',
      'lounge': 'Community Lounge',
      'theater': 'Community Theater',
      'kitchen': 'Community Kitchen',
      'study': 'Study Room',
      'game': 'Game Room',
      'conference': 'Conference Room',
      'meeting': 'Meeting Room',
      'party': 'Party Hall',
      'bbq': 'BBQ Area',
      'yoga': 'Yoga Studio',
      'dance': 'Dance Studio',
      'music': 'Music Room',
      'workshop': 'Workshop Space',
      'coworking': 'Coworking Space',
      'business': 'Business Center',
      'mailroom': 'Mail Room',
      'laundry': 'Laundry Room',
      'storage': 'Storage Area',
      'concierge': 'Concierge Desk',
      'reception': 'Reception Area'
    };

    // Step 2: Check for exact matches (case insensitive)
    const lowerInput = input.toLowerCase().trim();
    if (exactMappings[lowerInput]) {
      return exactMappings[lowerInput];
    }

    // Step 3: Check for partial matches in longer strings
    for (const [key, value] of Object.entries(exactMappings)) {
      if (lowerInput.includes(key) || key.includes(lowerInput)) {
        return value;
      }
    }

    // Step 4: Advanced pattern recognition for booking IDs
    // Handle patterns like "Nllela Cn2bqkur Rr04us" -> extract meaningful parts
    
    // Remove obvious random strings (3+ consecutive consonants, mixed case patterns)
    let cleaned = input
      .replace(/[0-9]+/g, '') // Remove numbers
      .replace(/[^a-zA-Z\s]/g, ' ') // Remove special chars
      .replace(/\b[bcdfghjklmnpqrstvwxyzBCDFGHJKLMNPQRSTVWXYZ]{3,}\b/g, '') // Remove consonant clusters
      .replace(/\s+/g, ' ') // Normalize spaces
      .trim();

    // Step 5: Look for recognizable words in the cleaned string
    const recognizableWords = [
      'pool', 'swim', 'water', 'aqua',
      'gym', 'fitness', 'exercise', 'workout',
      'tennis', 'court', 'sport', 'game',
      'club', 'house', 'hall', 'room',
      'spa', 'wellness', 'relax', 'sauna',
      'library', 'book', 'study', 'read',
      'play', 'kids', 'child', 'playground',
      'park', 'garden', 'green', 'outdoor',
      'roof', 'top', 'terrace', 'deck',
      'lounge', 'social', 'community', 'common',
      'theater', 'cinema', 'movie', 'screen',
      'kitchen', 'cook', 'dining', 'food',
      'meeting', 'conference', 'business', 'office',
      'party', 'event', 'celebration', 'banquet',
      'bbq', 'grill', 'barbecue', 'outdoor',
      'yoga', 'pilates', 'meditation', 'zen',
      'dance', 'music', 'art', 'creative',
      'work', 'co-work', 'desk', 'space'
    ];

    for (const word of recognizableWords) {
      if (cleaned.toLowerCase().includes(word)) {
        return exactMappings[word] || exactMappings[word.substring(0, word.length - 1)] || `${word.charAt(0).toUpperCase() + word.slice(1)} Area`;
      }
    }

    // Step 6: Try to extract first meaningful word and capitalize it
    const words = cleaned.split(' ').filter(word => word.length > 2 && word.length < 15);
    if (words.length > 0) {
      const firstWord = words[0].toLowerCase();
      // Check if it matches any of our mappings
      for (const [key, value] of Object.entries(exactMappings)) {
        if (firstWord.includes(key) || key.includes(firstWord)) {
          return value;
        }
      }
      // Return capitalized first word as fallback
      return `${firstWord.charAt(0).toUpperCase() + firstWord.slice(1)} Facility`;
    }

    // Step 7: Ultimate fallback - try to make sense of the original
    if (input.length > 20) {
      // Very long strings are likely booking IDs, use generic name
      return 'Premium Community Facility';
    }

    // Final fallback
    return 'Community Amenity';
  };

  // PRODUCTION-READY: Smart type inference
  const inferFacilityType = (name: string, amenityId: string = ''): string => {
    const combined = `${name} ${amenityId}`.toLowerCase();
    
    if (combined.includes('pool') || combined.includes('swim') || combined.includes('water')) return 'recreation';
    if (combined.includes('gym') || combined.includes('fitness') || combined.includes('workout')) return 'fitness';
    if (combined.includes('tennis') || combined.includes('basketball') || combined.includes('court') || combined.includes('sport')) return 'sports';
    if (combined.includes('meeting') || combined.includes('conference') || combined.includes('business') || combined.includes('office')) return 'business';
    if (combined.includes('party') || combined.includes('event') || combined.includes('hall') || combined.includes('banquet')) return 'events';
    if (combined.includes('club') || combined.includes('lounge') || combined.includes('social') || combined.includes('community')) return 'social';
    if (combined.includes('spa') || combined.includes('wellness') || combined.includes('yoga') || combined.includes('meditation')) return 'wellness';
    if (combined.includes('theater') || combined.includes('cinema') || combined.includes('entertainment')) return 'entertainment';
    if (combined.includes('kitchen') || combined.includes('dining') || combined.includes('food')) return 'dining';
    if (combined.includes('library') || combined.includes('study') || combined.includes('read')) return 'education';
    if (combined.includes('playground') || combined.includes('kids') || combined.includes('children')) return 'family';
    
    return 'general';
  };

  // PRODUCTION-READY: Enhanced amenity details with multiple fallback strategies
  const getEnhancedAmenityDetails = async (amenityId: string, existingName?: string): Promise<{ name: string; type: string }> => {
    // Strategy 1: Use existing good name if available
    if (existingName && 
        existingName !== 'Community Facility' && 
        existingName.length > 2 && 
        existingName.length < 50 &&
        !existingName.includes('undefined') &&
        !/^[A-Za-z0-9\s]{3,}[0-9]{3,}/.test(existingName) && // Not like "abc123def456"
        !/^[A-Z][a-z]+\s[A-Z][a-z0-9]+\s[A-Z][a-z0-9]+/.test(existingName)) { // Not like "Abc Def123 Ghi456"
      
      return {
        name: existingName,
        type: inferFacilityType(existingName, amenityId)
      };
    }

    // Strategy 2: Check cache
    const cacheKey = `${activeCommunityId}-${amenityId}`;
    const cached = amenityCache.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION) {
      return { name: cached.name, type: cached.type };
    }

    // Strategy 3: Try Firestore lookup (async, don't block UI)
    try {
      const amenityRef = doc(db, 'communities', activeCommunityId, 'amenities', amenityId);
      const amenitySnap = await getDoc(amenityRef);
      
      if (amenitySnap.exists()) {
        const data = amenitySnap.data();
        const firestoreName = data.name || data.title;
        
        if (firestoreName && firestoreName.length > 2 && firestoreName.length < 50) {
          const result = {
            name: firestoreName,
            type: data.type || data.category || inferFacilityType(firestoreName, amenityId)
          };
          
          // Cache the good result
          amenityCache.set(cacheKey, {
            ...result,
            timestamp: Date.now()
          });
          
          return result;
        }
      }
    } catch (error) {
      console.log('Firestore amenity fetch failed:', error);
    }

    // Strategy 4: Generate intelligent name from amenityId
    const intelligentName = generateIntelligentName(amenityId);
    const intelligentType = inferFacilityType(intelligentName, amenityId);
    
    // Cache the intelligent result
    amenityCache.set(cacheKey, {
      name: intelligentName,
      type: intelligentType,
      timestamp: Date.now()
    });

    return { name: intelligentName, type: intelligentType };
  };

  const fetchBookings = useCallback(async () => {
    if (!activeUserEmail) {
      setLoading(false);
      setError('User not authenticated');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      let bookingDocs: any[] = [];

      if (isAdmin) {
        // Admin: fetch all bookings in community
        const adminQuery = query(
          collection(db, 'bookings'),
          where('communityId', '==', activeCommunityId)
        );
        const adminSnapshot = await getDocs(adminQuery);
        bookingDocs = adminSnapshot.docs;
      } else {
        // Regular user: fetch user's bookings with multiple strategies
        try {
          const userIdQuery = query(
            collection(db, 'bookings'),
            where('userId', '==', activeUserEmail),
            where('communityId', '==', activeCommunityId)
          );
          const userIdSnapshot = await getDocs(userIdQuery);
          bookingDocs = userIdSnapshot.docs;
        } catch (error) {
          console.log('userId query failed, trying userEmail...');
        }
        
        // Fallback to userEmail field
        if (bookingDocs.length === 0) {
          try {
            const userEmailQuery = query(
              collection(db, 'bookings'),
              where('userEmail', '==', activeUserEmail),
              where('communityId', '==', activeCommunityId)
            );
            const userEmailSnapshot = await getDocs(userEmailQuery);
            bookingDocs = userEmailSnapshot.docs;
          } catch (error) {
            console.log('userEmail query also failed');
          }
        }
      }

      // PRODUCTION-READY: Process bookings with enhanced amenity resolution
      const bookingsData: SimpleBooking[] = [];

      // Process all bookings with enhanced amenity name resolution
      for (const bookingDoc of bookingDocs) {
        const bookingData = bookingDoc.data();
        
        // Handle timestamp conversion safely
        let startTime, endTime;
        try {
          startTime = bookingData.startTime?.toDate ? bookingData.startTime.toDate() : new Date(bookingData.startTime);
          endTime = bookingData.endTime?.toDate ? bookingData.endTime.toDate() : new Date(bookingData.endTime);
        } catch (timeError) {
          console.warn('Time conversion error:', timeError);
          startTime = new Date();
          endTime = new Date();
        }

        // CRITICAL: Enhanced amenity details resolution
        const amenityDetails = await getEnhancedAmenityDetails(
          bookingData.amenityId || 'unknown',
          bookingData.amenityName
        );

        const booking: SimpleBooking = {
          id: bookingDoc.id,
          userId: bookingData.userId || bookingData.userEmail || activeUserEmail,
          userEmail: bookingData.userEmail || bookingData.userId || activeUserEmail,
          userName: bookingData.userName || activeUserEmail?.split('@')[0] || 'User',
          communityId: bookingData.communityId || activeCommunityId,
          amenityId: bookingData.amenityId || 'unknown',
          amenityName: amenityDetails.name,
          amenityType: amenityDetails.type,
          startTime,
          endTime,
          status: bookingData.status || 'confirmed',
          attendees: bookingData.attendees || [activeUserEmail || ''],
          createdAt: bookingData.createdAt?.toDate ? bookingData.createdAt.toDate() : new Date()
        };

        bookingsData.push(booking);
      }

      // Sort by creation date (most recent first)
      bookingsData.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      
      setBookings(bookingsData);
      setLoading(false);

    } catch (err) {
      console.error('Error fetching bookings:', err);
      setError('Failed to load bookings');
      setLoading(false);
    }
  }, [activeUserEmail, activeCommunityId, isAdmin]);

  // Stable refetch function that works in production
  const refetch = useCallback(async () => {
    await fetchBookings();
  }, [fetchBookings]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  return {
    bookings,
    loading,
    error,
    refetch
  };
}