'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, AlertCircle, Info, AlertTriangle, Calendar, Users, Zap, Star, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useNotifications, Notification } from './NotificationSystem';

interface ToastNotificationProps {
  notification: Notification;
  onClose: () => void;
  index: number;
}

const toastIcons = {
  info: Info,
  success: Check,
  warning: AlertTriangle,
  error: AlertCircle,
  booking: Calendar,
  community: Users,
  system: Star
};

const toastGradients = {
  info: 'from-blue-500 to-blue-600',
  success: 'from-green-500 to-emerald-600',
  warning: 'from-yellow-500 to-orange-500',
  error: 'from-red-500 to-red-600',
  booking: 'from-purple-500 to-purple-600',
  community: 'from-indigo-500 to-indigo-600',
  system: 'from-gray-500 to-gray-600'
};

const priorityAccents = {
  urgent: { border: 'border-red-400', glow: 'shadow-red-500/25' },
  high: { border: 'border-orange-400', glow: 'shadow-orange-500/25' },
  medium: { border: 'border-blue-400', glow: 'shadow-blue-500/25' },
  low: { border: 'border-gray-400', glow: 'shadow-gray-500/25' }
};

export function ToastNotification({ notification, onClose, index }: ToastNotificationProps) {
  const Icon = toastIcons[notification.type];
  const [progress, setProgress] = React.useState(100);

  React.useEffect(() => {
    if (notification.autoHide) {
      const duration = notification.duration || 5000;
      const interval = 100; // Update every 100ms
      const decrement = (interval / duration) * 100;

      const timer = setInterval(() => {
        setProgress(prev => {
          const newProgress = prev - decrement;
          if (newProgress <= 0) {
            clearInterval(timer);
            onClose();
            return 0;
          }
          return newProgress;
        });
      }, interval);

      return () => clearInterval(timer);
    }
  }, [notification.autoHide, notification.duration, onClose]);

  const priorityStyle = priorityAccents[notification.priority];

  return (
    <motion.div
      initial={{ 
        opacity: 0, 
        y: -100, 
        scale: 0.3,
        rotateX: -90 
      }}
      animate={{ 
        opacity: 1, 
        y: 0, 
        scale: 1,
        rotateX: 0,
        transition: {
          type: "spring",
          stiffness: 300,
          damping: 25,
          delay: index * 0.1
        }
      }}
      exit={{ 
        opacity: 0, 
        y: -50, 
        scale: 0.8,
        rotateX: -45,
        transition: { 
          duration: 0.3,
          ease: "easeInOut"
        }
      }}
      whileHover={{ 
        scale: 1.02,
        y: -5,
        transition: { duration: 0.2 }
      }}
      className="w-full max-w-sm"
      style={{ 
        transformStyle: 'preserve-3d',
        perspective: '1000px'
      }}
    >
      <motion.div
        className="relative"
        whileHover={{ rotateY: 2, rotateX: 2 }}
        transition={{ duration: 0.3 }}
      >
        <Card className={cn(
          'relative overflow-hidden border-l-4 shadow-xl bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl',
          'ring-1 ring-black/5 dark:ring-white/10',
          priorityStyle.border,
          priorityStyle.glow,
          'shadow-2xl'
        )}>
          {/* Animated Background Gradient */}
          <motion.div
            className={cn(
              'absolute inset-0 opacity-10 bg-gradient-to-br',
              toastGradients[notification.type]
            )}
            animate={{
              backgroundPosition: ['0% 0%', '100% 100%'],
              transition: { duration: 3, repeat: Infinity, repeatType: 'reverse' }
            }}
            style={{ backgroundSize: '200% 200%' }}
          />

          {/* Priority Glow Effect */}
          {notification.priority === 'urgent' && (
            <motion.div
              className="absolute inset-0 bg-red-500/5 rounded-lg"
              animate={{
                opacity: [0.5, 1, 0.5],
                transition: { duration: 1.5, repeat: Infinity }
              }}
            />
          )}

          <div className="relative p-4">
            <div className="flex items-start gap-3">
              <motion.div 
                className={cn(
                  'p-2.5 rounded-xl flex-shrink-0 bg-gradient-to-br shadow-lg',
                  toastGradients[notification.type]
                )}
                animate={{
                  rotate: [0, 5, -5, 0],
                  transition: { duration: 2, repeat: Infinity }
                }}
                whileHover={{
                  scale: 1.1,
                  rotate: 10,
                  transition: { duration: 0.2 }
                }}
              >
                <Icon className="h-5 w-5 text-white" />
              </motion.div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <motion.h4 
                    className="font-semibold text-sm text-gray-900 dark:text-gray-100"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ 
                      opacity: 1, 
                      x: 0,
                      transition: { delay: 0.2 }
                    }}
                  >
                    {notification.title}
                  </motion.h4>
                  
                  <div className="flex items-center gap-2">
                    {notification.priority === 'urgent' && (
                      <motion.div
                        animate={{
                          scale: [1, 1.2, 1],
                          opacity: [0.7, 1, 0.7],
                          transition: { duration: 1, repeat: Infinity }
                        }}
                      >
                        <Zap className="h-3 w-3 text-red-500" />
                      </motion.div>
                    )}
                    
                    <motion.button
                      whileHover={{ scale: 1.1, rotate: 90 }}
                      whileTap={{ scale: 0.9 }}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                      }}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        console.log('Toast close button clicked', notification.id);
                        onClose();
                      }}
                      className="p-2 rounded-full hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors z-[99999] relative cursor-pointer shadow-lg hover:shadow-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
                      style={{ 
                        pointerEvents: 'auto',
                        position: 'relative',
                        zIndex: 99999
                      }}
                      aria-label="Close notification"
                    >
                      <X className="h-4 w-4 text-gray-700 dark:text-gray-200 hover:text-red-600 dark:hover:text-red-400 font-bold" />
                    </motion.button>
                  </div>
                </div>
                
                <motion.p 
                  className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ 
                    opacity: 1, 
                    y: 0,
                    transition: { delay: 0.3 }
                  }}
                >
                  {notification.message}
                </motion.p>
                
                {notification.actionUrl && notification.actionLabel && (
                  <motion.button
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ 
                      opacity: 1, 
                      scale: 1,
                      transition: { delay: 0.4 }
                    }}
                    whileHover={{ x: 5 }}
                    onClick={() => {
                      onClose();
                      // Handle navigation here
                    }}
                    className="mt-3 text-xs font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 flex items-center gap-1"
                  >
                    {notification.actionLabel}
                    <motion.span
                      animate={{ x: [0, 3, 0] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    >
                      →
                    </motion.span>
                  </motion.button>
                )}
              </div>
            </div>
            
            {/* Progress Bar */}
            {notification.autoHide && (
              <motion.div
                className="absolute bottom-0 left-0 right-0 h-1 bg-gray-200 dark:bg-gray-700 overflow-hidden"
                initial={{ opacity: 0 }}
                animate={{ 
                  opacity: 1,
                  transition: { delay: 0.5 }
                }}
              >
                <motion.div
                  className={cn(
                    'h-full bg-gradient-to-r',
                    toastGradients[notification.type]
                  )}
                  initial={{ width: '100%' }}
                  animate={{ 
                    width: `${progress}%`,
                    transition: { ease: 'linear' }
                  }}
                />
                
                {/* Shimmer Effect */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                  animate={{
                    x: ['-100%', '100%'],
                    transition: { duration: 2, repeat: Infinity }
                  }}
                  style={{ width: '50%' }}
                />
              </motion.div>
            )}
          </div>

          {/* Particle Effect for Success */}
          {notification.type === 'success' && (
            <motion.div
              className="absolute inset-0 pointer-events-none overflow-hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {[...Array(6)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-1 h-1 bg-green-400 rounded-full"
                  initial={{
                    x: '50%',
                    y: '50%',
                    scale: 0,
                    opacity: 0
                  }}
                  animate={{
                    x: `${50 + (Math.random() - 0.5) * 200}%`,
                    y: `${50 + (Math.random() - 0.5) * 200}%`,
                    scale: [0, 1, 0],
                    opacity: [0, 1, 0],
                    transition: {
                      duration: 2,
                      delay: i * 0.2,
                      ease: 'easeOut'
                    }
                  }}
                />
              ))}
            </motion.div>
          )}
        </Card>
      </motion.div>
    </motion.div>
  );
}

export function ToastContainer() {
  const { notifications, removeNotification } = useNotifications();
  
  // Show only recent unread notifications as toasts
  const toastNotifications = notifications
    .filter(n => !n.read)
    .slice(0, 4) // Max 4 toasts
    .reverse(); // Newest at top

  return (
    <div className="fixed top-4 right-4 z-[99999] space-y-3 pointer-events-none">
      <AnimatePresence mode="popLayout">
        {toastNotifications.map((notification, index) => (
          <div key={notification.id} className="pointer-events-auto relative z-[99999]">
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