// CRITICAL: Admin Account Fix Script
// Run this with: node fix-admin-account.js

const { initializeApp } = require('firebase/app');
const { getFirestore, doc, setDoc, serverTimestamp } = require('firebase/firestore');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

async function fixAdminAccount() {
  console.log('🔧 Starting admin account fix...\n');

  try {
    // Initialize Firebase
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);

    const adminEmail = 'abhinav.sadineni@gmail.com';
    const communityId = 'sunny-meadows';

    console.log('📝 Creating/Updating user document...');
    
    // Create user document
    const userData = {
      email: adminEmail,
      name: 'Abhinav Sadineni',
      role: 'admin',
      communityId: communityId,
      authProvider: 'google',
      profileCompleted: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      lastLogin: serverTimestamp(),
    };

    await setDoc(doc(db, 'users', adminEmail), userData, { merge: true });
    console.log('✅ User document created/updated');

    console.log('\n📝 Creating invite document...');
    
    // Create invite document
    const inviteData = {
      email: adminEmail,
      communityId: communityId,
      role: 'admin',
      status: 'accepted',
      invitedBy: 'system',
      createdAt: serverTimestamp(),
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
    };

    await setDoc(doc(db, 'invites', 'admin-abhinav-sadineni-at-gmail-dot-com'), inviteData);
    console.log('✅ Invite document created');

    console.log('\n🎉 SUCCESS! Admin account fixed!\n');
    console.log('📋 Next steps:');
    console.log('   1. Sign out of CircleIn completely');
    console.log('   2. Clear browser cache (Ctrl+Shift+Delete)');
    console.log('   3. Sign back in with Google (abhinav.sadineni@gmail.com)');
    console.log('   4. You should land on dashboard with full admin access!\n');

  } catch (error) {
    console.error('❌ Error fixing admin account:', error);
    console.error('\nPlease check:');
    console.error('   - Firebase credentials in .env.local');
    console.error('   - Firebase security rules allow writes');
    console.error('   - You have installed: npm install firebase dotenv');
  }
}

fixAdminAccount();
