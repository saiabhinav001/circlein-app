'use client';

import React, { useRef } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
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

  return (
    <div className="flex items-center justify-center w-full">
      <motion.div style={{ height, width }} className="relative">
        <Link
          ref={ref}
          href={href}
          onClick={onClick}
          className={cn(
            'absolute inset-0 flex items-center justify-center rounded-2xl transition-all duration-200',
            'shadow-lg hover:shadow-xl',
            'group overflow-hidden',
            isActive
              ? 'bg-gradient-to-br ring-2 ring-offset-2 ring-offset-white dark:ring-offset-slate-950'
              : 'bg-white/90 dark:bg-slate-800/90 backdrop-blur-md hover:bg-white dark:hover:bg-slate-800 border border-slate-200/50 dark:border-slate-700/50'
          )}
          style={{
            background: isActive ? `linear-gradient(135deg, ${color.split(' ')[1]} 0%, ${color.split(' ')[3]} 100%)` : undefined,
            borderColor: isActive ? 'transparent' : undefined
          }}
        >
          <motion.div style={{ width: iconSize, height: iconSize }}>
            <Icon 
              className={cn(
                'w-full h-full transition-colors duration-200',
                isActive 
                  ? 'text-white' 
                  : 'text-slate-700 dark:text-slate-300 group-hover:text-blue-600 dark:group-hover:text-blue-400'
              )} 
            />
          </motion.div>

          {/* Active indicator dot */}
          {isActive && (
            <motion.div
              layoutId="activeDockDot"
              className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-white"
              transition={{ type: "spring", stiffness: 380, damping: 30 }}
            />
          )}
        </Link>
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
