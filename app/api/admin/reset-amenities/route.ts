import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { collection, query, where, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const communityId = session.user.communityId;
    console.log('Deleting amenities for community:', communityId);

    // Find all amenities for this community
    const amenitiesQuery = query(
      collection(db, 'amenities'),
      where('communityId', '==', communityId)
    );
    
    const amenitiesSnapshot = await getDocs(amenitiesQuery);
    console.log('Found amenities to delete:', amenitiesSnapshot.size);

    // Delete all amenities
    const deletePromises = amenitiesSnapshot.docs.map(amenityDoc => 
      deleteDoc(doc(db, 'amenities', amenityDoc.id))
    );
    
    await Promise.all(deletePromises);

    return NextResponse.json({
      success: true,
      message: `Deleted ${amenitiesSnapshot.size} amenities`,
      deletedCount: amenitiesSnapshot.size,
    });
  } catch (error) {
    console.error('Error deleting amenities:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: 'Internal server error', details: errorMessage }, { status: 500 });
  }
}