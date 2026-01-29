'use client';

import { useState } from 'react';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { SearchProvider } from '@/components/providers/search-provider';
import { EnhancedNotificationListener } from '@/components/notifications/EnhancedNotificationListener';
import { RealtimeNotificationListener } from '@/components/notifications/RealtimeNotificationListener';
import { FirebaseAuthSync } from '@/components/firebase-auth-sync';
import { UserValidationGuard } from '@/components/auth/UserValidationGuard';
import { AnimatePresence, motion } from 'framer-motion';
import { useReminderChecker } from '@/hooks/useReminderChecker';
import { SidebarContext } from '@/hooks/useSidebarContext';

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  
  // Check for booking reminders every 15 minutes
  useReminderChecker();

  return (
    <FirebaseAuthSync>
      <SearchProvider>
        <SidebarContext.Provider value={{ isCollapsed: sidebarCollapsed, setIsCollapsed: setSidebarCollapsed }}>
          {/* User Validation Guard - Forces logout if user is deleted */}
          <UserValidationGuard />
          
          <div className="flex h-screen bg-slate-100/50 dark:bg-slate-950 overflow-hidden">
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
                    className="fixed inset-y-0 left-0 z-[100001] w-[85vw] max-w-[300px] lg:hidden shadow-2xl shadow-slate-900/20 dark:shadow-black/40"
                  >
                    <Sidebar onClose={() => setMobileMenuOpen(false)} />
                  </motion.div>
                </>
              )}
            </AnimatePresence>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col overflow-hidden min-w-0 bg-white/40 dark:bg-transparent">
              <Header 
                onMenuClick={() => setMobileMenuOpen(!mobileMenuOpen)} 
                isMenuOpen={mobileMenuOpen}
              />
              <main className="flex-1 overflow-auto bg-gradient-to-br from-slate-50/80 via-white/60 to-slate-100/40 dark:from-slate-950 dark:via-slate-950 dark:to-slate-900/50">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.25 }}
                  className="min-h-full"
                >
                  {children}
                </motion.div>
              </main>
            </div>
            
            {/* Notification Listeners */}
            <EnhancedNotificationListener />
            <RealtimeNotificationListener />
          </div>
        </SidebarContext.Provider>
      </SearchProvider>
    </FirebaseAuthSync>
  );
}