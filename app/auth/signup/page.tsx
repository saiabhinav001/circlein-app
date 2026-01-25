'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, User, Key, Eye, EyeOff, CheckCircle2, AlertCircle, Sun, Moon, ArrowRight, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import Link from 'next/link';
import { CircleInLogo } from '@/components/ui';
import { useTheme } from '@/components/providers/theme-provider';

export default function SignUp() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    accessCode: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [emailValid, setEmailValid] = useState<boolean | null>(null);
  const [passwordsMatch, setPasswordsMatch] = useState<boolean | null>(null);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const router = useRouter();
  const { theme, setTheme } = useTheme();

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const email = e.target.value;
    setFormData({ ...formData, email });
    if (email.length > 0) {
      setEmailValid(validateEmail(email));
    } else {
      setEmailValid(null);
    }
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const password = e.target.value;
    setFormData({ ...formData, password });
    if (formData.confirmPassword.length > 0) {
      setPasswordsMatch(password === formData.confirmPassword);
    }
  };

  const handleConfirmPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const confirmPassword = e.target.value;
    setFormData({ ...formData, confirmPassword });
    if (confirmPassword.length > 0) {
      setPasswordsMatch(formData.password === confirmPassword);
    } else {
      setPasswordsMatch(null);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      setLoading(false);
      return;
    }

    try {
      const result = await signIn('credentials', {
        email: formData.email,
        password: formData.password,
        accessCode: formData.accessCode,
        name: formData.name,
        redirect: false,
      });

      if (result?.error) {
        toast.error(result.error);
      } else {
        toast.success('Account created successfully! Welcome to CircleIn!');
        router.push('/setup/flat-number');
      }
    } catch (error) {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Branding (hidden on mobile) */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-700 dark:from-emerald-900 dark:via-teal-900 dark:to-cyan-950">
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
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-emerald-300/10 rounded-full blur-3xl" />
        
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
              Join your<br />
              <span className="text-emerald-200">community today</span>
            </h1>
            
            <p className="text-lg text-emerald-100/80 max-w-md leading-relaxed">
              Get your access code from your community administrator and start booking amenities in minutes.
            </p>
          </motion.div>
          
          {/* Trust badges */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="mt-12 space-y-3"
          >
            <div className="flex items-center gap-3 text-sm text-emerald-200/70">
              <Shield className="w-4 h-4" />
              <span>Invite-only communities</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-emerald-200/70">
              <CheckCircle2 className="w-4 h-4" />
              <span>Quick setup process</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-emerald-200/70">
              <CheckCircle2 className="w-4 h-4" />
              <span>Secure &amp; private</span>
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
        <div className="flex-1 flex items-center justify-center px-4 sm:px-6 py-8 overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full max-w-[400px]"
          >
            {/* Mobile heading */}
            <div className="text-center mb-6 lg:hidden">
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mb-2">
                Create account
              </h1>
              <p className="text-slate-600 dark:text-slate-400 text-sm">
                Join your community
              </p>
            </div>

            {/* Desktop heading */}
            <div className="hidden lg:block mb-6">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                Create your account
              </h2>
              <p className="text-slate-600 dark:text-slate-400">
                Fill in your details to get started
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Access Code Field */}
              <div className="space-y-2">
                <Label htmlFor="accessCode" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Access Code <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
                    <Key className={`w-[18px] h-[18px] transition-colors duration-200 ${
                      focusedField === 'accessCode' 
                        ? 'text-amber-500 dark:text-amber-400' 
                        : 'text-slate-400 dark:text-slate-500'
                    }`} />
                  </div>
                  <Input
                    id="accessCode"
                    name="accessCode"
                    type="text"
                    value={formData.accessCode}
                    onChange={handleChange}
                    onFocus={() => setFocusedField('accessCode')}
                    onBlur={() => setFocusedField(null)}
                    placeholder="Enter your access code"
                    className={`
                      h-12 pl-11 pr-4 text-base
                      bg-slate-50 dark:bg-slate-900
                      border-slate-200 dark:border-slate-800
                      text-slate-900 dark:text-white
                      placeholder:text-slate-400 dark:placeholder:text-slate-500
                      rounded-xl
                      transition-all duration-200
                      focus:bg-white dark:focus:bg-slate-900
                      focus:border-amber-500 dark:focus:border-amber-500
                      focus:ring-2 focus:ring-amber-500/20 dark:focus:ring-amber-500/20
                      hover:border-slate-300 dark:hover:border-slate-700
                    `}
                    required
                  />
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-500">
                  Provided by your community administrator
                </p>
              </div>

              {/* Name Field */}
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Full Name
                </Label>
                <div className="relative">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
                    <User className={`w-[18px] h-[18px] transition-colors duration-200 ${
                      focusedField === 'name' 
                        ? 'text-emerald-500 dark:text-emerald-400' 
                        : 'text-slate-400 dark:text-slate-500'
                    }`} />
                  </div>
                  <Input
                    id="name"
                    name="name"
                    type="text"
                    value={formData.name}
                    onChange={handleChange}
                    onFocus={() => setFocusedField('name')}
                    onBlur={() => setFocusedField(null)}
                    placeholder="Enter your full name"
                    className={`
                      h-12 pl-11 pr-4 text-base
                      bg-slate-50 dark:bg-slate-900
                      border-slate-200 dark:border-slate-800
                      text-slate-900 dark:text-white
                      placeholder:text-slate-400 dark:placeholder:text-slate-500
                      rounded-xl
                      transition-all duration-200
                      focus:bg-white dark:focus:bg-slate-900
                      focus:border-emerald-500 dark:focus:border-emerald-500
                      focus:ring-2 focus:ring-emerald-500/20 dark:focus:ring-emerald-500/20
                      hover:border-slate-300 dark:hover:border-slate-700
                    `}
                    required
                  />
                </div>
              </div>

              {/* Email Field */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Email address
                </Label>
                <div className="relative">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
                    <Mail className={`w-[18px] h-[18px] transition-colors duration-200 ${
                      focusedField === 'email' 
                        ? 'text-blue-500 dark:text-blue-400' 
                        : 'text-slate-400 dark:text-slate-500'
                    }`} />
                  </div>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
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
                      focus:border-blue-500 dark:focus:border-blue-500
                      focus:ring-2 focus:ring-blue-500/20 dark:focus:ring-blue-500/20
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
                        ? 'text-violet-500 dark:text-violet-400' 
                        : 'text-slate-400 dark:text-slate-500'
                    }`} />
                  </div>
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={handlePasswordChange}
                    onFocus={() => setFocusedField('password')}
                    onBlur={() => setFocusedField(null)}
                    placeholder="Create a password"
                    className={`
                      h-12 pl-11 pr-11 text-base
                      bg-slate-50 dark:bg-slate-900
                      border-slate-200 dark:border-slate-800
                      text-slate-900 dark:text-white
                      placeholder:text-slate-400 dark:placeholder:text-slate-500
                      rounded-xl
                      transition-all duration-200
                      focus:bg-white dark:focus:bg-slate-900
                      focus:border-violet-500 dark:focus:border-violet-500
                      focus:ring-2 focus:ring-violet-500/20 dark:focus:ring-violet-500/20
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

              {/* Confirm Password Field */}
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Confirm Password
                </Label>
                <div className="relative">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
                    <Lock className={`w-[18px] h-[18px] transition-colors duration-200 ${
                      focusedField === 'confirmPassword' 
                        ? 'text-violet-500 dark:text-violet-400' 
                        : 'text-slate-400 dark:text-slate-500'
                    }`} />
                  </div>
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={formData.confirmPassword}
                    onChange={handleConfirmPasswordChange}
                    onFocus={() => setFocusedField('confirmPassword')}
                    onBlur={() => setFocusedField(null)}
                    placeholder="Confirm your password"
                    className={`
                      h-12 pl-11 pr-20 text-base
                      bg-slate-50 dark:bg-slate-900
                      border-slate-200 dark:border-slate-800
                      text-slate-900 dark:text-white
                      placeholder:text-slate-400 dark:placeholder:text-slate-500
                      rounded-xl
                      transition-all duration-200
                      focus:bg-white dark:focus:bg-slate-900
                      focus:border-violet-500 dark:focus:border-violet-500
                      focus:ring-2 focus:ring-violet-500/20 dark:focus:ring-violet-500/20
                      hover:border-slate-300 dark:hover:border-slate-700
                    `}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-10 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors p-1"
                    aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="w-[18px] h-[18px]" />
                    ) : (
                      <Eye className="w-[18px] h-[18px]" />
                    )}
                  </button>
                  <AnimatePresence>
                    {passwordsMatch === true && (
                      <motion.div
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2"
                      >
                        <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                      </motion.div>
                    )}
                    {passwordsMatch === false && (
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

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={loading}
                className="
                  w-full h-12 text-base font-semibold rounded-xl mt-2
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
                    Creating account...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    Create account
                    <ArrowRight className="w-4 h-4" />
                  </span>
                )}
              </Button>
            </form>

            {/* Sign In Link */}
            <p className="text-center mt-6 text-sm text-slate-600 dark:text-slate-400">
              Already have an account?{' '}
              <Link
                href="/auth/signin"
                className="font-medium text-emerald-600 dark:text-emerald-400 hover:text-emerald-500 dark:hover:text-emerald-300 transition-colors"
              >
                Sign in
              </Link>
            </p>
          </motion.div>
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-6 text-center">
          <p className="text-xs text-slate-500 dark:text-slate-500">
            By creating an account, you agree to our{' '}
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
