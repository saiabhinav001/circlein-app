import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    if ((session.user as any).role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const { amenityId, timeSlots, operatingHours, slotDuration } = body;

    if (!amenityId) {
      return NextResponse.json({ error: 'Amenity ID is required' }, { status: 400 });
    }

    // Prepare update data
    const updateData: any = {};

    if (timeSlots) {
      // Using custom time slots
      updateData.timeSlots = timeSlots;
      updateData.operatingHours = null;
      updateData.slotDuration = null;
    } else if (operatingHours && slotDuration) {
      // Using auto-generated slots
      updateData.operatingHours = operatingHours;
      updateData.slotDuration = slotDuration;
      updateData.timeSlots = null;
    } else {
      return NextResponse.json(
        { error: 'Either timeSlots or (operatingHours + slotDuration) must be provided' },
        { status: 400 }
      );
    }

    // Update amenity in Firestore
    const amenityRef = doc(db, 'amenities', amenityId);
    await updateDoc(amenityRef, updateData);

    console.log(`✅ Time slots updated for amenity ${amenityId}`);

    return NextResponse.json({
      success: true,
      message: 'Time slots updated successfully',
      amenityId,
      updateData,
    });

  } catch (error) {
    console.error('❌ Error updating time slots:', error);
    return NextResponse.json(
      { error: 'Failed to update time slots' },
      { status: 500 }
    );
  }
}
