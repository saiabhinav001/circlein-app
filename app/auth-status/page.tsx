'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle, AlertCircle, User, Mail, Calendar } from 'lucide-react';
import { motion } from 'framer-motion';
import { signOut } from 'next-auth/react';

export default function AuthenticationStatus() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // Redirect to dashboard in production
  useEffect(() => {
    if (process.env.NODE_ENV === 'production' && status === 'authenticated') {
      router.push('/dashboard');
    }
  }, [status, router]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse">
            <span className="text-2xl font-bold text-white">C</span>
          </div>
          <p className="text-slate-600 dark:text-slate-400">Loading authentication status...</p>
        </div>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-orange-500" />
              Not Authenticated
            </CardTitle>
            <CardDescription>
              You need to sign in to access this page
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <a href="/auth/signin">Sign In</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

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
              <span className="text-2xl font-bold text-white">C</span>
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent mb-2">
              Authentication Successful!
            </h1>
            <p className="text-slate-600 dark:text-slate-400 text-lg">
              Welcome to CircleIn - Your community amenity booking platform
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {/* Authentication Status */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  Authentication Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span>Status</span>
                  <Badge variant="default" className="bg-green-500">
                    Authenticated
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Provider</span>
                  <Badge variant="outline">Google OAuth</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Session</span>
                  <Badge variant="outline">Active</Badge>
                </div>
              </CardContent>
            </Card>

            {/* User Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5 text-blue-500" />
                  User Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <img
                    src={session?.user?.image || ''}
                    alt="Profile"
                    className="w-10 h-10 rounded-full border-2 border-slate-200"
                  />
                  <div>
                    <p className="font-medium">{session?.user?.name}</p>
                    <p className="text-sm text-slate-600 dark:text-slate-400 flex items-center gap-1">
                      <Mail className="h-3 w-3" />
                      {session?.user?.email}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* System Status */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  System Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span>NextAuth.js</span>
                  <Badge variant="default" className="bg-green-500">Working</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Google OAuth</span>
                  <Badge variant="default" className="bg-green-500">Working</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Routing</span>
                  <Badge variant="default" className="bg-green-500">Working</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Firebase Rules</span>
                  <Badge variant="destructive">Needs Update</Badge>
                </div>
              </CardContent>
            </Card>

            {/* Next Steps */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-purple-500" />
                  Next Steps
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                  <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200 mb-2">
                    Firebase Setup Required
                  </p>
                  <p className="text-xs text-yellow-700 dark:text-yellow-300">
                    Update Firestore security rules to enable user document creation. 
                    See FIREBASE_SETUP.md for instructions.
                  </p>
                </div>
                <Button
                  onClick={() => signOut({ callbackUrl: '/' })}
                  variant="outline"
                  className="w-full"
                >
                  Sign Out
                </Button>
              </CardContent>
            </Card>
          </div>

          <div className="mt-8 text-center">
            <p className="text-sm text-slate-600 dark:text-slate-400">
              🎉 Congratulations! Your authentication system is working perfectly. 
              Just update the Firebase rules to complete the setup.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}