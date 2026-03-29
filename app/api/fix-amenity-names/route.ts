import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { AmenityNameService } from '@/lib/amenity-name-service';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const role = (session.user as any).role;
    if (role !== 'admin' && role !== 'super_admin') {
      return NextResponse.json({ error: 'Admin privileges required' }, { status: 403 });
    }

    const { communityId = 'default-community', action = 'update' } = await request.json();
    
    if (action === 'update') {
      // Update all booking amenity names for the community
      await AmenityNameService.updateBookingAmenityNames(communityId);
      
      return NextResponse.json({ 
        success: true, 
        message: 'Booking amenity names updated successfully',
        communityId 
      });
    }
    
    if (action === 'clear-cache') {
      // Clear the amenity name cache
      AmenityNameService.clearCache();
      
      return NextResponse.json({ 
        success: true, 
        message: 'Amenity name cache cleared successfully' 
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

  } catch (error) {
    console.error('Error in fix-amenity-names API:', error);
    return NextResponse.json({ 
      error: 'Failed to fix amenity names', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}