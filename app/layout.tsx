import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import dynamic from 'next/dynamic';
import { AuthProvider } from '@/components/providers/auth-provider';
import { ThemeProvider } from '@/components/providers/theme-provider';
import { NotificationProvider } from '@/components/notifications/NotificationSystem';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';
import LoadingScreen from '@/components/LoadingScreen';

// Import debug functions to make them available in browser console
import '@/lib/debug-notifications';

// Dynamic imports for better performance
const ToastContainer = dynamic(
  () => import('@/components/notifications/ToastNotifications').then(mod => ({ default: mod.ToastContainer })),
  { ssr: false, loading: () => null }
);
const Toaster = dynamic(() => import('@/components/ui/sonner').then(mod => ({ default: mod.Toaster })), { ssr: false, loading: () => null });

// Optimize font loading with minimal subsetting
const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap',
  preload: true,
  adjustFontFallback: true,
  fallback: ['system-ui', 'arial'],
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: {
    default: 'CircleIn - Enterprise Community Management Platform | Smart Booking & AI-Powered Solutions',
    template: '%s | CircleIn',
  },
  description: 'Transform your community management with CircleIn. Enterprise-grade booking system, AI-powered chatbot, real-time notifications, and bank-level security. Built with cutting-edge technology for modern communities.',
  keywords: ['community management', 'amenity booking', 'residential management', 'HOA software', 'AI chatbot', 'smart reminders', 'enterprise security', 'real-time notifications'],
  authors: [{ name: 'CircleIn Team', url: 'https://circlein-app.vercel.app' }],
  creator: 'CircleIn',
  publisher: 'CircleIn',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  manifest: '/manifest.json',
  metadataBase: new URL('https://circlein-app.vercel.app'),
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://circlein-app.vercel.app',
    title: 'CircleIn - Enterprise Community Management Platform',
    description: 'Experience the future of community management with AI-powered booking, real-time notifications, and enterprise-grade security.',
    siteName: 'CircleIn',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'CircleIn - Community Management Platform',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CircleIn - Enterprise Community Management',
    description: 'Transform your community with AI-powered booking and enterprise-grade security.',
    images: ['/og-image.png'],
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
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0f172a' },
  ],
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 5,
    userScalable: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/logo.svg" type="image/svg+xml" />
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/logo.svg" />
        <link rel="shortcut icon" href="/logo.svg" />
        <meta name="theme-color" content="#3B82F6" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="mobile-web-app-capable" content="yes" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                if (typeof window !== 'undefined') {
                  // Set theme immediately to prevent flash
                  const theme = localStorage.getItem('circlein-theme') || 'dark';
                  document.documentElement.classList.add(theme);
                }
              } catch (e) {}
            `,
          }}
        />
      </head>
      <body className={inter.className}>
        <LoadingScreen />
        <AuthProvider>
          <ThemeProvider defaultTheme="dark" storageKey="circlein-theme">
            <NotificationProvider>
              {children}
              <ToastContainer />
              <Toaster />
            </NotificationProvider>
          </ThemeProvider>
        </AuthProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}