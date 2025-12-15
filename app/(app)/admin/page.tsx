'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
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
  Plus, 
  Edit2, 
  Trash2, 
  Save,
  X,
  Users,
  Clock,
  Calendar as CalendarIcon,
  Settings,
  Ban,
  CheckCircle,
  AlertTriangle,
  CalendarDays,
  Star
} from 'lucide-react';
import { toast } from 'sonner';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogPortal, DialogOverlay } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { collection, query, where, getDocs, doc, updateDoc, deleteDoc, addDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { notifyDateSpecificBlock } from '@/lib/notification-helpers';
import { useNotifications } from '@/components/notifications/NotificationSystem';
import { useCommunityNotifications } from '@/hooks/use-community-notifications';

// Schema for editing amenities
const amenityEditSchema = z.object({
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

type AmenityEditData = z.infer<typeof amenityEditSchema>;

interface Amenity {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  communityId: string;
  isActive: boolean;
  isBlocked?: boolean;
  blockReason?: string;
  blockedAt?: any;
  booking?: {
    maxPeople: number;
    slotDuration: number;
    weekdayHours: {
      startTime: string;
      endTime: string;
    };
    weekendHours: {
      startTime: string;
      endTime: string;
    };
  };
  rules?: {
    maxSlotsPerFamily: number;
    blackoutDates: any[];
  };
}

export default function AdminPanel() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { addNotification } = useNotifications();
  const { sendAmenityBlockNotification, sendAmenityUnblockNotification, sendInstantBlockNotification } = useCommunityNotifications();
  const [amenities, setAmenities] = useState<Amenity[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  
  // New state for date blocking functionality
  const [showDateBlockDialog, setShowDateBlockDialog] = useState(false);
  const [selectedAmenityForBlock, setSelectedAmenityForBlock] = useState<Amenity | null>(null);
  const [selectedDates, setSelectedDates] = useState<Date[]>([]);
  const [festiveReason, setFestiveReason] = useState('');
  const [isSelectingDateRange, setIsSelectingDateRange] = useState(false);

  // Check admin access
  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session?.user?.email || session.user.role !== 'admin') {
      router.push('/dashboard');
      return;
    }
    
    fetchAmenities();
  }, [session, status, router]);

  const fetchAmenities = async () => {
    try {
      if (!session?.user?.communityId) return;

      const q = query(
        collection(db, 'amenities'),
        where('communityId', '==', session.user.communityId)
      );
      const querySnapshot = await getDocs(q);
      
      const amenityList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Amenity[];
      
      amenityList.sort((a, b) => a.name.localeCompare(b.name));
      setAmenities(amenityList);
    } catch (error) {
      console.error('Error fetching amenities:', error);
      toast.error('Failed to fetch amenities');
    } finally {
      setLoading(false);
    }
  };

  const editForm = useForm<AmenityEditData>({
    resolver: zodResolver(amenityEditSchema),
  });

  const addForm = useForm<AmenityEditData>({
    resolver: zodResolver(amenityEditSchema),
    defaultValues: {
      name: '',
      description: '',
      imageUrl: '',
      maxPeople: 6,
      slotDuration: 2,
      weekdayStartTime: '09:00',
      weekdayEndTime: '21:00',
      weekendStartTime: '08:00',
      weekendEndTime: '22:00',
    },
  });

  const startEdit = (amenity: Amenity) => {
    setEditingId(amenity.id);
    editForm.reset({
      name: amenity.name,
      description: amenity.description,
      imageUrl: amenity.imageUrl,
      maxPeople: amenity.booking?.maxPeople || 6,
      slotDuration: amenity.booking?.slotDuration || 2,
      weekdayStartTime: amenity.booking?.weekdayHours?.startTime || '09:00',
      weekdayEndTime: amenity.booking?.weekdayHours?.endTime || '21:00',
      weekendStartTime: amenity.booking?.weekendHours?.startTime || '08:00',
      weekendEndTime: amenity.booking?.weekendHours?.endTime || '22:00',
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    editForm.reset();
  };

  const saveEdit = async (data: AmenityEditData) => {
    try {
      const amenityRef = doc(db, 'amenities', editingId!);
      await updateDoc(amenityRef, {
        name: data.name.trim(),
        description: data.description.trim(),
        imageUrl: data.imageUrl || undefined,
        booking: {
          maxPeople: data.maxPeople,
          slotDuration: data.slotDuration,
          weekdayHours: {
            startTime: data.weekdayStartTime,
            endTime: data.weekdayEndTime,
          },
          weekendHours: {
            startTime: data.weekendStartTime,
            endTime: data.weekendEndTime,
          },
        },
        // Also update operatingHours for backward compatibility
        operatingHours: {
          start: data.weekdayStartTime,
          end: data.weekdayEndTime,
        },
        rules: {
          maxSlotsPerFamily: data.maxPeople,
          blackoutDates: [],
        },
        // CRITICAL: Clear custom time slots so they regenerate
        timeSlots: [],
        weekdaySlots: [],
        weekendSlots: [],
        updatedAt: new Date(),
      });

      toast.success('Amenity updated successfully');
      setEditingId(null);
      fetchAmenities();
    } catch (error) {
      console.error('Error updating amenity:', error);
      toast.error('Failed to update amenity');
    }
  };

  const deleteAmenity = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"? This cannot be undone.`)) {
      return;
    }

    try {
      await deleteDoc(doc(db, 'amenities', id));
      toast.success('Amenity deleted successfully');
      fetchAmenities();
    } catch (error) {
      console.error('Error deleting amenity:', error);
      toast.error('Failed to delete amenity');
    }
  };

  const toggleAmenityBlock = async (id: string, name: string, currentStatus: boolean) => {
    const action = currentStatus ? 'unblock' : 'block';
    const reason = currentStatus ? '' : prompt(`Reason for blocking "${name}" (e.g., Festive Season, Maintenance):`) || 'Administrative block';
    
    if (!currentStatus && !reason.trim()) {
      return; // User cancelled or didn't provide reason
    }

    try {
      await updateDoc(doc(db, 'amenities', id), {
        isBlocked: !currentStatus,
        blockReason: !currentStatus ? reason : null,
        blockedAt: !currentStatus ? new Date() : null,
        updatedAt: new Date(),
      });

      // Send community notification for instant blocking/unblocking
      if (!currentStatus) {
        // Blocking the amenity
        await sendInstantBlockNotification(name, reason);
        
        // Send email to all residents
        try {
          await fetch('/api/notifications/amenity-block', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              amenityName: name,
              reason: reason,
              startDate: new Date().toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              }),
              endDate: 'Until further notice',
              communityId: session?.user?.communityId,
              communityName: (session?.user as any)?.communityName || 'Your Community',
              isFestive: false,
            }),
          });
          console.log('✅ Amenity block emails sent to all residents');
        } catch (emailError) {
          console.error('⚠️ Failed to send block emails:', emailError);
          // Don't fail the block if email fails
        }
      } else {
        // Unblocking the amenity
        addNotification({
          title: `✅ ${name} Now Available`,
          message: `Good news! ${name} is now available for booking. The block has been removed.`,
          type: 'success',
          priority: 'medium',
          category: 'amenity',
          autoHide: true,
          duration: 6000
        });
        
        // Send email notification for unblock - IMMEDIATE parallel sending
        try {
          const response = await fetch('/api/notifications/amenity-unblock', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              amenityName: name,
              communityId: session?.user?.communityId,
              communityName: (session?.user as any)?.communityName || 'Your Community',
            }),
          });
          
          const result = await response.json();
          console.log(`✅ Amenity unblock emails sent: ${result.sent}/${result.total} residents`);
          
          if (result.failed > 0) {
            console.warn(`⚠️ ${result.failed} emails failed to send`);
          }
        } catch (emailError) {
          console.error('⚠️ Failed to send unblock emails:', emailError);
          // Don't fail the unblock if email fails
        }
      }

      toast.success(`Amenity ${action}ed successfully`);
      fetchAmenities();
    } catch (error) {
      console.error(`Error ${action}ing amenity:`, error);
      toast.error(`Failed to ${action} amenity`);
    }
  };

  const addAmenity = async (data: AmenityEditData) => {
    try {
      await addDoc(collection(db, 'amenities'), {
        name: data.name.trim(),
        description: data.description.trim(),
        imageUrl: data.imageUrl || 'https://images.unsplash.com/photo-1584735935682-2f2b69d4e0d3?w=800&q=80',
        communityId: session?.user?.communityId,
        isActive: true,
        booking: {
          maxPeople: data.maxPeople,
          slotDuration: data.slotDuration,
          weekdayHours: {
            startTime: data.weekdayStartTime,
            endTime: data.weekdayEndTime,
          },
          weekendHours: {
            startTime: data.weekendStartTime,
            endTime: data.weekendEndTime,
          },
        },
        rules: {
          maxSlotsPerFamily: data.maxPeople,
          blackoutDates: [],
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      toast.success('Amenity added successfully');
      setShowAddForm(false);
      addForm.reset();
      fetchAmenities();
    } catch (error) {
      console.error('Error adding amenity:', error);
      toast.error('Failed to add amenity');
    }
  };

  // New function for date-specific blocking
  const handleDateBlocking = (amenity: Amenity) => {
    setSelectedAmenityForBlock(amenity);
    const validDates = amenity.rules?.blackoutDates
      ?.map((date: any) => new Date(date))
      .filter((date: Date) => date instanceof Date && !isNaN(date.getTime())) || [];
    setSelectedDates(validDates);
    setFestiveReason('');
    setShowDateBlockDialog(true);
  };

  const addBlackoutDates = async () => {
    if (!selectedAmenityForBlock || selectedDates.length === 0) {
      toast.error('Please select at least one date to block');
      return;
    }

    const reason = festiveReason.trim() || 'Festive Season Blocking';

    try {
      const existingBlackoutDates = selectedAmenityForBlock.rules?.blackoutDates || [];
      const newBlackoutDates = [...existingBlackoutDates];
      
      selectedDates.forEach(date => {
        if (date instanceof Date && !isNaN(date.getTime())) {
          const dateString = date.toISOString().split('T')[0];
          if (!newBlackoutDates.some((d: any) => {
            const existingDateString = d instanceof Date ? d.toISOString().split('T')[0] : d.split('T')[0];
            return existingDateString === dateString;
          })) {
            newBlackoutDates.push({
              date: date,
              reason: reason,
              addedAt: new Date(),
              addedBy: session?.user?.email
            });
          }
        }
      });

      await updateDoc(doc(db, 'amenities', selectedAmenityForBlock.id), {
        'rules.blackoutDates': newBlackoutDates,
        updatedAt: new Date(),
      });

      // Send notification to all users about the blocked dates
      await notifyDateSpecificBlock(
        selectedAmenityForBlock.name,
        selectedDates,
        reason
      );

      // Send real-time community notification
      await sendAmenityBlockNotification(
        selectedAmenityForBlock.name,
        selectedDates,
        reason
      );

      // Send email to all residents about festive blocking
      try {
        const startDate = selectedDates[0].toLocaleDateString('en-US', { 
          weekday: 'long', 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        });
        const endDate = selectedDates[selectedDates.length - 1].toLocaleDateString('en-US', { 
          weekday: 'long', 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        });
        
        await fetch('/api/notifications/amenity-block', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            amenityName: selectedAmenityForBlock.name,
            reason: reason,
            startDate: startDate,
            endDate: endDate,
            communityId: session?.user?.communityId,
            communityName: (session?.user as any)?.communityName || 'Your Community',
            isFestive: true,
          }),
        });
        console.log('✅ Festive block emails sent to all residents');
      } catch (emailError) {
        console.error('⚠️ Failed to send festive block emails:', emailError);
        // Don't fail the block if email fails
      }

      toast.success(`Added ${selectedDates.length} blackout date(s) for ${selectedAmenityForBlock.name}`);
      setShowDateBlockDialog(false);
      setSelectedDates([]);
      setFestiveReason('');
      fetchAmenities();
    } catch (error) {
      console.error('Error adding blackout dates:', error);
      toast.error('Failed to add blackout dates');
    }
  };

  const removeBlackoutDate = async (amenityId: string, dateToRemove: any) => {
    try {
      const amenity = amenities.find(a => a.id === amenityId);
      if (!amenity) return;

      const updatedBlackoutDates = (amenity.rules?.blackoutDates || []).filter((d: any) => {
        // More robust comparison - compare the actual blackout items
        return d !== dateToRemove;
      });

      await updateDoc(doc(db, 'amenities', amenityId), {
        'rules.blackoutDates': updatedBlackoutDates,
        updatedAt: new Date(),
      });

      // Add notification for date removal with better date handling
      let removedDateDisplay = '';
      try {
        if (dateToRemove?.date) {
          if (dateToRemove.date instanceof Date) {
            removedDateDisplay = dateToRemove.date.toLocaleDateString();
          } else if (dateToRemove.date.seconds) {
            removedDateDisplay = new Date(dateToRemove.date.seconds * 1000).toLocaleDateString();
          } else {
            removedDateDisplay = new Date(dateToRemove.date).toLocaleDateString();
          }
        } else if (dateToRemove instanceof Date) {
          removedDateDisplay = dateToRemove.toLocaleDateString();
        } else if (dateToRemove?.seconds) {
          removedDateDisplay = new Date(dateToRemove.seconds * 1000).toLocaleDateString();
        } else {
          removedDateDisplay = new Date(dateToRemove).toLocaleDateString();
        }
      } catch (error) {
        removedDateDisplay = 'Selected date';
      }
      
      // Send community notification for date removal
      await sendAmenityUnblockNotification(amenity.name, removedDateDisplay);

      toast.success('Blackout date removed successfully');
      fetchAmenities();
    } catch (error) {
      console.error('Error removing blackout date:', error);
      toast.error('Failed to remove blackout date');
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse">
            <Settings className="w-8 h-8 text-white" />
          </div>
          <p className="text-slate-800 dark:text-slate-400">Loading admin panel...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-purple-50 dark:from-slate-950 dark:to-purple-950/20 p-3 sm:p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Enhanced Header with floating elements */}
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
          className="mb-6 sm:mb-8 md:mb-10 lg:mb-12 relative"
        >
          {/* Floating decorative elements */}
          <div className="absolute -top-4 -right-4 w-20 h-20 bg-gradient-to-br from-blue-400/20 to-purple-600/20 rounded-full blur-xl"></div>
          <div className="absolute -bottom-4 -left-4 w-16 h-16 bg-gradient-to-br from-purple-400/20 to-pink-600/20 rounded-full blur-xl"></div>
          
          <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4 sm:gap-5 md:gap-6 p-4 sm:p-5 md:p-6 lg:p-8 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl rounded-2xl sm:rounded-3xl shadow-2xl border border-white/20 dark:border-slate-700/20 relative overflow-hidden">
            {/* Animated background pattern */}
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-600/5 dark:from-blue-500/10 dark:to-purple-600/10"></div>
            
            <div className="flex items-center gap-3 sm:gap-4 md:gap-6 relative z-10">
              <motion.div
                className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-xl"
                whileHover={{ rotate: 360, scale: 1.1 }}
                transition={{ duration: 0.6 }}
              >
                <Settings className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-white" />
              </motion.div>
              <div>
                <motion.h1 
                  className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-slate-800 to-purple-600 dark:from-white dark:to-purple-400 bg-clip-text text-transparent mb-1 sm:mb-2"
                  initial={{ x: -20 }}
                  animate={{ x: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  Admin Panel
                </motion.h1>
                <motion.p 
                  className="text-slate-600 dark:text-slate-400 text-sm sm:text-base md:text-lg"
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.4 }}
                >
                  Manage your community amenities with festive season controls
                </motion.p>
              </div>
            </div>
            
            <motion.div
              className="relative z-10 w-full lg:w-auto"
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button
                onClick={() => setShowAddForm(true)}
                className="w-full lg:w-auto bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-300"
                size="lg"
              >
                <Plus className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                Add Amenity
              </Button>
            </motion.div>
          </div>
        </motion.div>

        {/* Enhanced Add Form */}
        {showAddForm && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -30, scale: 0.95 }}
            transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
            className="mb-4 sm:mb-6 md:mb-8"
          >
            <Card className="border-0 shadow-2xl bg-gradient-to-br from-white to-blue-50 dark:from-slate-900 dark:to-blue-950/20 overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-purple-600"></div>
              <CardHeader className="pb-3 sm:pb-4 px-4 sm:px-6">
                <CardTitle className="flex items-center justify-between text-base sm:text-lg md:text-xl">
                  Add New Amenity
                  <Button variant="ghost" size="sm" onClick={() => setShowAddForm(false)}>
                    <X className="w-4 h-4" />
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 sm:px-6">
                <form onSubmit={addForm.handleSubmit(addAmenity)} className="space-y-3 sm:space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                    <div>
                      <Label className="text-xs sm:text-sm">Name</Label>
                      <Input {...addForm.register('name')} placeholder="e.g., Swimming Pool" className="text-sm sm:text-base" />
                      {addForm.formState.errors.name && (
                        <p className="text-red-500 text-xs sm:text-sm mt-1">{addForm.formState.errors.name.message}</p>
                      )}
                    </div>
                    <div>
                      <Label className="text-xs sm:text-sm">Image URL (optional)</Label>
                      <Input {...addForm.register('imageUrl')} placeholder="Leave empty for auto-selection" className="text-sm sm:text-base" />
                    </div>
                  </div>

                  <div>
                    <Label className="text-xs sm:text-sm">Description</Label>
                    <Textarea {...addForm.register('description')} placeholder="Describe this amenity..." rows={3} className="text-sm sm:text-base" />
                    {addForm.formState.errors.description && (
                      <p className="text-red-500 text-xs sm:text-sm mt-1">{addForm.formState.errors.description.message}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div>
                      <Label className="text-xs sm:text-sm">Max People</Label>
                      <Input type="number" min="1" max="100" {...addForm.register('maxPeople', { valueAsNumber: true })} className="text-sm sm:text-base" />
                    </div>
                    <div>
                      <Label className="text-xs sm:text-sm">Slot Duration (hours)</Label>
                      <Input type="number" min="0.5" max="8" step="0.5" {...addForm.register('slotDuration', { valueAsNumber: true })} className="text-sm sm:text-base" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div>
                      <Label className="text-xs sm:text-sm">Weekday Hours</Label>
                      <div className="flex gap-2">
                        <Input type="time" {...addForm.register('weekdayStartTime')} className="text-sm sm:text-base" />
                        <Input type="time" {...addForm.register('weekdayEndTime')} className="text-sm sm:text-base" />
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs sm:text-sm">Weekend Hours</Label>
                      <div className="flex gap-2">
                        <Input type="time" {...addForm.register('weekendStartTime')} className="text-sm sm:text-base" />
                        <Input type="time" {...addForm.register('weekendEndTime')} className="text-sm sm:text-base" />
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2">
                    <Button type="submit" className="w-full sm:w-auto text-sm sm:text-base">Add Amenity</Button>
                    <Button type="button" variant="outline" onClick={() => setShowAddForm(false)} className="w-full sm:w-auto text-sm sm:text-base">Cancel</Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Amenities List */}
        <div className="grid gap-4 sm:gap-5 md:gap-6 lg:gap-8">
          {amenities.map((amenity, index) => (
            <motion.div
              key={amenity.id}
              initial={{ opacity: 0, y: 40, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ 
                delay: index * 0.1,
                duration: 0.7,
                ease: [0.4, 0, 0.2, 1]
              }}
              whileHover={{ 
                y: -8,
                scale: 1.02,
                transition: { duration: 0.3 }
              }}
              className="group"
            >
              <Card className="border-0 shadow-xl bg-gradient-to-br from-white via-slate-50 to-white dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 hover:shadow-2xl transition-all duration-500 overflow-hidden relative">
                {/* Animated gradient border */}
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-xl p-[2px]">
                  <div className="bg-white dark:bg-slate-900 rounded-xl h-full w-full"></div>
                </div>
                
                {/* Floating particles effect */}
                <div className="absolute top-4 right-4 w-2 h-2 bg-blue-400 rounded-full opacity-0 group-hover:opacity-100 animate-ping"></div>
                <div className="absolute top-8 right-8 w-1 h-1 bg-purple-400 rounded-full opacity-0 group-hover:opacity-100 animate-pulse delay-100"></div>
                
                <CardContent className="p-4 sm:p-6 md:p-8 relative z-10">
                  {editingId === amenity.id ? (
                    // Edit Form
                    <form onSubmit={editForm.handleSubmit(saveEdit)} className="space-y-3 sm:space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                        <div>
                          <Label className="text-xs sm:text-sm">Name</Label>
                          <Input {...editForm.register('name')} className="text-sm sm:text-base" />
                          {editForm.formState.errors.name && (
                            <p className="text-red-500 text-xs sm:text-sm mt-1">{editForm.formState.errors.name.message}</p>
                          )}
                        </div>
                        <div>
                          <Label className="text-xs sm:text-sm">Image URL</Label>
                          <Input {...editForm.register('imageUrl')} className="text-sm sm:text-base" />
                        </div>
                      </div>

                      <div>
                        <Label className="text-xs sm:text-sm">Description</Label>
                        <Textarea {...editForm.register('description')} rows={3} className="text-sm sm:text-base" />
                        {editForm.formState.errors.description && (
                          <p className="text-red-500 text-xs sm:text-sm mt-1">{editForm.formState.errors.description.message}</p>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                        <div>
                          <Label className="text-xs sm:text-sm">Max People</Label>
                          <Input type="number" min="1" max="100" {...editForm.register('maxPeople', { valueAsNumber: true })} className="text-sm sm:text-base" />
                        </div>
                        <div>
                          <Label className="text-xs sm:text-sm">Slot Duration (hours)</Label>
                          <Input type="number" min="0.5" max="8" step="0.5" {...editForm.register('slotDuration', { valueAsNumber: true })} className="text-sm sm:text-base" />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                        <div>
                          <Label className="text-xs sm:text-sm">Weekday Hours</Label>
                          <div className="flex gap-2">
                            <Input type="time" {...editForm.register('weekdayStartTime')} className="text-sm sm:text-base" />
                            <Input type="time" {...editForm.register('weekdayEndTime')} className="text-sm sm:text-base" />
                          </div>
                        </div>
                        <div>
                          <Label className="text-xs sm:text-sm">Weekend Hours</Label>
                          <div className="flex gap-2">
                            <Input type="time" {...editForm.register('weekendStartTime')} className="text-sm sm:text-base" />
                            <Input type="time" {...editForm.register('weekendEndTime')} className="text-sm sm:text-base" />
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row gap-2">
                        <Button type="submit" className="w-full sm:w-auto text-sm sm:text-base">
                          <Save className="w-4 h-4 mr-2" />
                          Save
                        </Button>
                        <Button type="button" variant="outline" onClick={cancelEdit} className="w-full sm:w-auto text-sm sm:text-base">
                          <X className="w-4 h-4 mr-2" />
                          Cancel
                        </Button>
                      </div>
                    </form>
                  ) : (
                    // Display Mode - Enhanced with animations and responsive design
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.5 }}
                      className="flex flex-col lg:flex-row gap-4 sm:gap-5 md:gap-6"
                    >
                      {/* Amenity Image with hover effects */}
                      <motion.div 
                        className="relative group/image"
                        whileHover={{ scale: 1.05 }}
                        transition={{ duration: 0.3 }}
                      >
                        <div className="relative overflow-hidden rounded-xl shadow-lg">
                          <img
                            src={amenity.imageUrl}
                            alt={amenity.name}
                            className="w-full lg:w-32 xl:w-40 h-40 sm:h-48 lg:h-32 xl:lg:h-40 object-cover transition-transform duration-500 group-hover/image:scale-110"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover/image:opacity-100 transition-opacity duration-300"></div>
                          
                          {/* Floating status indicator */}
                          {amenity.isBlocked && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="absolute top-2 sm:top-3 left-2 sm:left-3"
                            >
                              <Badge variant="destructive" className="flex items-center gap-1 shadow-lg text-xs sm:text-sm">
                                <Ban className="w-3 h-3" />
                                Blocked
                              </Badge>
                            </motion.div>
                          )}
                        </div>
                      </motion.div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start mb-4 sm:mb-5 md:mb-6">
                          <motion.div 
                            className="mb-3 sm:mb-4 lg:mb-0"
                            initial={{ x: -20, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            transition={{ delay: 0.2 }}
                          >
                            <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
                              <h3 className="text-lg sm:text-xl md:text-2xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
                                {amenity.name}
                              </h3>
                            </div>
                            <p className="text-slate-600 dark:text-slate-400 text-sm sm:text-base leading-relaxed">
                              {amenity.description}
                            </p>
                            {amenity.isBlocked && amenity.blockReason && (
                              <motion.p 
                                initial={{ y: 10, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                className="text-red-600 dark:text-red-400 text-xs sm:text-sm mt-2 font-medium flex items-center gap-2"
                              >
                                <AlertTriangle className="w-3 h-3 sm:w-4 sm:h-4" />
                                Reason: {amenity.blockReason}
                              </motion.p>
                            )}
                          </motion.div>
                          
                          <motion.div 
                            className="flex flex-wrap gap-2"
                            initial={{ x: 20, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            transition={{ delay: 0.3 }}
                          >
                            <Button 
                              variant={amenity.isBlocked ? "default" : "destructive"} 
                              size="sm" 
                              onClick={() => toggleAmenityBlock(amenity.id, amenity.name, amenity.isBlocked || false)}
                              className={`text-xs sm:text-sm ${amenity.isBlocked ? "bg-green-600 hover:bg-green-700" : ""}`}
                            >
                              {amenity.isBlocked ? (
                                <>
                                  <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                                  Unblock
                                </>
                              ) : (
                                <>
                                  <Ban className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                                  Block
                                </>
                              )}
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => handleDateBlocking(amenity)}
                              className="bg-gradient-to-r from-orange-500 to-red-500 text-white border-none hover:from-orange-600 hover:to-red-600 text-xs sm:text-sm"
                            >
                              <CalendarDays className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                              Festive Block
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => startEdit(amenity)} className="text-xs sm:text-sm">
                              <Edit2 className="w-3 h-3 sm:w-4 sm:h-4" />
                            </Button>
                            <Button variant="destructive" size="sm" onClick={() => deleteAmenity(amenity.id, amenity.name)} className="text-xs sm:text-sm">
                              <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                            </Button>
                          </motion.div>
                        </div>

                        {/* Enhanced stats section with animations */}
                        <motion.div 
                          className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 md:gap-4 text-xs sm:text-sm"
                          initial={{ y: 20, opacity: 0 }}
                          animate={{ y: 0, opacity: 1 }}
                          transition={{ delay: 0.4 }}
                        >
                          <motion.div 
                            className="flex items-center gap-2 p-2 sm:p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg"
                            whileHover={{ scale: 1.05 }}
                            transition={{ duration: 0.2 }}
                          >
                            <Users className="w-3 h-3 sm:w-4 sm:h-4 text-blue-500" />
                            <span className="font-medium">Max {amenity.booking?.maxPeople || 6}</span>
                          </motion.div>
                          <motion.div 
                            className="flex items-center gap-2 p-2 sm:p-3 bg-green-50 dark:bg-green-950/20 rounded-lg"
                            whileHover={{ scale: 1.05 }}
                            transition={{ duration: 0.2 }}
                          >
                            <Clock className="w-3 h-3 sm:w-4 sm:h-4 text-green-500" />
                            <span className="font-medium">{amenity.booking?.slotDuration || 2}h slots</span>
                          </motion.div>
                          <motion.div 
                            className="flex items-center gap-1 sm:gap-2 p-2 sm:p-3 bg-purple-50 dark:bg-purple-950/20 rounded-lg"
                            whileHover={{ scale: 1.05 }}
                            transition={{ duration: 0.2 }}
                          >
                            <CalendarIcon className="w-3 h-3 sm:w-4 sm:h-4 text-purple-500 flex-shrink-0" />
                            <span className="font-medium text-[10px] sm:text-xs truncate">
                              WD: {amenity.booking?.weekdayHours?.startTime || '09:00'}-{amenity.booking?.weekdayHours?.endTime || '21:00'}
                            </span>
                          </motion.div>
                          <motion.div 
                            className="flex items-center gap-1 sm:gap-2 p-2 sm:p-3 bg-orange-50 dark:bg-orange-950/20 rounded-lg"
                            whileHover={{ scale: 1.05 }}
                            transition={{ duration: 0.2 }}
                          >
                            <CalendarIcon className="w-3 h-3 sm:w-4 sm:h-4 text-orange-500 flex-shrink-0" />
                            <span className="font-medium text-[10px] sm:text-xs truncate">
                              WE: {amenity.booking?.weekendHours?.startTime || '08:00'}-{amenity.booking?.weekendHours?.endTime || '22:00'}
                            </span>
                          </motion.div>
                        </motion.div>

                        {/* Enhanced blackout dates display */}
                        {amenity.rules?.blackoutDates && amenity.rules.blackoutDates.length > 0 && (
                          <motion.div 
                            className="mt-4 sm:mt-5 md:mt-6 p-3 sm:p-4 bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-950/20 dark:to-orange-950/20 rounded-xl border border-red-200 dark:border-red-800"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.5 }}
                          >
                            <motion.h4 
                              className="font-semibold text-red-800 dark:text-red-200 mb-2 sm:mb-3 flex items-center gap-2 text-sm sm:text-base"
                              initial={{ x: -10 }}
                              animate={{ x: 0 }}
                            >
                              <Star className="w-3 h-3 sm:w-4 sm:h-4 animate-pulse" />
                              Festive Blocked Dates ({amenity.rules.blackoutDates.length})
                            </motion.h4>
                            <div className="flex flex-wrap gap-2">
                              {amenity.rules.blackoutDates.slice(0, 8).map((blackoutItem: any, index: number) => {
                                let displayDate = '';
                                let dateForRemoval = blackoutItem;
                                
                                try {
                                  // Handle different date formats
                                  if (blackoutItem?.date) {
                                    // If it's an object with a date property
                                    if (blackoutItem.date instanceof Date) {
                                      displayDate = blackoutItem.date.toLocaleDateString();
                                    } else if (blackoutItem.date.seconds) {
                                      // Firestore timestamp
                                      displayDate = new Date(blackoutItem.date.seconds * 1000).toLocaleDateString();
                                    } else {
                                      // String date
                                      const parsedDate = new Date(blackoutItem.date);
                                      displayDate = !isNaN(parsedDate.getTime()) ? parsedDate.toLocaleDateString() : 'Invalid Date';
                                    }
                                  } else if (blackoutItem instanceof Date) {
                                    // Direct Date object
                                    displayDate = blackoutItem.toLocaleDateString();
                                  } else if (blackoutItem?.seconds) {
                                    // Direct Firestore timestamp
                                    displayDate = new Date(blackoutItem.seconds * 1000).toLocaleDateString();
                                  } else if (typeof blackoutItem === 'string') {
                                    // Direct string date
                                    const parsedDate = new Date(blackoutItem);
                                    displayDate = !isNaN(parsedDate.getTime()) ? parsedDate.toLocaleDateString() : blackoutItem;
                                  } else {
                                    displayDate = 'Invalid Date';
                                  }
                                } catch (error) {
                                  console.error('Date parsing error:', error, blackoutItem);
                                  displayDate = 'Invalid Date';
                                }
                                
                                const reason = blackoutItem?.reason || 'Blocked';
                                
                                return (
                                  <motion.div
                                    key={index}
                                    className="group relative inline-flex items-center gap-1 px-2 sm:px-3 py-1 sm:py-2 bg-gradient-to-r from-red-100 to-orange-100 dark:from-red-900/30 dark:to-orange-900/30 text-red-800 dark:text-red-200 text-[10px] sm:text-xs rounded-full border border-red-200 dark:border-red-700 shadow-sm"
                                    initial={{ scale: 0, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    transition={{ delay: index * 0.1 }}
                                    whileHover={{ scale: 1.05 }}
                                  >
                                    <span className="font-medium">{displayDate}</span>
                                    <button
                                      onClick={() => removeBlackoutDate(amenity.id, blackoutItem)}
                                      className="opacity-0 group-hover:opacity-100 transition-all duration-200 ml-1 text-red-600 hover:text-red-800 hover:bg-red-200 dark:hover:bg-red-800 rounded-full p-0.5 sm:p-1"
                                      title={`Remove ${displayDate} (${reason})`}
                                    >
                                      <X className="w-2 h-2 sm:w-3 sm:h-3" />
                                    </button>
                                  </motion.div>
                                );
                              })}
                              {amenity.rules.blackoutDates.length > 8 && (
                                <span className="text-[10px] sm:text-xs text-red-600 dark:text-red-400 px-2 py-1">
                                  +{amenity.rules.blackoutDates.length - 8} more
                                </span>
                              )}
                            </div>
                          </motion.div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {amenities.length === 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <Card className="border-0 shadow-2xl bg-gradient-to-br from-white to-blue-50 dark:from-slate-900 dark:to-blue-950/20 relative overflow-hidden">
              {/* Animated background elements */}
              <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-blue-400/10 to-purple-600/10 rounded-full blur-3xl"></div>
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-br from-purple-400/10 to-pink-600/10 rounded-full blur-2xl"></div>
              
              <CardContent className="text-center py-12 sm:py-14 md:py-16 px-4 sm:px-6 relative z-10">
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 sm:mb-6 shadow-xl">
                    <Settings className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
                  </div>
                </motion.div>
                
                <motion.h3 
                  className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-slate-800 to-purple-600 dark:from-white dark:to-purple-400 bg-clip-text text-transparent mb-2 sm:mb-3"
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  No Amenities Found
                </motion.h3>
                
                <motion.p 
                  className="text-slate-600 dark:text-slate-400 mb-4 sm:mb-6 text-base sm:text-lg max-w-md mx-auto"
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.4 }}
                >
                  Start building your community by adding your first amenity with festive season management.
                </motion.p>
                
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button 
                    onClick={() => setShowAddForm(true)}
                    className="w-full sm:w-auto bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-300"
                    size="lg"
                  >
                    <Plus className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                    Add Your First Amenity
                  </Button>
                </motion.div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>

      {/* Enhanced Date Blocking Dialog */}
      <Dialog open={showDateBlockDialog} onOpenChange={setShowDateBlockDialog}>
        <DialogPortal>
          <DialogOverlay className="dialog-overlay fixed inset-0 z-[9998] bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
          <DialogContent className="dialog-content max-w-5xl max-h-[95vh] overflow-y-auto bg-gradient-to-br from-white to-orange-50 dark:from-slate-900 dark:to-orange-950/20 border-0 shadow-2xl !z-[9999] fixed left-[50%] top-[50%] translate-x-[-50%] translate-y-[-50%] data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] rounded-lg">
          {/* Animated header with gradient */}
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-500 to-red-500"></div>
          
          <DialogHeader className="pb-6">
            <motion.div
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="flex items-center gap-3"
            >
              <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center shadow-lg">
                <CalendarDays className="w-6 h-6 text-white" />
              </div>
              <div>
                <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-slate-800 to-orange-600 dark:from-white dark:to-orange-400 bg-clip-text text-transparent">
                  Block {selectedAmenityForBlock?.name} on Specific Dates
                </DialogTitle>
                <DialogDescription className="text-base text-slate-600 dark:text-slate-400 mt-1">
                  Select dates to block this amenity during festive seasons or special events. 
                  These dates will be unavailable for booking.
                </DialogDescription>
              </div>
            </motion.div>
          </DialogHeader>

          <motion.div 
            className="space-y-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            {/* Enhanced Reason Input */}
            <motion.div 
              className="space-y-4"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <Label htmlFor="festive-reason" className="text-lg font-semibold">Reason for Blocking</Label>
              
              {/* Enhanced quick reason buttons */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
                {[
                  { emoji: '🎆', text: 'Diwali Festival', color: 'from-yellow-400 to-orange-500' },
                  { emoji: '🎄', text: 'Christmas Celebration', color: 'from-green-400 to-red-500' }, 
                  { emoji: '🎊', text: 'New Year Events', color: 'from-purple-400 to-pink-500' },
                  { emoji: '🕉️', text: 'Religious Festival', color: 'from-orange-400 to-red-500' },
                  { emoji: '🔧', text: 'Maintenance Work', color: 'from-gray-400 to-slate-500' },
                  { emoji: '👥', text: 'Community Event', color: 'from-blue-400 to-cyan-500' }
                ].map((reasonOption, index) => (
                  <motion.div
                    key={reasonOption.text}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.4 + index * 0.1 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setFestiveReason(`${reasonOption.emoji} ${reasonOption.text}`)}
                      className={`w-full h-auto p-3 transition-all duration-300 ${
                        festiveReason === `${reasonOption.emoji} ${reasonOption.text}` 
                          ? `bg-gradient-to-r ${reasonOption.color} text-white border-none shadow-lg` 
                          : 'hover:bg-gradient-to-r hover:from-slate-50 hover:to-slate-100 dark:hover:from-slate-800 dark:hover:to-slate-700'
                      }`}
                    >
                      <div className="flex flex-col items-center gap-1">
                        <span className="text-2xl">{reasonOption.emoji}</span>
                        <span className="text-xs font-medium">{reasonOption.text}</span>
                      </div>
                    </Button>
                  </motion.div>
                ))}
              </div>
              
              <Input
                id="festive-reason"
                placeholder="e.g., Diwali Festival, Christmas Celebration, Maintenance"
                value={festiveReason}
                onChange={(e) => setFestiveReason(e.target.value)}
                className="w-full"
              />
            </motion.div>

            {/* Date Selection */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Calendar */}
              <div className="space-y-3">
                <Label>Select Dates to Block</Label>
                <div className="border rounded-lg p-4">
                  <Calendar
                    mode="multiple"
                    selected={selectedDates}
                    onSelect={(dates) => {
                      const validDates = (dates || []).filter((date: Date) => 
                        date instanceof Date && !isNaN(date.getTime())
                      );
                      setSelectedDates(validDates);
                    }}
                    disabled={(date) => date < new Date()}
                    className="rounded-md"
                    classNames={{
                      months: "space-y-4",
                      month: "space-y-4",
                      caption: "flex justify-center pt-1 relative items-center",
                      caption_label: "text-sm font-medium",
                      nav: "space-x-1 flex items-center",
                      nav_button: cn(
                        "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100"
                      ),
                      nav_button_previous: "absolute left-1",
                      nav_button_next: "absolute right-1",
                      table: "w-full border-collapse space-y-1",
                      head_row: "flex",
                      head_cell: "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]",
                      row: "flex w-full mt-2",
                      cell: "text-center text-sm p-0 relative focus-within:relative focus-within:z-20",
                      day: cn(
                        "h-9 w-9 p-0 font-normal",
                        "hover:bg-accent hover:text-accent-foreground",
                        "focus:bg-accent focus:text-accent-foreground"
                      ),
                      day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
                      day_today: "bg-accent text-accent-foreground",
                      day_outside: "text-muted-foreground opacity-50",
                      day_disabled: "text-muted-foreground opacity-50",
                      day_range_middle: "aria-selected:bg-accent aria-selected:text-accent-foreground",
                      day_hidden: "invisible",
                    }}
                  />
                </div>
                <p className="text-sm text-muted-foreground">
                  Click dates to select/deselect. Multiple dates can be selected.
                </p>
              </div>

              {/* Selected Dates Preview */}
              <div className="space-y-3">
                <Label>Selected Dates ({selectedDates.length})</Label>
                <div className="border rounded-lg p-4 min-h-[300px] bg-slate-50 dark:bg-slate-900">
                  {selectedDates.length > 0 ? (
                    <div className="space-y-2">
                      {selectedDates
                        .filter((date) => date instanceof Date && !isNaN(date.getTime()))
                        .sort((a, b) => a.getTime() - b.getTime())
                        .map((date, index) => (
                          <motion.div
                            key={`date-${date.getTime()}-${index}`}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            transition={{ delay: index * 0.05 }}
                            className="flex items-center justify-between p-2 bg-white dark:bg-slate-800 rounded border"
                          >
                            <div className="flex items-center gap-2">
                              <CalendarIcon className="w-4 h-4 text-orange-500" />
                              <span className="font-medium">
                                {date.toLocaleDateString('en-US', { 
                                  weekday: 'short', 
                                  year: 'numeric', 
                                  month: 'short', 
                                  day: 'numeric' 
                                })}
                              </span>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedDates(prev => prev.filter(d => 
                                  d instanceof Date && !isNaN(d.getTime()) && d.getTime() !== date.getTime()
                                ));
                              }}
                              className="h-6 w-6 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                            >
                              <X className="w-3 h-3" />
                            </Button>
                          </motion.div>
                        ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                      <CalendarDays className="w-12 h-12 text-slate-400 mb-2" />
                      <p className="text-slate-500 font-medium">No dates selected</p>
                      <p className="text-sm text-slate-400">Choose dates from the calendar</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => {
                  setShowDateBlockDialog(false);
                  setSelectedDates([]);
                  setFestiveReason('');
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={addBlackoutDates}
                disabled={selectedDates.length === 0}
                className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
              >
                <Star className="w-4 h-4 mr-2" />
                Block {selectedDates.length} Date{selectedDates.length !== 1 ? 's' : ''}
              </Button>
            </div>
          </motion.div>
        </DialogContent>
        </DialogPortal>
      </Dialog>
    </div>
  );
}