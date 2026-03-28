'use client';

import { useEffect, useState, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import { 
  Calendar, Users, Shield, Clock, Sparkles, Bell, 
  Brain, Lock, Zap, Mail, Github, Linkedin, Twitter, Send, User, Building2, MessageSquare, Menu, X,
  ArrowRight, Check, ChevronRight, Star
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import Link from 'next/link';
import { CircleInLogo } from '@/components/ui';
import { FadeIn, StaggerContainer, StaggerItem, ScaleOnHover } from '@/components/ui/motion-wrapper';
import Script from 'next/script';

// Disable static generation for this page
export const dynamic = 'force-dynamic';

const features = [
  {
    icon: Calendar,
    title: 'Smart Booking System',
    description: 'Intuitive calendar interface with real-time availability, automated confirmations, and intelligent scheduling.',
    gradient: 'from-emerald-500 to-emerald-400',
    iconBg: 'bg-emerald-500/10',
    iconColor: 'text-emerald-500',
  },
  {
    icon: Users,
    title: 'Community Management',
    description: 'Manage residents, groups, and permissions with enterprise-grade role-based access control.',
    gradient: 'from-zinc-700 to-zinc-500',
    iconBg: 'bg-zinc-500/10',
    iconColor: 'text-zinc-600 dark:text-zinc-300',
  },
  {
    icon: Brain,
    title: 'AI-Powered Chatbot',
    description: 'Instant assistance with Gemini AI integration for booking help, FAQs, and community support.',
    gradient: 'from-zinc-800 to-emerald-600',
    iconBg: 'bg-zinc-500/10',
    iconColor: 'text-zinc-600 dark:text-zinc-300',
  },
  {
    icon: Lock,
    title: 'Enterprise Security',
    description: 'Bank-level encryption, secure access codes, and comprehensive audit trails for complete peace of mind.',
    gradient: 'from-emerald-500 to-teal-400',
    iconBg: 'bg-emerald-500/10',
    iconColor: 'text-emerald-500',
  },
  {
    icon: Zap,
    title: 'Real-time Updates',
    description: 'Live notifications, instant booking confirmations, and real-time availability across all devices.',
    gradient: 'from-amber-500 to-orange-400',
    iconBg: 'bg-amber-500/10',
    iconColor: 'text-amber-500',
  },
  {
    icon: Bell,
    title: 'Smart Reminders',
    description: 'Automated email reminders, check-in notifications, and intelligent booking management.',
    gradient: 'from-rose-500 to-red-400',
    iconBg: 'bg-rose-500/10',
    iconColor: 'text-rose-500',
  },
];

const team = [
  {
    name: 'Sai Abhinav Patel Sadineni',
    role: 'Lead Developer & Architect',
    description: 'Full-stack architect specializing in Next.js, React, and cloud infrastructure.',
    social: { github: '#', linkedin: '#', twitter: '#' }
  },
  {
    name: 'Shaik Azmath',
    role: 'Full Stack Developer',
    description: 'Expert in modern web technologies, API development, and database optimization.',
    social: { github: '#', linkedin: '#', twitter: '#' }
  },
  {
    name: 'Manohara Sai Chennakeshavula',
    role: 'Backend Developer',
    description: 'Specialized in Firebase, authentication systems, and scalable backend solutions.',
    social: { github: '#', linkedin: '#', twitter: '#' }
  },
];

// Premium Animated Background Component with section-aware living system
function PremiumBackground() {
  const { scrollYProgress } = useScroll();
  
  // Smooth parallax transforms
  const y1 = useTransform(scrollYProgress, [0, 1], ['0%', '-15%']);
  const y2 = useTransform(scrollYProgress, [0, 1], ['0%', '-25%']);
  const y3 = useTransform(scrollYProgress, [0, 1], ['0%', '-10%']);
  
  // Opacity based on scroll for depth
  const opacity1 = useTransform(scrollYProgress, [0, 0.3, 0.7, 1], [0.6, 0.4, 0.3, 0.2]);
  const opacity2 = useTransform(scrollYProgress, [0, 0.5, 1], [0.5, 0.3, 0.15]);
  
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden">
      {/* Base gradient - sophisticated neutral */}
      <div className="absolute inset-0 bg-gradient-to-b from-stone-50 via-white to-stone-100/60 dark:from-[#0c0c0d] dark:via-[#141416] dark:to-[#0c0c0d]" />
      
      {/* Primary gradient orb - hero area */}
      <motion.div 
        className="absolute -top-[20%] left-[10%] w-[min(800px,100vw)] h-[800px] rounded-full will-change-transform"
        style={{ 
          y: y1, 
          opacity: opacity1,
          background: 'radial-gradient(circle, rgba(16,185,129,0.15) 0%, rgba(16,185,129,0.08) 40%, transparent 70%)',
          filter: 'blur(80px)',
        }}
      />
      
      {/* Secondary gradient orb - mid section */}
      <motion.div 
        className="absolute top-[30%] -right-[10%] w-[min(700px,90vw)] h-[700px] rounded-full will-change-transform"
        style={{ 
          y: y2, 
          opacity: opacity2,
          background: 'radial-gradient(circle, rgba(24,24,27,0.12) 0%, rgba(24,24,27,0.06) 50%, transparent 70%)',
          filter: 'blur(100px)',
        }}
      />
      
      {/* Tertiary gradient orb - bottom section */}
      <motion.div 
        className="absolute bottom-[10%] left-[20%] w-[min(600px,80vw)] h-[600px] rounded-full will-change-transform"
        style={{ 
          y: y3,
          background: 'radial-gradient(circle, rgba(16,185,129,0.1) 0%, rgba(16,185,129,0.05) 50%, transparent 70%)',
          filter: 'blur(90px)',
        }}
      />
      
      {/* Subtle dot grid pattern */}
      <div 
        className="absolute inset-0 opacity-[0.4] dark:opacity-[0.15]"
        style={{
          backgroundImage: 'radial-gradient(rgba(24,24,27,0.35) 1px, transparent 1px)',
          backgroundSize: '32px 32px',
        }}
      />
      
      {/* Top vignette for header blend */}
      <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-white dark:from-[#0a0a0f] to-transparent" />
      
      {/* Bottom vignette */}
      <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-slate-50 dark:from-[#0a0a0f] to-transparent" />
    </div>
  );
}

// Premium Button Component with physical, tactile micro-interactions
function PremiumButton({ 
  children, 
  variant = 'primary',
  size = 'default',
  className = '',
  ...props 
}: { 
  children: React.ReactNode; 
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'default' | 'lg';
  className?: string;
  [key: string]: any;
}) {
  const [isHovered, setIsHovered] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  
  const baseClasses = "relative overflow-hidden font-semibold rounded-xl transition-all duration-200 ease-out focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-950 select-none";
  
  const variants = {
    primary: "bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 focus-visible:ring-slate-900 dark:focus-visible:ring-white shadow-lg shadow-black/15 dark:shadow-black/35",
    secondary: "bg-white dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 focus-visible:ring-slate-400 shadow-sm",
    ghost: "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 focus-visible:ring-slate-400"
  };
  
  const sizes = {
    default: "h-11 px-5 text-sm gap-2",
    lg: "h-12 sm:h-14 px-6 sm:px-8 text-base gap-2.5"
  };
  
  return (
      <motion.button
      className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => { setIsHovered(false); setIsPressed(false); }}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      animate={{ y: isPressed ? 1 : 0 }}
      transition={{ 
        type: 'spring', 
        stiffness: 500, 
        damping: 30,
        mass: 0.5
      }}
      {...props}
    >
      {/* Shine effect on hover */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full"
        animate={{ x: isHovered ? '200%' : '-100%' }}
        transition={{ duration: 0.5, ease: 'easeInOut' }}
      />
      
      {/* Content */}
      <span className="relative z-10 flex items-center justify-center gap-2">
        {children}
      </span>
    </motion.button>
  );
}

// Contact Form Component
function ContactForm() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus('idle');

    try {
      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: 'abhinav.sadineni@gmail.com',
          subject: `New Contact Form Submission from ${formData.name}`,
          message: `
Name: ${formData.name}
Email: ${formData.email}
Company/Community: ${formData.company || 'Not provided'}

Message:
${formData.message}
          `.trim(),
          senderName: formData.name,
          senderEmail: formData.email,
          senderRole: 'admin',
          communityName: formData.company || 'Landing Page Inquiry',
        }),
      });

      if (response.ok) {
        setSubmitStatus('success');
        setFormData({ name: '', email: '', company: '', message: '' });
      } else {
        setSubmitStatus('error');
      }
    } catch (error) {
      console.error('Form submission error:', error);
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClasses = "h-12 sm:h-14 bg-slate-50/50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 focus-visible:border-violet-600 dark:focus-visible:border-violet-400 focus-visible:ring-2 focus-visible:ring-violet-500/20 dark:focus-visible:ring-violet-300/20 transition-all duration-300 text-sm sm:text-base rounded-xl placeholder:text-slate-400 premium-input hover:border-slate-300 dark:hover:border-slate-600";

  return (
    <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
        {/* Name Field */}
        <div className="space-y-2">
          <Label htmlFor="name" className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
            <User className="w-4 h-4 text-violet-500" />
            <span>Full Name</span>
          </Label>
          <Input
            id="name"
            type="text"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="John Doe"
            className={inputClasses}
          />
        </div>

        {/* Email Field */}
        <div className="space-y-2">
          <Label htmlFor="email" className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
            <Mail className="w-4 h-4 text-violet-500 dark:text-violet-300" />
            <span>Email Address</span>
          </Label>
          <Input
            id="email"
            type="email"
            required
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            placeholder="john@company.com"
            className={inputClasses}
          />
        </div>
      </div>

      {/* Company Field */}
      <div className="space-y-2">
        <Label htmlFor="company" className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
          <Building2 className="w-4 h-4 text-violet-500" />
          <span>Company / Community Name</span>
        </Label>
        <Input
          id="company"
          type="text"
          value={formData.company}
          onChange={(e) => setFormData({ ...formData, company: e.target.value })}
          placeholder="Your Organization (Optional)"
          className={inputClasses}
        />
      </div>

      {/* Message Field */}
      <div className="space-y-2">
        <Label htmlFor="message" className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-violet-500" />
          <span>Your Message</span>
        </Label>
        <Textarea
          id="message"
          required
          value={formData.message}
          onChange={(e) => setFormData({ ...formData, message: e.target.value })}
          placeholder="Tell us about your community and how we can help..."
          rows={5}
          className="bg-slate-50/50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 focus-visible:border-violet-600 dark:focus-visible:border-violet-400 focus-visible:ring-2 focus-visible:ring-violet-500/20 dark:focus-visible:ring-violet-300/20 transition-all duration-300 resize-none text-sm sm:text-base rounded-xl placeholder:text-slate-400"
        />
      </div>

      {/* Submit Button */}
      <div className="pt-2">
        <motion.button
          type="submit"
          disabled={isSubmitting}
          className="w-full h-12 sm:h-14 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white text-sm sm:text-base font-semibold shadow-lg shadow-black/25 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl relative overflow-hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/30 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-900"
          whileHover={{ scale: 1.01, y: -1 }}
          whileTap={{ scale: 0.99, y: 0 }}
        >
          {isSubmitting ? (
            <span className="flex items-center justify-center gap-3 relative z-10">
              <motion.div 
                className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              />
              <span>Sending...</span>
            </span>
          ) : (
            <span className="flex items-center justify-center gap-3 relative z-10">
              <Send className="w-5 h-5" />
              <span>Send Message</span>
            </span>
          )}
        </motion.button>
      </div>

      {/* Status Messages */}
      <AnimatePresence mode="wait">
        {submitStatus === 'success' && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-4 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 rounded-xl flex items-center gap-3"
          >
            <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0">
              <Check className="w-5 h-5 text-white" />
            </div>
            <p className="text-emerald-700 dark:text-emerald-300 font-medium">
              Message sent successfully! We'll get back to you soon.
            </p>
          </motion.div>
        )}

        {submitStatus === 'error' && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-4 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 rounded-xl flex items-center gap-3"
          >
            <div className="w-8 h-8 rounded-full bg-red-500 flex items-center justify-center flex-shrink-0">
              <X className="w-5 h-5 text-white" />
            </div>
            <p className="text-red-700 dark:text-red-300 font-medium">
              Failed to send message. Please try again.
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </form>
  );
}

