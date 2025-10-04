'use client';

import { useSession } from 'next-auth/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, Mail, Phone } from 'lucide-react';
import { motion } from 'framer-motion';
import { signOut } from 'next-auth/react';

export default function CommunityRequired() {
  const { data: session } = useSession();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card className="border-orange-200 bg-orange-50 dark:bg-orange-950 dark:border-orange-800">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-orange-800 dark:text-orange-200">
              Community Assignment Required
            </CardTitle>
            <CardDescription className="text-orange-700 dark:text-orange-300">
              Your account needs to be assigned to a community to access the application
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <div className="bg-white dark:bg-slate-900 rounded-lg p-4 border">
              <h3 className="font-semibold mb-2">What's happening?</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Your account ({session?.user?.email}) exists but hasn't been assigned to a 
                specific housing community yet. This is required for data security and access control.
              </p>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-lg p-4 border">
              <h3 className="font-semibold mb-2">How to resolve this:</h3>
              <ol className="text-sm text-slate-600 dark:text-slate-400 space-y-1">
                <li>1. Contact your community administrator</li>
                <li>2. Provide them with your email address: <strong>{session?.user?.email}</strong></li>
                <li>3. They will assign you to the correct community</li>
                <li>4. Sign out and sign back in to refresh your permissions</li>
              </ol>
            </div>

            <div className="bg-blue-50 dark:bg-blue-950 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
              <h3 className="font-semibold mb-2 text-blue-800 dark:text-blue-200 flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Need Help?
              </h3>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                If you're unsure who to contact, please reach out to your building management 
                or the person who provided you with the access code.
              </p>
            </div>

            <div className="flex gap-3">
              <Button 
                onClick={() => signOut({ callbackUrl: '/' })}
                variant="outline" 
                className="flex-1"
              >
                Sign Out
              </Button>
              <Button 
                onClick={() => window.location.reload()}
                className="flex-1"
              >
                Refresh
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}