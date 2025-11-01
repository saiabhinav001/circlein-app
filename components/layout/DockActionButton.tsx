'use client';

import React, { useRef, useState } from 'react';
import { motion, useSpring, useTransform, AnimatePresence } from 'framer-motion';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DockActionButtonProps {
  icon: LucideIcon;
  label: string;
  onClick: () => void;
  mouseY: any;
  variant?: 'default' | 'danger' | 'warning';
}

export function DockActionButton({ 
  icon: Icon, 
  label, 
  onClick,
  mouseY,
  variant = 'default'
}: DockActionButtonProps) {
  const ref = useRef<HTMLButtonElement>(null);
  const [isHovered, setIsHovered] = useState(false);

  const distance = useTransform(mouseY, (val: number) => {
    const bounds = ref.current?.getBoundingClientRect() ?? { y: 0, height: 0 };
    return val - bounds.y - bounds.height / 2;
  });

  // Ultra-smooth transformations with extended range
  const heightSync = useTransform(
    distance, 
    [-150, -75, 0, 75, 150], 
    [48, 56, 72, 56, 48]
  );
  const height = useSpring(heightSync, { 
    mass: 0.15, 
    stiffness: 180, 
    damping: 15,
    restDelta: 0.001
  });

  const widthSync = useTransform(
    distance, 
    [-150, -75, 0, 75, 150], 
    [48, 56, 72, 56, 48]
  );
  const width = useSpring(widthSync, { 
    mass: 0.15, 
    stiffness: 180, 
    damping: 15,
    restDelta: 0.001
  });

  const iconSizeSync = useTransform(
    distance, 
    [-150, -75, 0, 75, 150], 
    [20, 23, 28, 23, 20]
  );
  const iconSize = useSpring(iconSizeSync, { 
    mass: 0.15, 
    stiffness: 180, 
    damping: 15,
    restDelta: 0.001
  });

  // Add subtle rotation and depth
  const rotateY = useTransform(distance, [-150, 0, 150], [8, 0, -8]);
  const rotateYSpring = useSpring(rotateY, { stiffness: 200, damping: 20 });

  const shadowIntensity = useTransform(distance, [-150, 0, 150], [0.2, 1, 0.2]);
  const shadowSpring = useSpring(shadowIntensity, { stiffness: 200, damping: 20 });

  const variantStyles = {
    default: {
      bg: 'bg-white/95 dark:bg-slate-800/95 hover:bg-white dark:hover:bg-slate-800',
      border: 'border-slate-200/60 dark:border-slate-700/60',
      text: 'text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400',
      glow: 'from-blue-500/20 to-cyan-500/20'
    },
    danger: {
      bg: 'bg-white/95 dark:bg-slate-800/95 hover:bg-red-50 dark:hover:bg-red-900/20',
      border: 'border-slate-200/60 dark:border-slate-700/60',
      text: 'text-red-500 hover:text-red-600',
      glow: 'from-red-500/20 to-pink-500/20'
    },
    warning: {
      bg: 'bg-white/95 dark:bg-slate-800/95 hover:bg-amber-50 dark:hover:bg-amber-900/20',
      border: 'border-slate-200/60 dark:border-slate-700/60',
      text: 'text-amber-500 hover:text-amber-600',
      glow: 'from-amber-500/20 to-orange-500/20'
    },
  };

  const styles = variantStyles[variant];

  return (
    <div className="flex items-center justify-center w-full">
      <motion.div 
        style={{ height, width }} 
        className="relative"
        onHoverStart={() => setIsHovered(true)}
        onHoverEnd={() => setIsHovered(false)}
      >
        <motion.div
          style={{
            rotateY: rotateYSpring,
            boxShadow: useTransform(
              shadowSpring,
              (v) => `0 ${10 * v}px ${30 * v}px rgba(0, 0, 0, ${0.2 * v})`
            )
          }}
          className="absolute inset-0"
        >
          <button
            ref={ref}
            onClick={onClick}
            className={cn(
              'absolute inset-0 flex items-center justify-center rounded-2xl transition-all duration-300',
              'group overflow-hidden backdrop-blur-xl border',
              styles.bg,
              styles.border,
              styles.text
            )}
            style={{
              transform: 'translateZ(0)',
              perspective: '1000px',
            }}
          >
            {/* Shimmer effect */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
              initial={{ x: '-100%' }}
              animate={{ x: isHovered ? '100%' : '-100%' }}
              transition={{ duration: 0.6, ease: 'easeInOut' }}
            />

            {/* Icon with smooth animation */}
            <motion.div 
              style={{ width: iconSize, height: iconSize }}
              animate={{ 
                scale: isHovered ? 1.05 : 1,
                rotate: isHovered && variant === 'warning' ? [0, -10, 10, 0] : isHovered && variant === 'danger' ? [0, 5, -5, 0] : 0
              }}
              transition={{ 
                scale: { type: "spring", stiffness: 300, damping: 20 },
                rotate: { duration: 0.5, ease: "easeInOut" }
              }}
            >
              <Icon className="w-full h-full transition-all duration-300" />
            </motion.div>

            {/* Glow effect on hover */}
            {isHovered && (
              <motion.div
                className={cn("absolute inset-0 rounded-2xl bg-gradient-to-br", styles.glow)}
                style={{
                  filter: 'blur(20px)',
                  zIndex: -1
                }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.4 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              />
            )}
          </button>
        </motion.div>
      </motion.div>

      {/* Enhanced Tooltip */}
      <AnimatePresence>
        {isHovered && (
          <motion.div
            initial={{ opacity: 0, x: -10, scale: 0.8 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: -10, scale: 0.8 }}
            transition={{ 
              type: "spring", 
              stiffness: 400, 
              damping: 25 
            }}
            className="absolute left-full ml-3 px-3 py-1.5 bg-slate-900/95 dark:bg-slate-800/95 backdrop-blur-xl text-white text-xs font-medium rounded-lg whitespace-nowrap pointer-events-none shadow-2xl border border-slate-700/50 z-[60]"
          >
            {label}
            <motion.div 
              className="absolute top-1/2 right-full -translate-y-1/2 mr-px w-2 h-2 bg-slate-900 dark:bg-slate-800 rotate-45 border-l border-b border-slate-700/50"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.1 }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
