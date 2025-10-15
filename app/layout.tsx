import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { AuthProvider } from '@/components/providers/auth-provider';
import { ThemeProvider } from '@/components/providers/theme-provider';
import { NotificationProvider } from '@/components/notifications/NotificationSystem';
import { ToastContainer } from '@/components/notifications/ToastNotifications';
import { Toaster } from '@/components/ui/sonner';
import LoadingScreen from '@/components/LoadingScreen';
import { Analytics } from '@vercel/analytics/react';

// Import debug functions to make them available in browser console
import '@/lib/debug-notifications';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'CircleIn - Community Amenity Booking',
  description: 'Book and manage community amenities with ease',
  manifest: '/manifest.json',
  themeColor: '#3B82F6',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                if (typeof window !== 'undefined') {
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
      </body>
    </html>
  );
}