import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

/**
 * 🔥 DELETE USER API - INDUSTRY STANDARD IMPLEMENTATION
 * 
 * This API performs a HARD DELETE:
 * 1. Completely removes the user document from Firestore
 * 2. Invalidates their access code (marks as used + invalidated)
 * 3. Generates a NEW access code for the community
 * 4. Stores deletion in audit log for compliance
 * 
 * This ensures deleted users cannot bypass authentication in any way.
 */

// Generate a random access code
function generateAccessCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export async function POST(request: NextRequest) {
  try {
    // Check if user is admin
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 403 }
      );
    }

    const { initializeApp, getApps } = await import('firebase/app');
    const { 
      getFirestore, 
      doc, 
      getDoc, 
      setDoc, 
      deleteDoc,
      updateDoc,
      collection, 
      query, 
      where, 
      getDocs,
      serverTimestamp 
    } = await import('firebase/firestore');

    const firebaseConfig = {
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    };

    const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
    const db = getFirestore(app);

    const { email, reason } = await request.json();
    
    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // Check if user exists
    const userDocRef = doc(db, 'users', email);
    const userDoc = await getDoc(userDocRef);
    
    if (!userDoc.exists()) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Prevent admin from deleting themselves
    if (email === session.user.email) {
      return NextResponse.json({ error: 'Cannot delete your own account' }, { status: 400 });
    }

    const userData = userDoc.data();
    const userCommunityId = userData.communityId;
    const userName = userData.name;
    const userRole = userData.role;

    // ============================================
    // STEP 1: Store deletion in audit log (for compliance)
    // ============================================
    const auditLogRef = doc(collection(db, 'deletedUsersAudit'));
    await setDoc(auditLogRef, {
      email: email,
      name: userName,
      role: userRole,
      communityId: userCommunityId,
      deletedAt: serverTimestamp(),
      deletedBy: session.user.email,
      deletionReason: reason || 'No reason provided',
      originalData: {
        // Store essential data for audit trail (without password)
        name: userData.name,
        email: userData.email,
        role: userData.role,
        communityId: userData.communityId,
        flatNumber: userData.flatNumber,
        createdAt: userData.createdAt,
        lastLogin: userData.lastLogin,
      }
    });
    console.log('✅ Audit log created for deleted user:', email);

    // ============================================
    // STEP 2: HARD DELETE the user document
    // ============================================
    await deleteDoc(userDocRef);
    console.log('✅ User document DELETED from database:', email);

    // ============================================
    // STEP 3: Invalidate their access code
    // ============================================
    const accessCodesQuery = query(
      collection(db, 'accessCodes'),
      where('usedBy', '==', email)
    );
    
    const accessCodeSnapshot = await getDocs(accessCodesQuery);
    let newAccessCode: string | null = null;
    let invalidatedCodeId: string | null = null;
    
    if (!accessCodeSnapshot.empty) {
      // Mark access code as PERMANENTLY INVALIDATED
      for (const accessCodeDoc of accessCodeSnapshot.docs) {
        invalidatedCodeId = accessCodeDoc.id;
        await updateDoc(doc(db, 'accessCodes', accessCodeDoc.id), {
          isUsed: true,
          invalidated: true,
          invalidatedAt: serverTimestamp(),
          invalidatedReason: `User ${email} was permanently deleted`,
          invalidatedBy: session.user.email,
        });
        console.log('✅ Access code permanently invalidated:', accessCodeDoc.id);
      }
    }
    
    // ============================================
    // STEP 4: Generate a NEW access code
    // ============================================
    if (userCommunityId) {
      let attempts = 0;
      do {
        newAccessCode = generateAccessCode();
        attempts++;
        // Ensure uniqueness
        const existingCode = await getDoc(doc(db, 'accessCodes', newAccessCode));
        if (!existingCode.exists()) {
          break;
        }
        newAccessCode = null;
      } while (attempts < 100);
      
      if (newAccessCode) {
        await setDoc(doc(db, 'accessCodes', newAccessCode), {
          code: newAccessCode,
          communityId: userCommunityId,
          isUsed: false,
          usedBy: null,
          usedAt: null,
          invalidated: false,
          createdAt: serverTimestamp(),
          createdBy: session.user.email,
          createdReason: `Replacement code after deleting user: ${email}`,
          expiresAt: null,
        });
        console.log('✅ New access code generated:', newAccessCode);
      }
    }

    // ============================================
    // STEP 5: Delete user's bookings (optional - cancel future bookings)
    // ============================================
    const futureBookingsQuery = query(
      collection(db, 'bookings'),
      where('userEmail', '==', email),
      where('status', '==', 'confirmed')
    );
    const bookingsSnapshot = await getDocs(futureBookingsQuery);
    
    let cancelledBookings = 0;
    for (const bookingDoc of bookingsSnapshot.docs) {
      await updateDoc(doc(db, 'bookings', bookingDoc.id), {
        status: 'cancelled',
        cancelledAt: serverTimestamp(),
        cancellationReason: 'User account deleted',
        cancelledBy: session.user.email,
      });
      cancelledBookings++;
    }
    console.log(`✅ Cancelled ${cancelledBookings} future bookings`);

    return NextResponse.json({
      success: true,
      message: 'User permanently deleted',
      data: {
        email: email,
        deletedAt: new Date().toISOString(),
        deletedBy: session.user.email,
        invalidatedAccessCode: invalidatedCodeId,
        newAccessCode: newAccessCode,
        cancelledBookings: cancelledBookings,
        note: 'User has been permanently deleted. Their data is stored in audit log for compliance. A new access code has been generated.'
      }
    });

  } catch (error) {
    console.error('Delete user error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to delete user',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Delete User API - Industry Standard Implementation',
    usage: 'POST with { "email": "user@example.com", "reason": "Optional reason" }',
    security: 'Requires admin authentication',
    behavior: [
      '1. Stores deletion in audit log (compliance)',
      '2. HARD DELETES user document from database',
      '3. Permanently invalidates their access code',
      '4. Generates a new access code for the community',
      '5. Cancels all future bookings'
    ]
  });
}
