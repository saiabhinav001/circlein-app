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
    switch (variantStr) {
      case 'default':
        return <Info className="h-5 w-5 text-blue-500" />;
      case 'destructive':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'success':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      default:
        return <Sparkles className="h-5 w-5 text-blue-500" />;
    }
  };

  const getToastStyles = (variant: any) => {
    const variantStr = String(variant);
    switch (variantStr) {
      case 'destructive':
        return 'bg-gradient-to-r from-red-50 to-pink-50 dark:from-red-950/50 dark:to-pink-950/50 border-red-200 dark:border-red-800';
      case 'success':
        return 'bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/50 dark:to-emerald-950/50 border-green-200 dark:border-green-800';
      case 'warning':
        return 'bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-950/50 dark:to-orange-950/50 border-yellow-200 dark:border-yellow-800';
      default:
        return 'bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/50 dark:to-indigo-950/50 border-blue-200 dark:border-blue-800';
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
            className={`${getToastStyles(variant)} backdrop-blur-xl border-2 shadow-2xl`}
          >
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-0.5">
                {getToastIcon(variant)}
              </div>
              <div className="flex-1 grid gap-1">
                {title && <ToastTitle className="font-bold text-slate-900 dark:text-white">{title}</ToastTitle>}
                {description && (
                  <ToastDescription className="text-slate-700 dark:text-slate-300">{description}</ToastDescription>
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
