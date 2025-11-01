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
  const [isPressed, setIsPressed] = useState(false);

  // Calculate distance from mouse with smooth easing
  const distance = useTransform(mouseY, (val: number) => {
    const bounds = ref.current?.getBoundingClientRect() ?? { y: 0, height: 0 };
    return val - bounds.y - bounds.height / 2;
  });

  // Compact sizing - all 10 icons visible without scroll
  const heightSync = useTransform(
    distance, 
    [-150, -75, 0, 75, 150], 
    [50, 58, 64, 58, 50]
  );
  const height = useSpring(heightSync, { 
    mass: 0.12, 
    stiffness: 200, 
    damping: 20,
    restDelta: 0.001
  });

  const widthSync = useTransform(
    distance, 
    [-150, -75, 0, 75, 150], 
    [50, 58, 64, 58, 50]
  );
  const width = useSpring(widthSync, { 
    mass: 0.12, 
    stiffness: 200, 
    damping: 20,
    restDelta: 0.001
  });

  const iconSizeSync = useTransform(
    distance, 
    [-150, -75, 0, 75, 150], 
    [22, 25, 28, 25, 22]
  );
  const iconSize = useSpring(iconSizeSync, { 
    mass: 0.12, 
    stiffness: 200, 
    damping: 20,
    restDelta: 0.001
  });

  // Premium 3D transformations - full depth effect
  const rotateY = useTransform(distance, [-200, 0, 200], [15, 0, -15]);
  const rotateYSpring = useSpring(rotateY, { stiffness: 280, damping: 28 });
  
  const rotateX = useTransform(distance, [-200, -100, 0, 100, 200], [2, 1, 0, 1, 2]);
  const rotateXSpring = useSpring(rotateX, { stiffness: 280, damping: 28 });

  // Enhanced shadow intensity based on proximity
  const shadowIntensity = useTransform(distance, [-200, 0, 200], [0.1, 1, 0.1]);
  const shadowSpring = useSpring(shadowIntensity, { stiffness: 280, damping: 28 });

  // Floating effect - subtle Y translation
  const translateY = useTransform(distance, [-200, 0, 200], [2, -4, 2]);
  const translateYSpring = useSpring(translateY, { stiffness: 260, damping: 26 });

  // Extract gradient colors for active state
  const [startColor, endColor] = color.split(' ').filter(c => c.includes('-'));

  return (
    <div className="flex items-center justify-center w-full relative">
      <motion.div 
        style={{ height, width }} 
        className="relative"
        onHoverStart={() => setIsHovered(true)}
        onHoverEnd={() => setIsHovered(false)}
        onTapStart={() => setIsPressed(true)}
        onTap={() => setIsPressed(false)}
        onTapCancel={() => setIsPressed(false)}
      >
        <motion.div
          style={{
            rotateY: rotateYSpring,
            rotateX: rotateXSpring,
            y: translateYSpring,
            scale: isPressed ? 0.9 : 1,
          }}
          className="absolute inset-0"
          transition={{ 
            scale: { type: "spring", stiffness: 500, damping: 30 }
          }}
        >
          <Link
            ref={ref}
            href={href}
            onClick={onClick}
            className="absolute inset-0 flex items-center justify-center group"
            style={{ 
              perspective: '1200px',
              transformStyle: 'preserve-3d',
            }}
          >
            {/* Main container with Fortune 500 premium styling */}
            <motion.div
              className={cn(
                'relative w-full h-full rounded-[22px] overflow-hidden',
                'transition-all duration-300 ease-out',
                isActive
                  ? 'shadow-2xl'
                  : 'shadow-lg hover:shadow-xl'
              )}
              style={{
                boxShadow: useTransform(
                  shadowSpring,
                  (v) => isActive
                    ? `0 ${20 * v}px ${40 * v}px -5px rgba(0, 0, 0, ${0.25 * v}), 0 ${10 * v}px ${20 * v}px -5px rgba(0, 0, 0, ${0.1 * v}), inset 0 1px 0 rgba(255, 255, 255, ${0.1 * v})`
                    : `0 ${10 * v}px ${30 * v}px -5px rgba(0, 0, 0, ${0.15 * v}), 0 ${4 * v}px ${10 * v}px -5px rgba(0, 0, 0, ${0.08 * v})`
                )
              }}
            >
              {/* Active state gradient background */}
              <div 
                className={cn(
                  'absolute inset-0 transition-all duration-500',
                  isActive 
                    ? 'opacity-100' 
                    : 'opacity-0 group-hover:opacity-100'
                )}
                style={{
                  background: isActive 
                    ? `linear-gradient(135deg, ${startColor} 0%, ${endColor} 100%)`
                    : 'linear-gradient(135deg, rgba(59, 130, 246, 0.08) 0%, rgba(147, 51, 234, 0.08) 100%)'
                }}
              />

              {/* Premium frosted glass effect */}
              <div className={cn(
                'absolute inset-0 backdrop-blur-xl transition-all duration-300',
                isActive
                  ? 'bg-white/10 dark:bg-black/10'
                  : 'bg-white/90 dark:bg-slate-900/90 group-hover:bg-white/95 dark:group-hover:bg-slate-900/95'
              )} />

              {/* Mesh gradient overlay for depth */}
              <div 
                className="absolute inset-0 opacity-30"
                style={{
                  backgroundImage: `radial-gradient(circle at 30% 20%, ${isActive ? 'rgba(255,255,255,0.1)' : 'rgba(59,130,246,0.03)'} 0%, transparent 60%),
                                   radial-gradient(circle at 70% 80%, ${isActive ? 'rgba(255,255,255,0.08)' : 'rgba(147,51,234,0.03)'} 0%, transparent 60%)`
                }}
              />

              {/* Elegant border with gradient */}
              <div className={cn(
                'absolute inset-0 rounded-[22px] transition-all duration-300',
                isActive
                  ? 'ring-2 ring-white/40 dark:ring-white/25'
                  : 'ring-1 ring-slate-200/70 dark:ring-slate-700/70 group-hover:ring-slate-300/90 dark:group-hover:ring-slate-600/90'
              )} />

              {/* Premium shimmer effect on hover */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 dark:via-white/25 to-transparent"
                initial={{ x: '-200%', opacity: 0 }}
                animate={{ 
                  x: isHovered ? '200%' : '-200%',
                  opacity: isHovered ? 1 : 0
                }}
                transition={{ 
                  x: { duration: 0.8, ease: 'easeInOut' },
                  opacity: { duration: 0.3 }
                }}
              />

              {/* Icon container with enhanced animations */}
              <div className="absolute inset-0 flex items-center justify-center">
                <motion.div 
                  className="relative z-10"
                  style={{ width: iconSize, height: iconSize }}
                  animate={{ 
                    scale: isHovered ? 1.08 : 1,
                    rotate: isHovered ? [0, -4, 4, 0] : 0,
                  }}
                  transition={{ 
                    scale: { type: "spring", stiffness: 400, damping: 25 },
                    rotate: { duration: 0.6, ease: "easeInOut" }
                  }}
                >
                  <Icon 
                    className={cn(
                      'w-full h-full transition-all duration-300',
                      isActive 
                        ? 'text-slate-900 dark:text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.3)] dark:drop-shadow-[0_2px_8px_rgba(255,255,255,0.3)]' 
                        : 'text-slate-700 dark:text-slate-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 group-hover:drop-shadow-[0_2px_4px_rgba(59,130,246,0.3)]'
                    )} 
                    strokeWidth={isActive ? 2.5 : 2}
                  />
                </motion.div>
              </div>

              {/* Sophisticated active indicator */}
              <AnimatePresence>
                {isActive && (
                  <>
                    {/* Primary indicator dot */}
                    <motion.div
                      layoutId="activeDockIndicator"
                      className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-slate-900 dark:bg-white shadow-lg"
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0, opacity: 0 }}
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    />
                    {/* Breathing pulse ring */}
                    <motion.div
                      className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-slate-900 dark:bg-white"
                      animate={{ 
                        scale: [1, 2.5, 1],
                        opacity: [0.8, 0, 0.8]
                      }}
                      transition={{ 
                        duration: 2.5,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                    />
                  </>
                )}
              </AnimatePresence>

              {/* Ambient glow for active state */}
              {isActive && (
                <motion.div
                  className="absolute -inset-4 rounded-[28px] opacity-20 blur-2xl -z-10"
                  style={{
                    background: `linear-gradient(135deg, ${startColor} 0%, ${endColor} 100%)`
                  }}
                  animate={{
                    opacity: [0.15, 0.3, 0.15],
                    scale: [0.95, 1.05, 0.95],
                  }}
                  transition={{
                    duration: 4,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                />
              )}
            </motion.div>
          </Link>
        </motion.div>
      </motion.div>

      {/* Fortune 500 premium tooltip */}
      <AnimatePresence>
        {isHovered && (
          <motion.div
            initial={{ opacity: 0, x: -15, scale: 0.85 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: -15, scale: 0.85 }}
            transition={{ 
              type: "spring", 
              stiffness: 500, 
              damping: 30,
              mass: 0.8
            }}
            className="absolute left-full ml-4 px-4 py-2 bg-slate-900/95 dark:bg-slate-800/95 backdrop-blur-2xl text-white text-sm font-semibold rounded-xl whitespace-nowrap pointer-events-none shadow-2xl border border-slate-700/50 z-[70]"
          >
            {label}
            {/* Elegant arrow with smooth entrance */}
            <motion.div 
              className="absolute top-1/2 right-full -translate-y-1/2 mr-px"
              initial={{ scale: 0, rotate: -45 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.1, type: "spring", stiffness: 400, damping: 25 }}
            >
              <div className="w-2.5 h-2.5 bg-slate-900 dark:bg-slate-800 rotate-45 border-l border-b border-slate-700/50" />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
