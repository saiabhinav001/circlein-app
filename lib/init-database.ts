import { db } from './firebase';
import { collection, doc, setDoc, serverTimestamp } from 'firebase/firestore';

// Sample data for database initialization
const sampleData = {
  // Users collection
  users: {
    'admin@circlein.com': {
      name: 'CircleIn Admin',
      email: 'admin@circlein.com',
      role: 'admin',
      phoneNumber: '+1234567890',
      unitNumber: 'Admin',
      preferences: {
        notifications: true,
        emailUpdates: true
      },
      createdAt: serverTimestamp(),
      lastLogin: serverTimestamp(),
      isActive: true
    },
    'resident@example.com': {
      name: 'Jane Smith',
      email: 'resident@example.com',
      role: 'resident',
      phoneNumber: '+1234567891',
      unitNumber: 'B205',
      preferences: {
        notifications: true,
        emailUpdates: false
      },
      createdAt: serverTimestamp(),
      lastLogin: serverTimestamp(),
      isActive: true
    }
  },

  // Amenities collection
  amenities: {
    'swimming-pool': {
      name: 'Swimming Pool',
      description: 'Olympic-sized swimming pool with heating system and lifeguard on duty',
      category: 'Recreation',
      imageUrl: 'https://images.pexels.com/photos/261102/pexels-photo-261102.jpeg?auto=compress&cs=tinysrgb&w=600',
      capacity: 20,
      location: 'Building A - Level 1',
      amenityId: 'swimming-pool',
      rules: {
        maxSlotsPerFamily: 2,
        maxDurationHours: 2,
        advanceBookingDays: 14,
        blackoutDates: [],
        requiresDeposit: false,
        depositAmount: 0
      },
      availability: {
        monday: { start: '06:00', end: '22:00', slots: ['06:00', '08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00'] },
        tuesday: { start: '06:00', end: '22:00', slots: ['06:00', '08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00'] },
        wednesday: { start: '06:00', end: '22:00', slots: ['06:00', '08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00'] },
        thursday: { start: '06:00', end: '22:00', slots: ['06:00', '08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00'] },
        friday: { start: '06:00', end: '22:00', slots: ['06:00', '08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00'] },
        saturday: { start: '08:00', end: '20:00', slots: ['08:00', '10:00', '12:00', '14:00', '16:00', '18:00'] },
        sunday: { start: '08:00', end: '20:00', slots: ['08:00', '10:00', '12:00', '14:00', '16:00', '18:00'] }
      },
      isActive: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    },
    'gym': {
      name: 'Fitness Center',
      description: 'Fully equipped gym with cardio machines, weights, and exercise classes',
      category: 'Fitness',
      imageUrl: 'https://images.pexels.com/photos/1552242/pexels-photo-1552242.jpeg?auto=compress&cs=tinysrgb&w=600',
      capacity: 15,
      location: 'Building B - Level 2',
      amenityId: 'gym',
      rules: {
        maxSlotsPerFamily: 3,
        maxDurationHours: 2,
        advanceBookingDays: 7,
        blackoutDates: [],
        requiresDeposit: false,
        depositAmount: 0
      },
      availability: {
        monday: { start: '05:00', end: '23:00', slots: ['05:00', '07:00', '09:00', '11:00', '13:00', '15:00', '17:00', '19:00', '21:00'] },
        tuesday: { start: '05:00', end: '23:00', slots: ['05:00', '07:00', '09:00', '11:00', '13:00', '15:00', '17:00', '19:00', '21:00'] },
        wednesday: { start: '05:00', end: '23:00', slots: ['05:00', '07:00', '09:00', '11:00', '13:00', '15:00', '17:00', '19:00', '21:00'] },
        thursday: { start: '05:00', end: '23:00', slots: ['05:00', '07:00', '09:00', '11:00', '13:00', '15:00', '17:00', '19:00', '21:00'] },
        friday: { start: '05:00', end: '23:00', slots: ['05:00', '07:00', '09:00', '11:00', '13:00', '15:00', '17:00', '19:00', '21:00'] },
        saturday: { start: '07:00', end: '21:00', slots: ['07:00', '09:00', '11:00', '13:00', '15:00', '17:00', '19:00'] },
        sunday: { start: '07:00', end: '21:00', slots: ['07:00', '09:00', '11:00', '13:00', '15:00', '17:00', '19:00'] }
      },
      isActive: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    },
    'clubhouse': {
      name: 'Community Clubhouse',
      description: 'Multi-purpose room perfect for parties, meetings, and events',
      category: 'Meeting',
      imageUrl: 'https://images.pexels.com/photos/1181406/pexels-photo-1181406.jpeg?auto=compress&cs=tinysrgb&w=600',
      capacity: 50,
      location: 'Building C - Level 1',
      amenityId: 'clubhouse',
      rules: {
        maxSlotsPerFamily: 1,
        maxDurationHours: 4,
        advanceBookingDays: 30,
        blackoutDates: [],
        requiresDeposit: true,
        depositAmount: 100
      },
      availability: {
        monday: { start: '09:00', end: '22:00', slots: ['09:00', '13:00', '17:00'] },
        tuesday: { start: '09:00', end: '22:00', slots: ['09:00', '13:00', '17:00'] },
        wednesday: { start: '09:00', end: '22:00', slots: ['09:00', '13:00', '17:00'] },
        thursday: { start: '09:00', end: '22:00', slots: ['09:00', '13:00', '17:00'] },
        friday: { start: '09:00', end: '23:00', slots: ['09:00', '13:00', '17:00', '21:00'] },
        saturday: { start: '10:00', end: '23:00', slots: ['10:00', '14:00', '18:00'] },
        sunday: { start: '10:00', end: '22:00', slots: ['10:00', '14:00', '18:00'] }
      },
      isActive: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    },
    'tennis-court': {
      name: 'Tennis Court',
      description: 'Professional tennis court with lighting for evening play',
      category: 'Outdoor',
      imageUrl: 'https://images.pexels.com/photos/209977/pexels-photo-209977.jpeg?auto=compress&cs=tinysrgb&w=600',
      capacity: 4,
      location: 'Outdoor Area - Level 1',
      amenityId: 'tennis-court',
      rules: {
        maxSlotsPerFamily: 2,
        maxDurationHours: 1,
        advanceBookingDays: 7,
        blackoutDates: [],
        requiresDeposit: false,
        depositAmount: 0
      },
      availability: {
        monday: { start: '06:00', end: '21:00', slots: ['06:00', '07:00', '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00'] },
        tuesday: { start: '06:00', end: '21:00', slots: ['06:00', '07:00', '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00'] },
        wednesday: { start: '06:00', end: '21:00', slots: ['06:00', '07:00', '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00'] },
        thursday: { start: '06:00', end: '21:00', slots: ['06:00', '07:00', '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00'] },
        friday: { start: '06:00', end: '21:00', slots: ['06:00', '07:00', '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00'] },
        saturday: { start: '07:00', end: '20:00', slots: ['07:00', '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00'] },
        sunday: { start: '07:00', end: '20:00', slots: ['07:00', '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00'] }
      },
      isActive: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    }
  },

  // Access codes collection
  accessCodes: {
    'CIRCLE2025': {
      code: 'CIRCLE2025',
      description: 'General access code for 2025 residents',
      isUsed: false,
      usedBy: '',
      usedAt: null,
      expiryDate: '2025-12-31',
      maxUses: 100,
      currentUses: 0,
      createdBy: 'admin@circlein.com',
      createdAt: serverTimestamp(),
      isActive: true
    },
    'NEWRESIDENT': {
      code: 'NEWRESIDENT',
      description: 'Access code for new residents',
      isUsed: false,
      usedBy: '',
      usedAt: null,
      expiryDate: '2025-12-31',
      maxUses: 50,
      currentUses: 0,
      createdBy: 'admin@circlein.com',
      createdAt: serverTimestamp(),
      isActive: true
    },
    'FAMILY2025': {
      code: 'FAMILY2025',
      description: 'Family access code',
      isUsed: false,
      usedBy: '',
      usedAt: null,
      expiryDate: '2025-12-31',
      maxUses: 1,
      currentUses: 0,
      createdBy: 'admin@circlein.com',
      createdAt: serverTimestamp(),
      isActive: true
    }
  },

  // Settings collection
  settings: {
    'app-config': {
      appName: 'CircleIn',
      version: '1.0.0',
      maintenanceMode: false,
      maintenanceMessage: '',
      maxBookingsPerUser: 5,
      defaultBookingDuration: 2,
      cancellationPolicy: {
        allowCancellation: true,
        cancellationDeadlineHours: 24,
        refundPolicy: 'Full refund if cancelled 24 hours before'
      },
      notifications: {
        bookingConfirmation: true,
        bookingReminder: true,
        cancellationNotice: true,
        reminderHoursBefore: 2
      },
      operatingHours: {
        weekdays: { start: '06:00', end: '23:00' },
        weekends: { start: '08:00', end: '22:00' }
      },
      contactInfo: {
        email: 'support@circlein.com',
        phone: '+1-234-567-8900',
        address: '123 Community Street, City, State 12345'
      },
      updatedAt: serverTimestamp(),
      updatedBy: 'admin@circlein.com'
    }
  }
};

