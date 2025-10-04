'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, AlertCircle, Database, Loader2, Zap, Copy } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

export default function DatabaseSetup() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const initializeDatabase = async () => {
    setLoading(true);
    setResult(null);
    
    try {
      const response = await fetch('/api/setup-database', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      const data = await response.json();
      setResult(data);
      
      if (data.success) {
        toast.success('🎉 Database setup completed!');
      } else {
        toast.error('Database setup failed');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      toast.error('Setup failed: ' + errorMessage);
      setResult({ 
        success: false, 
        error: 'Network error', 
        details: errorMessage 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleManualSetup = async () => {
    setLoading(true);
    setResult(null);
    
    try {
      const response = await fetch('/api/manual-setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      const data = await response.json();
      setResult(data);
      
      if (data.success) {
        toast.success('📋 Manual setup data generated!');
      } else {
        toast.error('Manual setup failed');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      toast.error('Manual setup failed: ' + errorMessage);
      setResult({ 
        success: false, 
        error: 'Network error', 
        details: errorMessage 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-8">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Database className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-2">
            CircleIn Database Setup
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Initialize your Firestore database with essential collections and data
          </p>
        </motion.div>

        <div className="grid gap-6">
          {/* Setup Action Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-blue-500" />
                Quick Database Setup
              </CardTitle>
              <CardDescription>
                This will create all necessary collections with sample data for your CircleIn app
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-slate-100 dark:bg-slate-800 rounded-lg p-4">
                <h4 className="font-semibold mb-2">What will be created:</h4>
                <ul className="space-y-1 text-sm text-slate-600 dark:text-slate-400">
                  <li>✅ <strong>Amenities:</strong> Swimming Pool, Tennis Court, Gym, Clubhouse</li>
                  <li>✅ <strong>Access Codes:</strong> COMMUNITY2025, RESIDENT123, WELCOME2025</li>
                  <li>✅ <strong>App Settings:</strong> Configuration and booking rules</li>
                  <li>ℹ️ <strong>Users & Bookings:</strong> Will be created automatically when users sign up</li>
                </ul>
              </div>

              <Button 
                onClick={initializeDatabase} 
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 mb-2"
                size="lg"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Setting up database...
                  </>
                ) : (
                  <>
                    <Database className="w-4 h-4 mr-2" />
                    Initialize Database (Auto)
                  </>
                )}
              </Button>
              
              <Button 
                onClick={handleManualSetup} 
                disabled={loading}
                variant="outline"
                className="w-full"
                size="lg"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating manual setup...
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 mr-2" />
                    Get Manual Setup Data
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Results Card */}
          {result && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {result.success ? (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-red-500" />
                    )}
                    Setup Results
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {result.success ? (
                    <div className="space-y-3">
                      <Alert className="border-green-200 bg-green-50 dark:bg-green-950 dark:border-green-800">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <AlertDescription className="text-green-800 dark:text-green-200">
                          <strong>Success!</strong> {result.message}
                        </AlertDescription>
                      </Alert>
                      
                      <div className="bg-slate-100 dark:bg-slate-800 rounded-lg p-4">
                        <h4 className="font-semibold mb-2">Collections Created:</h4>
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div className="text-center">
                            <div className="font-bold text-blue-600 text-xl">{result.collections.amenities}</div>
                            <div className="text-slate-600 dark:text-slate-400">Amenities</div>
                          </div>
                          <div className="text-center">
                            <div className="font-bold text-purple-600 text-xl">{result.collections.accessCodes}</div>
                            <div className="text-slate-600 dark:text-slate-400">Access Codes</div>
                          </div>
                          <div className="text-center">
                            <div className="font-bold text-green-600 text-xl">{result.collections.settings}</div>
                            <div className="text-slate-600 dark:text-slate-400">Settings</div>
                          </div>
                        </div>
                      </div>

                      <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-950 dark:border-blue-800">
                        <AlertDescription className="text-blue-800 dark:text-blue-200">
                          <strong>Next Steps:</strong> Your database is ready! Users can now sign up and start making bookings.
                        </AlertDescription>
                      </Alert>
                    </div>
                  ) : (
                    <Alert className="border-red-200 bg-red-50 dark:bg-red-950 dark:border-red-800">
                      <AlertCircle className="w-4 h-4 text-red-600" />
                      <AlertDescription className="text-red-800 dark:text-red-200">
                        <strong>Error:</strong> {result.error}
                        {result.details && (
                          <details className="mt-2">
                            <summary className="cursor-pointer">View Details</summary>
                            <pre className="text-xs mt-1 whitespace-pre-wrap">{result.details}</pre>
                          </details>
                        )}
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Security Rules Note */}
          <Card>
            <CardHeader>
              <CardTitle className="text-amber-600">⚠️ Important Security Note</CardTitle>
            </CardHeader>
            <CardContent>
              <Alert className="border-amber-200 bg-amber-50 dark:bg-amber-950 dark:border-amber-800">
                <AlertCircle className="w-4 h-4 text-amber-600" />
                <AlertDescription className="text-amber-800 dark:text-amber-200">
                  <strong>Update your Firestore Security Rules:</strong> Go to Firebase Console → Firestore Database → Rules and set:
                  <pre className="mt-2 p-2 bg-slate-100 dark:bg-slate-800 rounded text-xs overflow-x-auto">
{`rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}`}
                  </pre>
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}