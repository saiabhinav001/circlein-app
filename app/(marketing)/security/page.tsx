'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Shield, Lock, Key, Database, Eye, Server, AlertOctagon, CheckCircle2, FileKey, ShieldCheck, Globe, Bell, ArrowLeft, ChevronRight, Menu, X } from 'lucide-react';
import Link from 'next/link';
import { CircleInLogo } from '@/components/ui';

// Security features - original content preserved
const securityFeatures = [
  {
    id: 'encryption',
    icon: Lock,
    title: 'End-to-End Encryption',
    description: 'All data transmitted between your device and our servers is encrypted using TLS 1.3, the latest and most secure encryption protocol.',
    features: [
      'AES-256 encryption at rest',
      'TLS 1.3 encryption in transit',
      'Perfect Forward Secrecy',
      'Zero-knowledge architecture where possible'
    ]
  },
  {
    id: 'authentication',
    icon: Key,
    title: 'Authentication & Access Control',
    description: 'Multiple layers of authentication ensure only authorized users can access your community data.',
    features: [
      'Multi-factor authentication (MFA)',
      'OAuth 2.0 with Google Sign-In',
      'Secure session management',
      'Role-based access control (RBAC)',
      'Account lockout after failed attempts',
      'Automatic session timeout'
    ]
  },
  {
    id: 'data-protection',
    icon: Database,
    title: 'Data Protection',
    description: 'Your data is protected with enterprise-grade security measures and redundancy.',
    features: [
      'Encrypted database storage',
      'Automated daily backups',
      'Geographic data redundancy',
      'Point-in-time recovery',
      'Disaster recovery plan'
    ]
  },
  {
    id: 'infrastructure',
    icon: Server,
    title: 'Infrastructure Security',
    description: 'Built on Google Cloud Platform and Vercel, leveraging world-class security infrastructure.',
    features: [
      'SOC 2 Type II certified hosting',
      'ISO 27001 compliant infrastructure',
      'DDoS protection',
      'Firewall protection',
      'Regular security updates',
      'Network isolation'
    ]
  },
  {
    id: 'privacy-controls',
    icon: Eye,
    title: 'Privacy Controls',
    description: 'You control your data with comprehensive privacy settings and transparency.',
    features: [
      'Granular privacy settings',
      'Data export capabilities',
      'Right to deletion',
      'Consent management',
      'Activity logs and audit trails',
      'Transparent data usage'
    ]
  },
  {
    id: 'threat-detection',
    icon: AlertOctagon,
    title: 'Threat Detection',
    description: 'Proactive monitoring and detection systems protect against security threats.',
    features: [
      'Continuous security monitoring',
      'Intrusion detection systems',
      'Automated threat response',
      'Anomaly detection',
      'Vulnerability scanning',
      'Penetration testing'
    ]
  }
];

// Security practices - original content preserved
const securityPractices = [
  {
    icon: FileKey,
    title: 'Security Development',
    items: [
      'Secure coding practices and standards',
      'Regular code security reviews',
      'Dependency vulnerability scanning',
      'Static and dynamic code analysis',
      'Security-focused QA testing'
    ]
  },
  {
    icon: ShieldCheck,
    title: 'Team & Training',
    items: [
      'Background checks for all employees',
      'Regular security awareness training',
      'Strict access control policies',
      'Non-disclosure agreements',
      'Security incident response training'
    ]
  },
  {
    icon: Globe,
    title: 'Compliance',
    items: [
      'GDPR compliant',
      'CCPA compliant',
      'SOC 2 Type II certified',
      'Regular compliance audits',
      'Industry best practices'
    ]
  },
  {
    icon: Bell,
    title: 'Incident Response',
    items: [
      'Dedicated security response team',
      'Incident response plan',
      '24-hour breach notification',
      'Forensic analysis capabilities',
      'Post-incident reviews'
    ]
  }
];

// Navigation sections for TOC
const navSections = [
  { id: 'overview', title: 'Security Overview' },
  { id: 'features', title: 'Security Features' },
  { id: 'practices', title: 'Best Practices' },
  { id: 'compliance', title: 'Compliance' },
  { id: 'reporting', title: 'Vulnerability Reporting' },
];

