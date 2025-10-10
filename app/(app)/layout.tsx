'use client';

import { useState } from 'react';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { SearchProvider } from '@/components/providers/search-provider';
import { EnhancedNotificationListener } from '@/components/notifications/EnhancedNotificationListener';
import { FirebaseAuthSync } from '@/components/firebase-auth-sync';
import { UserValidationGuard } from '@/components/auth/UserValidationGuard';
import { AnimatePresence, motion } from 'framer-motion';

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <FirebaseAuthSync>
      <SearchProvider>
        {/* User Validation Guard - Forces logout if user is deleted */}
        <UserValidationGuard />
        
        <div className="flex h-screen bg-gray-50 dark:bg-gray-900 overflow-hidden">
          {/* Desktop Sidebar */}
          <div className="hidden lg:block">
            <Sidebar />
          </div>

          {/* Mobile Sidebar */}
          <AnimatePresence>
            {mobileMenuOpen && (
              <>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm"
                  onClick={() => setMobileMenuOpen(false)}
                />
                <motion.div
                  initial={{ x: '-100%' }}
                  animate={{ x: 0 }}
                  exit={{ x: '-100%' }}
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  className="fixed inset-y-0 left-0 z-50 lg:hidden"
                >
                  <Sidebar onClose={() => setMobileMenuOpen(false)} />
                </motion.div>
              </>
            )}
          </AnimatePresence>

          <div className="flex-1 flex flex-col overflow-hidden w-full">
            <Header 
              onMenuClick={() => setMobileMenuOpen(!mobileMenuOpen)} 
              isMenuOpen={mobileMenuOpen}
            />
            <main className="flex-1 overflow-auto">
              {children}
            </main>
          </div>
          <EnhancedNotificationListener />
        </div>
      </SearchProvider>
    </FirebaseAuthSync>
  );
}