'use client';

import { useToast } from '@/hooks/use-toast';
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from '@/components/ui/toast';
import { CheckCircle2, XCircle, AlertTriangle, Info, Sparkles } from 'lucide-react';

export function Toaster() {
  const { toasts } = useToast();

  const getToastIcon = (variant: any) => {
    const variantStr = String(variant);
    const iconClass = "h-5 w-5 sm:h-6 sm:w-6 flex-shrink-0";
    switch (variantStr) {
      case 'default':
        return <Info className={`${iconClass} text-teal-600 dark:text-teal-400`} />;
      case 'destructive':
        return <XCircle className={`${iconClass} text-red-500 dark:text-red-400`} />;
      case 'success':
        return <CheckCircle2 className={`${iconClass} text-green-500 dark:text-green-400`} />;
      case 'warning':
        return <AlertTriangle className={`${iconClass} text-yellow-500 dark:text-yellow-400`} />;
      default:
        return <Sparkles className={`${iconClass} text-teal-600 dark:text-teal-400`} />;
    }
  };

  const getToastStyles = (variant: any) => {
    const variantStr = String(variant);
    switch (variantStr) {
      case 'destructive':
        return 'bg-red-50 dark:bg-red-950/35 border-red-200 dark:border-red-800';
      case 'success':
        return 'bg-emerald-50 dark:bg-emerald-950/35 border-emerald-200 dark:border-emerald-800';
      case 'warning':
        return 'bg-amber-50 dark:bg-amber-950/35 border-amber-200 dark:border-amber-800';
      default:
        return 'bg-teal-50 dark:bg-teal-950/35 border-teal-200 dark:border-teal-800';
    }
  };

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, variant, ...props }) {
        return (
          <Toast 
            key={id} 
            {...props} 
            variant={variant}
            className={`${getToastStyles(variant)} backdrop-blur-xl border-2 sm:border-3 shadow-xl sm:shadow-2xl animate-in slide-in-from-top-full sm:slide-in-from-bottom-full`}
          >
            <div className="flex items-start gap-2.5 sm:gap-3 w-full">
              <div className="flex-shrink-0 mt-0.5 sm:mt-1">
                {getToastIcon(variant)}
              </div>
              <div className="flex-1 min-w-0 space-y-1">
                {title && <ToastTitle className="font-bold text-slate-900 dark:text-white break-words">{title}</ToastTitle>}
                {description && (
                  <ToastDescription className="text-slate-700 dark:text-slate-300 break-words">{description}</ToastDescription>
                )}
              </div>
            </div>
            {action}
            <ToastClose />
          </Toast>
        );
      })}
      <ToastViewport />
    </ToastProvider>
  );
}
