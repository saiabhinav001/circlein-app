'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSession } from 'next-auth/react';
import { motion, useReducedMotion } from 'framer-motion';
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

interface StepTheme {
  accent: string;
  accentStrong: string;
  ambientA: string;
  ambientB: string;
  progressGradient: string;
  primaryGradient: string;
  finishGradient: string;
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
    title: 'Admin Home',
    description: 'Start here for a quick picture of what needs your attention today.',
    selector: '[data-tour="sidebar-admin-panel"]',
  },
  {
    id: 'support-inbox',
    title: 'Support Inbox',
    description: 'Open support requests and follow up with residents quickly.',
    selector: '[data-tour="sidebar-admin-support"]',
  },
  {
    id: 'maintenance-desk',
    title: 'Maintenance Desk',
    description: 'Review pending work orders and close completed tasks.',
    selector: '[data-tour="sidebar-admin-maintenance"]',
  },
  {
    id: 'manage-users',
    title: 'Residents & Access',
    description: 'Manage resident accounts, access, and user status in one place.',
    selector: '[data-tour="sidebar-admin-users"]',
  },
  {
    id: 'waitlist',
    title: 'Waitlist Queue',
    description: 'Prioritize waitlisted bookings and resolve pending slots.',
    selector: '[data-tour="sidebar-admin-waitlist"]',
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

const DEFAULT_STEP_THEME: StepTheme = {
  accent: '#67e8f9',
  accentStrong: '#22d3ee',
  ambientA: 'rgba(34,211,238,0.2)',
  ambientB: 'rgba(45,212,191,0.16)',
  progressGradient: 'linear-gradient(90deg, #67e8f9 0%, #7dd3fc 48%, #5eead4 100%)',
  primaryGradient: 'linear-gradient(90deg, #06b6d4 0%, #14b8a6 100%)',
  finishGradient: 'linear-gradient(90deg, #14b8a6 0%, #06b6d4 100%)',
};

const STEP_THEMES: Record<string, StepTheme> = {
  dashboard: {
    accent: '#f0abfc',
    accentStrong: '#d946ef',
    ambientA: 'rgba(217,70,239,0.2)',
    ambientB: 'rgba(168,85,247,0.16)',
    progressGradient: 'linear-gradient(90deg, #f0abfc 0%, #e879f9 55%, #c084fc 100%)',
    primaryGradient: 'linear-gradient(90deg, #c026d3 0%, #9333ea 100%)',
    finishGradient: 'linear-gradient(90deg, #9333ea 0%, #c026d3 100%)',
  },
  bookings: {
    accent: '#fcd34d',
    accentStrong: '#f59e0b',
    ambientA: 'rgba(245,158,11,0.2)',
    ambientB: 'rgba(251,191,36,0.16)',
    progressGradient: 'linear-gradient(90deg, #fcd34d 0%, #f59e0b 55%, #f97316 100%)',
    primaryGradient: 'linear-gradient(90deg, #f59e0b 0%, #f97316 100%)',
    finishGradient: 'linear-gradient(90deg, #f97316 0%, #f59e0b 100%)',
  },
  calendar: {
    accent: '#93c5fd',
    accentStrong: '#3b82f6',
    ambientA: 'rgba(59,130,246,0.2)',
    ambientB: 'rgba(14,165,233,0.16)',
    progressGradient: 'linear-gradient(90deg, #93c5fd 0%, #60a5fa 55%, #38bdf8 100%)',
    primaryGradient: 'linear-gradient(90deg, #2563eb 0%, #0ea5e9 100%)',
    finishGradient: 'linear-gradient(90deg, #0ea5e9 0%, #2563eb 100%)',
  },
  search: {
    accent: '#86efac',
    accentStrong: '#22c55e',
    ambientA: 'rgba(34,197,94,0.2)',
    ambientB: 'rgba(16,185,129,0.16)',
    progressGradient: 'linear-gradient(90deg, #86efac 0%, #4ade80 55%, #2dd4bf 100%)',
    primaryGradient: 'linear-gradient(90deg, #16a34a 0%, #0d9488 100%)',
    finishGradient: 'linear-gradient(90deg, #0d9488 0%, #16a34a 100%)',
  },
  assistant: {
    accent: '#fca5a5',
    accentStrong: '#ef4444',
    ambientA: 'rgba(239,68,68,0.2)',
    ambientB: 'rgba(251,113,133,0.16)',
    progressGradient: 'linear-gradient(90deg, #fca5a5 0%, #fb7185 55%, #f97316 100%)',
    primaryGradient: 'linear-gradient(90deg, #ef4444 0%, #f97316 100%)',
    finishGradient: 'linear-gradient(90deg, #f97316 0%, #ef4444 100%)',
  },
  settings: {
    accent: '#67e8f9',
    accentStrong: '#06b6d4',
    ambientA: 'rgba(34,211,238,0.2)',
    ambientB: 'rgba(45,212,191,0.16)',
    progressGradient: 'linear-gradient(90deg, #67e8f9 0%, #22d3ee 55%, #5eead4 100%)',
    primaryGradient: 'linear-gradient(90deg, #0891b2 0%, #0f766e 100%)',
    finishGradient: 'linear-gradient(90deg, #0f766e 0%, #0891b2 100%)',
  },
  'admin-panel': {
    accent: '#c4b5fd',
    accentStrong: '#8b5cf6',
    ambientA: 'rgba(139,92,246,0.2)',
    ambientB: 'rgba(59,130,246,0.16)',
    progressGradient: 'linear-gradient(90deg, #c4b5fd 0%, #a78bfa 55%, #60a5fa 100%)',
    primaryGradient: 'linear-gradient(90deg, #7c3aed 0%, #2563eb 100%)',
    finishGradient: 'linear-gradient(90deg, #2563eb 0%, #7c3aed 100%)',
  },
  'manage-users': {
    accent: '#a5f3fc',
    accentStrong: '#0891b2',
    ambientA: 'rgba(8,145,178,0.2)',
    ambientB: 'rgba(59,130,246,0.16)',
    progressGradient: 'linear-gradient(90deg, #a5f3fc 0%, #67e8f9 55%, #60a5fa 100%)',
    primaryGradient: 'linear-gradient(90deg, #0891b2 0%, #2563eb 100%)',
    finishGradient: 'linear-gradient(90deg, #2563eb 0%, #0891b2 100%)',
  },
  'support-inbox': {
    accent: '#fca5a5',
    accentStrong: '#ef4444',
    ambientA: 'rgba(239,68,68,0.2)',
    ambientB: 'rgba(244,114,182,0.16)',
    progressGradient: 'linear-gradient(90deg, #fca5a5 0%, #fb7185 55%, #f97316 100%)',
    primaryGradient: 'linear-gradient(90deg, #dc2626 0%, #f97316 100%)',
    finishGradient: 'linear-gradient(90deg, #f97316 0%, #dc2626 100%)',
  },
  'maintenance-desk': {
    accent: '#fde68a',
    accentStrong: '#f59e0b',
    ambientA: 'rgba(245,158,11,0.2)',
    ambientB: 'rgba(245,158,11,0.16)',
    progressGradient: 'linear-gradient(90deg, #fde68a 0%, #fbbf24 55%, #f97316 100%)',
    primaryGradient: 'linear-gradient(90deg, #d97706 0%, #ea580c 100%)',
    finishGradient: 'linear-gradient(90deg, #ea580c 0%, #d97706 100%)',
  },
  waitlist: {
    accent: '#c4b5fd',
    accentStrong: '#8b5cf6',
    ambientA: 'rgba(139,92,246,0.2)',
    ambientB: 'rgba(99,102,241,0.16)',
    progressGradient: 'linear-gradient(90deg, #c4b5fd 0%, #a78bfa 55%, #818cf8 100%)',
    primaryGradient: 'linear-gradient(90deg, #7c3aed 0%, #6366f1 100%)',
    finishGradient: 'linear-gradient(90deg, #6366f1 0%, #7c3aed 100%)',
  },
  analytics: {
    accent: '#99f6e4',
    accentStrong: '#14b8a6',
    ambientA: 'rgba(20,184,166,0.2)',
    ambientB: 'rgba(56,189,248,0.16)',
    progressGradient: 'linear-gradient(90deg, #99f6e4 0%, #5eead4 55%, #38bdf8 100%)',
    primaryGradient: 'linear-gradient(90deg, #0d9488 0%, #0284c7 100%)',
    finishGradient: 'linear-gradient(90deg, #0284c7 0%, #0d9488 100%)',
  },
  'admin-settings': {
    accent: '#67e8f9',
    accentStrong: '#06b6d4',
    ambientA: 'rgba(34,211,238,0.2)',
    ambientB: 'rgba(45,212,191,0.16)',
    progressGradient: 'linear-gradient(90deg, #67e8f9 0%, #22d3ee 55%, #5eead4 100%)',
    primaryGradient: 'linear-gradient(90deg, #0891b2 0%, #0f766e 100%)',
    finishGradient: 'linear-gradient(90deg, #0f766e 0%, #0891b2 100%)',
  },
};

function getRole(sessionRole?: string): UserRole {
  return sessionRole === 'admin' ? 'admin' : 'resident';
}

function getTooltipPosition(rect: DOMRect | null, isMobile: boolean, isCompact: boolean) {
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  const safeGap = 12;
  const cardWidth = Math.min(isCompact ? 440 : 480, viewportWidth - safeGap * 2);
  const cardHeight = isMobile ? (isCompact ? 284 : 334) : isCompact ? 224 : 248;

  if (isMobile) {
    return {
      top: undefined,
      left: safeGap,
      right: safeGap,
      bottom: safeGap,
      transform: 'none',
      maxWidth: viewportWidth - safeGap * 2,
      maxHeight: undefined,
      mobile: true,
    };
  }

  if (!rect) {
    return {
      top: viewportHeight / 2,
      left: viewportWidth / 2,
      transform: 'translate(-50%, -50%)',
      maxWidth: cardWidth,
      maxHeight: undefined,
      mobile: false,
    };
  }

  const preferredRight = rect.right + 20;
  const preferredLeft = rect.left - cardWidth - 20;
  const hasRightSpace = preferredRight + cardWidth <= viewportWidth - safeGap;
  const hasLeftSpace = preferredLeft >= safeGap;

  let left = hasRightSpace
    ? preferredRight
    : hasLeftSpace
      ? preferredLeft
      : Math.min(Math.max(safeGap, rect.left), viewportWidth - cardWidth - safeGap);

  let top = rect.top + rect.height / 2 - cardHeight / 2;

  if (top + cardHeight > viewportHeight - safeGap) {
    top = viewportHeight - cardHeight - safeGap;
  }

  if (top < safeGap) {
    top = safeGap;
  }

  return {
    top,
    left,
    transform: 'none',
    maxWidth: cardWidth,
    maxHeight: undefined,
    mobile: false,
  };
}

export function ProductTour() {
  const { data: session } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [currentStep, setCurrentStep] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [isMobileViewport, setIsMobileViewport] = useState(false);
  const [isCompactViewport, setIsCompactViewport] = useState(false);
  const prefersReducedMotion = useReducedMotion();

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

      if (window.innerWidth < 1024) {
        (element as HTMLElement).scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth', block: 'center', inline: 'nearest' });
      }

      setTargetRect(element.getBoundingClientRect());
    },
    [steps, currentStep, prefersReducedMotion]
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
    const updateViewportMode = () => {
      setIsMobileViewport(window.innerWidth < 768);
      setIsCompactViewport(window.innerHeight < 760);
    };

    updateViewportMode();
    recalc();
    window.addEventListener('resize', updateViewportMode);
    window.addEventListener('resize', recalc);
    window.addEventListener('scroll', recalc, true);
    const bodyOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = bodyOverflow;
      window.removeEventListener('resize', updateViewportMode);
      window.removeEventListener('resize', recalc);
      window.removeEventListener('scroll', recalc, true);
    };
  }, [isOpen, isChecking, updateTargetRect]);

  useEffect(() => {
    if (!isOpen || isChecking) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        void completeTour();
      }
      if (event.key === 'ArrowRight') {
        setCurrentStep((prev) => Math.min(steps.length - 1, prev + 1));
      }
      if (event.key === 'ArrowLeft') {
        setCurrentStep((prev) => Math.max(0, prev - 1));
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, isChecking, steps.length]);

  if (!isOpen || isChecking) {
    return null;
  }

  const step = steps[currentStep];
  if (!step) {
    return null;
  }

  const position = typeof window !== 'undefined' ? getTooltipPosition(targetRect, isMobileViewport, isCompactViewport) : null;
  const progress = Math.round(((currentStep + 1) / steps.length) * 100);
  const theme = STEP_THEMES[step.id] || DEFAULT_STEP_THEME;

  const connector = (() => {
    if (!targetRect || !position || position.mobile) {
      return null;
    }

    const cardLeft = typeof position.left === 'number' ? position.left : 0;
    const cardTop = typeof position.top === 'number' ? position.top : 0;
    const cardWidth = typeof position.maxWidth === 'number' ? position.maxWidth : 460;
    const cardHeight = isCompactViewport ? 224 : 248;

    const targetCenterX = targetRect.left + targetRect.width / 2;
    const targetCenterY = targetRect.top + targetRect.height / 2;
    const cardCenterX = cardLeft + cardWidth / 2;
    const cardCenterY = cardTop + cardHeight / 2;

    const startX = cardCenterX > targetCenterX ? targetRect.right + 8 : targetRect.left - 8;
    const startY = targetCenterY;

    const endX = cardCenterX > targetCenterX ? cardLeft - 8 : cardLeft + cardWidth + 8;
    const endY = Math.min(cardTop + cardHeight - 18, Math.max(cardTop + 18, cardCenterY));

    const angle = Math.atan2(endY - startY, endX - startX);
    const arrowLength = 10;
    const wingA = {
      x: endX - arrowLength * Math.cos(angle - Math.PI / 7),
      y: endY - arrowLength * Math.sin(angle - Math.PI / 7),
    };
    const wingB = {
      x: endX - arrowLength * Math.cos(angle + Math.PI / 7),
      y: endY - arrowLength * Math.sin(angle + Math.PI / 7),
    };

    return {
      path: `M ${startX} ${startY} L ${endX} ${endY}`,
      wingA,
      wingB,
      endX,
      endY,
    };
  })();

  return (
    <div className="fixed inset-0 z-[100060]">
      <div className="absolute inset-0 bg-[rgba(2,6,23,0.74)]" />
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `radial-gradient(circle_at_18%_20%,${theme.ambientA},transparent_34%),radial-gradient(circle_at_85%_78%,${theme.ambientB},transparent_34%)`,
        }}
      />

      {targetRect && (
        <motion.div
          initial={prefersReducedMotion ? false : { opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: prefersReducedMotion ? 0 : 0.2, ease: 'easeOut' }}
          className="pointer-events-none absolute rounded-2xl border"
          style={{
            top: targetRect.top - 6,
            left: targetRect.left - 6,
            width: targetRect.width + 12,
            height: targetRect.height + 12,
            borderColor: theme.accent,
            boxShadow: `0 0 0 1px ${theme.accent}, 0 0 0 9999px rgba(2,6,23,0.74), 0 0 34px ${theme.ambientA}`,
          }}
        />
      )}

      {connector && (
        <svg className="pointer-events-none absolute inset-0" aria-hidden="true">
          <motion.path
            d={connector.path}
            fill="none"
            stroke={theme.accent}
            strokeWidth={2}
            strokeLinecap="round"
            strokeDasharray={prefersReducedMotion ? undefined : '5 6'}
            initial={prefersReducedMotion ? false : { pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: prefersReducedMotion ? 0 : 0.22, ease: 'easeOut' }}
          />
          <motion.path
            d={`M ${connector.wingA.x} ${connector.wingA.y} L ${connector.endX} ${connector.endY} L ${connector.wingB.x} ${connector.wingB.y}`}
            fill="none"
            stroke={theme.accentStrong}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={prefersReducedMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: prefersReducedMotion ? 0 : 0.15, delay: prefersReducedMotion ? 0 : 0.12 }}
          />
        </svg>
      )}

      {position && (
        <motion.div
          initial={prefersReducedMotion ? false : { opacity: 0, y: 12, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: prefersReducedMotion ? 0 : 0.26, ease: 'easeOut' }}
          className={`absolute w-[calc(100vw-24px)] overflow-hidden rounded-3xl border bg-slate-950/92 text-slate-100 shadow-[0_24px_56px_rgba(2,6,23,0.62)] backdrop-blur-xl ${isCompactViewport ? 'p-3.5 sm:p-4' : 'p-4 sm:p-5'}`}
          style={{
            top: position.top,
            left: position.left,
            right: position.right,
            bottom: position.bottom,
            transform: position.transform,
            maxWidth: position.maxWidth,
            maxHeight: position.maxHeight,
            paddingBottom: position.mobile ? 'max(1rem, env(safe-area-inset-bottom))' : undefined,
            borderColor: `${theme.accent}33`,
          }}
          role="dialog"
          aria-modal="true"
          aria-label="Product tour"
        >
          <div className="pointer-events-none absolute -top-20 right-[-52px] h-40 w-40 rounded-full blur-3xl" style={{ backgroundColor: theme.ambientA }} />
          <div className="pointer-events-none absolute -bottom-16 left-[-30px] h-36 w-36 rounded-full blur-3xl" style={{ backgroundColor: theme.ambientB }} />

          <div className="relative mb-3 h-1.5 w-full overflow-hidden rounded-full bg-slate-800/85">
            <div
              className="h-full rounded-full"
              style={{
                width: `${progress}%`,
                backgroundImage: theme.progressGradient,
                transition: prefersReducedMotion ? 'none' : 'width 280ms ease-out',
              }}
            />
          </div>

          <div className="relative mb-3 flex items-start justify-between gap-3">
            <div>
              <p
                className="inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold uppercase tracking-[0.16em]"
                style={{
                  borderColor: `${theme.accent}55`,
                  backgroundColor: `${theme.accentStrong}1f`,
                  color: theme.accent,
                }}
              >
                Step {currentStep + 1} of {steps.length}
              </p>
              <h3 className={`mt-2 font-semibold leading-tight text-white ${isCompactViewport ? 'text-base sm:text-lg' : 'text-lg sm:text-xl'}`}>{step.title}</h3>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => void completeTour()}
              className="h-8 w-8 rounded-full text-slate-300 hover:bg-slate-800/80 hover:text-white"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <p className={`relative text-slate-300 ${isCompactViewport ? 'mb-2 text-[13px] leading-snug sm:text-sm' : 'mb-3 text-sm leading-relaxed sm:text-[15px]'}`}>{step.description}</p>
          {!targetRect && (
            <p className="relative mb-4 rounded-xl border border-amber-700/45 bg-amber-900/35 px-3 py-2 text-xs text-amber-200">
              This target is not currently visible. Continue to the next step or reopen this tour from Settings.
            </p>
          )}

          <div className={`relative flex items-center gap-1.5 ${isCompactViewport ? 'mb-3' : 'mb-4'}`}>
            {steps.map((tourStep, index) => (
              <span
                key={tourStep.id}
                className={
                  index === currentStep
                    ? 'h-1.5 w-6 rounded-full'
                    : 'h-1.5 w-1.5 rounded-full bg-slate-700/95'
                }
                style={index === currentStep ? { backgroundColor: theme.accent } : undefined}
              />
            ))}
          </div>

          <div className={`relative flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between ${isCompactViewport ? 'mt-0.5' : ''}`}>
            <Button
              type="button"
              variant="outline"
              onClick={() => void completeTour()}
              className={`${isCompactViewport ? 'h-8 text-xs' : 'h-9'} w-full border-slate-700/90 bg-transparent text-slate-200 hover:bg-slate-800/90 hover:text-white sm:w-auto`}
            >
              Skip Tour
            </Button>

            <div className="flex w-full items-center gap-2 sm:w-auto">
              <Button
                type="button"
                variant="ghost"
                disabled={currentStep === 0}
                onClick={() => setCurrentStep((prev) => Math.max(0, prev - 1))}
                className={`${isCompactViewport ? 'h-8 text-xs' : 'h-9'} flex-1 text-slate-300 hover:bg-slate-800/90 hover:text-white disabled:text-slate-600 sm:flex-none`}
              >
                <ChevronLeft className="mr-1 h-4 w-4" />
                Back
              </Button>

              {currentStep < steps.length - 1 ? (
                <Button
                  type="button"
                  onClick={() => setCurrentStep((prev) => Math.min(steps.length - 1, prev + 1))}
                  className={`${isCompactViewport ? 'h-8 text-xs' : 'h-9'} flex-1 text-white sm:flex-none`}
                  style={{ backgroundImage: theme.primaryGradient }}
                >
                  Next
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              ) : (
                <Button
                  type="button"
                  onClick={() => void completeTour()}
                  className={`${isCompactViewport ? 'h-8 text-xs' : 'h-9'} flex-1 text-white sm:flex-none`}
                  style={{ backgroundImage: theme.finishGradient }}
                >
                  Finish
                </Button>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
