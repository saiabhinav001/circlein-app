'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, Users, Star, Shield, CreditCard } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNotifications, Notification } from './notification-system';

// ============================================================================
// ENTERPRISE-GRADE TOAST NOTIFICATIONS
// Clean, minimal, professional - matches new notification system
// ============================================================================

// Icon mapping for notification types
const toastIcons: Record<string, React.ElementType> = {
  booking: Calendar,
  system: Star,
  community: Users,
  admin: Shield,
  payment: CreditCard
};

// Priority-based styling
const priorityStyles: Record<string, { border: string; bg: string }> = {
  urgent: { border: 'border-l-red-500', bg: 'bg-red-50 dark:bg-red-950/20' },
  important: { border: 'border-l-amber-500', bg: 'bg-amber-50 dark:bg-amber-950/20' },
  normal: { border: 'border-l-gray-300 dark:border-l-gray-600', bg: 'bg-white dark:bg-gray-900' }
};

// ============================================================================
// TOAST NOTIFICATION COMPONENT
// ============================================================================

interface ToastNotificationProps {
  notification: Notification;
  onClose: () => void;
  index: number;
}

export function ToastNotification({ notification, onClose, index }: ToastNotificationProps) {
  const Icon = toastIcons[notification.type] || Star;
  const style = priorityStyles[notification.priority] || priorityStyles.normal;
  const [progress, setProgress] = React.useState(100);
  const onCloseRef = React.useRef(onClose);

  React.useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  // Auto-hide timer with progress bar
  React.useEffect(() => {
    if (!notification.autoHide) {
      setProgress(100);
      return;
    }

    const duration = Math.max(800, notification.duration || 5000);
    const startedAt = Date.now();
    const intervalMs = 50;

    const progressTimer = window.setInterval(() => {
      const elapsed = Date.now() - startedAt;
      const nextProgress = Math.max(0, 100 - (elapsed / duration) * 100);
      setProgress(nextProgress);
    }, intervalMs);

    const closeTimer = window.setTimeout(() => {
      setProgress(0);
      onCloseRef.current();
    }, duration);

    return () => {
      window.clearInterval(progressTimer);
      window.clearTimeout(closeTimer);
    };
  }, [notification.autoHide, notification.duration, notification.id]);

  return (
    <motion.div
      initial={{ opacity: 0, x: 50, scale: 0.95 }}
      animate={{ 
        opacity: 1, 
        x: 0, 
        scale: 1,
        transition: {
          type: 'spring',
          stiffness: 400,
          damping: 30,
          delay: index * 0.05
        }
      }}
      exit={{ 
        opacity: 0, 
        x: 50, 
        scale: 0.95,
        transition: { duration: 0.2 }
      }}
      className="w-full max-w-[min(26rem,calc(100vw-1.5rem))]"
    >
      <div className={cn(
        'relative rounded-xl sm:rounded-2xl border border-gray-200 dark:border-gray-800 shadow-lg overflow-hidden',
        'border-l-4',
        style.border,
        style.bg
      )}>
        {/* Content */}
        <div className="p-3.5 sm:p-4 pr-10">
          <div className="flex items-start gap-3">
            {/* Icon */}
            <div className="flex-shrink-0 mt-0.5">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                <Icon className="w-4 h-4 text-gray-600 dark:text-gray-400" />
              </div>
            </div>

            {/* Text */}
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-medium text-gray-900 dark:text-white leading-snug break-words">
                {notification.title}
              </h4>
              <p className="mt-0.5 text-xs sm:text-sm text-gray-500 dark:text-gray-400 line-clamp-2 break-words">
                {notification.message}
              </p>
            </div>
          </div>
        </div>

        {/* Close Button */}
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onClose();
          }}
          className="absolute top-3 right-3 p-1.5 rounded-lg 
                   text-gray-400 hover:text-gray-600 dark:hover:text-gray-300
                   hover:bg-gray-100 dark:hover:bg-gray-800
                   transition-colors"
          aria-label="Dismiss notification"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Progress Bar */}
        {notification.autoHide && (
          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-100 dark:bg-gray-800">
            <motion.div
              className="h-full bg-gray-400 dark:bg-gray-500"
              initial={{ width: '100%' }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.05, ease: 'linear' }}
            />
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ============================================================================
// TOAST CONTAINER
// ============================================================================

export function ToastContainer() {
  const { notifications, removeNotification } = useNotifications();
  
  // Show only recent unread notifications as toasts (max 3)
  const toastNotifications = notifications
    .filter(n => !n.read && n.autoHide)
    .slice(0, 3);

  return (
    <div className="fixed z-[9999] space-y-2 pointer-events-none left-3 right-3 top-[max(0.75rem,env(safe-area-inset-top))] sm:left-auto sm:right-4 sm:top-4">
      <AnimatePresence mode="popLayout">
        {toastNotifications.map((notification, index) => (
          <div key={notification.id} className="pointer-events-auto">
            <ToastNotification
              notification={notification}
              onClose={() => removeNotification(notification.id)}
              index={index}
            />
          </div>
        ))}
      </AnimatePresence>
    </div>
  );
}
