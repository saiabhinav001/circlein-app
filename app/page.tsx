'use client';

import { useEffect, useState, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  Calendar, Users, Shield, Clock, Sparkles, Bell, 
  Brain, Lock, Zap, Mail, Github, Linkedin, Twitter, Send, User, Building2, MessageSquare, Menu, X 
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
  { label: 'Amenities', value: '4+' },
  { label: 'Uptime', value: '99.9%' },
  { label: 'Real-time', value: 'Sync' },
];

const features = [
  {
    icon: Calendar,
    title: 'Smart Booking System',
    description: 'Intuitive calendar interface with real-time availability, automated confirmations, and intelligent scheduling.',
  },
  {
    icon: Users,
    title: 'Community Management',
    description: 'Manage residents, groups, and permissions with enterprise-grade role-based access control.',
  },
  {
    icon: Brain,
    title: 'AI-Powered Chatbot',
    description: 'Instant assistance with Gemini AI integration for booking help, FAQs, and community support.',
  },
  {
    icon: Lock,
    title: 'Enterprise Security',
    description: 'Bank-level encryption, secure access codes, and comprehensive audit trails for complete peace of mind.',
  },
  {
    icon: Zap,
    title: 'Real-time Updates',
    description: 'Live notifications, instant booking confirmations, and real-time availability across all devices.',
  },
  {
    icon: Bell,
    title: 'Smart Reminders',
    description: 'Automated email reminders, check-in notifications, and intelligent booking management.',
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

// Animated Border Card Component with Mouse Tracking
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
      className="relative group mx-4 sm:mx-0"
      style={{ isolation: 'isolate' }}
    >
      {/* Animated gradient border that follows mouse */}
      <motion.div
        className="absolute inset-0 rounded-2xl sm:rounded-3xl"
        style={{
          background: isHovered
            ? `radial-gradient(600px circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(59, 130, 246, 0.8), rgba(147, 51, 234, 0.6), rgba(236, 72, 153, 0.8))`
            : 'linear-gradient(90deg, rgba(59, 130, 246, 0.8), rgba(147, 51, 234, 0.6), rgba(236, 72, 153, 0.8))',
          padding: '2px',
        }}
        animate={{
          opacity: isHovered ? 1 : 0.7,
        }}
        transition={{ duration: 0.3 }}
      />

      {/* Glowing effect on hover */}
      <motion.div
        className="absolute inset-0 rounded-2xl sm:rounded-3xl blur-xl"
        style={{
          background: isHovered
            ? `radial-gradient(400px circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(59, 130, 246, 0.4), rgba(147, 51, 234, 0.3), rgba(236, 72, 153, 0.4))`
            : 'transparent',
        }}
        animate={{
          opacity: isHovered ? 0.6 : 0,
        }}
        transition={{ duration: 0.3 }}
      />

      {/* Inner card content */}
      <Card className="relative border-0 bg-white dark:bg-slate-900 shadow-2xl overflow-hidden rounded-2xl sm:rounded-3xl">
        <div className="relative bg-white dark:bg-slate-900">
          {children}
        </div>
      </Card>
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

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Name Field */}
        <div className="space-y-2">
          <Label htmlFor="name" className="text-base font-semibold flex items-center space-x-2">
            <User className="w-4 h-4 text-blue-600" />
            <span>Full Name *</span>
          </Label>
          <Input
            id="name"
            type="text"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="John Doe"
            className="h-12 border-2 border-slate-200 dark:border-slate-700 focus-visible:border-blue-500 dark:focus-visible:border-blue-500 focus-visible:ring-0 focus-visible:ring-offset-0 transition-all duration-300 text-base"
          />
        </div>

        {/* Email Field */}
        <div className="space-y-2">
          <Label htmlFor="email" className="text-base font-semibold flex items-center space-x-2">
            <Mail className="w-4 h-4 text-purple-600" />
            <span>Email Address *</span>
          </Label>
          <Input
            id="email"
            type="email"
            required
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            placeholder="john@company.com"
            className="h-12 border-2 border-slate-200 dark:border-slate-700 focus-visible:border-purple-500 dark:focus-visible:border-purple-500 focus-visible:ring-0 focus-visible:ring-offset-0 transition-all duration-300 text-base"
          />
        </div>
      </div>

      {/* Company Field */}
      <div className="space-y-2">
        <Label htmlFor="company" className="text-base font-semibold flex items-center space-x-2">
          <Building2 className="w-4 h-4 text-pink-600" />
          <span>Company / Community Name</span>
        </Label>
        <Input
          id="company"
          type="text"
          value={formData.company}
          onChange={(e) => setFormData({ ...formData, company: e.target.value })}
          placeholder="Your Organization (Optional)"
          className="h-12 border-2 border-slate-200 dark:border-slate-700 focus-visible:border-pink-500 dark:focus-visible:border-pink-500 focus-visible:ring-0 focus-visible:ring-offset-0 transition-all duration-300 text-base"
        />
      </div>

      {/* Message Field */}
      <div className="space-y-2">
        <Label htmlFor="message" className="text-base font-semibold flex items-center space-x-2">
          <MessageSquare className="w-4 h-4 text-blue-600" />
          <span>Your Message *</span>
        </Label>
        <Textarea
          id="message"
          required
          value={formData.message}
          onChange={(e) => setFormData({ ...formData, message: e.target.value })}
          placeholder="Tell us about your community and how we can help..."
          rows={6}
          className="border-2 border-slate-200 dark:border-slate-700 focus-visible:border-blue-500 dark:focus-visible:border-blue-500 focus-visible:ring-0 focus-visible:ring-offset-0 transition-all duration-300 resize-none text-base"
        />
      </div>

      {/* Submit Button */}
      <div className="pt-4">
        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full h-14 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 hover:from-blue-700 hover:via-purple-700 hover:to-pink-700 text-white text-lg font-semibold shadow-2xl hover:shadow-3xl transform hover:scale-[1.02] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <span className="flex items-center space-x-2">
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Sending Message...</span>
            </span>
          ) : (
            <span className="flex items-center space-x-2">
              <Send className="w-5 h-5" />
              <span>Send Message</span>
            </span>
          )}
        </Button>
      </div>

      {/* Status Messages */}
      {submitStatus === 'success' && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-green-50 dark:bg-green-950 border-2 border-green-500 rounded-xl text-center"
        >
          <p className="text-green-700 dark:text-green-300 font-semibold text-lg">
            ✅ Message sent successfully! We'll get back to you soon.
          </p>
        </motion.div>
      )}

      {submitStatus === 'error' && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-red-50 dark:bg-red-950 border-2 border-red-500 rounded-xl text-center"
        >
          <p className="text-red-700 dark:text-red-300 font-semibold text-lg">
            ❌ Failed to send message. Please try again or email us directly.
          </p>
        </motion.div>
      )}
    </form>
  );
}

