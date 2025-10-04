import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { doc, updateDoc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    console.log('Session in API:', session);
    console.log('User in API:', session?.user);
    
    if (!session?.user?.email || session.user.role !== 'admin') {
      console.log('Authorization failed - no session or not admin');
      return NextResponse.json(
        { error: 'Unauthorized - Must be logged in as admin' },
        { status: 401 }
      );
    }

    const { communityId, communityName } = await request.json();
    
    console.log('Request data:', { communityId, communityName });

    if (!communityId || !communityName) {
      console.log('Missing required fields');
      return NextResponse.json(
        { error: 'Missing required fields: communityId and communityName are required' },
        { status: 400 }
      );
    }

    // Verify the user belongs to this community
    if (session.user.communityId !== communityId) {
      console.log('Community mismatch:', { 
        sessionCommunityId: session.user.communityId, 
        requestCommunityId: communityId 
      });
      return NextResponse.json(
        { error: 'Unauthorized - Community mismatch' },
        { status: 401 }
      );
    }

    // Update community document
    const communityRef = doc(db, 'communities', communityId);
    
    try {
      console.log('Attempting to access community document:', communityId);
      
      // Check if the community document exists
      const communityDoc = await getDoc(communityRef);
      console.log('Community document exists:', communityDoc.exists());
      
      if (communityDoc.exists()) {
        console.log('Updating existing community document');
        // Update existing document
        await updateDoc(communityRef, {
          name: communityName,
          updatedAt: new Date(),
        });
        console.log('Successfully updated community document');
      } else {
        console.log('Creating new community document');
        // Create new document if it doesn't exist
        await setDoc(communityRef, {
          id: communityId,
          name: communityName,
          createdAt: new Date(),
          updatedAt: new Date(),
          isActive: true,
        });
        console.log('Successfully created community document');
      }
    } catch (firestoreError: any) {
      console.error('Detailed Firestore error:', {
        message: firestoreError.message,
        code: firestoreError.code,
        details: firestoreError.details,
        stack: firestoreError.stack
      });
      
      // If it's a permission error, let's try a different approach
      if (firestoreError.code === 'permission-denied') {
        return NextResponse.json(
          { 
            error: 'Permission denied - Firestore rules need to be updated',
            details: 'Please update your Firestore security rules to allow community creation',
            firestoreError: firestoreError.message 
          },
          { status: 403 }
        );
      }
      
      return NextResponse.json(
        { 
          error: 'Failed to update community in database',
          details: firestoreError.message,
          code: firestoreError.code 
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Community updated successfully',
    });
  } catch (error) {
    console.error('Error updating community:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}