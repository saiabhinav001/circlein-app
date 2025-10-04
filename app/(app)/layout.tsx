import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { SearchProvider } from '@/components/providers/search-provider';
import { EnhancedNotificationListener } from '@/components/notifications/EnhancedNotificationListener';
// Enhanced notification system with beautiful real-time notifications

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SearchProvider>
      <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header />
          <main className="flex-1 overflow-auto">
            {children}
          </main>
        </div>
        <EnhancedNotificationListener />
      </div>
    </SearchProvider>
  );
}