'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { LucideIcon } from 'lucide-react';
import { useState } from 'react';

interface AnimatedTabsProps {
  tabs: {
    value: string;
    label: string;
    icon: LucideIcon;
    badge?: number;
  }[];
  activeTab: string;
  onTabChange: (value: string) => void;
  variant?: 'resident' | 'admin';
}

export function AnimatedSettingsTabs({ tabs, activeTab, onTabChange, variant = 'resident' }: AnimatedTabsProps) {
  const [hoveredTab, setHoveredTab] = useState<string | null>(null);

  const colorSchemes = {
    resident: {
      gradient: 'from-blue-500 via-indigo-500 to-purple-500',
      hoverGlow: 'shadow-blue-500/30',
      activeBg: 'bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500',
      hoverBg: 'hover:bg-blue-50/50 dark:hover:bg-blue-950/30',
      textActive: 'text-white',
      textInactive: 'text-gray-700 dark:text-gray-300',
      borderActive: 'border-blue-200 dark:border-blue-800',
    },
    admin: {
      gradient: 'from-amber-500 via-orange-500 to-red-500',
      hoverGlow: 'shadow-amber-500/30',
      activeBg: 'bg-gradient-to-r from-amber-500 via-orange-500 to-red-500',
      hoverBg: 'hover:bg-amber-50/50 dark:hover:bg-amber-950/30',
      textActive: 'text-white',
      textInactive: 'text-gray-700 dark:text-gray-300',
      borderActive: 'border-amber-200 dark:border-amber-800',
    },
  };

  const colors = colorSchemes[variant];

  return (
    <div className="w-full overflow-x-auto scrollbar-hide -mx-3 px-3 sm:mx-0 sm:px-0">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-1.5 sm:gap-2 p-1.5 sm:p-2 bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl rounded-xl sm:rounded-2xl border border-gray-200 dark:border-slate-700 shadow-lg min-w-max sm:min-w-0"
      >
        {tabs.map((tab, index) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.value;
          const isHovered = hoveredTab === tab.value;

          return (
            <motion.button
              key={tab.value}
              onClick={() => onTabChange(tab.value)}
              onHoverStart={() => setHoveredTab(tab.value)}
              onHoverEnd={() => setHoveredTab(null)}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
              className={`
                relative flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 md:px-5 py-2 sm:py-2.5 md:py-3
                rounded-lg sm:rounded-xl font-medium transition-all duration-300
                ${isActive ? `${colors.activeBg} ${colors.textActive} shadow-lg ${colors.hoverGlow}` : `${colors.textInactive} ${colors.hoverBg}`}
                focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-slate-800
                ${variant === 'resident' ? 'focus:ring-blue-500' : 'focus:ring-amber-500'}
                disabled:opacity-50 disabled:cursor-not-allowed
                text-xs sm:text-sm md:text-base
                whitespace-nowrap
              `}
              whileHover={{ 
                scale: 1.05,
                y: -2,
              }}
              whileTap={{ scale: 0.95 }}
            >
              {/* Background glow effect */}
              <AnimatePresence>
                {(isActive || isHovered) && (
                  <motion.div
                    layoutId={`tab-background-${variant}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{
                      type: 'spring',
                      stiffness: 500,
                      damping: 30,
                    }}
                    className={`
                      absolute inset-0 rounded-lg sm:rounded-xl
                      ${isActive ? colors.activeBg : 'bg-gradient-to-r from-gray-100 to-gray-200 dark:from-slate-700 dark:to-slate-600'}
                    `}
                  />
                )}
              </AnimatePresence>

              {/* Content */}
              <motion.div
                className="relative z-10 flex items-center gap-1.5 sm:gap-2"
                animate={{
                  scale: isActive ? 1.05 : 1,
                }}
                transition={{ duration: 0.2 }}
              >
                {/* Icon with animation */}
                <motion.div
                  animate={{
                    rotate: isActive ? [0, -10, 10, -5, 5, 0] : 0,
                    scale: isActive ? [1, 1.2, 1] : isHovered ? 1.1 : 1,
                  }}
                  transition={{
                    duration: 0.5,
                    repeat: isActive ? Infinity : 0,
                    repeatDelay: 3,
                  }}
                >
                  <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5" />
                </motion.div>

                {/* Label */}
                <motion.span
                  className="hidden xs:inline font-semibold"
                  animate={{
                    opacity: isActive ? 1 : 0.8,
                  }}
                >
                  {tab.label}
                </motion.span>

                {/* Badge */}
                {tab.badge && tab.badge > 0 && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className={`
                      absolute -top-1 -right-1 sm:-top-1.5 sm:-right-1.5
                      min-w-[18px] h-[18px] sm:min-w-[20px] sm:h-[20px]
                      flex items-center justify-center
                      rounded-full text-[9px] sm:text-[10px] font-bold
                      ${isActive ? 'bg-white text-blue-600' : 'bg-red-500 text-white'}
                      shadow-lg
                      px-1
                    `}
                  >
                    {tab.badge > 99 ? '99+' : tab.badge}
                  </motion.div>
                )}
              </motion.div>

              {/* Shine effect on hover */}
              <AnimatePresence>
                {isHovered && !isActive && (
                  <motion.div
                    initial={{ x: '-100%', opacity: 0 }}
                    animate={{ x: '100%', opacity: [0, 0.5, 0] }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.6, ease: 'easeInOut' }}
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent rounded-lg sm:rounded-xl pointer-events-none"
                  />
                )}
              </AnimatePresence>

              {/* Active indicator line */}
              {isActive && (
                <motion.div
                  layoutId={`active-indicator-${variant}`}
                  className={`absolute bottom-0 left-1/2 -translate-x-1/2 w-1/2 h-1 bg-white rounded-full`}
                  transition={{
                    type: 'spring',
                    stiffness: 500,
                    damping: 30,
                  }}
                />
              )}
            </motion.button>
          );
        })}
      </motion.div>
    </div>
  );
}
