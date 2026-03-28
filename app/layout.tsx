import './globals.css';
import type { Metadata, Viewport } from 'next';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import { AuthProvider } from '@/components/providers/auth-provider';
import { ThemeProvider } from '@/components/providers/theme-provider';
import { CommunityBrandingProvider } from '@/components/providers/community-branding-provider';
import { NotificationProvider } from '@/components/notifications/notification-system';
import PushNotificationsManager from '@/components/notifications/push-notifications-manager';
import { ToastContainer } from '@/components/notifications/toast-notifications';
import AppInstallBanner from '@/components/pwa/app-install-banner';
import DevServiceWorkerCleanup from '@/components/pwa/dev-service-worker-cleanup';
import { Toaster } from '@/components/ui/sonner';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';
import AppLoaderScreen from '@/components/loading-screen';

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
  manifest: '/manifest.webmanifest',
  metadataBase: new URL('https://circlein-app.vercel.app'),
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/favicon.png', sizes: '32x32', type: 'image/png' },
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
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
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#FAFAF9' },
    { media: '(prefers-color-scheme: dark)', color: '#0C0C0D' },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon.png" />
        <link rel="icon" type="image/png" sizes="192x192" href="/icon-192.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <meta name="theme-color" content="#FAFAF9" />
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

                  // Capture install prompt early to avoid repetitive browser-level prompting
                  if (!window.__circleinInstallPromptInterceptorRegistered) {
                    window.__circleinInstallPromptInterceptorRegistered = true;
                    window.__circleinDeferredInstallPrompt = null;

                    window.addEventListener('beforeinstallprompt', function(event) {
                      event.preventDefault();
                      window.__circleinDeferredInstallPrompt = event;
                    });

                    window.addEventListener('appinstalled', function() {
                      try {
                        localStorage.setItem('circlein-pwa-installed', 'true');
                      } catch (e) {}
                      window.__circleinDeferredInstallPrompt = null;
                    });
                  }
                }
              } catch (e) {}
            `,
          }}
        />
      </head>
      <body className={`${GeistSans.variable} ${GeistMono.variable} ${GeistSans.className}`}>
        <DevServiceWorkerCleanup />
        <AppLoaderScreen />
        <AuthProvider>
          <ThemeProvider defaultTheme="dark" storageKey="circlein-theme">
            <CommunityBrandingProvider>
              <NotificationProvider>
                {children}
                <PushNotificationsManager />
                <AppInstallBanner />
                <ToastContainer />
                <Toaster />
              </NotificationProvider>
            </CommunityBrandingProvider>
          </ThemeProvider>
        </AuthProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}