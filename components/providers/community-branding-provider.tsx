'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useSession } from 'next-auth/react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { resolveTimeZone } from '@/lib/timezone';

interface CommunityTheme {
  primaryColor: string;
  accentColor: string;
  logoUrl: string;
  communityName: string;
}

interface CommunityBrandingContextValue {
  theme: CommunityTheme;
  timeZone: string;
}

const DEFAULT_THEME: CommunityTheme = {
  primaryColor: '#10b981',
  accentColor: '#0ea5e9',
  logoUrl: '',
  communityName: 'CircleIn Community',
};

const CommunityBrandingContext = createContext<CommunityBrandingContextValue>({
  theme: DEFAULT_THEME,
  timeZone: resolveTimeZone(undefined, 'UTC'),
});

export function useCommunityBranding() {
  return useContext(CommunityBrandingContext);
}

export function useCommunityTimeZone() {
  return useCommunityBranding().timeZone;
}

export function CommunityBrandingProvider({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const [theme, setTheme] = useState<CommunityTheme>(DEFAULT_THEME);
  const [timeZone, setTimeZone] = useState<string>(resolveTimeZone(undefined, 'UTC'));

  useEffect(() => {
    const communityId = (session?.user as any)?.communityId;
    if (!communityId) {
      setTheme(DEFAULT_THEME);
      setTimeZone(resolveTimeZone(undefined, 'UTC'));
      return;
    }

    const settingsRef = doc(db, 'settings', communityId);
    const unsubscribe = onSnapshot(
      settingsRef,
      (snapshot) => {
        const data = snapshot.data() as any;
        const incoming = data?.theme || {};
        const configuredTimeZone = data?.community?.timezone || data?.timezone;
        setTheme({
          primaryColor: incoming.primaryColor || DEFAULT_THEME.primaryColor,
          accentColor: incoming.accentColor || DEFAULT_THEME.accentColor,
          logoUrl: incoming.logoUrl || DEFAULT_THEME.logoUrl,
          communityName: incoming.communityName || (session?.user as any)?.communityName || DEFAULT_THEME.communityName,
        });
        setTimeZone(resolveTimeZone(configuredTimeZone, Intl.DateTimeFormat().resolvedOptions().timeZone));
      },
      (error) => {
        console.warn('Community branding permissions unavailable, using defaults:', error);
        setTheme({
          ...DEFAULT_THEME,
          communityName: (session?.user as any)?.communityName || DEFAULT_THEME.communityName,
        });
        setTimeZone(resolveTimeZone(undefined, Intl.DateTimeFormat().resolvedOptions().timeZone));
      }
    );

    return () => unsubscribe();
  }, [session?.user]);

  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--community-primary', theme.primaryColor);
    root.style.setProperty('--community-accent', theme.accentColor);
  }, [theme.primaryColor, theme.accentColor]);

  const value = useMemo(() => ({ theme, timeZone }), [theme, timeZone]);

  return <CommunityBrandingContext.Provider value={value}>{children}</CommunityBrandingContext.Provider>;
}
