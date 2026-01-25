'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Shield, Lock, Eye, Database, UserCheck, Globe, FileText, AlertCircle, ArrowLeft, ChevronRight, Menu, X } from 'lucide-react';
import Link from 'next/link';
import { CircleInLogo } from '@/components/ui';

// Privacy policy sections with all original legal content preserved
const sections = [
  {
    id: 'information-collection',
    icon: FileText,
    title: 'Information We Collect',
    content: [
      {
        subtitle: 'Personal Information',
        text: 'When you register for CircleIn, we collect information such as your name, email address, phone number, residential address, and community affiliation. We also collect login credentials and authentication data to secure your account.'
      },
      {
        subtitle: 'Usage Information',
        text: 'We automatically collect information about how you interact with our services, including booking history, amenity preferences, notification settings, and device information (IP address, browser type, operating system).'
      },
      {
        subtitle: 'Communications',
        text: 'We collect information from your interactions with our AI chatbot, support requests, and any communications you send through our platform.'
      }
    ]
  },
  {
    id: 'information-use',
    icon: Database,
    title: 'How We Use Your Information',
    content: [
      {
        subtitle: 'Service Delivery',
        text: 'We use your information to provide, maintain, and improve our community management services, including processing bookings, sending notifications, and managing your community account.'
      },
      {
        subtitle: 'Communication',
        text: 'We send you service-related emails, booking confirmations, reminders, and important updates about your community. You can opt-out of non-essential communications at any time.'
      },
      {
        subtitle: 'Analytics and Improvement',
        text: 'We analyze usage patterns to improve our services, develop new features, and enhance user experience. All analytics are performed on aggregated, anonymized data.'
      },
      {
        subtitle: 'Security and Fraud Prevention',
        text: 'We use your information to protect against unauthorized access, detect and prevent fraud, and ensure the security of our platform and your data.'
      }
    ]
  },
  {
    id: 'data-security',
    icon: Lock,
    title: 'Data Security',
    content: [
      {
        subtitle: 'Encryption',
        text: 'All data is encrypted in transit using TLS 1.3 and at rest using AES-256 encryption. We use industry-standard security protocols to protect your information.'
      },
      {
        subtitle: 'Access Controls',
        text: 'We implement strict access controls and authentication mechanisms. Only authorized personnel have access to user data, and all access is logged and monitored.'
      },
      {
        subtitle: 'Regular Audits',
        text: 'We conduct regular security audits, vulnerability assessments, and penetration testing to ensure the highest level of data protection.'
      },
      {
        subtitle: 'Data Backup',
        text: 'Your data is automatically backed up to secure, geographically distributed servers to ensure continuity and protection.'
      }
    ]
  },
  {
    id: 'your-rights',
    icon: UserCheck,
    title: 'Your Rights',
    content: [
      {
        subtitle: 'Access and Portability',
        text: 'You have the right to access, download, and export your personal data at any time through your account settings.'
      },
      {
        subtitle: 'Correction and Update',
        text: 'You can update or correct your personal information directly in your account settings or by contacting our support team.'
      },
      {
        subtitle: 'Deletion',
        text: 'You have the right to request deletion of your personal data. Upon request, we will permanently delete your account and associated data within 30 days, except where required by law to retain certain information.'
      },
      {
        subtitle: 'Opt-Out',
        text: 'You can opt-out of marketing communications at any time. Essential service notifications cannot be disabled but you can control their frequency.'
      }
    ]
  },
  {
    id: 'data-sharing',
    icon: Globe,
    title: 'Data Sharing and Disclosure',
    content: [
      {
        subtitle: 'Community Administrators',
        text: 'Your name, contact information, and booking history may be visible to your community administrators for management purposes.'
      },
      {
        subtitle: 'Service Providers',
        text: 'We use trusted third-party service providers (Firebase, Vercel, Google Cloud) to host and deliver our services. These providers are contractually obligated to protect your data.'
      },
      {
        subtitle: 'Legal Requirements',
        text: 'We may disclose your information if required by law, legal process, or to protect the rights, property, or safety of CircleIn, our users, or others.'
      },
      {
        subtitle: 'No Sale of Data',
        text: 'We do not sell, rent, or trade your personal information to third parties for marketing purposes.'
      }
    ]
  },
  {
    id: 'cookies',
    icon: Eye,
    title: 'Cookies and Tracking',
    content: [
      {
        subtitle: 'Essential Cookies',
        text: 'We use essential cookies to maintain your session, remember your preferences, and ensure proper functionality of our services.'
      },
      {
        subtitle: 'Analytics',
        text: 'We use analytics cookies to understand how users interact with our platform and improve user experience. These are anonymized and aggregated.'
      },
      {
        subtitle: 'Your Control',
        text: 'You can control cookie preferences through your browser settings. Disabling essential cookies may affect service functionality.'
      }
    ]
  },
  {
    id: 'data-retention',
    icon: Shield,
    title: 'Data Retention',
    content: [
      {
        subtitle: 'Active Accounts',
        text: 'We retain your personal information for as long as your account is active or as needed to provide services to you.'
      },
      {
        subtitle: 'Deleted Accounts',
        text: 'After account deletion, we retain minimal information for legal compliance, dispute resolution, and fraud prevention for a period of 90 days, after which all data is permanently deleted.'
      },
      {
        subtitle: 'Backup Systems',
        text: 'Deleted data may persist in backup systems for up to 90 days before complete removal from all systems.'
      }
    ]
  },
  {
    id: 'international-transfers',
    icon: AlertCircle,
    title: 'International Data Transfers',
    content: [
      {
        subtitle: 'Global Infrastructure',
        text: 'Our services use cloud infrastructure that may store and process data in multiple countries, including the United States, European Union, and other regions.'
      },
      {
        subtitle: 'Data Protection',
        text: 'We ensure that all international data transfers comply with applicable data protection laws and implement appropriate safeguards.'
      },
      {
        subtitle: 'Standard Contractual Clauses',
        text: 'Where applicable, we use Standard Contractual Clauses approved by the European Commission to protect your data during international transfers.'
      }
    ]
  }
];

