'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { motion } from 'framer-motion';
import { Home, ChevronRight, Check } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { CircleInLogo } from '@/components/ui';

interface FlatNumberSetupProps {
  userEmail?: string;
  onComplete?: () => void;
}

export default function FlatNumberSetup({ userEmail, onComplete }: FlatNumberSetupProps) {
  const { data: session, update } = useSession();
  const [flatNumber, setFlatNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Use provided email or get from session
  const email = userEmail || session?.user?.email;
  const userFlatNumber = (session?.user as any)?.flatNumber;
  const profileCompleted = (session?.user as any)?.profileCompleted;

  // Auto-redirect if user has already completed setup
  useEffect(() => {
    // Only check for redirect if session is loaded
    if (session && profileCompleted) {
      console.log('User has already completed profile setup, redirecting to dashboard');
      toast.success('Setup already completed!', {
        description: 'Redirecting to dashboard...'
      });
      setTimeout(() => {
        window.location.href = '/dashboard';
      }, 1000);
    }
  }, [session, profileCompleted]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!flatNumber.trim()) {
      toast.error('Please enter your flat number');
      return;
    }

    if (!email) {
      toast.error('Session not loaded. Please refresh the page and try again.');
      return;
    }

    setLoading(true);

    try {
      console.log('Submitting flat number:', { email, flatNumber: flatNumber.trim() });
      
      const response = await fetch('/api/update-flat-number', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email,
          flatNumber: flatNumber.trim()
        }),
      });

      console.log('API Response status:', response.status);

      if (response.ok) {
        toast.success('Profile updated successfully! 🏠', {
          description: `Flat ${flatNumber.toUpperCase()} has been added to your profile`
        });
        
        // Force session refresh to include the new flat number
        await update();
        
        onComplete?.();
        
        // Use window.location.href for a complete page refresh to ensure middleware sees the update
        window.location.href = '/dashboard';
      } else {
        const errorText = await response.text();
        console.error('API Error:', response.status, errorText);
        try {
          const errorData = JSON.parse(errorText);
          toast.error('Failed to update profile', { 
            description: errorData.error || errorData.details || 'Please try again' 
          });
        } catch {
          toast.error('Failed to update profile', { 
            description: `Server error (${response.status}). Please try again.` 
          });
        }
      }
    } catch (error) {
      console.error('Error updating flat number:', error);
      toast.error('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800 flex items-center justify-center p-4">
      {/* Show loading state if session is not loaded yet */}
      {!session && (
        <Card className="w-full max-w-md shadow-2xl border-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg">
          <CardContent className="p-6 text-center">
            <div className="flex justify-center mb-4">
              <CircleInLogo size={64} className="w-12 h-12 sm:w-16 sm:h-16" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Loading your profile...</h3>
            <p className="text-gray-500 text-sm">Please wait while we prepare your setup.</p>
          </CardContent>
        </Card>
      )}

      {/* Show setup form only when session is loaded */}
      {session && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="w-full max-w-md"
        >
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-6">
              <CircleInLogo size={80} className="w-16 h-16 sm:w-20 sm:h-20" />
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent mb-2">
              Complete Your Profile
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Let us know your flat number to personalize your experience
            </p>
          </div>

          <Card className="shadow-2xl border-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg">
            <CardHeader className="text-center pb-2">
              <CardTitle className="text-xl font-semibold">Add Your Flat Number</CardTitle>
              <CardDescription>This helps us provide better community services</CardDescription>
            </CardHeader>
            
            <CardContent className="p-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="flatNumber" className="text-sm font-medium">
                    Flat Number <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <Home className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      id="flatNumber"
                      type="text"
                      value={flatNumber}
                      onChange={(e) => setFlatNumber(e.target.value)}
                      placeholder="e.g., A-101, B-205, C-301"
                      className="pl-10 h-12 text-center font-medium"
                      disabled={loading}
                    />
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center">
                    <Home className="w-3 h-3 mr-1" />
                    Enter your flat number as it appears on your lease
                  </p>
                </div>

                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Button 
                    type="submit" 
                    disabled={loading}
                    className="w-full h-12 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-medium rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
                  >
                    {loading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4 mr-2" />
                        Complete Setup
                        <ChevronRight className="w-4 h-4 ml-2" />
                      </>
                    )}
                  </Button>
                </motion.div>

                <div className="text-center">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={async () => {
                      if (!email) {
                        toast.error('Session not loaded. Please refresh the page and try again.');
                        return;
                      }
                      
                      setLoading(true);
                      try {
                        console.log('Skipping flat number setup for:', email);
                        
                        // Save empty flat number to indicate the user has completed the setup
                        const response = await fetch('/api/update-flat-number', {
                          method: 'POST',
                          headers: {
                            'Content-Type': 'application/json',
                          },
                          body: JSON.stringify({
                            email: email,
                            flatNumber: '' // Empty string to indicate skipped
                          }),
                        });

                        console.log('Skip API Response status:', response.status);

                        if (response.ok) {
                          toast.success('Setup completed!', {
                            description: 'You can add your flat number later from your profile'
                          });
                          
                          // Refresh session to update token
                          await update();
                          onComplete?.();
                          
                          // Use window.location.href for a complete page refresh
                          window.location.href = '/dashboard';
                        } else {
                          const errorText = await response.text();
                          console.error('Skip API Error:', response.status, errorText);
                          try {
                            const errorData = JSON.parse(errorText);
                            toast.error('Failed to complete setup', {
                              description: errorData.error || errorData.details || 'Please try again'
                            });
                          } catch {
                            toast.error('Failed to complete setup', {
                              description: `Server error (${response.status}). Please try again.`
                            });
                          }
                        }
                      } catch (error) {
                        console.error('Skip Error:', error);
                        toast.error('Something went wrong');
                      } finally {
                        setLoading(false);
                      }
                    }}
                    disabled={loading}
                    className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    Skip for now
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Your flat number helps us provide better community services
            </p>
          </div>
        </motion.div>
      )}
    </div>
  );
}