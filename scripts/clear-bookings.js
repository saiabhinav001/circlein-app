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

    // First, count all bookings
    const bookingsSnapshot = await db.collection('bookings').get();
    const totalBookings = bookingsSnapshot.size;


    if (totalBookings === 0) {
      process.exit(0);
    }


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

    }


    process.exit(0);

  } catch (error) {
    console.error('Make sure you have set FIREBASE_PRIVATE_KEY and FIREBASE_CLIENT_EMAIL in your .env file');
    process.exit(1);
  }
}

// Run the script
clearAllBookings();
