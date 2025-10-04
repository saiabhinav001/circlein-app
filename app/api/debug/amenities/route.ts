import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';

// Mark this route as dynamic
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const communityId = session.user.communityId;
    
    console.log('Debug API - Community ID:', communityId);
    
    // Get all amenities for this community
    const amenitiesQuery = query(
      collection(db, 'amenities'),
      where('communityId', '==', communityId)
    );
    
    const amenitiesSnapshot = await getDocs(amenitiesQuery);
    const amenities = amenitiesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    // Also get all amenities without filter to see what's in the database
    const allAmenitiesSnapshot = await getDocs(collection(db, 'amenities'));
    const allAmenities = allAmenitiesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    return NextResponse.json({
      session: {
        email: session.user.email,
        role: session.user.role,
        communityId: session.user.communityId,
      },
      communityAmenities: amenities,
      allAmenities: allAmenities,
      counts: {
        communityAmenities: amenities.length,
        totalAmenities: allAmenities.length,
      }
    });
  } catch (error) {
    console.error('Debug API error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Internal server error', details: errorMessage },
      { status: 500 }
    );
  }
}