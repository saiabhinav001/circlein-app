'use client';

import * as React from 'react';
import { Cross2Icon } from '@radix-ui/react-icons';
import { motion, AnimatePresence } from 'framer-motion';

interface RadixDeleteButtonProps {
  onDelete: () => void;
  notificationId: string;
}

/**
 * BRAND NEW Delete Button Component using Radix UI
 * Completely redesigned from scratch - ULTRA RELIABLE
 */
export const RadixDeleteButton: React.FC<RadixDeleteButtonProps> = ({ 
  onDelete, 
  notificationId 
}) => {
  const [isHovered, setIsHovered] = React.useState(false);

  const handleDelete = React.useCallback((e: React.MouseEvent | React.TouchEvent) => {
    // CRITICAL: Multiple layers of event blocking
    e.stopPropagation();
    e.preventDefault();
    if ('nativeEvent' in e) {
      e.nativeEvent.stopImmediatePropagation();
    }
    
    console.log('🗑️ Radix Delete Button Clicked:', notificationId);
    onDelete();
  }, [onDelete, notificationId]);

  return (
    <motion.button
      type="button"
      onClick={handleDelete}
      onTouchStart={handleDelete}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      whileHover={{ scale: 1.15 }}
      whileTap={{ scale: 0.85 }}
      className="absolute flex items-center justify-center touch-manipulation"
      data-delete-button="true"
      style={{
        top: '12px',
        right: '12px',
        width: '36px',
        height: '36px',
        minWidth: '36px',
        minHeight: '36px',
        borderRadius: '50%',
        backgroundColor: isHovered ? '#dc2626' : '#ffffff',
        border: `3px solid ${isHovered ? '#dc2626' : '#e5e7eb'}`,
        cursor: 'pointer',
        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        boxShadow: isHovered 
          ? '0 10px 15px -3px rgba(220, 38, 38, 0.4), 0 4px 6px -2px rgba(220, 38, 38, 0.3)'
          : '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        zIndex: 99999,
        pointerEvents: 'auto',
        isolation: 'isolate',
      }}
      aria-label="Delete notification"
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={isHovered ? 'hovered' : 'default'}
          initial={{ rotate: 0, scale: 0.8, opacity: 0 }}
          animate={{ rotate: isHovered ? 90 : 0, scale: 1, opacity: 1 }}
          exit={{ rotate: -90, scale: 0.8, opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <Cross2Icon
            width={16}
            height={16}
            color={isHovered ? '#ffffff' : '#6b7280'}
            style={{
              transition: 'color 0.2s ease',
            }}
          />
        </motion.div>
      </AnimatePresence>

      {/* Ripple effect on hover */}
      {isHovered && (
        <motion.div
          initial={{ scale: 0, opacity: 0.5 }}
          animate={{ scale: 2, opacity: 0 }}
          transition={{ duration: 0.6, repeat: Infinity }}
          style={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            borderRadius: '50%',
            backgroundColor: '#dc2626',
            pointerEvents: 'none',
          }}
        />
      )}
    </motion.button>
  );
};
