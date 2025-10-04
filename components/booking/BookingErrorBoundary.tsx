'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

export default class BookingErrorBoundary extends React.Component<
  React.PropsWithChildren<{}>,
  ErrorBoundaryState
> {
  constructor(props: React.PropsWithChildren<{}>) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Booking error boundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 dark:from-slate-900 dark:to-gray-900 flex items-center justify-center p-6">
          <Card className="max-w-md mx-auto border-red-200 dark:border-red-800 shadow-xl">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 mx-auto mb-6 bg-red-100 dark:bg-red-950 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-8 h-8 text-red-500" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                Something went wrong
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                We encountered an unexpected error while loading your bookings. This might be a temporary connectivity issue.
              </p>
              <div className="space-y-3">
                <Button
                  onClick={() => {
                    this.setState({ hasError: false });
                    window.location.reload();
                  }}
                  className="w-full bg-blue-500 hover:bg-blue-600"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Try Again
                </Button>
                <Button
                  variant="outline"
                  onClick={() => window.location.href = '/dashboard'}
                  className="w-full"
                >
                  Go to Dashboard
                </Button>
              </div>
              {this.state.error && (
                <details className="mt-6 text-left">
                  <summary className="text-sm text-gray-500 cursor-pointer">
                    Technical Details
                  </summary>
                  <pre className="mt-2 text-xs text-gray-400 bg-gray-50 dark:bg-gray-800 p-3 rounded overflow-auto">
                    {this.state.error.message}
                  </pre>
                </details>
              )}
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}