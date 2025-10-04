import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

// Generate a random access code
function generateAccessCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { communityId, codeCount } = await request.json();

    if (!communityId || !codeCount || codeCount < 1 || codeCount > 50) {
      return NextResponse.json(
        { error: 'Invalid code count (must be between 1 and 50)' },
        { status: 400 }
      );
    }

    // Verify the user belongs to this community
    if (session.user.communityId !== communityId) {
      return NextResponse.json(
        { error: 'Unauthorized - Community mismatch' },
        { status: 401 }
      );
    }

    // Generate unique access codes
    const generatedCodes: string[] = [];
    const codePromises: Promise<any>[] = [];

    for (let i = 0; i < codeCount; i++) {
      let code: string;
      let attempts = 0;
      
      // Ensure code uniqueness (basic attempt-based approach)
      do {
        code = generateAccessCode();
        attempts++;
      } while (generatedCodes.includes(code) && attempts < 100);

      if (attempts >= 100) {
        return NextResponse.json(
          { error: 'Unable to generate unique codes' },
          { status: 500 }
        );
      }

      generatedCodes.push(code);

      // Create access code document
      const accessCodeData = {
        code,
        communityId,
        isUsed: false,
        usedBy: null,
        createdAt: new Date(),
        createdBy: session.user.email,
        expiresAt: null, // Set to null for no expiration, or add expiration logic if needed
      };

      codePromises.push(addDoc(collection(db, 'accessCodes'), accessCodeData));
    }

    // Save all codes to Firestore
    await Promise.all(codePromises);

    return NextResponse.json({
      success: true,
      message: `Successfully generated ${generatedCodes.length} access codes`,
      codes: generatedCodes,
    });
  } catch (error) {
    console.error('Error generating access codes:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}