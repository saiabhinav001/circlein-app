'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSession } from 'next-auth/react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Button } from '@/components/ui/button';

type UserRole = 'resident' | 'admin';

interface TourStep {
  id: string;
  title: string;
  description: string;
  selector: string;
}

const RESIDENT_STEPS: TourStep[] = [
  {
    id: 'dashboard',
    title: 'Dashboard',
    description: 'Start from your dashboard to see amenity availability and updates at a glance.',
    selector: '[data-tour="sidebar-dashboard"]',
  },
  {
    id: 'bookings',
    title: 'My Bookings',
    description: 'Track current and past bookings, open QR access passes, and manage actions.',
    selector: '[data-tour="sidebar-bookings"]',
  },
  {
    id: 'calendar',
    title: 'Calendar',
    description: 'Use the calendar to discover open slots and make bookings quickly.',
    selector: '[data-tour="sidebar-calendar"]',
  },
  {
    id: 'search',
    title: 'Global Search',
    description: 'Search amenities and pages instantly from the top bar.',
    selector: '[data-tour="header-search"]',
  },
  {
    id: 'assistant',
    title: 'AI Assistant',
    description: 'Tap this button to book amenities by chat or voice with the assistant.',
    selector: '[data-tour="chat-widget-trigger"]',
  },
  {
    id: 'settings',
    title: 'Settings',
    description: 'Manage your preferences and restart this tour at any time from settings.',
    selector: '[data-tour="sidebar-settings"]',
  },
];

const ADMIN_STEPS: TourStep[] = [
  {
    id: 'admin-panel',
    title: 'Admin Panel',
    description: 'Open the admin panel to manage operations across your community.',
    selector: '[data-tour="sidebar-admin-panel"]',
  },
  {
    id: 'manage-users',
    title: 'Manage Users',
    description: 'Review residents, access, and account status from one place.',
    selector: '[data-tour="sidebar-admin-users"]',
  },
  {
    id: 'analytics',
    title: 'Analytics',
    description: 'Track utilization, trends, and performance in analytics dashboards.',
    selector: '[data-tour="sidebar-admin-analytics"]',
  },
  {
    id: 'search',
    title: 'Global Search',
    description: 'Find amenities, users, and key pages quickly with top search.',
    selector: '[data-tour="header-search"]',
  },
  {
    id: 'assistant',
    title: 'AI Assistant',
    description: 'Use the assistant for fast booking help, summaries, and quick actions.',
    selector: '[data-tour="chat-widget-trigger"]',
  },
  {
    id: 'admin-settings',
    title: 'Admin Settings',
    description: 'Configure community and system preferences, and relaunch this tour anytime.',
    selector: '[data-tour="sidebar-admin-settings"]',
  },
];

function getRole(sessionRole?: string): UserRole {
  return sessionRole === 'admin' ? 'admin' : 'resident';
}

function getTooltipPosition(rect: DOMRect | null) {
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;

  if (!rect) {
    return {
      top: viewportHeight / 2,
      left: viewportWidth / 2,
      transform: 'translate(-50%, -50%)',
      maxWidth: Math.min(420, viewportWidth - 32),
    };
  }

  const cardWidth = Math.min(420, viewportWidth - 24);
  const cardHeight = 210;

  let top = rect.bottom + 14;
  let left = rect.left;

  if (top + cardHeight > viewportHeight - 12) {
    top = rect.top - cardHeight - 14;
  }

  if (top < 12) {
    top = 12;
  }

  if (left + cardWidth > viewportWidth - 12) {
    left = viewportWidth - cardWidth - 12;
  }

  if (left < 12) {
    left = 12;
  }

  return {
    top,
    left,
    transform: 'none',
    maxWidth: cardWidth,
  };
}

