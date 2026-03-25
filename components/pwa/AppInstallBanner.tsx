'use client';

import { useEffect, useState } from 'react';
import { Download, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

const INSTALL_BANNER_DISMISS_UNTIL_KEY = 'circlein-install-banner-dismissed-until';
const INSTALL_BANNER_INSTALLED_KEY = 'circlein-pwa-installed';
const INSTALL_BANNER_LAST_SHOWN_AT_KEY = 'circlein-install-banner-last-shown-at';
const INSTALL_BANNER_SESSION_SUPPRESS_KEY = 'circlein-install-banner-suppressed-session';
const BANNER_COOLDOWN_MS = 1000 * 60 * 60 * 24 * 30;
const REPEAT_GUARD_MS = 1000 * 60 * 60 * 24 * 3;

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
};

export default function AppInstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [hidden, setHidden] = useState(true);

  useEffect(() => {
    const shouldSuppress = () => {
      const sessionSuppressed = sessionStorage.getItem(INSTALL_BANNER_SESSION_SUPPRESS_KEY) === 'true';
      if (sessionSuppressed) {
        return true;
      }

      const dismissedUntilRaw = localStorage.getItem(INSTALL_BANNER_DISMISS_UNTIL_KEY);
      const dismissedUntil = dismissedUntilRaw ? Number(dismissedUntilRaw) : 0;
      if (dismissedUntil && Date.now() < dismissedUntil) {
        return true;
      }

      const lastShownAtRaw = localStorage.getItem(INSTALL_BANNER_LAST_SHOWN_AT_KEY);
      const lastShownAt = lastShownAtRaw ? Number(lastShownAtRaw) : 0;
      if (lastShownAt && Date.now() - lastShownAt < REPEAT_GUARD_MS) {
        return true;
      }

      return false;
    };

    const showBanner = (event: BeforeInstallPromptEvent) => {
      setDeferredPrompt(event);
      setHidden(false);
      localStorage.setItem(INSTALL_BANNER_LAST_SHOWN_AT_KEY, String(Date.now()));
      sessionStorage.setItem(INSTALL_BANNER_SESSION_SUPPRESS_KEY, 'true');
    };

    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true;
    if (isStandalone) {
      localStorage.setItem(INSTALL_BANNER_INSTALLED_KEY, 'true');
      return;
    }

    const alreadyInstalled = localStorage.getItem(INSTALL_BANNER_INSTALLED_KEY) === 'true';
    if (alreadyInstalled) {
      return;
    }

    const existingDeferred = (window as any).__circleinDeferredInstallPrompt as BeforeInstallPromptEvent | null;
    if (existingDeferred && !shouldSuppress()) {
      showBanner(existingDeferred);
    }

    const handler = (event: Event) => {
      event.preventDefault();
      (window as any).__circleinDeferredInstallPrompt = event as BeforeInstallPromptEvent;

      if (shouldSuppress()) {
        return;
      }

      showBanner(event as BeforeInstallPromptEvent);
    };

    const installedHandler = () => {
      localStorage.setItem(INSTALL_BANNER_INSTALLED_KEY, 'true');
      localStorage.removeItem(INSTALL_BANNER_DISMISS_UNTIL_KEY);
      localStorage.removeItem(INSTALL_BANNER_LAST_SHOWN_AT_KEY);
      (window as any).__circleinDeferredInstallPrompt = null;
      setHidden(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handler);
    window.addEventListener('appinstalled', installedHandler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      window.removeEventListener('appinstalled', installedHandler);
    };
  }, []);

  if (hidden || !deferredPrompt) {
    return null;
  }

  return (
    <div className="fixed inset-x-0 bottom-3 z-[100100] px-3 sm:px-6">
      <div className="mx-auto flex max-w-xl items-center justify-between gap-3 rounded-2xl border border-slate-700 bg-slate-950/95 px-4 py-3 text-slate-100 shadow-2xl backdrop-blur">
        <div>
          <p className="text-sm font-semibold">Install CircleIn</p>
          <p className="text-xs text-slate-300">Get app-like access with offline support and notifications.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            className="h-8 bg-emerald-500 text-white hover:bg-emerald-600"
            onClick={async () => {
              await deferredPrompt.prompt();
              const result = await deferredPrompt.userChoice;
              if (result.outcome === 'accepted') {
                localStorage.setItem(INSTALL_BANNER_INSTALLED_KEY, 'true');
                localStorage.removeItem(INSTALL_BANNER_DISMISS_UNTIL_KEY);
                localStorage.removeItem(INSTALL_BANNER_LAST_SHOWN_AT_KEY);
                (window as any).__circleinDeferredInstallPrompt = null;
                setHidden(true);
                setDeferredPrompt(null);
              } else {
                localStorage.setItem(INSTALL_BANNER_DISMISS_UNTIL_KEY, String(Date.now() + BANNER_COOLDOWN_MS));
                (window as any).__circleinDeferredInstallPrompt = null;
                setHidden(true);
                setDeferredPrompt(null);
              }
            }}
          >
            <Download className="mr-1.5 h-3.5 w-3.5" /> Install
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8 text-slate-300 hover:text-white"
            onClick={() => {
              localStorage.setItem(INSTALL_BANNER_DISMISS_UNTIL_KEY, String(Date.now() + BANNER_COOLDOWN_MS));
              (window as any).__circleinDeferredInstallPrompt = null;
              setHidden(true);
              setDeferredPrompt(null);
            }}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
