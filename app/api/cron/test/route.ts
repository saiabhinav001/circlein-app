import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, getDocs } from 'firebase/firestore';

/**
 * TEST ENDPOINT - Verify Firebase connection and cron setup
 * Access: https://circlein-app.vercel.app/api/cron/test
 */
export async function GET() {
  try {
    const startTime = Date.now();
    
    // Test 1: Environment variables
    const hasSecret = !!process.env.CRON_SECRET;
    const hasEmail = !!process.env.EMAIL_PASSWORD;
    
    // Test 2: Firebase connection
    let firebaseWorks = false;
    let bookingsCount = 0;
    try {
      const snapshot = await getDocs(collection(db, 'bookings'));
      bookingsCount = snapshot.docs.length;
      firebaseWorks = true;
    } catch (err: any) {
      console.error('Firebase test failed:', err.message);
    }
    
    const duration = Date.now() - startTime;
    
    return NextResponse.json({
      success: true,
      tests: {
        environment: {
          CRON_SECRET: hasSecret ? '✅ Set' : '❌ Missing',
          EMAIL_PASSWORD: hasEmail ? '✅ Set' : '⚠️ Missing (non-critical)',
          NODE_ENV: process.env.NODE_ENV || 'unknown'
        },
        firebase: {
          status: firebaseWorks ? '✅ Connected' : '❌ Failed',
          bookingsCount
        }
      },
      duration: `${duration}ms`,
      timestamp: new Date().toISOString(),
      message: firebaseWorks && hasSecret 
        ? '✅ All systems operational' 
        : '⚠️ Some issues detected'
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}
