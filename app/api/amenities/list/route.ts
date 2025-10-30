import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const communityId = (session.user as any).communityId;
    if (!communityId) {
      return NextResponse.json({ error: 'Community ID not found' }, { status: 400 });
    }

    // Fetch all amenities for the community
    const amenitiesRef = collection(db, 'amenities');
    const q = query(amenitiesRef, where('communityId', '==', communityId));
    const querySnapshot = await getDocs(q);

    const amenities = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    console.log(`✅ Fetched ${amenities.length} amenities for community ${communityId}`);

    return NextResponse.json({
      success: true,
      amenities,
      count: amenities.length,
    });

  } catch (error) {
    console.error('❌ Error fetching amenities:', error);
    return NextResponse.json(
      { error: 'Failed to fetch amenities' },
      { status: 500 }
    );
  }
}
