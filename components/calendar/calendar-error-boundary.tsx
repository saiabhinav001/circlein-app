'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface CalendarErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

interface CalendarErrorBoundaryProps {
  children: React.ReactNode;
}

export class CalendarErrorBoundary extends React.Component<
  CalendarErrorBoundaryProps,
  CalendarErrorBoundaryState
> {
  constructor(props: CalendarErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): CalendarErrorBoundaryState {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Calendar Error Boundary caught an error:', error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined });
    // Force a re-render by reloading the page
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="container mx-auto p-6 max-w-7xl">
          <Card className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-800 dark:text-red-200">
                <AlertCircle className="h-5 w-5" />
                Calendar Error
              </CardTitle>
              <CardDescription className="text-red-600 dark:text-red-400">
                There was an error loading the calendar. This might be due to a hydration issue or network problem.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-sm text-red-700 dark:text-red-300">
                  Error: {this.state.error?.message || 'Unknown error occurred'}
                </p>
                <Button
                  onClick={this.handleRetry}
                  variant="outline"
                  className="border-red-300 text-red-700 hover:bg-red-100 dark:border-red-700 dark:text-red-300 dark:hover:bg-red-900"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Try Again
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}