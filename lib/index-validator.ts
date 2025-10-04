'use client';

import { collection, query, where, orderBy, getDocs, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface IndexStatus {
  userBookingsIndex: boolean;
  adminBookingsIndex: boolean;
  error?: string;
}

export class IndexValidator {
  private static instance: IndexValidator;
  private validationResults: Map<string, IndexStatus> = new Map();

  static getInstance(): IndexValidator {
    if (!IndexValidator.instance) {
      IndexValidator.instance = new IndexValidator();
    }
    return IndexValidator.instance;
  }

  /**
   * Validate if the required Firestore indexes are available and working
   */
  async validateIndexes(communityId: string, userEmail: string): Promise<IndexStatus> {
    const cacheKey = `${communityId}-${userEmail}`;
    
    // Return cached result if available and recent (5 minutes)
    const cached = this.validationResults.get(cacheKey);
    if (cached) {
      return cached;
    }

    const status: IndexStatus = {
      userBookingsIndex: false,
      adminBookingsIndex: false
    };

    try {
      // Test 1: User bookings index (userEmail + communityId + createdAt)
      console.log('Testing user bookings index...');
      const userQuery = query(
        collection(db, 'bookings'),
        where('userEmail', '==', userEmail),
        where('communityId', '==', communityId),
        orderBy('createdAt', 'desc'),
        limit(1)
      );

      await getDocs(userQuery);
      status.userBookingsIndex = true;
      console.log('✅ User bookings index is working');

    } catch (error: any) {
      console.warn('❌ User bookings index test failed:', error.message);
      if (error.code === 'failed-precondition') {
        status.error = error.message;
      }
    }

    try {
      // Test 2: Admin bookings index (communityId + createdAt)
      console.log('Testing admin bookings index...');
      const adminQuery = query(
        collection(db, 'bookings'),
        where('communityId', '==', communityId),
        orderBy('createdAt', 'desc'),
        limit(1)
      );

      await getDocs(adminQuery);
      status.adminBookingsIndex = true;
      console.log('✅ Admin bookings index is working');

    } catch (error: any) {
      console.warn('❌ Admin bookings index test failed:', error.message);
      if (error.code === 'failed-precondition') {
        status.error = error.message;
      }
    }

    // Cache the results for 5 minutes
    this.validationResults.set(cacheKey, status);
    setTimeout(() => {
      this.validationResults.delete(cacheKey);
    }, 5 * 60 * 1000);

    return status;
  }

  /**
   * Quick check if indexes are likely working based on previous validations
   */
  areIndexesLikelyWorking(communityId: string, userEmail: string): boolean {
    const cacheKey = `${communityId}-${userEmail}`;
    const cached = this.validationResults.get(cacheKey);
    
    return cached ? (cached.userBookingsIndex && cached.adminBookingsIndex) : false;
  }

  /**
   * Clear validation cache (useful for testing)
   */
  clearCache(): void {
    this.validationResults.clear();
  }

  /**
   * Get detailed status for debugging
   */
  getValidationStatus(communityId: string, userEmail: string): IndexStatus | null {
    const cacheKey = `${communityId}-${userEmail}`;
    return this.validationResults.get(cacheKey) || null;
  }
}

export const indexValidator = IndexValidator.getInstance();