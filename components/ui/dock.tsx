'use client';

import React, { useRef, useState } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { cn } from '@/lib/utils';

export interface DockItem {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  href?: string;
  isActive?: boolean;
}

interface DockProps {
  items: DockItem[];
  panelHeight?: number;
  baseItemSize?: number;
  magnification?: number;
  className?: string;
}

function DockIcon({ 
  icon, 
  label, 
  onClick,
  isActive,
  mouseX,
  baseSize = 50,
  magnification = 70 
}: { 
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  isActive?: boolean;
  mouseX: any;
  baseSize?: number;
  magnification?: number;
}) {
  const ref = useRef<HTMLButtonElement>(null);

  const distance = useTransform(mouseX, (val: number) => {
    const bounds = ref.current?.getBoundingClientRect() ?? { x: 0, width: 0 };
    return val - bounds.x - bounds.width / 2;
  });

  const widthSync = useTransform(distance, [-150, 0, 150], [baseSize, magnification, baseSize]);
  const width = useSpring(widthSync, { mass: 0.1, stiffness: 150, damping: 12 });

  return (
    <motion.button
      ref={ref}
      style={{ width, height: width }}
      whileTap={{ scale: 0.9 }}
      onClick={onClick}
      className={cn(
        "relative flex items-center justify-center rounded-2xl transition-all duration-200",
        "bg-white/90 dark:bg-slate-800/90 backdrop-blur-md",
        "border border-slate-200/50 dark:border-slate-700/50",
        "shadow-lg hover:shadow-xl",
        "group",
        isActive && "ring-2 ring-blue-500 ring-offset-2 dark:ring-offset-slate-900"
      )}
    >
      <div className={cn(
        "transition-colors duration-200",
        isActive 
          ? "text-blue-600 dark:text-blue-400" 
          : "text-slate-700 dark:text-slate-300 group-hover:text-blue-600 dark:group-hover:text-blue-400"
      )}>
        {icon}
      </div>
      
      {/* Tooltip */}
      <motion.div
        initial={{ opacity: 0, y: 10, scale: 0.8 }}
        whileHover={{ opacity: 1, y: 0, scale: 1 }}
        className="absolute -top-12 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-slate-900 dark:bg-slate-800 text-white text-xs rounded-lg whitespace-nowrap pointer-events-none shadow-xl border border-slate-700/50"
      >
        {label}
        <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px w-2 h-2 bg-slate-900 dark:bg-slate-800 rotate-45 border-r border-b border-slate-700/50" />
      </motion.div>

      {/* Active indicator */}
      {isActive && (
        <motion.div
          layoutId="activeDot"
          className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-blue-600 dark:bg-blue-400"
          transition={{ type: "spring", stiffness: 380, damping: 30 }}
        />
      )}
    </motion.button>
  );
}

export default function Dock({
  items,
  panelHeight = 68,
  baseItemSize = 50,
  magnification = 70,
  className
}: DockProps) {
  const mouseX = useMotionValue(Infinity);

  return (
    <motion.div
      onMouseMove={(e) => mouseX.set(e.pageX)}
      onMouseLeave={() => mouseX.set(Infinity)}
      className={cn(
        "fixed bottom-6 left-1/2 -translate-x-1/2 z-50",
        "hidden lg:flex items-end gap-3 px-4 py-3",
        "bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl",
        "rounded-2xl shadow-2xl",
        "border border-slate-200/50 dark:border-slate-700/50",
        className
      )}
      style={{ height: panelHeight }}
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.2 }}
    >
      {items.map((item, i) => (
        <DockIcon
          key={i}
          mouseX={mouseX}
          icon={item.icon}
          label={item.label}
          onClick={item.onClick}
          isActive={item.isActive}
          baseSize={baseItemSize}
          magnification={magnification}
        />
      ))}
    </motion.div>
  );
}
