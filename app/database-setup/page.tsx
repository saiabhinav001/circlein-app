'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, AlertCircle, Database, Loader2, Copy } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

export default function DatabaseSetup() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const securityRules = `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}`;

  const initializeDatabase = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/init-database', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      const data = await response.json();
      setResult(data);
      
      if (data.success) {
        toast.success('Database initialized successfully!');
      } else {
        toast.error('Failed to initialize database');
      }
    } catch (error) {
      toast.error('Error initializing database');
      setResult({ error: 'Network error', details: error instanceof Error ? error.message : 'Unknown error' });
    } finally {
      setLoading(false);
    }
  };

  const copyRules = () => {
    navigator.clipboard.writeText(securityRules);
    toast.success('Security rules copied to clipboard!');
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-8">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Database className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent mb-2">
              Database Setup
            </h1>
            <p className="text-slate-600 dark:text-slate-400 text-lg">
              Initialize your CircleIn Firestore database with sample data
            </p>
          </div>

          <div className="grid gap-6">
            {/* Step 1: Security Rules */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">1</span>
                  Update Firestore Security Rules
                </CardTitle>
                <CardDescription>
                  First, update your Firestore security rules to allow database writes
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Go to Firebase Console → Firestore Database → Rules and replace with the rules below
                  </AlertDescription>
                </Alert>
                
                <div className="relative">
                  <pre className="bg-slate-100 dark:bg-slate-800 p-4 rounded-lg text-sm overflow-x-auto">
                    <code>{securityRules}</code>
                  </pre>
                  <Button
                    size="sm"
                    variant="outline"
                    className="absolute top-2 right-2"
                    onClick={copyRules}
                  >
                    <Copy className="h-3 w-3 mr-1" />
                    Copy
                  </Button>
                </div>

                <div className="flex items-center gap-2">
                  <Badge variant="outline">Firebase Console</Badge>
                  <span className="text-sm text-slate-600 dark:text-slate-400">→</span>
                  <Badge variant="outline">Firestore Database</Badge>
                  <span className="text-sm text-slate-600 dark:text-slate-400">→</span>
                  <Badge variant="outline">Rules</Badge>
                  <span className="text-sm text-slate-600 dark:text-slate-400">→</span>
                  <Badge variant="outline">Publish</Badge>
                </div>
              </CardContent>
            </Card>

            {/* Step 2: Initialize Database */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span className="w-6 h-6 bg-purple-500 text-white rounded-full flex items-center justify-center text-sm font-bold">2</span>
                  Initialize Database Collections
                </CardTitle>
                <CardDescription>
                  Create all necessary collections with sample data for your CircleIn app
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <div className="text-center">
                    <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center mx-auto mb-2">
                      <span className="text-lg">👤</span>
                    </div>
                    <p className="text-sm font-medium">Users</p>
                    <p className="text-xs text-slate-600 dark:text-slate-400">2 samples</p>
                  </div>
                  <div className="text-center">
                    <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center mx-auto mb-2">
                      <span className="text-lg">🏊</span>
                    </div>
                    <p className="text-sm font-medium">Amenities</p>
                    <p className="text-xs text-slate-600 dark:text-slate-400">4 samples</p>
                  </div>
                  <div className="text-center">
                    <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg flex items-center justify-center mx-auto mb-2">
                      <span className="text-lg">📅</span>
                    </div>
                    <p className="text-sm font-medium">Bookings</p>
                    <p className="text-xs text-slate-600 dark:text-slate-400">2 samples</p>
                  </div>
                  <div className="text-center">
                    <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center mx-auto mb-2">
                      <span className="text-lg">🔑</span>
                    </div>
                    <p className="text-sm font-medium">Access Codes</p>
                    <p className="text-xs text-slate-600 dark:text-slate-400">3 samples</p>
                  </div>
                  <div className="text-center">
                    <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center mx-auto mb-2">
                      <span className="text-lg">⚙️</span>
                    </div>
                    <p className="text-sm font-medium">Settings</p>
                    <p className="text-xs text-slate-600 dark:text-slate-400">1 config</p>
                  </div>
                </div>

                <Button 
                  onClick={initializeDatabase} 
                  disabled={loading}
                  className="w-full"
                  size="lg"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Initializing Database...
                    </>
                  ) : (
                    <>
                      <Database className="mr-2 h-4 w-4" />
                      Initialize Database
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Results */}
            {result && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {result.success ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-red-500" />
                    )}
                    Initialization Results
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {result.success ? (
                    <div className="space-y-4">
                      <Alert className="border-green-200 bg-green-50 dark:bg-green-900/20">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <AlertDescription className="text-green-800 dark:text-green-200">
                          Database initialized successfully! Your CircleIn app is ready to use.
                        </AlertDescription>
                      </Alert>
                      
                      {result.details?.summary && (
                        <div className="grid grid-cols-5 gap-4">
                          <div className="text-center">
                            <p className="text-2xl font-bold text-blue-600">{result.details.summary.users}</p>
                            <p className="text-sm text-slate-600 dark:text-slate-400">Users</p>
                          </div>
                          <div className="text-center">
                            <p className="text-2xl font-bold text-green-600">{result.details.summary.amenities}</p>
                            <p className="text-sm text-slate-600 dark:text-slate-400">Amenities</p>
                          </div>
                          <div className="text-center">
                            <p className="text-2xl font-bold text-yellow-600">{result.details.summary.bookings}</p>
                            <p className="text-sm text-slate-600 dark:text-slate-400">Bookings</p>
                          </div>
                          <div className="text-center">
                            <p className="text-2xl font-bold text-purple-600">{result.details.summary.accessCodes}</p>
                            <p className="text-sm text-slate-600 dark:text-slate-400">Codes</p>
                          </div>
                          <div className="text-center">
                            <p className="text-2xl font-bold text-slate-600">{result.details.summary.settings}</p>
                            <p className="text-sm text-slate-600 dark:text-slate-400">Settings</p>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <Alert className="border-red-200 bg-red-50 dark:bg-red-900/20">
                      <AlertCircle className="h-4 w-4 text-red-600" />
                      <AlertDescription className="text-red-800 dark:text-red-200">
                        <strong>Error:</strong> {result.details || result.error}
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Next Steps */}
            <Card>
              <CardHeader>
                <CardTitle>Next Steps</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <p>✅ Authentication system is working</p>
                  <p>✅ Database schema is defined</p>
                  <p>🔄 Initialize database collections (above)</p>
                  <p>🎯 Test booking functionality</p>
                  <p>🚀 Deploy to production</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </motion.div>
      </div>
    </div>
  );
}