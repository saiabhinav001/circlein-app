'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Building2, 
  Plus, 
  Trash2, 
  CheckCircle, 
  ArrowRight, 
  ArrowLeft,
  Users,
  Key,
  Sparkles,
  Home
} from 'lucide-react';
import { toast } from 'sonner';
import CancellationPolicySettings from '@/components/admin/CancellationPolicySettings';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, addDoc, doc, setDoc } from 'firebase/firestore';

// Form schemas
const communitySchema = z.object({
  communityName: z.string().min(3, 'Community name must be at least 3 characters'),
});

const amenitySchema = z.object({
  name: z.string().min(2, 'Amenity name is required'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  imageUrl: z.string().url().optional().or(z.literal('')),
  // Booking Rules
  maxPeople: z.number().min(1, 'Must allow at least 1 person').max(100, 'Maximum 100 people'),
  slotDuration: z.number().min(0.5, 'Minimum 30 minutes').max(8, 'Maximum 8 hours'),
  // Weekday Hours
  weekdayStartTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)'),
  weekdayEndTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)'),
  // Weekend Hours
  weekendStartTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)'),
  weekendEndTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)'),
});

const amenitiesSchema = z.object({
  amenities: z.array(amenitySchema).min(1, 'At least one amenity is required'),
});

const accessCodesSchema = z.object({
  codeCount: z.number().min(1).max(50, 'Maximum 50 codes allowed'),
});

type CommunityFormData = z.infer<typeof communitySchema>;
type AmenitiesFormData = z.infer<typeof amenitiesSchema>;
type AccessCodesFormData = z.infer<typeof accessCodesSchema>;

const steps = [
  { id: 1, title: 'Welcome', description: 'Community setup' },
  { id: 2, title: 'Amenities', description: 'Add facilities' },
  { id: 3, title: 'Access Codes', description: 'Generate codes' },
  { id: 4, title: 'Policies', description: 'Cancellation rules' },
  { id: 5, title: 'Complete', description: 'All done!' },
];

