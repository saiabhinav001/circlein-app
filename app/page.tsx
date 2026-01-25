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

const stats = [
  { label: 'Features', value: '20+' },
  { label: 'Amenities', value: 'Unlimited' },
  { label: 'Uptime', value: '99.9%' },
  { label: 'Real-time', value: 'Sync' },
];

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

// Premium Animated Background Component with scroll-reactive effects
function PremiumBackground() {
  const { scrollY } = useScroll();
  const y1 = useTransform(scrollY, [0, 1000], [0, -100]);
  const y2 = useTransform(scrollY, [0, 1000], [0, -150]);
  const y3 = useTransform(scrollY, [0, 1000], [0, -200]);
  const opacity1 = useTransform(scrollY, [0, 500], [0.2, 0.1]);
  const opacity2 = useTransform(scrollY, [0, 500], [0.15, 0.08]);
  
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden">
      {/* Base gradient with subtle noise */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950" />
      
      {/* Mesh gradient overlay */}
      <div className="absolute inset-0 hero-gradient-mesh" />
      
      {/* Animated gradient orbs with parallax */}
      <motion.div 
        className="absolute top-0 left-1/4 w-[700px] h-[700px] rounded-full bg-gradient-to-br from-blue-400/20 to-violet-400/20 dark:from-blue-600/10 dark:to-violet-600/10 blur-[120px] animate-blob will-change-transform" 
        style={{ y: y1, opacity: opacity1 }}
      />
      <motion.div 
        className="absolute top-1/3 right-1/4 w-[600px] h-[600px] rounded-full bg-gradient-to-br from-violet-400/18 to-fuchsia-400/18 dark:from-violet-600/8 dark:to-fuchsia-600/8 blur-[120px] animate-blob animation-delay-2000 will-change-transform" 
        style={{ y: y2, opacity: opacity2 }}
      />
      <motion.div 
        className="absolute bottom-0 left-1/3 w-[650px] h-[650px] rounded-full bg-gradient-to-br from-cyan-400/15 to-blue-400/15 dark:from-cyan-600/6 dark:to-blue-600/6 blur-[120px] animate-blob animation-delay-4000 will-change-transform" 
        style={{ y: y3 }}
      />
      
      {/* Aurora effect layer */}
      <div className="absolute inset-0 aurora-container overflow-hidden opacity-60 dark:opacity-40">
        <div className="aurora-beam aurora-beam-1" />
        <div className="aurora-beam aurora-beam-2" />
        <div className="aurora-beam aurora-beam-3" />
      </div>
      
      {/* Subtle grid pattern */}
      <div className="absolute inset-0 bg-grid-modern opacity-40" />
      
      {/* Floating particles */}
      <div className="absolute inset-0 particles-container">
        {[...Array(6)].map((_, i) => (
          <div 
            key={i} 
            className={`particle particle-${i + 1}`}
            style={{
              left: `${15 + i * 15}%`,
              animationDelay: `${i * 0.8}s`,
              animationDuration: `${20 + i * 2}s`
            }}
          />
        ))}
      </div>
      
      {/* Top fade for header blend */}
      <div className="absolute top-0 left-0 right-0 h-40 bg-gradient-to-b from-white/90 via-white/50 to-transparent dark:from-slate-950/90 dark:via-slate-950/50 dark:to-transparent" />
      
      {/* Bottom vignette */}
      <div className="absolute bottom-0 left-0 right-0 h-64 bg-gradient-to-t from-white/60 to-transparent dark:from-slate-950/60 dark:to-transparent pointer-events-none" />
    </div>
  );
}

