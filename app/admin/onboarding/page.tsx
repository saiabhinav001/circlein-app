'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
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
  Home,
  Sun,
  Moon,
  Clock,
  Copy,
  Shield,
  Zap
} from 'lucide-react';
import { toast } from 'sonner';
import CancellationPolicySettings from '@/components/admin/CancellationPolicySettings';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { CircleInLogo } from '@/components/ui';
import { useTheme } from '@/components/providers/theme-provider';
import Link from 'next/link';

// Form schemas
const communitySchema = z.object({
  communityName: z.string().min(3, 'Community name must be at least 3 characters'),
});

const amenitySchema = z.object({
  name: z.string().min(2, 'Amenity name is required'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  imageUrl: z.string().url().optional().or(z.literal('')),
  maxPeople: z.number().min(1, 'Must allow at least 1 person').max(100, 'Maximum 100 people'),
  slotDuration: z.number().min(0.5, 'Minimum 30 minutes').max(8, 'Maximum 8 hours'),
  weekdayStartTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format'),
  weekdayEndTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format'),
  weekendStartTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format'),
  weekendEndTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format'),
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
  { id: 1, title: 'Community', icon: Home, description: 'Name your community' },
  { id: 2, title: 'Amenities', icon: Sparkles, description: 'Add facilities' },
  { id: 3, title: 'Access', icon: Key, description: 'Generate codes' },
  { id: 4, title: 'Policies', icon: Shield, description: 'Set rules' },
  { id: 5, title: 'Complete', icon: Zap, description: 'Go live!' },
];

export default function AdminOnboarding() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [generatedCodes, setGeneratedCodes] = useState<string[]>([]);
  const [communityName, setCommunityName] = useState('');
  const { theme, setTheme } = useTheme();

  // Check if user should be in onboarding
  useEffect(() => {
    const checkOnboardingEligibility = async () => {
      if (status === 'loading') return;
      
      if (!session?.user?.email || session.user.role !== 'admin' || !session.user.communityId) {
        router.push('/dashboard');
        return;
      }

      try {
        const amenitiesQuery = query(
          collection(db, 'amenities'),
          where('communityId', '==', session.user.communityId)
        );
        const amenitiesSnapshot = await getDocs(amenitiesQuery);
        
        if (amenitiesSnapshot.size > 0) {
          router.push('/dashboard');
        }
      } catch (error) {
        console.error('Error checking amenities:', error);
      }
    };

    checkOnboardingEligibility();
  }, [session, status, router]);

  // Form instances
  const communityForm = useForm<CommunityFormData>({
    resolver: zodResolver(communitySchema),
    defaultValues: { communityName: '' },
  });

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

  const accessCodesForm = useForm<AccessCodesFormData>({
    resolver: zodResolver(accessCodesSchema),
    defaultValues: { codeCount: 5 },
  });

  // Step handlers
  const handleCommunitySubmit = async (data: CommunityFormData) => {
    setLoading(true);
    try {
      const communityId = session?.user?.communityId;
      
      if (!communityId) {
        toast.error('Community ID not found. Please sign out and sign back in.');
        setLoading(false);
        return;
      }

      const response = await fetch('/api/admin/onboarding/update-community', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ communityId, communityName: data.communityName }),
      });

      const result = await response.json();

      if (response.ok) {
        setCommunityName(data.communityName);
        setCurrentStep(2);
        toast.success('Community name saved!');
      } else {
        toast.error(`Failed: ${result.error || 'Unknown error'}`);
      }
    } catch (error) {
      toast.error('An error occurred');
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
        toast.success('Amenities created!');
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
        toast.error('Failed to generate codes');
      }
    } catch (error) {
      toast.error('An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const copyAllCodes = () => {
    navigator.clipboard.writeText(generatedCodes.join('\n'));
    toast.success('All codes copied to clipboard!');
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-slate-950">
        <div className="w-8 h-8 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
      </div>
    );
  }

  const progress = (currentStep / steps.length) * 100;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-white/80 dark:bg-slate-950/80 backdrop-blur-lg border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <CircleInLogo className="w-8 h-8" />
            <span className="text-lg font-bold bg-gradient-to-r from-indigo-600 to-violet-600 dark:from-indigo-400 dark:to-violet-400 bg-clip-text text-transparent">
              CircleIn
            </span>
            <Badge variant="secondary" className="ml-2 bg-amber-100 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-500/20">
              Admin Setup
            </Badge>
          </Link>
          
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            aria-label="Toggle theme"
          >
            <Sun className="w-5 h-5 text-amber-500 rotate-0 scale-100 transition-all dark:rotate-90 dark:scale-0" />
            <Moon className="absolute w-5 h-5 text-indigo-400 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" style={{ marginTop: '-20px' }} />
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        {/* Welcome Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.1, type: 'spring', stiffness: 200, damping: 15 }}
            className="mx-auto mb-4 w-16 h-16 rounded-2xl flex items-center justify-center bg-gradient-to-br from-indigo-500 to-violet-600 shadow-lg shadow-indigo-500/25"
          >
            <Building2 className="w-8 h-8 text-white" />
          </motion.div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mb-2">
            Welcome to CircleIn Admin
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Let's set up your community in just a few steps
          </p>
        </motion.div>

        {/* Progress Steps */}
        <div className="mb-8">
          {/* Desktop Progress */}
          <div className="hidden sm:flex items-center justify-center gap-0 mb-4">
            {steps.map((step, index) => {
              const StepIcon = step.icon;
              const isActive = currentStep === step.id;
              const isCompleted = currentStep > step.id;
              
              return (
                <div key={step.id} className="flex items-center">
                  <div className="flex flex-col items-center">
                    <div
                      className={`
                        w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300
                        ${isCompleted ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/25' : ''}
                        ${isActive ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/25 ring-4 ring-indigo-500/20' : ''}
                        ${!isActive && !isCompleted ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500' : ''}
                      `}
                    >
                      {isCompleted ? <CheckCircle className="w-5 h-5" /> : <StepIcon className="w-5 h-5" />}
                    </div>
                    <span className={`text-xs mt-2 font-medium ${isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-500 dark:text-slate-400'}`}>
                      {step.title}
                    </span>
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`w-12 h-0.5 mx-2 mt-[-20px] ${currentStep > step.id ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-800'}`} />
                  )}
                </div>
              );
            })}
          </div>

          {/* Mobile Progress */}
          <div className="sm:hidden mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Step {currentStep} of {steps.length}
              </span>
              <span className="text-sm text-slate-500 dark:text-slate-400">
                {steps[currentStep - 1].title}
              </span>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
            <motion.div 
              className="bg-gradient-to-r from-indigo-500 to-violet-500 h-full rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>

        {/* Step Content */}
        <AnimatePresence mode="wait">
          {/* Step 1: Community Name */}
          {currentStep === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                <div className="p-6 sm:p-8 border-b border-slate-200 dark:border-slate-800">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 rounded-lg bg-indigo-100 dark:bg-indigo-500/10">
                      <Home className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Community Details</h2>
                  </div>
                  <p className="text-slate-600 dark:text-slate-400">What's the name of your community?</p>
                </div>
                
                <form onSubmit={communityForm.handleSubmit(handleCommunitySubmit)} className="p-6 sm:p-8 space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="communityName" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      Community Name
                    </Label>
                    <Input
                      id="communityName"
                      placeholder="e.g., Sunny Meadows Residences"
                      {...communityForm.register('communityName')}
                      className="h-12 text-base bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-xl focus:border-indigo-500 focus:ring-indigo-500/20"
                    />
                    {communityForm.formState.errors.communityName && (
                      <p className="text-red-500 text-sm">{communityForm.formState.errors.communityName.message}</p>
                    )}
                  </div>

                  <div className="flex justify-end">
                    <Button 
                      type="submit" 
                      disabled={loading}
                      className="h-11 px-6 bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 rounded-xl font-medium"
                    >
                      {loading ? 'Saving...' : (
                        <>
                          Continue
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </div>
            </motion.div>
          )}

          {/* Step 2: Amenities */}
          {currentStep === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                <div className="p-6 sm:p-8 border-b border-slate-200 dark:border-slate-800">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 rounded-lg bg-violet-100 dark:bg-violet-500/10">
                      <Sparkles className="w-5 h-5 text-violet-600 dark:text-violet-400" />
                    </div>
                    <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Add Amenities</h2>
                  </div>
                  <p className="text-slate-600 dark:text-slate-400">Add the facilities available in your community</p>
                </div>
                
                <form onSubmit={amenitiesForm.handleSubmit(handleAmenitiesSubmit)} className="p-6 sm:p-8 space-y-6">
                  {fields.map((field, index) => (
                    <motion.div
                      key={field.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 space-y-4"
                    >
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                          <span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-sm flex items-center justify-center">
                            {index + 1}
                          </span>
                          Amenity {index + 1}
                        </h4>
                        {fields.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => remove(index)}
                            className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-500/10"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label className="text-sm text-slate-600 dark:text-slate-400">Name *</Label>
                          <Input
                            placeholder="e.g., Swimming Pool"
                            {...amenitiesForm.register(`amenities.${index}.name`)}
                            className="mt-1 h-10 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 rounded-lg"
                          />
                          {amenitiesForm.formState.errors.amenities?.[index]?.name && (
                            <p className="text-red-500 text-xs mt-1">{amenitiesForm.formState.errors.amenities[index]?.name?.message}</p>
                          )}
                        </div>

                        <div>
                          <Label className="text-sm text-slate-600 dark:text-slate-400">Image URL (optional)</Label>
                          <Input
                            placeholder="Leave empty for auto-selection"
                            {...amenitiesForm.register(`amenities.${index}.imageUrl`)}
                            className="mt-1 h-10 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 rounded-lg"
                          />
                        </div>
                      </div>

                      <div>
                        <Label className="text-sm text-slate-600 dark:text-slate-400">Description *</Label>
                        <Textarea
                          placeholder="Describe this amenity..."
                          {...amenitiesForm.register(`amenities.${index}.description`)}
                          className="mt-1 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 rounded-lg resize-none"
                          rows={2}
                        />
                        {amenitiesForm.formState.errors.amenities?.[index]?.description && (
                          <p className="text-red-500 text-xs mt-1">{amenitiesForm.formState.errors.amenities[index]?.description?.message}</p>
                        )}
                      </div>

                      {/* Booking Rules */}
                      <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                        <div className="flex items-center gap-2 mb-3">
                          <Clock className="w-4 h-4 text-slate-500" />
                          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Booking Rules</span>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          <div>
                            <Label className="text-xs text-slate-500">Max People</Label>
                            <Input
                              type="number"
                              min="1"
                              max="100"
                              {...amenitiesForm.register(`amenities.${index}.maxPeople`, { valueAsNumber: true })}
                              className="mt-1 h-9 text-sm bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 rounded-lg"
                            />
                          </div>
                          <div>
                            <Label className="text-xs text-slate-500">Slot (hours)</Label>
                            <Input
                              type="number"
                              min="0.5"
                              max="8"
                              step="0.5"
                              {...amenitiesForm.register(`amenities.${index}.slotDuration`, { valueAsNumber: true })}
                              className="mt-1 h-9 text-sm bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 rounded-lg"
                            />
                          </div>
                          <div>
                            <Label className="text-xs text-slate-500">Weekday Start</Label>
                            <Input
                              type="time"
                              {...amenitiesForm.register(`amenities.${index}.weekdayStartTime`)}
                              className="mt-1 h-9 text-sm bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 rounded-lg"
                            />
                          </div>
                          <div>
                            <Label className="text-xs text-slate-500">Weekday End</Label>
                            <Input
                              type="time"
                              {...amenitiesForm.register(`amenities.${index}.weekdayEndTime`)}
                              className="mt-1 h-9 text-sm bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 rounded-lg"
                            />
                          </div>
                          <div>
                            <Label className="text-xs text-slate-500">Weekend Start</Label>
                            <Input
                              type="time"
                              {...amenitiesForm.register(`amenities.${index}.weekendStartTime`)}
                              className="mt-1 h-9 text-sm bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 rounded-lg"
                            />
                          </div>
                          <div>
                            <Label className="text-xs text-slate-500">Weekend End</Label>
                            <Input
                              type="time"
                              {...amenitiesForm.register(`amenities.${index}.weekendEndTime`)}
                              className="mt-1 h-9 text-sm bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 rounded-lg"
                            />
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
                    className="w-full h-11 border-dashed border-slate-300 dark:border-slate-700 hover:border-indigo-500 dark:hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-500/5 rounded-xl"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Another Amenity
                  </Button>

                  <div className="flex justify-between pt-4">
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => setCurrentStep(1)}
                      className="text-slate-600 dark:text-slate-400"
                    >
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Back
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={loading}
                      className="h-11 px-6 bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 rounded-xl font-medium"
                    >
                      {loading ? 'Creating...' : (
                        <>
                          Continue
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </div>
            </motion.div>
          )}

          {/* Step 3: Access Codes */}
          {currentStep === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                <div className="p-6 sm:p-8 border-b border-slate-200 dark:border-slate-800">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-500/10">
                      <Key className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Generate Access Codes</h2>
                  </div>
                  <p className="text-slate-600 dark:text-slate-400">Create invite codes for residents to join your community</p>
                </div>
                
                <form onSubmit={accessCodesForm.handleSubmit(handleAccessCodesSubmit)} className="p-6 sm:p-8 space-y-6">
                  <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-500/5 border border-emerald-200 dark:border-emerald-500/20">
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-500/10">
                        <Users className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-emerald-900 dark:text-emerald-200 mb-1 text-sm">How it works</h3>
                        <p className="text-sm text-emerald-700 dark:text-emerald-300/80 leading-relaxed">
                          Share these unique codes with residents. They'll use them to sign up and automatically join your community.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="codeCount" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      Number of Access Codes
                    </Label>
                    <Input
                      id="codeCount"
                      type="number"
                      min="1"
                      max="50"
                      {...accessCodesForm.register('codeCount', { valueAsNumber: true })}
                      className="h-12 text-base bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-xl focus:border-emerald-500 focus:ring-emerald-500/20"
                    />
                    {accessCodesForm.formState.errors.codeCount && (
                      <p className="text-red-500 text-sm">{accessCodesForm.formState.errors.codeCount.message}</p>
                    )}
                    <p className="text-xs text-slate-500">You can generate more codes later from settings</p>
                  </div>

                  <div className="flex justify-between pt-4">
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => setCurrentStep(2)}
                      className="text-slate-600 dark:text-slate-400"
                    >
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Back
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={loading}
                      className="h-11 px-6 bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 rounded-xl font-medium"
                    >
                      {loading ? 'Generating...' : 'Generate Codes'}
                    </Button>
                  </div>
                </form>
              </div>
            </motion.div>
          )}

          {/* Step 4: Cancellation Policy */}
          {currentStep === 4 && (
            <motion.div
              key="step4"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                <div className="p-6 sm:p-8 border-b border-slate-200 dark:border-slate-800">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-500/10">
                      <Shield className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                    </div>
                    <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Cancellation Policy</h2>
                  </div>
                  <p className="text-slate-600 dark:text-slate-400">Configure booking cancellation rules for your community</p>
                </div>
                
                <div className="p-6 sm:p-8">
                  <CancellationPolicySettings />
                  
                  <div className="flex justify-between pt-6 mt-6 border-t border-slate-200 dark:border-slate-800">
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => setCurrentStep(3)}
                      className="text-slate-600 dark:text-slate-400"
                    >
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Back
                    </Button>
                    <Button 
                      onClick={() => setCurrentStep(5)}
                      className="h-11 px-6 bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 rounded-xl font-medium"
                    >
                      Continue
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Step 5: Complete */}
          {currentStep === 5 && (
            <motion.div
              key="step5"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
            >
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                <div className="p-8 sm:p-12 text-center">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: 'spring', stiffness: 200, damping: 15 }}
                    className="mx-auto mb-6 w-20 h-20 rounded-full flex items-center justify-center bg-gradient-to-br from-emerald-500 to-green-600 shadow-lg shadow-emerald-500/25"
                  >
                    <CheckCircle className="w-10 h-10 text-white" />
                  </motion.div>
                  
                  <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mb-2">
                    Setup Complete! 🎉
                  </h2>
                  <p className="text-slate-600 dark:text-slate-400 mb-8">
                    Your community <span className="font-semibold text-slate-900 dark:text-white">{communityName}</span> is ready to go!
                  </p>

                  {/* Access Codes Display */}
                  {generatedCodes.length > 0 && (
                    <div className="mb-8 p-6 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <Key className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                          <h3 className="font-semibold text-slate-900 dark:text-white">Access Codes</h3>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={copyAllCodes}
                          className="text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/10"
                        >
                          <Copy className="w-4 h-4 mr-2" />
                          Copy All
                        </Button>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                        {generatedCodes.map((code, index) => (
                          <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                          >
                            <Badge 
                              variant="secondary" 
                              className="w-full py-2 px-3 font-mono text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 justify-center cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800"
                              onClick={() => {
                                navigator.clipboard.writeText(code);
                                toast.success(`Copied: ${code}`);
                              }}
                            >
                              {code}
                            </Badge>
                          </motion.div>
                        ))}
                      </div>
                      <p className="text-xs text-slate-500 mt-3">Click any code to copy it</p>
                    </div>
                  )}

                  <Button
                    onClick={() => {
                      sessionStorage.setItem('onboarding-completed', 'true');
                      router.push('/dashboard?from=onboarding');
                    }}
                    size="lg"
                    className="h-12 px-8 bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 rounded-xl font-semibold shadow-lg"
                  >
                    Go to Dashboard
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
