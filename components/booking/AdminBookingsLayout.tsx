'use client';

import React from 'react';
import { useSession } from 'next-auth/react';
import Fortune500BookingsUI from './Fortune500BookingsUI';

export default function AdminBookingsLayout() {
  const { data: session } = useSession();

  const isAdmin = session?.user?.role === 'admin' || session?.user?.role === 'super_admin';

  if (!isAdmin) {
    // Regular users only see their own bookings
    return <Fortune500BookingsUI isAdmin={false} />;
  }

  // Admins only see all community bookings (removed dual tabs)
  return <Fortune500BookingsUI isAdmin={true} />;
}