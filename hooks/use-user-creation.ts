import { useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';

export function useSessionProvision() {
  const { data: session, status } = useSession();
  const requestSentRef = useRef(false);

  useEffect(() => {
    const createUserIfNeeded = async () => {
      if (status === 'authenticated' && session?.user?.email) {
        const email = session.user.email;
        const onceKey = `circlein:create-user:${email}`;

        // Prevent duplicate calls from React StrictMode and session refreshes.
        if (requestSentRef.current) {
          return;
        }

        if (typeof window !== 'undefined' && sessionStorage.getItem(onceKey) === '1') {
          requestSentRef.current = true;
          return;
        }

        requestSentRef.current = true;

        try {
          const response = await fetch('/api/create-user', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              name: session.user.name,
              email,
            }),
          });

          const data = await response.json();
          
          if (!response.ok) {
            console.error('Error creating user:', data.error);
          } else {
            console.log('User creation/update successful:', data.message);
            if (typeof window !== 'undefined') {
              sessionStorage.setItem(onceKey, '1');
            }
          }
        } catch (error) {
          requestSentRef.current = false;
          console.error('Error in user creation request:', error);
        }
      }
    };

    createUserIfNeeded();
  }, [session, status]);

  return { session, status };
}