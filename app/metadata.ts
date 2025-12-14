import { Metadata } from 'next';

export const landingMetadata: Metadata = {
  title: 'CircleIn - Enterprise Community Management Platform | Smart Booking & AI-Powered Solutions',
  description: 'Transform your community management with CircleIn. Enterprise-grade booking system, AI-powered chatbot, real-time notifications, and bank-level security. Built with cutting-edge technology for modern communities.',
  keywords: [
    'community management',
    'amenity booking',
    'residential management',
    'HOA software',
    'community booking system',
    'AI chatbot',
    'smart reminders',
    'enterprise security',
    'real-time notifications',
    'property management',
    'apartment management',
    'condo management',
    'community portal'
  ],
  authors: [{ name: 'CircleIn Team', url: 'https://circlein-app.vercel.app' }],
  creator: 'CircleIn',
  publisher: 'CircleIn',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://circlein-app.vercel.app'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://circlein-app.vercel.app',
    title: 'CircleIn - Enterprise Community Management Platform',
    description: 'Experience the future of community management with AI-powered booking, real-time notifications, and enterprise-grade security. Built for modern communities.',
    siteName: 'CircleIn',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'CircleIn - Community Management Platform',
        type: 'image/png',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CircleIn - Enterprise Community Management',
    description: 'Transform your community with AI-powered booking and enterprise-grade security. Built with cutting-edge technology.',
    images: ['/og-image.png'],
    creator: '@CircleInApp',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon-16x16.png',
    apple: '/apple-touch-icon.png',
  },
  manifest: '/manifest.json',
};

export const structuredData = {
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
  aggregateRating: {
    '@type': 'AggregateRating',
    ratingValue: '4.9',
    ratingCount: '500',
  },
  description: 'Enterprise-grade community management platform with AI-powered booking, real-time notifications, and enterprise security.',
  featureList: [
    'Smart Booking System',
    'AI-Powered Chatbot',
    'Real-time Notifications',
    'Enterprise Security',
    'Community Management',
    'Smart Reminders',
  ],
};

export const organizationData = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'CircleIn',
  url: 'https://circlein-app.vercel.app',
  logo: 'https://circlein-app.vercel.app/logo.png',
  description: 'CircleIn provides enterprise-grade community management solutions for modern residential communities.',
  contactPoint: {
    '@type': 'ContactPoint',
    email: 'abhinav.sadineni@gmail.com',
    contactType: 'Customer Service',
  },
  sameAs: [
    'https://twitter.com/CircleInApp',
    'https://linkedin.com/company/circlein',
  ],
};
