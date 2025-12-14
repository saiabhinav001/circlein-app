'use client';

import { motion } from 'framer-motion';
import { Scale, FileCheck, AlertTriangle, Ban, Shield, UserX, Gavel, Mail } from 'lucide-react';
import Link from 'next/link';
import { CircleInLogo } from '@/components/ui';

export default function TermsOfServicePage() {
  const sections = [
    {
      icon: FileCheck,
      title: 'Agreement to Terms',
      content: [
        {
          subtitle: 'Acceptance of Terms',
          text: 'By accessing or using CircleIn ("Service"), you agree to be bound by these Terms of Service ("Terms"). If you disagree with any part of these terms, you do not have permission to access the Service.'
        },
        {
          subtitle: 'Eligibility',
          text: 'You must be at least 18 years old or the age of legal majority in your jurisdiction to use this Service. By using CircleIn, you represent and warrant that you meet these eligibility requirements.'
        },
        {
          subtitle: 'Account Registration',
          text: 'You must register for an account to use certain features of the Service. You agree to provide accurate, current, and complete information during registration and to update such information to keep it accurate, current, and complete.'
        }
      ]
    },
    {
      icon: Shield,
      title: 'User Accounts and Security',
      content: [
        {
          subtitle: 'Account Responsibility',
          text: 'You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You agree to immediately notify us of any unauthorized use of your account.'
        },
        {
          subtitle: 'Account Security',
          text: 'You must not share your account credentials with others. We recommend using a strong, unique password and enabling two-factor authentication when available.'
        },
        {
          subtitle: 'Account Termination',
          text: 'We reserve the right to suspend or terminate your account if you violate these Terms or engage in fraudulent, abusive, or illegal activities.'
        }
      ]
    },
    {
      icon: Ban,
      title: 'Acceptable Use Policy',
      content: [
        {
          subtitle: 'Permitted Use',
          text: 'CircleIn is designed for community management, amenity booking, and resident communication within residential communities. You agree to use the Service only for its intended purposes.'
        },
        {
          subtitle: 'Prohibited Activities',
          text: 'You agree not to: (a) use the Service for any illegal purpose; (b) attempt to gain unauthorized access to any part of the Service; (c) interfere with or disrupt the Service or servers; (d) transmit viruses, malware, or harmful code; (e) harass, abuse, or harm other users; (f) impersonate any person or entity; (g) collect or harvest user data without permission; (h) use automated systems (bots) without authorization.'
        },
        {
          subtitle: 'Community Standards',
          text: 'You agree to respect other community members, follow your community rules and guidelines, and maintain a positive environment for all users.'
        },
        {
          subtitle: 'Booking Etiquette',
          text: 'When booking amenities, you agree to honor your reservations, cancel in advance if unable to attend, not make duplicate or fraudulent bookings, and respect booking limits and rules set by your community.'
        }
      ]
    },
    {
      icon: Scale,
      title: 'Intellectual Property Rights',
      content: [
        {
          subtitle: 'Our Content',
          text: 'The Service and its original content (excluding user-generated content), features, and functionality are owned by CircleIn and are protected by international copyright, trademark, patent, trade secret, and other intellectual property laws.'
        },
        {
          subtitle: 'Your Content',
          text: 'You retain ownership of any content you submit to the Service. By posting content, you grant us a worldwide, non-exclusive, royalty-free license to use, reproduce, modify, and display your content for the purpose of operating and improving the Service.'
        },
        {
          subtitle: 'Trademarks',
          text: 'CircleIn, the CircleIn logo, and other marks are trademarks of CircleIn. You may not use these marks without our prior written permission.'
        },
        {
          subtitle: 'DMCA Compliance',
          text: 'We respect intellectual property rights. If you believe your work has been copied in a way that constitutes copyright infringement, please contact us at dmca@circlein.app with detailed information.'
        }
      ]
    },
    {
      icon: AlertTriangle,
      title: 'Disclaimers and Limitations',
      content: [
        {
          subtitle: 'Service "As Is"',
          text: 'THE SERVICE IS PROVIDED ON AN "AS IS" AND "AS AVAILABLE" BASIS WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.'
        },
        {
          subtitle: 'No Guarantee',
          text: 'We do not guarantee that the Service will be uninterrupted, secure, or error-free. We do not warrant the accuracy or completeness of any content on the Service.'
        },
        {
          subtitle: 'Third-Party Services',
          text: 'The Service may contain links to third-party websites or services that are not owned or controlled by CircleIn. We have no control over and assume no responsibility for the content, privacy policies, or practices of any third-party services.'
        },
        {
          subtitle: 'Community Management',
          text: 'CircleIn provides tools for community management, but we are not responsible for the actions, decisions, or policies of community administrators or residents.'
        }
      ]
    },
    {
      icon: UserX,
      title: 'Limitation of Liability',
      content: [
        {
          subtitle: 'Damages Limitation',
          text: 'TO THE FULLEST EXTENT PERMITTED BY LAW, CIRCLEIN SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS OR REVENUES, WHETHER INCURRED DIRECTLY OR INDIRECTLY, OR ANY LOSS OF DATA, USE, GOODWILL, OR OTHER INTANGIBLE LOSSES.'
        },
        {
          subtitle: 'Maximum Liability',
          text: 'IN NO EVENT SHALL CIRCLEIN\'S TOTAL LIABILITY TO YOU FOR ALL DAMAGES, LOSSES, AND CAUSES OF ACTION EXCEED THE AMOUNT PAID BY YOU TO CIRCLEIN IN THE TWELVE (12) MONTHS PRECEDING THE CLAIM, OR ONE HUNDRED DOLLARS ($100), WHICHEVER IS GREATER.'
        },
        {
          subtitle: 'Jurisdictional Limitations',
          text: 'Some jurisdictions do not allow the exclusion of certain warranties or the limitation of liability for incidental or consequential damages. In such jurisdictions, our liability will be limited to the maximum extent permitted by law.'
        }
      ]
    },
    {
      icon: Gavel,
      title: 'Dispute Resolution',
      content: [
        {
          subtitle: 'Governing Law',
          text: 'These Terms shall be governed by and construed in accordance with the laws of the jurisdiction in which CircleIn operates, without regard to its conflict of law provisions.'
        },
        {
          subtitle: 'Informal Resolution',
          text: 'In the event of any dispute, claim, or controversy arising out of or relating to these Terms, you agree to first contact us at legal@circlein.app to attempt to resolve the dispute informally.'
        },
        {
          subtitle: 'Arbitration',
          text: 'If we cannot resolve the dispute informally within 60 days, any remaining dispute shall be resolved through binding arbitration in accordance with the rules of the American Arbitration Association or equivalent body in your jurisdiction.'
        },
        {
          subtitle: 'Class Action Waiver',
          text: 'You agree that any arbitration or legal proceeding shall be conducted on an individual basis and not as a class action, and you waive your right to participate in a class action lawsuit or class-wide arbitration.'
        },
        {
          subtitle: 'Exceptions',
          text: 'Either party may seek injunctive or equitable relief in court to prevent infringement of intellectual property rights or confidential information.'
        }
      ]
    },
    {
      icon: Mail,
      title: 'Modifications and Termination',
      content: [
        {
          subtitle: 'Changes to Terms',
          text: 'We reserve the right to modify these Terms at any time. If we make material changes, we will notify you by email or through a prominent notice on the Service at least 30 days before the changes take effect.'
        },
        {
          subtitle: 'Acceptance of Changes',
          text: 'Your continued use of the Service after the effective date of revised Terms constitutes acceptance of those changes. If you do not agree to the new Terms, you must stop using the Service.'
        },
        {
          subtitle: 'Service Modifications',
          text: 'We reserve the right to modify, suspend, or discontinue any part of the Service at any time, with or without notice, and without liability to you.'
        },
        {
          subtitle: 'Account Termination',
          text: 'You may terminate your account at any time by contacting support. We may terminate or suspend your account immediately, without prior notice, if you breach these Terms.'
        },
        {
          subtitle: 'Effect of Termination',
          text: 'Upon termination, your right to use the Service will immediately cease. All provisions of these Terms that by their nature should survive termination shall survive, including ownership provisions, warranty disclaimers, and limitations of liability.'
        }
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-purple-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
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
            <div className="inline-flex items-center gap-3 px-4 py-2 bg-purple-100 dark:bg-purple-900/30 rounded-full mb-6">
              <Scale className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              <span className="text-sm font-medium text-purple-600 dark:text-purple-400">Legal Agreement</span>
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-6">
              Terms of <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Service</span>
            </h1>
            <p className="text-xl text-slate-600 dark:text-slate-400 max-w-3xl mx-auto mb-4">
              These Terms of Service govern your use of CircleIn. Please read them carefully before using our platform.
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
                  <div className="p-3 bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl">
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
            className="mt-12 bg-gradient-to-br from-purple-500 to-blue-500 rounded-2xl p-8 text-white"
          >
            <h2 className="text-2xl font-bold mb-4">Questions About These Terms?</h2>
            <p className="text-purple-100 mb-6 leading-relaxed">
              If you have any questions about these Terms of Service, please contact our legal team.
            </p>
            <div className="space-y-2 text-purple-100">
              <p><strong className="text-white">Email:</strong> legal@circlein.app</p>
              <p><strong className="text-white">Legal Department:</strong> Available Monday-Friday, 9 AM - 5 PM EST</p>
              <p><strong className="text-white">Response Time:</strong> Within 72 hours</p>
            </div>
          </motion.div>

          {/* Important Notice */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.9 }}
            className="mt-8 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-6"
          >
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-6 h-6 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-lg font-semibold text-amber-900 dark:text-amber-200 mb-2">
                  Important Notice
                </h3>
                <p className="text-amber-800 dark:text-amber-300 leading-relaxed">
                  By using CircleIn, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service 
                  and our Privacy Policy. These Terms constitute a legally binding agreement between you and CircleIn. If you do not 
                  agree to these Terms, you must not use the Service.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