// Function to initialize the database
export async function initializeDatabase() {
  try {
    console.log('🚀 Starting database initialization...');

    // Create users
    console.log('📝 Creating users...');
    for (const [docId, userData] of Object.entries(sampleData.users)) {
      await setDoc(doc(db, 'users', docId), userData);
      console.log(`✅ Created user: ${userData.name}`);
    }

    // Create amenities
    console.log('🏊 Creating amenities...');
    for (const [docId, amenityData] of Object.entries(sampleData.amenities)) {
      await setDoc(doc(db, 'amenities', docId), amenityData);
      console.log(`✅ Created amenity: ${amenityData.name}`);
    }

    // Create access codes
    console.log('🔑 Creating access codes...');
    for (const [docId, codeData] of Object.entries(sampleData.accessCodes)) {
      await setDoc(doc(db, 'accessCodes', docId), codeData);
      console.log(`✅ Created access code: ${codeData.code}`);
    }

    // Create settings
    console.log('⚙️ Creating app settings...');
    for (const [docId, settingsData] of Object.entries(sampleData.settings)) {
      await setDoc(doc(db, 'settings', docId), settingsData);
      console.log(`✅ Created settings: ${settingsData.appName}`);
    }

    console.log('🎉 Database initialization completed successfully!');
    console.log('📋 Created collections: users, amenities, accessCodes, settings');
    console.log('🎯 Your CircleIn app is now ready to use!');

    return {
      success: true,
      message: 'Database initialized successfully',
      collections: ['users', 'amenities', 'accessCodes', 'settings']
    };

  } catch (error) {
    console.error('❌ Error initializing database:', error);
    return {
      success: false,
      message: 'Failed to initialize database',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Function to create sample bookings (run after users and amenities are created)
export async function createSampleBookings() {
  try {
    console.log('📅 Creating sample bookings...');

    const bookings = [
      {
        bookingId: 'booking_001',
        userEmail: 'resident@example.com',
        userName: 'Jane Smith',
        amenityId: 'swimming-pool',
        amenityName: 'Swimming Pool',
        bookingDate: '2025-10-01',
        timeSlot: '14:00',
        duration: 2,
        endTime: '16:00',
        status: 'confirmed',
        guestCount: 2,
        totalGuests: 3,
        guestNames: ['John Smith', 'Baby Smith'],
        specialRequests: '',
        bookingType: 'regular',
        depositPaid: 0,
        paymentStatus: 'free',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        cancelledAt: null,
        cancelReason: '',
        adminNotes: ''
      },
      {
        bookingId: 'booking_002',
        userEmail: 'admin@circlein.com',
        userName: 'CircleIn Admin',
        amenityId: 'clubhouse',
        amenityName: 'Community Clubhouse',
        bookingDate: '2025-10-05',
        timeSlot: '17:00',
        duration: 4,
        endTime: '21:00',
        status: 'confirmed',
        guestCount: 25,
        totalGuests: 26,
        guestNames: [],
        specialRequests: 'Birthday party setup needed',
        bookingType: 'regular',
        depositPaid: 100,
        paymentStatus: 'paid',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        cancelledAt: null,
        cancelReason: '',
        adminNotes: 'Deposit received via bank transfer'
      }
    ];

    for (const bookingData of bookings) {
      const bookingRef = doc(collection(db, 'bookings'));
      await setDoc(bookingRef, bookingData);
      console.log(`✅ Created booking: ${bookingData.bookingId}`);
    }

    console.log('🎉 Sample bookings created successfully!');
    return { success: true, message: 'Sample bookings created' };

  } catch (error) {
    console.error('❌ Error creating sample bookings:', error);
    return { 
      success: false, 
      message: 'Failed to create sample bookings', 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}