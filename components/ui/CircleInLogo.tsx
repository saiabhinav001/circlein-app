'use client';

import React from 'react';

export interface CircleInLogoProps {
  className?: string;
  size?: number;
}

export const CircleInLogo: React.FC<CircleInLogoProps> = ({ className = '', size }) => {
  // Generate unique IDs for gradients to avoid conflicts
  const uniqueId = React.useId();
  const cleanGradientId = `cleanGradient-${uniqueId}`;
  const whiteGradientId = `whiteGradient-${uniqueId}`;
  const goldGradientId = `goldGradient-${uniqueId}`;
  
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 120 120" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ 
        filter: 'drop-shadow(0 4px 20px rgba(59, 130, 246, 0.3))',
        display: 'block'
      }}
    >
      <defs>
        {/* Clean Premium Gradient - Canva Style */}
        <linearGradient id={cleanGradientId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: '#3B82F6', stopOpacity: 1 }} />
          <stop offset="50%" style={{ stopColor: '#6366F1', stopOpacity: 1 }} />
          <stop offset="100%" style={{ stopColor: '#8B5CF6', stopOpacity: 1 }} />
        </linearGradient>
        
        {/* Crystal Clear White Gradient */}
        <linearGradient id={whiteGradientId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: '#FFFFFF', stopOpacity: 1 }} />
          <stop offset="100%" style={{ stopColor: '#F8FAFC', stopOpacity: 0.95 }} />
        </linearGradient>
        
        {/* Golden Accent - Simple & Clean */}
        <linearGradient id={goldGradientId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: '#FBBF24', stopOpacity: 1 }} />
          <stop offset="100%" style={{ stopColor: '#F59E0B', stopOpacity: 1 }} />
        </linearGradient>
      </defs>
      
      {/* Main Circle - Clean & Bold */}
      <circle 
        cx="60" 
        cy="60" 
        r="54" 
        fill={`url(#${cleanGradientId})`}
      />
      
      {/* Inner Glow for Depth - Subtle */}
      <circle 
        cx="60" 
        cy="60" 
        r="54" 
        fill={`url(#${cleanGradientId})`}
        opacity="0.6"
        style={{ filter: 'blur(8px)' }}
      />
      
      {/* White Highlight - Top Shine */}
      <ellipse 
        cx="60" 
        cy="35" 
        rx="40" 
        ry="20" 
        fill="#FFFFFF"
        opacity="0.25"
      />
      
      {/* Modern "C" Lettermark - Crystal Clear */}
      <path 
        d="M 86 60 A 26 26 0 1 1 60 34 L 60 46 A 14 14 0 1 0 74 60 Z" 
        fill={`url(#${whiteGradientId})`}
        opacity="0.98"
      />
      
      {/* Three Golden Dots - Clean & Simple */}
      <g>
        {/* Top Left */}
        <circle cx="48" cy="49" r="4.5" fill={`url(#${goldGradientId})`}/>
        <circle cx="47" cy="48" r="1.5" fill="#FFFFFF" opacity="0.8"/>
        
        {/* Top Right */}
        <circle cx="72" cy="49" r="4.5" fill={`url(#${goldGradientId})`}/>
        <circle cx="71" cy="48" r="1.5" fill="#FFFFFF" opacity="0.8"/>
        
        {/* Bottom Center */}
        <circle cx="60" cy="71" r="4.5" fill={`url(#${goldGradientId})`}/>
        <circle cx="59" cy="70" r="1.5" fill="#FFFFFF" opacity="0.8"/>
      </g>
      
      {/* Connection Lines - Clean & Minimal */}
      <g stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" opacity="0.5">
        <line x1="48" y1="49" x2="72" y2="49"/>
        <line x1="48" y1="49" x2="60" y2="71"/>
        <line x1="72" y1="49" x2="60" y2="71"/>
      </g>
      
      {/* Single Decorative Ring - Clean */}
      <circle 
        cx="60" 
        cy="60" 
        r="48" 
        fill="none" 
        stroke="#FFFFFF" 
        strokeWidth="1.5" 
        opacity="0.3"
      />
    </svg>
  );
};

export default CircleInLogo;
