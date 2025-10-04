'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import FlatNumberSetup from '@/components/auth/FlatNumberSetup';

export default function FlatNumberSetupPage() {
  const { data: session } = useSession();
  const router = useRouter();

  const handleComplete = () => {
    router.push('/dashboard');
  };

  return (
    <FlatNumberSetup 
      userEmail={session?.user?.email || ''} 
      onComplete={handleComplete} 
    />
  );
}