// Premium Button Component with advanced micro-interactions
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
  const [isPressed, setIsPressed] = useState(false);
  const [ripples, setRipples] = useState<{ x: number; y: number; id: number }[]>([]);
  
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const id = Date.now();
    
    setRipples(prev => [...prev, { x, y, id }]);
    setTimeout(() => {
      setRipples(prev => prev.filter(r => r.id !== id));
    }, 600);
  };
  
  const baseClasses = "relative overflow-hidden font-semibold transition-all duration-300 rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2";
  
  const variants = {
    primary: "bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-600 text-white shadow-lg shadow-indigo-500/25 hover:shadow-xl hover:shadow-indigo-500/35 focus-visible:ring-indigo-500 btn-shine premium-btn-glow",
    secondary: "bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-2 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white hover:border-indigo-300 dark:hover:border-indigo-700 hover:bg-white dark:hover:bg-slate-800 focus-visible:ring-slate-400",
    ghost: "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/80 dark:hover:bg-slate-800/80 focus-visible:ring-slate-400"
  };
  
  const sizes = {
    default: "h-10 px-5 text-sm",
    lg: "h-14 px-8 text-base md:text-lg"
  };
  
  return (
    <motion.button
      className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      onMouseLeave={() => setIsPressed(false)}
      onClick={handleClick}
      whileHover={{ 
        scale: 1.02,
        transition: { duration: 0.2, ease: [0.23, 1, 0.32, 1] }
      }}
      whileTap={{ 
        scale: 0.98,
        transition: { duration: 0.1 }
      }}
      animate={{
        y: isPressed ? 1 : 0,
      }}
      {...props}
    >
      {/* Ripple effects */}
      {ripples.map(ripple => (
        <span
          key={ripple.id}
          className="absolute rounded-full bg-white/30 animate-ripple pointer-events-none"
          style={{
            left: ripple.x,
            top: ripple.y,
            transform: 'translate(-50%, -50%)',
          }}
        />
      ))}
      
      {/* Gradient shimmer on hover */}
      <span className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity duration-500 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full hover:translate-x-full" style={{ transition: 'transform 0.6s ease' }} />
      
      {/* Content */}
      <span className="relative z-10 flex items-center justify-center gap-2">
        {children}
      </span>
    </motion.button>
  );
}

// Premium animated border card with mouse tracking
function AnimatedBorderCard({ children }: { children: React.ReactNode }) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!cardRef.current) return;
      
      const rect = cardRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      setMousePosition({ x, y });
    };

    const card = cardRef.current;
    if (card) {
      card.addEventListener('mousemove', handleMouseMove);
      return () => card.removeEventListener('mousemove', handleMouseMove);
    }
  }, []);

  return (
    <div
      ref={cardRef}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="relative group"
      style={{ isolation: 'isolate' }}
    >
      {/* Animated gradient border that follows mouse */}
      <motion.div
        className="absolute -inset-[1px] rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{
          background: isHovered
            ? `radial-gradient(600px circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(99, 102, 241, 0.15), transparent 40%)`
            : 'transparent',
        }}
      />

      {/* Outer glow effect */}
      <motion.div
        className="absolute -inset-[1px] rounded-3xl"
        style={{
          background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(139, 92, 246, 0.2), rgba(236, 72, 153, 0.2))',
          padding: '1px',
        }}
        animate={{
          opacity: isHovered ? 1 : 0.3,
        }}
        transition={{ duration: 0.4 }}
      />

      {/* Inner card content */}
      <div className="relative bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl shadow-xl shadow-slate-200/50 dark:shadow-slate-950/50 overflow-hidden rounded-3xl border border-slate-200/50 dark:border-slate-700/50">
        {children}
      </div>
    </div>
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

