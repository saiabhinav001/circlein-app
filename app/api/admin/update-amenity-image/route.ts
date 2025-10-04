import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { doc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { amenityName, newImageUrl } = await request.json();
    
    if (!amenityName || !newImageUrl) {
      return NextResponse.json({ error: 'Missing amenityName or newImageUrl' }, { status: 400 });
    }

    // Find the amenity by name and community
    const amenitiesQuery = query(
      collection(db, 'amenities'),
      where('communityId', '==', session.user.communityId),
      where('name', '==', amenityName)
    );
    
    const amenitiesSnapshot = await getDocs(amenitiesQuery);
    
    if (amenitiesSnapshot.empty) {
      return NextResponse.json({ error: 'Amenity not found' }, { status: 404 });
    }

    // Update the first matching amenity
    const amenityDoc = amenitiesSnapshot.docs[0];
    await updateDoc(doc(db, 'amenities', amenityDoc.id), {
      imageUrl: newImageUrl,
      updatedAt: new Date(),
    });

    return NextResponse.json({
      success: true,
      message: `Updated ${amenityName} image successfully`,
      amenityId: amenityDoc.id,
    });
  } catch (error) {
    console.error('Error updating amenity image:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}