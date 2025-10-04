'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { signInWithCustomToken } from 'firebase/auth';
import { auth } from '@/lib/firebase';

/**
 * This hook synchronizes NextAuth session with Firebase Auth
 * It ensures that when a user is authenticated via NextAuth,
 * they are also authenticated with Firebase so Firestore rules work correctly
 */
export function useFirebaseAuth() {
  const { data: session, status } = useSession();

  useEffect(() => {
    async function syncFirebaseAuth() {
      if (status === 'authenticated' && session?.user?.email) {
        try {
          // Check if user is already signed in to Firebase
          if (auth.currentUser?.email === session.user.email) {
            console.log('✅ Firebase Auth already synced:', session.user.email);
            return;
          }

          // Get custom token from our API
          console.log('🔄 Syncing Firebase Auth for:', session.user.email);
          const response = await fetch('/api/auth/firebase-token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
          });

          if (response.ok) {
            const { token } = await response.json();
            
            // Sign in to Firebase with custom token
            await signInWithCustomToken(auth, token);
            console.log('✅ Firebase Auth synced successfully');
          } else {
            console.error('❌ Failed to get Firebase custom token');
          }
        } catch (error) {
          console.error('❌ Error syncing Firebase Auth:', error);
        }
      } else if (status === 'unauthenticated') {
        // Sign out from Firebase when NextAuth session ends
        if (auth.currentUser) {
          await auth.signOut();
          console.log('🚪 Signed out from Firebase Auth');
        }
      }
    }

    syncFirebaseAuth();
  }, [session, status]);
}
