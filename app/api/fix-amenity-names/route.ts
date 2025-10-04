import { NextRequest, NextResponse } from 'next/server';
import { AmenityNameService } from '@/lib/amenity-name-service';

export async function POST(request: NextRequest) {
  try {
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