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
      className="w-8 h-8 flex items-center justify-center rounded-full border-2"
      style={{
        backgroundColor: isHovered ? '#ef4444' : '#ffffff',
        borderColor: isHovered ? '#ef4444' : '#d1d5db',
        cursor: 'pointer',
        transition: 'background-color 0.2s ease, border-color 0.2s ease',
        flexShrink: 0
      }}
      aria-label="Delete notification"
    >
      <X
        className="w-4 h-4"
        style={{
          color: isHovered ? '#ffffff' : '#6b7280',
          pointerEvents: 'none'
        }}
      />
    </button>
  );
};
