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
        {/* Crystal/Glass Base Gradient - Transparent Blue */}
        <radialGradient id="glassBase" cx="40%" cy="30%">
          <stop offset="0%" style={{ stopColor: '#EFF6FF', stopOpacity: 0.95 }} />
          <stop offset="30%" style={{ stopColor: '#DBEAFE', stopOpacity: 0.85 }} />
          <stop offset="60%" style={{ stopColor: '#BFDBFE', stopOpacity: 0.75 }} />
          <stop offset="100%" style={{ stopColor: '#93C5FD', stopOpacity: 0.65 }} />
        </radialGradient>
        
        {/* Vibrant Inner Glow - Premium Colors */}
        <radialGradient id="innerGlow" cx="50%" cy="50%">
          <stop offset="0%" style={{ stopColor: '#60A5FA', stopOpacity: 0.9 }} />
          <stop offset="30%" style={{ stopColor: '#3B82F6', stopOpacity: 0.85 }} />
          <stop offset="60%" style={{ stopColor: '#6366F1', stopOpacity: 0.8 }} />
          <stop offset="80%" style={{ stopColor: '#8B5CF6', stopOpacity: 0.75 }} />
          <stop offset="100%" style={{ stopColor: '#A855F7', stopOpacity: 0.7 }} />
        </radialGradient>
        
        {/* Top Glass Shine - White Reflection */}
        <radialGradient id="topShine" cx="50%" cy="20%">
          <stop offset="0%" style={{ stopColor: '#FFFFFF', stopOpacity: 0.9 }} />
          <stop offset="50%" style={{ stopColor: '#FFFFFF', stopOpacity: 0.5 }} />
          <stop offset="100%" style={{ stopColor: '#FFFFFF', stopOpacity: 0 }} />
        </radialGradient>
        
        {/* Bottom Glass Refraction */}
        <radialGradient id="bottomRefraction" cx="50%" cy="80%">
          <stop offset="0%" style={{ stopColor: '#DBEAFE', stopOpacity: 0.6 }} />
          <stop offset="50%" style={{ stopColor: '#93C5FD', stopOpacity: 0.3 }} />
          <stop offset="100%" style={{ stopColor: '#3B82F6', stopOpacity: 0 }} />
        </radialGradient>
        
        {/* Edge Highlight - Glass Border */}
        <linearGradient id="edgeHighlight" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: '#FFFFFF', stopOpacity: 0.8 }} />
          <stop offset="50%" style={{ stopColor: '#BFDBFE', stopOpacity: 0.4 }} />
          <stop offset="100%" style={{ stopColor: '#3B82F6', stopOpacity: 0.6 }} />
        </linearGradient>
        
        {/* Premium Golden Crystal Accent */}
        <radialGradient id="crystalGold" cx="50%" cy="50%">
          <stop offset="0%" style={{ stopColor: '#FEF3C7', stopOpacity: 1 }} />
          <stop offset="30%" style={{ stopColor: '#FDE68A', stopOpacity: 0.95 }} />
          <stop offset="60%" style={{ stopColor: '#FBBF24', stopOpacity: 0.9 }} />
          <stop offset="100%" style={{ stopColor: '#F59E0B', stopOpacity: 0.85 }} />
        </radialGradient>
        
        {/* Glass "C" Letter - Frosted Effect */}
        <linearGradient id="frostC" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: '#FFFFFF', stopOpacity: 0.95 }} />
          <stop offset="50%" style={{ stopColor: '#F0F9FF', stopOpacity: 0.9 }} />
          <stop offset="100%" style={{ stopColor: '#E0F2FE', stopOpacity: 0.85 }} />
        </linearGradient>
        
        {/* Outer Atmospheric Glow */}
        <radialGradient id="atmosphericGlow" cx="50%" cy="50%">
          <stop offset="0%" style={{ stopColor: '#3B82F6', stopOpacity: 0 }} />
          <stop offset="70%" style={{ stopColor: '#6366F1', stopOpacity: 0.3 }} />
          <stop offset="100%" style={{ stopColor: '#8B5CF6', stopOpacity: 0.6 }} />
        </radialGradient>
        
        {/* Advanced Glass Filters */}
        <filter id="glassBlur" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="0.5" result="blur"/>
          <feColorMatrix in="blur" type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 1.2 0"/>
        </filter>
        
        {/* Crystal Refraction Effect */}
        <filter id="crystalRefraction" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="1" result="blur"/>
          <feSpecularLighting in="blur" surfaceScale="10" specularConstant="2" specularExponent="30" result="spec" lightingColor="#FFFFFF">
            <fePointLight x="35" y="25" z="250"/>
          </feSpecularLighting>
          <feComposite in="spec" in2="SourceGraphic" operator="in" result="specOut"/>
          <feComposite in="SourceGraphic" in2="specOut" operator="arithmetic" k1="0" k2="1" k3="1.5" k4="0"/>
        </filter>
        
        {/* Outer Glow - Atmospheric */}
        <filter id="outerGlow" x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="8" result="blur1"/>
          <feGaussianBlur in="SourceGraphic" stdDeviation="16" result="blur2"/>
          <feColorMatrix in="blur1" type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 25 -10" result="glow1"/>
          <feColorMatrix in="blur2" type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 20 -8" result="glow2"/>
          <feMerge>
            <feMergeNode in="glow2"/>
            <feMergeNode in="glow1"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
        
        {/* Premium Drop Shadow */}
        <filter id="premiumDrop">
          <feGaussianBlur in="SourceAlpha" stdDeviation="4"/>
          <feOffset dx="0" dy="6" result="offsetblur"/>
          <feFlood floodColor="#1E293B" floodOpacity="0.5"/>
          <feComposite in2="offsetblur" operator="in"/>
          <feMerge>
            <feMergeNode/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
        
        {/* Inner Glass Depth */}
        <filter id="innerDepth">
          <feGaussianBlur in="SourceAlpha" stdDeviation="3" result="blur"/>
          <feOffset in="blur" dx="0" dy="-3" result="offsetBlur"/>
          <feFlood floodColor="#FFFFFF" floodOpacity="0.3"/>
          <feComposite in2="offsetBlur" operator="in" result="offsetColor"/>
          <feMerge>
            <feMergeNode in="offsetColor"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
      
      {/* Outer Atmospheric Glow Aura */}
      <circle cx="60" cy="60" r="65" fill="url(#atmosphericGlow)" opacity="0.7"/>
      
      {/* Secondary Glow Ring */}
      <circle cx="60" cy="60" r="59" fill="url(#innerGlow)" opacity="0.3" filter="url(#outerGlow)"/>
      
      {/* Main Glass Sphere - Base Layer */}
      <circle cx="60" cy="60" r="56" fill="url(#glassBase)" filter="url(#crystalRefraction)" opacity="0.4"/>
      
      {/* Vibrant Color Core */}
      <circle cx="60" cy="60" r="54" fill="url(#innerGlow)" opacity="0.8" filter="url(#glassBlur)"/>
      
      {/* Top Glass Shine Reflection */}
      <ellipse cx="60" cy="30" rx="48" ry="22" fill="url(#topShine)" opacity="0.9"/>
      
      {/* Secondary Top Highlight - Smaller */}
      <ellipse cx="65" cy="25" rx="20" ry="12" fill="#FFFFFF" opacity="0.6"/>
      
      {/* Side Reflection - Left */}
      <ellipse cx="25" cy="50" rx="8" ry="30" fill="#FFFFFF" opacity="0.2" transform="rotate(-15 25 50)"/>
      
      {/* Side Reflection - Right */}
      <ellipse cx="95" cy="55" rx="6" ry="25" fill="#FFFFFF" opacity="0.15" transform="rotate(15 95 55)"/>
      
      {/* Bottom Refraction/Shadow */}
      <ellipse cx="60" cy="85" rx="42" ry="18" fill="url(#bottomRefraction)" opacity="0.6"/>
      
      {/* Inner Glass Depth Layer */}
      <circle cx="60" cy="60" r="48" fill="url(#glassBase)" opacity="0.2" filter="url(#innerDepth)"/>
      
      {/* Edge Highlight Ring - Glass Border */}
      <circle cx="60" cy="60" r="56" fill="none" stroke="url(#edgeHighlight)" strokeWidth="2" opacity="0.8"/>
      <circle cx="60" cy="60" r="54" fill="none" stroke="#FFFFFF" strokeWidth="1" opacity="0.4"/>
      
      {/* Frosted Glass "C" Lettermark */}
      <g filter="url(#premiumDrop)">
        <path 
          d="M 88 60 A 28 28 0 1 1 60 32 L 60 44 A 16 16 0 1 0 76 60 Z" 
          fill="url(#frostC)"
          opacity="0.95"
          filter="url(#glassBlur)"
        />
        {/* Inner "C" Highlight */}
        <path 
          d="M 86 60 A 26 26 0 0 0 60 34 L 60 36 A 24 24 0 0 1 84 60 Z" 
          fill="#FFFFFF"
          opacity="0.5"
        />
        {/* "C" Edge Shine */}
        <path 
          d="M 88 60 A 28 28 0 0 0 60 32 L 60 33 A 27 27 0 0 1 87 60 Z" 
          fill="#FFFFFF"
          opacity="0.3"
        />
      </g>
      
      {/* Three Crystal Golden Orbs - Community Dots */}
      <g filter="url(#premiumDrop)">
        {/* Top Left Crystal Orb */}
        <circle cx="47" cy="48" r="6" fill="url(#atmosphericGlow)" opacity="0.4"/>
        <circle cx="47" cy="48" r="5" fill="url(#crystalGold)" filter="url(#crystalRefraction)"/>
        <circle cx="46" cy="46.5" r="2" fill="#FFFFFF" opacity="0.9"/>
        <circle cx="48" cy="49" r="1" fill="#FFFFFF" opacity="0.5"/>
        <circle cx="47" cy="48" r="5" fill="none" stroke="#FFFFFF" strokeWidth="0.5" opacity="0.6"/>
        
        {/* Top Right Crystal Orb */}
        <circle cx="73" cy="48" r="6" fill="url(#atmosphericGlow)" opacity="0.4"/>
        <circle cx="73" cy="48" r="5" fill="url(#crystalGold)" filter="url(#crystalRefraction)"/>
        <circle cx="72" cy="46.5" r="2" fill="#FFFFFF" opacity="0.9"/>
        <circle cx="74" cy="49" r="1" fill="#FFFFFF" opacity="0.5"/>
        <circle cx="73" cy="48" r="5" fill="none" stroke="#FFFFFF" strokeWidth="0.5" opacity="0.6"/>
        
        {/* Bottom Center Crystal Orb */}
        <circle cx="60" cy="72" r="6" fill="url(#atmosphericGlow)" opacity="0.4"/>
        <circle cx="60" cy="72" r="5" fill="url(#crystalGold)" filter="url(#crystalRefraction)"/>
        <circle cx="59" cy="70.5" r="2" fill="#FFFFFF" opacity="0.9"/>
        <circle cx="61" cy="73" r="1" fill="#FFFFFF" opacity="0.5"/>
        <circle cx="60" cy="72" r="5" fill="none" stroke="#FFFFFF" strokeWidth="0.5" opacity="0.6"/>
      </g>
      
      {/* Glass Connection Lines with Glow */}
      <g opacity="0.6" stroke="url(#edgeHighlight)" strokeWidth="2.5" strokeLinecap="round" filter="url(#outerGlow)">
        <line x1="47" y1="48" x2="73" y2="48"/>
        <line x1="47" y1="48" x2="60" y2="72"/>
        <line x1="73" y1="48" x2="60" y2="72"/>
      </g>
      
      {/* Thin White Glass Connection Lines */}
      <g opacity="0.8" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round">
        <line x1="47" y1="48" x2="73" y2="48"/>
        <line x1="47" y1="48" x2="60" y2="72"/>
        <line x1="73" y1="48" x2="60" y2="72"/>
      </g>
      
      {/* Decorative Glass Rings */}
      <circle cx="60" cy="60" r="37" fill="none" stroke="#FFFFFF" strokeWidth="1.5" opacity="0.4"/>
      <circle cx="60" cy="60" r="38" fill="none" stroke="url(#edgeHighlight)" strokeWidth="0.5" opacity="0.6"/>
      
      {/* Outer Accent Ring */}
      <circle cx="60" cy="60" r="50" fill="none" stroke="#FFFFFF" strokeWidth="1" opacity="0.25"/>
      <circle cx="60" cy="60" r="50.5" fill="none" stroke="url(#innerGlow)" strokeWidth="0.5" opacity="0.4"/>
      
      {/* Subtle Inner Rings for Depth */}
      <circle cx="60" cy="60" r="30" fill="none" stroke="#FFFFFF" strokeWidth="0.8" opacity="0.2"/>
      <circle cx="60" cy="60" r="42" fill="none" stroke="#FFFFFF" strokeWidth="0.5" opacity="0.15"/>
      
      {/* Animated Light Refraction (Optional) */}
      {animated && (
        <g opacity="0.3">
          <ellipse cx="60" cy="30" rx="45" ry="20" fill="url(#topShine)">
            <animate attributeName="opacity" values="0.3;0.6;0.3" dur="4s" repeatCount="indefinite"/>
          </ellipse>
          <circle cx="60" cy="60" r="56" fill="none" stroke="#FFFFFF" strokeWidth="1">
            <animate attributeName="opacity" values="0.2;0.5;0.2" dur="3s" repeatCount="indefinite"/>
          </circle>
        </g>
      )}
    </svg>
  );
};
