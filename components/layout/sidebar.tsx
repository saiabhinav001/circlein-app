'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Home, Settings, BookOpen, Users, Shield, Menu, X, Sun, Moon, ChevronRight, Hourglass, Bell, LogOut, MessageCircle, Wrench, BarChart3, Megaphone, ClipboardList, UserX } from 'lucide-react';
import { useTheme } from '../providers/theme-provider';
import { Button } from '@/components/ui/button';
import { signOut } from 'next-auth/react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { CircleInLogo } from '@/components/ui';

const sidebarVariants = {
  open: { 
    width: '280px', 
    opacity: 1,
    transition: { 
      type: "spring" as const, 
      stiffness: 300, 
      damping: 30 
    }
  },
  closed: { 
    width: '72px', 
    opacity: 1,
    transition: { 
      type: "spring" as const, 
      stiffness: 300, 
      damping: 30 
    }
  },
};

const linkVariants = {
  initial: { x: 0, scale: 1 },
  hover: { 
    x: 6, 
    scale: 1.02,
    transition: { 
      type: "spring" as const, 
      stiffness: 400, 
      damping: 25 
    } 
  },
  tap: { scale: 0.95 },
};

const iconVariants = {
  initial: { rotate: 0 },
  hover: { rotate: 5, scale: 1.1 },
  active: { rotate: 0, scale: 1.2 },
};

const textVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: { opacity: 1, x: 0, transition: { delay: 0.1 } },
};

interface SidebarProps {
  onClose?: () => void;
  onCollapseChange?: (collapsed: boolean) => void;
}

