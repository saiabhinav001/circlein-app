'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { AlertCircle, UserX, XCircle, ArrowLeft, Home, Sun, Moon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { CircleInLogo } from '@/components/ui';
import { useTheme } from '@/components/providers/theme-provider';

const errorMessages = {
  AccountDeleted: {
    icon: UserX,
    title: 'Account Deleted',
    description: 'Your account has been deleted by an administrator.',
    message: 'If you believe this is an error, please contact your community administrator for assistance.',
    lightColor: 'text-red-600',
    darkColor: 'text-red-400',
    lightBg: 'bg-red-50',
    darkBg: 'bg-red-500/10',
    lightBorder: 'border-red-200',
    darkBorder: 'border-red-500/20',
  },
  NoAccount: {
    icon: AlertCircle,
    title: 'No Account Found',
    description: "We couldn't find an account associated with this email.",
    message: 'Please contact your community administrator to receive an invite or access code to create an account.',
    lightColor: 'text-amber-600',
    darkColor: 'text-amber-400',
    lightBg: 'bg-amber-50',
    darkBg: 'bg-amber-500/10',
    lightBorder: 'border-amber-200',
    darkBorder: 'border-amber-500/20',
  },
  AuthenticationError: {
    icon: XCircle,
    title: 'Authentication Error',
    description: 'An error occurred during sign-in.',
    message: 'Please try again. If the problem persists, contact support.',
    lightColor: 'text-orange-600',
    darkColor: 'text-orange-400',
    lightBg: 'bg-orange-50',
    darkBg: 'bg-orange-500/10',
    lightBorder: 'border-orange-200',
    darkBorder: 'border-orange-500/20',
  },
  OAuthAccountNotLinked: {
    icon: AlertCircle,
    title: 'Account Not Linked',
    description: 'This email is already associated with another sign-in method.',
    message: 'Try signing in with a different method, or use a different email address.',
    lightColor: 'text-violet-600',
    darkColor: 'text-violet-400',
    lightBg: 'bg-violet-50',
    darkBg: 'bg-violet-500/10',
    lightBorder: 'border-violet-200',
    darkBorder: 'border-violet-500/20',
  },
  Default: {
    icon: AlertCircle,
    title: 'Sign-In Failed',
    description: 'Unable to complete sign-in.',
    message: 'Please try again or contact support if the issue continues.',
    lightColor: 'text-slate-600',
    darkColor: 'text-slate-400',
    lightBg: 'bg-slate-100',
    darkBg: 'bg-slate-500/10',
    lightBorder: 'border-slate-200',
    darkBorder: 'border-slate-500/20',
  }
};

function AuthErrorContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [errorType, setErrorType] = useState<string>('Default');
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    const error = searchParams.get('error');
    if (error && errorMessages[error as keyof typeof errorMessages]) {
      setErrorType(error);
    }
  }, [searchParams]);

  const errorConfig = errorMessages[errorType as keyof typeof errorMessages] || errorMessages.Default;
  const Icon = errorConfig.icon;

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-slate-950 transition-colors duration-300">
      {/* Header */}
      <div className="flex items-center justify-between p-4 sm:p-6">
        <Link href="/" className="flex items-center gap-2">
          <CircleInLogo className="w-8 h-8" />
          <span className="text-lg font-bold bg-gradient-to-r from-indigo-600 to-violet-600 dark:from-indigo-400 dark:to-violet-400 bg-clip-text text-transparent">
            CircleIn
          </span>
        </Link>
        
        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          aria-label="Toggle theme"
        >
          <Sun className="w-5 h-5 text-amber-500 rotate-0 scale-100 transition-all dark:rotate-90 dark:scale-0" />
          <Moon className="absolute w-5 h-5 text-indigo-400 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" style={{ marginTop: '-20px' }} />
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md text-center"
        >
          {/* Error Icon */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.1, type: 'spring', stiffness: 200, damping: 15 }}
            className={`
              mx-auto mb-6 w-20 h-20 rounded-2xl flex items-center justify-center
              ${errorConfig.lightBg} dark:${errorConfig.darkBg}
              border ${errorConfig.lightBorder} dark:${errorConfig.darkBorder}
            `}
          >
            <Icon className={`w-10 h-10 ${errorConfig.lightColor} dark:${errorConfig.darkColor}`} />
          </motion.div>

          {/* Error Title */}
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mb-3"
          >
            {errorConfig.title}
          </motion.h1>

          {/* Error Description */}
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-slate-600 dark:text-slate-400 mb-6"
          >
            {errorConfig.description}
          </motion.p>

          {/* Message Card */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 mb-8"
          >
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              {errorConfig.message}
            </p>
          </motion.div>

          {/* Actions */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="space-y-3"
          >
            <Button
              onClick={() => router.push('/auth/signin')}
              className="
                w-full h-12 text-base font-semibold rounded-xl
                bg-slate-900 dark:bg-white
                text-white dark:text-slate-900
                hover:bg-slate-800 dark:hover:bg-slate-100
                transition-all duration-200
                hover:scale-[1.02] active:scale-[0.98]
                shadow-lg shadow-slate-900/10 dark:shadow-white/10
              "
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Sign In
            </Button>

            <Button
              variant="outline"
              onClick={() => router.push('/')}
              className="
                w-full h-12 text-base font-medium rounded-xl
                bg-white dark:bg-slate-900
                border-slate-200 dark:border-slate-800
                text-slate-700 dark:text-slate-300
                hover:bg-slate-50 dark:hover:bg-slate-800
                hover:border-slate-300 dark:hover:border-slate-700
                transition-all duration-200
              "
            >
              <Home className="w-4 h-4 mr-2" />
              Go to Homepage
            </Button>
          </motion.div>

          {/* Help Text */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="mt-8 text-xs text-slate-500 dark:text-slate-500"
          >
            Need help? Contact your community administrator
          </motion.p>
        </motion.div>
      </div>

      {/* Footer */}
      <div className="p-4 sm:p-6 text-center">
        <p className="text-xs text-slate-500 dark:text-slate-500">
          <Link href="/terms" className="underline hover:text-slate-700 dark:hover:text-slate-300 transition-colors">
            Terms
          </Link>{' '}
          ·{' '}
          <Link href="/privacy" className="underline hover:text-slate-700 dark:hover:text-slate-300 transition-colors">
            Privacy
          </Link>{' '}
          ·{' '}
          <Link href="/security" className="underline hover:text-slate-700 dark:hover:text-slate-300 transition-colors">
            Security
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function AuthError() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-slate-950">
        <div className="w-8 h-8 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
      </div>
    }>
      <AuthErrorContent />
    </Suspense>
  );
}
