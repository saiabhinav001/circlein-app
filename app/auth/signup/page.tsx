'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, User, Key, Eye, EyeOff, CheckCircle2, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import Link from 'next/link';

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
  const [ripplePosition, setRipplePosition] = useState({ x: 0, y: 0 });
  const [showRipple, setShowRipple] = useState(false);
  const router = useRouter();

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

  const handleButtonClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setRipplePosition({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
    setShowRipple(true);
    setTimeout(() => setShowRipple(false), 600);
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
      // First, try to sign up with credentials provider
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
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center p-4">
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
            Join CircleIn
          </motion.h1>
          
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="text-slate-400 text-sm sm:text-base md:text-lg"
          >
            Create your account to start booking amenities
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
              <CardTitle className="text-xl sm:text-2xl text-white">Create Account</CardTitle>
              <CardDescription className="text-slate-400 text-xs sm:text-sm">
                Fill in your details to get started
              </CardDescription>
            </CardHeader>
            
            <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
              <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
                {/* Access Code Field */}
                <div className="space-y-2">
                  <Label htmlFor="accessCode" className="text-slate-200 text-xs sm:text-sm">Access Code *</Label>
                  <div className="relative group">
                    <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-500 group-focus-within:text-amber-400 transition-colors duration-200" />
                    <Input
                      id="accessCode"
                      name="accessCode"
                      type="text"
                      value={formData.accessCode}
                      onChange={handleChange}
                      onFocus={() => setFocusedField('accessCode')}
                      onBlur={() => setFocusedField(null)}
                      placeholder="Enter your unique access code"
                      className={`
                        pl-9 sm:pl-10 h-10 sm:h-12 bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500 text-sm sm:text-base
                        transition-all duration-300 ease-out
                        ${focusedField === 'accessCode' 
                          ? 'ring-2 ring-amber-500/50 border-transparent shadow-lg shadow-amber-500/20' 
                          : 'hover:border-slate-600'
                        }
                      `}
                      required
                    />
                  </div>
                  <p className="text-[10px] sm:text-xs text-slate-500">
                    This code was provided by your community administrator
                  </p>
                </div>
                
                {/* Name Field */}
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-slate-200 text-xs sm:text-sm">Full Name</Label>
                  <div className="relative group">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-500 group-focus-within:text-green-400 transition-colors duration-200" />
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
                        pl-9 sm:pl-10 h-10 sm:h-12 bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500 text-sm sm:text-base
                        transition-all duration-300 ease-out
                        ${focusedField === 'name' 
                          ? 'ring-2 ring-green-500/50 border-transparent shadow-lg shadow-green-500/20' 
                          : 'hover:border-slate-600'
                        }
                      `}
                      required
                    />
                  </div>
                </div>
                
                {/* Email Field */}
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-slate-200 text-xs sm:text-sm">Email</Label>
                  <div className="relative group">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-500 group-focus-within:text-blue-400 transition-colors duration-200" />
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
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
                          className="absolute right-3 top-1/2 transform -translate-y-1/2"
                        >
                          <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-green-400" />
                        </motion.div>
                      )}
                      {emailValid === false && (
                        <motion.div
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 0, opacity: 0 }}
                          transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2"
                        >
                          <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-red-400" />
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
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={handlePasswordChange}
                      onFocus={() => setFocusedField('password')}
                      onBlur={() => setFocusedField(null)}
                      placeholder="Create a password"
                      className={`
                        pl-9 sm:pl-10 pr-9 sm:pr-10 h-10 sm:h-12 bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500 text-sm sm:text-base
                        transition-all duration-300 ease-out
                        ${focusedField === 'password' 
                          ? 'ring-2 ring-purple-500/50 border-transparent shadow-lg shadow-purple-500/20' 
                          : 'hover:border-slate-600'
                        }
                      `}
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-0 top-0 h-full px-2 sm:px-3 hover:bg-transparent text-slate-400 hover:text-slate-200"
                    >
                      {showPassword ? (
                        <EyeOff className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      ) : (
                        <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      )}
                    </Button>
                  </div>
                </div>
                
                {/* Confirm Password Field */}
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-slate-200 text-xs sm:text-sm">Confirm Password</Label>
                  <div className="relative group">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-500 group-focus-within:text-purple-400 transition-colors duration-200" />
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
                        pl-9 sm:pl-10 pr-9 sm:pr-10 h-10 sm:h-12 bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500 text-sm sm:text-base
                        transition-all duration-300 ease-out
                        ${focusedField === 'confirmPassword' 
                          ? 'ring-2 ring-purple-500/50 border-transparent shadow-lg shadow-purple-500/20' 
                          : 'hover:border-slate-600'
                        }
                      `}
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-10 top-0 h-full px-2 sm:px-3 hover:bg-transparent text-slate-400 hover:text-slate-200"
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      ) : (
                        <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      )}
                    </Button>
                    {/* Password Match Indicator */}
                    <AnimatePresence>
                      {passwordsMatch === true && (
                        <motion.div
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 0, opacity: 0 }}
                          transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2"
                        >
                          <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-green-400" />
                        </motion.div>
                      )}
                      {passwordsMatch === false && (
                        <motion.div
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 0, opacity: 0 }}
                          transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2"
                        >
                          <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-red-400" />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
                
                {/* Submit Button with Ripple Effect */}
                <Button
                  type="submit"
                  disabled={loading}
                  onClick={handleButtonClick}
                  className="
                    w-full h-10 sm:h-12 relative overflow-hidden mt-4 sm:mt-6
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
                        <span className="text-sm sm:text-base">Creating Account...</span>
                      </span>
                    ) : (
                      'Create Account'
                    )}
                  </span>
                </Button>
              </form>
              
              {/* Sign In Link */}
              <div className="text-center mt-4 sm:mt-6">
                <p className="text-xs sm:text-sm text-slate-400">
                  Already have an account?{' '}
                  <Link
                    href="/auth/signin"
                    className="text-blue-400 hover:text-blue-300 font-medium transition-colors duration-200 hover:underline"
                  >
                    Sign in
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