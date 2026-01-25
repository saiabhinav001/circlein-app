'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Scale, FileCheck, AlertTriangle, Ban, Shield, UserX, Gavel, Mail, ArrowLeft, ChevronRight, Menu, X } from 'lucide-react';
import Link from 'next/link';
import { CircleInLogo } from '@/components/ui';

// Terms sections with all original legal content preserved
const sections = [
  {
    id: 'agreement',
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
    id: 'accounts',
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
    id: 'acceptable-use',
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
    id: 'intellectual-property',
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
    id: 'disclaimers',
    icon: AlertTriangle,
    title: 'Disclaimers and Limitations',
    isImportant: true,
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
    id: 'liability',
    icon: UserX,
    title: 'Limitation of Liability',
    isImportant: true,
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
    id: 'disputes',
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
    id: 'modifications',
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

export default function TermsOfServicePage() {
  const [activeSection, setActiveSection] = useState('agreement');
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
      
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
            backgroundImage: 'radial-gradient(rgba(139,92,246,0.3) 1px, transparent 1px)',
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
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-violet-50 dark:bg-violet-950/50 border border-violet-200/50 dark:border-violet-800/50 mb-6">
              <Scale className="w-4 h-4 text-violet-600 dark:text-violet-400" />
              <span className="text-sm font-medium text-violet-700 dark:text-violet-300">
                Legal Agreement
              </span>
            </div>
            
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-slate-900 dark:text-white mb-4">
              Terms of Service
            </h1>
            
            <p className="text-lg text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
              These Terms of Service govern your use of CircleIn. Please read them carefully before using our platform.
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
                            ? 'bg-violet-50 dark:bg-violet-950/50 text-violet-700 dark:text-violet-300 font-medium'
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
                            ? 'bg-violet-50 dark:bg-violet-950/50 text-violet-700 dark:text-violet-300 font-medium'
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
                    <div className={`rounded-2xl border p-6 md:p-8 ${
                      section.isImportant 
                        ? 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-200/80 dark:border-amber-800/50'
                        : 'bg-white dark:bg-slate-900/50 border-slate-200/80 dark:border-slate-800/80'
                    }`}>
                      {/* Section Header */}
                      <div className={`flex items-center gap-4 mb-6 pb-6 border-b ${
                        section.isImportant 
                          ? 'border-amber-200 dark:border-amber-800/50'
                          : 'border-slate-100 dark:border-slate-800'
                      }`}>
                        <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${
                          section.isImportant 
                            ? 'bg-amber-100 dark:bg-amber-900/50'
                            : 'bg-violet-50 dark:bg-violet-950/50'
                        }`}>
                          <section.icon className={`w-5 h-5 ${
                            section.isImportant 
                              ? 'text-amber-600 dark:text-amber-400'
                              : 'text-violet-600 dark:text-violet-400'
                          }`} />
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
                            <p className={`leading-relaxed text-[15px] ${
                              item.text.startsWith('TO THE') || item.text.startsWith('THE SERVICE') || item.text.startsWith('IN NO EVENT')
                                ? 'text-slate-700 dark:text-slate-300 font-medium'
                                : 'text-slate-600 dark:text-slate-400'
                            }`}>
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
                  className="bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700 rounded-2xl p-6 md:p-8 text-white"
                >
                  <h2 className="text-xl md:text-2xl font-semibold mb-4">
                    Questions About These Terms?
                  </h2>
                  <p className="text-violet-100 mb-6 leading-relaxed">
                    If you have any questions about these Terms of Service, please contact our legal team.
                  </p>
                  <div className="grid sm:grid-cols-3 gap-4 text-sm">
                    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                      <p className="text-violet-200 mb-1">Email</p>
                      <p className="font-medium">legal@circlein.app</p>
                    </div>
                    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                      <p className="text-violet-200 mb-1">Legal Department</p>
                      <p className="font-medium">Mon-Fri, 9 AM - 5 PM EST</p>
                    </div>
                    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                      <p className="text-violet-200 mb-1">Response Time</p>
                      <p className="font-medium">Within 72 hours</p>
                    </div>
                  </div>
                </motion.section>

                {/* Important Notice */}
                <motion.section
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4 }}
                  className="bg-amber-50 dark:bg-amber-950/30 rounded-2xl border border-amber-200 dark:border-amber-800/50 p-6 md:p-8"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center flex-shrink-0">
                      <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-amber-900 dark:text-amber-200 mb-2">
                        Important Notice
                      </h3>
                      <p className="text-amber-800 dark:text-amber-300 leading-relaxed text-[15px]">
                        By using CircleIn, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service 
                        and our Privacy Policy. These Terms constitute a legally binding agreement between you and CircleIn. If you do not 
                        agree to these Terms, you must not use the Service.
                      </p>
                    </div>
                  </div>
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
              <Link href="/privacy" className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">
                Privacy
              </Link>
              <Link href="/terms" className="text-violet-600 dark:text-violet-400 font-medium">
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
