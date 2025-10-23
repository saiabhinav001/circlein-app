'use client';

import * as React from 'react';
import { X } from 'lucide-react';
import { motion } from 'framer-motion';

interface UltraDeleteButtonProps {
  onDelete: () => void;
  notificationId: string;
}

/**
 * ULTRA DELETE BUTTON - Final Solution
 * Uses pointer-events isolation and explicit event handling
 * Positioned OUTSIDE the card structure to avoid any conflicts
 */
export const UltraDeleteButton: React.FC<UltraDeleteButtonProps> = ({ 
  onDelete, 
  notificationId 
}) => {
  const [isHovered, setIsHovered] = React.useState(false);
  const [isPressed, setIsPressed] = React.useState(false);

  // CRITICAL: Completely isolated click handler
  const handleClick = React.useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    // Stop ALL propagation
    e.preventDefault();
    e.stopPropagation();
    e.nativeEvent.stopImmediatePropagation();
    
    console.log('🗑️ ULTRA DELETE CLICKED:', notificationId);
    
    // Execute delete
    onDelete();
  }, [onDelete, notificationId]);

  // Touch handler for mobile
  const handleTouch = React.useCallback((e: React.TouchEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    console.log('📱 ULTRA DELETE TOUCHED:', notificationId);
    onDelete();
  }, [onDelete, notificationId]);

  return (
    <motion.button
      type="button"
      onClick={handleClick}
      onTouchEnd={handleTouch}
      onMouseDown={(e) => {
        e.stopPropagation();
        e.preventDefault();
        setIsPressed(true);
      }}
      onMouseUp={(e) => {
        e.stopPropagation();
        e.preventDefault();
        setIsPressed(false);
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setIsPressed(false);
      }}
      className="group"
      data-ultra-delete="true"
      aria-label="Delete notification"
      style={{
        position: 'absolute',
        top: '8px',
        right: '8px',
        width: '40px',
        height: '40px',
        minWidth: '40px',
        minHeight: '40px',
        padding: '0',
        margin: '0',
        border: 'none',
        outline: 'none',
        background: 'transparent',
        cursor: 'pointer',
        zIndex: 999999,
        pointerEvents: 'auto',
        WebkitTapHighlightColor: 'transparent',
        touchAction: 'manipulation',
        userSelect: 'none',
      }}
    >
      {/* Background circle */}
      <motion.div
        animate={{
          scale: isPressed ? 0.85 : isHovered ? 1.1 : 1,
          backgroundColor: isHovered ? '#ef4444' : isPressed ? '#dc2626' : '#ffffff',
        }}
        transition={{ duration: 0.15 }}
        style={{
          position: 'absolute',
          inset: '0',
          borderRadius: '50%',
          border: `3px solid ${isHovered ? '#ef4444' : '#e5e7eb'}`,
          boxShadow: isHovered 
            ? '0 10px 20px -5px rgba(239, 68, 68, 0.5), 0 4px 8px -2px rgba(239, 68, 68, 0.3)'
            : '0 4px 8px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
          pointerEvents: 'none',
        }}
      />

      {/* X Icon */}
      <motion.div
        animate={{
          rotate: isHovered ? 90 : 0,
          scale: isPressed ? 0.8 : 1,
        }}
        transition={{ duration: 0.2 }}
        style={{
          position: 'absolute',
          inset: '0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          pointerEvents: 'none',
        }}
      >
        <X
          size={18}
          color={isHovered ? '#ffffff' : '#6b7280'}
          strokeWidth={3}
        />
      </motion.div>

      {/* Ripple effect */}
      {isHovered && (
        <motion.div
          initial={{ scale: 0.5, opacity: 0.6 }}
          animate={{ scale: 2, opacity: 0 }}
          transition={{ duration: 1, repeat: Infinity }}
          style={{
            position: 'absolute',
            inset: '0',
            borderRadius: '50%',
            backgroundColor: '#ef4444',
            pointerEvents: 'none',
          }}
        />
      )}
    </motion.button>
  );
};
