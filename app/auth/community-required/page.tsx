'use client';

import { useSession, signOut } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { AlertCircle, Mail, RefreshCw, LogOut, Sun, Moon, Building2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { CircleInLogo } from '@/components/ui';
import { useTheme } from '@/components/providers/theme-provider';
import Link from 'next/link';

export default function CommunityRequired() {
  const { data: session } = useSession();
  const { theme, setTheme } = useTheme();

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-slate-950 transition-colors duration-300">
      {/* Header */}
      <div className="flex items-center justify-between p-4 sm:p-6">
        <Link href="/" className="flex items-center gap-2">
          <CircleInLogo className="w-8 h-8" />
          <span className="text-lg font-bold bg-gradient-to-r from-amber-600 to-orange-600 dark:from-amber-400 dark:to-orange-400 bg-clip-text text-transparent">
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
          className="w-full max-w-lg"
        >
          {/* Icon */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.1, type: 'spring', stiffness: 200, damping: 15 }}
            className="mx-auto mb-6 w-20 h-20 rounded-2xl flex items-center justify-center bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20"
          >
            <Building2 className="w-10 h-10 text-amber-600 dark:text-amber-400" />
          </motion.div>

          {/* Title */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-center mb-8"
          >
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mb-3">
              Community Assignment Required
            </h1>
            <p className="text-slate-600 dark:text-slate-400">
              Your account needs to be assigned to a community
            </p>
          </motion.div>

          {/* Info Cards */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="space-y-4 mb-8"
          >
            {/* What's happening */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-500/10">
                  <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 dark:text-white mb-1">What's happening?</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                    Your account <span className="font-medium text-slate-800 dark:text-slate-200">({session?.user?.email})</span> exists but hasn't been assigned to a specific housing community yet. This is required for data security and access control.
                  </p>
                </div>
              </div>
            </div>

            {/* How to resolve */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <h3 className="font-semibold text-slate-900 dark:text-white mb-3">How to resolve this:</h3>
              <ol className="space-y-2">
                {[
                  'Contact your community administrator',
                  `Provide them with your email: ${session?.user?.email}`,
                  'They will assign you to the correct community',
                  'Sign out and sign back in to refresh your permissions'
                ].map((step, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-xs font-semibold text-slate-700 dark:text-slate-300">
                      {index + 1}
                    </span>
                    <span className="text-sm text-slate-600 dark:text-slate-400 pt-0.5">{step}</span>
                  </li>
                ))}
              </ol>
            </div>

            {/* Need help */}
            <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-500/5 border border-blue-200 dark:border-blue-500/20">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-500/10">
                  <Mail className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-blue-900 dark:text-blue-200 mb-1">Need Help?</h3>
                  <p className="text-sm text-blue-700 dark:text-blue-300/80 leading-relaxed">
                    If you're unsure who to contact, please reach out to your building management or the person who provided you with the access code.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Actions */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="flex gap-3"
          >
            <Button
              onClick={() => signOut({ callbackUrl: '/' })}
              variant="outline"
              className="
                flex-1 h-12 text-base font-medium rounded-xl
                bg-white dark:bg-slate-900
                border-slate-200 dark:border-slate-800
                text-slate-700 dark:text-slate-300
                hover:bg-slate-50 dark:hover:bg-slate-800
                hover:border-slate-300 dark:hover:border-slate-700
                transition-all duration-200
              "
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
            
            <Button
              onClick={() => window.location.reload()}
              className="
                flex-1 h-12 text-base font-semibold rounded-xl
                bg-slate-900 dark:bg-white
                text-white dark:text-slate-900
                hover:bg-slate-800 dark:hover:bg-slate-100
                transition-all duration-200
                hover:scale-[1.02] active:scale-[0.98]
                shadow-lg shadow-slate-900/10 dark:shadow-white/10
              "
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </motion.div>
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
