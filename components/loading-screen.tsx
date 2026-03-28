'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';
import { CircleInLogo } from '@/components/ui';

export default function AppLoaderScreen() {
  const [isLoading, setIsLoading] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    // Mark as mounted to avoid hydration issues
    setIsMounted(true);

    // Only show loading animation on initial app load
    // Skip on page navigation and refreshes
    
    if (typeof window === 'undefined') return;

    // Check if we've already shown the loading screen in this session
    const hasShownThisSession = sessionStorage.getItem('circlein-loading-shown');
    
    // Show loading screen ONLY if not shown yet in this session
    if (!hasShownThisSession) {
      setIsLoading(true);
      
      // Mark as shown in this session
      sessionStorage.setItem('circlein-loading-shown', 'true');
      
      // Show loading screen for 2 seconds
      const timer = setTimeout(() => {
        setIsLoading(false);
      }, 2000);

      return () => clearTimeout(timer);
    } else {
      // Skip loading screen - already shown this session
      setIsLoading(false);
    }
  }, []);

  // Don't render anything until mounted (avoid hydration mismatch)
  if (!isMounted) {
    return null;
  }

  return (
    <AnimatePresence mode="wait">
      {isLoading && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6, ease: 'easeInOut' }}
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-background"
        >
          {/* Subtle background tints */}
          <motion.div
            className="absolute inset-0 opacity-50"
            animate={{
              background: [
                'radial-gradient(circle at 20% 40%, rgba(16, 185, 129, 0.08) 0%, transparent 55%)',
                'radial-gradient(circle at 80% 60%, rgba(24, 24, 27, 0.08) 0%, transparent 55%)',
                'radial-gradient(circle at 30% 75%, rgba(16, 185, 129, 0.06) 0%, transparent 50%)',
                'radial-gradient(circle at 20% 40%, rgba(16, 185, 129, 0.08) 0%, transparent 55%)',
              ],
            }}
            transition={{
              duration: 6,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />

          {/* Logo and Loading Animation */}
          <div className="relative z-10 flex flex-col items-center gap-6 sm:gap-8">
            {/* Animated Logo with Entrance */}
            <motion.div
              initial={{ scale: 0, rotate: -180, opacity: 0 }}
              animate={{ 
                scale: 1, 
                rotate: 0, 
                opacity: 1 
              }}
              transition={{
                type: 'spring',
                stiffness: 200,
                damping: 20,
                duration: 0.8,
              }}
              className="relative"
            >
              {/* Dynamic Glow Effect */}
              <motion.div
                animate={{
                  scale: [1, 1.08, 1],
                  opacity: [0.2, 0.35, 0.2],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className="absolute inset-0 -m-8 rounded-full bg-gradient-to-r from-emerald-500/20 to-zinc-900/20 dark:to-zinc-100/20 blur-3xl"
              />
              
              {/* Rotating Ring */}
              <motion.div
                animate={{ rotate: 360 }}
                transition={{
                  duration: 3.2,
                  repeat: Infinity,
                  ease: 'linear',
                }}
                className="absolute inset-0 -m-4"
              >
                <div className="w-full h-full border-2 border-transparent border-t-emerald-500/50 border-r-zinc-500/40 dark:border-r-zinc-300/40 rounded-full" />
              </motion.div>
              
              {/* Logo */}
              <motion.div
                animate={{
                  y: [0, -5, 0],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              >
                <CircleInLogo 
                  size={140}
                  className="relative w-24 h-24 sm:w-28 sm:h-28 md:w-36 md:h-36"
                />
              </motion.div>
            </motion.div>

            {/* App Name with Stagger */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.6 }}
              className="text-center"
            >
              <motion.h1
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="text-3xl sm:text-4xl md:text-5xl font-bold text-slate-900 dark:text-slate-100 mb-3"
              >
                CircleIn
              </motion.h1>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
                className="text-slate-600 dark:text-slate-400 text-base sm:text-lg"
              >
                Community Management Platform
              </motion.p>
            </motion.div>

            {/* Progress Bar */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
              className="w-48 sm:w-64 h-1 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden"
            >
              <motion.div
                initial={{ width: '0%' }}
                animate={{ width: '100%' }}
                transition={{ duration: 1.8, ease: 'easeInOut' }}
                className="h-full bg-gradient-to-r from-slate-900 to-emerald-500 dark:from-slate-100 dark:to-emerald-400"
              />
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
