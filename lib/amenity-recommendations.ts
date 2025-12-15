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