// Premium Feature Card with progressive disclosure and magnetic interaction
function FeatureCard({ feature, index }: { feature: typeof features[0], index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ 
        duration: 0.4, 
        delay: index * 0.05,
        ease: [0.25, 0.1, 0.25, 1]
      }}
      whileHover={{ y: -4 }}
      className="group"
    >
      {/* Card - single clean hover state */}
      <div className="relative h-full p-6 rounded-2xl bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 transition-all duration-200 group-hover:border-slate-300 dark:group-hover:border-slate-600 group-hover:shadow-lg group-hover:shadow-black/10 dark:group-hover:shadow-black/25">
        
        {/* Icon */}
        <div className={`w-11 h-11 rounded-lg ${feature.iconBg} flex items-center justify-center mb-4`}>
          <feature.icon className={`w-5 h-5 ${feature.iconColor}`} strokeWidth={2} />
        </div>
        
        {/* Content */}
        <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-2">
          {feature.title}
        </h3>
        <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
          {feature.description}
        </p>
      </div>
    </motion.div>
  );
}

// Team Member Card with clean, professional interactions
function TeamMemberCard({ member, index }: { member: typeof team[0], index: number }) {
  const [isHovered, setIsHovered] = useState(false);
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ 
        duration: 0.5, 
        delay: index * 0.1,
        ease: [0.25, 0.1, 0.25, 1]
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <motion.div 
        className="group relative h-full"
        animate={{ y: isHovered ? -4 : 0 }}
        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      >
        <div className="relative h-full p-6 sm:p-8 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 transition-all duration-300 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-xl hover:shadow-black/10 dark:hover:shadow-black/35 text-center">
          
          {/* Avatar */}
          <div className="w-20 h-20 mx-auto mb-5 relative">
            <div className="w-full h-full rounded-full bg-slate-900 dark:bg-slate-100 flex items-center justify-center shadow-lg">
              <span className="text-xl font-bold text-white dark:text-slate-900">
                {member.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
              </span>
            </div>
          </div>
          
          {/* Content */}
          <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-1 tracking-tight">
            {member.name}
          </h3>
          <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400 mb-3">
            {member.role}
          </p>
          <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed mb-5">
            {member.description}
          </p>
          
          {/* Social Links */}
          <div className="flex justify-center gap-2">
            {[
              { icon: Github, href: member.social.github, label: 'GitHub' },
              { icon: Linkedin, href: member.social.linkedin, label: 'LinkedIn' },
              { icon: Twitter, href: member.social.twitter, label: 'Twitter' },
            ].map((social, i) => (
              <motion.a
                key={i}
                href={social.href}
                aria-label={social.label}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-slate-700 dark:hover:text-slate-200 transition-colors duration-200"
              >
                <social.icon className="w-4 h-4" />
              </motion.a>
            ))}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function LandingPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { scrollY } = useScroll();
  const headerOpacity = useTransform(scrollY, [0, 100], [0, 1]);

  useEffect(() => {
    if (status === 'authenticated' && session) {
      router.replace('/dashboard');
    }
  }, [session, status, router]);

  // Show loading state while checking authentication - return null so the global loader handles it
  if (status === 'loading') {
    return null;
  }

  // Show loading state during redirect for authenticated users
  if (status === 'authenticated') {
    return null;
  }

  // Only unauthenticated users see the landing page

  return (
    <>
      {/* Structured Data for SEO */}
      <Script
        id="structured-data"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@graph': [
              {
                '@type': 'SoftwareApplication',
                name: 'CircleIn',
                applicationCategory: 'BusinessApplication',
                operatingSystem: 'Web',
                offers: {
                  '@type': 'Offer',
                  price: '0',
                  priceCurrency: 'USD',
                },
                description: 'Modern community management platform with smart booking and AI assistance.',
              },
              {
                '@type': 'Organization',
                name: 'CircleIn',
                url: 'https://circlein-app.vercel.app',
                logo: 'https://circlein-app.vercel.app/logo.png',
                contactPoint: {
                  '@type': 'ContactPoint',
                  email: 'abhinav.sadineni@gmail.com',
                  contactType: 'Customer Service',
                },
              },
            ],
          }),
        }}
      />

      <div className="relative min-h-screen">
        {/* Premium Background */}
        <PremiumBackground />

        {/* Header */}
        <header className="fixed top-0 left-0 right-0 z-50">
          {/* Backdrop blur layer */}
          <motion.div 
            className="absolute inset-0 bg-white/70 dark:bg-slate-950/70 backdrop-blur-xl border-b border-slate-200/50 dark:border-slate-800/50"
            style={{ opacity: headerOpacity }}
          />
          
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16 md:h-20">
              {/* Logo */}
              <Link href="/" className="flex items-center gap-3 group">
                <motion.div
                  whileHover={{ rotate: 10 }}
                  transition={{ type: "spring", stiffness: 400, damping: 17 }}
                >
                  <CircleInLogo className="w-9 h-9 md:w-10 md:h-10" />
                </motion.div>
                <span className="text-xl md:text-2xl font-bold text-slate-900 dark:text-slate-100">
                  CircleIn
                </span>
              </Link>
              
              {/* Desktop Navigation */}
              <nav className="hidden md:flex items-center gap-2">
                <Link href="/auth/signin">
                  <Button 
                    variant="ghost" 
                    className="text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/80 dark:hover:bg-slate-800/80 font-medium px-5 h-10 rounded-xl transition-all duration-300"
                  >
                    Sign In
                  </Button>
                </Link>
                <Link href="/auth/signup">
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Button className="bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-white text-white dark:text-slate-900 shadow-lg shadow-black/15 font-medium px-6 h-10 rounded-xl transition-all duration-300">
                      Get Started
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </motion.div>
                </Link>
              </nav>

              {/* Mobile Menu Button */}
              <motion.button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                whileTap={{ scale: 0.95 }}
                className="md:hidden relative z-50 p-2.5 rounded-xl bg-slate-100/80 dark:bg-slate-800/80 hover:bg-slate-200/80 dark:hover:bg-slate-700/80 transition-colors"
                aria-label="Toggle menu"
              >
                <AnimatePresence mode="wait">
                  {mobileMenuOpen ? (
                    <motion.div
                      key="close"
                      initial={{ rotate: -90, opacity: 0 }}
                      animate={{ rotate: 0, opacity: 1 }}
                      exit={{ rotate: 90, opacity: 0 }}
                      transition={{ duration: 0.15 }}
                    >
                      <X className="w-5 h-5 text-slate-700 dark:text-slate-200" />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="menu"
                      initial={{ rotate: 90, opacity: 0 }}
                      animate={{ rotate: 0, opacity: 1 }}
                      exit={{ rotate: -90, opacity: 0 }}
                      transition={{ duration: 0.15 }}
                    >
                      <Menu className="w-5 h-5 text-slate-700 dark:text-slate-200" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.button>
            </div>
          </div>
        </header>

        {/* Mobile Navigation Overlay - Full Screen */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <>
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="md:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
                onClick={() => setMobileMenuOpen(false)}
              />
              
              {/* Menu Panel */}
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
                className="md:hidden fixed top-20 left-4 right-4 z-50 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl shadow-black/20 border border-slate-200 dark:border-slate-800 overflow-hidden"
              >
                <div className="p-4 space-y-3">
                  <Link href="/auth/signin" className="block" onClick={() => setMobileMenuOpen(false)}>
                    <Button variant="ghost" className="w-full justify-center text-base font-medium h-12 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800">
                      Sign In
                    </Button>
                  </Link>
                  <Link href="/auth/signup" className="block" onClick={() => setMobileMenuOpen(false)}>
                    <Button className="w-full bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-white text-white dark:text-slate-900 h-12 rounded-xl font-medium">
                      Get Started
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </Link>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Hero Section */}
        <section className="relative pt-28 sm:pt-32 md:pt-40 lg:pt-48 pb-16 md:pb-24 lg:pb-32 px-4 sm:px-6">
          <div className="max-w-6xl mx-auto">
            <div className="text-center">
              {/* Badge - honest status */}
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200/70 dark:border-emerald-800/50 mb-6 md:mb-8"
              >
                <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
                  Now available for communities
                </span>
              </motion.div>
              
              {/* Headline - confident, clear value */}
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="text-[2.5rem] sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-slate-900 dark:text-white mb-5 md:mb-6 leading-[1.1]"
              >
                The modern way to
                <br />
                <span className="bg-gradient-to-r from-slate-900 to-emerald-600 dark:from-slate-100 dark:to-emerald-400 bg-clip-text text-transparent">
                  manage communities
                </span>
              </motion.h1>
              
              {/* Subheadline - benefit-focused */}
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="text-lg md:text-xl text-slate-600 dark:text-slate-400 mb-8 md:mb-10 max-w-xl mx-auto leading-relaxed"
              >
                Streamline bookings, automate operations, and delight residents with one powerful platform.
              </motion.p>
              
              {/* CTAs - clear hierarchy */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center mb-12 md:mb-16"
              >
                <Link href="/auth/signup" className="w-full sm:w-auto">
                  <PremiumButton variant="primary" size="lg" className="w-full sm:w-auto">
                    Get started free
                    <ArrowRight className="w-4 h-4" />
                  </PremiumButton>
                </Link>
                <Link href="/auth/signin" className="w-full sm:w-auto">
                  <PremiumButton variant="secondary" size="lg" className="w-full sm:w-auto">
                    Watch demo
                  </PremiumButton>
                </Link>
              </motion.div>

              {/* Quick facts - honest, verifiable */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.5 }}
                className="flex flex-wrap justify-center gap-x-6 sm:gap-x-10 gap-y-3 text-sm"
              >
                {[
                  { icon: '✓', label: 'Free to start' },
                  { icon: '✓', label: 'No credit card required' },
                  { icon: '✓', label: 'Setup in minutes' },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                    <span className="text-emerald-500 font-medium">{item.icon}</span>
                    <span>{item.label}</span>
                  </div>
                ))}
              </motion.div>
            </div>
          </div>
        </section>

        {/* Section Divider */}
        <div className="relative h-px max-w-4xl mx-auto">
          <div className="section-divider w-full" />
        </div>

        {/* Features Section */}
        <section className="relative py-16 md:py-24 lg:py-32 px-4 sm:px-6">
          <div className="max-w-6xl mx-auto">
            {/* Section Header */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.5 }}
              className="text-center mb-12 md:mb-16"
            >
              <span className="inline-block text-sm font-semibold not-italic text-emerald-600 dark:text-emerald-400 mb-3 tracking-wide uppercase">
                Features
              </span>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold not-italic tracking-tight text-slate-900 dark:text-white mb-4">
                Everything you need
              </h2>
              <p className="text-lg not-italic text-slate-600 dark:text-slate-400 max-w-lg mx-auto">
                Powerful tools to manage your community efficiently and intelligently.
              </p>
            </motion.div>

            {/* Features Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-6">
              {features.map((feature, index) => (
                <FeatureCard key={feature.title} feature={feature} index={index} />
              ))}
            </div>
          </div>
        </section>

        {/* Section Divider */}
        <div className="relative h-px max-w-4xl mx-auto">
          <div className="section-divider w-full" />
        </div>

        {/* CTA Section */}
        <section className="relative py-12 sm:py-16 md:py-24 px-4 sm:px-6">
          <div className="max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5 }}
                className="relative rounded-2xl md:rounded-3xl overflow-hidden border border-violet-200/20 bg-gradient-to-br from-[#130b2f] via-[#2a1360] to-[#6d28d9]"
            >
              {/* Premium layered glow */}
              <div className="absolute -top-20 -left-16 w-72 h-72 rounded-full bg-violet-400/30 blur-3xl" />
              <div className="absolute -bottom-24 -right-12 w-80 h-80 rounded-full bg-fuchsia-400/30 blur-3xl" />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(255,255,255,0.18),transparent_45%),radial-gradient(circle_at_80%_80%,rgba(255,255,255,0.12),transparent_40%)]" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
              
              {/* Content */}
              <div className="relative px-4 py-8 sm:px-8 sm:py-10 md:px-12 md:py-14 text-center">
                <h2 className="text-[1.75rem] sm:text-3xl md:text-4xl font-bold text-white mb-3 sm:mb-4 tracking-tight leading-tight">
                  Ready to get started?
                </h2>
                <p className="text-sm sm:text-base md:text-lg text-violet-100 mb-6 sm:mb-7 md:mb-8 max-w-xl mx-auto leading-relaxed">
                  Transform how your community manages amenities. Free to try, easy to set up.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
                  <Link href="/auth/signup" className="w-full sm:w-auto">
                    <motion.button
                      className="w-full sm:w-auto sm:min-w-[220px] bg-white text-violet-900 px-6 h-11 sm:h-12 rounded-xl text-sm sm:text-base font-semibold hover:bg-violet-50 transition-colors duration-200"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <span className="flex items-center justify-center gap-2">
                        Get started free
                        <ArrowRight className="w-4 h-4" />
                      </span>
                    </motion.button>
                  </Link>
                  <Link href="/auth/signin" className="w-full sm:w-auto">
                    <motion.button
                      className="w-full sm:w-auto sm:min-w-[220px] text-white border border-violet-200/50 px-6 h-11 sm:h-12 rounded-xl text-sm sm:text-base font-semibold hover:bg-white/10 transition-colors duration-200"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      Learn more
                    </motion.button>
                  </Link>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Section Divider */}
        <div className="relative h-px max-w-4xl mx-auto">
          <div className="section-divider w-full" />
        </div>

        {/* Team Section */}
        <section className="relative py-16 md:py-24 lg:py-32 px-4 sm:px-6">
          <div className="max-w-6xl mx-auto">
            {/* Section Header */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.5 }}
              className="text-center mb-12 md:mb-16"
            >
              <span className="inline-block text-sm font-semibold not-italic text-emerald-600 dark:text-emerald-400 mb-3 tracking-wide uppercase">
                Our Team
              </span>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold not-italic tracking-tight text-slate-900 dark:text-white mb-4">
                Meet the team
              </h2>
              <p className="text-lg not-italic text-slate-600 dark:text-slate-400 max-w-lg mx-auto">
                Passionate developers building exceptional community solutions.
              </p>
            </motion.div>

            {/* Team Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-6">
              {team.map((member, index) => (
                <TeamMemberCard key={member.name} member={member} index={index} />
              ))}
            </div>
          </div>
        </section>

        {/* Section Divider */}
        <div className="relative h-px max-w-4xl mx-auto">
          <div className="section-divider w-full" />
        </div>

        {/* Contact Section */}
        <section className="relative py-12 sm:py-16 md:py-24 px-4 sm:px-6">
          <div className="max-w-2xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.5 }}
            >
              <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/60 shadow-xl shadow-black/10 dark:shadow-black/35 p-5 sm:p-6 md:p-9 lg:p-10">
                {/* Header */}
                <div className="text-center mb-6 sm:mb-8">
                  <div className="w-11 h-11 sm:w-12 sm:h-12 mx-auto mb-4 rounded-xl bg-gradient-to-br from-violet-600 to-fuchsia-600 flex items-center justify-center shadow-lg shadow-black/25">
                    <Mail className="w-6 h-6 text-white dark:text-white" />
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mb-2 tracking-tight">
                    Get in touch
                  </h2>
                  <p className="text-slate-600 dark:text-slate-400">
                    Interested in using CircleIn for your community? Let us know.
                  </p>
                </div>
                
                {/* Form */}
                <ContactForm />
              </div>
            </motion.div>
          </div>
        </section>

        {/* Footer */}
        <footer className="relative border-t border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-950/80">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 md:py-12">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 lg:gap-12 mb-10">
              {/* Brand Column */}
              <div className="col-span-2 md:col-span-1">
                <div className="flex items-center gap-2 mb-3">
                  <CircleInLogo className="w-7 h-7" />
                  <span className="text-lg font-bold text-slate-900 dark:text-white">
                    CircleIn
                  </span>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  Modern community management for residential living.
                </p>
              </div>
              
              {/* Product Links */}
              <div>
                <h3 className="font-semibold text-slate-900 dark:text-white mb-3 text-sm">
                  Product
                </h3>
                <ul className="space-y-2.5 text-sm">
                  {['Features', 'Pricing', 'Security'].map((item) => (
                    <li key={item}>
                      <Link 
                        href="/auth/signup" 
                        className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                      >
                        {item}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
              
              {/* Company Links */}
              <div>
                <h3 className="font-semibold text-slate-900 dark:text-white mb-3 text-sm">
                  Company
                </h3>
                <ul className="space-y-2.5 text-sm">
                  {['About', 'Contact', 'Careers'].map((item) => (
                    <li key={item}>
                      <Link 
                        href="/auth/signup" 
                        className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                      >
                        {item}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
              
              {/* Legal Links */}
              <div>
                <h3 className="font-semibold text-slate-900 dark:text-white mb-3 text-sm">
                  Legal
                </h3>
                <ul className="space-y-2.5 text-sm">
                  <li>
                    <Link 
                      href="/privacy" 
                      className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                    >
                      Privacy
                    </Link>
                  </li>
                  <li>
                    <Link 
                      href="/terms" 
                      className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                    >
                      Terms
                    </Link>
                  </li>
                  <li>
                    <Link 
                      href="/security" 
                      className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                    >
                      Security
                    </Link>
                  </li>
                </ul>
              </div>
            </div>
            
            {/* Bottom Bar */}
            <div className="pt-8 border-t border-slate-200 dark:border-slate-800">
              <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <p className="text-sm text-slate-500 dark:text-slate-400 text-center md:text-left">
                  © 2026 CircleIn. All rights reserved.
                </p>
                <div className="flex items-center gap-2">
                  {[
                    { Icon: Github, label: 'GitHub' },
                    { Icon: Linkedin, label: 'LinkedIn' },
                    { Icon: Twitter, label: 'Twitter' }
                  ].map(({ Icon, label }, i) => (
                    <motion.a
                      key={i}
                      href="#"
                      aria-label={label}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="w-9 h-9 rounded-lg flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                      <Icon className="w-4 h-4" />
                    </motion.a>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}