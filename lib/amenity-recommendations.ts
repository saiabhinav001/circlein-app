import { collection, query, where, getDocs, limit, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';

/**
 * AMENITY RECOMMENDATION SERVICE
 * Suggests related amenities based on booking history and amenity type
 */

interface AmenityRecommendation {
  id: string;
  name: string;
  type: string;
  description?: string;
  reason: string;
}

interface AmenityDoc {
  id: string;
  name?: string;
  title?: string;
  category?: string;
  communityId?: string;
  timeSlots?: string[];
  weekdaySlots?: string[];
  weekendSlots?: string[];
  booking?: {
    slotDuration?: number;
  };
  operatingHours?: {
    start: string;
    end: string;
  };
  weekdayHours?: {
    start: string;
    end: string;
  };
  weekendHours?: {
    start: string;
    end: string;
  };
}

interface BookingDoc {
  amenityId?: string;
  amenityName?: string;
  amenityType?: string;
  startTime?: any;
  status?: string;
  userId?: string;
  communityId?: string;
}

export interface SmartBookingSuggestion {
  id: string;
  type: 'habit' | 'opportunity';
  amenityId: string;
  amenityName: string;
  selectedDate: string;
  selectedSlot: string;
  confidence: number;
  reason: string;
  text: string;
}

interface HabitPattern {
  amenityId: string;
  amenityName: string;
  dayOfWeek: number;
  preferredHour: number;
  count: number;
}

export async function getRelatedAmenities(
  currentAmenityType: string,
  userId: string,
  communityId: string,
  maxResults: number = 3
): Promise<AmenityRecommendation[]> {
  try {
    const recommendations: AmenityRecommendation[] = [];

    // Get user's booking history
    const bookingsQuery = query(
      collection(db, 'bookings'),
      where('userId', '==', userId),
      where('communityId', '==', communityId),
      where('status', '==', 'completed'),
      orderBy('createdAt', 'desc'),
      limit(20)
    );

    const bookingsSnap = await getDocs(bookingsQuery);
    const bookedAmenityTypes = new Set(
      bookingsSnap.docs.map(doc => doc.data().amenityType?.toLowerCase())
    );

    // Rule-based recommendations
    const relatedTypes = getRelatedAmenityTypes(currentAmenityType);

    // Get amenities from related types
    const amenitiesQuery = query(
      collection(db, 'communities', communityId, 'amenities'),
      where('category', 'in', relatedTypes),
      limit(10)
    );

    const amenitiesSnap = await getDocs(amenitiesQuery);

    for (const amenityDoc of amenitiesSnap.docs) {
      const amenity = amenityDoc.data();
      const amenityType = amenity.category?.toLowerCase();

      // Skip if already booked frequently
      if (bookedAmenityTypes.has(amenityType)) {
        continue;
      }

      recommendations.push({
        id: amenityDoc.id,
        name: amenity.name || amenity.title,
        type: amenity.category,
        description: amenity.description,
        reason: getRecommendationReason(currentAmenityType, amenity.category)
      });

      if (recommendations.length >= maxResults) {
        break;
      }
    }

    return recommendations;
  } catch (error) {
    console.error('Error getting recommendations:', error);
    return [];
  }
}

function getRelatedAmenityTypes(amenityType: string): string[] {
  const type = amenityType.toLowerCase();

  const relatedMap: { [key: string]: string[] } = {
    'gym': ['yoga', 'fitness', 'pool', 'sports'],
    'pool': ['gym', 'spa', 'sauna', 'jacuzzi'],
    'tennis': ['basketball', 'sports', 'gym', 'squash'],
    'basketball': ['tennis', 'sports', 'gym', 'volleyball'],
    'yoga': ['gym', 'meditation', 'spa', 'wellness'],
    'spa': ['yoga', 'pool', 'sauna', 'wellness'],
    'bbq': ['rooftop', 'garden', 'party hall', 'outdoor'],
    'party hall': ['bbq', 'clubhouse', 'kitchen', 'dining'],
    'study': ['library', 'coworking', 'meeting room', 'business center'],
    'library': ['study', 'reading room', 'quiet room', 'coworking'],
    'playground': ['garden', 'outdoor', 'sports', 'kids area'],
    'clubhouse': ['party hall', 'lounge', 'meeting room', 'social'],
    'rooftop': ['bbq', 'garden', 'lounge', 'outdoor'],
    'coworking': ['study', 'meeting room', 'business center', 'library'],
    'meeting room': ['coworking', 'conference', 'business center', 'study']
  };

  // Find best match
  for (const [key, related] of Object.entries(relatedMap)) {
    if (type.includes(key)) {
      return related;
    }
  }

  // Default fallback
  return ['clubhouse', 'lounge', 'social'];
}

function getRecommendationReason(currentType: string, recommendedType: string): string {
  const type = currentType.toLowerCase();
  const rec = recommendedType.toLowerCase();

  const reasonMap: { [key: string]: string } = {
    'gym_yoga': 'Perfect for post-workout recovery and flexibility',
    'gym_pool': 'Great for cooling down after an intense workout',
    'pool_spa': 'Ideal combination for relaxation after swimming',
    'tennis_basketball': 'Similar high-energy sports you might enjoy',
    'bbq_rooftop': 'Great views to complement your outdoor gathering',
    'study_library': 'Quiet spaces for focused work',
    'clubhouse_party hall': 'Perfect for hosting larger events',
    'coworking_meeting room': 'Professional spaces for your work needs'
  };

  const key = `${type}_${rec}`;
  
  if (reasonMap[key]) {
    return reasonMap[key];
  }

  // Generic reasons
  if (rec.includes('social') || rec.includes('lounge')) {
    return 'Perfect for socializing with neighbors';
  }
  if (rec.includes('outdoor') || rec.includes('garden')) {
    return 'Enjoy the fresh air and outdoor space';
  }
  if (rec.includes('fitness') || rec.includes('sports')) {
    return 'Stay active with varied activities';
  }

  return 'Popular choice among residents';
}

export function generateRecommendationsHTML(recommendations: AmenityRecommendation[]): string {
  if (recommendations.length === 0) {
    return '';
  }

  return `
    <div style="background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); border-left: 4px solid #22c55e; padding: 25px; border-radius: 12px; margin: 25px 0;">
      <h3 style="color: #166534; font-size: 18px; font-weight: 700; margin-bottom: 15px;">
        💡 You Might Also Like
      </h3>
      ${recommendations.map(rec => `
        <div style="background: white; padding: 15px; border-radius: 8px; margin-bottom: 12px; border: 1px solid #bbf7d0;">
          <div style="font-weight: 600; color: #15803d; font-size: 16px; margin-bottom: 5px;">
            ${rec.name}
          </div>
          <div style="color: #166534; font-size: 14px; margin-bottom: 5px;">
            ${rec.reason}
          </div>
          ${rec.description ? `
            <div style="color: #4d7c0f; font-size: 13px; font-style: italic;">
              ${rec.description}
            </div>
          ` : ''}
        </div>
      `).join('')}
      <div style="text-align: center; margin-top: 15px;">
        <a href="https://circlein-app.vercel.app/dashboard" style="display: inline-block; padding: 12px 24px; background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); color: white; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 14px;">
          Browse All Amenities
        </a>
      </div>
    </div>
  `;
}

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function toDate(value: any): Date | null {
  if (!value) {
    return null;
  }

  if (value instanceof Date) {
    return value;
  }

  if (typeof value?.toDate === 'function') {
    return value.toDate();
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function formatHour(hour: number): string {
  const clamped = Math.max(0, Math.min(23, hour));
  const suffix = clamped >= 12 ? 'PM' : 'AM';
  const twelveHour = clamped % 12 === 0 ? 12 : clamped % 12;
  return `${twelveHour} ${suffix}`;
}

function toISODate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function parseHourFromSlot(slot: string): number | null {
  const [start] = slot.split('-');
  if (!start) {
    return null;
  }
  const hour = Number(start.split(':')[0]);
  if (Number.isNaN(hour)) {
    return null;
  }
  return hour;
}

function generateTimeSlots(startHour: string, endHour: string, durationHours: number): string[] {
  const [startH, startM] = startHour.split(':').map(Number);
  const [endH, endM] = endHour.split(':').map(Number);
  const slotDurationMinutes = Math.max(30, Math.round((durationHours || 1) * 60));

  let currentMinutes = startH * 60 + (startM || 0);
  const endMinutes = endH * 60 + (endM || 0);
  const slots: string[] = [];

  while (currentMinutes + slotDurationMinutes <= endMinutes) {
    const slotStartHour = Math.floor(currentMinutes / 60);
    const slotStartMinute = currentMinutes % 60;
    const slotEndMinutes = currentMinutes + slotDurationMinutes;
    const slotEndHour = Math.floor(slotEndMinutes / 60);
    const slotEndMinute = slotEndMinutes % 60;

    slots.push(
      `${String(slotStartHour).padStart(2, '0')}:${String(slotStartMinute).padStart(2, '0')}-${String(slotEndHour).padStart(2, '0')}:${String(slotEndMinute).padStart(2, '0')}`
    );

    currentMinutes += slotDurationMinutes;
  }

  return slots;
}

function getAmenitySlotsForDate(amenity: AmenityDoc, targetDate: Date): string[] {
  const day = targetDate.getDay();
  const isWeekend = day === 0 || day === 6;

  if (isWeekend && amenity.weekendSlots?.length) {
    return amenity.weekendSlots;
  }

  if (!isWeekend && amenity.weekdaySlots?.length) {
    return amenity.weekdaySlots;
  }

  if (amenity.timeSlots?.length) {
    return amenity.timeSlots;
  }

  const duration = amenity.booking?.slotDuration || 1;

  if (isWeekend && amenity.weekendHours) {
    return generateTimeSlots(amenity.weekendHours.start, amenity.weekendHours.end, duration);
  }

  if (!isWeekend && amenity.weekdayHours) {
    return generateTimeSlots(amenity.weekdayHours.start, amenity.weekdayHours.end, duration);
  }

  if (amenity.operatingHours) {
    return generateTimeSlots(amenity.operatingHours.start, amenity.operatingHours.end, duration);
  }

  return [];
}

function getNextDateForDay(dayOfWeek: number): Date {
  const now = new Date();
  const result = new Date(now);
  const current = now.getDay();
  let diff = (dayOfWeek - current + 7) % 7;
  if (diff === 0) {
    diff = 7;
  }
  result.setDate(now.getDate() + diff);
  result.setHours(0, 0, 0, 0);
  return result;
}

function pickClosestSlot(slots: string[], targetHour: number): string | null {
  if (!slots.length) {
    return null;
  }

  let bestSlot = slots[0];
  let bestDiff = Number.POSITIVE_INFINITY;

  for (const slot of slots) {
    const hour = parseHourFromSlot(slot);
    if (hour === null) {
      continue;
    }

    const diff = Math.abs(hour - targetHour);
    if (diff < bestDiff) {
      bestDiff = diff;
      bestSlot = slot;
    }
  }

  return bestSlot;
}

function buildHabitPatterns(bookings: BookingDoc[]): HabitPattern[] {
  const counter = new Map<string, HabitPattern>();

  for (const booking of bookings) {
    const amenityId = booking.amenityId;
    const amenityName = booking.amenityName || 'Amenity';
    const start = toDate(booking.startTime);

    if (!amenityId || !start) {
      continue;
    }

    const key = `${amenityId}_${start.getDay()}_${start.getHours()}`;
    const existing = counter.get(key);

    if (existing) {
      existing.count += 1;
      continue;
    }

    counter.set(key, {
      amenityId,
      amenityName,
      dayOfWeek: start.getDay(),
      preferredHour: start.getHours(),
      count: 1,
    });
  }

  return Array.from(counter.values())
    .filter((item) => item.count >= 2)
    .sort((a, b) => b.count - a.count);
}

function buildCommunityCrowdMap(bookings: BookingDoc[]): Map<string, number> {
  const crowd = new Map<string, number>();

  for (const booking of bookings) {
    const amenityId = booking.amenityId;
    const start = toDate(booking.startTime);
    if (!amenityId || !start) {
      continue;
    }

    const key = `${amenityId}_${start.getHours()}`;
    crowd.set(key, (crowd.get(key) || 0) + 1);
  }

  return crowd;
}

function formatHabitSuggestionText(pattern: HabitPattern): string {
  return `Based on your history, you usually book ${pattern.amenityName} on ${DAY_NAMES[pattern.dayOfWeek]}s around ${formatHour(pattern.preferredHour)}. Want to book it now?`;
}

function formatOpportunitySuggestionText(amenityName: string, hour: number): string {
  return `${amenityName} is usually quieter around ${formatHour(hour)} - great time to go.`;
}

export async function getSmartBookingSuggestions(
  userEmail: string,
  communityId: string,
  maxResults: number = 2
): Promise<SmartBookingSuggestion[]> {
  try {
    const [userBookingsByIdSnap, userBookingsByEmailSnap, communityBookingsSnap, amenitiesSnap] = await Promise.all([
      getDocs(
        query(
          collection(db, 'bookings'),
          where('userId', '==', userEmail),
          where('communityId', '==', communityId),
          limit(120)
        )
      ),
      getDocs(
        query(
          collection(db, 'bookings'),
          where('userEmail', '==', userEmail),
          where('communityId', '==', communityId),
          limit(120)
        )
      ),
      getDocs(
        query(
          collection(db, 'bookings'),
          where('communityId', '==', communityId),
          limit(300)
        )
      ),
      getDocs(
        query(
          collection(db, 'amenities'),
          where('communityId', '==', communityId),
          limit(150)
        )
      ),
    ]);

    const userBookingMap = new Map<string, BookingDoc>();
    userBookingsByIdSnap.docs.forEach((docSnapshot) => {
      userBookingMap.set(docSnapshot.id, docSnapshot.data() as BookingDoc);
    });
    userBookingsByEmailSnap.docs.forEach((docSnapshot) => {
      userBookingMap.set(docSnapshot.id, docSnapshot.data() as BookingDoc);
    });

    const userBookings = Array.from(userBookingMap.values())
      .filter((booking) => ['confirmed', 'completed'].includes(String(booking.status || '')));
    const communityBookings = communityBookingsSnap.docs
      .map((d) => d.data() as BookingDoc)
      .filter((booking) => ['confirmed', 'completed'].includes(String(booking.status || '')));
    const amenities = amenitiesSnap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<AmenityDoc, 'id'>) }));
    const amenitiesById = new Map(amenities.map((a) => [a.id, a]));

    const suggestions: SmartBookingSuggestion[] = [];

    // Suggestion 1: repeating habit
    const patterns = buildHabitPatterns(userBookings);
    const topPattern = patterns[0];

    if (topPattern) {
      const amenity = amenitiesById.get(topPattern.amenityId);
      const nextDate = getNextDateForDay(topPattern.dayOfWeek);
      const slots = amenity ? getAmenitySlotsForDate(amenity, nextDate) : [];
      const chosenSlot = pickClosestSlot(slots, topPattern.preferredHour) || `${String(topPattern.preferredHour).padStart(2, '0')}:00-${String((topPattern.preferredHour + 1) % 24).padStart(2, '0')}:00`;

      suggestions.push({
        id: `habit_${topPattern.amenityId}_${topPattern.dayOfWeek}_${topPattern.preferredHour}`,
        type: 'habit',
        amenityId: topPattern.amenityId,
        amenityName: topPattern.amenityName,
        selectedDate: toISODate(nextDate),
        selectedSlot: chosenSlot,
        confidence: Math.min(0.95, 0.6 + topPattern.count * 0.08),
        reason: `You booked this pattern ${topPattern.count} times recently.`,
        text: formatHabitSuggestionText(topPattern),
      });
    }

    // Suggestion 2: quiet slot opportunity
    const crowdMap = buildCommunityCrowdMap(communityBookings);
    const candidateAmenities = amenities.length > 0 ? amenities : [];
    let bestAmenity: AmenityDoc | null = null;
    let bestHour = 6;
    let bestScore = Number.POSITIVE_INFINITY;

    for (const amenity of candidateAmenities) {
      const nextDate = new Date();
      nextDate.setDate(nextDate.getDate() + 1);
      const slots = getAmenitySlotsForDate(amenity, nextDate);
      if (!slots.length) {
        continue;
      }

      for (const slot of slots) {
        const hour = parseHourFromSlot(slot);
        if (hour === null) {
          continue;
        }
        const crowd = crowdMap.get(`${amenity.id}_${hour}`) || 0;
        const morningBoost = hour <= 7 ? -0.25 : 0;
        const score = crowd + morningBoost;
        if (score < bestScore) {
          bestScore = score;
          bestAmenity = amenity;
          bestHour = hour;
        }
      }
    }

    if (bestAmenity) {
      const bookingDate = new Date();
      bookingDate.setDate(bookingDate.getDate() + 1);
      const slots = getAmenitySlotsForDate(bestAmenity, bookingDate);
      const bestSlot = pickClosestSlot(slots, bestHour);

      if (bestSlot) {
        suggestions.push({
          id: `opportunity_${bestAmenity.id}_${bestHour}`,
          type: 'opportunity',
          amenityId: bestAmenity.id,
          amenityName: bestAmenity.name || bestAmenity.title || 'Amenity',
          selectedDate: toISODate(bookingDate),
          selectedSlot: bestSlot,
          confidence: 0.7,
          reason: 'Lower historical traffic in this slot.',
          text: formatOpportunitySuggestionText(bestAmenity.name || bestAmenity.title || 'This amenity', bestHour),
        });
      }
    }

    return suggestions.slice(0, maxResults);
  } catch (error) {
    console.error('Error getting smart booking suggestions:', error);
    return [];
  }
}
