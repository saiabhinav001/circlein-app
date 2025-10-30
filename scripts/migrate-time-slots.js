// Migration script to set default time slots for all amenities
// Run with: node scripts/migrate-time-slots.js

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Initialize Firebase Admin
const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS || 
                           path.join(__dirname, '..', 'serviceAccountKey.json');

if (!fs.existsSync(serviceAccountPath)) {
  console.error('❌ Service account key not found!');
  console.error('Please set GOOGLE_APPLICATION_CREDENTIALS or add serviceAccountKey.json');
  process.exit(1);
}

const serviceAccount = require(serviceAccountPath);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// Default time slot configurations by category
const DEFAULT_CONFIGURATIONS = {
  'gym': {
    weekdayHours: { start: '06:00', end: '22:00' },
    weekendHours: { start: '08:00', end: '20:00' },
    slotDuration: 2,
    description: 'Gym - Early morning to late evening'
  },
  'pool': {
    weekdayHours: { start: '06:00', end: '21:00' },
    weekendHours: { start: '08:00', end: '19:00' },
    slotDuration: 2,
    description: 'Swimming Pool - Extended hours'
  },
  'clubhouse': {
    weekdayHours: { start: '09:00', end: '21:00' },
    weekendHours: { start: '10:00', end: '22:00' },
    slotDuration: 3,
    description: 'Clubhouse - 3-hour slots'
  },
  'party hall': {
    timeSlots: ['10:00-14:00', '15:00-19:00', '20:00-00:00'],
    description: 'Party Hall - Morning, Evening, Night slots'
  },
  'tennis court': {
    weekdaySlots: ['06:00-08:00', '08:00-10:00', '17:00-19:00', '19:00-21:00'],
    weekendSlots: ['08:00-10:00', '10:00-12:00', '14:00-16:00', '16:00-18:00', '18:00-20:00'],
    description: 'Tennis Court - Peak hours focus'
  },
  'badminton court': {
    weekdaySlots: ['06:00-08:00', '08:00-10:00', '17:00-19:00', '19:00-21:00'],
    weekendSlots: ['08:00-10:00', '10:00-12:00', '14:00-16:00', '16:00-18:00', '18:00-20:00'],
    description: 'Badminton Court - Peak hours focus'
  },
  'default': {
    operatingHours: { start: '09:00', end: '21:00' },
    slotDuration: 2,
    description: 'Default - 2-hour slots, 9 AM to 9 PM'
  }
};

async function migrateTimeSlots() {
  console.log('🚀 Starting time slots migration...\n');
  
  try {
    // Get all amenities
    const amenitiesSnapshot = await db.collection('amenities').get();
    
    if (amenitiesSnapshot.empty) {
      console.log('⚠️  No amenities found in database');
      return;
    }
    
    console.log(`📊 Found ${amenitiesSnapshot.size} amenities\n`);
    
    let updated = 0;
    let skipped = 0;
    let errors = 0;
    
    const batch = db.batch();
    
    for (const doc of amenitiesSnapshot.docs) {
      const amenity = doc.data();
      const amenityId = doc.id;
      const category = (amenity.category || 'default').toLowerCase();
      
      // Skip if already has time slot configuration
      if (amenity.timeSlots || amenity.weekdaySlots || amenity.weekendSlots || 
          amenity.operatingHours || amenity.weekdayHours || amenity.weekendHours) {
        console.log(`⏭️  Skipping "${amenity.name}" - Already configured`);
        skipped++;
        continue;
      }
      
      // Get configuration for category
      const config = DEFAULT_CONFIGURATIONS[category] || DEFAULT_CONFIGURATIONS['default'];
      
      // Prepare update data
      const updateData = { ...config };
      delete updateData.description; // Don't store description
      
      // Add to batch
      batch.update(doc.ref, updateData);
      
      console.log(`✅ Queued "${amenity.name}" (${category})`);
      console.log(`   ${config.description}`);
      if (config.timeSlots) {
        console.log(`   Custom slots: ${config.timeSlots.join(', ')}`);
      } else if (config.weekdaySlots) {
        console.log(`   Weekday: ${config.weekdaySlots.length} slots`);
        console.log(`   Weekend: ${config.weekendSlots?.length || 0} slots`);
      } else if (config.weekdayHours) {
        console.log(`   Weekday: ${config.weekdayHours.start}-${config.weekdayHours.end}`);
        console.log(`   Weekend: ${config.weekendHours?.start}-${config.weekendHours?.end}`);
        console.log(`   Duration: ${config.slotDuration} hours`);
      } else {
        console.log(`   Hours: ${config.operatingHours?.start}-${config.operatingHours?.end}`);
        console.log(`   Duration: ${config.slotDuration} hours`);
      }
      console.log('');
      
      updated++;
    }
    
    if (updated > 0) {
      console.log(`\n💾 Committing ${updated} updates to Firestore...`);
      await batch.commit();
      console.log('✅ Batch commit successful!\n');
    }
    
    // Summary
    console.log('═══════════════════════════════════════');
    console.log('📊 MIGRATION SUMMARY');
    console.log('═══════════════════════════════════════');
    console.log(`✅ Updated: ${updated}`);
    console.log(`⏭️  Skipped: ${skipped}`);
    console.log(`❌ Errors: ${errors}`);
    console.log('═══════════════════════════════════════\n');
    
    if (updated > 0) {
      console.log('🎉 Migration completed successfully!');
      console.log('📱 Time slots will now update in real-time on all booking pages');
    } else {
      console.log('ℹ️  No amenities needed migration');
    }
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run migration
migrateTimeSlots()
  .then(() => {
    console.log('\n✅ Script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });
