'use client';

import { useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

/**
 * UserValidationGuard Component
 * 
 * This component runs on every protected page and validates that the user
 * still exists in the database. If the user has been deleted by an admin,
 * it immediately signs them out and redirects to the sign-in page.
 * 
 * Usage: Add to the root layout or any protected pages
 */
export function UserValidationGuard() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    // Only run validation if user is authenticated
    if (status !== 'authenticated' || !session?.user?.email) {
      return;
    }

    let isComponentMounted = true;

    const validateUser = async () => {
      try {
        const response = await fetch('/api/auth/validate-user', {
          method: 'GET',
          cache: 'no-store', // Always get fresh data
        });

        const data = await response.json();

        if (!isComponentMounted) return;

        // User has been deleted - force logout
        if (!data.exists || data.deleted) {
          console.log('🚨 User account deleted - forcing logout');
          
          // Show user notification
          toast.error('Your account has been removed by an administrator.', {
            duration: 5000,
          });

          // Force sign out
          await signOut({ 
            redirect: false,
            callbackUrl: '/auth/signin'
          });

          // Redirect to sign-in page
          router.push('/auth/signin');
        }
      } catch (error) {
        console.error('Error validating user:', error);
        // Don't force logout on network errors, only on explicit "user deleted" responses
      }
    };

    // Validate immediately on mount
    validateUser();

    // Validate periodically (every 30 seconds)
    const interval = setInterval(validateUser, 30000);

    return () => {
      isComponentMounted = false;
      clearInterval(interval);
    };
  }, [session, status, router]);

  // This component doesn't render anything
  return null;
}
