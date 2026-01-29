import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';

export function useUserCreation() {
  const { data: session, status } = useSession();

  useEffect(() => {
    const createUserIfNeeded = async () => {
      if (status === 'authenticated' && session?.user?.email) {
        try {
          const response = await fetch('/api/create-user', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              name: session.user.name,
              email: session.user.email,
            }),
          });

          const data = await response.json();
          
          if (!response.ok) {
            console.error('Error creating user:', data.error);
          } else {
            console.log('User creation/update successful:', data.message);
          }
        } catch (error) {
          console.error('Error in user creation request:', error);
        }
      }
    };

    createUserIfNeeded();
  }, [session, status]);

  return { session, status };
}