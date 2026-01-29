'use client';

import { useFirebaseAuth } from '@/hooks/useFirebaseAuth';
import { ReactNode } from 'react';

/**
 * Wrapper component that synchronizes NextAuth with Firebase Auth
 * This ensures Firestore rules work correctly by authenticating users with Firebase
 */
export function FirebaseAuthSync({ children }: { children: ReactNode }) {
  useFirebaseAuth();
  return <>{children}</>;
}
