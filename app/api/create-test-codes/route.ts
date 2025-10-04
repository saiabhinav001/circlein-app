import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';

export async function GET() {
  try {
    // Create multiple access codes for testing including the ones you've tried
    const accessCodes = [
      'EOOACJSV', 
      'MY4NKGZP', 
      'KMDD2F8L',
      '7D7MW7AU',
      'TEST123',
      'DEMO456'
    ];
    
    const results = [];
    
    for (const code of accessCodes) {
      await setDoc(doc(db, 'accessCodes', code), {
        communityId: 'sunny-meadows',
        isUsed: false,
        createdAt: serverTimestamp(),
        type: 'resident',
        description: `Resident access code for Sunny Meadows Community - ${code}`
      });
      
      results.push(code);
      console.log(`✅ Created access code: ${code}`);
    }

    // Also ensure community exists
    await setDoc(doc(db, 'communities', 'sunny-meadows'), {
      name: 'Sunny Meadows Community',
      description: 'A peaceful residential community with modern amenities',
      address: '123 Meadow Lane, Sunnyville',
      settings: {
        allowGuestBookings: true,
        maxAdvanceBookingDays: 30,
        defaultSlotDuration: 2
      },
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    console.log('✅ Community document created/updated');

    return NextResponse.json({
      success: true,
      message: 'Access codes created successfully',
      accessCodes: results,
      communityId: 'sunny-meadows',
      total: results.length
    });
  } catch (error) {
    console.error('Error creating access codes:', error);
    return NextResponse.json({
      error: 'Failed to create access codes',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}