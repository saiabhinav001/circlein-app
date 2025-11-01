'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';
import { CircleInLogo } from '@/components/ui';

export default function LoadingScreen() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // ALWAYS show loading screen on EVERY page load/refresh
    // No caching, no skipping - full animation every time
    
    // Show loading screen for 3 seconds to see full animation
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <AnimatePresence mode="wait">
      {isLoading && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6, ease: 'easeInOut' }}
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950"
        >
          {/* Animated Background */}
          <motion.div
            className="absolute inset-0 opacity-30"
            animate={{
              background: [
                'radial-gradient(circle at 20% 50%, rgba(99, 102, 241, 0.2) 0%, transparent 50%)',
                'radial-gradient(circle at 80% 50%, rgba(168, 85, 247, 0.2) 0%, transparent 50%)',
                'radial-gradient(circle at 50% 80%, rgba(59, 130, 246, 0.2) 0%, transparent 50%)',
                'radial-gradient(circle at 20% 50%, rgba(99, 102, 241, 0.2) 0%, transparent 50%)',
              ],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />

          {/* Animated Particles */}
          <div className="absolute inset-0 overflow-hidden">
            {[...Array(20)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-1 h-1 bg-blue-400/30 rounded-full"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                }}
                animate={{
                  y: [0, -30, 0],
                  opacity: [0, 1, 0],
                }}
                transition={{
                  duration: 2 + Math.random() * 2,
                  repeat: Infinity,
                  delay: Math.random() * 2,
                }}
              />
            ))}
          </div>

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
                  scale: [1, 1.2, 1],
                  opacity: [0.3, 0.6, 0.3],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className="absolute inset-0 -m-8 rounded-full bg-gradient-to-r from-blue-500/40 to-purple-500/40 blur-3xl"
              />
              
              {/* Rotating Ring */}
              <motion.div
                animate={{ rotate: 360 }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: 'linear',
                }}
                className="absolute inset-0 -m-4"
              >
                <div className="w-full h-full border-2 border-transparent border-t-blue-400/50 border-r-purple-400/50 rounded-full" />
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
                className="text-3xl sm:text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-purple-500 bg-clip-text text-transparent mb-3"
              >
                CircleIn
              </motion.h1>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
                className="text-slate-400 text-base sm:text-lg"
              >
                Community Management Platform
              </motion.p>
            </motion.div>

            {/* Progress Bar */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
              className="w-48 sm:w-64 h-1 bg-slate-800 rounded-full overflow-hidden"
            >
              <motion.div
                initial={{ width: '0%' }}
                animate={{ width: '100%' }}
                transition={{ duration: 1.8, ease: 'easeInOut' }}
                className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"
              />
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
