import { NextRequest, NextResponse } from 'next/server';
import { initializeDatabase, createSampleBookings } from '@/lib/init-database';

export async function POST(req: NextRequest) {
  try {
    console.log('🚀 Database initialization requested...');
    
    // Initialize main collections
    const initResult = await initializeDatabase();
    
    if (!initResult.success) {
      return NextResponse.json({ 
        error: 'Failed to initialize database', 
        details: initResult.message 
      }, { status: 500 });
    }

    // Create sample bookings
    const bookingsResult = await createSampleBookings();
    
    return NextResponse.json({
      success: true,
      message: 'Database initialized successfully!',
      details: {
        mainCollections: initResult.collections,
        sampleBookings: bookingsResult.success,
        summary: {
          users: 2,
          amenities: 4,
          accessCodes: 3,
          settings: 1,
          bookings: 2
        }
      }
    });

  } catch (error) {
    console.error('Error in database initialization:', error);
    return NextResponse.json({ 
      error: 'Database initialization failed', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Database initialization endpoint',
    instructions: [
      '1. First update your Firestore security rules to allow writes',
      '2. Send a POST request to this endpoint to initialize the database',
      '3. This will create all necessary collections with sample data',
      '4. Collections created: users, amenities, accessCodes, settings, bookings'
    ],
    securityRules: `
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
    `.trim()
  });
}