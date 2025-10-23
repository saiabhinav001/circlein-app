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
    console.log('DELETE CLICKED:', notificationId);
    onDelete();
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    handleClick(e);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="w-8 h-8 flex items-center justify-center rounded-full border-2"
      style={{
        backgroundColor: isHovered ? '#ef4444' : '#ffffff',
        borderColor: isHovered ? '#ef4444' : '#d1d5db',
        cursor: 'pointer',
        transition: 'none',
        flexShrink: 0,
        position: 'relative',
        zIndex: 999999,
        pointerEvents: 'auto'
      }}
      aria-label="Delete notification"
    >
      <X
        className="w-4 h-4"
        style={{
          color: isHovered ? '#ffffff' : '#6b7280',
          pointerEvents: 'none',
          transition: 'none'
        }}
      />
    </button>
  );
};
