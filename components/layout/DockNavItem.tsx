'use client';

import React, { useRef, useState } from 'react';
import { motion, useMotionValue, useSpring, useTransform, AnimatePresence } from 'framer-motion';
import { LucideIcon } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface DockNavItemProps {
  icon: LucideIcon;
  label: string;
  href: string;
  isActive: boolean;
  color: string;
  mouseY: any;
  onClick?: () => void;
}

export function DockNavItem({ 
  icon: Icon, 
  label, 
  href, 
  isActive, 
  color,
  mouseY,
  onClick 
}: DockNavItemProps) {
  const ref = useRef<HTMLAnchorElement>(null);
  const [isHovered, setIsHovered] = useState(false);

  // Calculate distance from mouse with smooth easing
  const distance = useTransform(mouseY, (val: number) => {
    const bounds = ref.current?.getBoundingClientRect() ?? { y: 0, height: 0 };
    return val - bounds.y - bounds.height / 2;
  });

  // Ultra-smooth size transformations with extended range for better effect
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

  // Add subtle rotation and depth on hover
  const rotateY = useTransform(distance, [-150, 0, 150], [8, 0, -8]);
  const rotateYSpring = useSpring(rotateY, { stiffness: 200, damping: 20 });

  // Subtle shadow intensity based on proximity
  const shadowIntensity = useTransform(distance, [-150, 0, 150], [0.2, 1, 0.2]);
  const shadowSpring = useSpring(shadowIntensity, { stiffness: 200, damping: 20 });

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
          <Link
            ref={ref}
            href={href}
            onClick={onClick}
            className={cn(
              'absolute inset-0 flex items-center justify-center rounded-2xl transition-colors duration-300',
              'group overflow-hidden',
              isActive
                ? 'ring-2 ring-offset-2 ring-offset-white dark:ring-offset-slate-950'
                : 'bg-white/95 dark:bg-slate-800/95 backdrop-blur-xl hover:bg-white dark:hover:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60'
            )}
            style={{
              background: isActive 
                ? `linear-gradient(135deg, ${color.split(' ')[1]} 0%, ${color.split(' ')[3]} 100%)` 
                : undefined,
              borderColor: isActive ? 'transparent' : undefined,
              transform: 'translateZ(0)', // Enable 3D transform
              perspective: '1000px',
            }}
          >
            {/* Shimmer effect on hover */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
              initial={{ x: '-100%' }}
              animate={{ x: isHovered ? '100%' : '-100%' }}
              transition={{ duration: 0.6, ease: 'easeInOut' }}
            />

            {/* Icon with smooth scaling */}
            <motion.div 
              style={{ width: iconSize, height: iconSize }}
              animate={{ 
                scale: isHovered ? 1.05 : 1,
                rotate: isHovered ? [0, -5, 5, 0] : 0
              }}
              transition={{ 
                scale: { type: "spring", stiffness: 300, damping: 20 },
                rotate: { duration: 0.5, ease: "easeInOut" }
              }}
            >
              <Icon 
                className={cn(
                  'w-full h-full transition-all duration-300',
                  isActive 
                    ? 'text-white drop-shadow-lg' 
                    : 'text-slate-700 dark:text-slate-300 group-hover:text-blue-600 dark:group-hover:text-blue-400'
                )} 
              />
            </motion.div>

            {/* Active indicator dot with pulse */}
            {isActive && (
              <>
                <motion.div
                  layoutId="activeDockDot"
                  className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-white"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
                <motion.div
                  className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-white"
                  animate={{ 
                    scale: [1, 1.5, 1],
                    opacity: [1, 0, 1]
                  }}
                  transition={{ 
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                />
              </>
            )}

            {/* Glow effect for active state */}
            {isActive && (
              <motion.div
                className="absolute inset-0 rounded-2xl"
                style={{
                  background: `linear-gradient(135deg, ${color.split(' ')[1]} 0%, ${color.split(' ')[3]} 100%)`,
                  filter: 'blur(20px)',
                  opacity: 0.3,
                  zIndex: -1
                }}
                animate={{
                  opacity: [0.2, 0.4, 0.2],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              />
            )}
          </Link>
        </motion.div>
      </motion.div>

      {/* Enhanced Tooltip with slide animation */}
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
