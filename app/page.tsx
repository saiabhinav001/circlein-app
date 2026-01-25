'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar, Users, Bell, 
  Brain, Lock, Zap, Mail, Github, Linkedin, Twitter, Send, User, Building2, Menu, X,
  ArrowRight, Sparkles, MessageSquare, Check
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import Link from 'next/link';
import Script from 'next/script';
import { CircleInLogo } from '@/components/ui';

// Disable static generation for this page
export const dynamic = 'force-dynamic';

const features = [
  {
    icon: Calendar,
    title: 'Smart Booking System',
    description: 'Intuitive calendar interface with real-time availability, automated confirmations, and intelligent scheduling.',
    gradient: 'from-blue-500 to-cyan-400',
    iconBg: 'bg-blue-500/10',
    iconColor: 'text-blue-500',
  },
  {
    icon: Users,
    title: 'Community Management',
    description: 'Manage residents, groups, and permissions with enterprise-grade role-based access control.',
    gradient: 'from-violet-500 to-purple-400',
    iconBg: 'bg-violet-500/10',
    iconColor: 'text-violet-500',
  },
  {
    icon: Brain,
    title: 'AI-Powered Chatbot',
    description: 'Instant assistance with Gemini AI integration for booking help, FAQs, and community support.',
    gradient: 'from-fuchsia-500 to-pink-400',
    iconBg: 'bg-fuchsia-500/10',
    iconColor: 'text-fuchsia-500',
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

// Simple, performant background
function PremiumBackground() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      {/* Base gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950" />
      
      {/* Primary gradient orb */}
      <div 
        className="absolute -top-[30%] -left-[10%] w-[60vw] max-w-[600px] aspect-square rounded-full opacity-60 dark:opacity-30"
        style={{ 
          background: 'radial-gradient(circle, rgba(99,102,241,0.2) 0%, transparent 70%)',
          filter: 'blur(60px)',
        }}
      />
      
      {/* Secondary gradient orb */}
      <div 
        className="absolute top-[40%] -right-[10%] w-[50vw] max-w-[500px] aspect-square rounded-full opacity-50 dark:opacity-20"
        style={{ 
          background: 'radial-gradient(circle, rgba(168,85,247,0.15) 0%, transparent 70%)',
          filter: 'blur(80px)',
        }}
      />
      
      {/* Dot grid */}
      <div 
        className="absolute inset-0 opacity-30 dark:opacity-10"
        style={{
          backgroundImage: 'radial-gradient(circle, rgba(100,100,100,0.3) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      />
    </div>
  );
}

// Simple, performant button
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
  const baseClasses = "font-semibold rounded-xl transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 active:scale-[0.98]";
  
  const variants = {
    primary: "bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 shadow-sm",
    secondary: "bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700",
    ghost: "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
  };
  
  const sizes = {
    default: "h-11 px-5 text-sm",
    lg: "h-12 px-6 text-base"
  };
  
  return (
    <button
      className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${className} flex items-center justify-center gap-2`}
      {...props}
    >
      {children}
    </button>
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

  const inputClasses = "h-14 bg-slate-50/50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 focus-visible:border-indigo-500 dark:focus-visible:border-indigo-400 focus-visible:ring-2 focus-visible:ring-indigo-500/20 transition-all duration-300 text-base rounded-xl placeholder:text-slate-400 premium-input hover:border-slate-300 dark:hover:border-slate-600";

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Name Field */}
        <div className="space-y-2">
          <Label htmlFor="name" className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
            <User className="w-4 h-4 text-indigo-500" />
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
            <Mail className="w-4 h-4 text-violet-500" />
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
          <Building2 className="w-4 h-4 text-fuchsia-500" />
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
          <MessageSquare className="w-4 h-4 text-cyan-500" />
          <span>Your Message</span>
        </Label>
        <Textarea
          id="message"
          required
          value={formData.message}
          onChange={(e) => setFormData({ ...formData, message: e.target.value })}
          placeholder="Tell us about your community and how we can help..."
          rows={5}
          className="bg-slate-50/50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 focus-visible:border-indigo-500 dark:focus-visible:border-indigo-400 focus-visible:ring-2 focus-visible:ring-indigo-500/20 transition-all duration-300 resize-none text-base rounded-xl placeholder:text-slate-400"
        />
      </div>

      {/* Submit Button */}
      <div className="pt-2">
        <motion.button
          type="submit"
          disabled={isSubmitting}
          className="w-full h-14 bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-600 hover:from-indigo-500 hover:via-violet-500 hover:to-fuchsia-500 text-white text-base font-semibold shadow-lg shadow-indigo-500/25 hover:shadow-xl hover:shadow-indigo-500/35 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl btn-shine premium-btn-glow relative overflow-hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
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
      <div className="relative h-full p-6 rounded-2xl bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 transition-all duration-200 group-hover:border-slate-300 dark:group-hover:border-slate-600 group-hover:shadow-lg group-hover:shadow-slate-900/5 dark:group-hover:shadow-black/20">
        
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

// Team Member Card - simplified
function TeamMemberCard({ member, index }: { member: typeof team[0], index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.4, delay: index * 0.08 }}
      className="group"
    >
      <div className="h-full p-6 rounded-2xl bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 transition-all duration-200 hover:shadow-lg hover:shadow-slate-900/5 dark:hover:shadow-black/20 hover:-translate-y-1 text-center">
        
        {/* Avatar */}
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
          <span className="text-lg font-bold text-white">
            {member.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
          </span>
        </div>
        
        {/* Content */}
        <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-1">
          {member.name}
        </h3>
        <p className="text-sm font-medium text-indigo-600 dark:text-indigo-400 mb-2">
          {member.role}
        </p>
        <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed mb-4">
          {member.description}
        </p>
        
        {/* Social Links */}
        <div className="flex justify-center gap-2">
          {[
            { icon: Github, href: member.social.github, label: 'GitHub' },
            { icon: Linkedin, href: member.social.linkedin, label: 'LinkedIn' },
            { icon: Twitter, href: member.social.twitter, label: 'Twitter' },
          ].map((social, i) => (
            <a
              key={i}
              href={social.href}
              aria-label={social.label}
              className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-700/50 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600 hover:text-slate-700 dark:hover:text-white transition-colors"
            >
              <social.icon className="w-4 h-4" />
            </a>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

export default function LandingPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    if (status === 'authenticated' && session) {
      router.replace('/dashboard');
    }
  }, [session, status, router]);

  // Simple scroll detection for header
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Show loading state while checking authentication - return null to let LoadingScreen handle it
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
      {/* Structured Data for SEO - honest, no fake ratings */}
      <Script
        id="structured-data"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'SoftwareApplication',
            name: 'CircleIn',
            applicationCategory: 'BusinessApplication',
            operatingSystem: 'Web',
            offers: {
              '@type': 'Offer',
              price: '0',
              priceCurrency: 'USD',
            },
            description: 'Community management platform with smart booking and real-time notifications.',
          }),
        }}
      />

      <div className="relative min-h-screen">
        {/* Premium Background */}
        <PremiumBackground />

        {/* Header */}
        <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-200 ${scrolled ? 'bg-white/80 dark:bg-slate-950/80 backdrop-blur-lg border-b border-slate-200/50 dark:border-slate-800/50' : ''}`}>
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="flex items-center justify-between h-16">
              {/* Logo */}
              <Link href="/" className="flex items-center gap-2">
                <CircleInLogo className="w-8 h-8" />
                <span className="text-xl font-bold text-indigo-600 dark:text-indigo-400">
                  CircleIn
                </span>
              </Link>
              
              {/* Desktop Navigation */}
              <nav className="hidden md:flex items-center gap-3">
                <Link href="/auth/signin">
                  <Button 
                    variant="ghost" 
                    className="text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white font-medium px-4 h-10 rounded-lg"
                  >
                    Sign In
                  </Button>
                </Link>
                <Link href="/auth/signup">
                  <Button className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-5 h-10 rounded-lg">
                    Get Started
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </nav>

              {/* Mobile Menu Button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                aria-label="Toggle menu"
              >
                {mobileMenuOpen ? (
                  <X className="w-5 h-5 text-slate-700 dark:text-slate-200" />
                ) : (
                  <Menu className="w-5 h-5 text-slate-700 dark:text-slate-200" />
                )}
              </button>
            </div>
          </div>
        </header>

        {/* Mobile Navigation Overlay */}
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
                    <Button className="w-full bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-600 hover:from-indigo-500 hover:via-violet-500 hover:to-fuchsia-500 text-white h-12 rounded-xl font-medium">
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
                className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200/50 dark:border-indigo-800/50 mb-6 md:mb-8"
              >
                <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span className="text-sm font-medium text-indigo-700 dark:text-indigo-300">
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
                <span className="bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 bg-clip-text text-transparent">
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
              <span className="inline-block text-sm font-semibold not-italic text-indigo-600 dark:text-indigo-400 mb-3 tracking-wide uppercase">
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
        <section className="relative py-16 md:py-24 px-4 sm:px-6">
          <div className="max-w-3xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5 }}
              className="relative rounded-2xl md:rounded-3xl overflow-hidden bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-700"
            >
              {/* Subtle overlay for depth */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent" />
              
              {/* Content */}
              <div className="relative px-6 py-12 md:px-12 md:py-16 text-center">
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-4 tracking-tight">
                  Ready to get started?
                </h2>
                <p className="text-base md:text-lg text-white/90 mb-8 max-w-md mx-auto">
                  Transform how your community manages amenities. Free to try, easy to set up.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Link href="/auth/signup">
                    <motion.button
                      className="w-full sm:w-auto bg-white text-indigo-700 px-6 h-12 rounded-xl font-semibold hover:bg-indigo-50 transition-colors duration-200"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <span className="flex items-center justify-center gap-2">
                        Get started free
                        <ArrowRight className="w-4 h-4" />
                      </span>
                    </motion.button>
                  </Link>
                  <Link href="/auth/signin">
                    <motion.button
                      className="w-full sm:w-auto text-white border border-white/30 px-6 h-12 rounded-xl font-semibold hover:bg-white/10 transition-colors duration-200"
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
              <span className="inline-block text-sm font-semibold not-italic text-indigo-600 dark:text-indigo-400 mb-3 tracking-wide uppercase">
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
        <section className="relative py-16 md:py-24 px-4 sm:px-6">
          <div className="max-w-xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.5 }}
            >
              <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 shadow-xl shadow-slate-200/50 dark:shadow-slate-900/50 p-6 md:p-10">
                {/* Header */}
                <div className="text-center mb-8">
                  <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center">
                    <Mail className="w-6 h-6 text-white" />
                  </div>
                  <h2 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white mb-2 tracking-tight">
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