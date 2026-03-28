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

function toDate(value: unknown): Date | null {
  if (!value) {
    return null;
  }

  if (value instanceof Date) {
    return value;
  }

  if (typeof (value as { toDate?: () => Date }).toDate === 'function') {
    return (value as { toDate: () => Date }).toDate();
  }

  if (typeof value === 'string' || typeof value === 'number') {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  return null;
}

function dateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function parseDateKey(key: string): Date {
  return new Date(`${key}T00:00:00`);
}

export async function getUserBookingStreak(
  userEmail: string,
  communityId: string
): Promise<number> {
  if (!userEmail || !communityId) {
    return 0;
  }

  const [byUserId, byUserEmail] = await Promise.all([
    getDocs(query(collection(db, 'bookings'), where('userId', '==', userEmail))),
    getDocs(query(collection(db, 'bookings'), where('userEmail', '==', userEmail))),
  ]);

  const bookingMap = new Map<string, any>();
  byUserId.docs.forEach((docSnapshot) => bookingMap.set(docSnapshot.id, docSnapshot.data()));
  byUserEmail.docs.forEach((docSnapshot) => bookingMap.set(docSnapshot.id, docSnapshot.data()));

  const qualifyingDates = Array.from(bookingMap.values())
    .filter((booking) => booking.communityId === communityId)
    .filter((booking) => ['confirmed', 'completed'].includes(String(booking.status || '').toLowerCase()))
    .map((booking) => toDate(booking.startTime))
    .filter((date): date is Date => date !== null)
    .map((date) => dateKey(date));

  if (qualifyingDates.length === 0) {
    return 0;
  }

  const uniqueSorted = Array.from(new Set(qualifyingDates)).sort((a, b) => {
    return parseDateKey(b).getTime() - parseDateKey(a).getTime();
  });

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const latest = parseDateKey(uniqueSorted[0]);
  const daysFromToday = Math.floor((today.getTime() - latest.getTime()) / (1000 * 60 * 60 * 24));

  if (daysFromToday > 1) {
    return 0;
  }

  let streak = 1;
  for (let i = 1; i < uniqueSorted.length; i += 1) {
    const prev = parseDateKey(uniqueSorted[i - 1]);
    const current = parseDateKey(uniqueSorted[i]);
    const diff = Math.floor((prev.getTime() - current.getTime()) / (1000 * 60 * 60 * 24));

    if (diff === 1) {
      streak += 1;
    } else {
      break;
    }
  }

  return streak;
}
