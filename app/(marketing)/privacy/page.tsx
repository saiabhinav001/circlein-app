'use client';

import { motion } from 'framer-motion';
import { Shield, Lock, Eye, Database, UserCheck, Globe, FileText, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { CircleInLogo } from '@/components/ui';

export default function PrivacyPolicyPage() {
  const sections = [
    {
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
          text: 'Your data is automatically backed up to secure, geographically distributed servers with 99.9% uptime guarantee.'
        }
      ]
    },
    {
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
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
        <div className="container mx-auto max-w-4xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-3 px-4 py-2 bg-blue-100 dark:bg-blue-900/30 rounded-full mb-6">
              <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <span className="text-sm font-medium text-blue-600 dark:text-blue-400">Your Privacy Matters</span>
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-6">
              Privacy <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Policy</span>
            </h1>
            <p className="text-xl text-slate-600 dark:text-slate-400 max-w-3xl mx-auto mb-4">
              At CircleIn, we take your privacy seriously. This policy explains how we collect, use, protect, and share your personal information.
            </p>
            <p className="text-sm text-slate-500 dark:text-slate-500">
              Last Updated: December 14, 2025 | Effective Date: December 14, 2025
            </p>
          </motion.div>
        </div>
      </section>

      {/* Content Sections */}
      <section className="pb-20 px-6">
        <div className="container mx-auto max-w-4xl">
          <div className="space-y-12">
            {sections.map((section, index) => (
              <motion.div
                key={section.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="bg-white dark:bg-slate-900 rounded-2xl p-8 shadow-lg border border-slate-200 dark:border-slate-800"
              >
                <div className="flex items-center gap-4 mb-6">
                  <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl">
                    <section.icon className="w-6 h-6 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                    {section.title}
                  </h2>
                </div>
                <div className="space-y-6">
                  {section.content.map((item, idx) => (
                    <div key={idx} className="space-y-2">
                      <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200">
                        {item.subtitle}
                      </h3>
                      <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                        {item.text}
                      </p>
                    </div>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>

          {/* Contact Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.8 }}
            className="mt-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-2xl p-8 text-white"
          >
            <h2 className="text-2xl font-bold mb-4">Questions About Your Privacy?</h2>
            <p className="text-blue-100 mb-6 leading-relaxed">
              If you have any questions about this Privacy Policy, your data, or our privacy practices, please don't hesitate to contact us.
            </p>
            <div className="space-y-2 text-blue-100">
              <p><strong className="text-white">Email:</strong> privacy@circlein.app</p>
              <p><strong className="text-white">Data Protection Officer:</strong> dpo@circlein.app</p>
              <p><strong className="text-white">Response Time:</strong> Within 48 hours</p>
            </div>
          </motion.div>

          {/* Policy Updates */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.9 }}
            className="mt-8 bg-slate-100 dark:bg-slate-800 rounded-xl p-6"
          >
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-3">
              Changes to This Privacy Policy
            </h3>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              We may update this Privacy Policy from time to time to reflect changes in our practices or legal requirements. 
              We will notify you of any material changes by email or through a prominent notice on our platform at least 30 days 
              before the changes take effect. Your continued use of CircleIn after such changes constitutes acceptance of the updated policy.
            </p>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
