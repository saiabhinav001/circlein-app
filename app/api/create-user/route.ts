import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { name, email, accessCode, communityId } = await req.json();
    
    const userRef = doc(db, 'users', email || session.user.email);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      // Determine communityId from access code if not provided
      let userCommunityId = communityId;
      
      if (accessCode && !userCommunityId) {
        const accessCodeDoc = await getDoc(doc(db, 'accessCodes', accessCode));
        if (accessCodeDoc.exists()) {
          userCommunityId = accessCodeDoc.data().communityId;
        }
      }
      
      if (!userCommunityId) {
        return NextResponse.json({ 
          error: 'Unable to determine community assignment. Please contact your administrator.' 
        }, { status: 400 });
      }
      
      await setDoc(userRef, {
        name: name || session.user.name,
        email: email || session.user.email,
        role: 'resident',
        communityId: userCommunityId, // ADDED
        createdAt: serverTimestamp(),
        lastLogin: serverTimestamp(),
      });
      
      return NextResponse.json({ 
        success: true, 
        message: 'User created successfully',
        communityId: userCommunityId
      });
    } else {
      // Update last login and ensure communityId exists
      const userData = userDoc.data();
      const updateData: any = {
        lastLogin: serverTimestamp(),
      };
      
      // Backfill communityId if missing (for existing users)
      if (!userData.communityId && accessCode) {
        const accessCodeDoc = await getDoc(doc(db, 'accessCodes', accessCode));
        if (accessCodeDoc.exists()) {
          updateData.communityId = accessCodeDoc.data().communityId;
        }
      }
      
      await setDoc(userRef, updateData, { merge: true });
      
      return NextResponse.json({ 
        success: true, 
        message: 'User login updated',
        communityId: userData.communityId || updateData.communityId
      });
    }
  } catch (error) {
    console.error('Error creating/updating user:', error);
    return NextResponse.json({ 
      error: 'Failed to create/update user',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}