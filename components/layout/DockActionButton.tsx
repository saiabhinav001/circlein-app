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
  const [isPressed, setIsPressed] = useState(false);

  const distance = useTransform(mouseY, (val: number) => {
    const bounds = ref.current?.getBoundingClientRect() ?? { y: 0, height: 0 };
    return val - bounds.y - bounds.height / 2;
  });

  // Perfect dock sizing - all 10 icons always visible even when magnified
  const heightSync = useTransform(
    distance, 
    [-150, -75, 0, 75, 150], 
    [52, 60, 68, 60, 52]
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
    [52, 60, 68, 60, 52]
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
    [22, 26, 30, 26, 22]
  );
  const iconSize = useSpring(iconSizeSync, { 
    mass: 0.12, 
    stiffness: 200, 
    damping: 20,
    restDelta: 0.001
  });

  // Premium 3D transformations
  const rotateY = useTransform(distance, [-200, 0, 200], [15, 0, -15]);
  const rotateYSpring = useSpring(rotateY, { stiffness: 280, damping: 28 });
  
  const rotateX = useTransform(distance, [-200, -100, 0, 100, 200], [2, 1, 0, 1, 2]);
  const rotateXSpring = useSpring(rotateX, { stiffness: 280, damping: 28 });

  const shadowIntensity = useTransform(distance, [-200, 0, 200], [0.1, 1, 0.1]);
  const shadowSpring = useSpring(shadowIntensity, { stiffness: 280, damping: 28 });

  const translateY = useTransform(distance, [-200, 0, 200], [2, -4, 2]);
  const translateYSpring = useSpring(translateY, { stiffness: 260, damping: 26 });

  const variantStyles = {
    default: {
      base: 'bg-white/90 dark:bg-slate-900/90',
      hover: 'group-hover:bg-white/95 dark:group-hover:bg-slate-900/95',
      border: 'ring-slate-200/70 dark:ring-slate-700/70 group-hover:ring-slate-300/90 dark:group-hover:ring-slate-600/90',
      text: 'text-slate-700 dark:text-slate-200 group-hover:text-blue-600 dark:group-hover:text-blue-400',
      glow: 'from-blue-500/20 to-cyan-500/20',
      gradient: 'rgba(59, 130, 246, 0.08) 0%, rgba(147, 51, 234, 0.08) 100%'
    },
    danger: {
      base: 'bg-white/90 dark:bg-slate-900/90',
      hover: 'group-hover:bg-red-50/50 dark:group-hover:bg-red-900/10',
      border: 'ring-slate-200/70 dark:ring-slate-700/70 group-hover:ring-red-300/80 dark:group-hover:ring-red-700/80',
      text: 'text-red-600 dark:text-red-400 group-hover:text-red-700 dark:group-hover:text-red-300',
      glow: 'from-red-500/20 to-pink-500/20',
      gradient: 'rgba(239, 68, 68, 0.08) 0%, rgba(244, 63, 94, 0.08) 100%'
    },
    warning: {
      base: 'bg-white/90 dark:bg-slate-900/90',
      hover: 'group-hover:bg-amber-50/50 dark:group-hover:bg-amber-900/10',
      border: 'ring-slate-200/70 dark:ring-slate-700/70 group-hover:ring-amber-300/80 dark:group-hover:ring-amber-700/80',
      text: 'text-amber-600 dark:text-amber-400 group-hover:text-amber-700 dark:group-hover:text-amber-300',
      glow: 'from-amber-500/20 to-orange-500/20',
      gradient: 'rgba(245, 158, 11, 0.08) 0%, rgba(249, 115, 22, 0.08) 100%'
    },
  };

  const styles = variantStyles[variant];

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
          <button
            ref={ref}
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
                'transition-all duration-300 ease-out shadow-lg hover:shadow-xl'
              )}
              style={{
                boxShadow: useTransform(
                  shadowSpring,
                  (v) => `0 ${10 * v}px ${30 * v}px -5px rgba(0, 0, 0, ${0.15 * v}), 0 ${4 * v}px ${10 * v}px -5px rgba(0, 0, 0, ${0.08 * v})`
                )
              }}
            >
              {/* Hover gradient background */}
              <div 
                className={cn(
                  'absolute inset-0 transition-all duration-500',
                  'opacity-0 group-hover:opacity-100'
                )}
                style={{
                  background: `linear-gradient(135deg, ${styles.gradient})`
                }}
              />

              {/* Premium frosted glass effect */}
              <div className={cn(
                'absolute inset-0 backdrop-blur-xl transition-all duration-300',
                styles.base,
                styles.hover
              )} />

              {/* Mesh gradient overlay */}
              <div 
                className="absolute inset-0 opacity-30"
                style={{
                  backgroundImage: `radial-gradient(circle at 30% 20%, ${styles.gradient.split(',')[0].replace('0%', '')} 60%), radial-gradient(circle at 70% 80%, ${styles.gradient.split(',')[1]} 60%)`
                }}
              />

              {/* Elegant border */}
              <div className={cn(
                'absolute inset-0 rounded-[22px] transition-all duration-300 ring-1',
                styles.border
              )} />

              {/* Premium shimmer effect */}
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
              <motion.div 
                className="relative z-10 flex items-center justify-center w-full h-full"
                style={{ width: iconSize, height: iconSize }}
                animate={{ 
                  scale: isHovered ? 1.08 : 1,
                  rotate: isHovered && variant === 'warning' ? [0, -10, 10, 0] : isHovered && variant === 'danger' ? [0, 5, -5, 0] : isHovered ? [0, -4, 4, 0] : 0
                }}
                transition={{ 
                  scale: { type: "spring", stiffness: 400, damping: 25 },
                  rotate: { duration: 0.6, ease: "easeInOut" }
                }}
              >
                <Icon 
                  className={cn(
                    'w-full h-full transition-all duration-300',
                    styles.text
                  )} 
                  strokeWidth={2}
                />
              </motion.div>

              {/* Ambient glow on hover */}
              {isHovered && (
                <motion.div
                  className={cn("absolute -inset-4 rounded-[28px] blur-2xl -z-10 bg-gradient-to-br", styles.glow)}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.2 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                />
              )}
            </motion.div>
          </button>
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
