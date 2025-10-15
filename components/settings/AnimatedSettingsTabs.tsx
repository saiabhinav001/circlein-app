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
      activeBg: 'bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600',
      activeText: 'text-white',
      inactiveText: 'text-gray-600 dark:text-gray-400',
      hoverBg: 'hover:bg-gray-100/80 dark:hover:bg-slate-700/50',
      glowColor: 'rgba(99, 102, 241, 0.4)',
      badgeBg: 'bg-red-500',
      indicatorGradient: 'from-blue-400 via-indigo-400 to-purple-500',
    },
    admin: {
      activeBg: 'bg-gradient-to-br from-amber-500 via-orange-500 to-red-600',
      activeText: 'text-white',
      inactiveText: 'text-gray-600 dark:text-gray-400',
      hoverBg: 'hover:bg-gray-100/80 dark:hover:bg-slate-700/50',
      glowColor: 'rgba(245, 158, 11, 0.4)',
      badgeBg: 'bg-red-600',
      indicatorGradient: 'from-amber-400 via-orange-400 to-red-500',
    },
  };

  const colors = colorSchemes[variant];

  return (
    <div className="w-full">
      {/* Canva-inspired navigation container */}
      <div className="relative bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-2xl border border-gray-200/60 dark:border-slate-700/60 shadow-xl shadow-gray-900/5 dark:shadow-black/20 p-2">
        <div className="flex items-center justify-start sm:justify-center gap-1 sm:gap-2 overflow-x-auto scrollbar-hide">
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
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ 
                  delay: index * 0.03,
                  type: 'spring',
                  stiffness: 400,
                  damping: 25
                }}
                className={`
                  relative group flex flex-col items-center justify-center gap-1.5 sm:gap-2
                  px-3 sm:px-4 md:px-5 lg:px-6 py-3 sm:py-3.5 md:py-4
                  rounded-xl transition-all duration-300 ease-out
                  min-w-[70px] sm:min-w-[80px] md:min-w-[90px]
                  ${isActive 
                    ? `${colors.activeBg} ${colors.activeText} shadow-lg` 
                    : `bg-transparent ${colors.inactiveText} ${colors.hoverBg}`
                  }
                  focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2
                  ${variant === 'resident' ? 'focus-visible:ring-blue-500' : 'focus-visible:ring-amber-500'}
                `}
                whileHover={{ 
                  y: -2,
                  transition: { duration: 0.2 }
                }}
                whileTap={{ scale: 0.96 }}
              >
                {/* Glow effect on active */}
                {isActive && (
                  <motion.div
                    layoutId={`glow-${variant}`}
                    className={`absolute inset-0 rounded-xl blur-xl opacity-60 ${colors.activeBg}`}
                    initial={false}
                    transition={{
                      type: 'spring',
                      stiffness: 400,
                      damping: 30
                    }}
                  />
                )}

                {/* Icon container with advanced animations */}
                <motion.div 
                  className="relative z-10 flex items-center justify-center"
                  animate={
                    isActive 
                      ? {
                          scale: [1, 1.1, 1],
                          rotate: [0, -5, 5, -3, 3, 0],
                        }
                      : {}
                  }
                  transition={
                    isActive
                      ? {
                          scale: {
                            duration: 0.6,
                            repeat: Infinity,
                            repeatDelay: 3,
                          },
                          rotate: {
                            duration: 0.8,
                            repeat: Infinity,
                            repeatDelay: 3,
                          },
                        }
                      : {}
                  }
                >
                  {/* Animated icon with hover effects */}
                  <motion.div
                    animate={
                      isHovered && !isActive
                        ? {
                            scale: [1, 1.15, 1.05],
                            rotate: [0, -10, 10, -5, 5, 0],
                          }
                        : {}
                    }
                    transition={{
                      duration: 0.6,
                      ease: 'easeInOut',
                    }}
                  >
                    <Icon 
                      className={`
                        w-5 h-5 sm:w-5.5 sm:h-5.5 md:w-6 md:h-6
                        transition-all duration-300
                        ${isActive 
                          ? 'drop-shadow-[0_2px_8px_rgba(255,255,255,0.5)]' 
                          : 'group-hover:scale-110'
                        }
                      `}
                      strokeWidth={isActive ? 2.5 : 2}
                    />
                  </motion.div>

                  {/* Notification badge */}
                  {tab.badge && tab.badge > 0 && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className={`
                        absolute -top-1 -right-1 sm:-top-1.5 sm:-right-1.5
                        ${colors.badgeBg} text-white
                        min-w-[18px] h-[18px] sm:min-w-[20px] sm:h-[20px]
                        flex items-center justify-center
                        text-[9px] sm:text-[10px] font-bold
                        rounded-full shadow-lg
                        px-1
                      `}
                    >
                      {tab.badge > 99 ? '99+' : tab.badge}
                    </motion.div>
                  )}
                </motion.div>

                {/* Label */}
                <motion.span
                  className={`
                    relative z-10 text-[10px] sm:text-xs md:text-sm font-semibold
                    tracking-wide whitespace-nowrap
                    ${isActive ? 'text-white' : ''}
                  `}
                  animate={{
                    opacity: isActive ? 1 : 0.8,
                  }}
                >
                  {tab.label}
                </motion.span>

                {/* Active indicator line at bottom */}
                {isActive && (
                  <motion.div
                    layoutId={`indicator-${variant}`}
                    className={`absolute -bottom-2 left-1/2 -translate-x-1/2 w-[60%] h-[3px] sm:h-1 rounded-full bg-gradient-to-r ${colors.indicatorGradient}`}
                    initial={false}
                    transition={{
                      type: 'spring',
                      stiffness: 500,
                      damping: 35,
                    }}
                    style={{
                      boxShadow: `0 0 20px ${colors.glowColor}, 0 4px 12px ${colors.glowColor}`,
                    }}
                  >
                    {/* Animated shimmer on indicator */}
                    <motion.div
                      className="absolute inset-0 rounded-full bg-gradient-to-r from-transparent via-white/60 to-transparent"
                      animate={{
                        x: ['-100%', '100%'],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: 'linear',
                        repeatDelay: 1,
                      }}
                    />
                  </motion.div>
                )}

                {/* Hover shine effect */}
                <AnimatePresence>
                  {isHovered && !isActive && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0 rounded-xl bg-gradient-to-br from-white/20 via-transparent to-transparent pointer-events-none"
                    />
                  )}
                </AnimatePresence>
              </motion.button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