export default function PrivacyPolicyPage() {
  const [activeSection, setActiveSection] = useState('information-collection');
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
      
      // Update active section based on scroll position
      const sectionElements = sections.map(s => ({
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
            backgroundImage: 'radial-gradient(rgba(99,102,241,0.3) 1px, transparent 1px)',
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
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-3xl mb-12 md:mb-16"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200/50 dark:border-indigo-800/50 mb-6">
              <Shield className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span className="text-sm font-medium text-indigo-700 dark:text-indigo-300">
                Your Privacy Matters
              </span>
            </div>
            
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-slate-900 dark:text-white mb-4">
              Privacy Policy
            </h1>
            
            <p className="text-lg text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
              At CircleIn, we take your privacy seriously. This policy explains how we collect, use, protect, and share your personal information.
            </p>
            
            <p className="text-sm text-slate-500 dark:text-slate-500">
              Last Updated: December 14, 2025 · Effective Date: December 14, 2025
            </p>
          </motion.div>

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
                  {sections.map((section) => (
                    <li key={section.id}>
                      <button
                        onClick={() => scrollToSection(section.id)}
                        className={`w-full text-left px-4 py-3 rounded-lg text-sm transition-colors ${
                          activeSection === section.id
                            ? 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 font-medium'
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
                  {sections.map((section) => (
                    <li key={section.id}>
                      <button
                        onClick={() => scrollToSection(section.id)}
                        className={`group w-full text-left px-3 py-2 rounded-lg text-sm transition-all duration-200 flex items-center gap-2 ${
                          activeSection === section.id
                            ? 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 font-medium'
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
              <div className="space-y-8 md:space-y-12">
                {sections.map((section, index) => (
                  <motion.section
                    key={section.id}
                    id={section.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-50px" }}
                    transition={{ duration: 0.4, delay: index * 0.05 }}
                    className="scroll-mt-28"
                  >
                    <div className="bg-white dark:bg-slate-900/50 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 p-6 md:p-8">
                      {/* Section Header */}
                      <div className="flex items-center gap-4 mb-6 pb-6 border-b border-slate-100 dark:border-slate-800">
                        <div className="w-11 h-11 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 flex items-center justify-center flex-shrink-0">
                          <section.icon className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <h2 className="text-xl md:text-2xl font-semibold text-slate-900 dark:text-white">
                          {section.title}
                        </h2>
                      </div>

                      {/* Section Content */}
                      <div className="space-y-6">
                        {section.content.map((item, idx) => (
                          <div key={idx} className="group">
                            <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200 mb-2">
                              {item.subtitle}
                            </h3>
                            <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-[15px]">
                              {item.text}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </motion.section>
                ))}

                {/* Contact Section */}
                <motion.section
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4 }}
                  className="bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-700 rounded-2xl p-6 md:p-8 text-white"
                >
                  <h2 className="text-xl md:text-2xl font-semibold mb-4">
                    Questions About Your Privacy?
                  </h2>
                  <p className="text-indigo-100 mb-6 leading-relaxed">
                    If you have any questions about this Privacy Policy, your data, or our privacy practices, please don't hesitate to contact us.
                  </p>
                  <div className="grid sm:grid-cols-3 gap-4 text-sm">
                    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                      <p className="text-indigo-200 mb-1">Email</p>
                      <p className="font-medium">privacy@circlein.app</p>
                    </div>
                    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                      <p className="text-indigo-200 mb-1">Data Protection Officer</p>
                      <p className="font-medium">dpo@circlein.app</p>
                    </div>
                    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                      <p className="text-indigo-200 mb-1">Response Time</p>
                      <p className="font-medium">Within 48 hours</p>
                    </div>
                  </div>
                </motion.section>

                {/* Policy Updates Notice */}
                <motion.section
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4 }}
                  className="bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 p-6 md:p-8"
                >
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-3">
                    Changes to This Privacy Policy
                  </h3>
                  <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-[15px]">
                    We may update this Privacy Policy from time to time to reflect changes in our practices or legal requirements. 
                    We will notify you of any material changes by email or through a prominent notice on our platform at least 30 days 
                    before the changes take effect. Your continued use of CircleIn after such changes constitutes acceptance of the updated policy.
                  </p>
                </motion.section>
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
              <Link href="/privacy" className="text-indigo-600 dark:text-indigo-400 font-medium">
                Privacy
              </Link>
              <Link href="/terms" className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">
                Terms
              </Link>
              <Link href="/security" className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">
                Security
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
