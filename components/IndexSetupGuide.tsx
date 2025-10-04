import React, { useState, useEffect } from 'react';
import { AlertTriangle, ExternalLink, Clock, CheckCircle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { indexValidator } from '@/lib/index-validator';
import { useSession } from 'next-auth/react';

interface IndexSetupGuideProps {
  show?: boolean;
  communityId?: string;
  userEmail?: string;
  onDismiss?: () => void;
}

export function IndexSetupGuide({ show = true, communityId, userEmail, onDismiss }: IndexSetupGuideProps) {
  const { data: session } = useSession();
  const [isValidating, setIsValidating] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  
  const activeCommunityId = communityId || session?.user?.communityId || 'default-community';
  const activeUserEmail = userEmail || session?.user?.email || '';

  if (!show || isDismissed) return null;

  const handleRevalidate = async () => {
    if (!activeUserEmail) return;
    
    setIsValidating(true);
    try {
      // Clear cache and revalidate
      indexValidator.clearCache();
      const status = await indexValidator.validateIndexes(activeCommunityId, activeUserEmail);
      
      // If indexes are working, dismiss the guide
      if (status.userBookingsIndex && status.adminBookingsIndex) {
        setIsDismissed(true);
        onDismiss?.();
      }
    } catch (error) {
      console.error('Revalidation failed:', error);
    } finally {
      setIsValidating(false);
    }
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    onDismiss?.();
  };

  const openFirebaseConsole = () => {
    window.open('https://console.firebase.google.com', '_blank');
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Alert className="border-orange-200 bg-orange-50 relative">
        <AlertTriangle className="h-4 w-4 text-orange-600" />
        <AlertDescription className="text-orange-800 pr-8">
          <strong>Database indexes required for optimal performance.</strong> 
          The app is currently using simplified queries with limited functionality.
        </AlertDescription>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleDismiss}
          className="absolute top-2 right-2 h-6 w-6 p-0 text-orange-600 hover:text-orange-800"
        >
          <X className="h-4 w-4" />
        </Button>
      </Alert>

      <div className="bg-white rounded-lg border p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
              <Clock className="w-4 h-4 text-orange-600" />
            </div>
            <h2 className="text-xl font-semibold">Firestore Index Setup Required</h2>
          </div>
          <Button
            onClick={handleRevalidate}
            disabled={isValidating}
            variant="outline"
            size="sm"
          >
            {isValidating ? 'Checking...' : 'Check Again'}
          </Button>
        </div>

        <div className="space-y-4">
          <p className="text-gray-600">
            To enable full booking functionality, you need to create 2 composite indexes in Firebase Console.
            This is a one-time setup that takes 5-15 minutes.
          </p>

          <div className="flex gap-3">
            <Button 
              onClick={openFirebaseConsole}
              className="flex items-center gap-2 bg-orange-600 hover:bg-orange-700"
            >
              <ExternalLink className="w-4 h-4" />
              Open Firebase Console
            </Button>
            
            <Button
              onClick={handleDismiss}
              variant="outline"
            >
              I'll Set This Up Later
            </Button>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <h3 className="font-medium text-gray-900 flex items-center gap-2">
              <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-bold">1</span>
              Index 1: User Bookings
            </h3>
            <div className="bg-gray-50 p-4 rounded border text-sm">
              <div className="font-medium mb-2">Collection ID: <code>bookings</code></div>
              <div className="space-y-1">
                <div>• <code>userId</code> → Ascending</div>
                <div>• <code>communityId</code> → Ascending</div>
                <div>• <code>startTime</code> → Descending</div>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="font-medium text-gray-900 flex items-center gap-2">
              <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-bold">2</span>
              Index 2: Admin Bookings
            </h3>
            <div className="bg-gray-50 p-4 rounded border text-sm">
              <div className="font-medium mb-2">Collection ID: <code>bookings</code></div>
              <div className="space-y-1">
                <div>• <code>communityId</code> → Ascending</div>
                <div>• <code>startTime</code> → Descending</div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-blue-50 p-4 rounded border border-blue-200">
          <h4 className="font-medium text-blue-900 mb-2">Quick Steps:</h4>
          <ol className="text-sm text-blue-800 space-y-1">
            <li>1. Click "Open Firebase Console" above</li>
            <li>2. Select your project → <strong>Firestore Database</strong> → <strong>Indexes</strong></li>
            <li>3. Click <strong>"Create Index"</strong> for each index above</li>
            <li>4. Wait for both indexes to show "Enabled" status</li>
            <li>5. Refresh this page</li>
          </ol>
        </div>

        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Clock className="w-4 h-4" />
          <span>Index creation typically takes 5-15 minutes. You can continue using the app with limited functionality.</span>
        </div>
      </div>
    </div>
  );
}

export default IndexSetupGuide;