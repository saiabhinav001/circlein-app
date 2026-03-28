'use client';

import { useFirebaseUserAuth } from '@/hooks/use-firebase-auth';
import { ReactNode } from 'react';

/**
 * Wrapper component that synchronizes NextAuth with Firebase Auth
 * This ensures Firestore rules work correctly by authenticating users with Firebase
 */
export function FirebaseAuthSync({ children }: { children: ReactNode }) {
  useFirebaseUserAuth();
  return <>{children}</>;
}
