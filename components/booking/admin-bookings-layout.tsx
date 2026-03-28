'use client';

import React from 'react';
import { useSession } from 'next-auth/react';
import BookingsUI from './bookings-ui';

export default function BookingsAdminLayout() {
  const { data: session } = useSession();

  const isAdmin = session?.user?.role === 'admin' || session?.user?.role === 'super_admin';

  if (!isAdmin) {
    // Regular users only see their own bookings
    return <BookingsUI isAdmin={false} />;
  }

  // Admins only see all community bookings (removed dual tabs)
  return <BookingsUI isAdmin={true} />;
}