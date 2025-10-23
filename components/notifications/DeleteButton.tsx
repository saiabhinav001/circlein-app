'use client';

import { X } from 'lucide-react';
import React from 'react';

interface DeleteButtonProps {
  onDelete: () => void;
  notificationId: string;
}

export const DeleteButton: React.FC<DeleteButtonProps> = ({ onDelete, notificationId }) => {
  const [isHovered, setIsHovered] = React.useState(false);

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    // Stop event from reaching parent elements
    e.stopPropagation();
    e.preventDefault();
    
    console.log('🗑️ DELETE BUTTON CLICKED:', notificationId);
    onDelete();
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="relative z-[100] w-8 h-8 flex items-center justify-center rounded-full border-2 transition-all duration-200 hover:scale-110 active:scale-95"
      style={{
        backgroundColor: isHovered ? '#ef4444' : '#ffffff',
        borderColor: isHovered ? '#ef4444' : '#d1d5db',
        cursor: 'pointer',
        pointerEvents: 'auto',
      }}
      aria-label="Delete notification"
    >
      <X
        className="w-4 h-4 pointer-events-none"
        style={{
          color: isHovered ? '#ffffff' : '#6b7280',
        }}
      />
    </button>
  );
};
