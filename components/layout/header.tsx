'use client';

import { NotificationBell, NotificationPanel } from '@/components/notifications/NotificationSystem';
import { useSession, signOut } from 'next-auth/react';
import { usePathname } from 'next/navigation';
import { Bell, Search, User, Settings, UserCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { motion } from 'framer-motion';
import { useSearch } from '@/components/providers/search-provider';
import NotificationDropdown from '@/components/notifications/NotificationDropdown';
import Link from 'next/link';
import { HamburgerMenu } from '@/components/ui/hamburger-menu';

interface HeaderProps {
  onMenuClick?: () => void;
  isMenuOpen?: boolean;
}

export function Header({ onMenuClick, isMenuOpen = false }: HeaderProps) {
  const { data: session } = useSession();
  const { searchQuery, setSearchQuery } = useSearch();
  const pathname = usePathname();
  
  // Check if user is in admin context OR if user has admin role
  const isAdminContext = pathname?.includes('/admin');
  const isAdminUser = session?.user?.role === 'admin';

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  return (
    <motion.header
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="h-16 md:h-18 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl flex items-center justify-between px-4 md:px-6 lg:px-8 relative z-40 gap-3 md:gap-4"
    >
      <div className="flex items-center gap-2 md:gap-4 flex-1 min-w-0">
        {/* Hamburger Menu - Only on mobile/tablet */}
        <div className="lg:hidden">
          <HamburgerMenu isOpen={isMenuOpen} onClick={onMenuClick || (() => {})} />
        </div>

        {/* Search Bar - Responsive */}
        <div className="relative flex-1 max-w-xs md:max-w-md lg:max-w-lg">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={handleSearchChange}
            className="w-full pl-10 pr-4 py-2.5 md:py-3 bg-slate-100 dark:bg-slate-800 border-0 rounded-xl text-sm md:text-base focus:ring-2 focus:ring-blue-500 outline-none transition-all duration-200 placeholder:text-slate-400"
          />
        </div>
      </div>

      <div className="flex items-center gap-2 md:gap-3 lg:gap-4 shrink-0">
        {/* Notifications */}
        <div className="relative">
          <NotificationBell />
          <NotificationPanel />
        </div>

        {/* User Avatar */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-10 w-10 md:h-11 md:w-11 rounded-full p-0 hover:bg-slate-100 dark:hover:bg-slate-800">
              <Avatar className="h-10 w-10 md:h-11 md:w-11 ring-2 ring-slate-200 dark:ring-slate-700">
                <AvatarImage src={session?.user?.image || ''} />
                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-sm md:text-base font-semibold">
                  {session?.user?.name?.[0]?.toUpperCase() || <User className="w-5 h-5" />}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-48 sm:w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-xs sm:text-sm font-medium leading-none truncate">{session?.user?.name}</p>
                <p className="text-[10px] sm:text-xs leading-none text-muted-foreground truncate">
                  {session?.user?.email}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/profile" className="flex items-center gap-2 cursor-pointer text-xs sm:text-sm">
                <UserCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                Profile
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href={isAdminUser ? "/admin/settings" : "/settings"} className="flex items-center gap-2 cursor-pointer text-xs sm:text-sm">
                <Settings className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                {isAdminUser ? 'Admin Settings' : 'Settings'}
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => signOut()} className="text-xs sm:text-sm">Logout</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </motion.header>
  );
}