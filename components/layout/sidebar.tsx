'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Home, Settings, BookOpen, Users, Shield, Menu, X, Sun, Moon, ChevronRight, Sparkles, Bell, LogOut } from 'lucide-react';
import { useTheme } from '../providers/theme-provider';
import { Button } from '@/components/ui/button';
import { signOut } from 'next-auth/react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

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
}

export function Sidebar({ onClose }: SidebarProps = {}) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { data: session } = useSession();
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();

  // Prevent hydration issues by waiting for client mount
  useEffect(() => {
    setMounted(true);
  }, []);

  const baseNavigation = [
    { name: 'Dashboard', href: '/dashboard', icon: Home, color: 'from-blue-500 to-cyan-500' },
    { name: 'My Bookings', href: '/bookings', icon: BookOpen, color: 'from-purple-500 to-pink-500' },
    { name: 'Calendar', href: '/calendar', icon: Calendar, color: 'from-green-500 to-emerald-500' },
    { name: 'Notifications', href: '/notifications', icon: Bell, color: 'from-orange-500 to-yellow-500' },
    { name: 'Settings', href: '/settings', icon: Settings, color: 'from-gray-500 to-slate-600' },
  ];

  // Filter out Settings for admin users since they have it in admin section
  const navigation = session?.user?.role === 'admin' 
    ? baseNavigation.filter(item => item.name !== 'Settings')
    : baseNavigation;

  const adminNavigation = [
    { name: 'Admin Panel', href: '/admin', icon: Shield, color: 'from-orange-500 to-red-500' },
    { name: 'Manage Users', href: '/admin/users', icon: Users, color: 'from-indigo-500 to-purple-500' },
    { name: 'Settings', href: '/admin/settings', icon: Settings, color: 'from-gray-500 to-slate-600' },
  ];

  // Show basic layout during SSR to prevent hydration mismatch
  if (!mounted) {
    return (
      <div className="h-screen w-[280px] bg-white dark:bg-slate-950 border-r border-slate-200 dark:border-slate-800 flex flex-col relative z-50 shadow-xl">
        <div className="p-6 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
              <Home className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-xl font-bold text-black dark:text-white">CircleIn</span>
              <div className="text-xs text-black dark:text-slate-400">Community Hub</div>
            </div>
          </div>
        </div>
        <nav className="flex-1 p-4">
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
        className="h-screen bg-gradient-to-b from-white via-slate-50 to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800 border-r border-slate-200/50 dark:border-slate-800/50 flex flex-col relative z-50 shadow-xl w-[280px] lg:w-auto"
      >
        {/* Decorative top gradient */}
        <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-br from-blue-500/10 via-purple-500/5 to-transparent pointer-events-none" />
        
        {/* Header */}
        <div className="relative p-6 border-b border-slate-200/50 dark:border-slate-800/50">
          {isCollapsed ? (
            // Collapsed state - center the menu button
            <div className="flex justify-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-colors group w-10 h-10 flex items-center justify-center"
              >
                <Menu className="w-5 h-5 text-black dark:text-slate-300 group-hover:scale-110 transition-transform" />
              </Button>
            </div>
          ) : (
            // Expanded state - show logo and toggle button
            <div className="flex items-center justify-between">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center space-x-3"
              >
                <div className="relative">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/25">
                    <Home className="w-5 h-5 text-white" />
                  </div>
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full animate-pulse" />
                </div>
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex flex-col"
                >
                  <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    CircleIn
                  </span>
                  <span className="text-xs text-black dark:text-slate-400 -mt-1">
                    Community Hub
                  </span>
                </motion.div>
              </motion.div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-colors group w-8 h-8 flex items-center justify-center"
              >
                <motion.div
                  animate={{ rotate: 180 }}
                  transition={{ type: "spring", stiffness: 200, damping: 20 }}
                >
                  <ChevronRight className="w-4 h-4 text-black dark:text-slate-300 group-hover:scale-110 transition-transform" />
                </motion.div>
              </Button>
            </div>
          )}

          {/* User Info */}
          <AnimatePresence>
            {!isCollapsed && session?.user && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="mt-4 p-3 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-slate-800/50 dark:to-slate-700/50 rounded-xl border border-blue-100 dark:border-slate-700"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white text-sm font-medium">
                    {session.user.name?.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-black dark:text-slate-100 truncate">
                      {session.user.name}
                    </p>
                    <p className="text-xs text-black dark:text-slate-400 truncate font-medium">
                      {session.user.email}
                    </p>
                  </div>
                  <Sparkles className="w-4 h-4 text-blue-500 animate-pulse" />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          <AnimatePresence>
            {!isCollapsed && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="px-3 py-2 mb-4"
              >
                <h3 className="text-xs font-bold text-black dark:text-slate-400 uppercase tracking-wider">
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
            >
              {isCollapsed ? (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Link
                      href={item.href}
                      onClick={() => onClose?.()}
                      className={cn(
                        'group relative flex items-center justify-center px-3 py-3 rounded-xl text-sm font-medium transition-all duration-300 overflow-hidden',
                        pathname === item.href
                          ? 'bg-gradient-to-r text-white shadow-lg'
                          : 'text-black dark:text-slate-300 hover:bg-gradient-to-r hover:from-slate-100 hover:to-slate-50 dark:hover:from-slate-800/50 dark:hover:to-slate-700/30'
                      )}
                      style={{
                        background: pathname === item.href ? `linear-gradient(135deg, ${item.color.split(' ')[1]} 0%, ${item.color.split(' ')[3]} 100%)` : undefined
                      }}
                    >
                      <motion.div
                        variants={iconVariants}
                        className="relative z-10"
                      >
                        <item.icon className={cn(
                          "w-5 h-5 transition-colors duration-300",
                          pathname === item.href ? "text-white" : "text-black dark:text-slate-400 group-hover:text-black dark:group-hover:text-slate-200"
                        )} />
                      </motion.div>
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    <p className="font-medium">{item.name}</p>
                  </TooltipContent>
                </Tooltip>
              ) : (
                <Link
                  href={item.href}
                  onClick={() => onClose?.()}
                  className={cn(
                    'group relative flex items-center px-3 py-3 rounded-xl text-sm font-medium transition-all duration-300 overflow-hidden',
                    pathname === item.href
                      ? 'bg-gradient-to-r text-white shadow-lg'
                      : 'text-black dark:text-slate-300 hover:bg-gradient-to-r hover:from-slate-100 hover:to-slate-50 dark:hover:from-slate-800/50 dark:hover:to-slate-700/30'
                  )}
                  style={{
                    background: pathname === item.href ? `linear-gradient(135deg, ${item.color.split(' ')[1]} 0%, ${item.color.split(' ')[3]} 100%)` : undefined
                  }}
                >
                  {/* Active indicator */}
                  {pathname === item.href && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute inset-0 bg-gradient-to-r opacity-100 rounded-xl"
                      style={{
                        background: `linear-gradient(135deg, ${item.color.split(' ')[1]} 0%, ${item.color.split(' ')[3]} 100%)`
                      }}
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
                  )}
                  
                  {/* Hover glow effect */}
                  <div className="absolute inset-0 bg-gradient-to-r opacity-0 group-hover:opacity-10 transition-opacity duration-300 rounded-xl"
                    style={{
                      background: `linear-gradient(135deg, ${item.color.split(' ')[1]} 0%, ${item.color.split(' ')[3]} 100%)`
                    }}
                  />

                  <motion.div
                    variants={iconVariants}
                    className="relative z-10"
                  >
                    <item.icon className={cn(
                      "w-5 h-5 transition-colors duration-300",
                      pathname === item.href ? "text-gray-900 dark:text-white" : "text-gray-600 dark:text-slate-400 group-hover:text-gray-800 dark:group-hover:text-slate-200"
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
                          "ml-3 relative z-10 transition-colors duration-300 font-medium",
                          pathname === item.href ? "text-gray-900 dark:text-white font-semibold" : "text-gray-700 dark:text-slate-300 group-hover:text-gray-900 dark:group-hover:text-slate-100"
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
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        className="ml-auto relative z-10"
                      >
                        <ChevronRight className="w-4 h-4 text-white" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Link>
              )}
            </motion.div>
          ))}

          {session?.user?.role === 'admin' && (
            <>
              <div className="my-6 relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200 dark:border-slate-700" />
                </div>
                <AnimatePresence>
                  {!isCollapsed && (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      className="relative flex justify-center text-xs font-semibold"
                    >
                      <span className="bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 px-3 py-1 text-black dark:text-slate-400 uppercase tracking-wider rounded-full font-bold">
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
                >
                  {isCollapsed ? (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Link
                          href={item.href}
                          onClick={() => onClose?.()}
                          className={cn(
                            'group relative flex items-center justify-center px-3 py-3 rounded-xl text-sm font-medium transition-all duration-300 overflow-hidden',
                            pathname === item.href
                              ? 'bg-gradient-to-r text-white shadow-lg'
                              : 'text-black dark:text-slate-300 hover:bg-gradient-to-r hover:from-slate-100 hover:to-slate-50 dark:hover:from-slate-800/50 dark:hover:to-slate-700/30'
                          )}
                          style={{
                            background: pathname === item.href ? `linear-gradient(135deg, ${item.color.split(' ')[1]} 0%, ${item.color.split(' ')[3]} 100%)` : undefined
                          }}
                        >
                          <motion.div
                            variants={iconVariants}
                            className="relative z-10"
                          >
                            <item.icon className={cn(
                              "w-5 h-5 transition-colors duration-300",
                              pathname === item.href ? "text-gray-900 dark:text-white" : "text-gray-600 dark:text-slate-400 group-hover:text-gray-800 dark:group-hover:text-slate-200"
                            )} />
                          </motion.div>
                        </Link>
                      </TooltipTrigger>
                      <TooltipContent side="right">
                        <p className="font-medium">{item.name}</p>
                      </TooltipContent>
                    </Tooltip>
                  ) : (
                    <Link
                      href={item.href}
                      onClick={() => onClose?.()}
                      className={cn(
                        'group relative flex items-center px-3 py-3 rounded-xl text-sm font-medium transition-all duration-300 overflow-hidden',
                        pathname === item.href
                          ? 'bg-gradient-to-r text-white shadow-lg'
                          : 'text-black dark:text-slate-300 hover:bg-gradient-to-r hover:from-slate-100 hover:to-slate-50 dark:hover:from-slate-800/50 dark:hover:to-slate-700/30'
                      )}
                      style={{
                        background: pathname === item.href ? `linear-gradient(135deg, ${item.color.split(' ')[1]} 0%, ${item.color.split(' ')[3]} 100%)` : undefined
                      }}
                    >
                      {/* Active indicator */}
                      {pathname === item.href && (
                        <motion.div
                          layoutId="activeAdminTab"
                          className="absolute inset-0 bg-gradient-to-r opacity-100 rounded-xl"
                          style={{
                            background: `linear-gradient(135deg, ${item.color.split(' ')[1]} 0%, ${item.color.split(' ')[3]} 100%)`
                          }}
                          transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        />
                      )}
                      
                      {/* Hover glow effect */}
                      <div className="absolute inset-0 bg-gradient-to-r opacity-0 group-hover:opacity-10 transition-opacity duration-300 rounded-xl"
                        style={{
                          background: `linear-gradient(135deg, ${item.color.split(' ')[1]} 0%, ${item.color.split(' ')[3]} 100%)`
                        }}
                      />

                      <motion.div
                        variants={iconVariants}
                        className="relative z-10"
                      >
                        <item.icon className={cn(
                          "w-5 h-5 transition-colors duration-300",
                          pathname === item.href ? "text-gray-900 dark:text-white" : "text-gray-600 dark:text-slate-400 group-hover:text-gray-800 dark:group-hover:text-slate-200"
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
                              "ml-3 relative z-10 transition-colors duration-300 font-medium",
                              pathname === item.href ? "text-gray-900 dark:text-white font-semibold" : "text-gray-700 dark:text-slate-300 group-hover:text-gray-900 dark:group-hover:text-slate-100"
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
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -10 }}
                            className="ml-auto relative z-10"
                          >
                            <ChevronRight className="w-4 h-4 text-white" />
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
        <div className="p-4 border-t border-slate-200/50 dark:border-slate-800/50 bg-gradient-to-b from-transparent to-slate-50/50 dark:to-slate-900/50 space-y-2">
          {/* Theme Toggle */}
          <motion.div
            variants={linkVariants}
            initial="initial"
            whileHover="hover"
            whileTap="tap"
          >
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="w-full justify-start px-3 py-3 rounded-xl hover:bg-gradient-to-r hover:from-amber-50 hover:to-orange-50 dark:hover:from-slate-800/50 dark:hover:to-slate-700/30 transition-all duration-300 group"
            >
              <motion.div
                animate={{ 
                  rotate: theme === 'dark' ? 0 : 180,
                  scale: theme === 'dark' ? 1 : 1.1
                }}
                transition={{ type: "spring", stiffness: 200, damping: 20 }}
                className="relative"
              >
                {theme === 'dark' ? (
                  <Sun className="w-5 h-5 text-amber-500 group-hover:text-amber-600 transition-colors" />
                ) : (
                  <Moon className="w-5 h-5 text-black dark:text-slate-400 group-hover:text-black dark:group-hover:text-slate-200 transition-colors" />
                )}
              </motion.div>
              
              <AnimatePresence mode="wait">
                {!isCollapsed && (
                  <motion.span
                    variants={textVariants}
                    initial="hidden"
                    animate="visible"
                    exit="hidden"
                    className="ml-3 text-black dark:text-slate-300 group-hover:text-black dark:group-hover:text-slate-100 transition-colors font-medium"
                  >
                    {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
                  </motion.span>
                )}
              </AnimatePresence>
            </Button>
          </motion.div>

          {/* Logout Button */}
          <motion.div
            variants={linkVariants}
            initial="initial"
            whileHover="hover"
            whileTap="tap"
          >
            {isCollapsed ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => signOut({ callbackUrl: '/auth/signin' })}
                    className="w-full justify-center px-3 py-3 rounded-xl hover:bg-gradient-to-r hover:from-red-50 hover:to-pink-50 dark:hover:from-red-900/20 dark:hover:to-pink-900/20 transition-all duration-300 group"
                  >
                    <LogOut className="w-5 h-5 text-red-500 group-hover:text-red-600 transition-colors" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">
                  <p className="font-medium">Logout</p>
                </TooltipContent>
              </Tooltip>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => signOut({ callbackUrl: '/auth/signin' })}
                className="w-full justify-start px-3 py-3 rounded-xl hover:bg-gradient-to-r hover:from-red-50 hover:to-pink-50 dark:hover:from-red-900/20 dark:hover:to-pink-900/20 transition-all duration-300 group"
              >
                <LogOut className="w-5 h-5 text-red-500 group-hover:text-red-600 transition-colors" />
                
                <AnimatePresence mode="wait">
                  {!isCollapsed && (
                    <motion.span
                      variants={textVariants}
                      initial="hidden"
                      animate="visible"
                      exit="hidden"
                      className="ml-3 text-red-600 dark:text-red-400 group-hover:text-red-700 dark:group-hover:text-red-300 transition-colors font-medium"
                    >
                      Logout
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
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="mt-3 px-3"
              >
                <div className="text-xs text-slate-400 dark:text-slate-500 text-center">
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