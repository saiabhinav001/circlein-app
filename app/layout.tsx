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
  title: 'CircleIn - Community Amenity Booking',
  description: 'Book and manage community amenities with ease',
  manifest: '/manifest.json',
  themeColor: '#3B82F6',
  icons: {
    icon: [
      { url: '/favicon.svg?v=2', type: 'image/svg+xml' },
      { url: '/icon-192x192.svg?v=2', sizes: '192x192', type: 'image/svg+xml' },
    ],
    apple: [
      { url: '/apple-touch-icon.svg?v=2', type: 'image/svg+xml' },
    ],
  },
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 5,
  },
  robots: {
    index: true,
    follow: true,
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
        <link rel="icon" type="image/svg+xml" href="/favicon.svg?v=2" />
        <link rel="icon" sizes="192x192" href="/icon-192x192.svg?v=2" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.svg?v=2" />
        <meta name="theme-color" content="#3B82F6" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                // Clear any cached logo preferences
                if (typeof window !== 'undefined') {
                  // Remove any old loading screen cache
                  localStorage.removeItem('circlein-loading-shown');
                  localStorage.removeItem('circlein-last-loading-shown');
                  sessionStorage.removeItem('circlein-loading-shown');
                  
                  // Set theme
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