'use client';

import { NotificationBell, NotificationPanel } from '@/components/notifications/notification-system';
import OfflineIndicator from '@/components/layout/offline-indicator';
import { useSession, signOut } from 'next-auth/react';
import { usePathname } from 'next/navigation';
import { Search, User, Settings, UserCircle, LogOut, ChevronRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Link from 'next/link';
import { HamburgerMenu } from '@/components/ui/hamburger-menu';
import { cn } from '@/lib/utils';

interface HeaderProps {
  onMenuClick?: () => void;
  isMenuOpen?: boolean;
}

export function Header({ onMenuClick, isMenuOpen = false }: HeaderProps) {
  const { data: session } = useSession();
  const pathname = usePathname();
  
  // Check if user is in admin context OR if user has admin role
  const isAdminUser = session?.user?.role === 'admin';

  const openCommandPalette = () => {
    window.dispatchEvent(new Event('circlein-open-command-palette'));
  };

  // Get page title from pathname
  const getPageTitle = () => {
    const path = pathname?.split('/').filter(Boolean) || [];
    if (path.length === 0) return 'Dashboard';
    
    // Handle amenity detail pages - don't show the ID
    if (path[0] === 'amenity' && path.length > 1) {
      return 'Amenity Booking';
    }
    
    // Handle admin sub-pages
    if (path[0] === 'admin' && path.length > 1) {
      const subPage = path[path.length - 1];
      return subPage.charAt(0).toUpperCase() + subPage.slice(1).replace(/-/g, ' ');
    }
    
    const lastSegment = path[path.length - 1];
    return lastSegment.charAt(0).toUpperCase() + lastSegment.slice(1).replace(/-/g, ' ');
  };

  return (
    <header
      className="h-14 sm:h-16 border-b border-border bg-card/95 dark:bg-card/95 backdrop-blur-sm flex items-center justify-between px-3 sm:px-4 md:px-6 lg:px-8 relative z-40"
    >
      <div className="flex items-center gap-2.5 md:gap-4 flex-1 min-w-0">
        {/* Hamburger Menu - Only on mobile/tablet */}
        <div className="lg:hidden shrink-0">
          <HamburgerMenu isOpen={isMenuOpen} onClick={onMenuClick || (() => {})} />
        </div>

        {/* Page Title - Hidden on mobile */}
        <div className="hidden md:flex items-center gap-2.5 shrink-0">
          <h1 className="text-h4 text-slate-900 dark:text-slate-100">
            {getPageTitle()}
          </h1>
          {isAdminUser && pathname?.includes('/admin') && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/40 rounded-md uppercase tracking-wide">
              <Sparkles className="w-3 h-3" />
              Admin
            </span>
          )}
        </div>

        {/* Search Bar */}
        <div data-tour="header-search" className="relative flex-1 min-w-0 max-w-none md:max-w-md lg:max-w-lg ml-auto md:ml-4">
          <button
            type="button"
            onClick={openCommandPalette}
            aria-label="Search and run commands (Ctrl+K)"
            aria-haspopup="dialog"
            className={cn(
              "group relative isolate w-full h-9 rounded-xl px-2.5 sm:px-3",
              "flex items-center gap-1.5 sm:gap-2 text-left",
              "bg-gradient-to-b from-white to-slate-50 dark:from-slate-900 dark:to-slate-900",
              "border border-slate-200/95 dark:border-slate-500/70",
              "hover:-translate-y-px hover:border-emerald-300/70 dark:hover:border-emerald-600/60",
              "hover:shadow-[0_10px_24px_-18px_rgba(16,185,129,0.72)] dark:hover:shadow-[0_10px_24px_-18px_rgba(16,185,129,0.5)]",
              "focus-visible:-translate-y-px",
              "focus-visible:border-emerald-400/80 dark:focus-visible:border-emerald-500/70",
              "focus-visible:ring-2 focus-visible:ring-emerald-200 dark:focus-visible:ring-emerald-800/80",
              "outline-none transition-all duration-200"
            )}
          >
            <span
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 rounded-xl bg-gradient-to-r from-emerald-500/0 via-emerald-400/10 to-cyan-400/0 opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-focus-visible:opacity-100"
            />
            <Search className="relative z-10 w-4 h-4 shrink-0 text-slate-400 transition-colors duration-200 group-hover:text-emerald-600 dark:text-slate-500 dark:group-hover:text-emerald-400" />
            <span className="relative z-10 min-w-0 flex-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              <span className="block truncate sm:hidden">Search commands</span>
              <span className="hidden sm:block truncate">Search pages and commands</span>
            </span>
            <kbd
              className={cn(
                "relative z-10 ml-auto px-1.5 py-0.5 text-[10px] font-medium rounded hidden lg:block",
                "text-slate-500 dark:text-slate-400",
                "bg-slate-200/80 dark:bg-slate-700/80",
                "border border-slate-300/60 dark:border-slate-600/60",
                "transition-colors duration-200 group-hover:border-emerald-200 group-hover:text-emerald-700 dark:group-hover:border-emerald-700 dark:group-hover:text-emerald-400"
              )}
            >
              Ctrl K
            </kbd>
          </button>
        </div>
      </div>

      <div className="flex items-center gap-0.5 sm:gap-1 md:gap-2 shrink-0 ml-1 sm:ml-3">
        <OfflineIndicator />

        {/* Notifications */}
        <NotificationBell />
        <NotificationPanel />

        {/* User Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost" 
              aria-label="Open user menu"
              className={cn(
                "relative h-11 w-11 sm:h-10 sm:w-10 rounded-full p-0",
                "hover:bg-slate-100 dark:hover:bg-slate-800",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300 dark:focus-visible:ring-slate-600 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-950",
                "transition-colors duration-100 active:scale-95"
              )}
            >
              <Avatar className="h-11 w-11 sm:h-10 sm:w-10">
                <AvatarImage src={session?.user?.image || ''} alt={session?.user?.name ? `${session.user.name} profile` : 'User profile'} className="object-cover" />
                <AvatarFallback className="bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-sm font-medium">
                  {session?.user?.name?.[0]?.toUpperCase() || <User className="w-4 h-4" />}
                </AvatarFallback>
              </Avatar>
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-white dark:border-slate-950 rounded-full" />
            </Button>
          </DropdownMenuTrigger>
          
          <DropdownMenuContent 
            className={cn(
              "w-56 p-0 overflow-hidden",
              "bg-white dark:bg-slate-900",
              "border border-slate-200 dark:border-slate-800",
              "shadow-lg shadow-slate-900/8 dark:shadow-black/20",
              "rounded-lg",
              "origin-top-right",
              "data-[state=open]:animate-in data-[state=closed]:animate-out",
              "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
              "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
              "data-[side=bottom]:slide-in-from-top-1",
              "duration-150"
            )}
            align="end" 
            sideOffset={6}
          >
            {/* Identity Section */}
            <div className="px-3 py-3 bg-slate-50 dark:bg-slate-800/40">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={session?.user?.image || ''} alt={session?.user?.name ? `${session.user.name} profile` : 'User profile'} className="object-cover" />
                  <AvatarFallback className="bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-sm font-medium">
                    {session?.user?.name?.[0]?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                    {session?.user?.name}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                    {session?.user?.email}
                  </p>
                  {isAdminUser && (
                    <span className="inline-flex items-center gap-1 mt-1 text-[10px] font-medium text-amber-600 dark:text-amber-400">
                      <Sparkles className="w-2.5 h-2.5" />
                      Admin
                    </span>
                  )}
                </div>
              </div>
            </div>
            
            {/* Actions */}
            <div className="py-1">
              <DropdownMenuItem asChild className={cn(
                "mx-1 rounded px-2 py-2 cursor-pointer",
                "focus:bg-slate-100 dark:focus:bg-slate-800",
                "data-[highlighted]:bg-slate-100 dark:data-[highlighted]:bg-slate-800",
                "transition-colors duration-75"
              )}>
                <Link href="/profile" className="flex items-center gap-2.5">
                  <UserCircle className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                  <span className="flex-1 text-sm text-slate-700 dark:text-slate-200">Profile</span>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                </Link>
              </DropdownMenuItem>
              
              <DropdownMenuItem asChild className={cn(
                "mx-1 rounded px-2 py-2 cursor-pointer",
                "focus:bg-slate-100 dark:focus:bg-slate-800",
                "data-[highlighted]:bg-slate-100 dark:data-[highlighted]:bg-slate-800",
                "transition-colors duration-75"
              )}>
                <Link href={isAdminUser ? "/admin/settings" : "/settings"} className="flex items-center gap-2.5">
                  <Settings className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                  <span className="flex-1 text-sm text-slate-700 dark:text-slate-200">Settings</span>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                </Link>
              </DropdownMenuItem>
            </div>
            
            {/* Sign Out */}
            <div className="py-1 border-t border-slate-100 dark:border-slate-800">
              <DropdownMenuItem 
                onClick={() => signOut({ callbackUrl: '/auth/signin' })} 
                className={cn(
                  "mx-1 rounded px-2 py-2 cursor-pointer",
                  "focus:bg-slate-100 dark:focus:bg-slate-800",
                  "data-[highlighted]:bg-slate-100 dark:data-[highlighted]:bg-slate-800",
                  "transition-colors duration-75"
                )}
              >
                <div className="flex items-center gap-2.5 w-full">
                  <LogOut className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                  <span className="text-sm text-slate-700 dark:text-slate-200">Sign out</span>
                </div>
              </DropdownMenuItem>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}