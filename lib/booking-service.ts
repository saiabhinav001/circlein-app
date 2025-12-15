import { 
  collection, 
  query, 
  where, 
  getDocs, 
  doc,
  getDoc,
  addDoc,
  updateDoc,
  Timestamp,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { calculatePriorityScore, requiresDeposit, calculateDepositAmount } from './booking-enhancements';

/**
 * ENHANCED BOOKING SERVICE
 * Wraps booking creation with priority system and deposit checks
 */

export interface BookingEnhancementResult {
  canBook: boolean;
  requiresDeposit: boolean;
  depositAmount?: number;
  priorityScore: number;
  isSuspended?: boolean;
  suspendedUntil?: Date;
  reason?: string;
}

export async function checkUserBookingEligibility(
  userId: string,
  amenityType: string
): Promise<BookingEnhancementResult> {
  try {
    // Get user booking stats
    const statsQuery = query(
      collection(db, 'userBookingStats'),
      where('userId', '==', userId)
    );
    
    const statsSnap = await getDocs(statsQuery);
    
    let userStats = {
      totalBookings: 0,
      noShowCount: 0,
      cancellationCount: 0,
      averageUsage: 100,
      suspendedUntil: null
    };

    if (!statsSnap.empty) {
      userStats = statsSnap.docs[0].data() as any;
    } else {
      // Create initial stats
      await addDoc(collection(db, 'userBookingStats'), {
        userId,
        totalBookings: 0,
        completedBookings: 0,
        noShowCount: 0,
        cancellationCount: 0,
        averageUsage: 100,
        priorityScore: 50,
        depositRequired: false,
        suspendedUntil: null,
        createdAt: serverTimestamp()
      });
    }

    // Check if user is currently suspended
    if (userStats.suspendedUntil) {
      const suspendedUntil = (userStats.suspendedUntil as any).toDate 
        ? (userStats.suspendedUntil as any).toDate() 
        : new Date(userStats.suspendedUntil as any);
      const now = new Date();
      
      if (suspendedUntil > now) {
        return {
          canBook: false,
          requiresDeposit: false,
          priorityScore: 0,
          isSuspended: true,
          suspendedUntil,
          reason: `Account suspended until ${suspendedUntil.toLocaleDateString()} due to ${userStats.noShowCount} no-shows`
        };
      }
    }

    const priorityScore = calculatePriorityScore(userStats);
    const needsDeposit = requiresDeposit(userStats.noShowCount);
    const depositAmt = needsDeposit ? calculateDepositAmount(amenityType) : 0;

    return {
      canBook: true,
      requiresDeposit: needsDeposit,
      depositAmount: depositAmt,
      priorityScore,
      isSuspended: false,
      reason: needsDeposit ? `Deposit required due to ${userStats.noShowCount} no-shows` : undefined
    };

  } catch (error) {
    console.error('Error checking eligibility:', error);
    return {
      canBook: true,
      requiresDeposit: false,
      priorityScore: 50,
      isSuspended: false
    };
  }
}

export async function trackBookingCompletion(bookingId: string, userId: string, actualUsagePercent: number) {
  try {
    const statsQuery = query(
      collection(db, 'userBookingStats'),
      where('userId', '==', userId)
    );
    
    const statsSnap = await getDocs(statsQuery);
    
    if (!statsSnap.empty) {
      const statsRef = statsSnap.docs[0].ref;
      const currentStats = statsSnap.docs[0].data();
      
      const newTotal = (currentStats.totalBookings || 0) + 1;
      const newCompleted = (currentStats.completedBookings || 0) + 1;
      const newAvgUsage = ((currentStats.averageUsage * currentStats.completedBookings) + actualUsagePercent) / newCompleted;

      await updateDoc(statsRef, {
        totalBookings: newTotal,
        completedBookings: newCompleted,
        averageUsage: Math.round(newAvgUsage),
        lastBookingDate: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    }
  } catch (error) {
    console.error('Error tracking completion:', error);
  }
}

export async function refundDeposit(bookingId: string, userId: string, amount: number) {
  try {
    // Record deposit refund
    await addDoc(collection(db, 'transactions'), {
      userId,
      bookingId,
      type: 'deposit_refund',
      amount,
      status: 'completed',
      createdAt: serverTimestamp()
    });

    // Mark booking as deposit refunded
    const bookingRef = doc(db, 'bookings', bookingId);
    await updateDoc(bookingRef, {
      depositRefunded: true,
      depositRefundedAt: serverTimestamp()
    });

    console.log(`💰 Refunded ${amount} deposit to ${userId}`);
  } catch (error) {
    console.error('Error refunding deposit:', error);
  }
}

export async function chargeDeposit(userId: string, bookingId: string, amount: number): Promise<boolean> {
  try {
    // Check user balance (assuming you have a credits system)
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    
    if (!userSnap.exists()) {
      return false;
    }

    const userData = userSnap.data();
    const currentBalance = userData.credits || 0;

    if (currentBalance < amount) {
      return false; // Insufficient balance
    }

    // Deduct deposit
    await updateDoc(userRef, {
      credits: currentBalance - amount,
      updatedAt: serverTimestamp()
    });

    // Record transaction
    await addDoc(collection(db, 'transactions'), {
      userId,
      bookingId,
      type: 'deposit_charge',
      amount,
      status: 'completed',
      createdAt: serverTimestamp()
    });

    console.log(`💳 Charged ${amount} deposit to ${userId}`);
    return true;
  } catch (error) {
    console.error('Error charging deposit:', error);
    return false;
  }
}

export async function applySuspension(userId: string, noShowCount: number) {
  try {
    // Suspend for 30 days if 3+ no-shows
    if (noShowCount >= 3) {
      const suspensionDate = new Date();
      suspensionDate.setDate(suspensionDate.getDate() + 30); // 30 days from now

      const statsQuery = query(
        collection(db, 'userBookingStats'),
        where('userId', '==', userId)
      );
      
      const statsSnap = await getDocs(statsQuery);
      
      if (!statsSnap.empty) {
        await updateDoc(statsSnap.docs[0].ref, {
          suspendedUntil: Timestamp.fromDate(suspensionDate),
          suspensionReason: `${noShowCount} no-shows`,
          updatedAt: serverTimestamp()
        });
        
        console.log(`🚫 Suspended user ${userId} until ${suspensionDate.toLocaleDateString()}`);
        return true;
      }
    }
    return false;
  } catch (error) {
    console.error('Error applying suspension:', error);
    return false;
  }
}
