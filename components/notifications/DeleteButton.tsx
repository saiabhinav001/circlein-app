'use client';

import { X } from 'lucide-react';
import React from 'react';

interface DeleteButtonProps {
  onDelete: () => void;
  notificationId: string;
}

export const DeleteButton: React.FC<DeleteButtonProps> = ({ onDelete, notificationId }) => {
  const [isHovered, setIsHovered] = React.useState(false);

  const handleClick = (e: React.MouseEvent) => {
    // CRITICAL: Stop all event propagation
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
      className="w-9 h-9 flex items-center justify-center rounded-full border-2 transition-all duration-200 hover:scale-110 active:scale-95 shadow-md hover:shadow-lg"
      style={{
        backgroundColor: isHovered ? '#ef4444' : '#ffffff',
        borderColor: isHovered ? '#ef4444' : '#d1d5db',
        cursor: 'pointer',
      }}
      aria-label="Delete notification"
    >
      <X
        className="w-5 h-5"
        style={{
          color: isHovered ? '#ffffff' : '#6b7280',
        }}
      />
    </button>
  );
};
