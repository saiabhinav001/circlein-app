'use client';

import React, { createContext, useContext, useState, useEffect, useRef, useMemo } from 'react';
import { Bell, X, Check, Calendar, Users, Settings, AlertTriangle, ChevronRight, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useSession } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import { collection, query, where, onSnapshot, orderBy, limit, updateDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useCommunityTimeZone } from '@/components/providers/community-branding-provider';
import { formatDateInTimeZone } from '@/lib/timezone';

// Simplified, enterprise-grade notification type
export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'booking' | 'system' | 'community' | 'admin' | 'payment';
  priority: 'normal' | 'important' | 'urgent';
  read: boolean;
  createdAt: number;
  actionUrl?: string;
  source?: string;
  autoHide?: boolean;
  duration?: number;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (notification: Omit<Notification, 'id' | 'createdAt' | 'read'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  removeNotification: (id: string) => void;
  clearAll: () => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

// Notification item component with clean design
interface NotificationItemProps {
  notification: Notification;
  timeZone: string;
  onClick: () => void;
  onDelete: (e: React.MouseEvent) => void;
}

const NotificationItem: React.FC<NotificationItemProps> = ({ notification, timeZone, onClick, onDelete }) => {
  const formatTimeAgo = (timestamp: number) => {
    const now = Date.now();
    const diffInSeconds = Math.floor((now - timestamp) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    return formatDateInTimeZone(new Date(timestamp), timeZone, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const priorityColors = {
    normal: 'bg-slate-300 dark:bg-slate-600',
    important: 'bg-blue-500',
    urgent: 'bg-red-500'
  };

  const typeIcons = {
    booking: Calendar,
    community: Users,
    system: Settings,
    admin: AlertTriangle,
    payment: AlertTriangle
  };

  const Icon = typeIcons[notification.type] || Bell;

  return (
    <div 
      className={cn(
        "relative px-4 py-3 cursor-pointer transition-colors duration-150 group",
        "hover:bg-slate-50 dark:hover:bg-slate-800/50",
        !notification.read && "bg-blue-50/30 dark:bg-blue-900/5"
      )}
      onClick={onClick}
    >
      {/* Priority accent line */}
      <div className={cn("absolute left-0 top-0 bottom-0 w-0.5", priorityColors[notification.priority])} />

      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className={cn(
          "flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center",
          "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
        )}>
          <Icon className="h-4 w-4" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-col xs:flex-row xs:items-start xs:justify-between gap-1 xs:gap-2 mb-1">
            <h4 className={cn(
              "text-sm leading-snug",
              notification.read 
                ? "font-medium text-slate-700 dark:text-slate-300" 
                : "font-semibold text-slate-900 dark:text-slate-100"
            )}>
              {notification.title}
            </h4>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 xs:whitespace-nowrap flex-shrink-0">
              {formatTimeAgo(notification.createdAt)}
            </span>
          </div>
          
          <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
            {notification.message}
          </p>
        </div>

        {/* Delete button - visible on hover */}
        <button
          type="button"
          onClick={onDelete}
          className="flex-shrink-0 p-1.5 rounded-md opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-150"
          aria-label="Delete notification"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const { data: session } = useSession();
  const pathname = usePathname();

  // Close panel when route changes
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('circleInNotifications');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setNotifications(parsed);
      } catch (error) {
        console.error('Failed to load notifications:', error);
      }
    }
  }, []);

  // Save to localStorage whenever notifications change
  useEffect(() => {
    localStorage.setItem('circleInNotifications', JSON.stringify(notifications));
  }, [notifications]);

  // Listen for community notifications from Firestore (real-time only)
  useEffect(() => {
    if (!session?.user?.communityId || !session?.user?.email) return;

    const connectionTime = new Date();

    const q = query(
      collection(db, 'communityNotifications'),
      where('communityId', '==', session.user.communityId),
      orderBy('timestamp', 'desc'),
      limit(50)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          const docData = change.doc.data() as any;
          const notificationData = {
            ...docData,
            timestamp: docData.timestamp?.toDate() || new Date()
          };

          // Only show notifications created AFTER connection time
          if (notificationData.timestamp < connectionTime) {
            return;
          }

          // Don't show notification to the sender
          if (notificationData.senderEmail === session?.user?.email) {
            return;
          }

          // Check targeting
          if (notificationData.targetUser && notificationData.targetUser !== session?.user?.email) {
            return;
          }

          if (notificationData.recipients && notificationData.recipients !== 'all' && notificationData.recipients !== session?.user?.email) {
            return;
          }

          // Convert to local notification format
          const localNotification: Notification = {
            id: change.doc.id,
            title: notificationData.title || 'Community Update',
            message: notificationData.message || 'New community notification',
            type: notificationData.type || 'system',
            priority: notificationData.priority || 'normal',
            read: false,
            createdAt: notificationData.timestamp.getTime(),
            autoHide: notificationData.autoHide ?? false,
            duration: notificationData.duration ?? 5000
          };

          setNotifications(prev => {
            if (prev.some(n => n.id === localNotification.id)) {
              return prev;
            }
            return [localNotification, ...prev];
          });

          // Mark as delivered
          updateDoc(doc(db, 'communityNotifications', change.doc.id), {
            delivered: true,
            deliveredAt: new Date()
          }).catch(console.error);
        }
      });
    }, (error) => {
      console.error('Error listening to community notifications:', error);
    });

    return () => {
      unsubscribe();
    };
  }, [session?.user?.communityId, session?.user?.email]);

  const addNotification = (notification: Omit<Notification, 'id' | 'createdAt' | 'read'>) => {
    const now = Date.now();
    
    // Prevent exact duplicates within 5 seconds
    const isExactDuplicate = notifications.some(existing => 
      existing.title === notification.title && 
      existing.message === notification.message &&
      now - existing.createdAt < 5000
    );

    if (isExactDuplicate) {
      return;
    }

    const newNotification: Notification = {
      ...notification,
      id: `notif_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      createdAt: now,
      read: false
    };

    setNotifications(prev => [newNotification, ...prev.slice(0, 99)]);

    // Auto-hide if specified
    if (notification.autoHide) {
      setTimeout(() => {
        removeNotification(newNotification.id);
      }, notification.duration || 5000);
    }
  };

  const markAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(notification =>
        notification.id === id ? { ...notification, read: true } : notification
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev =>
      prev.map(notification => ({ ...notification, read: true }))
    );
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <NotificationContext.Provider value={{
      notifications,
      unreadCount,
      addNotification,
      markAsRead,
      markAllAsRead,
      removeNotification,
      clearAll,
      isOpen,
      setIsOpen
    }}>
      {children}
    </NotificationContext.Provider>
  );
}

// Clean, minimal notification bell
export function NotificationBell() {
  const { unreadCount, isOpen, setIsOpen } = useNotifications();

  return (
    <Button
      variant="ghost"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsOpen(!isOpen);
      }}
      data-notification-bell="true"
      className={cn(
        "relative h-10 w-10 rounded-full p-0",
        "hover:bg-slate-100 dark:hover:bg-slate-800",
        "focus-visible:ring-2 focus-visible:ring-slate-400 dark:focus-visible:ring-slate-500 focus-visible:ring-offset-2",
        "transition-colors duration-150",
        isOpen && "bg-slate-100 dark:bg-slate-800"
      )}
      aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
    >
      <Bell className={cn(
        "h-5 w-5 transition-colors duration-150",
        unreadCount > 0 
          ? "text-slate-900 dark:text-slate-100" 
          : "text-slate-600 dark:text-slate-400"
      )} />
      
      {/* Clean badge */}
      {unreadCount > 0 && (
        <span className="absolute -top-1 -right-1 min-w-[20px] h-[20px] sm:min-w-[22px] sm:h-[22px] px-1 flex items-center justify-center text-[10px] sm:text-[11px] font-semibold text-white bg-red-500 rounded-full">
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}
    </Button>
  );
}

// Compact notification panel
export function NotificationPanel() {
  const { 
    notifications, 
    isOpen, 
    setIsOpen, 
    markAsRead, 
    markAllAsRead, 
    removeNotification,
    unreadCount 
  } = useNotifications();
  const timeZone = useCommunityTimeZone();

  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const panelRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Click outside to close
  useEffect(() => {
    function handleClickOutside(event: Event) {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        const target = event.target as Element;
        const isNotificationBell = target.closest('[data-notification-bell]');
        if (!isNotificationBell) {
          setIsOpen(false);
        }
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isOpen, setIsOpen]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      
      if (e.key === 'Escape') {
        setIsOpen(false);
      } else if (e.key === '/' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, setIsOpen]);

  // Filter notifications
  const filteredNotifications = useMemo(() => {
    let filtered = notifications;

    // Apply read/unread filter
    if (filter === 'unread') {
      filtered = filtered.filter(n => !n.read);
    }

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(n =>
        n.title.toLowerCase().includes(query) ||
        n.message.toLowerCase().includes(query)
      );
    }

    return filtered.slice(0, 8); // Show recent 8
  }, [notifications, filter, searchQuery]);

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read) {
      markAsRead(notification.id);
    }
  };

  const handleDeleteClick = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    removeNotification(id);
  };

  const handleViewAll = () => {
    setIsOpen(false);
    router.push('/notifications');
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[99] lg:bg-transparent bg-black/20"
        onClick={() => setIsOpen(false)}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        ref={panelRef}
        role="dialog"
        aria-label="Notifications"
        className={cn(
          "fixed z-[100] bg-white dark:bg-slate-900 rounded-xl overflow-hidden",
          "border border-slate-200 dark:border-slate-800",
          "shadow-xl shadow-slate-200/50 dark:shadow-slate-950/50",
          "w-[380px] max-w-[calc(100vw-1rem)] sm:max-w-[calc(100vw-2rem)]",
          "top-[4.2rem] right-2 sm:right-6"
        )}
        style={{
          animation: 'notification-panel-in 150ms ease-out'
        }}
      >
        {/* Header */}
        <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                <Bell className="h-4 w-4 text-slate-600 dark:text-slate-400" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Notifications</h3>
                {unreadCount > 0 && (
                  <p className="text-xs text-slate-500 dark:text-slate-400">{unreadCount} unread</p>
                )}
              </div>
            </div>
          </div>

          {/* Filter tabs */}
          <div className="flex gap-1">
            {['all', 'unread'].map((filterOption) => (
              <button
                key={filterOption}
                onClick={() => setFilter(filterOption as any)}
                className={cn(
                  "px-3 py-1.5 rounded-md text-xs font-medium transition-colors",
                  filter === filterOption
                    ? "bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                )}
              >
                {filterOption === 'all' ? 'All' : 'Unread'}
                {filterOption === 'unread' && unreadCount > 0 && (
                  <span className="ml-1.5 px-1.5 py-0.5 text-[10px] bg-red-500 text-white rounded-full">
                    {unreadCount}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Search */}
        <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              ref={searchRef}
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={cn(
                "w-full h-9 pl-9 pr-8 rounded-lg text-sm",
                "bg-slate-100 dark:bg-slate-800",
                "text-slate-900 dark:text-slate-100 placeholder:text-slate-500",
                "border border-transparent",
                "focus:bg-white dark:focus:bg-slate-900 focus:border-slate-300 dark:focus:border-slate-600",
                "focus:ring-2 focus:ring-slate-200 dark:focus:ring-slate-700",
                "outline-none transition-all duration-150"
              )}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              >
                <X className="h-3.5 w-3.5 text-slate-400" />
              </button>
            )}
          </div>
        </div>

        {/* List */}
        <div className="max-h-[360px] overflow-y-auto">
          {filteredNotifications.length === 0 ? (
            <div className="py-12 px-4 text-center">
              <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                <Bell className="h-5 w-5 text-slate-400" />
              </div>
              <p className="text-sm font-medium text-slate-900 dark:text-slate-100 mb-1">All caught up!</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {searchQuery ? 'No matching notifications' :
                 filter === 'unread' ? 'No unread notifications' : 
                 'No notifications yet'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredNotifications.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  timeZone={timeZone}
                  onClick={() => handleNotificationClick(notification)}
                  onDelete={(e) => handleDeleteClick(e, notification.id)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {notifications.length > 0 && (
          <div className="px-3 py-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
            <div className="flex gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={() => markAllAsRead()}
                  className={cn(
                    "flex-1 h-9 px-3 rounded-lg text-sm font-medium",
                    "bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900",
                    "hover:bg-slate-800 dark:hover:bg-slate-200",
                    "active:scale-[0.98] transition-all duration-150",
                    "flex items-center justify-center gap-2"
                  )}
                >
                  <Check className="h-4 w-4" />
                  Mark all read
                </button>
              )}
              <button
                onClick={handleViewAll}
                className={cn(
                  "flex-1 h-9 px-3 rounded-lg text-sm font-medium",
                  "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300",
                  "hover:bg-slate-200 dark:hover:bg-slate-700",
                  "active:scale-[0.98] transition-all duration-150",
                  "flex items-center justify-center gap-2"
                )}
              >
                View all
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* Animation styles */}
        <style jsx>{`
          @keyframes notification-panel-in {
            from {
              opacity: 0;
              transform: translateY(-8px) scale(0.96);
            }
            to {
              opacity: 1;
              transform: translateY(0) scale(1);
            }
          }
        `}</style>
      </div>
    </>
  );
}
