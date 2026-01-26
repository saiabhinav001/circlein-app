'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { motion } from 'framer-motion';
import { Home, Check, ArrowRight, Building2, Sun, Moon, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { CircleInLogo } from '@/components/ui';
import { useTheme } from '@/components/providers/theme-provider';
import Link from 'next/link';

interface FlatNumberSetupProps {
  userEmail?: string;
  onComplete?: () => void;
}

export default function FlatNumberSetup({ userEmail, onComplete }: FlatNumberSetupProps) {
  const { data: session, update } = useSession();
  const [flatNumber, setFlatNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const router = useRouter();
  const { theme, setTheme } = useTheme();

  // Use provided email or get from session
  const email = userEmail || session?.user?.email;
  const userRole = (session?.user as any)?.role;
  const userFlatNumber = (session?.user as any)?.flatNumber;
  const profileCompleted = (session?.user as any)?.profileCompleted;

  // Auto-redirect based on role and profile status
  useEffect(() => {
    if (!session) return;

    // Admins should never see this page - redirect to dashboard (which handles admin onboarding)
    if (userRole === 'admin') {
      console.log('Admin user detected, redirecting to dashboard');
      window.location.href = '/dashboard';
      return;
    }

    // Regular users: redirect if profile already completed
    if (profileCompleted) {
      toast.success('Setup already completed!', {
        description: 'Redirecting to dashboard...'
      });
      setTimeout(() => {
        window.location.href = '/dashboard';
      }, 1000);
    }
  }, [session, profileCompleted, userRole]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!flatNumber.trim()) {
      toast.error('Please enter your flat number');
      return;
    }

    if (!email) {
      toast.error('Session not loaded. Please refresh the page and try again.');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/update-flat-number', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email,
          flatNumber: flatNumber.trim()
        }),
      });

      if (response.ok) {
        toast.success('Profile updated successfully! 🏠', {
          description: `Flat ${flatNumber.toUpperCase()} has been added to your profile`
        });
        
        await update();
        onComplete?.();
        window.location.href = '/dashboard';
      } else {
        const errorText = await response.text();
        try {
          const errorData = JSON.parse(errorText);
          toast.error('Failed to update profile', { 
            description: errorData.error || errorData.details || 'Please try again' 
          });
        } catch {
          toast.error('Failed to update profile', { 
            description: `Server error (${response.status}). Please try again.` 
          });
        }
      }
    } catch (error) {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = async () => {
    if (!email) {
      toast.error('Session not loaded. Please refresh the page and try again.');
      return;
    }
    
    setLoading(true);
    try {
      const response = await fetch('/api/update-flat-number', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email,
          flatNumber: ''
        }),
      });

      if (response.ok) {
        toast.success('Setup completed!', {
          description: 'You can add your flat number later from your profile'
        });
        
        await update();
        onComplete?.();
        window.location.href = '/dashboard';
      } else {
        const errorText = await response.text();
        try {
          const errorData = JSON.parse(errorText);
          toast.error('Failed to complete setup', {
            description: errorData.error || errorData.details || 'Please try again'
          });
        } catch {
          toast.error('Failed to complete setup', {
            description: `Server error (${response.status}). Please try again.`
          });
        }
      }
    } catch (error) {
      toast.error('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  // Loading state or redirecting admin
  if (!session || userRole === 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-slate-950">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <CircleInLogo className="w-16 h-16 mx-auto mb-4" />
          <div className="w-8 h-8 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-600 dark:text-slate-400">
            {userRole === 'admin' ? 'Redirecting to admin dashboard...' : 'Loading your profile...'}
          </p>
        </motion.div>
      </div>
    );
  }

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
          className="w-full max-w-md"
        >
          {/* Progress indicator */}
          <div className="flex items-center justify-center gap-2 mb-8">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center">
                <Check className="w-4 h-4 text-white" />
              </div>
              <span className="text-sm font-medium text-slate-600 dark:text-slate-400 hidden sm:inline">Account Created</span>
            </div>
            <div className="w-8 sm:w-12 h-px bg-slate-300 dark:bg-slate-700" />
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center ring-4 ring-indigo-500/20">
                <Building2 className="w-4 h-4 text-white" />
              </div>
              <span className="text-sm font-medium text-indigo-600 dark:text-indigo-400 hidden sm:inline">Add Flat Number</span>
            </div>
            <div className="w-8 sm:w-12 h-px bg-slate-300 dark:bg-slate-700" />
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-slate-400 dark:text-slate-500" />
              </div>
              <span className="text-sm font-medium text-slate-400 dark:text-slate-500 hidden sm:inline">Start Booking</span>
            </div>
          </div>

          {/* Welcome Icon */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.1, type: 'spring', stiffness: 200, damping: 15 }}
            className="mx-auto mb-6 w-20 h-20 rounded-2xl flex items-center justify-center bg-gradient-to-br from-indigo-500 to-violet-600 shadow-lg shadow-indigo-500/25"
          >
            <Home className="w-10 h-10 text-white" />
          </motion.div>

          {/* Title */}
          <div className="text-center mb-8">
            <motion.h1
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mb-3"
            >
              Almost there!
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-slate-600 dark:text-slate-400"
            >
              Add your flat number to complete your profile
            </motion.p>
          </div>

          {/* Form */}
          <motion.form
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            onSubmit={handleSubmit}
            className="space-y-6"
          >
            {/* Info Card */}
            <div className="p-4 rounded-xl bg-indigo-50 dark:bg-indigo-500/5 border border-indigo-200 dark:border-indigo-500/20">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-indigo-100 dark:bg-indigo-500/10">
                  <Building2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-indigo-900 dark:text-indigo-200 mb-1 text-sm">Why do we need this?</h3>
                  <p className="text-sm text-indigo-700 dark:text-indigo-300/80 leading-relaxed">
                    Your flat number helps us provide personalized community services and ensures your bookings are correctly attributed.
                  </p>
                </div>
              </div>
            </div>

            {/* Flat Number Input */}
            <div className="space-y-2">
              <Label htmlFor="flatNumber" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Flat Number
              </Label>
              <div className="relative">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
                  <Home className={`w-[18px] h-[18px] transition-colors duration-200 ${
                    isFocused 
                      ? 'text-indigo-500 dark:text-indigo-400' 
                      : 'text-slate-400 dark:text-slate-500'
                  }`} />
                </div>
                <Input
                  id="flatNumber"
                  type="text"
                  value={flatNumber}
                  onChange={(e) => setFlatNumber(e.target.value.toUpperCase())}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                  placeholder="e.g., A-101, B-205"
                  disabled={loading}
                  className={`
                    h-14 pl-11 pr-4 text-lg font-medium text-center
                    bg-slate-50 dark:bg-slate-900
                    border-slate-200 dark:border-slate-800
                    text-slate-900 dark:text-white
                    placeholder:text-slate-400 dark:placeholder:text-slate-500
                    rounded-xl
                    transition-all duration-200
                    focus:bg-white dark:focus:bg-slate-900
                    focus:border-indigo-500 dark:focus:border-indigo-500
                    focus:ring-2 focus:ring-indigo-500/20 dark:focus:ring-indigo-500/20
                    hover:border-slate-300 dark:hover:border-slate-700
                    disabled:opacity-50
                  `}
                />
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-500 text-center">
                Enter your flat number as it appears on your lease
              </p>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={loading}
              className="
                w-full h-12 text-base font-semibold rounded-xl
                bg-slate-900 dark:bg-white
                text-white dark:text-slate-900
                hover:bg-slate-800 dark:hover:bg-slate-100
                transition-all duration-200
                hover:scale-[1.02] active:scale-[0.98]
                disabled:opacity-50 disabled:hover:scale-100
                shadow-lg shadow-slate-900/10 dark:shadow-white/10
              "
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <motion.span
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    className="w-5 h-5 border-2 border-white/30 dark:border-slate-900/30 border-t-white dark:border-t-slate-900 rounded-full"
                  />
                  Saving...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  Complete Setup
                  <ArrowRight className="w-4 h-4" />
                </span>
              )}
            </Button>

            {/* Skip Link */}
            <div className="text-center">
              <button
                type="button"
                onClick={handleSkip}
                disabled={loading}
                className="text-sm text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors disabled:opacity-50"
              >
                Skip for now
              </button>
            </div>
          </motion.form>
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
          </Link>
        </p>
      </div>
    </div>
  );
}
