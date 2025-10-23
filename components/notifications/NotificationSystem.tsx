'use client';

import React, { createContext, useContext, useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X, Check, AlertCircle, Info, AlertTriangle, Calendar, Users, Settings, Home, Zap, Star, Clock, TrendingUp, Archive, SortDesc, Filter, Building, CreditCard, MessageSquare, Package, Car, Gift, Wrench, Hash, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { useSession } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import { collection, query, where, onSnapshot, orderBy, limit, updateDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { RadixDeleteButton } from './RadixDeleteButton';  // NEW: Radix UI based delete button
import { UltraDeleteButton } from './UltraDeleteButton';  // ULTRA: Final solution delete button

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'booking' | 'community' | 'system';
  timestamp: Date;
  read: boolean;
  actionUrl?: string;
  actionLabel?: string;
  onAction?: () => void;
  avatar?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category: 'booking' | 'community' | 'system' | 'maintenance' | 'payment' | 'social' | 'amenity' | 'delivery' | 'feedback' | 'parking' | 'promotion';
  autoHide?: boolean;
  duration?: number;
  metadata?: {
    amenityName?: string;
    bookingId?: string;
    userId?: string;
    amount?: string;
    dueDate?: string;
  };
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void;
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

const notificationIcons = {
  info: Info,
  success: Check,
  warning: AlertTriangle,
  error: AlertCircle,
  booking: Calendar,
  community: Users,
  system: Settings
};

const notificationColors = {
  info: 'from-blue-500 to-blue-600',
  success: 'from-green-500 to-green-600',
  warning: 'from-yellow-500 to-orange-500',
  error: 'from-red-500 to-red-600',
  booking: 'from-purple-500 to-purple-600',
  community: 'from-indigo-500 to-indigo-600',
  system: 'from-gray-500 to-gray-600'
};

const priorityStyles = {
  low: 'border-l-gray-300 dark:border-l-gray-600',
  medium: 'border-l-blue-400 dark:border-l-blue-500',
  high: 'border-l-orange-400 dark:border-l-orange-500',
  urgent: 'border-l-red-500 dark:border-l-red-400 bg-red-50/50 dark:bg-red-950/20'
};

// Separate component for notification card to use hooks properly
interface NotificationCardProps {
  notification: Notification;
  removeNotification: (id: string) => void;
  markAsRead: (id: string) => void;
  getPriorityColor: (priority: string) => string;
  getNotificationIcon: (notification: Notification) => React.ReactNode;
  formatTimeAgo: (date: Date) => string;
  router: any;
  setIsOpen: (open: boolean) => void;
}

const NotificationCard: React.FC<NotificationCardProps> = ({
  notification,
  removeNotification,
  markAsRead,
  getPriorityColor,
  getNotificationIcon,
  formatTimeAgo,
  router,
  setIsOpen
}) => {
  const handleCardClick = (e: React.MouseEvent) => {
    // Check if click is on delete button - if yes, ignore
    const target = e.target as HTMLElement;
    const button = target.closest('button[aria-label="Delete notification"]');
    if (button) {
      return;
    }
    
    console.log('📋 Card clicked');
    if (!notification.read) markAsRead(notification.id);
    if (notification.actionUrl) {
      router.push(notification.actionUrl);
      setIsOpen(false);
    }
  };

  const handleDeleteClick = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    e.preventDefault();
    console.log('�️ Delete button clicked:', notification.id);
    removeNotification(notification.id);
  };

  return (
    <div className="relative mb-3">
      {/* DELETE BUTTON - NO ANIMATIONS */}
      <button
        type="button"
        onClick={handleDeleteClick}
        className="absolute top-2 right-2 w-10 h-10 flex items-center justify-center rounded-full bg-white dark:bg-slate-800 border-2 border-gray-300 dark:border-gray-600 hover:border-red-500 hover:bg-red-500 shadow-lg [&:hover>svg]:text-white"
        style={{ 
          zIndex: 999999,
          pointerEvents: 'auto'
        }}
        aria-label="Delete notification"
      >
        <X 
          className="w-5 h-5 text-gray-600 dark:text-gray-300"
          strokeWidth={2.5}
        />
      </button>

      {/* Main clickable notification card */}
      <div
        onClick={handleCardClick}
        className={cn(
          "p-4 sm:p-5 pr-16 cursor-pointer relative rounded-lg border border-gray-200 dark:border-gray-700",
          "hover:shadow-lg hover:bg-blue-50/50 dark:hover:bg-blue-900/20",
          !notification.read && "bg-gradient-to-r from-blue-50/80 to-indigo-50/80 dark:from-blue-900/20 dark:to-indigo-900/20"
        )}
        style={{ zIndex: 1 }}
      >
        {/* Enhanced Priority indicator */}
        {!notification.read && (
          <div
            className={cn(
              "absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b rounded-r-full",
              getPriorityColor(notification.priority)
            )}
          />
        )}

        <div className="flex items-start gap-3 sm:gap-4 relative" style={{ zIndex: 3 }}>
          {/* Enhanced Icon */}
          <div
            className={cn(
              "flex-shrink-0 w-11 h-11 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center text-white shadow-lg bg-gradient-to-br relative overflow-hidden",
              getPriorityColor(notification.priority)
            )}
          >
            {getNotificationIcon(notification)}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-sm sm:text-base leading-tight line-clamp-2 text-gray-900 dark:text-white">
                  {notification.title}
                  {!notification.read && (
                    <span className="ml-2 inline-block w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                  )}
                </h4>
              </div>
              
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="text-xs font-medium whitespace-nowrap text-gray-500 dark:text-gray-300">
                  {formatTimeAgo(new Date(notification.timestamp))}
                </span>
              </div>
            </div>
            
            <p className="text-sm line-clamp-2 leading-relaxed mb-3 text-gray-700 dark:text-gray-300">
              {notification.message}
            </p>

            {/* Action button if available */}
            {notification.actionLabel && (
              <button
                className="px-3 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-semibold rounded-lg shadow-md"
              >
                {notification.actionLabel}
              </button>
            )}
          </div>
        </div>
      </div> {/* Close card */}
    </div>
  );
};

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const { data: session } = useSession();
  const pathname = usePathname();

  // Close notifications when route changes
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  // Load notifications from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('circleInNotifications');
    if (saved) {
      try {
        const parsed = JSON.parse(saved).map((n: any) => ({
          ...n,
          timestamp: new Date(n.timestamp)
        }));
        setNotifications(parsed);
      } catch (error) {
        console.error('Failed to load notifications:', error);
      }
    }
  }, []);

  // Save notifications to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('circleInNotifications', JSON.stringify(notifications));
  }, [notifications]);

  // Listen for community notifications from Firestore (REAL-TIME ONLY)
  useEffect(() => {
    if (!session?.user?.communityId || !session?.user?.email) return;

    // Store the connection time to only show notifications created AFTER this point
    const connectionTime = new Date();
    console.log('🔔 Notification listener connected at:', connectionTime.toISOString());

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

          // CRITICAL: Only show notifications created AFTER connection time (real-time only)
          if (notificationData.timestamp < connectionTime) {
            console.log('🔕 Skipping old notification from:', notificationData.timestamp.toISOString());
            return;
          }

          console.log('🔔 New real-time notification received:', notificationData.title);

          // Don't show notification to the sender
          if (notificationData.senderEmail === session?.user?.email) {
            console.log('🔕 Skipping notification from self');
            return;
          }

          // Check if notification is targeted to specific user
          if (notificationData.targetUser && notificationData.targetUser !== session?.user?.email) {
            console.log('🔕 Skipping notification not targeted to this user');
            return;
          }

          // If recipients field exists and is not 'all', check if user is included
          if (notificationData.recipients && notificationData.recipients !== 'all' && notificationData.recipients !== session?.user?.email) {
            console.log('🔕 Skipping notification not intended for this user');
            return;
          }

          // Convert community notification to local notification format
          const localNotification: Notification = {
            id: change.doc.id,
            title: notificationData.title || 'Community Update',
            message: notificationData.message || 'New community notification',
            type: notificationData.type || 'info',
            timestamp: notificationData.timestamp,
            read: false,
            priority: notificationData.priority || 'medium',
            category: notificationData.category || 'community',
            autoHide: notificationData.autoHide ?? true,
            duration: notificationData.duration ?? 5000,
            metadata: notificationData.metadata || {}
          };

          // Add to local notifications
          setNotifications(prev => {
            // Check if notification already exists
            const exists = prev.some(n => n.id === localNotification.id);
            if (exists) {
              console.log('🔕 Notification already exists, skipping');
              return prev;
            }
            
            console.log('✅ Adding new notification to list');
            return [localNotification, ...prev];
          });

          // Mark as delivered in Firestore
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
      console.log('🔔 Notification listener disconnected');
      unsubscribe();
    };
  }, [session?.user?.communityId, session?.user?.email]);

  const addNotification = (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
    // Enhanced duplicate prevention
    const now = Date.now();
    
    // Check for exact duplicates within 5 seconds
    const isExactDuplicate = notifications.some(existing => 
      existing.title === notification.title && 
      existing.message === notification.message &&
      now - existing.timestamp.getTime() < 5000
    );

    // Check for welcome notification duplicates with longer window (30 seconds)
    const isWelcomeDuplicate = notification.title.includes('Welcome back') && 
      notifications.some(existing => 
        existing.title.includes('Welcome back') &&
        now - existing.timestamp.getTime() < 30000
      );

    if (isExactDuplicate || isWelcomeDuplicate) {
      console.log('🚫 Duplicate notification prevented:', {
        title: notification.title,
        type: isWelcomeDuplicate ? 'welcome' : 'exact',
        recentCount: notifications.filter(n => now - n.timestamp.getTime() < 30000).length
      });
      return;
    }

    console.log('✅ Adding new notification:', notification.title);
    
    const newNotification: Notification = {
      ...notification,
      id: `notif_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      timestamp: new Date(),
      read: false
    };

    setNotifications(prev => {
      // Keep max 100 notifications and remove any older duplicates
      const filtered = prev.filter(n => 
        !(n.title === notification.title && n.message === notification.message)
      );
      return [newNotification, ...filtered.slice(0, 99)];
    });

    // Play notification sound if enabled
    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        new Audio('/notification-sound.mp3').play().catch(() => {});
      } catch (error) {
        // Ignore audio errors
      }
    }

    // Auto-hide notification if specified
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
    console.log('🗑️ Removing notification:', id);
    setNotifications(prev => {
      const filtered = prev.filter(notification => notification.id !== id);
      console.log('✅ Notifications after removal:', filtered.length, 'remaining');
      // Force localStorage update
      try {
        localStorage.setItem('circleInNotifications', JSON.stringify(filtered));
        console.log('💾 Saved to localStorage');
      } catch (error) {
        console.error('❌ Error saving to localStorage:', error);
      }
      return filtered;
    });
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

// Enhanced Notification Bell Component with State-of-the-Art Features
export function NotificationBell() {
  const { unreadCount, isOpen, setIsOpen, clearAll, markAllAsRead } = useNotifications();
  const [isHovered, setIsHovered] = useState(false);
  const router = useRouter();

  return (
    <div className="relative z-[99999]">
      <motion.div
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onHoverStart={() => setIsHovered(true)}
        onHoverEnd={() => setIsHovered(false)}
        className="relative z-[99999]"
      >
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setIsOpen(!isOpen);
          }}
          onDoubleClick={() => {
            router.push('/notifications');
          }}
          data-notification-bell="true"
          className={cn(
            "relative p-3 rounded-full transition-all duration-500 group overflow-hidden z-[99999]",
            "hover:bg-gradient-to-br hover:from-blue-50 hover:to-indigo-50",
            "dark:hover:from-blue-950/30 dark:hover:to-indigo-950/30",
            "focus:ring-2 focus:ring-blue-500/30 focus:ring-offset-2",
            "border border-transparent hover:border-blue-200/50 dark:hover:border-blue-700/50",
            isOpen && "bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-blue-200/50 dark:border-blue-700/50",
            "shadow-sm hover:shadow-lg hover:shadow-blue-500/25 transition-all duration-500",
            "backdrop-blur-sm"
          )}
          style={{ 
            pointerEvents: 'auto',
            position: 'relative',
            zIndex: 99999
          }}
        >
          {/* Enhanced Dynamic Background Glow */}
          <motion.div
            className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-indigo-500/20"
            animate={{
              scale: unreadCount > 0 ? [1, 1.4, 1] : [1, 1.2, 1],
              rotate: [0, 360],
              opacity: unreadCount > 0 ? [0.2, 0.6, 0.2] : [0.1, 0.3, 0.1],
            }}
            transition={{
              scale: {
                duration: unreadCount > 0 ? 2.5 : 4,
                repeat: Infinity,
                ease: "easeInOut" as const
              },
              rotate: {
                duration: 10,
                repeat: Infinity,
                ease: "linear" as const
              },
              opacity: {
                duration: unreadCount > 0 ? 2.5 : 4,
                repeat: Infinity,
                ease: "easeInOut" as const
              }
            }}
          />

          {/* Pulsing Ripple Effects */}
          <motion.div
            className="absolute inset-0 rounded-full bg-blue-400/20"
            animate={unreadCount > 0 ? {
              scale: [1, 1.4, 1],
              opacity: [0, 0.5, 0],
            } : {}}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut" as const
            }}
          />
          
          <motion.div
            className="absolute inset-0 rounded-full bg-purple-400/15"
            animate={unreadCount > 0 ? {
              scale: [1, 1.6, 1],
              opacity: [0, 0.3, 0],
            } : {}}
            transition={{
              duration: 2.5,
              repeat: Infinity,
              ease: "easeInOut" as const,
              delay: 0.5
            }}
          />

          {/* Bell Icon with Ultra Advanced Animations */}
          <motion.div
            className="relative z-10"
            animate={unreadCount > 0 ? {
              rotate: [0, -20, 20, -15, 15, -10, 10, -5, 5, 0],
              scale: [1, 1.1, 1],
              transition: { 
                duration: 1.5, 
                repeat: Infinity, 
                repeatDelay: 3,
                ease: "easeInOut" as const
              }
            } : {
              y: [-2, 2, -2],
              rotate: [0, 3, -3, 0],
              transition: { 
                duration: 4, 
                repeat: Infinity,
                ease: "easeInOut" as const
              }
            }}
            whileHover={{
              scale: 1.15,
              rotate: [0, 5, -5, 0],
              transition: { 
                duration: 0.6,
                repeat: Infinity,
                ease: "easeInOut" as const
              }
            }}
            whileTap={{
              scale: 0.95,
              transition: { duration: 0.1 }
            }}
          >
            <motion.div
              className="relative"
              animate={unreadCount > 0 ? {
                filter: [
                  "drop-shadow(0 0 8px rgb(59 130 246 / 0.5))",
                  "drop-shadow(0 0 12px rgb(147 51 234 / 0.6))",
                  "drop-shadow(0 0 16px rgb(59 130 246 / 0.7))",
                  "drop-shadow(0 0 12px rgb(147 51 234 / 0.6))",
                  "drop-shadow(0 0 8px rgb(59 130 246 / 0.5))"
                ],
              } : {
                filter: [
                  "drop-shadow(0 0 4px rgb(59 130 246 / 0.2))",
                  "drop-shadow(0 0 6px rgb(59 130 246 / 0.3))",
                  "drop-shadow(0 0 4px rgb(59 130 246 / 0.2))"
                ]
              }}
              transition={{ 
                duration: unreadCount > 0 ? 2 : 3, 
                repeat: Infinity, 
                ease: "easeInOut" as const
              }}
            >
              <Bell className={cn(
                "h-6 w-6 transition-all duration-500",
                unreadCount > 0 
                  ? "text-blue-600 dark:text-blue-400" 
                  : "text-gray-600 dark:text-gray-400 group-hover:text-blue-500 dark:group-hover:text-blue-400"
              )} />
            </motion.div>
            
            {/* Ultra Advanced Sound Wave Animation */}
            <AnimatePresence>
              {unreadCount > 0 && (
                <>
                  {[...Array(3)].map((_, i) => (
                    <motion.div
                      key={i}
                      className="absolute -top-1 -right-1 w-4 h-4 border-2 border-blue-400 rounded-full"
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{
                        scale: [0, 1.5, 2],
                        opacity: [0.8, 0.3, 0],
                      }}
                      exit={{ scale: 0, opacity: 0 }}
                      transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        delay: i * 0.3,
                        ease: "easeOut" as const
                      }}
                    />
                  ))}
                </>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Advanced Unread Count Badge */}
          <AnimatePresence>
            {unreadCount > 0 && (
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                className="absolute -top-2 -right-2 z-20"
                whileHover={{ scale: 1.1 }}
              >
                <motion.div
                  className="relative"
                  animate={{
                    scale: [1, 1.2, 1],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut" as const
                  }}
                >
                  {/* Glowing background */}
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-red-500 to-pink-500 rounded-full blur-md"
                    animate={{
                      scale: [1, 1.3, 1],
                      opacity: [0.6, 0.9, 0.6],
                    }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      ease: "easeInOut" as const
                    }}
                  />
                  
                  <Badge className="relative bg-gradient-to-r from-red-500 to-pink-500 text-white border-0 min-w-[20px] h-5 flex items-center justify-center text-xs font-bold shadow-lg">
                    <motion.span
                      key={unreadCount}
                      initial={{ scale: 1.5, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ duration: 0.3, type: "spring" as const, stiffness: 300 }}
                    >
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </motion.span>
                  </Badge>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Quick Action Buttons on Hover */}
          <AnimatePresence>
            {isHovered && unreadCount > 0 && (
              <motion.div
                initial={{ opacity: 0, x: 20, scale: 0.8 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 20, scale: 0.8 }}
                className="absolute -right-32 top-0 flex gap-1 z-50"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Mark All Read */}
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    markAllAsRead();
                  }}
                  className="p-2 bg-green-500 hover:bg-green-600 text-white rounded-full shadow-lg text-xs transition-colors"
                  title="Mark all read"
                >
                  <Check className="h-3 w-3" />
                </motion.button>
                
                {/* Clear All */}
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    clearAll();
                  }}
                  className="p-2 bg-red-500 hover:bg-red-600 text-white rounded-full shadow-lg text-xs transition-colors"
                  title="Clear all"
                >
                  <X className="h-3 w-3" />
                </motion.button>
                
                {/* Settings/Notification Center */}
                <motion.button
                  whileHover={{ scale: 1.1, rotate: 180 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    router.push('/notifications');
                  }}
                  className="p-2 bg-blue-500 hover:bg-blue-600 text-white rounded-full shadow-lg text-xs transition-colors"
                  title="Open notification center"
                >
                  <Settings className="h-3 w-3" />
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
        </Button>
      </motion.div>
    </div>
  );
}

export function NotificationPanel() {
  const { 
    notifications, 
    isOpen, 
    setIsOpen, 
    markAsRead, 
    markAllAsRead, 
    removeNotification, 
    clearAll,
    unreadCount 
  } = useNotifications();

  const [filter, setFilter] = useState<'all' | 'unread' | 'priority'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'priority'>('newest');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const panelRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Enhanced click outside to close
  useEffect(() => {
    function handleClickOutside(event: Event) {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        const target = event.target as Element;
        const isNotificationBell = target.closest('[data-notification-bell]');
        // Check if click is on a Select dropdown (radix-ui portal)
        const isSelectDropdown = target.closest('[role="listbox"]') || 
                                 target.closest('[data-radix-select-content]') ||
                                 target.closest('[data-radix-popper-content-wrapper]');
        if (!isNotificationBell && !isSelectDropdown) {
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

  // Enhanced keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      
      if (e.key === 'Escape') {
        setIsOpen(false);
      } else if (e.key === '/' && e.ctrlKey) {
        e.preventDefault();
        searchRef.current?.focus();
      } else if (e.key === 'a' && e.ctrlKey && unreadCount > 0) {
        e.preventDefault();
        markAllAsRead();
      } else if (e.key === 'c' && e.ctrlKey && notifications.length > 0) {
        e.preventDefault();
        clearAll();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, setIsOpen, markAllAsRead, clearAll, unreadCount, notifications.length]);

  // Advanced filtering and sorting
  const filteredAndSortedNotifications = useMemo(() => {
    let filtered = notifications.filter(notification => {
      // Filter by read/unread status
      if (filter === 'unread' && notification.read) return false;
      if (filter === 'priority' && notification.priority === 'low') return false;
      
      // Filter by category
      if (selectedCategory !== 'all' && notification.category !== selectedCategory) return false;
      
      // Filter by search query
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          notification.title.toLowerCase().includes(query) ||
          notification.message.toLowerCase().includes(query) ||
          notification.category.toLowerCase().includes(query)
        );
      }
      
      return true;
    });

    // Sort notifications
    filtered.sort((a, b) => {
      if (sortBy === 'newest') {
        return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
      } else if (sortBy === 'oldest') {
        return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
      } else if (sortBy === 'priority') {
        const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      }
      return 0;
    });

    return filtered.slice(0, 8); // Show more notifications in premium version
  }, [notifications, filter, selectedCategory, searchQuery, sortBy]);

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 5) return 'Just now';
    if (diffInSeconds < 60) return `${diffInSeconds}s ago`;
    
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    
    return new Date(date).toLocaleDateString();
  };

  const handleClearAll = async () => {
    await clearAll();
    setIsOpen(false);
  };

  const handleSettingsClick = () => {
    setIsOpen(false);
    router.push('/notifications');
  };

  const getNotificationIcon = (notification: Notification) => {
    const iconMap = {
      booking: Calendar,
      community: Users,
      system: Settings,
      maintenance: AlertTriangle,
      payment: Star,
      social: Users,
      amenity: Home,
      delivery: TrendingUp,
      feedback: Info,
      parking: Clock,
      promotion: Zap
    };
    
    const IconComponent = iconMap[notification.category] || Bell;
    return <IconComponent className="h-4 w-4" />;
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'from-red-500 to-red-600';
      case 'high': return 'from-orange-500 to-orange-600';
      case 'medium': return 'from-blue-500 to-blue-600';
      default: return 'from-gray-500 to-gray-600';
    }
  };

  const categories = ['all', ...Array.from(new Set(notifications.map(n => n.category)))];

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {/* Mobile backdrop */}
      <div
        className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[9998] lg:hidden animate-fade-in"
        onClick={() => setIsOpen(false)}
      />

      {/* Premium Notification Panel */}
      <div
        ref={panelRef}
  className="fixed top-16 right-4 w-[440px] max-w-[calc(100vw-1rem)] sm:max-w-[calc(100vw-2rem)] z-[9999] bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-200/50 dark:border-gray-700/50 overflow-hidden animate-slide-down"
        style={{ 
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(20px) saturate(180%)'
        }}
      >
        {/* Premium Header */}
        <div className="relative">
          {/* Header gradient limited to top area so the panel body remains light in light mode */}
          <div className="absolute top-0 left-0 right-0 h-36 sm:h-44 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 opacity-95 pointer-events-none rounded-t-2xl" />
          <div className="absolute top-0 left-0 right-0 h-36 sm:h-44 bg-gradient-to-br from-transparent via-white/10 to-transparent pointer-events-none rounded-t-2xl" />

          <div className="relative p-4 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  animate={{ 
                    boxShadow: [
                      "0 0 0 0 rgba(255, 255, 255, 0.3)",
                      "0 0 0 8px rgba(255, 255, 255, 0)",
                      "0 0 0 0 rgba(255, 255, 255, 0)"
                    ]
                  }}
                  transition={{ 
                    boxShadow: { duration: 2, repeat: Infinity, ease: "easeInOut" },
                    scale: { duration: 0.2 }
                  }}
                  className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center relative overflow-hidden"
                >
                  <motion.div
                    animate={{ 
                      y: [0, -2, 0],
                      rotate: [0, 3, -3, 0]
                    }}
                    transition={{ 
                      duration: 3, 
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                  >
                    <Bell className="h-5 w-5 text-white" />
                  </motion.div>
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                    animate={{ x: [-40, 40] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    style={{ transform: "skewX(-20deg)" }}
                  />
                </motion.div>
                <div>
                  <h3 className="font-bold text-lg sm:text-xl text-white">Notifications</h3>
                  <p className="text-xs sm:text-sm text-white/80">Stay updated with your community</p>
                </div>
              </div>
              
              <div className="flex items-center gap-1 sm:gap-2">
                {unreadCount > 0 && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    whileHover={{ scale: 1.1 }}
                    className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg"
                  >
                    {unreadCount}
                  </motion.div>
                )}
                
                <motion.button
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={handleSettingsClick}
                  className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-all duration-200 backdrop-blur-sm"
                  title="Notification Settings"
                >
                  <Settings className="h-4 w-4" />
                </motion.button>
                
                {notifications.length > 0 && (
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={handleClearAll}
                    className="p-2 bg-white/20 hover:bg-red-500/80 rounded-lg transition-all duration-200 backdrop-blur-sm"
                    title="Clear All (Ctrl+C)"
                  >
                    <X className="h-4 w-4" />
                  </motion.button>
                )}
              </div>
            </div>

            {/* Enhanced Premium Search Bar - Perfect Alignment & Beauty */}
            <motion.div
              animate={{ 
                scale: isSearchFocused ? 1.01 : 1
              }}
              className="relative w-full"
            >
              <div className="relative w-full">
                <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 h-4 w-4 pointer-events-none z-10 text-gray-400 dark:text-white" />
                <input
                  ref={searchRef}
                  type="text"
                  placeholder="Search notifications..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setIsSearchFocused(true)}
                  onBlur={() => setIsSearchFocused(false)}
                  className="w-full h-10 pl-10 pr-10 rounded-lg bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-sm font-medium text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-300"
                />
                {searchQuery && (
                  <motion.button
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 transform -translate-y-1/2 p-1 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-md transition-colors"
                  >
                    <X className="h-3.5 w-3.5 text-gray-500 dark:text-gray-400" />
                  </motion.button>
                )}
              </div>
            </motion.div>
          </div>
        </div>

        {/* Advanced Filter Controls */}
        <div className="p-3 sm:p-4 bg-gray-50/80 dark:bg-gray-800/80 backdrop-blur-sm border-b border-gray-200/50 dark:border-gray-700/50">
          <div className="flex flex-wrap gap-2 mb-3">
            {['all', 'unread', 'priority'].map((filterOption) => (
              <motion.button
                key={filterOption}
                whileHover={{ scale: 1.05, y: -1 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setFilter(filterOption as any)}
                className={cn(
                  "px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-2 min-w-[90px]",
                  filter === filterOption
                    ? "bg-gradient-to-r from-blue-600 to-indigo-600 shadow-lg shadow-blue-500/25 text-white"
                    : "bg-white dark:bg-gray-700 hover:bg-blue-50 dark:hover:bg-gray-600 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white"
                )}
              >
                {filterOption === 'all' && <Home className="h-3 w-3" />}
                {filterOption === 'unread' && <AlertCircle className="h-3 w-3" />}
                {filterOption === 'priority' && <Star className="h-3 w-3" />}
                <span>{filterOption.charAt(0).toUpperCase() + filterOption.slice(1)}</span>
                {filterOption === 'unread' && unreadCount > 0 && (
                  <span className="bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full font-bold">
                    {unreadCount}
                  </span>
                )}
              </motion.button>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row gap-2.5">
            {/* Enhanced Categories Dropdown - Perfect Alignment */}
            <div className="flex-1 min-w-0">
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-full h-10 px-3 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                  <div className="flex items-center gap-2 w-full min-w-0">
                    <Filter className="h-3.5 w-3.5 flex-shrink-0 text-gray-700 dark:text-gray-100" />
                    <div className="flex-1 text-left text-sm font-medium truncate text-gray-900 dark:text-gray-100">
                      <SelectValue placeholder="All Categories" />
                    </div>
                  </div>
                </SelectTrigger>
                <SelectContent className="rounded-lg border border-gray-200 dark:border-gray-700 shadow-xl bg-white dark:bg-gray-800 p-1 min-w-[260px] max-h-[360px] overflow-y-auto">
                  <SelectItem value="all" className="rounded-md py-2.5 px-3 hover:bg-gray-100 dark:hover:bg-gray-700 focus:bg-gray-100 dark:focus:bg-gray-700 transition-colors cursor-pointer">
                    <div className="flex items-center gap-2.5 w-full">
                      <div className="w-7 h-7 rounded-md bg-gradient-to-br from-gray-500 to-gray-600 flex items-center justify-center flex-shrink-0">
                        <Hash className="h-3.5 w-3.5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm text-gray-900 dark:text-gray-100 truncate">All Categories</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 truncate">Show all</div>
                      </div>
                    </div>
                  </SelectItem>
                  <SelectItem value="booking" className="rounded-md py-2.5 px-3 hover:bg-gray-100 dark:hover:bg-gray-700 focus:bg-gray-100 dark:focus:bg-gray-700 transition-colors cursor-pointer">
                    <div className="flex items-center gap-2.5 w-full">
                      <div className="w-7 h-7 rounded-md bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center flex-shrink-0">
                        <Calendar className="h-3.5 w-3.5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm text-gray-900 dark:text-gray-100 truncate">Bookings</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 truncate">Amenity reservations</div>
                      </div>
                    </div>
                  </SelectItem>
                  <SelectItem value="community" className="rounded-md py-2.5 px-3 hover:bg-gray-100 dark:hover:bg-gray-700 focus:bg-gray-100 dark:focus:bg-gray-700 transition-colors cursor-pointer">
                    <div className="flex items-center gap-2.5 w-full">
                      <div className="w-7 h-7 rounded-md bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center flex-shrink-0">
                        <Building className="h-3.5 w-3.5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm text-gray-900 dark:text-gray-100 truncate">Community</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 truncate">Community updates</div>
                      </div>
                    </div>
                  </SelectItem>
                  <SelectItem value="system" className="rounded-md py-2.5 px-3 hover:bg-gray-100 dark:hover:bg-gray-700 focus:bg-gray-100 dark:focus:bg-gray-700 transition-colors cursor-pointer">
                    <div className="flex items-center gap-2.5 w-full">
                      <div className="w-7 h-7 rounded-md bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                        <Settings className="h-3.5 w-3.5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm text-gray-900 dark:text-gray-100 truncate">System</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 truncate">System alerts</div>
                      </div>
                    </div>
                  </SelectItem>
                  <SelectItem value="maintenance" className="rounded-md py-2.5 px-3 hover:bg-gray-100 dark:hover:bg-gray-700 focus:bg-gray-100 dark:focus:bg-gray-700 transition-colors cursor-pointer">
                    <div className="flex items-center gap-2.5 w-full">
                      <div className="w-7 h-7 rounded-md bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center flex-shrink-0">
                        <Wrench className="h-3.5 w-3.5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm text-gray-900 dark:text-gray-100 truncate">Maintenance</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 truncate">Maintenance alerts</div>
                      </div>
                    </div>
                  </SelectItem>
                  <SelectItem value="payment" className="rounded-md py-2.5 px-3 hover:bg-gray-100 dark:hover:bg-gray-700 focus:bg-gray-100 dark:focus:bg-gray-700 transition-colors cursor-pointer">
                    <div className="flex items-center gap-2.5 w-full">
                      <div className="w-7 h-7 rounded-md bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center flex-shrink-0">
                        <CreditCard className="h-3.5 w-3.5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm text-gray-900 dark:text-gray-100 truncate">Payment</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 truncate">Payment updates</div>
                      </div>
                    </div>
                  </SelectItem>
                  <SelectItem value="social" className="rounded-md py-2.5 px-3 hover:bg-gray-100 dark:hover:bg-gray-700 focus:bg-gray-100 dark:focus:bg-gray-700 transition-colors cursor-pointer">
                    <div className="flex items-center gap-2.5 w-full">
                      <div className="w-7 h-7 rounded-md bg-gradient-to-br from-pink-500 to-pink-600 flex items-center justify-center flex-shrink-0">
                        <Users className="h-3.5 w-3.5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm text-gray-900 dark:text-gray-100 truncate">Social</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 truncate">Social activities</div>
                      </div>
                    </div>
                  </SelectItem>
                  <SelectItem value="amenity" className="rounded-md py-2.5 px-3 hover:bg-gray-100 dark:hover:bg-gray-700 focus:bg-gray-100 dark:focus:bg-gray-700 transition-colors cursor-pointer">
                    <div className="flex items-center gap-2.5 w-full">
                      <div className="w-7 h-7 rounded-md bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center flex-shrink-0">
                        <Home className="h-3.5 w-3.5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm text-gray-900 dark:text-gray-100 truncate">Amenity</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 truncate">Amenity services</div>
                      </div>
                    </div>
                  </SelectItem>
                  <SelectItem value="delivery" className="rounded-md py-2.5 px-3 hover:bg-gray-100 dark:hover:bg-gray-700 focus:bg-gray-100 dark:focus:bg-gray-700 transition-colors cursor-pointer">
                    <div className="flex items-center gap-2.5 w-full">
                      <div className="w-7 h-7 rounded-md bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center flex-shrink-0">
                        <Package className="h-3.5 w-3.5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm text-gray-900 dark:text-gray-100 truncate">Delivery</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 truncate">Package deliveries</div>
                      </div>
                    </div>
                  </SelectItem>
                  <SelectItem value="feedback" className="rounded-md py-2.5 px-3 hover:bg-gray-100 dark:hover:bg-gray-700 focus:bg-gray-100 dark:focus:bg-gray-700 transition-colors cursor-pointer">
                    <div className="flex items-center gap-2.5 w-full">
                      <div className="w-7 h-7 rounded-md bg-gradient-to-br from-cyan-500 to-cyan-600 flex items-center justify-center flex-shrink-0">
                        <MessageSquare className="h-3.5 w-3.5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm text-gray-900 dark:text-gray-100 truncate">Feedback</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 truncate">Feedback requests</div>
                      </div>
                    </div>
                  </SelectItem>
                  <SelectItem value="parking" className="rounded-md py-2.5 px-3 hover:bg-gray-100 dark:hover:bg-gray-700 focus:bg-gray-100 dark:focus:bg-gray-700 transition-colors cursor-pointer">
                    <div className="flex items-center gap-2.5 w-full">
                      <div className="w-7 h-7 rounded-md bg-gradient-to-br from-slate-500 to-slate-600 flex items-center justify-center flex-shrink-0">
                        <Car className="h-3.5 w-3.5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm text-gray-900 dark:text-gray-100 truncate">Parking</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 truncate">Parking updates</div>
                      </div>
                    </div>
                  </SelectItem>
                  <SelectItem value="promotion" className="rounded-md py-2.5 px-3 hover:bg-gray-100 dark:hover:bg-gray-700 focus:bg-gray-100 dark:focus:bg-gray-700 transition-colors cursor-pointer">
                    <div className="flex items-center gap-2.5 w-full">
                      <div className="w-7 h-7 rounded-md bg-gradient-to-br from-yellow-500 to-yellow-600 flex items-center justify-center flex-shrink-0">
                        <Gift className="h-3.5 w-3.5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm text-gray-900 dark:text-gray-100 truncate">Promotion</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 truncate">Special offers</div>
                      </div>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Enhanced Sort Dropdown - Perfect Alignment */}
            <div className="flex-1 sm:flex-none sm:w-44 min-w-0">
              <Select value={sortBy} onValueChange={(value) => setSortBy(value as any)}>
                <SelectTrigger className="w-full h-10 px-3 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                  <div className="flex items-center gap-2 w-full min-w-0">
                    <SortDesc className="h-3.5 w-3.5 flex-shrink-0 text-gray-700 dark:text-gray-100" />
                    <div className="flex-1 text-left text-sm font-medium truncate text-gray-900 dark:text-white">
                      <SelectValue placeholder="Newest" />
                    </div>
                  </div>
                </SelectTrigger>
                <SelectContent className="rounded-lg border border-gray-200 dark:border-gray-700 shadow-xl bg-white dark:bg-gray-800 p-1 min-w-[220px]">
                  <SelectItem value="newest" className="rounded-md py-2.5 px-3 hover:bg-gray-100 dark:hover:bg-gray-700 focus:bg-gray-100 dark:focus:bg-gray-700 transition-colors cursor-pointer">
                    <div className="flex items-center gap-2.5 w-full">
                      <div className="w-7 h-7 rounded-md bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center flex-shrink-0">
                        <Clock className="h-3.5 w-3.5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm text-gray-900 dark:text-gray-100 truncate">Newest First</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 truncate">Recent first</div>
                      </div>
                    </div>
                  </SelectItem>
                  <SelectItem value="oldest" className="rounded-md py-2.5 px-3 hover:bg-gray-100 dark:hover:bg-gray-700 focus:bg-gray-100 dark:focus:bg-gray-700 transition-colors cursor-pointer">
                    <div className="flex items-center gap-2.5 w-full">
                      <div className="w-7 h-7 rounded-md bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center flex-shrink-0">
                        <Archive className="h-3.5 w-3.5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm text-gray-900 dark:text-gray-100 truncate">Oldest First</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 truncate">Historical first</div>
                      </div>
                    </div>
                  </SelectItem>
                  <SelectItem value="priority" className="rounded-md py-2.5 px-3 hover:bg-gray-100 dark:hover:bg-gray-700 focus:bg-gray-100 dark:focus:bg-gray-700 transition-colors cursor-pointer">
                    <div className="flex items-center gap-2.5 w-full">
                      <div className="w-7 h-7 rounded-md bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center flex-shrink-0">
                        <Star className="h-3.5 w-3.5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm text-gray-900 dark:text-gray-100 truncate">By Priority</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 truncate">Important first</div>
                      </div>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Premium Notifications List */}
        <div className="max-h-80 sm:max-h-96 overflow-y-auto custom-scrollbar">
          {filteredAndSortedNotifications.length === 0 ? (
            <div
              className="p-8 sm:p-12 text-center"
            >
              <div
                className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 bg-gradient-to-br from-blue-500 via-purple-600 to-indigo-600 rounded-2xl flex items-center justify-center relative overflow-hidden animate-bounce"
              >
                <Bell className="h-8 w-8 sm:h-10 sm:w-10 text-white" />
              </div>
              <h4 className="font-bold text-lg mb-2 text-gray-900 dark:text-white">All caught up!</h4>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {searchQuery ? 'No matching notifications found for your search' :
                 filter === 'unread' ? 'You have no unread notifications' : 
                 'No notifications to display at this time'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100/50 dark:divide-gray-700/50">
              {filteredAndSortedNotifications.map((notification) => (
                <NotificationCard
                  key={notification.id}
                  notification={notification}
                  removeNotification={removeNotification}
                  markAsRead={markAsRead}
                  getPriorityColor={getPriorityColor}
                  getNotificationIcon={getNotificationIcon}
                  formatTimeAgo={formatTimeAgo}
                  router={router}
                  setIsOpen={setIsOpen}
                />
              ))}
            </div>
          )}
        </div>

        {/* Premium Footer */}
        {notifications.length > 0 && (
          <div className="p-3 sm:p-4 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 border-t border-gray-200/50 dark:border-gray-700/50">
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              {unreadCount > 0 && (
                <button
                  onClick={() => markAllAsRead()}
                  className="flex-1 py-2.5 px-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white text-sm font-semibold rounded-xl shadow-lg transition-all duration-200 flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98]"
                >
                  <Check className="h-4 w-4" />
                  Mark All Read ({unreadCount})
                </button>
              )}
              <button
                onClick={handleSettingsClick}
                className="flex-1 py-2.5 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-sm font-semibold rounded-xl shadow-lg transition-all duration-200 flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98]"
              >
                <Settings className="h-4 w-4" />
                Manage All
              </button>
            </div>
            
            {/* Enhanced quick stats */}
            <div 
              className="flex justify-center gap-4 mt-3 text-xs font-medium text-gray-700 dark:text-white"
            >
              <span className="flex items-center gap-1">
                <div 
                  className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"
                />
                {notifications.length} total
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <div 
                  className="w-2 h-2 bg-red-500 rounded-full animate-pulse"
                  style={{ animationDelay: '500ms' }}
                />
                {unreadCount} unread
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <div 
                  className="w-2 h-2 bg-green-500 rounded-full animate-pulse"
                  style={{ animationDelay: '1000ms' }}
                />
                {filteredAndSortedNotifications.length} showing
              </span>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(156, 163, 175, 0.5);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(156, 163, 175, 0.8);
        }
        
        @keyframes slide-down {
          from {
            opacity: 0;
            transform: translateY(-20px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        
        @keyframes fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        
        .animate-slide-down {
          animation: slide-down 0.3s ease-out;
        }
        
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
      `}</style>
    </AnimatePresence>
  );
}
