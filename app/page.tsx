'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  Calendar, Users, Shield, Clock, Sparkles, Bell, 
  Brain, Lock, Zap, Mail, Github, Linkedin, Twitter 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { CircleInLogo } from '@/components/ui';

// Disable static generation for this page
export const dynamic = 'force-dynamic';

const stats = [
  { label: 'Communities', value: '500+' },
  { label: 'Residents', value: '10K+' },
  { label: 'Uptime', value: '99.9%' },
  { label: 'Support', value: '24/7' },
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

export default function LandingPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

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
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <CircleInLogo className="w-8 h-8" />
                <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  CircleIn
                </span>
              </div>
              <div className="flex items-center space-x-4">
                <Link href="/auth/signin">
                  <Button variant="ghost">Sign In</Button>
                </Link>
                <Link href="/auth/signup">
                  <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all">
                    Get Started
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </header>

        {/* Hero Section */}
        <section className="py-24 px-4">
          <div className="container mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <div className="inline-flex items-center space-x-2 bg-blue-100 dark:bg-blue-950 px-4 py-2 rounded-full mb-8">
                <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                  Enterprise-Grade Community Management
                </span>
              </div>
              
              <h1 className="text-6xl md:text-7xl font-bold mb-6 leading-tight">
                Community Living,
                <br />
                <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                  Revolutionized
                </span>
              </h1>
              
              <p className="text-xl md:text-2xl text-slate-600 dark:text-slate-400 mb-12 max-w-4xl mx-auto leading-relaxed">
                Experience the future of community management with AI-powered booking, real-time notifications, and enterprise-grade security. Trusted by 500+ communities worldwide.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
                <Link href="/auth/signup">
                  <Button size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-2xl hover:shadow-3xl transform hover:scale-105 transition-all text-lg px-8 py-6">
                    Start Free Trial
                  </Button>
                </Link>
                <Link href="/auth/signin">
                  <Button size="lg" variant="outline" className="text-lg px-8 py-6 border-2">
                    View Demo
                  </Button>
                </Link>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
                {stats.map((stat, index) => (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.2 + index * 0.1 }}
                    className="text-center"
                  >
                    <div className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
                      {stat.value}
                    </div>
                    <div className="text-slate-600 dark:text-slate-400 font-medium">
                      {stat.label}
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-24 px-4 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm">
          <div className="container mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-center mb-16"
            >
              <h2 className="text-5xl font-bold mb-6">
                Built for{' '}
                <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Modern Communities
                </span>
              </h2>
              <p className="text-xl text-slate-600 dark:text-slate-400 max-w-3xl mx-auto">
                Everything you need to manage your community efficiently, securely, and intelligently.
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {features.map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.2 + index * 0.1 }}
                >
                  <Card className="h-full hover:shadow-2xl transition-all duration-300 border-0 bg-white dark:bg-slate-900 hover:scale-105 transform">
                    <CardHeader>
                      <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                        <feature.icon className="w-8 h-8 text-white" />
                      </div>
                      <CardTitle className="text-2xl font-bold text-center">
                        {feature.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <CardDescription className="text-slate-600 dark:text-slate-400 text-center text-base">
                        {feature.description}
                      </CardDescription>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-24 px-4">
          <div className="container mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-3xl p-12 md:p-16 text-white text-center shadow-2xl"
            >
              <h2 className="text-4xl md:text-5xl font-bold mb-6">
                Ready to Transform Your Community?
              </h2>
              <p className="text-xl md:text-2xl mb-10 opacity-95 max-w-3xl mx-auto">
                Join hundreds of communities already using CircleIn to streamline operations and enhance resident experiences.
              </p>
              <Link href="/auth/signup">
                <Button size="lg" variant="secondary" className="bg-white text-slate-900 hover:bg-slate-100 shadow-xl text-lg px-8 py-6 transform hover:scale-105 transition-all">
                  Start Your Free Trial
                </Button>
              </Link>
            </motion.div>
          </div>
        </section>

        {/* Team Section */}
        <section className="py-24 px-4 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm">
          <div className="container mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-center mb-16"
            >
              <h2 className="text-5xl font-bold mb-6">
                Meet the{' '}
                <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Development Team
                </span>
              </h2>
              <p className="text-xl text-slate-600 dark:text-slate-400 max-w-3xl mx-auto">
                Built by passionate developers dedicated to creating exceptional community management solutions.
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {team.map((member, index) => (
                <motion.div
                  key={member.name}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.2 + index * 0.1 }}
                >
                  <Card className="text-center hover:shadow-2xl transition-all duration-300 border-0 bg-white dark:bg-slate-900 hover:scale-105 transform">
                    <CardHeader>
                      <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                        <span className="text-3xl font-bold text-white">
                          {member.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                        </span>
                      </div>
                      <CardTitle className="text-xl font-bold">
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
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Contact Section */}
        <section className="py-24 px-4">
          <div className="container mx-auto max-w-4xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <Card className="border-0 bg-white dark:bg-slate-900 shadow-2xl">
                <CardHeader className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                    <Mail className="w-8 h-8 text-white" />
                  </div>
                  <CardTitle className="text-4xl font-bold mb-4">
                    Get in Touch
                  </CardTitle>
                  <CardDescription className="text-lg">
                    Interested in becoming a community admin? Contact us to get started.
                  </CardDescription>
                </CardHeader>
                <CardContent className="text-center">
                  <p className="text-slate-600 dark:text-slate-400 mb-6">
                    For admin registration and enterprise inquiries:
                  </p>
                  <a 
                    href="mailto:abhinav.sadineni@gmail.com"
                    className="inline-flex items-center space-x-2 text-2xl font-semibold text-blue-600 dark:text-blue-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
                  >
                    <Mail className="w-6 h-6" />
                    <span>abhinav.sadineni@gmail.com</span>
                  </a>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-slate-200/50 dark:border-slate-800/50 py-12 px-4 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl">
          <div className="container mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
              <div>
                <div className="flex items-center space-x-3 mb-4">
                  <CircleInLogo className="w-8 h-8" />
                  <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    CircleIn
                  </span>
                </div>
                <p className="text-slate-600 dark:text-slate-400">
                  Enterprise-grade community management platform for modern residential communities.
                </p>
              </div>
              
              <div>
                <h3 className="font-bold mb-4 text-slate-900 dark:text-white">Product</h3>
                <ul className="space-y-2 text-slate-600 dark:text-slate-400">
                  <li><Link href="/auth/signup" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Features</Link></li>
                  <li><Link href="/auth/signup" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Pricing</Link></li>
                  <li><Link href="/auth/signup" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Security</Link></li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-bold mb-4 text-slate-900 dark:text-white">Company</h3>
                <ul className="space-y-2 text-slate-600 dark:text-slate-400">
                  <li><Link href="/auth/signup" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">About</Link></li>
                  <li><Link href="mailto:abhinav.sadineni@gmail.com" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Contact</Link></li>
                  <li><Link href="/auth/signup" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Careers</Link></li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-bold mb-4 text-slate-900 dark:text-white">Legal</h3>
                <ul className="space-y-2 text-slate-600 dark:text-slate-400">
                  <li><Link href="/auth/signup" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Privacy</Link></li>
                  <li><Link href="/auth/signup" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Terms</Link></li>
                  <li><Link href="/auth/signup" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Security</Link></li>
                </ul>
              </div>
            </div>
            
            <div className="border-t border-slate-200 dark:border-slate-800 pt-8 text-center">
              <p className="text-slate-600 dark:text-slate-400">
                © 2025 CircleIn. All rights reserved. Built with ❤️ for modern communities.
              </p>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}