// Premium Feature Card with 3D tilt effect
function FeatureCard({ feature, index }: { feature: typeof features[0], index: number }) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const rotateXValue = ((e.clientY - centerY) / (rect.height / 2)) * -5;
    const rotateYValue = ((e.clientX - centerX) / (rect.width / 2)) * 5;
    setRotateX(rotateXValue);
    setRotateY(rotateYValue);
  };

  const handleMouseLeave = () => {
    setRotateX(0);
    setRotateY(0);
    setIsHovered(false);
  };

  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ 
        duration: 0.6, 
        delay: index * 0.1,
        ease: [0.21, 0.47, 0.32, 0.98]
      }}
      className="group perspective-1000"
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
    >
      <motion.div 
        className="relative h-full"
        animate={{
          rotateX: rotateX,
          rotateY: rotateY,
        }}
        transition={{ duration: 0.1, ease: 'linear' }}
        style={{ transformStyle: 'preserve-3d' }}
      >
        {/* Glow effect on hover */}
        <motion.div 
          className={`absolute -inset-0.5 rounded-2xl bg-gradient-to-r ${feature.gradient} opacity-0 blur-xl transition-opacity duration-500`}
          animate={{ opacity: isHovered ? 0.3 : 0 }}
        />
        
        <div className="relative h-full p-8 rounded-2xl bg-white/70 dark:bg-slate-900/70 backdrop-blur-sm border border-slate-200/60 dark:border-slate-700/60 transition-all duration-500 hover:bg-white/90 dark:hover:bg-slate-900/90 hover:shadow-2xl hover:shadow-slate-200/50 dark:hover:shadow-slate-950/50 hover:border-slate-300/80 dark:hover:border-slate-600/80 overflow-hidden">
          {/* Subtle inner glow */}
          <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-10 blur-2xl transition-opacity duration-700`} />
          
          {/* Icon with enhanced animation */}
          <motion.div 
            className={`relative w-14 h-14 rounded-xl ${feature.iconBg} flex items-center justify-center mb-6 overflow-hidden`}
            whileHover={{ scale: 1.1, rotate: 5 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
          >
            <feature.icon className={`w-7 h-7 ${feature.iconColor} relative z-10`} strokeWidth={1.5} />
            {/* Icon glow */}
            <motion.div 
              className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0`}
              animate={{ opacity: isHovered ? 0.2 : 0 }}
              transition={{ duration: 0.3 }}
            />
          </motion.div>
          
          {/* Content */}
          <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-3 tracking-tight">
            {feature.title}
          </h3>
          <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-[15px]">
            {feature.description}
          </p>
          
          {/* Animated bottom accent line */}
          <motion.div 
            className={`absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r ${feature.gradient}`}
            initial={{ scaleX: 0 }}
            animate={{ scaleX: isHovered ? 1 : 0 }}
            transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
            style={{ transformOrigin: 'left' }}
          />
        </div>
      </motion.div>
    </motion.div>
  );
}

