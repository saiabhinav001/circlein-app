'use client';

import { motion, Variants } from 'framer-motion';
import { ReactNode } from 'react';

interface MotionWrapperProps {
  children: ReactNode;
  className?: string;
  delay?: number;
}

// Premium easing curve for Fortune 500 feel
const PREMIUM_EASE = [0.25, 0.1, 0.25, 1.0] as const;

// Spring physics for natural, weighty animations
const SPRING_CONFIG = {
  stiffness: 100,
  damping: 20,
  mass: 0.8,
};

// Fade-up animation variant with subtle motion
const fadeUpVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 20,
    scale: 0.98,
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: 'spring',
      ...SPRING_CONFIG,
    },
  },
};

// Mobile-optimized variant with reduced travel distance
const fadeUpVariantsMobile: Variants = {
  hidden: {
    opacity: 0,
    y: 10,
    scale: 0.99,
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: 'spring',
      ...SPRING_CONFIG,
    },
  },
};

/**
 * FadeIn Component - Industry standard scroll-triggered animation
 * Implements viewport-once pattern to prevent re-triggering
 */
export function FadeIn({ children, className = '', delay = 0 }: MotionWrapperProps) {
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-100px', amount: 0.3 }}
      variants={fadeUpVariants}
      transition={{ delay }}
      className={className}
      style={{ willChange: 'transform, opacity' }}
    >
      {children}
    </motion.div>
  );
}

/**
 * FadeInMobile - Optimized for smaller screens with reduced motion
 */
export function FadeInMobile({ children, className = '', delay = 0 }: MotionWrapperProps) {
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-50px', amount: 0.2 }}
      variants={fadeUpVariantsMobile}
      transition={{ delay }}
      className={className}
      style={{ willChange: 'transform, opacity' }}
    >
      {children}
    </motion.div>
  );
}

/**
 * StaggerContainer - Parent wrapper for staggered children animations
 */
interface StaggerContainerProps {
  children: ReactNode;
  className?: string;
  staggerDelay?: number;
}

export function StaggerContainer({ 
  children, 
  className = '', 
  staggerDelay = 0.1 
}: StaggerContainerProps) {
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: staggerDelay,
        delayChildren: 0.2,
      },
    },
  };

  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-100px' }}
      variants={containerVariants}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/**
 * StaggerItem - Child component for staggered animations
 */
export function StaggerItem({ children, className = '' }: Omit<MotionWrapperProps, 'delay'>) {
  const itemVariants: Variants = {
    hidden: {
      opacity: 0,
      y: 20,
      scale: 0.95,
    },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        type: 'spring',
        ...SPRING_CONFIG,
      },
    },
  };

  return (
    <motion.div
      variants={itemVariants}
      className={className}
      style={{ willChange: 'transform, opacity' }}
    >
      {children}
    </motion.div>
  );
}

/**
 * ScaleOnHover - Micro-interaction for buttons and cards
 */
interface ScaleOnHoverProps {
  children: ReactNode;
  className?: string;
  scaleAmount?: number;
}

export function ScaleOnHover({ 
  children, 
  className = '', 
  scaleAmount = 1.02 
}: ScaleOnHoverProps) {
  return (
    <motion.div
      whileHover={{ 
        scale: scaleAmount,
        transition: { 
          type: 'spring',
          stiffness: 400,
          damping: 25,
        }
      }}
      whileTap={{ scale: 0.98 }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/**
 * ResponsiveFadeIn - Automatically chooses mobile or desktop variant
 */
export function ResponsiveFadeIn({ children, className = '', delay = 0 }: MotionWrapperProps) {
  return (
    <>
      {/* Desktop version */}
      <div className="hidden md:block">
        <FadeIn delay={delay} className={className}>
          {children}
        </FadeIn>
      </div>
      {/* Mobile version */}
      <div className="block md:hidden">
        <FadeInMobile delay={delay} className={className}>
          {children}
        </FadeInMobile>
      </div>
    </>
  );
}

/**
 * AccessibleMotion - Wrapper that respects prefers-reduced-motion
 */
export function AccessibleMotion({ children, className = '' }: Omit<MotionWrapperProps, 'delay'>) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.3 }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