export default function AdminOnboarding() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [generatedCodes, setGeneratedCodes] = useState<string[]>([]);
  const [communityName, setCommunityName] = useState('');

  // Check if user should be in onboarding
  useEffect(() => {
    const checkOnboardingEligibility = async () => {
      if (status === 'loading') return;
      
      console.log('Session data:', session);
      console.log('User data:', session?.user);
      console.log('Community ID:', session?.user?.communityId);
      
      if (!session?.user?.email || session.user.role !== 'admin' || !session.user.communityId) {
        console.log('Redirecting to dashboard - missing requirements');
        router.push('/dashboard');
        return;
      }

      try {
        // Check if community has amenities
        const amenitiesQuery = query(
          collection(db, 'amenities'),
          where('communityId', '==', session.user.communityId)
        );
        const amenitiesSnapshot = await getDocs(amenitiesQuery);
        
        if (amenitiesSnapshot.size > 0) {
          // Community already has amenities, redirect to dashboard
          router.push('/dashboard');
        }
      } catch (error) {
        console.error('Error checking amenities:', error);
      }
    };

    checkOnboardingEligibility();
  }, [session, status, router]);

  // Step 1: Community Details Form
  const communityForm = useForm<CommunityFormData>({
    resolver: zodResolver(communitySchema),
    defaultValues: {
      communityName: '',
    },
  });

  // Step 2: Amenities Form
  const amenitiesForm = useForm<AmenitiesFormData>({
    resolver: zodResolver(amenitiesSchema),
    defaultValues: {
      amenities: [{ 
        name: '', 
        description: '', 
        imageUrl: '',
        maxPeople: 6,
        slotDuration: 2,
        weekdayStartTime: '09:00',
        weekdayEndTime: '21:00',
        weekendStartTime: '08:00',
        weekendEndTime: '22:00'
      }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: amenitiesForm.control,
    name: 'amenities',
  });

  // Step 3: Access Codes Form
  const accessCodesForm = useForm<AccessCodesFormData>({
    resolver: zodResolver(accessCodesSchema),
    defaultValues: {
      codeCount: 5,
    },
  });

  // Step handlers
  const handleCommunitySubmit = async (data: CommunityFormData) => {
    setLoading(true);
    try {
      // Get communityId from session, with fallback
      const communityId = session?.user?.communityId;
      
      if (!communityId) {
        toast.error('Community ID not found in session. Please sign out and sign back in.');
        setLoading(false);
        return;
      }

      console.log('Submitting community data:', {
        communityId,
        communityName: data.communityName,
      });

      const response = await fetch('/api/admin/onboarding/update-community', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          communityId,
          communityName: data.communityName,
        }),
      });

      const result = await response.json();
      console.log('API Response:', result);

      if (response.ok) {
        setCommunityName(data.communityName);
        setCurrentStep(2);
        toast.success('Community details updated!');
      } else {
        console.error('API Error:', result);
        toast.error(`Failed to update community details: ${result.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Network Error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      toast.error(`An error occurred: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const handleAmenitiesSubmit = async (data: AmenitiesFormData) => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/onboarding/create-amenities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          communityId: session?.user?.communityId,
          amenities: data.amenities,
        }),
      });

      if (response.ok) {
        setCurrentStep(3);
        toast.success('Amenities created successfully!');
      } else {
        toast.error('Failed to create amenities');
      }
    } catch (error) {
      toast.error('An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleAccessCodesSubmit = async (data: AccessCodesFormData) => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/onboarding/generate-codes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          communityId: session?.user?.communityId,
          codeCount: data.codeCount,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        setGeneratedCodes(result.codes);
        setCurrentStep(4);
        toast.success('Access codes generated!');
      } else {
        toast.error('Failed to generate access codes');
      }
    } catch (error) {
      toast.error('An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const progress = (currentStep / steps.length) * 100;

  if (status === 'loading') {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Building2 className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent mb-2">
            Welcome to CircleIn
          </h1>
          <p className="text-slate-600 dark:text-slate-400 text-lg">
            Let&apos;s set up your community in just a few steps
          </p>
        </motion.div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between mb-2">
            {steps.map((step, index) => (
              <div
                key={step.id}
                className={`flex items-center ${
                  index < steps.length - 1 ? 'flex-1' : ''
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                    currentStep >= step.id
                      ? 'bg-blue-500 text-white'
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-500'
                  }`}
                >
                  {currentStep > step.id ? (
                    <CheckCircle className="w-4 h-4" />
                  ) : (
                    step.id
                  )}
                </div>
                <div className="ml-3 hidden sm:block">
                  <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                    {step.title}
                  </p>
                  <p className="text-xs text-slate-500">{step.description}</p>
                </div>
                {index < steps.length - 1 && (
                  <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700 mx-4" />
                )}
              </div>
            ))}
          </div>
          <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
            <div 
              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Step Content */}
        <AnimatePresence mode="wait">
          {currentStep === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Home className="w-5 h-5 text-blue-500" />
                    Community Details
                  </CardTitle>
                  <CardDescription>
                    Let&apos;s start by setting up your community information
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={communityForm.handleSubmit(handleCommunitySubmit)} className="space-y-6">
                    <div>
                      <Label htmlFor="communityName">Community Name</Label>
                      <Input
                        id="communityName"
                        placeholder="e.g., Sunny Meadows Community"
                        {...communityForm.register('communityName')}
                        className="mt-1"
                      />
                      {communityForm.formState.errors.communityName && (
                        <p className="text-red-500 text-sm mt-1">
                          {communityForm.formState.errors.communityName.message}
                        </p>
                      )}
                    </div>

                    <div className="flex justify-end">
                      <Button type="submit" disabled={loading} className="min-w-32">
                        {loading ? 'Saving...' : (
                          <>
                            Next
                            <ArrowRight className="w-4 h-4 ml-2" />
                          </>
                        )}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {currentStep === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-purple-500" />
                    Add Amenities
                  </CardTitle>
                  <CardDescription>
                    Add the facilities available in your community. Don&apos;t worry about images - we&apos;ll add beautiful ones automatically!
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={amenitiesForm.handleSubmit(handleAmenitiesSubmit)} className="space-y-6">
                    {fields.map((field, index) => (
                      <motion.div
                        key={field.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-4 border border-slate-200 dark:border-slate-700 rounded-lg space-y-4"
                      >
                        <div className="flex items-center justify-between">
                          <h4 className="font-semibold">Amenity {index + 1}</h4>
                          {fields.length > 1 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => remove(index)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor={`amenities.${index}.name`}>Name</Label>
                            <Input
                              placeholder="e.g., Swimming Pool"
                              {...amenitiesForm.register(`amenities.${index}.name`)}
                              className="mt-1"
                            />
                            {amenitiesForm.formState.errors.amenities?.[index]?.name && (
                              <p className="text-red-500 text-sm mt-1">
                                {amenitiesForm.formState.errors.amenities[index]?.name?.message}
                              </p>
                            )}
                          </div>

                          <div>
                            <Label htmlFor={`amenities.${index}.imageUrl`}>
                              Image URL <span className="text-slate-500">(optional)</span>
                            </Label>
                            <Input
                              placeholder="Leave empty for auto-selection"
                              {...amenitiesForm.register(`amenities.${index}.imageUrl`)}
                              className="mt-1"
                            />
                          </div>
                        </div>

                        <div>
                          <Label htmlFor={`amenities.${index}.description`}>Description</Label>
                          <Textarea
                            placeholder="Describe this amenity..."
                            {...amenitiesForm.register(`amenities.${index}.description`)}
                            className="mt-1"
                            rows={3}
                          />
                          {amenitiesForm.formState.errors.amenities?.[index]?.description && (
                            <p className="text-red-500 text-sm mt-1">
                              {amenitiesForm.formState.errors.amenities[index]?.description?.message}
                            </p>
                          )}
                        </div>

                        {/* Booking Rules Section */}
                        <div className="border-t pt-4">
                          <h5 className="font-medium text-sm text-slate-700 dark:text-slate-300 mb-3">Booking Rules</h5>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor={`amenities.${index}.maxPeople`}>Max People</Label>
                              <Input
                                type="number"
                                min="1"
                                max="100"
                                placeholder="6"
                                {...amenitiesForm.register(`amenities.${index}.maxPeople`, { valueAsNumber: true })}
                                className="mt-1"
                              />
                              {amenitiesForm.formState.errors.amenities?.[index]?.maxPeople && (
                                <p className="text-red-500 text-sm mt-1">
                                  {amenitiesForm.formState.errors.amenities[index]?.maxPeople?.message}
                                </p>
                              )}
                            </div>

                            <div>
                              <Label htmlFor={`amenities.${index}.slotDuration`}>Slot Duration (hours)</Label>
                              <Input
                                type="number"
                                min="0.5"
                                max="8"
                                step="0.5"
                                placeholder="2"
                                {...amenitiesForm.register(`amenities.${index}.slotDuration`, { valueAsNumber: true })}
                                className="mt-1"
                              />
                              {amenitiesForm.formState.errors.amenities?.[index]?.slotDuration && (
                                <p className="text-red-500 text-sm mt-1">
                                  {amenitiesForm.formState.errors.amenities[index]?.slotDuration?.message}
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Weekday Hours */}
                          <div className="mt-4">
                            <h6 className="font-medium text-sm text-slate-600 dark:text-slate-400 mb-2">Weekday Hours</h6>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label htmlFor={`amenities.${index}.weekdayStartTime`}>Start Time</Label>
                                <Input
                                  type="time"
                                  {...amenitiesForm.register(`amenities.${index}.weekdayStartTime`)}
                                  className="mt-1"
                                />
                                {amenitiesForm.formState.errors.amenities?.[index]?.weekdayStartTime && (
                                  <p className="text-red-500 text-sm mt-1">
                                    {amenitiesForm.formState.errors.amenities[index]?.weekdayStartTime?.message}
                                  </p>
                                )}
                              </div>
                              <div>
                                <Label htmlFor={`amenities.${index}.weekdayEndTime`}>End Time</Label>
                                <Input
                                  type="time"
                                  {...amenitiesForm.register(`amenities.${index}.weekdayEndTime`)}
                                  className="mt-1"
                                />
                                {amenitiesForm.formState.errors.amenities?.[index]?.weekdayEndTime && (
                                  <p className="text-red-500 text-sm mt-1">
                                    {amenitiesForm.formState.errors.amenities[index]?.weekdayEndTime?.message}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Weekend Hours */}
                          <div className="mt-4">
                            <h6 className="font-medium text-sm text-slate-600 dark:text-slate-400 mb-2">Weekend Hours</h6>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label htmlFor={`amenities.${index}.weekendStartTime`}>Start Time</Label>
                                <Input
                                  type="time"
                                  {...amenitiesForm.register(`amenities.${index}.weekendStartTime`)}
                                  className="mt-1"
                                />
                                {amenitiesForm.formState.errors.amenities?.[index]?.weekendStartTime && (
                                  <p className="text-red-500 text-sm mt-1">
                                    {amenitiesForm.formState.errors.amenities[index]?.weekendStartTime?.message}
                                  </p>
                                )}
                              </div>
                              <div>
                                <Label htmlFor={`amenities.${index}.weekendEndTime`}>End Time</Label>
                                <Input
                                  type="time"
                                  {...amenitiesForm.register(`amenities.${index}.weekendEndTime`)}
                                  className="mt-1"
                                />
                                {amenitiesForm.formState.errors.amenities?.[index]?.weekendEndTime && (
                                  <p className="text-red-500 text-sm mt-1">
                                    {amenitiesForm.formState.errors.amenities[index]?.weekendEndTime?.message}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}

                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => append({ 
                        name: '', 
                        description: '', 
                        imageUrl: '',
                        maxPeople: 6,
                        slotDuration: 2,
                        weekdayStartTime: '09:00',
                        weekdayEndTime: '21:00',
                        weekendStartTime: '08:00',
                        weekendEndTime: '22:00'
                      })}
                      className="w-full"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Another Amenity
                    </Button>

                    <div className="flex justify-between">
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => setCurrentStep(1)}
                      >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back
                      </Button>
                      <Button type="submit" disabled={loading} className="min-w-32">
                        {loading ? 'Creating...' : (
                          <>
                            Next
                            <ArrowRight className="w-4 h-4 ml-2" />
                          </>
                        )}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {currentStep === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Key className="w-5 h-5 text-green-500" />
                    Generate Access Codes
                  </CardTitle>
                  <CardDescription>
                    How many access codes do you need for residents to join your community?
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={accessCodesForm.handleSubmit(handleAccessCodesSubmit)} className="space-y-6">
                    <div>
                      <Label htmlFor="codeCount">Number of Access Codes</Label>
                      <Input
                        id="codeCount"
                        type="number"
                        min="1"
                        max="50"
                        {...accessCodesForm.register('codeCount', { valueAsNumber: true })}
                        className="mt-1"
                      />
                      {accessCodesForm.formState.errors.codeCount && (
                        <p className="text-red-500 text-sm mt-1">
                          {accessCodesForm.formState.errors.codeCount.message}
                        </p>
                      )}
                      <p className="text-sm text-slate-500 mt-2">
                        These codes will allow residents to sign up and join your community
                      </p>
                    </div>

                    <div className="flex justify-between">
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => setCurrentStep(2)}
                      >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back
                      </Button>
                      <Button type="submit" disabled={loading} className="min-w-32">
                        {loading ? 'Generating...' : 'Generate Codes'}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {currentStep === 4 && (
            <motion.div
              key="step4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card>
                <CardHeader className="text-center">
                  <div className="w-16 h-16 bg-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Building2 className="w-8 h-8 text-white" />
                  </div>
                  <CardTitle className="text-2xl">Cancellation Policy</CardTitle>
                  <CardDescription>
                    Configure booking cancellation rules for your community
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <CancellationPolicySettings />
                  
                  {/* Navigation */}
                  <div className="flex justify-between pt-6">
                    <Button
                      variant="outline"
                      onClick={() => setCurrentStep(3)}
                    >
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Previous
                    </Button>
                    <Button
                      onClick={() => setCurrentStep(5)}
                      className="bg-gradient-to-r from-orange-500 to-red-500"
                    >
                      Continue
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {currentStep === 5 && (
            <motion.div
              key="step5"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card>
                <CardHeader className="text-center">
                  <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-8 h-8 text-white" />
                  </div>
                  <CardTitle className="text-2xl">Setup Complete!</CardTitle>
                  <CardDescription>
                    Your community <strong>{communityName}</strong> is ready to go!
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <Alert>
                    <Users className="w-4 h-4" />
                    <AlertDescription>
                      <strong>Generated Access Codes:</strong> Share these with residents to join your community
                    </AlertDescription>
                  </Alert>

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {generatedCodes.map((code, index) => (
                      <Badge key={index} variant="secondary" className="p-2 text-center font-mono">
                        {code}
                      </Badge>
                    ))}
                  </div>

                  <div className="text-center pt-6">
                    <Button
                      onClick={() => {
                        // Set completion flag to prevent redirect loop
                        sessionStorage.setItem('onboarding-completed', 'true');
                        router.push('/dashboard?from=onboarding');
                      }}
                      size="lg"
                      className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                    >
                      Go to Dashboard
                      <Home className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}