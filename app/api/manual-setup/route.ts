import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';

// Simplified database setup that works with authentication
const setupDatabaseWithAuth = async () => {
  try {
    // Use a simpler approach - just create the data structure that can be copied
    const databaseStructure = {
      // Communities collection - NEW for multi-tenancy
      communities: {
        'sunny-meadows': {
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
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        'golden-heights': {
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
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      },

      // Invites collection - NEW for pre-approved admins
      invites: {
        'invite-1': {
          email: 'admin@sunnymeadows.com',
          communityId: 'sunny-meadows',
          role: 'admin',
          status: 'pending',
          invitedBy: 'system',
          createdAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days
        },
        'invite-2': {
          email: 'admin@goldenheights.com',
          communityId: 'golden-heights',
          role: 'admin',
          status: 'pending',
          invitedBy: 'system',
          createdAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days
        }
      },

      // Amenities collection - UPDATED with communityId
      amenities: {
        'sunny-meadows-swimming-pool': {
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
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        'sunny-meadows-tennis-court': {
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
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        'golden-heights-gym': {
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
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        'golden-heights-clubhouse': {
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
            maxSlotsPerFamily: 1,
            maxGuestsPerBooking: 25,
            advanceBookingDays: 30,
            blackoutDates: []
          },
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      },
      
      // Access codes collection - UPDATED with communityId
      accessCodes: {
        'SUNNY2025': {
          code: 'SUNNY2025',
          description: 'General access code for Sunny Meadows residents',
          communityId: 'sunny-meadows', // ADDED
          isUsed: false,
          usedBy: '',
          usedAt: null,
          expiryDate: '2025-12-31',
          maxUses: 100,
          currentUses: 0,
          createdBy: 'admin@sunnymeadows.com',
          createdAt: new Date().toISOString(),
          isActive: true
        },
        'GOLDEN123': {
          code: 'GOLDEN123',
          description: 'Access code for Golden Heights residents',
          communityId: 'golden-heights', // ADDED
          isUsed: false,
          usedBy: '',
          usedAt: null,
          expiryDate: '2025-12-31',
          maxUses: 50,
          currentUses: 0,
          createdBy: 'admin@goldenheights.com',
          createdAt: new Date().toISOString(),
          isActive: true
        },
        'WELCOME2025': {
          code: 'WELCOME2025',
          description: 'Welcome access code for new families',
          communityId: 'sunny-meadows', // ADDED
          isUsed: false,
          usedBy: '',
          usedAt: null,
          expiryDate: '2025-12-31',
          maxUses: 200,
          currentUses: 0,
          createdBy: 'admin@sunnymeadows.com',
          createdAt: new Date().toISOString(),
          isActive: true
        }
      },
      
      // Settings collection - UPDATED with communityId (community-specific settings)
      settings: {
        'sunny-meadows-config': {
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
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        'golden-heights-config': {
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
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      }
    };

    return {
      success: true,
      message: 'Multi-tenant database schema ready for manual setup',
      instructions: 'Please copy the data structure below to your Firebase console manually. Note: All collections now include communityId for data isolation.',
      data: databaseStructure,
      collections: {
        communities: 2,
        invites: 2,
        amenities: 4,
        accessCodes: 3,
        settings: 2
      },
      multiTenancy: {
        enabled: true,
        communities: ['sunny-meadows', 'golden-heights'],
        note: 'All user data, bookings, amenities, and settings are now isolated by communityId'
      }
    };

  } catch (error) {
    console.error('Setup error:', error);
    return {
      success: false,
      error: 'Setup preparation failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

export async function POST(request: NextRequest) {
  try {
    const result = await setupDatabaseWithAuth();
    
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
  try {
    // Create the specific access code from the screenshot
    const accessCode = 'EOOACJSV';
    
    await setDoc(doc(db, 'accessCodes', accessCode), {
      communityId: 'sunny-meadows',
      isUsed: false,
      createdAt: serverTimestamp(),
      type: 'resident',
      description: 'Resident access code for Sunny Meadows Community'
    });

    // Also create a test community document
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

    return NextResponse.json({
      success: true,
      message: 'Access code and community setup completed',
      accessCode: accessCode,
      communityId: 'sunny-meadows'
    });
  } catch (error) {
    console.error('Error in manual setup:', error);
    return NextResponse.json({
      error: 'Manual setup failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}