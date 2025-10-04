import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, updateDoc, getDoc } from 'firebase/firestore';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, flatNumber } = body;
    
    console.log('API received:', { email, flatNumber, body });
    
    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // Update user document with flat number (can be empty string for skip)
    const userRef = doc(db, 'users', email);
    
    // Check if user exists
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Update user with flat number (handle empty strings and undefined for skipped setup)
    const processedFlatNumber = flatNumber ? flatNumber.trim().toUpperCase() : '';
    
    console.log('Updating user with flat number:', processedFlatNumber);
    
    await updateDoc(userRef, {
      flatNumber: processedFlatNumber,
      profileCompleted: true,
      updatedAt: new Date()
    });

    console.log('Successfully updated user flat number');

    return NextResponse.json({ 
      success: true, 
      message: processedFlatNumber ? 'Flat number updated successfully' : 'Profile setup completed',
      flatNumber: processedFlatNumber
    });

  } catch (error) {
    console.error('Error updating flat number:', error);
    return NextResponse.json({ 
      error: 'Failed to update flat number', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}