'use client';

import React, { useRef } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
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

  const distance = useTransform(mouseY, (val: number) => {
    const bounds = ref.current?.getBoundingClientRect() ?? { y: 0, height: 0 };
    return val - bounds.y - bounds.height / 2;
  });

  const heightSync = useTransform(distance, [-100, 0, 100], [48, 68, 48]);
  const height = useSpring(heightSync, { mass: 0.1, stiffness: 150, damping: 12 });

  const widthSync = useTransform(distance, [-100, 0, 100], [48, 68, 48]);
  const width = useSpring(widthSync, { mass: 0.1, stiffness: 150, damping: 12 });

  const iconSizeSync = useTransform(distance, [-100, 0, 100], [20, 26, 20]);
  const iconSize = useSpring(iconSizeSync, { mass: 0.1, stiffness: 150, damping: 12 });

  const variantStyles = {
    default: 'bg-white/90 dark:bg-slate-800/90 hover:bg-white dark:hover:bg-slate-800 border-slate-200/50 dark:border-slate-700/50 text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400',
    danger: 'bg-white/90 dark:bg-slate-800/90 hover:bg-red-50 dark:hover:bg-red-900/20 border-slate-200/50 dark:border-slate-700/50 text-red-500 hover:text-red-600',
    warning: 'bg-white/90 dark:bg-slate-800/90 hover:bg-amber-50 dark:hover:bg-amber-900/20 border-slate-200/50 dark:border-slate-700/50 text-amber-500 hover:text-amber-600',
  };

  return (
    <div className="flex items-center justify-center w-full">
      <motion.div style={{ height, width }} className="relative">
        <button
          ref={ref}
          onClick={onClick}
          className={cn(
            'absolute inset-0 flex items-center justify-center rounded-2xl transition-all duration-200',
            'shadow-lg hover:shadow-xl',
            'group overflow-hidden backdrop-blur-md border',
            variantStyles[variant]
          )}
        >
          <motion.div style={{ width: iconSize, height: iconSize }}>
            <Icon className="w-full h-full transition-colors duration-200" />
          </motion.div>
        </button>
      </motion.div>

      {/* Tooltip */}
      <motion.div
        initial={{ opacity: 0, x: 10, scale: 0.8 }}
        whileHover={{ opacity: 1, x: 0, scale: 1 }}
        className="absolute left-full ml-3 px-3 py-1.5 bg-slate-900 dark:bg-slate-800 text-white text-xs rounded-lg whitespace-nowrap pointer-events-none shadow-xl border border-slate-700/50 z-50"
      >
        {label}
        <div className="absolute top-1/2 right-full -translate-y-1/2 mr-px w-2 h-2 bg-slate-900 dark:bg-slate-800 rotate-45 border-l border-b border-slate-700/50" />
      </motion.div>
    </div>
  );
}
