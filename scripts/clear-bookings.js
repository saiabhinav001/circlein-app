/**
 * Script to safely clear all bookings from Firestore
 * Keeps the collection structure intact
 * Use with caution in production!
 * 
 * Run with: node scripts/clear-bookings.js
 */

const admin = require('firebase-admin');

// Initialize Firebase Admin with environment variables
admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
  })
});

const db = admin.firestore();

async function clearAllBookings() {
  try {
    console.log('\n⚠️  WARNING: This will delete ALL bookings from the database!');
    console.log('📊 Counting bookings...\n');

    // First, count all bookings
    const bookingsSnapshot = await db.collection('bookings').get();
    const totalBookings = bookingsSnapshot.size;

    console.log(`📋 Found ${totalBookings} booking(s) to delete.\n`);

    if (totalBookings === 0) {
      console.log('✅ No bookings to delete. Database is already clear.');
      process.exit(0);
    }

    console.log('🗑️  Starting deletion process...\n');

    // Delete in batches to avoid memory issues
    const batchSize = 500;
    let deletedCount = 0;

    while (true) {
      // Get a batch of documents
      const snapshot = await db.collection('bookings')
        .limit(batchSize)
        .get();

      if (snapshot.size === 0) {
        break;
      }

      // Delete documents in batch
      const batch = db.batch();
      snapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
      });

      await batch.commit();
      deletedCount += snapshot.size;

      console.log(`✓ Deleted ${deletedCount}/${totalBookings} bookings...`);
    }

    console.log('\n✅ SUCCESS! All bookings have been deleted.');
    console.log(`📊 Total deleted: ${deletedCount} booking(s)`);
    console.log('📁 Collection "bookings" structure is preserved.');
    console.log('\n🔄 Your booking statistics will update in real-time automatically!');

    process.exit(0);

  } catch (error) {
    console.error('\n❌ Error deleting bookings:', error);
    console.error('Make sure you have set FIREBASE_PRIVATE_KEY and FIREBASE_CLIENT_EMAIL in your .env file');
    process.exit(1);
  }
}

// Run the script
clearAllBookings();
