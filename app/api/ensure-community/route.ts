import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

export async function GET(request: NextRequest) {
  try {
    // Check if sunny-meadows community exists
    const communityDoc = await getDoc(doc(db, 'communities', 'sunny-meadows'));
    
    if (!communityDoc.exists()) {
      // Create the community document
      await setDoc(doc(db, 'communities', 'sunny-meadows'), {
        name: 'Sunny Meadows',
        address: 'Main Street',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        isActive: true
      });
      
      return NextResponse.json({
        message: 'Community created successfully',
        communityId: 'sunny-meadows'
      }, { status: 201 });
    }
    
    return NextResponse.json({
      message: 'Community already exists',
      data: communityDoc.data()
    }, { status: 200 });
    
  } catch (error: any) {
    console.error('Error checking/creating community:', error);
    return NextResponse.json({ 
      error: error.message 
    }, { status: 500 });
  }
}
