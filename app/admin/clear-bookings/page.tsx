'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Trash2, AlertTriangle, CheckCircle2, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function ClearBookingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string; stats?: any } | null>(null);

  // Check if user is admin
  const isAdmin = (session?.user as any)?.role === 'admin';

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (status === 'unauthenticated' || !isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="text-red-600">Access Denied</CardTitle>
            <CardDescription>Admin access required</CardDescription>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                You must be logged in as an administrator to access this page.
              </AlertDescription>
            </Alert>
          </CardContent>
          <CardFooter>
            <Button onClick={() => router.push('/dashboard')} variant="outline" className="w-full">
              Go to Dashboard
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  const handleClearBookings = async () => {
    setIsDeleting(true);
    setResult(null);

    try {
      const response = await fetch('/api/admin/clear-bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          confirmationToken: 'CLEAR_ALL_BOOKINGS_CONFIRMED',
          communityId: (session?.user as any)?.communityId
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setResult({
          success: true,
          message: data.message,
          stats: data.stats
        });
        setShowConfirmation(false);
      } else {
        setResult({
          success: false,
          message: data.error || 'Failed to delete bookings'
        });
      }
    } catch (error) {
      setResult({
        success: false,
        message: error instanceof Error ? error.message : 'An error occurred'
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen p-4 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <Card className="max-w-2xl w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl">
            <Trash2 className="h-6 w-6 text-red-600" />
            Clear All Bookings
          </CardTitle>
          <CardDescription>
            Database maintenance utility for administrators
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Warning Alert */}
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="ml-2">
              <strong>⚠️ DANGER ZONE:</strong> This action will permanently delete ALL bookings from the database.
              The collection structure will be preserved, but all booking data will be lost.
            </AlertDescription>
          </Alert>

          {/* Info Section */}
          <div className="space-y-2 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
            <h3 className="font-semibold text-blue-900 dark:text-blue-100">What will happen:</h3>
            <ul className="list-disc list-inside space-y-1 text-sm text-blue-800 dark:text-blue-200">
              <li>All bookings will be permanently deleted</li>
              <li>The bookings collection will remain (empty)</li>
              <li>Your booking statistics will update in real-time</li>
              <li>Both admin and user views will reflect changes immediately</li>
              <li>This action cannot be undone</li>
            </ul>
          </div>

          {/* Result Display */}
          {result && (
            <Alert variant={result.success ? "default" : "destructive"}>
              {result.success ? (
                <CheckCircle2 className="h-4 w-4 text-green-600" />
              ) : (
                <AlertTriangle className="h-4 w-4" />
              )}
              <AlertDescription className="ml-2">
                <strong>{result.success ? '✅ Success!' : '❌ Error:'}</strong> {result.message}
                {result.stats && (
                  <div className="mt-2 text-sm">
                    <p>Bookings deleted: {result.stats.bookingsDeleted}</p>
                    <p>Events deleted: {result.stats.eventsDeleted}</p>
                    <p>Timestamp: {new Date(result.stats.timestamp).toLocaleString()}</p>
                  </div>
                )}
              </AlertDescription>
            </Alert>
          )}

          {/* Confirmation Step */}
          {showConfirmation ? (
            <div className="space-y-4 p-4 border-2 border-red-500 rounded-lg bg-red-50 dark:bg-red-950">
              <h3 className="font-bold text-red-900 dark:text-red-100 text-lg">
                🚨 Final Confirmation Required
              </h3>
              <p className="text-red-800 dark:text-red-200">
                Are you absolutely sure you want to delete ALL bookings? This action is irreversible.
              </p>
              <div className="flex gap-3">
                <Button
                  onClick={handleClearBookings}
                  disabled={isDeleting}
                  variant="destructive"
                  className="flex-1"
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="mr-2 h-4 w-4" />
                      Yes, Delete All Bookings
                    </>
                  )}
                </Button>
                <Button
                  onClick={() => setShowConfirmation(false)}
                  disabled={isDeleting}
                  variant="outline"
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <Button
              onClick={() => setShowConfirmation(true)}
              disabled={isDeleting}
              variant="destructive"
              size="lg"
              className="w-full"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Clear All Bookings
            </Button>
          )}
        </CardContent>

        <CardFooter className="flex justify-between text-sm text-muted-foreground">
          <span>Logged in as: {session?.user?.email}</span>
          <Button onClick={() => router.push('/admin')} variant="ghost" size="sm">
            Back to Admin
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
