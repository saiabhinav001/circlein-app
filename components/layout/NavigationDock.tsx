'use client';

import { useSession, signOut } from 'next-auth/react';
import { usePathname, useRouter } from 'next/navigation';
import { Home, BookOpen, Calendar, Bell, MessageCircle, Settings, Shield, Users, LogOut } from 'lucide-react';
import Dock, { DockItem } from '@/components/ui/Dock';
import { useTheme } from '@/components/providers/theme-provider';

export function NavigationDock() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const router = useRouter();
  const { theme } = useTheme();

  // Don't show dock on auth pages
  if (pathname?.startsWith('/auth') || pathname?.startsWith('/setup')) {
    return null;
  }

  const handleNavigation = (href: string) => {
    router.push(href);
  };

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/auth/signin' });
  };

  // Base navigation items for all users
  const baseItems: DockItem[] = [
    {
      icon: <Home size={20} />,
      label: 'Dashboard',
      onClick: () => handleNavigation('/dashboard'),
      isActive: pathname === '/dashboard',
    },
    {
      icon: <BookOpen size={20} />,
      label: 'My Bookings',
      onClick: () => handleNavigation('/bookings'),
      isActive: pathname === '/bookings',
    },
    {
      icon: <Calendar size={20} />,
      label: 'Calendar',
      onClick: () => handleNavigation('/calendar'),
      isActive: pathname === '/calendar',
    },
    {
      icon: <Bell size={20} />,
      label: 'Notifications',
      onClick: () => handleNavigation('/notifications'),
      isActive: pathname === '/notifications',
    },
    {
      icon: <MessageCircle size={20} />,
      label: 'Contact',
      onClick: () => handleNavigation('/contact'),
      isActive: pathname === '/contact',
    },
  ];

  // Admin items
  const adminItems: DockItem[] = session?.user?.role === 'admin' ? [
    {
      icon: <Shield size={20} />,
      label: 'Admin Panel',
      onClick: () => handleNavigation('/admin'),
      isActive: pathname?.startsWith('/admin') && pathname === '/admin',
    },
    {
      icon: <Users size={20} />,
      label: 'Users',
      onClick: () => handleNavigation('/admin/users'),
      isActive: pathname === '/admin/users',
    },
  ] : [];

  // Settings and logout
  const utilityItems: DockItem[] = [
    {
      icon: <Settings size={20} />,
      label: session?.user?.role === 'admin' ? 'Admin Settings' : 'Settings',
      onClick: () => handleNavigation(session?.user?.role === 'admin' ? '/admin/settings' : '/settings'),
      isActive: pathname === '/settings' || pathname === '/admin/settings',
    },
    {
      icon: <LogOut size={20} />,
      label: 'Sign Out',
      onClick: handleSignOut,
      isActive: false,
    },
  ];

  const allItems = [...baseItems, ...adminItems, ...utilityItems];

  return (
    <Dock
      items={allItems}
      panelHeight={68}
      baseItemSize={50}
      magnification={70}
    />
  );
}
