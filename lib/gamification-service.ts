import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  where,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

export type BadgeKey = 'early_bird' | 'pool_regular' | 'community_star';

export interface BadgeDefinition {
  key: BadgeKey;
  name: string;
  description: string;
  icon: string;
}

export interface EvaluateBadgesInput {
  userEmail: string;
  communityId: string;
  bookingStartTime: Date;
}

const BADGES: Record<BadgeKey, BadgeDefinition> = {
  early_bird: {
    key: 'early_bird',
    name: 'Early Bird',
    description: 'Booked an amenity before 9:00 AM.',
    icon: 'sunrise',
  },
  pool_regular: {
    key: 'pool_regular',
    name: 'Pool Regular',
    description: 'Completed 10 or more pool bookings.',
    icon: 'waves',
  },
  community_star: {
    key: 'community_star',
    name: 'Community Star',
    description: 'Participated in 3 or more community polls.',
    icon: 'star',
  },
};

async function awardBadgeIfMissing(
  userEmail: string,
  communityId: string,
  badge: BadgeDefinition
): Promise<boolean> {
  const badgeRef = doc(db, 'users', userEmail, 'badges', badge.key);
  const existing = await getDoc(badgeRef);

  if (existing.exists()) {
    return false;
  }

  await setDoc(badgeRef, {
    key: badge.key,
    name: badge.name,
    description: badge.description,
    icon: badge.icon,
    communityId,
    earnedAt: serverTimestamp(),
  });

  return true;
}

export async function evaluateAndAwardBadges(
  input: EvaluateBadgesInput
): Promise<BadgeDefinition[]> {
  const { userEmail, communityId, bookingStartTime } = input;
  const awarded: BadgeDefinition[] = [];

  // Support both userId and userEmail booking identity fields.
  const [byUserId, byUserEmail] = await Promise.all([
    getDocs(query(collection(db, 'bookings'), where('userId', '==', userEmail))),
    getDocs(query(collection(db, 'bookings'), where('userEmail', '==', userEmail))),
  ]);

  const bookingMap = new Map<string, any>();
  byUserId.docs.forEach((docSnapshot) => bookingMap.set(docSnapshot.id, docSnapshot.data()));
  byUserEmail.docs.forEach((docSnapshot) => bookingMap.set(docSnapshot.id, docSnapshot.data()));

  const userCommunityBookings = Array.from(bookingMap.values()).filter(
    (booking) => booking.communityId === communityId
  );

  const confirmedOrCompleted = userCommunityBookings.filter((booking) =>
    ['confirmed', 'completed'].includes(booking.status)
  );

  const bookingHour = bookingStartTime.getHours();
  if (bookingHour < 9) {
    const newlyAwarded = await awardBadgeIfMissing(
      userEmail,
      communityId,
      BADGES.early_bird
    );
    if (newlyAwarded) {
      awarded.push(BADGES.early_bird);
    }
  }

  const poolBookingCount = confirmedOrCompleted.filter((booking) => {
    const amenity = String(booking.amenityName || '').toLowerCase();
    return amenity.includes('pool');
  }).length;

  if (poolBookingCount >= 10) {
    const newlyAwarded = await awardBadgeIfMissing(
      userEmail,
      communityId,
      BADGES.pool_regular
    );
    if (newlyAwarded) {
      awarded.push(BADGES.pool_regular);
    }
  }

  const pollsSnapshot = await getDocs(
    query(collection(db, 'polls'), where('communityId', '==', communityId))
  );

  const pollParticipationCount = pollsSnapshot.docs.reduce((count, pollDoc) => {
    const pollData = pollDoc.data();
    const votes = (pollData.votes || {}) as Record<string, number>;
    return votes[userEmail] !== undefined ? count + 1 : count;
  }, 0);

  if (pollParticipationCount >= 3) {
    const newlyAwarded = await awardBadgeIfMissing(
      userEmail,
      communityId,
      BADGES.community_star
    );
    if (newlyAwarded) {
      awarded.push(BADGES.community_star);
    }
  }

  return awarded;
}
