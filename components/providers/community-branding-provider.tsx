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
  timeFormat: '12h' | '24h';
}

const DEFAULT_THEME: CommunityTheme = {
  primaryColor: '#10b981',
  accentColor: '#0ea5e9',
  logoUrl: '',
  communityName: 'CircleIn Community',
};

const CommunityBrandingContext = createContext<CommunityBrandingContextValue>({
  theme: DEFAULT_THEME,
  timeZone: resolveTimeZone(undefined, 'Asia/Kolkata'),
  timeFormat: '24h',
});

export function useCommunityBranding() {
  return useContext(CommunityBrandingContext);
}

export function useCommunityTimeZone() {
  return useCommunityBranding().timeZone;
}

export function useCommunityTimeFormat() {
  return useCommunityBranding().timeFormat;
}

export function CommunityBrandingProvider({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const [theme, setTheme] = useState<CommunityTheme>(DEFAULT_THEME);
  const [timeZone, setTimeZone] = useState<string>(resolveTimeZone(undefined, 'Asia/Kolkata'));
  const [timeFormat, setTimeFormat] = useState<'12h' | '24h'>('24h');

  useEffect(() => {
    const communityId = (session?.user as any)?.communityId;
    if (!communityId) {
      setTheme(DEFAULT_THEME);
      setTimeZone(resolveTimeZone(undefined, 'Asia/Kolkata'));
      setTimeFormat('24h');
      return;
    }

    const settingsRef = doc(db, 'settings', communityId);
    const unsubscribe = onSnapshot(
      settingsRef,
      (snapshot) => {
        const data = snapshot.data() as any;
        const incoming = data?.theme || {};
        const configuredTimeZone = resolveTimeZone(
          data?.community?.timezone || data?.timezone,
          'Asia/Kolkata'
        );
        const configuredTimeFormat = data?.community?.timeFormat || data?.timeFormat || '24h';
        setTheme({
          primaryColor: incoming.primaryColor || DEFAULT_THEME.primaryColor,
          accentColor: incoming.accentColor || DEFAULT_THEME.accentColor,
          logoUrl: incoming.logoUrl || DEFAULT_THEME.logoUrl,
          communityName: incoming.communityName || (session?.user as any)?.communityName || DEFAULT_THEME.communityName,
        });
        setTimeZone(configuredTimeZone);
        setTimeFormat(configuredTimeFormat === '12h' ? '12h' : '24h');
      },
      (error) => {
        console.warn('Community branding permissions unavailable, using defaults:', error);
        setTheme({
          ...DEFAULT_THEME,
          communityName: (session?.user as any)?.communityName || DEFAULT_THEME.communityName,
        });
        setTimeZone(resolveTimeZone(undefined, 'Asia/Kolkata'));
        setTimeFormat('24h');
      }
    );

    return () => unsubscribe();
  }, [session?.user]);

  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--community-primary', theme.primaryColor);
    root.style.setProperty('--community-accent', theme.accentColor);
  }, [theme.primaryColor, theme.accentColor]);

  const value = useMemo(() => ({ theme, timeZone, timeFormat }), [theme, timeZone, timeFormat]);

  return <CommunityBrandingContext.Provider value={value}>{children}</CommunityBrandingContext.Provider>;
}