export default function SecurityPage() {
  const [activeSection, setActiveSection] = useState('overview');
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
      
      const sectionElements = navSections.map(s => ({
        id: s.id,
        element: document.getElementById(s.id)
      }));
      
      for (const section of sectionElements.reverse()) {
        if (section.element) {
          const rect = section.element.getBoundingClientRect();
          if (rect.top <= 150) {
            setActiveSection(section.id);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      const offset = 100;
      const top = element.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top, behavior: 'smooth' });
    }
    setMobileNavOpen(false);
  };

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      {/* Subtle background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-slate-50 via-white to-slate-50/50 dark:from-slate-950 dark:via-slate-950 dark:to-slate-950" />
        <div 
          className="absolute inset-0 opacity-[0.3] dark:opacity-[0.1]"
          style={{
            backgroundImage: 'radial-gradient(rgba(16,185,129,0.3) 1px, transparent 1px)',
            backgroundSize: '32px 32px',
          }}
        />
      </div>

      {/* Header */}
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled 
          ? 'bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl border-b border-slate-200/50 dark:border-slate-800/50' 
          : 'bg-transparent'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 md:h-20">
            <Link href="/" className="flex items-center gap-3 group">
              <CircleInLogo className="w-9 h-9 md:w-10 md:h-10" />
              <span className="text-xl md:text-2xl font-bold bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 bg-clip-text text-transparent">
                CircleIn
              </span>
            </Link>
            
            <Link 
              href="/"
              className="flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors font-medium"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Back to Home</span>
            </Link>
          </div>
        </div>
      </header>

      <div className="pt-24 md:pt-32 pb-16 md:pb-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Hero */}
          <section id="overview" className="scroll-mt-28 mb-16 md:mb-20">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="max-w-3xl mb-12"
            >
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200/50 dark:border-emerald-800/50 mb-6">
                <Shield className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
                  Enterprise-Grade Security
                </span>
              </div>
              
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-slate-900 dark:text-white mb-4">
                Security & Compliance
              </h1>
              
              <p className="text-lg text-slate-600 dark:text-slate-400 leading-relaxed">
                Your trust is our priority. CircleIn is built with security at its core, protecting your community data with enterprise-grade security measures.
              </p>
            </motion.div>

            {/* Security Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="grid grid-cols-2 md:grid-cols-4 gap-4"
            >
              {[
                { label: 'Encryption', value: 'AES-256' },
                { label: 'Protocol', value: 'TLS 1.3' },
                { label: 'Compliance', value: 'SOC 2' },
                { label: 'Monitoring', value: 'Continuous' },
              ].map((stat, i) => (
                <div key={i} className="bg-white dark:bg-slate-900/50 rounded-xl border border-slate-200/80 dark:border-slate-800/80 p-5 text-center">
                  <div className="text-2xl md:text-3xl font-bold text-emerald-600 dark:text-emerald-400 mb-1">
                    {stat.value}
                  </div>
                  <div className="text-sm text-slate-600 dark:text-slate-400">
                    {stat.label}
                  </div>
                </div>
              ))}
            </motion.div>
          </section>

          <div className="lg:grid lg:grid-cols-[280px_1fr] lg:gap-12">
            {/* Mobile TOC Toggle */}
            <button
              onClick={() => setMobileNavOpen(!mobileNavOpen)}
              className="lg:hidden flex items-center justify-between w-full px-4 py-3 mb-6 bg-slate-100 dark:bg-slate-800/50 rounded-xl text-slate-700 dark:text-slate-300"
            >
              <span className="font-medium">Table of Contents</span>
              {mobileNavOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            {/* Table of Contents - Mobile */}
            {mobileNavOpen && (
              <motion.nav
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="lg:hidden mb-8 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden"
              >
                <ul className="p-2">
                  {navSections.map((section) => (
                    <li key={section.id}>
                      <button
                        onClick={() => scrollToSection(section.id)}
                        className={`w-full text-left px-4 py-3 rounded-lg text-sm transition-colors ${
                          activeSection === section.id
                            ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 font-medium'
                            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                        }`}
                      >
                        {section.title}
                      </button>
                    </li>
                  ))}
                </ul>
              </motion.nav>
            )}

            {/* Table of Contents - Desktop Sticky */}
            <aside className="hidden lg:block">
              <nav className="sticky top-28">
                <h3 className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-4">
                  On This Page
                </h3>
                <ul className="space-y-1">
                  {navSections.map((section) => (
                    <li key={section.id}>
                      <button
                        onClick={() => scrollToSection(section.id)}
                        className={`group w-full text-left px-3 py-2 rounded-lg text-sm transition-all duration-200 flex items-center gap-2 ${
                          activeSection === section.id
                            ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 font-medium'
                            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-white'
                        }`}
                      >
                        <ChevronRight className={`w-3 h-3 transition-transform ${
                          activeSection === section.id ? 'rotate-90' : ''
                        }`} />
                        {section.title}
                      </button>
                    </li>
                  ))}
                </ul>
              </nav>
            </aside>

            {/* Content */}
            <main className="min-w-0">
              <div className="space-y-12 md:space-y-16">
                {/* Security Features */}
                <section id="features" className="scroll-mt-28">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4 }}
                    className="mb-8"
                  >
                    <h2 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white mb-3">
                      Comprehensive Security Features
                    </h2>
                    <p className="text-slate-600 dark:text-slate-400">
                      Multiple layers of protection to keep your data safe.
                    </p>
                  </motion.div>

                  <div className="grid md:grid-cols-2 gap-6">
                    {securityFeatures.map((feature, index) => (
                      <motion.div
                        key={feature.id}
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: "-50px" }}
                        transition={{ duration: 0.4, delay: index * 0.05 }}
                        className="bg-white dark:bg-slate-900/50 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 p-6"
                      >
                        <div className="w-11 h-11 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center mb-4">
                          <feature.icon className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                          {feature.title}
                        </h3>
                        <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed mb-4">
                          {feature.description}
                        </p>
                        <ul className="space-y-2">
                          {feature.features.map((item, idx) => (
                            <li key={idx} className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-400">
                              <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </motion.div>
                    ))}
                  </div>
                </section>

                {/* Security Practices */}
                <section id="practices" className="scroll-mt-28">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4 }}
                    className="mb-8"
                  >
                    <h2 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white mb-3">
                      Security Best Practices
                    </h2>
                    <p className="text-slate-600 dark:text-slate-400">
                      Our commitment to security extends beyond technology.
                    </p>
                  </motion.div>

                  <div className="grid md:grid-cols-2 gap-6">
                    {securityPractices.map((practice, index) => (
                      <motion.div
                        key={practice.title}
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: "-50px" }}
                        transition={{ duration: 0.4, delay: index * 0.05 }}
                        className="bg-white dark:bg-slate-900/50 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 p-6"
                      >
                        <div className="flex items-center gap-4 mb-5">
                          <div className="w-11 h-11 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center">
                            <practice.icon className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                          </div>
                          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                            {practice.title}
                          </h3>
                        </div>
                        <ul className="space-y-2.5">
                          {practice.items.map((item, idx) => (
                            <li key={idx} className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-400">
                              <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </motion.div>
                    ))}
                  </div>
                </section>

                {/* Compliance */}
                <section id="compliance" className="scroll-mt-28">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4 }}
                    className="bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-700 rounded-2xl p-6 md:p-8 text-white"
                  >
                    <h2 className="text-xl md:text-2xl font-semibold mb-6 text-center">
                      Security Certifications & Compliance
                    </h2>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                      {[
                        { name: 'SOC 2 Type II', status: 'Certified' },
                        { name: 'ISO 27001', status: 'Compliant' },
                        { name: 'GDPR', status: 'Compliant' },
                        { name: 'CCPA', status: 'Compliant' },
                        { name: 'PCI DSS', status: 'Level 1' }
                      ].map((cert, index) => (
                        <div key={index} className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center">
                          <div className="font-semibold text-sm mb-1">{cert.name}</div>
                          <div className="text-xs text-emerald-100">{cert.status}</div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                </section>

                {/* Vulnerability Reporting */}
                <section id="reporting" className="scroll-mt-28">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4 }}
                    className="bg-white dark:bg-slate-900/50 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 p-6 md:p-8"
                  >
                    <div className="flex items-center gap-4 mb-6">
                      <div className="w-11 h-11 rounded-xl bg-amber-50 dark:bg-amber-950/50 flex items-center justify-center">
                        <AlertOctagon className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                      </div>
                      <h2 className="text-xl md:text-2xl font-semibold text-slate-900 dark:text-white">
                        Responsible Disclosure
                      </h2>
                    </div>
                    <p className="text-slate-600 dark:text-slate-400 mb-6 leading-relaxed">
                      We take security vulnerabilities seriously. If you discover a security issue, please report it responsibly 
                      so we can address it promptly and protect our users.
                    </p>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4">
                        <h3 className="font-semibold text-slate-900 dark:text-white text-sm mb-1">Report Security Issues To</h3>
                        <p className="text-slate-600 dark:text-slate-400 text-sm">security@circlein.app</p>
                      </div>
                      <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4">
                        <h3 className="font-semibold text-slate-900 dark:text-white text-sm mb-1">Response Time</h3>
                        <p className="text-slate-600 dark:text-slate-400 text-sm">Initial response within 24 hours</p>
                      </div>
                      <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4">
                        <h3 className="font-semibold text-slate-900 dark:text-white text-sm mb-1">PGP Key</h3>
                        <p className="text-slate-600 dark:text-slate-400 text-sm">Available upon request</p>
                      </div>
                      <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4">
                        <h3 className="font-semibold text-slate-900 dark:text-white text-sm mb-1">Bug Bounty Program</h3>
                        <p className="text-slate-600 dark:text-slate-400 text-sm">Coming soon</p>
                      </div>
                    </div>
                  </motion.div>

                  {/* Security Contact */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4 }}
                    className="mt-6 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 p-6"
                  >
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-3">
                      Security Questions?
                    </h3>
                    <p className="text-slate-600 dark:text-slate-400 leading-relaxed mb-4 text-[15px]">
                      For general security inquiries, compliance questions, or to request our security documentation, 
                      please contact our security team.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 text-sm">
                      <div>
                        <span className="font-medium text-slate-900 dark:text-white">Email:</span>
                        <span className="text-slate-600 dark:text-slate-400 ml-2">security@circlein.app</span>
                      </div>
                      <div>
                        <span className="font-medium text-slate-900 dark:text-white">Security Team:</span>
                        <span className="text-slate-600 dark:text-slate-400 ml-2">Available for critical issues</span>
                      </div>
                    </div>
                  </motion.div>
                </section>
              </div>
            </main>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              © 2026 CircleIn. All rights reserved.
            </p>
            <div className="flex items-center gap-6 text-sm">
              <Link href="/privacy" className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">
                Privacy
              </Link>
              <Link href="/terms" className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">
                Terms
              </Link>
              <Link href="/security" className="text-emerald-600 dark:text-emerald-400 font-medium">
                Security
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
