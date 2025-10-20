'use client';

import React from 'react';

interface CircleInLogoProps {
  className?: string;
  size?: number;
}

export const CircleInLogo: React.FC<CircleInLogoProps> = ({ className = '', size = 120 }) => {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 120 120" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        {/* Premium gradient definitions */}
        <linearGradient id="mainGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: '#3B82F6', stopOpacity: 1 }} />
          <stop offset="35%" style={{ stopColor: '#6366F1', stopOpacity: 1 }} />
          <stop offset="70%" style={{ stopColor: '#8B5CF6', stopOpacity: 1 }} />
          <stop offset="100%" style={{ stopColor: '#A855F7', stopOpacity: 1 }} />
        </linearGradient>
        
        <linearGradient id="glowGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: '#60A5FA', stopOpacity: 0.8 }} />
          <stop offset="100%" style={{ stopColor: '#C084FC', stopOpacity: 0.8 }} />
        </linearGradient>
        
        <linearGradient id="accentGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: '#FBBF24', stopOpacity: 1 }} />
          <stop offset="100%" style={{ stopColor: '#F59E0B', stopOpacity: 1 }} />
        </linearGradient>
        
        {/* Professional glow effect */}
        <filter id="premiumGlow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur"/>
          <feColorMatrix in="blur" type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -7" result="glow"/>
          <feBlend in="SourceGraphic" in2="glow" mode="normal"/>
        </filter>
        
        {/* Subtle shadow */}
        <filter id="softShadow">
          <feDropShadow dx="0" dy="2" stdDeviation="4" floodOpacity="0.3"/>
        </filter>
      </defs>
      
      {/* Background circle with premium gradient */}
      <circle cx="60" cy="60" r="56" fill="url(#mainGradient)" filter="url(#premiumGlow)"/>
      
      {/* Subtle inner glow layer */}
      <circle cx="60" cy="60" r="50" fill="url(#glowGradient)" opacity="0.2"/>
      
      {/* Inner circle for depth */}
      <circle cx="60" cy="60" r="44" fill="white" opacity="0.08"/>
      
      {/* Modern geometric "C" lettermark */}
      <path 
        d="M 88 60 A 28 28 0 1 1 60 32 L 60 44 A 16 16 0 1 0 76 60 Z" 
        fill="white" 
        opacity="0.98"
        filter="url(#softShadow)"
      />
      
      {/* Three perfectly positioned community dots forming triangle */}
      <g opacity="0.95">
        {/* Top left dot */}
        <circle cx="47" cy="48" r="4.5" fill="white"/>
        <circle cx="47" cy="48" r="3" fill="url(#accentGradient)"/>
        
        {/* Top right dot */}
        <circle cx="73" cy="48" r="4.5" fill="white"/>
        <circle cx="73" cy="48" r="3" fill="url(#accentGradient)"/>
        
        {/* Bottom center dot */}
        <circle cx="60" cy="72" r="4.5" fill="white"/>
        <circle cx="60" cy="72" r="3" fill="url(#accentGradient)"/>
      </g>
      
      {/* Connection lines with perfect positioning */}
      <g opacity="0.4" stroke="white" strokeWidth="2" strokeLinecap="round">
        <line x1="47" y1="48" x2="73" y2="48"/>
        <line x1="47" y1="48" x2="60" y2="72"/>
        <line x1="73" y1="48" x2="60" y2="72"/>
      </g>
      
      {/* Decorative accent ring */}
      <circle cx="60" cy="60" r="36" fill="none" stroke="white" strokeWidth="1.5" opacity="0.25"/>
      
      {/* Subtle outer ring for premium feel */}
      <circle cx="60" cy="60" r="52" fill="none" stroke="white" strokeWidth="1" opacity="0.15"/>
    </svg>
  );
};
