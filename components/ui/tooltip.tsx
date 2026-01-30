'use client';

import * as React from 'react';
import * as TooltipPrimitive from '@radix-ui/react-tooltip';

import { cn } from '@/lib/utils';

const TooltipProvider = ({ children, ...props }: TooltipPrimitive.TooltipProviderProps) => (
  <TooltipPrimitive.Provider delayDuration={200} skipDelayDuration={0} {...props}>
    {children}
  </TooltipPrimitive.Provider>
);

const Tooltip = TooltipPrimitive.Root;

const TooltipTrigger = TooltipPrimitive.Trigger;

const TooltipContent = React.forwardRef<
  React.ElementRef<typeof TooltipPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>
>(({ className, sideOffset = 6, ...props }, ref) => (
  <TooltipPrimitive.Portal>
    <TooltipPrimitive.Content
      ref={ref}
      sideOffset={sideOffset}
      className={cn(
        // Base styles - Fortune 500 / Premium SaaS tooltip
        'z-[9999] px-3 py-1.5 text-xs font-medium tracking-wide',
        // Colors - Clean, minimal dark appearance
        'bg-zinc-900 text-zinc-50',
        'dark:bg-zinc-50 dark:text-zinc-900',
        // Shadow - Subtle professional depth
        'shadow-lg shadow-black/10 dark:shadow-black/5',
        // Shape - Modern rounded
        'rounded-md',
        // No underlines or decorations
        'no-underline [&_*]:no-underline',
        // Animation - Subtle, fast entrance (like Vercel/Linear)
        'animate-in fade-in-0 zoom-in-95 duration-150',
        'data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=closed]:duration-100',
        // Slide direction based on position
        'data-[side=bottom]:slide-in-from-top-1',
        'data-[side=left]:slide-in-from-right-1', 
        'data-[side=right]:slide-in-from-left-1',
        'data-[side=top]:slide-in-from-bottom-1',
        // Pointer events
        'select-none pointer-events-none',
        className
      )}
      {...props}
    />
  </TooltipPrimitive.Portal>
));
TooltipContent.displayName = TooltipPrimitive.Content.displayName;

// Premium tooltip arrow for special cases
const TooltipArrow = React.forwardRef<
  React.ElementRef<typeof TooltipPrimitive.Arrow>,
  React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Arrow>
>(({ className, ...props }, ref) => (
  <TooltipPrimitive.Arrow
    ref={ref}
    className={cn(
      'fill-zinc-900 dark:fill-zinc-50',
      className
    )}
    width={8}
    height={4}
    {...props}
  />
));
TooltipArrow.displayName = 'TooltipArrow';

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider, TooltipArrow };
