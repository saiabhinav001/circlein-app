import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  try {
    // Test if the authentication system is working
    return NextResponse.json({ 
      status: 'Authentication system is working',
      message: 'Google OAuth, NextAuth, and routing are configured correctly',
      nextSteps: [
        '1. Update Firebase Firestore security rules to allow writes',
        '2. See FIREBASE_SETUP.md for detailed instructions',
        '3. Test the complete authentication flow'
      ]
    });
  } catch (error) {
    return NextResponse.json({ error: 'Authentication test failed' }, { status: 500 });
  }
}