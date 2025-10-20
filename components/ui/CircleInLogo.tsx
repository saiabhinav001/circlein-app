'use client';

import React from 'react';

interface CircleInLogoProps {
  className?: string;
  size?: number;
  animated?: boolean;
}

export const CircleInLogo: React.FC<CircleInLogoProps> = ({ className = '', size = 120, animated = true }) => {
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
        {/* Ultra-premium glossy gradient - Multi-layer */}
        <linearGradient id="glossyMainGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: '#60A5FA', stopOpacity: 1 }} />
          <stop offset="25%" style={{ stopColor: '#3B82F6', stopOpacity: 1 }} />
          <stop offset="50%" style={{ stopColor: '#6366F1', stopOpacity: 1 }} />
          <stop offset="75%" style={{ stopColor: '#8B5CF6', stopOpacity: 1 }} />
          <stop offset="100%" style={{ stopColor: '#A855F7', stopOpacity: 1 }} />
        </linearGradient>
        
        {/* Glossy highlight gradient - Top light reflection */}
        <linearGradient id="glossyHighlight" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" style={{ stopColor: '#FFFFFF', stopOpacity: 0.6 }} />
          <stop offset="40%" style={{ stopColor: '#FFFFFF', stopOpacity: 0.2 }} />
          <stop offset="100%" style={{ stopColor: '#FFFFFF', stopOpacity: 0 }} />
        </linearGradient>
        
        {/* Bottom glossy shine */}
        <linearGradient id="glossyShine" x1="0%" y1="100%" x2="0%" y2="0%">
          <stop offset="0%" style={{ stopColor: '#FFFFFF', stopOpacity: 0.3 }} />
          <stop offset="50%" style={{ stopColor: '#FFFFFF', stopOpacity: 0 }} />
        </linearGradient>
        
        {/* Radial glow for depth */}
        <radialGradient id="radialGlow" cx="50%" cy="50%">
          <stop offset="0%" style={{ stopColor: '#93C5FD', stopOpacity: 0.6 }} />
          <stop offset="50%" style={{ stopColor: '#C084FC', stopOpacity: 0.3 }} />
          <stop offset="100%" style={{ stopColor: '#A855F7', stopOpacity: 0 }} />
        </radialGradient>
        
        {/* Golden accent with shimmer */}
        <linearGradient id="goldenShimmer" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: '#FDE68A', stopOpacity: 1 }} />
          <stop offset="25%" style={{ stopColor: '#FBBF24', stopOpacity: 1 }} />
          <stop offset="50%" style={{ stopColor: '#F59E0B', stopOpacity: 1 }} />
          <stop offset="75%" style={{ stopColor: '#FBBF24', stopOpacity: 1 }} />
          <stop offset="100%" style={{ stopColor: '#FDE68A', stopOpacity: 1 }} />
        </linearGradient>
        
        {/* Advanced lighting gradient for "C" */}
        <linearGradient id="letterGlow" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: '#FFFFFF', stopOpacity: 1 }} />
          <stop offset="50%" style={{ stopColor: '#F0F9FF', stopOpacity: 0.98 }} />
          <stop offset="100%" style={{ stopColor: '#DBEAFE', stopOpacity: 0.95 }} />
        </linearGradient>
        
        {/* Professional glow effect - Enhanced */}
        <filter id="ultraGlow" x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur1"/>
          <feGaussianBlur in="SourceGraphic" stdDeviation="8" result="blur2"/>
          <feColorMatrix in="blur1" type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 20 -8" result="glow1"/>
          <feColorMatrix in="blur2" type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 15 -6" result="glow2"/>
          <feMerge>
            <feMergeNode in="glow2"/>
            <feMergeNode in="glow1"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
        
        {/* Glossy reflection effect */}
        <filter id="glossyEffect">
          <feGaussianBlur in="SourceGraphic" stdDeviation="0.5" result="blur"/>
          <feSpecularLighting in="blur" surfaceScale="5" specularConstant="1.5" specularExponent="20" result="spec">
            <fePointLight x="30" y="20" z="200"/>
          </feSpecularLighting>
          <feComposite in="spec" in2="SourceGraphic" operator="in" result="specOut"/>
          <feComposite in="SourceGraphic" in2="specOut" operator="arithmetic" k1="0" k2="1" k3="1" k4="0"/>
        </filter>
        
        {/* Soft professional shadow */}
        <filter id="premiumShadow">
          <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="#1E293B" floodOpacity="0.4"/>
        </filter>
        
        {/* Inner shadow for depth */}
        <filter id="innerShadow">
          <feGaussianBlur in="SourceAlpha" stdDeviation="2"/>
          <feOffset dx="0" dy="2" result="offsetblur"/>
          <feFlood floodColor="#000000" floodOpacity="0.2"/>
          <feComposite in2="offsetblur" operator="in"/>
          <feMerge>
            <feMergeNode/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
      
      {/* Outer glow aura */}
      <circle cx="60" cy="60" r="58" fill="url(#radialGlow)" opacity="0.6"/>
      
      {/* Main glossy circle with enhanced gradient */}
      <circle cx="60" cy="60" r="56" fill="url(#glossyMainGradient)" filter="url(#ultraGlow)"/>
      
      {/* Glossy top highlight - Creates the shine effect */}
      <ellipse cx="60" cy="35" rx="45" ry="20" fill="url(#glossyHighlight)" opacity="0.7"/>
      
      {/* Inner glossy layer for depth */}
      <circle cx="60" cy="60" r="52" fill="url(#radialGlow)" opacity="0.3"/>
      
      {/* Bottom shine reflection */}
      <ellipse cx="60" cy="85" rx="38" ry="15" fill="url(#glossyShine)" opacity="0.4"/>
      
      {/* Inner depth circle */}
      <circle cx="60" cy="60" r="44" fill="white" opacity="0.1" filter="url(#innerShadow)"/>
      
      {/* Modern geometric "C" lettermark with glossy effect */}
      <g filter="url(#premiumShadow)">
        <path 
          d="M 88 60 A 28 28 0 1 1 60 32 L 60 44 A 16 16 0 1 0 76 60 Z" 
          fill="url(#letterGlow)"
          opacity="1"
        />
        {/* Inner highlight on C */}
        <path 
          d="M 86 60 A 26 26 0 0 0 60 34 L 60 36 A 24 24 0 0 1 84 60 Z" 
          fill="white"
          opacity="0.4"
        />
      </g>
      
      {/* Three perfectly positioned community dots with glossy effect */}
      <g filter="url(#premiumShadow)">
        {/* Top left dot with glass effect */}
        <circle cx="47" cy="48" r="5" fill="white" opacity="0.3"/>
        <circle cx="47" cy="48" r="4.5" fill="url(#goldenShimmer)"/>
        <circle cx="46" cy="47" r="1.5" fill="white" opacity="0.8"/>
        
        {/* Top right dot with glass effect */}
        <circle cx="73" cy="48" r="5" fill="white" opacity="0.3"/>
        <circle cx="73" cy="48" r="4.5" fill="url(#goldenShimmer)"/>
        <circle cx="72" cy="47" r="1.5" fill="white" opacity="0.8"/>
        
        {/* Bottom center dot with glass effect */}
        <circle cx="60" cy="72" r="5" fill="white" opacity="0.3"/>
        <circle cx="60" cy="72" r="4.5" fill="url(#goldenShimmer)"/>
        <circle cx="59" cy="71" r="1.5" fill="white" opacity="0.8"/>
      </g>
      
      {/* Connection lines with glow */}
      <g opacity="0.5" stroke="white" strokeWidth="2.5" strokeLinecap="round" filter="url(#ultraGlow)">
        <line x1="47" y1="48" x2="73" y2="48"/>
        <line x1="47" y1="48" x2="60" y2="72"/>
        <line x1="73" y1="48" x2="60" y2="72"/>
      </g>
      
      {/* Thin glossy connection lines overlay */}
      <g opacity="0.3" stroke="url(#letterGlow)" strokeWidth="1" strokeLinecap="round">
        <line x1="47" y1="48" x2="73" y2="48"/>
        <line x1="47" y1="48" x2="60" y2="72"/>
        <line x1="73" y1="48" x2="60" y2="72"/>
      </g>
      
      {/* Decorative glossy rings */}
      <circle cx="60" cy="60" r="36" fill="none" stroke="white" strokeWidth="1.5" opacity="0.3"/>
      <circle cx="60" cy="60" r="36.5" fill="none" stroke="url(#glossyHighlight)" strokeWidth="0.5" opacity="0.5"/>
      
      {/* Outer premium ring with shimmer */}
      <circle cx="60" cy="60" r="52" fill="none" stroke="white" strokeWidth="1" opacity="0.2"/>
      <circle cx="60" cy="60" r="52.5" fill="none" stroke="url(#glossyHighlight)" strokeWidth="0.5" opacity="0.4"/>
      
      {/* Animated shimmer effect - Optional */}
      {animated && (
        <>
          <rect x="0" y="0" width="120" height="120" fill="url(#glossyHighlight)" opacity="0.15">
            <animateTransform
              attributeName="transform"
              type="rotate"
              from="0 60 60"
              to="360 60 60"
              dur="20s"
              repeatCount="indefinite"
            />
          </rect>
        </>
      )}
    </svg>
  );
};
