'use client';

import React, { useState, useMemo } from 'react';
import { 
  Bell, 
  Search, 
  Check,
  Trash2,
  Calendar,
  Users,
  Settings,
  AlertTriangle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useNotifications } from '@/components/notifications/NotificationSystem';
import { cn } from '@/lib/utils';

export default function NotificationsPage() {
  const { 
    notifications, 
    unreadCount,
    markAsRead, 
    markAllAsRead, 
    removeNotification
  } = useNotifications();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'unread'>('all');
  const [category, setCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest'>('newest');

  // Get unique categories
  const categories = useMemo(() => {
    const cats = Array.from(new Set(notifications.map(n => n.type)));
    return ['all', ...cats];
  }, [notifications]);

  // Filter and sort notifications
  const filteredNotifications = useMemo(() => {
    let filtered = notifications;

    // Filter by read/unread
    if (filterType === 'unread') {
      filtered = filtered.filter(n => !n.read);
    }

    // Filter by category
    if (category !== 'all') {
      filtered = filtered.filter(n => n.type === category);
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(n =>
        n.title.toLowerCase().includes(query) ||
        n.message.toLowerCase().includes(query)
      );
    }

    // Sort
    filtered.sort((a, b) => {
      if (sortBy === 'newest') {
        return b.createdAt - a.createdAt;
      } else {
        return a.createdAt - b.createdAt;
      }
    });

    return filtered;
  }, [notifications, filterType, category, searchQuery, sortBy]);

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - timestamp) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const typeIcons = {
    booking: Calendar,
    community: Users,
    system: Settings,
    admin: AlertTriangle,
    payment: AlertTriangle
  };

  const priorityColors = {
    normal: 'bg-slate-300 dark:bg-slate-600',
    important: 'bg-blue-500',
    urgent: 'bg-red-500'
  };

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-slate-100 dark:bg-slate-900 flex items-center justify-center flex-shrink-0">
              <Bell className="h-4 w-4 sm:h-5 sm:w-5 text-slate-700 dark:text-slate-300" />
            </div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-semibold text-slate-900 dark:text-slate-100">
              Notifications
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 ml-0 sm:ml-[52px]">
            Stay updated with community events, bookings, and system updates
          </p>
        </div>

        {/* Filter Bar */}
        <div className="mb-4 sm:mb-6 space-y-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              type="text"
              placeholder="Search notifications..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-10 sm:h-11 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-sm"
            />
          </div>

          {/* Filters Row - Stack on mobile, row on larger screens */}
          <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2 sm:gap-2">
            {/* Top row on mobile: Toggle + Mark all read */}
            <div className="flex items-center justify-between sm:justify-start gap-2 w-full sm:w-auto">
              {/* All/Unread Toggle */}
              <div className="flex gap-1 p-1 bg-slate-100 dark:bg-slate-900 rounded-lg">
                <button
                  onClick={() => setFilterType('all')}
                  className={cn(
                    "px-2.5 sm:px-3 py-1.5 rounded-md text-xs sm:text-sm font-medium transition-colors",
                    filterType === 'all'
                      ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-sm"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
                  )}
                >
                  All
                </button>
                <button
                  onClick={() => setFilterType('unread')}
                  className={cn(
                    "px-2.5 sm:px-3 py-1.5 rounded-md text-xs sm:text-sm font-medium transition-colors flex items-center",
                    filterType === 'unread'
                      ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-sm"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
                  )}
                >
                  Unread
                  {unreadCount > 0 && (
                    <span className="ml-1 sm:ml-1.5 px-1.5 py-0.5 text-[10px] bg-red-500 text-white rounded-full">
                      {unreadCount}
                    </span>
                  )}
                </button>
              </div>

              {/* Mark all read - visible on mobile in this row */}
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={markAllAsRead}
                  className="sm:hidden h-8 text-xs px-2"
                >
                  <Check className="h-3.5 w-3.5 mr-1" />
                  Mark read
                </Button>
              )}
            </div>

            {/* Bottom row on mobile: Category + Sort selects */}
            <div className="flex items-center gap-2 w-full sm:w-auto">
              {/* Category */}
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="flex-1 sm:flex-none sm:w-[140px] h-9 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-xs sm:text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat === 'all' ? 'All types' : cat.charAt(0).toUpperCase() + cat.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Sort */}
              <Select value={sortBy} onValueChange={(value) => setSortBy(value as 'newest' | 'oldest')}>
                <SelectTrigger className="flex-1 sm:flex-none sm:w-[120px] h-9 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-xs sm:text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest</SelectItem>
                  <SelectItem value="oldest">Oldest</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Mark all read - Desktop only (in the row) */}
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={markAllAsRead}
                className="hidden sm:flex ml-auto h-9 text-sm"
              >
                <Check className="h-4 w-4 mr-1.5" />
                Mark all read
              </Button>
            )}
          </div>
        </div>

        {/* Notifications List */}
        {filteredNotifications.length === 0 ? (
          <div className="py-12 sm:py-16 text-center">
            <div className="w-14 h-14 sm:w-16 sm:h-16 mx-auto mb-4 rounded-full bg-slate-100 dark:bg-slate-900 flex items-center justify-center">
              <Bell className="h-6 w-6 sm:h-7 sm:w-7 text-slate-400" />
            </div>
            <h3 className="text-base sm:text-lg font-medium text-slate-900 dark:text-slate-100 mb-2">
              {searchQuery || category !== 'all' || filterType === 'unread' 
                ? 'No matching notifications' 
                : 'All caught up!'}
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
              {searchQuery || category !== 'all' || filterType === 'unread'
                ? 'Try adjusting your filters'
                : 'You\'re all up to date'}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredNotifications.map((notification) => {
              const Icon = typeIcons[notification.type] || Bell;
              
              return (
                <div
                  key={notification.id}
                  className={cn(
                    "group relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg sm:rounded-xl",
                    "hover:border-slate-300 dark:hover:border-slate-700 transition-colors",
                    !notification.read && "bg-blue-50/30 dark:bg-blue-900/5"
                  )}
                  onClick={() => !notification.read && markAsRead(notification.id)}
                >
                  {/* Priority accent */}
                  <div className={cn("absolute left-0 top-0 bottom-0 w-0.5 sm:w-1 rounded-l-lg sm:rounded-l-xl", priorityColors[notification.priority])} />

                  <div className="pl-3 sm:pl-5 pr-3 sm:pr-4 py-3 sm:py-4 flex items-start gap-2.5 sm:gap-4">
                    {/* Icon - smaller on mobile */}
                    <div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                      <Icon className="h-4 w-4 sm:h-5 sm:w-5 text-slate-600 dark:text-slate-400" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 sm:gap-3 mb-0.5 sm:mb-1">
                        <h3 className={cn(
                          "text-sm sm:text-base leading-snug line-clamp-2",
                          notification.read
                            ? "font-medium text-slate-700 dark:text-slate-300"
                            : "font-semibold text-slate-900 dark:text-slate-100"
                        )}>
                          {notification.title}
                        </h3>
                        <span className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap flex-shrink-0">
                          {formatTime(notification.createdAt)}
                        </span>
                      </div>
                      <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed line-clamp-2">
                        {notification.message}
                      </p>
                      <div className="mt-1.5 sm:mt-2 flex items-center gap-1.5 sm:gap-2 flex-wrap">
                        <span className="px-1.5 sm:px-2 py-0.5 text-[10px] sm:text-xs font-medium text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 rounded-md">
                          {notification.type}
                        </span>
                        {notification.priority !== 'normal' && (
                          <span className={cn(
                            "px-1.5 sm:px-2 py-0.5 text-[10px] sm:text-xs font-medium rounded-md",
                            notification.priority === 'urgent'
                              ? "text-red-700 dark:text-red-300 bg-red-100 dark:bg-red-900/30"
                              : "text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-900/30"
                          )}>
                            {notification.priority}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Delete - always visible on mobile via touch */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeNotification(notification.id);
                      }}
                      className="flex-shrink-0 p-1.5 sm:p-2 rounded-md opacity-60 sm:opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
                      aria-label="Delete"
                    >
                      <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