export default function LandingPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (status === 'authenticated' && session) {
      router.replace('/dashboard');
    }
  }, [session, status, router]);

  // Show loading state while checking authentication
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <CircleInLogo className="w-16 h-16 mx-auto mb-4" />
          <p className="text-slate-600 dark:text-slate-400">Loading...</p>
        </div>
      </div>
    );
  }

  // Show loading state during redirect for authenticated users
  if (status === 'authenticated') {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <CircleInLogo className="w-16 h-16 mx-auto mb-4" />
          <p className="text-slate-600 dark:text-slate-400">Redirecting to dashboard...</p>
        </div>
      </div>
    );
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

      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 relative overflow-hidden">
        {/* Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 opacity-60" />
      <div className="absolute inset-0">
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob" />
        <div className="absolute top-40 right-10 w-72 h-72 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000" />
        <div className="absolute bottom-20 left-20 w-72 h-72 bg-pink-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000" />
      </div>

      <div className="relative z-10">
        {/* Header */}
        <header className="border-b border-slate-200/50 dark:border-slate-800/50 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl sticky top-0 z-50">
          <div className="container mx-auto px-4 sm:px-6 md:px-8 lg:px-10 xl:px-12 py-3 md:py-4">
            <div className="flex items-center justify-between">
              <Link href="/" className="flex items-center space-x-2">
                <CircleInLogo className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10" />
                <span className="text-xl sm:text-2xl md:text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  CircleIn
                </span>
              </Link>
              
              {/* Desktop Navigation */}
              <div className="hidden md:flex items-center space-x-2 md:space-x-3 lg:space-x-4">
                <Link href="/auth/signin">
                  <Button variant="ghost" size="default" className="text-sm md:text-base font-medium px-4 md:px-6">
                    Sign In
                  </Button>
                </Link>
                <Link href="/auth/signup">
                  <ScaleOnHover scaleAmount={1.05}>
                    <Button size="default" className="text-sm md:text-base bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg px-4 md:px-6">
                      Get Started
                    </Button>
                  </ScaleOnHover>
                </Link>
              </div>

              {/* Mobile Menu Button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center justify-center"
                aria-label="Toggle menu"
              >
                {mobileMenuOpen ? (
                  <X className="w-6 h-6 text-slate-900 dark:text-slate-100" />
                ) : (
                  <Menu className="w-6 h-6 text-slate-900 dark:text-slate-100" />
                )}
              </button>
            </div>

            {/* Mobile Navigation Menu */}
            {mobileMenuOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="md:hidden mt-4 pb-4 space-y-3"
              >
                <Link href="/auth/signin" className="block">
                  <Button variant="ghost" className="w-full justify-center text-base font-medium" size="lg">
                    Sign In
                  </Button>
                </Link>
                <Link href="/auth/signup" className="block">
                  <Button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white" size="lg">
                    Get Started
                  </Button>
                </Link>
              </motion.div>
            )}
          </div>
        </header>

        {/* Hero Section */}
        <section className="py-12 sm:py-16 md:py-20 lg:py-24 px-4 sm:px-6">
          <div className="container mx-auto text-center max-w-7xl">
            <FadeIn>
              <div className="inline-flex items-center space-x-2 bg-blue-100 dark:bg-blue-950 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full mb-6 sm:mb-8">
                <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 text-blue-600 dark:text-blue-400" />
                <span className="text-xs sm:text-sm font-semibold text-blue-600 dark:text-blue-400">
                  Enterprise-Grade Community Management
                </span>
              </div>
            </FadeIn>
              
            <FadeIn delay={0.1}>
              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-4 sm:mb-6 leading-tight px-4">
                Community Living,
                <br />
                <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                  Revolutionized
                </span>
              </h1>
            </FadeIn>
              
            <FadeIn delay={0.2}>
              <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-slate-600 dark:text-slate-400 mb-8 sm:mb-10 md:mb-12 max-w-4xl mx-auto leading-relaxed px-4">
                Experience the future of community management with AI-powered booking, real-time notifications, and enterprise-grade security. Built with cutting-edge technology for modern communities.
              </p>
            </FadeIn>
              
            <FadeIn delay={0.3}>
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center mb-10 sm:mb-12 md:mb-16 px-4">
                <Link href="/auth/signup" className="w-full sm:w-auto">
                  <ScaleOnHover scaleAmount={1.05}>
                    <Button size="lg" className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-2xl text-base sm:text-lg px-6 sm:px-8 py-5 sm:py-6">
                      Start Free Trial
                    </Button>
                  </ScaleOnHover>
                </Link>
                <Link href="/auth/signin" className="w-full sm:w-auto">
                  <ScaleOnHover scaleAmount={1.05}>
                    <Button size="lg" variant="outline" className="w-full sm:w-auto text-base sm:text-lg px-6 sm:px-8 py-5 sm:py-6 border-2">
                      View Demo
                    </Button>
                  </ScaleOnHover>
                </Link>
              </div>
            </FadeIn>

              {/* Stats */}
              <StaggerContainer className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8 max-w-4xl mx-auto px-4" staggerDelay={0.08}>
                {stats.map((stat) => (
                  <StaggerItem key={stat.label} className="text-center">
                    <div className="text-3xl sm:text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-1 sm:mb-2">
                      {stat.value}
                    </div>
                    <div className="text-sm sm:text-base text-slate-600 dark:text-slate-400 font-medium">
                      {stat.label}
                    </div>
                  </StaggerItem>
                ))}
              </StaggerContainer>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-12 sm:py-16 md:py-20 lg:py-24 px-4 sm:px-6 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm">
          <div className="container mx-auto max-w-7xl">
            <FadeIn className="text-center mb-16">
              <h2 className="text-5xl font-bold mb-6">
                Built for{' '}
                <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Modern Communities
                </span>
              </h2>
              <p className="text-xl text-slate-600 dark:text-slate-400 max-w-3xl mx-auto">
                Everything you need to manage your community efficiently, securely, and intelligently.
              </p>
            </FadeIn>

            <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 px-4" staggerDelay={0.1}>
              {features.map((feature) => (
                <StaggerItem key={feature.title}>
                  <ScaleOnHover scaleAmount={1.03}>
                    <Card className="h-full shadow-xl border-0 bg-white dark:bg-slate-900 transition-shadow duration-300 hover:shadow-2xl">
                    <CardHeader>
                      <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-3 sm:mb-4 shadow-lg">
                        <feature.icon className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
                      </div>
                      <CardTitle className="text-xl sm:text-2xl font-bold text-center">
                        {feature.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <CardDescription className="text-slate-600 dark:text-slate-400 text-center text-base">
                        {feature.description}
                      </CardDescription>
                    </CardContent>
                  </Card>
                  </ScaleOnHover>
                </StaggerItem>
              ))}
            </StaggerContainer>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-12 sm:py-16 md:py-20 lg:py-24 px-4 sm:px-6">
          <div className="container mx-auto max-w-7xl">
            <FadeIn>
              <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-2xl sm:rounded-3xl p-8 sm:p-12 md:p-16 text-white text-center shadow-2xl">
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 sm:mb-6">
                Ready to Transform Your Community?
              </h2>
              <p className="text-base sm:text-lg md:text-xl lg:text-2xl mb-8 sm:mb-10 opacity-95 max-w-3xl mx-auto">
                Join hundreds of communities already using CircleIn to streamline operations and enhance resident experiences.
              </p>
              <Link href="/auth/signup">
                <ScaleOnHover scaleAmount={1.05}>
                  <Button size="lg" variant="secondary" className="bg-white text-slate-900 hover:bg-slate-100 shadow-xl text-base sm:text-lg px-6 sm:px-8 py-5 sm:py-6">
                    Start Your Free Trial
                  </Button>
                </ScaleOnHover>
              </Link>
              </div>
            </FadeIn>
          </div>
        </section>

        {/* Team Section */}
        <section className="py-12 sm:py-16 md:py-20 lg:py-24 px-4 sm:px-6 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm">
          <div className="container mx-auto max-w-7xl">
            <FadeIn className="text-center mb-16">
              <h2 className="text-5xl font-bold mb-6">
                Meet the{' '}
                <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Development Team
                </span>
              </h2>
              <p className="text-xl text-slate-600 dark:text-slate-400 max-w-3xl mx-auto">
                Built by passionate developers dedicated to creating exceptional community management solutions.
              </p>
            </FadeIn>

            <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8 px-4" staggerDelay={0.15}>
              {team.map((member) => (
                <StaggerItem key={member.name}>
                  <ScaleOnHover scaleAmount={1.03}>
                    <Card className="text-center shadow-xl border-0 bg-white dark:bg-slate-900 transition-shadow duration-300 hover:shadow-2xl">
                    <CardHeader>
                      <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4 shadow-lg">
                        <span className="text-2xl sm:text-3xl font-bold text-white">
                          {member.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                        </span>
                      </div>
                      <CardTitle className="text-lg sm:text-xl font-bold">
                        {member.name}
                      </CardTitle>
                      <CardDescription className="text-blue-600 dark:text-blue-400 font-semibold">
                        {member.role}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-slate-600 dark:text-slate-400 mb-4">
                        {member.description}
                      </p>
                      <div className="flex justify-center space-x-4">
                        <a href={member.social.github} className="text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                          <Github className="w-5 h-5" />
                        </a>
                        <a href={member.social.linkedin} className="text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                          <Linkedin className="w-5 h-5" />
                        </a>
                        <a href={member.social.twitter} className="text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                          <Twitter className="w-5 h-5" />
                        </a>
                      </div>
                    </CardContent>
                  </Card>
                  </ScaleOnHover>
                </StaggerItem>
              ))}
            </StaggerContainer>
          </div>
        </section>

        {/* Contact Section */}
        <section className="py-12 sm:py-16 md:py-20 lg:py-24 px-4 sm:px-6">
          <div className="container mx-auto max-w-4xl">
            <FadeIn>
              <AnimatedBorderCard>
                <CardHeader className="text-center pb-6 sm:pb-8 px-4">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl sm:rounded-3xl flex items-center justify-center mx-auto mb-4 sm:mb-6 shadow-2xl transform hover:scale-110 transition-transform duration-300">
                    <Mail className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
                  </div>
                  <CardTitle className="text-3xl sm:text-4xl md:text-5xl font-bold mb-3 sm:mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    Get in Touch
                  </CardTitle>
                  <CardDescription className="text-base sm:text-lg md:text-xl text-slate-600 dark:text-slate-400">
                    Interested in becoming a community admin? We'd love to hear from you!
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ContactForm />
                </CardContent>
              </AnimatedBorderCard>
            </FadeIn>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-slate-200/50 dark:border-slate-800/50 py-8 sm:py-10 md:py-12 px-4 sm:px-6 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl">
          <div className="container mx-auto max-w-7xl">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8 mb-6 sm:mb-8">
              <div className="sm:col-span-2 md:col-span-1">
                <div className="flex items-center space-x-2 mb-3 sm:mb-4">
                  <CircleInLogo className="w-7 h-7 sm:w-8 sm:h-8" />
                  <span className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    CircleIn
                  </span>
                </div>
                <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400">
                  Enterprise-grade community management platform for modern residential communities.
                </p>
              </div>
              
              <div>
                <h3 className="font-bold mb-3 sm:mb-4 text-slate-900 dark:text-white text-base sm:text-lg">Product</h3>
                <ul className="space-y-2 text-slate-600 dark:text-slate-400 text-sm sm:text-base">
                  <li><Link href="/auth/signup" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Features</Link></li>
                  <li><Link href="/auth/signup" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Pricing</Link></li>
                  <li><Link href="/auth/signup" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Security</Link></li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-bold mb-3 sm:mb-4 text-slate-900 dark:text-white text-base sm:text-lg">Company</h3>
                <ul className="space-y-2 text-slate-600 dark:text-slate-400 text-sm sm:text-base">
                  <li><Link href="/auth/signup" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">About</Link></li>
                  <li><Link href="/auth/signup" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Contact</Link></li>
                  <li><Link href="/auth/signup" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Careers</Link></li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-bold mb-3 sm:mb-4 text-slate-900 dark:text-white text-base sm:text-lg">Legal</h3>
                <ul className="space-y-2 text-slate-600 dark:text-slate-400 text-sm sm:text-base">
                  <li><Link href="/auth/signup" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Privacy</Link></li>
                  <li><Link href="/auth/signup" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Terms</Link></li>
                  <li><Link href="/auth/signup" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Security</Link></li>
                </ul>
              </div>
            </div>
            
            <div className="border-t border-slate-200 dark:border-slate-800 pt-6 sm:pt-8 text-center">
              <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400">
                © 2025 CircleIn. All rights reserved. Built with ❤️ for modern communities.
              </p>
            </div>
          </div>
        </footer>
      </div>
    </div>
    </>
  );
}