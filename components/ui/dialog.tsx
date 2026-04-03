'use client';

import * as React from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';

import { cn } from '@/lib/utils';

const Dialog = DialogPrimitive.Root;

const DialogTrigger = DialogPrimitive.Trigger;

const DialogPortal = DialogPrimitive.Portal;

const DialogClose = DialogPrimitive.Close;

const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      'fixed inset-0 z-[9999] bg-slate-950/45 dark:bg-black/70 data-[state=open]:opacity-100 data-[state=closed]:opacity-0 data-[state=open]:backdrop-blur-[3px] data-[state=closed]:backdrop-blur-0 transition-[opacity,backdrop-filter] data-[state=open]:duration-[240ms] data-[state=closed]:duration-[160ms] data-[state=open]:ease-[cubic-bezier(0,0,0.38,0.9)] data-[state=closed]:ease-[cubic-bezier(0.2,0,1,0.9)] motion-reduce:transition-none',
      className
    )}
    {...props}
  />
));
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName;

const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> & {
    showCloseButton?: boolean;
  }
>(({ className, children, showCloseButton = true, ...props }, ref) => (
  <DialogPortal>
    <DialogOverlay />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        'fixed left-[50%] top-[50%] z-[9999] grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 rounded-xl border border-border dark:border-white/25 bg-popover p-6 text-popover-foreground origin-center transform-gpu will-change-transform data-[state=open]:opacity-100 data-[state=closed]:opacity-0 data-[state=open]:scale-100 data-[state=closed]:scale-[0.975] transition-[opacity,transform,box-shadow] data-[state=open]:duration-[280ms] data-[state=closed]:duration-[180ms] data-[state=open]:ease-[cubic-bezier(0,0,0.38,0.9)] data-[state=closed]:ease-[cubic-bezier(0.2,0,1,0.9)] data-[state=open]:shadow-[0_32px_96px_-44px_rgba(15,23,42,0.78)] dark:data-[state=open]:shadow-[0_36px_110px_-48px_rgba(2,6,23,0.92)] motion-reduce:transition-none',
        className
      )}
      {...props}
    >
      {children}
      {showCloseButton && (
        <DialogPrimitive.Close className="absolute right-4 top-4 rounded-md border border-transparent p-1 opacity-70 ring-offset-background transition-colors duration-150 hover:bg-muted hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring/20 disabled:pointer-events-none data-[state=open]:text-muted-foreground">
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </DialogPrimitive.Close>
      )}
    </DialogPrimitive.Content>
  </DialogPortal>
));
DialogContent.displayName = DialogPrimitive.Content.displayName;

const DialogHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      'flex flex-col space-y-1.5 text-center sm:text-left',
      className
    )}
    {...props}
  />
);
DialogHeader.displayName = 'DialogHeader';

const DialogFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      'flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2',
      className
    )}
    {...props}
  />
);
DialogFooter.displayName = 'DialogFooter';

const DialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn(
      'text-h4 text-foreground',
      className
    )}
    {...props}
  />
));
DialogTitle.displayName = DialogPrimitive.Title.displayName;

const DialogDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn('text-body-sm text-muted-foreground', className)}
    {...props}
  />
));
DialogDescription.displayName = DialogPrimitive.Description.displayName;

export {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogClose,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
};