// Team Member Card with enhanced interactions
function TeamMemberCard({ member, index }: { member: typeof team[0], index: number }) {
  const [isHovered, setIsHovered] = useState(false);
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ 
        duration: 0.6, 
        delay: index * 0.15,
        ease: [0.21, 0.47, 0.32, 0.98]
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <motion.div 
        className="group relative h-full"
        whileHover={{ y: -8 }}
        transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
      >
        {/* Glow effect */}
        <motion.div 
          className="absolute -inset-0.5 rounded-2xl bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500 opacity-0 blur-xl"
          animate={{ opacity: isHovered ? 0.25 : 0 }}
          transition={{ duration: 0.4 }}
        />
        
        <div className="relative h-full p-8 rounded-2xl bg-white/70 dark:bg-slate-900/70 backdrop-blur-sm border border-slate-200/60 dark:border-slate-700/60 transition-all duration-500 hover:bg-white/90 dark:hover:bg-slate-900/90 hover:shadow-2xl hover:shadow-slate-200/50 dark:hover:shadow-slate-950/50 text-center overflow-hidden">
          {/* Background decoration */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 bg-gradient-to-b from-indigo-500/5 to-transparent rounded-full blur-2xl" />
          
          {/* Avatar with animated ring */}
          <div className="w-24 h-24 mx-auto mb-6 relative">
            <motion.div 
              className="w-full h-full rounded-full bg-gradient-to-br from-indigo-500 via-violet-500 to-fuchsia-500 flex items-center justify-center shadow-lg shadow-indigo-500/25"
              animate={{ 
                boxShadow: isHovered 
                  ? '0 20px 40px -10px rgba(99, 102, 241, 0.4)' 
                  : '0 10px 25px -5px rgba(99, 102, 241, 0.25)'
              }}
              transition={{ duration: 0.3 }}
            >
              <span className="text-2xl font-bold text-white">
                {member.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
              </span>
            </motion.div>
            
            {/* Animated ring */}
            <motion.div 
              className="absolute inset-0 rounded-full border-2 border-indigo-500/30"
              animate={{ 
                scale: isHovered ? 1.2 : 1.1,
                opacity: isHovered ? 0 : 0.5,
              }}
              transition={{ duration: 0.4 }}
            />
            <motion.div 
              className="absolute inset-0 rounded-full border border-violet-500/20"
              animate={{ 
                scale: isHovered ? 1.35 : 1.2,
                opacity: isHovered ? 0 : 0.3,
              }}
              transition={{ duration: 0.4, delay: 0.05 }}
            />
          </div>
          
          {/* Content */}
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-1 tracking-tight">
            {member.name}
          </h3>
          <p className="text-sm font-medium text-indigo-600 dark:text-indigo-400 mb-4">
            {member.role}
          </p>
          <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed mb-6">
            {member.description}
          </p>
          
          {/* Social Links with stagger animation */}
          <div className="flex justify-center gap-3">
            {[
              { icon: Github, href: member.social.github },
              { icon: Linkedin, href: member.social.linkedin },
              { icon: Twitter, href: member.social.twitter },
            ].map((social, i) => (
              <motion.a
                key={i}
                href={social.href}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + i * 0.05 }}
                whileHover={{ scale: 1.15, y: -2 }}
                whileTap={{ scale: 0.95 }}
                className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:bg-gradient-to-br hover:from-indigo-500 hover:to-violet-500 hover:text-white transition-all duration-300 shadow-sm hover:shadow-lg hover:shadow-indigo-500/25"
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
                aggregateRating: {
                  '@type': 'AggregateRating',
                  ratingValue: '4.9',
                  ratingCount: '500',
                },
                description: 'Enterprise-grade community management platform with AI-powered booking.',
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
                <span className="text-xl md:text-2xl font-bold bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-600 bg-clip-text text-transparent">
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
                    <Button className="bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-600 hover:from-indigo-500 hover:via-violet-500 hover:to-fuchsia-500 text-white shadow-lg shadow-indigo-500/25 hover:shadow-xl hover:shadow-indigo-500/30 font-medium px-6 h-10 rounded-xl transition-all duration-300 btn-shine">
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
                className="md:hidden p-2.5 rounded-xl bg-slate-100/80 dark:bg-slate-800/80 hover:bg-slate-200/80 dark:hover:bg-slate-700/80 transition-colors"
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

            {/* Mobile Navigation Menu */}
            <AnimatePresence>
              {mobileMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="md:hidden overflow-hidden"
                >
                  <div className="py-4 space-y-2">
                    <Link href="/auth/signin" className="block">
                      <Button variant="ghost" className="w-full justify-center text-base font-medium h-12 rounded-xl">
                        Sign In
                      </Button>
                    </Link>
                    <Link href="/auth/signup" className="block">
                      <Button className="w-full bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-600 hover:from-indigo-500 hover:via-violet-500 hover:to-fuchsia-500 text-white h-12 rounded-xl">
                        Get Started
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </Link>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </header>

        {/* Hero Section */}
        <section className="relative pt-32 md:pt-40 lg:pt-48 pb-20 md:pb-28 lg:pb-36 px-4 sm:px-6 overflow-hidden">
          <div className="max-w-7xl mx-auto">
            <div className="text-center max-w-4xl mx-auto">
              {/* Badge */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-50/80 dark:bg-indigo-950/50 border border-indigo-200/50 dark:border-indigo-800/50 mb-8"
              >
                <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span className="text-sm font-medium text-indigo-700 dark:text-indigo-300">
                  Enterprise-Grade Community Management
                </span>
              </motion.div>
              
              {/* Headline */}
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-slate-900 dark:text-white mb-6 leading-[1.1]"
              >
                Community Living,
                <br />
                <span className="text-gradient-animate">
                  Revolutionized
                </span>
              </motion.h1>
              
              {/* Subheadline */}
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="text-lg md:text-xl text-slate-600 dark:text-slate-400 mb-10 md:mb-12 max-w-2xl mx-auto leading-relaxed"
              >
                Experience the future of community management with AI-powered booking, real-time notifications, and enterprise-grade security.
              </motion.p>
              
              {/* CTAs */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="flex flex-col sm:flex-row gap-4 justify-center mb-16 md:mb-20"
              >
                <Link href="/auth/signup" className="w-full sm:w-auto">
                  <PremiumButton variant="primary" size="lg" className="w-full sm:w-auto">
                    Start Free Trial
                    <ArrowRight className="w-5 h-5" />
                  </PremiumButton>
                </Link>
                <Link href="/auth/signin" className="w-full sm:w-auto">
                  <PremiumButton variant="secondary" size="lg" className="w-full sm:w-auto">
                    View Demo
                    <ChevronRight className="w-5 h-5" />
                  </PremiumButton>
                </Link>
              </motion.div>

              {/* Stats with enhanced animation */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8 max-w-3xl mx-auto"
              >
                {stats.map((stat, index) => (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, scale: 0.8, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ 
                      duration: 0.5, 
                      delay: 0.5 + index * 0.1,
                      ease: [0.21, 0.47, 0.32, 0.98]
                    }}
                    whileHover={{ scale: 1.05, y: -4 }}
                    className="text-center group cursor-default"
                  >
                    <motion.div 
                      className="text-3xl md:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-600 bg-clip-text text-transparent mb-1 md:mb-2"
                      animate={{ 
                        textShadow: ['0 0 20px rgba(99, 102, 241, 0.3)', '0 0 40px rgba(139, 92, 246, 0.4)', '0 0 20px rgba(99, 102, 241, 0.3)']
                      }}
                      transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                    >
                      {stat.value}
                    </motion.div>
                    <div className="text-sm md:text-base text-slate-500 dark:text-slate-400 font-medium group-hover:text-slate-700 dark:group-hover:text-slate-300 transition-colors duration-300">
                      {stat.label}
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            </div>
          </div>
          
          {/* Decorative gradient blur at bottom */}
          <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-slate-50 dark:from-slate-950 to-transparent pointer-events-none" />
        </section>

        {/* Section Divider */}
        <div className="relative h-px max-w-4xl mx-auto">
          <div className="section-divider w-full" />
        </div>

        {/* Features Section */}
        <section className="relative py-20 md:py-28 lg:py-36 px-4 sm:px-6">
          {/* Section background */}
          <div className="absolute inset-0 bg-slate-50/50 dark:bg-slate-900/30" />
          
          <div className="relative max-w-7xl mx-auto">
            {/* Section Header */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.6 }}
              className="text-center mb-16 md:mb-20"
            >
              <motion.span 
                className="inline-block text-sm font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-4"
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4 }}
              >
                Features
              </motion.span>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-slate-900 dark:text-white mb-5">
                Built for{' '}
                <span className="bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-600 bg-clip-text text-transparent">
                  Modern Communities
                </span>
              </h2>
              <p className="text-lg md:text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
                Everything you need to manage your community efficiently, securely, and intelligently.
              </p>
            </motion.div>

            {/* Features Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
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
        <section className="relative py-20 md:py-28 px-4 sm:px-6 overflow-hidden">
          <div className="max-w-5xl mx-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 30 }}
              whileInView={{ opacity: 1, scale: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.7, ease: [0.21, 0.47, 0.32, 0.98] }}
              className="relative rounded-3xl overflow-hidden cta-card-glow"
            >
              {/* Animated background gradient */}
              <motion.div 
                className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-violet-600 to-fuchsia-600"
                animate={{ 
                  backgroundPosition: ['0% 50%', '100% 50%', '0% 50%']
                }}
                transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
                style={{ backgroundSize: '200% 200%' }}
              />
              
              {/* Animated mesh overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-white/5" />
              
              {/* Animated decorative orbs */}
              <motion.div 
                className="absolute top-0 left-0 w-96 h-96 bg-white/15 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"
                animate={{ 
                  scale: [1, 1.2, 1],
                  opacity: [0.15, 0.25, 0.15]
                }}
                transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
              />
              <motion.div 
                className="absolute bottom-0 right-0 w-96 h-96 bg-white/15 rounded-full blur-3xl translate-x-1/2 translate-y-1/2"
                animate={{ 
                  scale: [1.2, 1, 1.2],
                  opacity: [0.25, 0.15, 0.25]
                }}
                transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
              />
              <motion.div 
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-white/10 rounded-full blur-2xl"
                animate={{ 
                  scale: [0.8, 1.1, 0.8],
                  rotate: [0, 180, 360]
                }}
                transition={{ duration: 15, repeat: Infinity, ease: 'linear' }}
              />
              
              {/* Grid pattern overlay */}
              <div className="absolute inset-0 cta-grid-pattern opacity-10" />
              
              {/* Content */}
              <div className="relative px-8 py-16 md:px-16 md:py-24 text-center">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                >
                  <motion.h2 
                    className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-6 tracking-tight"
                    animate={{ 
                      textShadow: ['0 0 30px rgba(255,255,255,0.3)', '0 0 50px rgba(255,255,255,0.5)', '0 0 30px rgba(255,255,255,0.3)']
                    }}
                    transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                  >
                    Ready to Transform Your Community?
                  </motion.h2>
                  <p className="text-lg md:text-xl text-white/90 mb-10 max-w-2xl mx-auto leading-relaxed">
                    Join hundreds of communities already using CircleIn to streamline operations and enhance resident experiences.
                  </p>
                  <Link href="/auth/signup" className="inline-block">
                    <motion.button
                      className="relative bg-white text-indigo-600 shadow-xl shadow-black/20 text-base md:text-lg px-8 h-14 rounded-xl font-semibold overflow-hidden group"
                      whileHover={{ scale: 1.03, boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)' }}
                      whileTap={{ scale: 0.98 }}
                    >
                      {/* Shimmer effect */}
                      <span className="absolute inset-0 bg-gradient-to-r from-transparent via-indigo-100 to-transparent opacity-0 group-hover:opacity-100 group-hover:animate-shimmer" />
                      <span className="relative z-10 flex items-center gap-2">
                        Start Your Free Trial
                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
                      </span>
                    </motion.button>
                  </Link>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Section Divider */}
        <div className="relative h-px max-w-4xl mx-auto">
          <div className="section-divider w-full" />
        </div>

        {/* Team Section */}
        <section className="relative py-20 md:py-28 lg:py-36 px-4 sm:px-6">
          {/* Section background */}
          <div className="absolute inset-0 bg-slate-50/50 dark:bg-slate-900/30" />
          
          <div className="relative max-w-7xl mx-auto">
            {/* Section Header */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.6 }}
              className="text-center mb-16 md:mb-20"
            >
              <motion.span 
                className="inline-block text-sm font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-4"
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4 }}
              >
                Our Team
              </motion.span>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-slate-900 dark:text-white mb-5">
                Meet the{' '}
                <span className="bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-600 bg-clip-text text-transparent">
                  Development Team
                </span>
              </h2>
              <p className="text-lg md:text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
                Built by passionate developers dedicated to creating exceptional community management solutions.
              </p>
            </motion.div>

            {/* Team Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
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
        <section className="relative py-20 md:py-28 px-4 sm:px-6">
          <div className="max-w-2xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.6 }}
            >
              <AnimatedBorderCard>
                <div className="p-8 md:p-12">
                  {/* Header */}
                  <div className="text-center mb-10">
                    <motion.div 
                      className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-indigo-500 via-violet-500 to-fuchsia-500 flex items-center justify-center shadow-lg shadow-indigo-500/25"
                      whileHover={{ scale: 1.05, rotate: 5 }}
                      transition={{ type: "spring", stiffness: 400, damping: 17 }}
                    >
                      <Mail className="w-8 h-8 text-white" />
                    </motion.div>
                    <motion.span 
                      className="inline-block text-sm font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-3"
                      initial={{ opacity: 0, y: 10 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.4 }}
                    >
                      Contact Us
                    </motion.span>
                    <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-3 tracking-tight">
                      Get in Touch
                    </h2>
                    <p className="text-slate-600 dark:text-slate-400 text-lg">
                      Interested in becoming a community admin? We'd love to hear from you!
                    </p>
                  </div>
                  
                  {/* Form */}
                  <ContactForm />
                </div>
              </AnimatedBorderCard>
            </motion.div>
          </div>
        </section>

        {/* Footer */}
        <footer className="relative border-t border-slate-200/50 dark:border-slate-800/50 bg-white/50 dark:bg-slate-950/50 backdrop-blur-xl">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 lg:gap-12 mb-12">
              {/* Brand Column */}
              <div className="col-span-2 md:col-span-1">
                <div className="flex items-center gap-2 mb-4">
                  <CircleInLogo className="w-8 h-8" />
                  <span className="text-xl font-bold bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-600 bg-clip-text text-transparent">
                    CircleIn
                  </span>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  Enterprise-grade community management platform for modern residential communities.
                </p>
              </div>
              
              {/* Product Links */}
              <div>
                <h3 className="font-semibold text-slate-900 dark:text-white mb-4 text-sm uppercase tracking-wider">
                  Product
                </h3>
                <ul className="space-y-3 text-sm">
                  {['Features', 'Pricing', 'Security'].map((item) => (
                    <li key={item}>
                      <Link 
                        href="/auth/signup" 
                        className="text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors link-underline"
                      >
                        {item}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
              
              {/* Company Links */}
              <div>
                <h3 className="font-semibold text-slate-900 dark:text-white mb-4 text-sm uppercase tracking-wider">
                  Company
                </h3>
                <ul className="space-y-3 text-sm">
                  {['About', 'Contact', 'Careers'].map((item) => (
                    <li key={item}>
                      <Link 
                        href="/auth/signup" 
                        className="text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors link-underline"
                      >
                        {item}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
              
              {/* Legal Links */}
              <div>
                <h3 className="font-semibold text-slate-900 dark:text-white mb-4 text-sm uppercase tracking-wider">
                  Legal
                </h3>
                <ul className="space-y-3 text-sm">
                  <li>
                    <Link 
                      href="/privacy" 
                      className="text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors link-underline"
                    >
                      Privacy
                    </Link>
                  </li>
                  <li>
                    <Link 
                      href="/terms" 
                      className="text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors link-underline"
                    >
                      Terms
                    </Link>
                  </li>
                  <li>
                    <Link 
                      href="/security" 
                      className="text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors link-underline"
                    >
                      Security
                    </Link>
                  </li>
                </ul>
              </div>
            </div>
            
            {/* Bottom Bar */}
            <div className="pt-8 border-t border-slate-200/50 dark:border-slate-800/50">
              <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <p className="text-sm text-slate-500 dark:text-slate-400 text-center md:text-left">
                  © 2026 CircleIn. All rights reserved. Built with ❤️ for modern communities.
                </p>
                <div className="flex items-center gap-3">
                  {[
                    { Icon: Github, label: 'GitHub' },
                    { Icon: Linkedin, label: 'LinkedIn' },
                    { Icon: Twitter, label: 'Twitter' }
                  ].map(({ Icon, label }, i) => (
                    <motion.a
                      key={i}
                      href="#"
                      aria-label={label}
                      whileHover={{ scale: 1.1, y: -2 }}
                      whileTap={{ scale: 0.95 }}
                      className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:bg-gradient-to-br hover:from-indigo-500 hover:to-violet-500 hover:text-white transition-all duration-300 shadow-sm hover:shadow-lg hover:shadow-indigo-500/25"
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