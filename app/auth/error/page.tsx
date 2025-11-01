'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { AlertCircle, UserX, XCircle, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { CircleInLogo } from '@/components/ui';

const errorMessages = {
  AccountDeleted: {
    icon: UserX,
    title: 'Account Deleted',
    description: 'Your account has been deleted by an administrator.',
    message: 'If you believe this is an error, please contact your community administrator for assistance.',
    color: 'text-red-400',
    bgColor: 'bg-red-500/10',
  },
  NoAccount: {
    icon: AlertCircle,
    title: 'No Account Found',
    description: 'We couldn\'t find an account associated with this email.',
    message: 'Please contact your community administrator to receive an invite or access code to create an account.',
    color: 'text-yellow-400',
    bgColor: 'bg-yellow-500/10',
  },
  AuthenticationError: {
    icon: XCircle,
    title: 'Authentication Error',
    description: 'An error occurred during sign-in.',
    message: 'Please try again. If the problem persists, contact support.',
    color: 'text-orange-400',
    bgColor: 'bg-orange-500/10',
  },
  Default: {
    icon: AlertCircle,
    title: 'Sign-In Failed',
    description: 'Unable to complete sign-in.',
    message: 'Please try again or contact support if the issue continues.',
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/10',
  }
};

export default function AuthError() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [errorType, setErrorType] = useState<string>('Default');

  useEffect(() => {
    const error = searchParams.get('error');
    if (error && errorMessages[error as keyof typeof errorMessages]) {
      setErrorType(error);
    }
  }, [searchParams]);

  const errorConfig = errorMessages[errorType as keyof typeof errorMessages] || errorMessages.Default;
  const Icon = errorConfig.icon;

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center p-4">
      {/* Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        <motion.div
          className="absolute inset-0 opacity-30"
          animate={{
            background: [
              'radial-gradient(circle at 20% 50%, rgba(239, 68, 68, 0.15) 0%, transparent 50%)',
              'radial-gradient(circle at 80% 50%, rgba(251, 146, 60, 0.15) 0%, transparent 50%)',
              'radial-gradient(circle at 50% 80%, rgba(234, 179, 8, 0.15) 0%, transparent 50%)',
              'radial-gradient(circle at 20% 50%, rgba(239, 68, 68, 0.15) 0%, transparent 50%)',
            ],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      </div>

      {/* Content */}
      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ 
          duration: 0.6,
          ease: [0.16, 1, 0.3, 1]
        }}
        className="w-full max-w-md relative z-10"
      >
        {/* Logo */}
        <motion.div 
          className="text-center mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
        >
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ 
              delay: 0.3,
              type: 'spring',
              stiffness: 200,
              damping: 15
            }}
            className="flex items-center justify-center mx-auto mb-6"
          >
            <CircleInLogo size={64} className="w-16 h-16" />
          </motion.div>
        </motion.div>

        {/* Error Card */}
        <Card className="border-0 shadow-2xl bg-slate-900/50 backdrop-blur-xl ring-1 ring-white/10">
          <CardHeader className="pb-4 space-y-1 text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.4, type: 'spring' }}
              className={`mx-auto mb-4 w-16 h-16 rounded-full ${errorConfig.bgColor} flex items-center justify-center`}
            >
              <Icon className={`w-8 h-8 ${errorConfig.color}`} />
            </motion.div>
            
            <CardTitle className="text-2xl text-white">
              {errorConfig.title}
            </CardTitle>
            
            <CardDescription className="text-slate-400">
              {errorConfig.description}
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* Message */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="p-4 rounded-lg bg-slate-800/50 border border-slate-700"
            >
              <p className="text-slate-300 text-sm leading-relaxed">
                {errorConfig.message}
              </p>
            </motion.div>

            {/* Actions */}
            <div className="space-y-3">
              <Button
                onClick={() => router.push('/auth/signin')}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Sign In
              </Button>

              <Link href="/" className="block">
                <Button
                  variant="outline"
                  className="w-full border-slate-700 hover:bg-slate-800"
                >
                  Go to Home
                </Button>
              </Link>
            </div>

            {/* Help Text */}
            <div className="text-center pt-4 border-t border-slate-800">
              <p className="text-slate-500 text-xs">
                Need help? Contact your community administrator
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
