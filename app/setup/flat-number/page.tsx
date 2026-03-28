'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import UnitNumberSetup from '@/components/auth/flat-number-setup';

export default function UnitNumberSetupPage() {
  const { data: session } = useSession();
  const router = useRouter();

  const handleComplete = () => {
    router.push('/dashboard');
  };

  return (
    <UnitNumberSetup 
      userEmail={session?.user?.email || ''} 
      onComplete={handleComplete} 
    />
  );
}