'use client';

import { useState, useEffect, Suspense } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, CheckCircle2, AlertCircle, Sun, Moon, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import Link from 'next/link';
import { CircleInLogo } from '@/components/ui';
import { useTheme } from '@/components/providers/theme-provider';

function SignInContent() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [emailValid, setEmailValid] = useState<boolean | null>(null);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { theme, setTheme } = useTheme();

  // Check for error parameter
  useEffect(() => {
    const error = searchParams.get('error');
    if (error) {
      if (error === 'AccountDeleted') {
        toast.error('Account Deleted', {
          description: 'Your account has been deleted by an administrator.',
        });
      } else if (error === 'NoAccount') {
        toast.error('No Account Found', {
          description: 'Please contact your administrator for an invite or access code.',
        });
      } else if (error === 'OAuthAccountNotLinked') {
        toast.error('Account Not Linked', {
          description: 'This email is already associated with another sign-in method.',
        });
      } else {
        toast.error('Sign-In Failed', {
          description: 'Unable to complete sign-in. Please try again.',
        });
      }
    }
  }, [searchParams]);

  // Email validation
  const validateEmail = (value: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const isValid = emailRegex.test(value);
    setEmailValid(value.length > 0 ? isValid : null);
    return isValid;
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setEmail(value);
    validateEmail(value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        toast.error(result.error);
        setLoading(false);
      } else if (result?.ok) {
        toast.success('Welcome back!');
        try {
          router.push('/dashboard');
          setTimeout(() => router.replace('/dashboard'), 100);
          setTimeout(() => {
            if (typeof window !== 'undefined') {
              window.location.assign('/dashboard');
            }
          }, 500);
        } catch (redirectError) {
          if (typeof window !== 'undefined') {
            window.location.href = '/dashboard';
          }
        }
      } else {
        toast.error('Sign-in completed but status unclear. Redirecting...');
        setLoading(false);
        router.push('/dashboard');
      }
    } catch (error) {
      toast.error('Something went wrong. Please try again.');
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      await signIn('google', { 
        callbackUrl: '/dashboard',
        redirect: true
      });
    } catch (error: any) {
      setLoading(false);
      const errorMessage = error?.message || 'Failed to sign in with Google';
      
      if (errorMessage.includes('AccountDeleted')) {
        toast.error('Account Deleted', {
          description: 'Your account has been deleted. Contact your administrator.',
        });
      } else if (errorMessage.includes('NoAccount')) {
        toast.error('No Account Found', {
          description: 'No existing account or invite found for this email.',
        });
      } else if (errorMessage.includes('OAuthAccountNotLinked')) {
        toast.error('Account Not Linked', {
          description: 'This email is already registered with another sign-in method.',
        });
      } else {
        toast.error('Sign-In Failed', { description: errorMessage });
      }
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Branding (hidden on mobile) */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-700 dark:from-indigo-900 dark:via-violet-900 dark:to-purple-950">
        {/* Subtle pattern overlay */}
        <div 
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: 'radial-gradient(rgba(255,255,255,0.3) 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }}
        />
        
        {/* Floating gradient orbs */}
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-purple-300/10 rounded-full blur-3xl" />
        
        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center px-12 xl:px-16">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="flex items-center gap-3 mb-8">
              <CircleInLogo className="w-12 h-12" />
              <span className="text-2xl font-bold text-white">CircleIn</span>
            </div>
            
            <h1 className="text-4xl xl:text-5xl font-bold text-white mb-6 leading-tight">
              Welcome back to<br />
              <span className="text-indigo-200">your community</span>
            </h1>
            
            <p className="text-lg text-indigo-100/80 max-w-md leading-relaxed">
              Sign in to manage bookings, connect with neighbors, and stay updated with your community.
            </p>
          </motion.div>
          
          {/* Trust badges */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="mt-12 flex items-center gap-6 text-sm text-indigo-200/70"
          >
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>Secure login</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>Privacy protected</span>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="flex-1 flex flex-col bg-white dark:bg-slate-950 transition-colors duration-300">
        {/* Header with theme toggle */}
        <div className="flex items-center justify-between p-4 sm:p-6">
          <Link href="/" className="flex items-center gap-2 lg:hidden">
            <CircleInLogo className="w-8 h-8" />
            <span className="text-lg font-bold bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
              CircleIn
            </span>
          </Link>
          
          <div className="lg:ml-auto">
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              aria-label="Toggle theme"
            >
              <Sun className="w-5 h-5 text-amber-500 rotate-0 scale-100 transition-all dark:rotate-90 dark:scale-0" />
              <Moon className="absolute w-5 h-5 text-indigo-400 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" style={{ marginTop: '-20px' }} />
            </button>
          </div>
        </div>

        {/* Form Container */}
        <div className="flex-1 flex items-center justify-center px-4 sm:px-6 py-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full max-w-[400px]"
          >
            {/* Mobile heading */}
            <div className="text-center mb-8 lg:hidden">
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mb-2">
                Welcome back
              </h1>
              <p className="text-slate-600 dark:text-slate-400">
                Sign in to your account
              </p>
            </div>

            {/* Desktop heading */}
            <div className="hidden lg:block mb-8">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                Sign in
              </h2>
              <p className="text-slate-600 dark:text-slate-400">
                Enter your credentials to continue
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email Field */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Email address
                </Label>
                <div className="relative">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
                    <Mail className={`w-[18px] h-[18px] transition-colors duration-200 ${
                      focusedField === 'email' 
                        ? 'text-indigo-500 dark:text-indigo-400' 
                        : 'text-slate-400 dark:text-slate-500'
                    }`} />
                  </div>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={handleEmailChange}
                    onFocus={() => setFocusedField('email')}
                    onBlur={() => setFocusedField(null)}
                    placeholder="name@example.com"
                    className={`
                      h-12 pl-11 pr-11 text-base
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
                    `}
                    required
                  />
                  <AnimatePresence>
                    {emailValid === true && (
                      <motion.div
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2"
                      >
                        <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                      </motion.div>
                    )}
                    {emailValid === false && (
                      <motion.div
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2"
                      >
                        <AlertCircle className="w-5 h-5 text-red-500" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Password
                </Label>
                <div className="relative">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
                    <Lock className={`w-[18px] h-[18px] transition-colors duration-200 ${
                      focusedField === 'password' 
                        ? 'text-indigo-500 dark:text-indigo-400' 
                        : 'text-slate-400 dark:text-slate-500'
                    }`} />
                  </div>
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onFocus={() => setFocusedField('password')}
                    onBlur={() => setFocusedField(null)}
                    placeholder="Enter your password"
                    className={`
                      h-12 pl-11 pr-11 text-base
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
                    `}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors p-1"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? (
                      <EyeOff className="w-[18px] h-[18px]" />
                    ) : (
                      <Eye className="w-[18px] h-[18px]" />
                    )}
                  </button>
                </div>
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
                    Signing in...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    Sign in
                    <ArrowRight className="w-4 h-4" />
                  </span>
                )}
              </Button>
            </form>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200 dark:border-slate-800" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white dark:bg-slate-950 px-3 text-slate-500 dark:text-slate-400">
                  or continue with
                </span>
              </div>
            </div>

            {/* Google Sign In */}
            <Button
              type="button"
              variant="outline"
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="
                w-full h-12 text-base font-medium rounded-xl
                bg-white dark:bg-slate-900
                border-slate-200 dark:border-slate-800
                text-slate-700 dark:text-slate-300
                hover:bg-slate-50 dark:hover:bg-slate-800
                hover:border-slate-300 dark:hover:border-slate-700
                transition-all duration-200
                hover:scale-[1.02] active:scale-[0.98]
              "
            >
              <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Continue with Google
            </Button>

            {/* Sign Up Link */}
            <p className="text-center mt-8 text-sm text-slate-600 dark:text-slate-400">
              Don't have an account?{' '}
              <Link
                href="/auth/signup"
                className="font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300 transition-colors"
              >
                Create account
              </Link>
            </p>
          </motion.div>
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-6 text-center">
          <p className="text-xs text-slate-500 dark:text-slate-500">
            By signing in, you agree to our{' '}
            <Link href="/terms" className="underline hover:text-slate-700 dark:hover:text-slate-300 transition-colors">
              Terms
            </Link>{' '}
            and{' '}
            <Link href="/privacy" className="underline hover:text-slate-700 dark:hover:text-slate-300 transition-colors">
              Privacy Policy
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function SignIn() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-slate-950">
        <div className="w-8 h-8 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
      </div>
    }>
      <SignInContent />
    </Suspense>
  );
}
