import { NextRequest, NextResponse } from 'next/server';

// Essential database schema setup using client SDK directly
const setupDatabase = async () => {
  try {
    // Import Firebase client SDK
    const { initializeApp, getApps } = await import('firebase/app');
    const { getFirestore, collection, doc, setDoc, serverTimestamp, connectFirestoreEmulator } = await import('firebase/firestore');

    const firebaseConfig = {
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    };

    console.log('Initializing Firebase with config:', { projectId: firebaseConfig.projectId });

    const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
    const db = getFirestore(app);

    // Test connection first
    console.log('Testing Firestore connection...');
    const testDoc = doc(db, 'test', 'connection');
    await setDoc(testDoc, { timestamp: serverTimestamp(), test: 'connection' });
    console.log('Firestore connection successful!');

    // 1. Create communities first
    console.log('Creating communities...');
    const communities = [
      {
        id: 'sunny-meadows',
        name: 'Sunny Meadows Community',
        description: 'A peaceful residential community with modern amenities',
        address: '123 Meadow Lane, Sunnyville',
        adminEmail: 'admin@sunnymeadows.com',
        settings: {
          allowGuestBookings: true,
          maxAdvanceBookingDays: 30,
          defaultSlotDuration: 2
        },
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      },
      {
        id: 'golden-heights',
        name: 'Golden Heights Towers',
        description: 'Luxury high-rise community with premium facilities',
        address: '456 Gold Street, Heightsville',
        adminEmail: 'admin@goldenheights.com',
        settings: {
          allowGuestBookings: false,
          maxAdvanceBookingDays: 14,
          defaultSlotDuration: 1
        },
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      }
    ];

    for (const community of communities) {
      await setDoc(doc(db, 'communities', community.id), community);
    }

    // 2. Create invites for admin users
    console.log('Creating admin invites...');
    const invites = [
      {
        id: 'invite-1',
        email: 'admin@sunnymeadows.com',
        communityId: 'sunny-meadows',
        role: 'admin',
        status: 'pending',
        invitedBy: 'system',
        createdAt: serverTimestamp(),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
      },
      {
        id: 'invite-2',
        email: 'admin@goldenheights.com',
        communityId: 'golden-heights',
        role: 'admin',
        status: 'pending',
        invitedBy: 'system',
        createdAt: serverTimestamp(),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
      }
    ];

    for (const invite of invites) {
      await setDoc(doc(db, 'invites', invite.id), invite);
    }

    // 3. Create essential amenities with communityId
    console.log('Creating amenities...');
    const amenities = [
      {
        id: 'sunny-meadows-swimming-pool',
        name: 'Swimming Pool',
        description: 'Community swimming pool with diving board and shallow end for kids',
        imageUrl: 'https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=800',
        category: 'Recreation',
        capacity: 20,
        location: 'Building A - Level 1',
        communityId: 'sunny-meadows', // ADDED
        availability: {
          monday: { enabled: true, slots: ['09:00-11:00', '11:00-13:00', '13:00-15:00', '15:00-17:00', '17:00-19:00', '19:00-21:00'] },
          tuesday: { enabled: true, slots: ['09:00-11:00', '11:00-13:00', '13:00-15:00', '15:00-17:00', '17:00-19:00', '19:00-21:00'] },
          wednesday: { enabled: true, slots: ['09:00-11:00', '11:00-13:00', '13:00-15:00', '15:00-17:00', '17:00-19:00', '19:00-21:00'] },
          thursday: { enabled: true, slots: ['09:00-11:00', '11:00-13:00', '13:00-15:00', '15:00-17:00', '17:00-19:00', '19:00-21:00'] },
          friday: { enabled: true, slots: ['09:00-11:00', '11:00-13:00', '13:00-15:00', '15:00-17:00', '17:00-19:00', '19:00-21:00'] },
          saturday: { enabled: true, slots: ['09:00-11:00', '11:00-13:00', '13:00-15:00', '15:00-17:00', '17:00-19:00', '19:00-21:00'] },
          sunday: { enabled: true, slots: ['09:00-11:00', '11:00-13:00', '13:00-15:00', '15:00-17:00', '17:00-19:00', '19:00-21:00'] }
        },
        rules: {
          maxSlotsPerFamily: 2,
          maxGuestsPerBooking: 4,
          advanceBookingDays: 14,
          blackoutDates: []
        },
        isActive: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      },
      {
        id: 'sunny-meadows-tennis-court',
        name: 'Tennis Court',
        description: 'Professional tennis court with lighting for evening play',
        imageUrl: 'https://images.unsplash.com/photo-1622279457486-62dcc4a431d6?w=800',
        category: 'Outdoor',
        capacity: 4,
        location: 'Outdoor Area - Level 1',
        communityId: 'sunny-meadows', // ADDED
        availability: {
          monday: { enabled: true, slots: ['09:00-11:00', '11:00-13:00', '13:00-15:00', '15:00-17:00', '17:00-19:00', '19:00-21:00'] },
          tuesday: { enabled: true, slots: ['09:00-11:00', '11:00-13:00', '13:00-15:00', '15:00-17:00', '17:00-19:00', '19:00-21:00'] },
          wednesday: { enabled: true, slots: ['09:00-11:00', '11:00-13:00', '13:00-15:00', '15:00-17:00', '17:00-19:00', '19:00-21:00'] },
          thursday: { enabled: true, slots: ['09:00-11:00', '11:00-13:00', '13:00-15:00', '15:00-17:00', '17:00-19:00', '19:00-21:00'] },
          friday: { enabled: true, slots: ['09:00-11:00', '11:00-13:00', '13:00-15:00', '15:00-17:00', '17:00-19:00', '19:00-21:00'] },
          saturday: { enabled: true, slots: ['09:00-11:00', '11:00-13:00', '13:00-15:00', '15:00-17:00', '17:00-19:00', '19:00-21:00'] },
          sunday: { enabled: true, slots: ['09:00-11:00', '11:00-13:00', '13:00-15:00', '15:00-17:00', '17:00-19:00', '19:00-21:00'] }
        },
        rules: {
          maxSlotsPerFamily: 2,
          maxGuestsPerBooking: 4,
          advanceBookingDays: 14,
          blackoutDates: []
        },
        isActive: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      },
      {
        id: 'golden-heights-gym',
        name: 'Fitness Gym',
        description: 'Fully equipped gym with cardio and weight training equipment',
        imageUrl: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800',
        category: 'Fitness',
        capacity: 15,
        location: 'Building B - Level 2',
        communityId: 'golden-heights', // ADDED
        availability: {
          monday: { enabled: true, slots: ['06:00-08:00', '08:00-10:00', '10:00-12:00', '14:00-16:00', '16:00-18:00', '18:00-20:00'] },
          tuesday: { enabled: true, slots: ['06:00-08:00', '08:00-10:00', '10:00-12:00', '14:00-16:00', '16:00-18:00', '18:00-20:00'] },
          wednesday: { enabled: true, slots: ['06:00-08:00', '08:00-10:00', '10:00-12:00', '14:00-16:00', '16:00-18:00', '18:00-20:00'] },
          thursday: { enabled: true, slots: ['06:00-08:00', '08:00-10:00', '10:00-12:00', '14:00-16:00', '16:00-18:00', '18:00-20:00'] },
          friday: { enabled: true, slots: ['06:00-08:00', '08:00-10:00', '10:00-12:00', '14:00-16:00', '16:00-18:00', '18:00-20:00'] },
          saturday: { enabled: true, slots: ['08:00-10:00', '10:00-12:00', '14:00-16:00', '16:00-18:00'] },
          sunday: { enabled: true, slots: ['08:00-10:00', '10:00-12:00', '14:00-16:00', '16:00-18:00'] }
        },
        rules: {
          maxSlotsPerFamily: 3,
          maxGuestsPerBooking: 2,
          advanceBookingDays: 7,
          blackoutDates: []
        },
        isActive: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      },
      {
        id: 'golden-heights-clubhouse',
        name: 'Community Clubhouse',
        description: 'Event space for parties, meetings, and community gatherings',
        imageUrl: 'https://images.unsplash.com/photo-1511578314322-379afb476865?w=800',
        category: 'Meeting',
        capacity: 50,
        location: 'Building C - Level 1',
        communityId: 'golden-heights', // ADDED
        availability: {
          monday: { enabled: true, slots: ['10:00-14:00', '14:00-18:00', '18:00-22:00'] },
          tuesday: { enabled: true, slots: ['10:00-14:00', '14:00-18:00', '18:00-22:00'] },
          wednesday: { enabled: true, slots: ['10:00-14:00', '14:00-18:00', '18:00-22:00'] },
          thursday: { enabled: true, slots: ['10:00-14:00', '14:00-18:00', '18:00-22:00'] },
          friday: { enabled: true, slots: ['10:00-14:00', '14:00-18:00', '18:00-22:00'] },
          saturday: { enabled: true, slots: ['10:00-14:00', '14:00-18:00', '18:00-22:00'] },
          sunday: { enabled: true, slots: ['10:00-14:00', '14:00-18:00', '18:00-22:00'] }
        },
        rules: {
          maxSlotsPerFamily: 2,
          maxGuestsPerBooking: 4,
          advanceBookingDays: 14,
          blackoutDates: []
        },
        isActive: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      }
    ];

    // Create amenities
    for (const amenity of amenities) {
      await setDoc(doc(db, 'amenities', amenity.id), amenity);
    }

    // 4. Create essential access codes with communityId
    console.log('Creating access codes...');
    const accessCodes = [
      {
        id: 'SUNNY2025',
        code: 'SUNNY2025',
        description: 'General access code for Sunny Meadows residents',
        communityId: 'sunny-meadows', // ADDED
        isUsed: false,
        expiresAt: new Date('2025-12-31'),
        maxUses: 100,
        currentUses: 0,
        createdBy: 'admin@sunnymeadows.com',
        createdAt: serverTimestamp(),
        isActive: true
      },
      {
        id: 'GOLDEN123',
        code: 'GOLDEN123',
        description: 'Access code for Golden Heights residents',
        communityId: 'golden-heights', // ADDED
        isUsed: false,
        expiresAt: new Date('2025-12-31'),
        maxUses: 50,
        currentUses: 0,
        createdBy: 'admin@goldenheights.com',
        createdAt: serverTimestamp(),
        isActive: true
      },
      {
        id: 'WELCOME2025',
        code: 'WELCOME2025',
        description: 'Welcome access code for new families',
        communityId: 'sunny-meadows', // ADDED
        isUsed: false,
        expiresAt: new Date('2025-12-31'),
        maxUses: 200,
        currentUses: 0,
        createdBy: 'admin@sunnymeadows.com',
        createdAt: serverTimestamp(),
        isActive: true
      }
    ];

    // Create access codes
    for (const accessCode of accessCodes) {
      await setDoc(doc(db, 'accessCodes', accessCode.id), accessCode);
    }

    // 5. Create community-specific settings
    console.log('Creating settings...');
    const settings = [
      {
        id: 'sunny-meadows-config',
        communityId: 'sunny-meadows', // ADDED
        appName: 'CircleIn - Sunny Meadows',
        version: '1.0.0',
        maintenanceMode: false,
        maintenanceMessage: '',
        maxAdvanceBookingDays: 30,
        defaultSlotDuration: 2,
        allowGuestBookings: true,
        supportEmail: 'support@sunnymeadows.com',
        bookingRules: {
          cancellationPolicy: '24 hours advance notice required',
          noShowPolicy: 'Repeated no-shows may result in booking restrictions',
          maxActiveBookings: 5
        },
        notifications: {
          bookingConfirmation: true,
          reminderBeforeBooking: true,
          reminderHours: 2
        },
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      },
      {
        id: 'golden-heights-config',
        communityId: 'golden-heights', // ADDED
        appName: 'CircleIn - Golden Heights',
        version: '1.0.0',
        maintenanceMode: false,
        maintenanceMessage: '',
        maxAdvanceBookingDays: 14,
        defaultSlotDuration: 1,
        allowGuestBookings: false,
        supportEmail: 'support@goldenheights.com',
        bookingRules: {
          cancellationPolicy: '12 hours advance notice required',
          noShowPolicy: 'Repeated no-shows may result in booking restrictions',
          maxActiveBookings: 3
        },
        notifications: {
          bookingConfirmation: true,
          reminderBeforeBooking: true,
          reminderHours: 1
        },
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      }
    ];

    // Create settings
    for (const setting of settings) {
      await setDoc(doc(db, 'settings', setting.id), setting);
    }

    return {
      success: true,
      message: 'Multi-tenant database schema created successfully',
      collections: {
        communities: communities.length,
        invites: invites.length,
        amenities: amenities.length,
        accessCodes: accessCodes.length,
        settings: settings.length
      },
      multiTenancy: {
        enabled: true,
        communities: communities.map(c => c.id),
        note: 'All data is now isolated by communityId'
      }
    };

  } catch (error) {
    console.error('Database setup error:', error);
    return {
      success: false,
      error: 'Failed to setup database',
      details: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

export async function POST(request: NextRequest) {
  try {
    const result = await setupDatabase();
    
    if (result.success) {
      return NextResponse.json(result, { status: 200 });
    } else {
      return NextResponse.json(result, { status: 500 });
    }
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Setup failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'CircleIn Database Setup API',
    usage: 'Send POST request to setup essential database collections',
    collections: ['amenities', 'accessCodes', 'settings'],
    note: 'Users and bookings collections will be created automatically when users sign up and make bookings'
  });
}