export function Sidebar({ onClose, onCollapseChange }: SidebarProps = {}) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { data: session } = useSession();
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();

  // Notify parent when collapse state changes
  const handleCollapseToggle = () => {
    const newCollapsed = !isCollapsed;
    setIsCollapsed(newCollapsed);
    onCollapseChange?.(newCollapsed);
  };

  // Prevent hydration issues by waiting for client mount
  useEffect(() => {
    setMounted(true);
  }, []);

  const baseNavigation = [
    { name: 'Dashboard', href: '/dashboard', icon: Home },
    { name: 'Community', href: '/community', icon: Megaphone },
    { name: 'My Bookings', href: '/bookings', icon: BookOpen },
    { name: 'Calendar', href: '/calendar', icon: Calendar },
    { name: 'Maintenance', href: '/maintenance', icon: Wrench },
    { name: 'Notifications', href: '/notifications', icon: Bell },
    { name: 'Contact Us', href: '/contact', icon: MessageCircle },
    { name: 'Settings', href: '/settings', icon: Settings },
  ];

  // Filter out Settings for admin users since they have it in admin section
  const navigation = session?.user?.role === 'admin' 
    ? baseNavigation.filter(item => item.name !== 'Settings')
    : baseNavigation;

  const adminNavigation = [
    { name: 'Admin Panel', href: '/admin', icon: Shield },
    { name: 'Manage Users', href: '/admin/users', icon: Users },
    { name: 'Waitlist Manager', href: '/admin/waitlist', icon: Hourglass },
    { name: 'Deletion Requests', href: '/admin/deletion-requests', icon: UserX },
    { name: 'Maintenance Desk', href: '/admin/maintenance', icon: ClipboardList },
    { name: 'Analytics', href: '/admin/analytics', icon: BarChart3 },
    { name: 'Settings', href: '/admin/settings', icon: Settings },
      { name: 'Support Tickets', href: '/admin/contact-tickets', icon: MessageCircle },
  ];

  const getTourTarget = (itemName: string, isAdminSection = false) => {
    if (!isAdminSection) {
      if (itemName === 'Dashboard') return 'sidebar-dashboard';
      if (itemName === 'My Bookings') return 'sidebar-bookings';
      if (itemName === 'Calendar') return 'sidebar-calendar';
      if (itemName === 'Settings') return 'sidebar-settings';
      return undefined;
    }

    if (itemName === 'Admin Panel') return 'sidebar-admin-panel';
    if (itemName === 'Manage Users') return 'sidebar-admin-users';
    if (itemName === 'Waitlist Manager') return 'sidebar-admin-waitlist';
    if (itemName === 'Deletion Requests') return 'sidebar-admin-deletion-requests';
    if (itemName === 'Analytics') return 'sidebar-admin-analytics';
    if (itemName === 'Settings') return 'sidebar-admin-settings';
    return undefined;
  };

  // Show basic layout during SSR to prevent hydration mismatch
  if (!mounted) {
    return (
      <div className="h-[100dvh] min-h-screen w-[280px] bg-white dark:bg-slate-950 border-r border-slate-200 dark:border-slate-800 flex flex-col relative z-50 shadow-xl">
        <div className="p-4 sm:p-6 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center space-x-3">
            <div style={{ width: '48px', height: '48px', flexShrink: 0 }}>
              <CircleInLogo size={48} />
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-lg sm:text-xl font-bold text-black dark:text-white truncate block">CircleIn</span>
              <div className="text-xs text-black dark:text-slate-400 truncate">Community Hub</div>
            </div>
          </div>
        </div>
        <nav aria-label="Main navigation" className="flex-1 p-4">
          <div className="space-y-2">
            {navigation.map((item) => (
              <div key={item.name} className="flex items-center px-3 py-3 rounded-xl">
                <item.icon className="w-5 h-5 text-black dark:text-slate-300" />
                <span className="ml-3 text-black dark:text-slate-300 font-medium">{item.name}</span>
              </div>
            ))}
          </div>
        </nav>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <motion.div
        variants={sidebarVariants}
        animate={isCollapsed ? 'closed' : 'open'}
        className="h-[100dvh] min-h-screen bg-white dark:bg-slate-950 border-r border-slate-200 dark:border-slate-800 flex flex-col relative w-full sm:w-[280px] lg:w-auto overflow-hidden"
        style={{ zIndex: 50 }}
      >
        {/* Header */}
        <div className="relative p-4 lg:p-6 border-b border-slate-200 dark:border-slate-800 shrink-0 bg-white dark:bg-slate-950">
          {isCollapsed ? (
            // Collapsed state - only on desktop - show logo icon
            <div className="flex flex-col items-center gap-3">
              <div style={{ width: '40px', height: '40px' }}>
                <CircleInLogo size={40} />
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCollapseToggle}
                aria-label="Expand sidebar"
                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-colors group w-8 h-8 flex items-center justify-center"
              >
                <Menu className="w-4 h-4 text-black dark:text-slate-300 group-hover:scale-110 transition-transform" />
              </Button>
            </div>
          ) : (
            // Expanded state - show logo and toggle button
            <>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3 flex-1 min-w-0">
                  <div className="relative shrink-0" style={{ width: '48px', height: '48px' }}>
                    <CircleInLogo size={48} />
                    <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white dark:border-slate-950" />
                  </div>
                  <div className="flex flex-col min-w-0 flex-1">
                    <span className="text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-100 truncate">
                      CircleIn
                    </span>
                    <span className="text-xs text-slate-600 dark:text-slate-400 -mt-0.5 truncate">
                      Community Hub
                    </span>
                  </div>
                </div>
                {!onClose && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCollapseToggle}
                    aria-label="Collapse sidebar"
                    className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-colors group w-8 h-8 flex items-center justify-center shrink-0"
                  >
                    <motion.div
                      animate={{ rotate: 180 }}
                      transition={{ type: "spring", stiffness: 200, damping: 20 }}
                    >
                      <ChevronRight className="w-4 h-4 text-black dark:text-slate-300 group-hover:scale-110 transition-transform" />
                    </motion.div>
                  </Button>
                )}
                {onClose && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onClose}
                    aria-label="Close menu"
                    className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-colors group w-8 h-8 flex items-center justify-center shrink-0 lg:hidden"
                  >
                    <X className="w-4 h-4 text-black dark:text-slate-300 group-hover:scale-110 transition-transform" />
                  </Button>
                )}
              </div>

              {/* User Info */}
              <AnimatePresence>
                {session?.user && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/80 dark:border-slate-700/60"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-slate-900 dark:bg-slate-100 rounded-lg flex items-center justify-center text-white dark:text-slate-900 text-sm font-medium shrink-0">
                        {session.user.name?.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                          {session.user.name}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                          {session.user.email}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </>
          )}
        </div>

        {/* Navigation */}
        <nav 
          aria-label="Main navigation"
          className={cn(
            "flex-1 overflow-x-hidden",
            isCollapsed 
              ? "flex flex-col items-center justify-start py-4 px-2 gap-2 overflow-y-auto [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-slate-300 [&::-webkit-scrollbar-thumb]:rounded-full dark:[&::-webkit-scrollbar-thumb]:bg-slate-700" 
              : "p-3 sm:p-4 space-y-1.5 sm:space-y-2 overflow-y-auto [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-slate-300 [&::-webkit-scrollbar-thumb]:rounded-full dark:[&::-webkit-scrollbar-thumb]:bg-slate-700"
          )}
        >
          <AnimatePresence>
            {!isCollapsed && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="px-3 py-2 mb-2 sm:mb-3"
              >
                <h3 className="text-[11px] font-semibold text-slate-500 dark:text-slate-500 uppercase tracking-wider">
                  Navigation
                </h3>
              </motion.div>
            )}
          </AnimatePresence>

          {navigation.map((item, index) => (
            <motion.div 
              key={item.name} 
              variants={linkVariants} 
              initial="initial"
              whileHover="hover" 
              whileTap="tap"
              style={{ animationDelay: `${index * 0.1}s` }}
              className={cn(isCollapsed && "w-full flex items-center justify-center")}
            >
              {isCollapsed ? (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Link
                      href={item.href}
                      data-tour={getTourTarget(item.name)}
                      aria-label={item.name}
                      aria-current={pathname === item.href ? 'page' : undefined}
                      onClick={() => onClose?.()}
                      className={cn(
                        'relative flex items-center justify-center w-11 h-11 rounded-xl transition-all duration-150',
                        pathname === item.href
                          ? 'bg-slate-900 dark:bg-white shadow-lg'
                          : 'hover:bg-slate-100 dark:hover:bg-slate-800/70'
                      )}
                    >
                      <item.icon 
                        className={cn(
                          "w-5 h-5 transition-colors duration-150",
                          pathname === item.href 
                            ? "text-white dark:text-slate-900" 
                            : "text-slate-500 dark:text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-300"
                        )} 
                      />
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent side="right">{item.name}</TooltipContent>
                </Tooltip>
              ) : (
                <Link
                  href={item.href}
                  data-tour={getTourTarget(item.name)}
                  aria-current={pathname === item.href ? 'page' : undefined}
                  onClick={() => onClose?.()}
                  className={cn(
                    'group relative flex items-center px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 overflow-hidden',
                    pathname === item.href
                      ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-md'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60 active:scale-[0.98]'
                  )}
                >
                  <motion.div
                    variants={iconVariants}
                    className="relative z-10 flex-shrink-0"
                  >
                    <item.icon className={cn(
                      "w-5 h-5 transition-colors duration-150",
                      pathname === item.href 
                        ? "text-white dark:text-slate-900" 
                        : "text-slate-500 dark:text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200"
                    )} />
                  </motion.div>
                  
                  <AnimatePresence mode="wait">
                    {!isCollapsed && (
                      <motion.span
                        variants={textVariants}
                        initial="hidden"
                        animate="visible"
                        exit="hidden"
                        className={cn(
                          "ml-3 relative z-10 transition-colors duration-150 font-medium text-sm",
                          pathname === item.href 
                            ? "text-white dark:text-slate-900" 
                            : "text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-slate-100"
                        )}
                      >
                        {item.name}
                      </motion.span>
                    )}
                  </AnimatePresence>

                  {/* Chevron indicator for active item */}
                  <AnimatePresence>
                    {pathname === item.href && !isCollapsed && (
                      <motion.div
                        initial={{ opacity: 0, x: -5 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -5 }}
                        className="ml-auto relative z-10"
                      >
                        <ChevronRight className="w-4 h-4 text-white/70 dark:text-slate-900/70" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Link>
              )}
            </motion.div>
          ))}

          {session?.user?.role === 'admin' && (
            <>
              <div className={cn(
                "my-4 relative",
                isCollapsed && "my-2 w-full"
              )}>
                <div className="absolute inset-0 flex items-center">
                  <div className={cn(
                    "w-full border-t border-slate-200 dark:border-slate-800",
                    isCollapsed && "border-slate-200 dark:border-slate-700"
                  )} />
                </div>
                <AnimatePresence>
                  {!isCollapsed && (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      className="relative flex justify-center text-[11px] font-semibold"
                    >
                      <span className="bg-white dark:bg-slate-950 px-2.5 py-0.5 text-slate-500 dark:text-slate-500 uppercase tracking-wider">
                        Admin
                      </span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              
              {adminNavigation.map((item, index) => (
                <motion.div 
                  key={item.name} 
                  variants={linkVariants} 
                  initial="initial"
                  whileHover="hover" 
                  whileTap="tap"
                  style={{ animationDelay: `${(navigation.length + index) * 0.1}s` }}
                  className={cn(isCollapsed && "w-full flex items-center justify-center")}
                >
                  {isCollapsed ? (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Link
                          href={item.href}
                          data-tour={getTourTarget(item.name, true)}
                          aria-label={item.name}
                          aria-current={pathname === item.href ? 'page' : undefined}
                          onClick={() => onClose?.()}
                          className={cn(
                            'relative flex items-center justify-center w-11 h-11 rounded-xl transition-all duration-150',
                            pathname === item.href
                              ? 'bg-slate-900 dark:bg-white shadow-lg'
                              : 'hover:bg-slate-100 dark:hover:bg-slate-800/70'
                          )}
                        >
                          <item.icon 
                            className={cn(
                              "w-5 h-5 transition-colors duration-150",
                              pathname === item.href 
                                ? "text-white dark:text-slate-900" 
                                : "text-slate-500 dark:text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-300"
                            )} 
                          />
                        </Link>
                      </TooltipTrigger>
                      <TooltipContent side="right">{item.name}</TooltipContent>
                    </Tooltip>
                  ) : (
                    <Link
                      href={item.href}
                      data-tour={getTourTarget(item.name, true)}
                      aria-current={pathname === item.href ? 'page' : undefined}
                      onClick={() => onClose?.()}
                      className={cn(
                        'group relative flex items-center px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 overflow-hidden',
                        pathname === item.href
                          ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-md'
                          : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60 active:scale-[0.98]'
                      )}
                    >
                      <motion.div
                        variants={iconVariants}
                        className="relative z-10 flex-shrink-0"
                      >
                        <item.icon className={cn(
                          "w-5 h-5 transition-colors duration-150",
                          pathname === item.href 
                            ? "text-white dark:text-slate-900" 
                            : "text-slate-500 dark:text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200"
                        )} />
                      </motion.div>
                      
                      <AnimatePresence mode="wait">
                        {!isCollapsed && (
                          <motion.span
                            variants={textVariants}
                            initial="hidden"
                            animate="visible"
                            exit="hidden"
                            className={cn(
                              "ml-3 relative z-10 transition-colors duration-150 font-medium text-sm",
                              pathname === item.href 
                                ? "text-white dark:text-slate-900" 
                                : "text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-slate-100"
                            )}
                          >
                            {item.name}
                          </motion.span>
                        )}
                      </AnimatePresence>

                      {/* Chevron indicator for active item */}
                      <AnimatePresence>
                        {pathname === item.href && !isCollapsed && (
                          <motion.div
                            initial={{ opacity: 0, x: -5 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -5 }}
                            className="ml-auto relative z-10"
                          >
                            <ChevronRight className="w-4 h-4 text-white/70 dark:text-slate-900/70" />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </Link>
                  )}
                </motion.div>
              ))}
            </>
          )}
        </nav>

        {/* Footer */}
        <div 
          className={cn(
            "border-t border-slate-200 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-900/30 shrink-0",
            isCollapsed ? "flex flex-col items-center justify-center py-3 px-2 gap-1.5" : "p-3 space-y-1"
          )}
        >
          {/* Theme Toggle */}
          <motion.div
            variants={linkVariants}
            initial="initial"
            whileHover="hover"
            whileTap="tap"
            className={cn(isCollapsed && "w-full flex items-center justify-center")}
          >
            {isCollapsed ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                    aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
                    className="flex items-center justify-center w-11 h-11 rounded-xl hover:bg-slate-100/80 dark:hover:bg-slate-800/80 transition-all duration-200"
                  >
                    <div className="relative w-5 h-5 flex items-center justify-center">
                      <motion.div
                        animate={{ 
                          rotate: theme === 'dark' ? 0 : 180,
                          scale: theme === 'dark' ? 1 : 0,
                          opacity: theme === 'dark' ? 1 : 0
                        }}
                        transition={{ type: "spring", stiffness: 200, damping: 20 }}
                        className="absolute"
                      >
                        <Sun className="w-5 h-5 text-amber-500" />
                      </motion.div>
                      <motion.div
                        animate={{ 
                          rotate: theme === 'dark' ? -180 : 0,
                          scale: theme === 'dark' ? 0 : 1,
                          opacity: theme === 'dark' ? 0 : 1
                        }}
                        transition={{ type: "spring", stiffness: 200, damping: 20 }}
                        className="absolute"
                      >
                        <Moon className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                      </motion.div>
                    </div>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</TooltipContent>
              </Tooltip>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="w-full justify-start px-3 py-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-all duration-150 group"
              >
              <div className="relative w-5 h-5 flex items-center justify-center">
                <motion.div
                  animate={{ 
                    rotate: theme === 'dark' ? 0 : 180,
                    scale: theme === 'dark' ? 1 : 0,
                    opacity: theme === 'dark' ? 1 : 0
                  }}
                  transition={{ type: "spring", stiffness: 200, damping: 20 }}
                  className="absolute"
                >
                  <Sun className="w-5 h-5 text-amber-500 group-hover:text-amber-600 transition-colors" />
                </motion.div>
                <motion.div
                  animate={{ 
                    rotate: theme === 'dark' ? -180 : 0,
                    scale: theme === 'dark' ? 0 : 1,
                    opacity: theme === 'dark' ? 0 : 1
                  }}
                  transition={{ type: "spring", stiffness: 200, damping: 20 }}
                  className="absolute"
                >
                  <Moon className="w-5 h-5 text-slate-700 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-slate-200 transition-colors" />
                </motion.div>
              </div>
              
              <AnimatePresence mode="wait">
                <motion.span
                  variants={textVariants}
                  initial="hidden"
                  animate="visible"
                  exit="hidden"
                  className="ml-3 text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-slate-200 transition-colors font-medium text-sm"
                >
                  {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
                </motion.span>
              </AnimatePresence>
            </Button>
            )}
          </motion.div>

          {/* Logout Button */}
          <motion.div
            variants={linkVariants}
            initial="initial"
            whileHover="hover"
            whileTap="tap"
            className={cn(isCollapsed && "w-full flex items-center justify-center")}
          >
            {isCollapsed ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => signOut({ callbackUrl: '/auth/signin' })}
                    aria-label="Sign out"
                    className="flex items-center justify-center w-11 h-11 rounded-xl hover:bg-red-50 dark:hover:bg-red-500/10 transition-all duration-150"
                  >
                    <LogOut className="w-5 h-5 text-red-500 dark:text-red-400" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">Sign out</TooltipContent>
              </Tooltip>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => signOut({ callbackUrl: '/auth/signin' })}
                className="w-full justify-start px-3 py-2.5 rounded-xl hover:bg-red-50 dark:hover:bg-red-500/10 transition-all duration-150 group"
              >
                <LogOut className="w-5 h-5 text-red-500 dark:text-red-400 group-hover:text-red-600 dark:group-hover:text-red-300 transition-colors" />
                
                <AnimatePresence mode="wait">
                  {!isCollapsed && (
                    <motion.span
                      variants={textVariants}
                      initial="hidden"
                      animate="visible"
                      exit="hidden"
                      className="ml-3 text-red-600 dark:text-red-400 group-hover:text-red-700 dark:group-hover:text-red-300 transition-colors font-medium text-sm"
                    >
                      Sign out
                    </motion.span>
                  )}
                </AnimatePresence>
              </Button>
            )}
          </motion.div>

          {/* Version info */}
          <AnimatePresence>
            {!isCollapsed && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="pt-2 px-3"
              >
                <div className="text-[11px] text-slate-400 dark:text-slate-600 text-center font-medium">
                  CircleIn v1.0.0
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </TooltipProvider>
  );
}