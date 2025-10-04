'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bell, 
  BellRing, 
  Settings, 
  Check, 
  X, 
  Clock, 
  Filter,
  Search,
  Trash2,
  RotateCcw,
  CheckCircle,
  AlertTriangle,
  Info,
  Calendar,
  Star
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { useNotifications } from '@/components/notifications/NotificationSystem';
import { cn } from '@/lib/utils';
import Link from 'next/link';

interface NotificationDropdownProps {
  className?: string;
}

export default function NotificationDropdown({ className }: NotificationDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const { 
    notifications, 
    unreadCount,
    markAsRead, 
    markAllAsRead, 
    removeNotification, 
    clearAll 
  } = useNotifications();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter notifications
  const filteredNotifications = notifications.filter(notification => {
    const matchesFilter = filter === 'all' || 
      (filter === 'unread' && !notification.read) ||
      (filter === 'important' && (notification.priority === 'high' || notification.priority === 'urgent')) ||
      notification.category === filter;

    const matchesSearch = !searchQuery || 
      notification.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      notification.message.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  // Get notification type styles
  const getNotificationStyles = (notification: any) => {
    const baseStyles = "p-4 border-l-4 transition-all duration-200 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer";
    
    if (!notification.read) {
      switch (notification.priority) {
        case 'urgent':
          return `${baseStyles} border-l-red-500 bg-red-50 dark:bg-red-900/20`;
        case 'high':
          return `${baseStyles} border-l-orange-500 bg-orange-50 dark:bg-orange-900/20`;
        case 'medium':
          return `${baseStyles} border-l-blue-500 bg-blue-50 dark:bg-blue-900/20`;
        default:
          return `${baseStyles} border-l-gray-500 bg-gray-50 dark:bg-gray-800`;
      }
    }
    
    return `${baseStyles} border-l-gray-300 dark:border-l-gray-600 opacity-75`;
  };

  // Get priority badge
  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return <Badge variant="destructive" className="text-xs">URGENT</Badge>;
      case 'high':
        return <Badge variant="secondary" className="text-xs bg-orange-100 text-orange-800">HIGH</Badge>;
      case 'medium':
        return <Badge variant="outline" className="text-xs">MEDIUM</Badge>;
      default:
        return null;
    }
  };

  // Handle notification click
  const handleNotificationClick = async (notification: any) => {
    if (!notification.read) {
      await markAsRead(notification.id);
    }
    
    if (notification.actionUrl) {
      setIsOpen(false);
      // Navigate to action URL if needed
    }
  };

  // Clear all with animation
  const handleClearAll = async () => {
    // Animate out all notifications
    const notificationElements = document.querySelectorAll('[data-notification-item]');
    notificationElements.forEach((el, index) => {
      setTimeout(() => {
        el.classList.add('animate-slide-out-right');
      }, index * 50);
    });

    // Wait for animation to complete then clear
    setTimeout(async () => {
      await clearAll();
      setIsOpen(false);
    }, notificationElements.length * 50 + 300);
  };

  return (
    <div className={cn("relative", className)} ref={dropdownRef}>
      {/* Notification Bell Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 h-auto hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
      >
        <motion.div
          animate={unreadCount > 0 ? { scale: [1, 1.1, 1] } : { scale: 1 }}
          transition={{ duration: 0.3, repeat: unreadCount > 0 ? Infinity : 0, repeatDelay: 3 }}
        >
          {unreadCount > 0 ? (
            <BellRing className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          ) : (
            <Bell className="h-5 w-5 text-gray-600 dark:text-gray-400" />
          )}
        </motion.div>
        
        {unreadCount > 0 && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 rounded-full flex items-center justify-center"
          >
            <span className="text-xs text-white font-medium">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          </motion.div>
        )}
      </Button>

      {/* Notification Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 top-full mt-2 w-96 max-w-[90vw] bg-white dark:bg-gray-900 rounded-lg shadow-2xl border border-gray-200 dark:border-gray-700 z-50"
          >
            {/* Header */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Notifications
                </h3>
                <div className="flex items-center gap-2">
                  {unreadCount > 0 && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={markAllAsRead}
                      className="text-xs"
                    >
                      <Check className="h-3 w-3 mr-1" />
                      Mark all read
                    </Button>
                  )}
                  {notifications.length > 0 && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleClearAll}
                      className="text-xs text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-3 w-3 mr-1" />
                      Clear all
                    </Button>
                  )}
                  <Link href="/notifications">
                    <Button size="sm" variant="ghost">
                      <Settings className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </div>

              {/* Stats */}
              <div className="flex gap-4 text-sm mb-3">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="text-gray-600 dark:text-gray-400">
                    {notifications.length} Total
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-gray-600 dark:text-gray-400">
                    {unreadCount} Unread
                  </span>
                </div>
              </div>

              {/* Search and Filter */}
              <div className="space-y-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search notifications..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 h-8 text-sm"
                  />
                </div>
                
                <div className="flex gap-1 overflow-x-auto">
                  {[
                    { key: 'all', label: 'All' },
                    { key: 'unread', label: 'Unread' },
                    { key: 'important', label: 'Important' },
                    { key: 'booking', label: 'Bookings' },
                    { key: 'community', label: 'Community' }
                  ].map(({ key, label }) => (
                    <Button
                      key={key}
                      size="sm"
                      variant={filter === key ? "default" : "outline"}
                      onClick={() => setFilter(key)}
                      className="text-xs whitespace-nowrap"
                    >
                      {label}
                    </Button>
                  ))}
                </div>
              </div>
            </div>

            {/* Notifications List */}
            <ScrollArea className="max-h-96">
              {filteredNotifications.length === 0 ? (
                <div className="p-8 text-center">
                  <Bell className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-gray-400 mb-2">
                    {searchQuery || filter !== 'all' ? 'No matching notifications' : 'No notifications yet'}
                  </p>
                  <p className="text-sm text-gray-400 dark:text-gray-500">
                    {searchQuery || filter !== 'all' ? 'Try adjusting your filters' : 'You\'ll see community updates here'}
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredNotifications.map((notification, index) => (
                    <motion.div
                      key={notification.id}
                      data-notification-item
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ delay: index * 0.05 }}
                      className={getNotificationStyles(notification)}
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <div className="flex items-start gap-3">
                        <div className="text-2xl flex-shrink-0 mt-1">
                          {notification.type === 'booking' ? '📅' : 
                           notification.type === 'community' ? '🏢' :
                           notification.type === 'system' ? '⚙️' :
                           notification.priority === 'urgent' ? '🚨' :
                           notification.priority === 'high' ? '⚠️' : 'ℹ️'}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="font-medium text-gray-900 dark:text-white text-sm leading-tight">
                              {notification.title}
                            </h4>
                            <div className="flex items-center gap-1 flex-shrink-0">
                              {getPriorityBadge(notification.priority)}
                              {!notification.read && (
                                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                              )}
                            </div>
                          </div>
                          
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 leading-relaxed">
                            {notification.message}
                          </p>
                          
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-xs text-gray-500 dark:text-gray-500 flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {new Date(notification.timestamp).toLocaleDateString()}
                            </span>
                            
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              onClick={(e) => {
                                e.stopPropagation();
                                removeNotification(notification.id);
                              }}
                              className="text-xs h-6 px-2 text-gray-500 hover:text-red-600"
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </ScrollArea>

            {/* Footer */}
            {filteredNotifications.length > 0 && (
              <div className="p-3 border-t border-gray-200 dark:border-gray-700 text-center">
                <Link href="/notifications">
                  <Button variant="ghost" size="sm" className="w-full text-sm" onClick={() => setIsOpen(false)}>
                    View All Notifications
                  </Button>
                </Link>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <style jsx>{`
        @keyframes slide-out-right {
          from {
            opacity: 1;
            transform: translateX(0);
          }
          to {
            opacity: 0;
            transform: translateX(100%);
          }
        }
        
        .animate-slide-out-right {
          animation: slide-out-right 0.3s ease-in-out forwards;
        }
      `}</style>
    </div>
  );
}