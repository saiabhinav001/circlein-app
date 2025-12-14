'use client';

import { motion } from 'framer-motion';
import { Shield, Lock, Key, Database, Eye, Server, AlertOctagon, CheckCircle2, FileKey, ShieldCheck, Globe, Bell } from 'lucide-react';
import Link from 'next/link';
import { CircleInLogo } from '@/components/ui';

export default function SecurityPage() {
  const securityFeatures = [
    {
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
      icon: Database,
      title: 'Data Protection',
      description: 'Your data is protected with enterprise-grade security measures and redundancy.',
      features: [
        'Encrypted database storage',
        'Automated daily backups',
        'Geographic data redundancy',
        '99.9% uptime SLA',
        'Point-in-time recovery',
        'Disaster recovery plan'
      ]
    },
    {
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
      icon: AlertOctagon,
      title: 'Threat Detection',
      description: 'Proactive monitoring and detection systems protect against security threats.',
      features: [
        '24/7 security monitoring',
        'Intrusion detection systems',
        'Automated threat response',
        'Anomaly detection',
        'Vulnerability scanning',
        'Penetration testing'
      ]
    }
  ];

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

  const securityCertifications = [
    { name: 'SOC 2 Type II', status: 'Certified' },
    { name: 'ISO 27001', status: 'Compliant' },
    { name: 'GDPR', status: 'Compliant' },
    { name: 'CCPA', status: 'Compliant' },
    { name: 'PCI DSS', status: 'Level 1' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3 group">
              <CircleInLogo className="w-10 h-10" />
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                CircleIn
              </span>
            </Link>
            <Link href="/">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-medium hover:shadow-lg transition-shadow"
              >
                Back to Home
              </motion.button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-16 px-6">
        <div className="container mx-auto max-w-6xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-3 px-4 py-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-full mb-6">
              <Shield className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400">Enterprise-Grade Security</span>
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-6">
              Security & <span className="bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent">Compliance</span>
            </h1>
            <p className="text-xl text-slate-600 dark:text-slate-400 max-w-3xl mx-auto mb-8">
              Your trust is our priority. CircleIn is built with security at its core, protecting your community data with enterprise-grade security measures.
            </p>
            
            {/* Security Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto mt-12">
              <div className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-800">
                <div className="text-3xl font-bold text-emerald-600 dark:text-emerald-400 mb-2">99.9%</div>
                <div className="text-sm text-slate-600 dark:text-slate-400">Uptime SLA</div>
              </div>
              <div className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-800">
                <div className="text-3xl font-bold text-emerald-600 dark:text-emerald-400 mb-2">24/7</div>
                <div className="text-sm text-slate-600 dark:text-slate-400">Monitoring</div>
              </div>
              <div className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-800">
                <div className="text-3xl font-bold text-emerald-600 dark:text-emerald-400 mb-2">AES-256</div>
                <div className="text-sm text-slate-600 dark:text-slate-400">Encryption</div>
              </div>
              <div className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-800">
                <div className="text-3xl font-bold text-emerald-600 dark:text-emerald-400 mb-2">SOC 2</div>
                <div className="text-sm text-slate-600 dark:text-slate-400">Certified</div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Security Features Grid */}
      <section className="pb-16 px-6">
        <div className="container mx-auto max-w-6xl">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-3xl font-bold text-center mb-12"
          >
            Comprehensive <span className="bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent">Security Features</span>
          </motion.h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {securityFeatures.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-lg border border-slate-200 dark:border-slate-800 hover:shadow-xl transition-shadow"
              >
                <div className="p-3 bg-gradient-to-br from-emerald-500 to-blue-500 rounded-xl w-fit mb-4">
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">
                  {feature.title}
                </h3>
                <p className="text-slate-600 dark:text-slate-400 mb-4 leading-relaxed">
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
        </div>
      </section>

      {/* Security Practices */}
      <section className="pb-16 px-6">
        <div className="container mx-auto max-w-6xl">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-3xl font-bold text-center mb-12"
          >
            Security <span className="bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent">Best Practices</span>
          </motion.h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            {securityPractices.map((practice, index) => (
              <motion.div
                key={practice.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="bg-white dark:bg-slate-900 rounded-2xl p-8 shadow-lg border border-slate-200 dark:border-slate-800"
              >
                <div className="flex items-center gap-4 mb-6">
                  <div className="p-3 bg-gradient-to-br from-emerald-500 to-blue-500 rounded-xl">
                    <practice.icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
                    {practice.title}
                  </h3>
                </div>
                <ul className="space-y-3">
                  {practice.items.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-3 text-slate-600 dark:text-slate-400">
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Certifications */}
      <section className="pb-16 px-6">
        <div className="container mx-auto max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="bg-gradient-to-br from-emerald-500 to-blue-500 rounded-2xl p-8 text-white"
          >
            <h2 className="text-3xl font-bold mb-6 text-center">Security Certifications & Compliance</h2>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {securityCertifications.map((cert, index) => (
                <div key={index} className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center">
                  <div className="font-bold mb-1">{cert.name}</div>
                  <div className="text-sm text-emerald-100">{cert.status}</div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Vulnerability Reporting */}
      <section className="pb-20 px-6">
        <div className="container mx-auto max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="bg-white dark:bg-slate-900 rounded-2xl p-8 shadow-lg border border-slate-200 dark:border-slate-800"
          >
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-gradient-to-br from-red-500 to-orange-500 rounded-xl">
                <AlertOctagon className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                Responsible Disclosure
              </h2>
            </div>
            <p className="text-slate-600 dark:text-slate-400 mb-6 leading-relaxed">
              We take security vulnerabilities seriously. If you discover a security issue, please report it responsibly 
              so we can address it promptly and protect our users.
            </p>
            <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-6 space-y-4">
              <div>
                <h3 className="font-semibold text-slate-900 dark:text-white mb-2">Report Security Issues To:</h3>
                <p className="text-slate-600 dark:text-slate-400">security@circlein.app</p>
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 dark:text-white mb-2">PGP Key:</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 font-mono">Available upon request</p>
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 dark:text-white mb-2">Response Time:</h3>
                <p className="text-slate-600 dark:text-slate-400">Initial response within 24 hours</p>
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 dark:text-white mb-2">Bug Bounty Program:</h3>
                <p className="text-slate-600 dark:text-slate-400">Coming soon - details to be announced</p>
              </div>
            </div>
          </motion.div>

          {/* Contact */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mt-8 bg-slate-100 dark:bg-slate-800 rounded-xl p-6"
          >
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-3">
              Security Questions?
            </h3>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
              For general security inquiries, compliance questions, or to request our security documentation, 
              please contact our security team.
            </p>
            <div className="space-y-2 text-slate-600 dark:text-slate-400">
              <p><strong className="text-slate-900 dark:text-white">Email:</strong> security@circlein.app</p>
              <p><strong className="text-slate-900 dark:text-white">Security Team:</strong> Available 24/7 for critical issues</p>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
