import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/firebase';
import { doc, getDoc, collection, getDocs, query, limit } from 'firebase/firestore';

// Mark this route as dynamic
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Get user document from Firestore
    const userDoc = await getDoc(doc(db, 'users', session.user.email));
    
    if (!userDoc.exists()) {
      return NextResponse.json({
        error: 'User document not found in Firestore',
        email: session.user.email,
        suggestion: 'User exists in Firebase Auth but not in Firestore users collection'
      }, { status: 404 });
    }

    const userData = userDoc.data();

    // Get first few users to check database
    const usersSnapshot = await getDocs(query(collection(db, 'users'), limit(5)));
    const allUsers = usersSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Get communities
    const communitiesSnapshot = await getDocs(query(collection(db, 'communities'), limit(5)));
    const communities = communitiesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return NextResponse.json({
      currentUser: {
        email: session.user.email,
        firestoreData: userData,
        sessionData: {
          role: (session.user as any).role,
          communityId: (session.user as any).communityId,
          profileCompleted: (session.user as any).profileCompleted
        }
      },
      allUsers: allUsers,
      communities: communities,
      diagnosis: {
        hasFirestoreDoc: true,
        hasCommunityId: !!userData.communityId,
        hasRole: !!userData.role,
        communityIdValue: userData.communityId || 'NULL',
        roleValue: userData.role || 'NULL',
        issue: !userData.communityId 
          ? 'User document exists but communityId is null/missing' 
          : 'User has communityId but JWT token might not be updated'
      }
    }, { status: 200 });

  } catch (error: any) {
    console.error('Debug API Error:', error);
    return NextResponse.json({ 
      error: error.message,
      stack: error.stack 
    }, { status: 500 });
  }
}