export function ProductTour() {
  const { data: session } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [currentStep, setCurrentStep] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);

  const role = getRole(session?.user?.role);
  const steps = useMemo(() => (role === 'admin' ? ADMIN_STEPS : RESIDENT_STEPS), [role]);

  const updateTargetRect = useMemo(
    () => () => {
      const step = steps[currentStep];
      if (!step) {
        setTargetRect(null);
        return;
      }

      const element = document.querySelector(step.selector);
      if (!element) {
        setTargetRect(null);
        return;
      }

      setTargetRect(element.getBoundingClientRect());
    },
    [steps, currentStep]
  );

  const persistTourSeen = async () => {
    if (!session?.user?.email) {
      return;
    }

    try {
      await setDoc(
        doc(db, 'users', session.user.email),
        {
          hasSeenTour: true,
          tourProgress: {
            [role]: true,
          },
          tourUpdatedAt: serverTimestamp(),
        },
        { merge: true }
      );
    } catch (error) {
      console.error('Failed to persist tour completion:', error);
    }
  };

  const completeTour = async () => {
    setIsOpen(false);
    await persistTourSeen();
  };

  useEffect(() => {
    if (!session?.user?.email) {
      setIsChecking(false);
      return;
    }

    const checkTourStatus = async () => {
      try {
        const userRef = doc(db, 'users', session.user.email);
        const snap = await getDoc(userRef);

        const data = snap.data() as any;
        const roleSeen = Boolean(data?.tourProgress?.[role]);
        const hasRoleProgress = Boolean(data?.tourProgress && typeof data.tourProgress === 'object');
        const genericSeen = Boolean(data?.hasSeenTour);
        const shouldShowTour = hasRoleProgress ? !roleSeen : !genericSeen;

        if (shouldShowTour) {
          setTimeout(() => {
            setCurrentStep(0);
            setIsOpen(true);
          }, 500);
        }
      } catch (error) {
        console.error('Failed to check tour status:', error);
      } finally {
        setIsChecking(false);
      }
    };

    void checkTourStatus();
  }, [session?.user?.email, role]);

  useEffect(() => {
    const restartTour = () => {
      setCurrentStep(0);
      setIsOpen(true);
    };

    window.addEventListener('circlein-restart-tour', restartTour as EventListener);

    return () => {
      window.removeEventListener('circlein-restart-tour', restartTour as EventListener);
    };
  }, []);

  useEffect(() => {
    if (!isOpen || isChecking) {
      return;
    }

    const recalc = () => updateTargetRect();

    recalc();
    window.addEventListener('resize', recalc);
    window.addEventListener('scroll', recalc, true);

    return () => {
      window.removeEventListener('resize', recalc);
      window.removeEventListener('scroll', recalc, true);
    };
  }, [isOpen, isChecking, updateTargetRect]);

  if (!isOpen || isChecking) {
    return null;
  }

  const step = steps[currentStep];
  if (!step) {
    return null;
  }

  const position = typeof window !== 'undefined' ? getTooltipPosition(targetRect) : null;

  return (
    <div className="fixed inset-0 z-[100060]">
      <div className="absolute inset-0 bg-slate-950/55" />

      {targetRect && (
        <div
          className="pointer-events-none absolute rounded-2xl border-2 border-cyan-400/90 shadow-[0_0_0_9999px_rgba(2,6,23,0.58)]"
          style={{
            top: targetRect.top - 6,
            left: targetRect.left - 6,
            width: targetRect.width + 12,
            height: targetRect.height + 12,
          }}
        />
      )}

      {position && (
        <div
          className="absolute w-[calc(100vw-24px)] rounded-2xl border border-slate-200 bg-white p-4 text-slate-900 shadow-2xl dark:border-slate-700 dark:bg-slate-900 dark:text-white"
          style={{
            top: position.top,
            left: position.left,
            transform: position.transform,
            maxWidth: position.maxWidth,
          }}
          role="dialog"
          aria-label="Product tour"
        >
          <div className="mb-3 flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-cyan-600 dark:text-cyan-400">
                Step {currentStep + 1} of {steps.length}
              </p>
              <h3 className="mt-1 text-base font-semibold">{step.title}</h3>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => void completeTour()}
              className="h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <p className="mb-4 text-sm text-slate-600 dark:text-slate-300">{step.description}</p>

          <div className="flex items-center justify-between gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => void completeTour()}
              className="h-9"
            >
              Skip Tour
            </Button>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                disabled={currentStep === 0}
                onClick={() => setCurrentStep((prev) => Math.max(0, prev - 1))}
                className="h-9"
              >
                <ChevronLeft className="mr-1 h-4 w-4" />
                Back
              </Button>

              {currentStep < steps.length - 1 ? (
                <Button
                  type="button"
                  onClick={() => setCurrentStep((prev) => Math.min(steps.length - 1, prev + 1))}
                  className="h-9 bg-slate-900 text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
                >
                  Next
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              ) : (
                <Button
                  type="button"
                  onClick={() => void completeTour()}
                  className="h-9 bg-cyan-600 text-white hover:bg-cyan-700"
                >
                  Finish
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
