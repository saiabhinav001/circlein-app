'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { SearchProvider } from '@/components/providers/search-provider';
import { EnhancedNotificationListener } from '@/components/notifications/enhanced-notification-listener';
import { RealtimeNotificationListener } from '@/components/notifications/realtime-notification-listener';
import { FirebaseAuthSync } from '@/components/auth/firebase-auth-sync';
import { AccountValidationGuard } from '@/components/auth/user-validation-guard';
import { ChatWidget } from '@/components/chatbot/chat-widget';
import { GlobalCommandPalette } from '@/components/layout/global-command-palette';
import { ProductTour } from '@/components/onboarding/product-tour';
import { AnimatePresence, motion } from 'framer-motion';
import { useReminderMonitor } from '@/hooks/use-reminder-checker';
import { SidebarContext } from '@/hooks/use-sidebar-context';
import { useCommunityTimeFormat } from '@/components/providers/community-branding-provider';
import { TimeFormatProvider } from '@/lib/time-format-context';

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const mainContentRef = useRef<HTMLElement | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const timeFormat = useCommunityTimeFormat();
  
  // Check for booking reminders every 15 minutes
  useReminderMonitor();

  useEffect(() => {
    if (mainContentRef.current) {
      mainContentRef.current.scrollTo({ top: 0, behavior: 'auto' });
    }
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [pathname]);

  return (
    <FirebaseAuthSync>
      <SearchProvider>
        <SidebarContext.Provider value={{ isCollapsed: sidebarCollapsed, setIsCollapsed: setSidebarCollapsed }}>
          {/* User Validation Guard - Forces logout if user is deleted */}
          <AccountValidationGuard />
          
          <div className="flex h-[100dvh] min-h-screen bg-background overflow-hidden overflow-x-hidden">
            {/* Desktop Sidebar */}
            <div className="hidden lg:block shrink-0">
              <Sidebar onCollapseChange={setSidebarCollapsed} />
            </div>

            {/* Mobile Sidebar Overlay */}
            <AnimatePresence mode="wait">
              {mobileMenuOpen && (
                <>
                  {/* Backdrop */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15, ease: 'easeOut' }}
                    className="fixed inset-0 bg-slate-900/50 dark:bg-black/60 z-[100000] lg:hidden backdrop-blur-[2px]"
                    onClick={() => setMobileMenuOpen(false)}
                    aria-hidden="true"
                  />
                  {/* Sidebar Panel */}
                  <motion.div
                    initial={{ x: '-100%' }}
                    animate={{ x: 0 }}
                    exit={{ x: '-100%' }}
                    transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                    className="fixed inset-y-0 left-0 z-[100001] w-[90vw] max-w-[360px] lg:hidden shadow-2xl shadow-slate-900/20 dark:shadow-black/40"
                  >
                    <Sidebar onClose={() => setMobileMenuOpen(false)} />
                  </motion.div>
                </>
              )}
            </AnimatePresence>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col overflow-hidden overflow-x-hidden min-w-0 bg-background/60">
              <Header 
                onMenuClick={() => setMobileMenuOpen(!mobileMenuOpen)} 
                isMenuOpen={mobileMenuOpen}
              />
              <main id="main-content" ref={mainContentRef} className="flex-1 overflow-auto bg-background">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.25 }}
                  className="min-h-full bg-gradient-to-b from-background via-background to-muted/30 dark:to-muted/10"
                >
                  <TimeFormatProvider format={timeFormat}>
                    {children}
                  </TimeFormatProvider>
                </motion.div>
              </main>
            </div>
            
            {/* Notification Listeners */}
            <EnhancedNotificationListener />
            <RealtimeNotificationListener />
            <GlobalCommandPalette />
            <ChatWidget />
            <ProductTour />
          </div>
        </SidebarContext.Provider>
      </SearchProvider>
    </FirebaseAuthSync>
  );
}