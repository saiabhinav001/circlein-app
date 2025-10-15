'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, CheckCircle2, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import Link from 'next/link';

export default function SignIn() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [emailValid, setEmailValid] = useState<boolean | null>(null);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [ripplePosition, setRipplePosition] = useState({ x: 0, y: 0 });
  const [showRipple, setShowRipple] = useState(false);
  const router = useRouter();

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
      } else {
        toast.success('Welcome back!');
        router.push('/dashboard');
      }
    } catch (error) {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    console.log('Starting Google sign-in...');
    try {
      const result = await signIn('google', { 
        callbackUrl: '/dashboard', // Redirect to dashboard after Google sign-in
        redirect: false 
      });
      console.log('Google sign-in result:', result);
      
      if (result?.error) {
        console.error('Google sign-in error:', result.error);
        toast.error('Failed to sign in with Google: ' + result.error);
      } else if (result?.url) {
        console.log('Redirecting to:', result.url);
        window.location.href = result.url;
      } else {
        toast.success('Signed in successfully!');
        router.push('/dashboard');
      }
    } catch (error) {
      console.error('Google sign-in exception:', error);
      toast.error('Failed to sign in with Google');
    } finally {
      setLoading(false);
    }
  };

  const handleButtonClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    const button = e.currentTarget;
    const rect = button.getBoundingClientRect();
    setRipplePosition({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
    setShowRipple(true);
    setTimeout(() => setShowRipple(false), 600);
  };

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center p-3 sm:p-4 md:p-6">
      {/* Animated Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        <motion.div
          className="absolute inset-0 opacity-30"
          animate={{
            background: [
              'radial-gradient(circle at 20% 50%, rgba(99, 102, 241, 0.15) 0%, transparent 50%)',
              'radial-gradient(circle at 80% 50%, rgba(168, 85, 247, 0.15) 0%, transparent 50%)',
              'radial-gradient(circle at 50% 80%, rgba(59, 130, 246, 0.15) 0%, transparent 50%)',
              'radial-gradient(circle at 20% 50%, rgba(99, 102, 241, 0.15) 0%, transparent 50%)',
            ],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
        {/* Subtle Grid Pattern */}
        <div 
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `
              linear-gradient(rgba(255, 255, 255, 0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255, 255, 255, 0.1) 1px, transparent 1px)
            `,
            backgroundSize: '50px 50px',
          }}
        />
      </div>

      {/* Main Content */}
      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ 
          duration: 0.6,
          ease: [0.16, 1, 0.3, 1]
        }}
        className="w-full max-w-[90vw] sm:max-w-md md:max-w-lg lg:max-w-md relative z-10"
      >
        {/* Logo and Title */}
        <motion.div 
          className="text-center mb-6 sm:mb-8"
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
            className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 bg-gradient-to-br from-blue-500 via-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 sm:mb-6 shadow-2xl shadow-purple-500/20"
          >
            <span className="text-xl sm:text-2xl font-bold text-white">C</span>
          </motion.div>
          
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-purple-500 bg-clip-text text-transparent mb-2 sm:mb-3"
          >
            Welcome Back
          </motion.h1>
          
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="text-slate-400 text-sm sm:text-base md:text-lg"
          >
            Sign in to your CircleIn account
          </motion.p>
        </motion.div>

        {/* Card with elevated shadow */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
        >
          <Card className="border-0 shadow-2xl bg-slate-900/50 backdrop-blur-xl ring-1 ring-white/10">
            <CardHeader className="pb-4 sm:pb-6 space-y-1 px-4 sm:px-6 pt-4 sm:pt-6">
              <CardTitle className="text-xl sm:text-2xl text-white">Sign In</CardTitle>
              <CardDescription className="text-slate-400 text-xs sm:text-sm">
                Enter your credentials to access your account
              </CardDescription>
            </CardHeader>
            
            <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
              <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
                {/* Email Field */}
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-slate-200 text-xs sm:text-sm">Email</Label>
                  <div className="relative group">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-500 group-focus-within:text-blue-400 transition-colors duration-200" />
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={handleEmailChange}
                      onFocus={() => setFocusedField('email')}
                      onBlur={() => setFocusedField(null)}
                      placeholder="Enter your email"
                      className={`
                        pl-9 sm:pl-10 pr-9 sm:pr-10 h-10 sm:h-12 bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500 text-sm sm:text-base
                        transition-all duration-300 ease-out
                        ${focusedField === 'email' 
                          ? 'ring-2 ring-blue-500/50 border-transparent shadow-lg shadow-blue-500/20' 
                          : 'hover:border-slate-600'
                        }
                      `}
                      required
                    />
                    {/* Validation Icon */}
                    <AnimatePresence>
                      {emailValid === true && (
                        <motion.div
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 0, opacity: 0 }}
                          transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 z-10"
                        >
                          <CheckCircle2 className="w-[17px] h-[17px] sm:w-[18px] sm:h-[18px] text-green-400" />
                        </motion.div>
                      )}
                      {emailValid === false && (
                        <motion.div
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 0, opacity: 0 }}
                          transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 z-10"
                        >
                          <AlertCircle className="w-[17px] h-[17px] sm:w-[18px] sm:h-[18px] text-red-400" />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
                
                {/* Password Field */}
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-slate-200 text-xs sm:text-sm">Password</Label>
                  <div className="relative group">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-500 group-focus-within:text-purple-400 transition-colors duration-200" />
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onFocus={() => setFocusedField('password')}
                      onBlur={() => setFocusedField(null)}
                      placeholder="Enter your password"
                      className={`
                        pl-9 sm:pl-10 pr-11 sm:pr-12 h-10 sm:h-12 bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500 text-sm sm:text-base
                        transition-all duration-300 ease-out
                        ${focusedField === 'password' 
                          ? 'ring-2 ring-purple-500/50 border-transparent shadow-lg shadow-purple-500/20' 
                          : 'hover:border-slate-600'
                        }
                      `}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors focus:outline-none"
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4 sm:w-[18px] sm:h-[18px]" />
                      ) : (
                        <Eye className="w-4 h-4 sm:w-[18px] sm:h-[18px]" />
                      )}
                    </button>
                  </div>
                </div>
                
                {/* Submit Button with Ripple Effect */}
                <Button
                  type="submit"
                  disabled={loading}
                  onClick={handleButtonClick}
                  className="
                    w-full h-10 sm:h-12 relative overflow-hidden
                    bg-gradient-to-r from-blue-500 via-purple-500 to-purple-600
                    hover:from-blue-600 hover:via-purple-600 hover:to-purple-700
                    text-white font-semibold text-sm sm:text-base
                    shadow-lg shadow-purple-500/25
                    transition-all duration-300
                    hover:shadow-xl hover:shadow-purple-500/40 hover:scale-[1.02]
                    active:scale-[0.98]
                    disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100
                  "
                >
                  {/* Ripple Effect */}
                  <AnimatePresence>
                    {showRipple && (
                      <motion.span
                        className="absolute inset-0 bg-white"
                        initial={{
                          scale: 0,
                          opacity: 0.6,
                        }}
                        animate={{
                          scale: 4,
                          opacity: 0,
                        }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.6, ease: 'easeOut' }}
                        style={{
                          borderRadius: '50%',
                          left: ripplePosition.x,
                          top: ripplePosition.y,
                          width: '20px',
                          height: '20px',
                          marginLeft: '-10px',
                          marginTop: '-10px',
                        }}
                      />
                    )}
                  </AnimatePresence>
                  
                  {/* Button glow on hover */}
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-blue-400/0 via-white/20 to-purple-400/0"
                    initial={{ x: '-100%' }}
                    whileHover={{ x: '100%' }}
                    transition={{ duration: 0.6 }}
                  />
                  
                  <span className="relative z-10">
                    {loading ? (
                      <span className="flex items-center justify-center gap-2">
                        <motion.span
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                          className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white/30 border-t-white rounded-full"
                        />
                        <span className="text-sm sm:text-base">Signing In...</span>
                      </span>
                    ) : (
                      'Sign In'
                    )}
                  </span>
                </Button>
              </form>
              
              {/* Divider */}
              <div className="mt-4 sm:mt-6">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-700" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-slate-900/50 px-2 text-slate-500 backdrop-blur-sm text-[10px] sm:text-xs">
                      Or continue with
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
                    w-full mt-3 sm:mt-4 h-10 sm:h-12
                    bg-slate-800/50 border-slate-700 text-slate-200 text-sm sm:text-base
                    hover:bg-slate-800 hover:border-slate-600
                    transition-all duration-200
                    hover:scale-[1.02] active:scale-[0.98]
                  "
                >
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-2" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  <span className="text-sm sm:text-base">Sign in with Google</span>
                </Button>
              </div>
              
              {/* Sign Up Link */}
              <div className="text-center mt-4 sm:mt-6">
                <p className="text-xs sm:text-sm text-slate-400">
                  Don&apos;t have an account?{' '}
                  <Link
                    href="/auth/signup"
                    className="text-blue-400 hover:text-blue-300 font-medium transition-colors duration-200 hover:underline"
                  >
                    Sign up
                  </Link>
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </div>
  );
}