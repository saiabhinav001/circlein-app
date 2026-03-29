'use client';

import { useEffect, useMemo, useState } from 'react';
import type { ComponentType } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useCommunityTimeZone } from '@/components/providers/community-branding-provider';
import { useNotifications } from '@/components/notifications/notification-system';
import { KeyboardShortcutsHelp } from '@/components/layout/keyboard-shortcuts-help';
import { formatDateTimeInTimeZone } from '@/lib/timezone';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from '@/components/ui/command';
import {
  Calendar,
  Building2,
  Home,
  User,
  Settings,
  Shield,
  Bell,
  Hourglass,
  Clock,
  Search,
} from 'lucide-react';

type PaletteAction = {
  id: string;
  label: string;
  hint?: string;
  href: string;
  group: 'navigation' | 'admin';
  icon: ComponentType<{ className?: string }>;
  keywords?: string;
};

type AmenityOption = {
  id: string;
  name: string;
};

type BookingOption = {
  id: string;
  amenityName: string;
  startTime: Date;
};

const NAV_SHORTCUTS: Record<string, string> = {
  'nav-dashboard': 'D',
  'nav-bookings': 'B',
  'nav-calendar': 'C',
  'nav-settings': 'S',
};

export function GlobalCommandPalette() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const timeZone = useCommunityTimeZone();
  const { setIsOpen: setNotificationsOpen } = useNotifications();

  const [open, setOpen] = useState(false);
  const [shortcutsHelpOpen, setShortcutsHelpOpen] = useState(false);
  const [amenities, setAmenities] = useState<AmenityOption[]>([]);
  const [bookingCommands, setBookingCommands] = useState<BookingOption[]>([]);
  const [recentIds, setRecentIds] = useState<string[]>([]);

  const isAdmin = session?.user?.role === 'admin';

  useEffect(() => {
    const isTyping = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target) {
        return false;
      }

      const tagName = target.tagName.toLowerCase();
      if (target.isContentEditable) {
        return true;
      }

      if (tagName === 'input' || tagName === 'textarea' || tagName === 'select') {
        return true;
      }

      const role = target.getAttribute('role');
      return role === 'textbox' || role === 'combobox' || role === 'searchbox';
    };

    const onKeyDown = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();

      if ((event.metaKey || event.ctrlKey) && key === 'k') {
        event.preventDefault();
        setOpen(true);
        return;
      }

      if (event.metaKey || event.ctrlKey || event.altKey || isTyping(event)) {
        return;
      }

      if (key === 'd') {
        event.preventDefault();
        router.push('/dashboard');
        return;
      }

      if (key === 'b') {
        event.preventDefault();
        router.push('/bookings');
        return;
      }

      if (key === 'n') {
        event.preventDefault();
        setNotificationsOpen(true);
        return;
      }

      if (key === 's') {
        event.preventDefault();
        router.push(isAdmin ? '/admin/settings' : '/settings');
        return;
      }

      if (key === '?' || (key === '/' && event.shiftKey)) {
        event.preventDefault();
        setShortcutsHelpOpen(true);
      }
    };

    const onExternalOpen = () => setOpen(true);

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('circlein-open-command-palette', onExternalOpen);

    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('circlein-open-command-palette', onExternalOpen);
    };
  }, [isAdmin, router, setNotificationsOpen]);

  useEffect(() => {
    if (!session?.user?.email) return;
    const key = `command-palette-recent-${session.user.email}`;
    try {
      const parsed = JSON.parse(localStorage.getItem(key) || '[]');
      if (Array.isArray(parsed)) {
        setRecentIds(parsed.filter((item) => typeof item === 'string').slice(0, 8));
      }
    } catch {
      setRecentIds([]);
    }
  }, [session?.user?.email]);

  useEffect(() => {
    if (status !== 'authenticated' || !session?.user?.communityId) return;

    const loadDynamicCommands = async () => {
      try {
        const amenitiesQuery = query(
          collection(db, 'amenities'),
          where('communityId', '==', session.user.communityId)
        );
        const amenitiesSnapshot = await getDocs(amenitiesQuery);
        const amenityList = amenitiesSnapshot.docs
          .slice(0, 8)
          .map((docSnap) => ({ id: docSnap.id, name: String(docSnap.data().name || 'Amenity') }));
        setAmenities(amenityList);
      } catch {
        setAmenities([]);
      }

      try {
        const bookingsQuery = query(
          collection(db, 'bookings'),
          where('communityId', '==', session.user.communityId)
        );
        const bookingsSnapshot = await getDocs(bookingsQuery);

        const nextBookings = bookingsSnapshot.docs
          .map((docSnap) => ({ id: docSnap.id, ...(docSnap.data() as any) }))
          .filter((booking: any) => {
            if (booking.status !== 'confirmed') return false;
            if (!isAdmin && booking.userEmail !== session.user?.email) return false;
            if (!booking.startTime?.toDate) return false;
            return booking.startTime.toDate().getTime() > Date.now();
          })
          .sort((a: any, b: any) => a.startTime.toDate().getTime() - b.startTime.toDate().getTime())
          .slice(0, 6)
          .map((booking: any) => ({
            id: booking.id,
            amenityName: String(booking.amenityName || 'Amenity'),
            startTime: booking.startTime.toDate() as Date,
          }));

        setBookingCommands(nextBookings);
      } catch {
        setBookingCommands([]);
      }
    };

    void loadDynamicCommands();
  }, [isAdmin, session?.user?.communityId, session?.user?.email, status]);

  const staticActions = useMemo<PaletteAction[]>(
    () => [
      { id: 'nav-dashboard', label: 'Dashboard', href: '/dashboard', group: 'navigation', icon: Home, keywords: 'home overview' },
      { id: 'nav-bookings', label: 'Bookings', href: '/bookings', group: 'navigation', icon: Calendar, keywords: 'reservations' },
      { id: 'nav-calendar', label: 'Calendar', href: '/calendar', group: 'navigation', icon: Calendar, keywords: 'week day month schedule' },
      { id: 'nav-community', label: 'Community Feed', href: '/community', group: 'navigation', icon: Bell, keywords: 'announcements polls' },
      { id: 'nav-profile', label: 'Profile', href: '/profile', group: 'navigation', icon: User, keywords: 'account' },
      {
        id: 'nav-settings',
        label: isAdmin ? 'Admin Settings' : 'Settings',
        href: isAdmin ? '/admin/settings' : '/settings',
        group: 'navigation',
        icon: Settings,
        keywords: 'preferences notifications',
      },
      { id: 'admin-panel', label: 'Admin Panel', href: '/admin', group: 'admin', icon: Shield, keywords: 'users moderation', hint: 'Admin only' },
      { id: 'admin-waitlist', label: 'Waitlist Manager', href: '/admin/waitlist', group: 'admin', icon: Hourglass, keywords: 'promote queue', hint: 'Admin only' },
      { id: 'admin-maintenance', label: 'Maintenance Board', href: '/admin/maintenance', group: 'admin', icon: Building2, keywords: 'tickets requests', hint: 'Admin only' },
    ],
    [isAdmin]
  );

  const recentActionMap = useMemo(() => {
    const map = new Map<string, { label: string; href: string; icon: PaletteAction['icon']; subtitle?: string }>();

    staticActions.forEach((action) => {
      if (action.group === 'admin' && !isAdmin) return;
      map.set(action.id, { label: action.label, href: action.href, icon: action.icon, subtitle: action.hint });
    });

    amenities.forEach((amenity) => {
      map.set(`amenity-${amenity.id}`, {
        label: `Amenity: ${amenity.name}`,
        href: `/amenity/${amenity.id}`,
        icon: Building2,
      });
    });

    bookingCommands.forEach((booking) => {
      map.set(`booking-${booking.id}`, {
        label: `Booking: ${booking.amenityName}`,
        href: '/bookings',
        icon: Clock,
        subtitle: formatDateTimeInTimeZone(booking.startTime, timeZone, {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
        }),
      });
    });

    return map;
  }, [amenities, bookingCommands, isAdmin, staticActions, timeZone]);

  const persistRecent = (id: string) => {
    if (!session?.user?.email) return;
    const nextRecent = [id, ...recentIds.filter((item) => item !== id)].slice(0, 8);
    setRecentIds(nextRecent);
    localStorage.setItem(`command-palette-recent-${session.user.email}`, JSON.stringify(nextRecent));
  };

  const navigateTo = (id: string, href: string) => {
    persistRecent(id);
    setOpen(false);
    router.push(href);
  };

  const visibleNavigation = staticActions.filter((action) => action.group === 'navigation');
  const visibleAdmin = staticActions.filter((action) => action.group === 'admin' && isAdmin);

  return (
    <>
    <CommandDialog
      open={open}
      onOpenChange={setOpen}
      contentClassName="rounded-2xl"
      commandClassName="bg-white/95 dark:bg-slate-950/95"
    >
      <CommandInput
        className="text-[15px]"
        placeholder="Jump to pages, amenities, bookings, or admin tools..."
      />
      <CommandList className="max-h-[min(68vh,34rem)]">
        <CommandEmpty>No matching command found.</CommandEmpty>

        {recentIds.length > 0 && (
          <CommandGroup heading="Recent">
            {recentIds
              .map((id) => ({ id, data: recentActionMap.get(id) }))
              .filter((item): item is { id: string; data: { label: string; href: string; icon: PaletteAction['icon']; subtitle?: string } } => !!item.data)
              .map(({ id, data }) => {
                const Icon = data.icon;
                return (
                  <CommandItem key={id} value={`recent ${data.label}`} onSelect={() => navigateTo(id, data.href)}>
                    <Icon className="mr-2 h-4 w-4" />
                    <div className="flex flex-col">
                      <span>{data.label}</span>
                      {data.subtitle && <span className="text-xs text-slate-500">{data.subtitle}</span>}
                    </div>
                  </CommandItem>
                );
              })}
            <CommandSeparator />
          </CommandGroup>
        )}

        <CommandGroup heading="Navigation">
          {visibleNavigation.map((action) => {
            const Icon = action.icon;
            const shortcut = NAV_SHORTCUTS[action.id];
            return (
              <CommandItem
                key={action.id}
                value={`${action.label} ${action.keywords || ''}`}
                onSelect={() => navigateTo(action.id, action.href)}
              >
                <Icon className="mr-2 h-4 w-4" />
                <span>{action.label}</span>
                {shortcut && <CommandShortcut>{shortcut}</CommandShortcut>}
              </CommandItem>
            );
          })}
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Amenities">
          {amenities.length === 0 ? (
            <CommandItem value="no amenities" disabled>
              <Search className="mr-2 h-4 w-4" />
              <span>No amenities available</span>
            </CommandItem>
          ) : (
            amenities.map((amenity) => (
              <CommandItem
                key={amenity.id}
                value={`${amenity.name} amenity`}
                onSelect={() => navigateTo(`amenity-${amenity.id}`, `/amenity/${amenity.id}`)}
              >
                <Building2 className="mr-2 h-4 w-4" />
                <span>{amenity.name}</span>
              </CommandItem>
            ))
          )}
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading={isAdmin ? 'Upcoming Community Bookings' : 'Your Upcoming Bookings'}>
          {bookingCommands.length === 0 ? (
            <CommandItem value="no bookings" disabled>
              <Clock className="mr-2 h-4 w-4" />
              <span>No upcoming bookings</span>
            </CommandItem>
          ) : (
            bookingCommands.map((booking) => (
              <CommandItem
                key={booking.id}
                value={`${booking.amenityName} ${booking.startTime.toISOString()}`}
                onSelect={() => navigateTo(`booking-${booking.id}`, '/bookings')}
              >
                <Clock className="mr-2 h-4 w-4" />
                <div className="flex flex-col">
                  <span>{booking.amenityName}</span>
                  <span className="text-xs text-slate-500">
                    {formatDateTimeInTimeZone(booking.startTime, timeZone, {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              </CommandItem>
            ))
          )}
        </CommandGroup>

        {visibleAdmin.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Admin Actions">
              {visibleAdmin.map((action) => {
                const Icon = action.icon;
                return (
                  <CommandItem
                    key={action.id}
                    value={`${action.label} ${action.keywords || ''}`}
                    onSelect={() => navigateTo(action.id, action.href)}
                  >
                    <Icon className="mr-2 h-4 w-4" />
                    <span>{action.label}</span>
                    {action.hint && <CommandShortcut>{action.hint}</CommandShortcut>}
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </>
        )}
      </CommandList>
    </CommandDialog>
    <KeyboardShortcutsHelp
      open={shortcutsHelpOpen}
      onOpenChange={setShortcutsHelpOpen}
      isAdmin={isAdmin}
    />
    </>
  );
}
