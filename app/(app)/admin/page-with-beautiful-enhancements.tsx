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
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { collection, query, where, getDocs, doc, updateDoc, deleteDoc, addDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { notifyDateSpecificBlock } from '@/lib/notification-helpers';

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
  createdAt: any;
  updatedAt: any;
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
  const [amenities, setAmenities] = useState<Amenity[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  
  // New state for date blocking functionality
  const [showDateBlockDialog, setShowDateBlockDialog] = useState(false);
  const [selectedAmenityForBlock, setSelectedAmenityForBlock] = useState<Amenity | null>(null);
  const [selectedDates, setSelectedDates] = useState<Date[]>([]);
  const [festiveReason, setFestiveReason] = useState('');

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
    } finally {
      setLoading(false);
    }
  };

  const editForm = useForm<AmenityEditData>({
    resolver: zodResolver(amenityEditSchema),
    defaultValues: {
      weekdayStartTime: '09:00',
      weekdayEndTime: '21:00',
      weekendStartTime: '08:00',
      weekendEndTime: '22:00',
    },
  });

  const addForm = useForm<AmenityEditData>({
    resolver: zodResolver(amenityEditSchema),
    defaultValues: {
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
        rules: {
          maxSlotsPerFamily: data.maxPeople,
          blackoutDates: [],
        },
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
    if (!confirm(`Are you sure you want to delete "${name}"? This action cannot be undone.`)) {
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
    setSelectedDates(amenity.rules?.blackoutDates?.map((date: any) => new Date(date)) || []);
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
        const existingDateString = d instanceof Date ? d.toISOString().split('T')[0] : d.date?.toISOString?.().split('T')[0] || d.split('T')[0];
        const removeDateString = dateToRemove instanceof Date ? dateToRemove.toISOString().split('T')[0] : dateToRemove.date?.toISOString?.().split('T')[0] || dateToRemove.split('T')[0];
        return existingDateString !== removeDateString;
      });

      await updateDoc(doc(db, 'amenities', amenityId), {
        'rules.blackoutDates': updatedBlackoutDates,
        updatedAt: new Date(),
      });

      toast.success('Blackout date removed successfully');
      fetchAmenities();
    } catch (error) {
      console.error('Error removing blackout date:', error);
      toast.error('Failed to remove blackout date');
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-950 dark:to-blue-950/20 flex items-center justify-center">
        <motion.div 
          className="text-center"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <motion.div 
            className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4"
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          >
            <Settings className="w-8 h-8 text-white" />
          </motion.div>
          <p className="text-slate-800 dark:text-slate-400">Loading admin panel...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-purple-50 dark:from-slate-950 dark:to-purple-950/20 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Beautiful Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-6 p-8 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl rounded-3xl shadow-xl border border-white/20 dark:border-slate-700/20">
            <div className="flex items-center gap-6">
              <motion.div
                className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg"
                whileHover={{ rotate: 360 }}
                transition={{ duration: 0.6 }}
              >
                <Settings className="w-8 h-8 text-white" />
              </motion.div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-800 to-purple-600 dark:from-white dark:to-purple-400 bg-clip-text text-transparent mb-2">
                  Admin Panel
                </h1>
                <p className="text-slate-600 dark:text-slate-400 text-lg">
                  Manage your community amenities with festive season controls
                </p>
              </div>
            </div>
            
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button
                onClick={() => setShowAddForm(true)}
                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-300"
                size="lg"
              >
                <Plus className="w-5 h-5 mr-2" />
                Add Amenity
              </Button>
            </motion.div>
          </div>
        </motion.div>

        {/* Enhanced Add Form */}
        {showAddForm && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className="mb-8"
          >
            <Card className="border-0 shadow-xl bg-gradient-to-br from-white to-blue-50 dark:from-slate-900 dark:to-blue-950/20">
              <CardHeader>
                <CardTitle className="flex items-center justify-between text-xl">
                  <span className="flex items-center gap-2">
                    <Plus className="w-5 h-5" />
                    Add New Amenity
                  </span>
                  <Button variant="ghost" size="sm" onClick={() => setShowAddForm(false)}>
                    <X className="w-4 h-4" />
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={addForm.handleSubmit(addAmenity)} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Name</Label>
                      <Input {...addForm.register('name')} />
                      {addForm.formState.errors.name && (
                        <p className="text-red-500 text-sm mt-1">{addForm.formState.errors.name.message}</p>
                      )}
                    </div>
                    <div>
                      <Label>Image URL</Label>
                      <Input {...addForm.register('imageUrl')} />
                    </div>
                  </div>

                  <div>
                    <Label>Description</Label>
                    <Textarea {...addForm.register('description')} rows={3} />
                    {addForm.formState.errors.description && (
                      <p className="text-red-500 text-sm mt-1">{addForm.formState.errors.description.message}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Max People</Label>
                      <Input type="number" min="1" max="100" {...addForm.register('maxPeople', { valueAsNumber: true })} />
                    </div>
                    <div>
                      <Label>Slot Duration (hours)</Label>
                      <Input type="number" min="0.5" max="8" step="0.5" {...addForm.register('slotDuration', { valueAsNumber: true })} />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Weekday Hours</Label>
                      <div className="flex gap-2">
                        <Input type="time" {...addForm.register('weekdayStartTime')} />
                        <Input type="time" {...addForm.register('weekdayEndTime')} />
                      </div>
                    </div>
                    <div>
                      <Label>Weekend Hours</Label>
                      <div className="flex gap-2">
                        <Input type="time" {...addForm.register('weekendStartTime')} />
                        <Input type="time" {...addForm.register('weekendEndTime')} />
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button type="submit" className="bg-gradient-to-r from-green-500 to-blue-500">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Amenity
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Enhanced Amenities List */}
        <div className="grid gap-8">
          {amenities.map((amenity, index) => (
            <motion.div
              key={amenity.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ y: -4 }}
              className="group"
            >
              <Card className="border-0 shadow-xl bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-800 hover:shadow-2xl transition-all duration-500">
                <CardContent className="p-8">
                  {editingId === amenity.id ? (
                    // Edit Form
                    <form onSubmit={editForm.handleSubmit(saveEdit)} className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label>Name</Label>
                          <Input {...editForm.register('name')} />
                          {editForm.formState.errors.name && (
                            <p className="text-red-500 text-sm mt-1">{editForm.formState.errors.name.message}</p>
                          )}
                        </div>
                        <div>
                          <Label>Image URL</Label>
                          <Input {...editForm.register('imageUrl')} />
                        </div>
                      </div>

                      <div>
                        <Label>Description</Label>
                        <Textarea {...editForm.register('description')} rows={3} />
                        {editForm.formState.errors.description && (
                          <p className="text-red-500 text-sm mt-1">{editForm.formState.errors.description.message}</p>
                        )}
                      </div>

                      <div className="flex gap-2">
                        <Button type="submit">
                          <Save className="w-4 h-4 mr-2" />
                          Save
                        </Button>
                        <Button type="button" variant="outline" onClick={cancelEdit}>
                          <X className="w-4 h-4 mr-2" />
                          Cancel
                        </Button>
                      </div>
                    </form>
                  ) : (
                    // Display Mode
                    <div className="flex flex-col lg:flex-row gap-6">
                      <div className="relative">
                        <img
                          src={amenity.imageUrl}
                          alt={amenity.name}
                          className="w-full lg:w-40 lg:h-40 h-48 object-cover rounded-xl shadow-lg transition-transform duration-300 group-hover:scale-105"
                        />
                        {amenity.isBlocked && (
                          <Badge variant="destructive" className="absolute top-2 left-2 flex items-center gap-1">
                            <Ban className="w-3 h-3" />
                            Blocked
                          </Badge>
                        )}
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start mb-4">
                          <div className="mb-4 lg:mb-0">
                            <h3 className="text-2xl font-bold bg-gradient-to-r from-slate-800 to-purple-600 dark:from-white dark:to-purple-400 bg-clip-text text-transparent mb-2">
                              {amenity.name}
                            </h3>
                            <p className="text-slate-600 dark:text-slate-400 text-base leading-relaxed">
                              {amenity.description}
                            </p>
                            {amenity.isBlocked && amenity.blockReason && (
                              <p className="text-red-600 dark:text-red-400 text-sm mt-2 font-medium flex items-center gap-2">
                                <AlertTriangle className="w-4 h-4" />
                                Reason: {amenity.blockReason}
                              </p>
                            )}
                          </div>
                          
                          <div className="flex flex-wrap gap-2">
                            <Button 
                              variant={amenity.isBlocked ? "default" : "destructive"} 
                              size="sm" 
                              onClick={() => toggleAmenityBlock(amenity.id, amenity.name, amenity.isBlocked || false)}
                              className={amenity.isBlocked ? "bg-green-600 hover:bg-green-700" : ""}
                            >
                              {amenity.isBlocked ? (
                                <>
                                  <CheckCircle className="w-4 h-4 mr-1" />
                                  Unblock
                                </>
                              ) : (
                                <>
                                  <Ban className="w-4 h-4 mr-1" />
                                  Block
                                </>
                              )}
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => handleDateBlocking(amenity)}
                              className="bg-gradient-to-r from-orange-500 to-red-500 text-white border-none hover:from-orange-600 hover:to-red-600"
                            >
                              <CalendarDays className="w-4 h-4 mr-1" />
                              Festive Block
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => startEdit(amenity)}>
                              <Edit2 className="w-4 h-4" />
                            </Button>
                            <Button variant="destructive" size="sm" onClick={() => deleteAmenity(amenity.id, amenity.name)}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
                          <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                            <Users className="w-4 h-4 text-blue-500" />
                            <span className="font-medium">Max {amenity.booking?.maxPeople || 6}</span>
                          </div>
                          <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
                            <Clock className="w-4 h-4 text-green-500" />
                            <span className="font-medium">{amenity.booking?.slotDuration || 2}h slots</span>
                          </div>
                          <div className="flex items-center gap-2 p-3 bg-purple-50 dark:bg-purple-950/20 rounded-lg">
                            <CalendarIcon className="w-4 h-4 text-purple-500" />
                            <span className="font-medium text-xs">
                              Weekdays: {amenity.booking?.weekdayHours?.startTime || '09:00'} - {amenity.booking?.weekdayHours?.endTime || '21:00'}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 p-3 bg-orange-50 dark:bg-orange-950/20 rounded-lg">
                            <CalendarIcon className="w-4 h-4 text-orange-500" />
                            <span className="font-medium text-xs">
                              Weekends: {amenity.booking?.weekendHours?.startTime || '08:00'} - {amenity.booking?.weekendHours?.endTime || '22:00'}
                            </span>
                          </div>
                        </div>

                        {/* Enhanced blackout dates display */}
                        {amenity.rules?.blackoutDates && amenity.rules.blackoutDates.length > 0 && (
                          <div className="mt-4 p-4 bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-950/20 dark:to-orange-950/20 rounded-xl border border-red-200 dark:border-red-800">
                            <h4 className="font-semibold text-red-800 dark:text-red-200 mb-3 flex items-center gap-2">
                              <Star className="w-4 h-4" />
                              Festive Blocked Dates ({amenity.rules.blackoutDates.length})
                            </h4>
                            <div className="flex flex-wrap gap-2">
                              {amenity.rules.blackoutDates.slice(0, 8).map((blackoutItem: any, index: number) => {
                                const blackoutDate = blackoutItem.date || blackoutItem;
                                const displayDate = blackoutDate instanceof Date 
                                  ? blackoutDate.toLocaleDateString()
                                  : new Date(blackoutDate).toLocaleDateString();
                                const reason = blackoutItem.reason || 'Blocked';
                                
                                return (
                                  <div
                                    key={index}
                                    className="group relative inline-flex items-center gap-1 px-3 py-2 bg-gradient-to-r from-red-100 to-orange-100 dark:from-red-900/30 dark:to-orange-900/30 text-red-800 dark:text-red-200 text-xs rounded-full border border-red-200 dark:border-red-700 shadow-sm"
                                  >
                                    <span className="font-medium">{displayDate}</span>
                                    <button
                                      onClick={() => removeBlackoutDate(amenity.id, blackoutItem)}
                                      className="opacity-0 group-hover:opacity-100 transition-all duration-200 ml-1 text-red-600 hover:text-red-800 hover:bg-red-200 dark:hover:bg-red-800 rounded-full p-1"
                                      title={`Remove ${displayDate} (${reason})`}
                                    >
                                      <X className="w-3 h-3" />
                                    </button>
                                  </div>
                                );
                              })}
                              {amenity.rules.blackoutDates.length > 8 && (
                                <span className="text-xs text-red-600 dark:text-red-400 px-2 py-1">
                                  +{amenity.rules.blackoutDates.length - 8} more
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
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
          >
            <Card className="border-0 shadow-xl bg-gradient-to-br from-white to-blue-50 dark:from-slate-900 dark:to-blue-950/20">
              <CardContent className="text-center py-16">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl">
                  <Settings className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-2xl font-bold bg-gradient-to-r from-slate-800 to-purple-600 dark:from-white dark:to-purple-400 bg-clip-text text-transparent mb-3">
                  No Amenities Found
                </h3>
                <p className="text-slate-600 dark:text-slate-400 mb-6 text-lg">
                  Start building your community by adding your first amenity.
                </p>
                <Button 
                  onClick={() => setShowAddForm(true)}
                  className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 shadow-lg"
                  size="lg"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Add Your First Amenity
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>

      {/* Enhanced Date Blocking Dialog */}
      <Dialog open={showDateBlockDialog} onOpenChange={setShowDateBlockDialog}>
        <DialogContent className="max-w-5xl max-h-[95vh] overflow-y-auto bg-gradient-to-br from-white via-orange-50 to-red-50 dark:from-slate-900 dark:via-orange-950/30 dark:to-red-950/30 border-0 shadow-2xl">
          <DialogHeader className="pb-8 border-b border-gradient-to-r from-orange-200 to-red-200 dark:from-orange-800 dark:to-red-800">
            <motion.div 
              className="relative p-6 bg-gradient-to-br from-orange-500/10 to-red-500/10 dark:from-orange-500/20 dark:to-red-500/20 rounded-2xl border border-orange-200/50 dark:border-orange-700/50"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              {/* Beautiful background decoration */}
              <div className="absolute inset-0 bg-gradient-to-br from-orange-400/5 to-red-400/5 rounded-2xl"></div>
              <div className="absolute top-2 right-2 w-20 h-20 bg-gradient-to-br from-orange-300/20 to-red-300/20 rounded-full blur-xl"></div>
              
              <div className="relative flex items-center gap-4">
                <motion.div 
                  className="w-16 h-16 bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl flex items-center justify-center shadow-lg ring-4 ring-orange-200/50 dark:ring-orange-700/50"
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  transition={{ duration: 0.3 }}
                >
                  <CalendarDays className="w-8 h-8 text-white" />
                </motion.div>
                <div className="flex-1">
                  <DialogTitle className="text-3xl font-bold text-slate-900 dark:text-white mb-2 leading-tight">
                    🎉 Block <span className="text-orange-600 dark:text-orange-400">{selectedAmenityForBlock?.name}</span> on Specific Dates
                  </DialogTitle>
                  <DialogDescription className="text-lg text-slate-700 dark:text-slate-300 leading-relaxed">
                    ✨ Select dates to block this amenity during festive seasons or special events.
                  </DialogDescription>
                </div>
              </div>
            </motion.div>
          </DialogHeader>

          <div className="space-y-8 p-6">
            {/* Enhanced Reason Input */}
            <motion.div 
              className="space-y-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                  <Star className="w-4 h-4 text-white" />
                </div>
                <Label htmlFor="festive-reason" className="text-xl font-bold text-slate-900 dark:text-white">
                  🎯 Reason for Blocking
                </Label>
              </div>
              
              {/* Enhanced quick reason buttons */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                {[
                  { emoji: '🎆', text: 'Diwali Festival', color: 'from-yellow-400 to-orange-500', bgColor: 'from-yellow-50 to-orange-50 dark:from-yellow-950/20 dark:to-orange-950/20' },
                  { emoji: '🎄', text: 'Christmas Celebration', color: 'from-green-400 to-red-500', bgColor: 'from-green-50 to-red-50 dark:from-green-950/20 dark:to-red-950/20' }, 
                  { emoji: '🎊', text: 'New Year Events', color: 'from-purple-400 to-pink-500', bgColor: 'from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20' },
                  { emoji: '🕉️', text: 'Religious Festival', color: 'from-orange-400 to-red-500', bgColor: 'from-orange-50 to-red-50 dark:from-orange-950/20 dark:to-red-950/20' },
                  { emoji: '🔧', text: 'Maintenance Work', color: 'from-gray-400 to-slate-500', bgColor: 'from-gray-50 to-slate-50 dark:from-gray-950/20 dark:to-slate-950/20' },
                  { emoji: '👥', text: 'Community Event', color: 'from-blue-400 to-cyan-500', bgColor: 'from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20' }
                ].map((reasonOption, index) => (
                  <motion.div
                    key={reasonOption.text}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.1 * index }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setFestiveReason(`${reasonOption.emoji} ${reasonOption.text}`)}
                      className={`w-full h-auto p-4 transition-all duration-300 border-2 ${
                        festiveReason === `${reasonOption.emoji} ${reasonOption.text}` 
                          ? `bg-gradient-to-r ${reasonOption.color} text-white border-none shadow-xl ring-4 ring-orange-200/50 dark:ring-orange-700/50` 
                          : `bg-gradient-to-r ${reasonOption.bgColor} hover:bg-gradient-to-r hover:${reasonOption.color} hover:text-white border-orange-200 dark:border-orange-700 hover:border-transparent hover:shadow-lg`
                      }`}
                    >
                      <div className="flex flex-col items-center gap-2">
                        <span className="text-3xl">{reasonOption.emoji}</span>
                        <span className="text-sm font-semibold text-center leading-tight">{reasonOption.text}</span>
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
                className="w-full text-lg p-4 border-2 border-orange-200 dark:border-orange-700 rounded-xl focus:border-orange-500 dark:focus:border-orange-400 transition-all duration-300"
              />
            </motion.div>

            {/* Enhanced Date Selection */}
            <motion.div 
              className="grid grid-cols-1 lg:grid-cols-2 gap-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              {/* Beautiful Calendar */}
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                    <CalendarIcon className="w-4 h-4 text-white" />
                  </div>
                  <Label className="text-lg font-bold text-slate-900 dark:text-white">📅 Select Dates to Block</Label>
                </div>
                <motion.div 
                  className="border-2 border-orange-200 dark:border-orange-700 rounded-2xl p-6 bg-gradient-to-br from-white to-orange-50/50 dark:from-slate-900 dark:to-orange-950/20 shadow-lg"
                  whileHover={{ scale: 1.02 }}
                  transition={{ duration: 0.2 }}
                >
                  <Calendar
                    mode="multiple"
                    selected={selectedDates}
                    onSelect={(dates) => setSelectedDates(dates || [])}
                    disabled={(date) => date < new Date()}
                    className="rounded-xl mx-auto"
                  />
                </motion.div>
              </div>

              {/* Beautiful Selected Dates Preview */}
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-teal-500 rounded-lg flex items-center justify-center">
                    <Star className="w-4 h-4 text-white" />
                  </div>
                  <Label className="text-lg font-bold text-slate-900 dark:text-white">
                    ✨ Selected Dates ({selectedDates.length})
                  </Label>
                </div>
                <div className="border-2 border-orange-200 dark:border-orange-700 rounded-2xl p-6 min-h-[350px] bg-gradient-to-br from-slate-50 to-orange-50/50 dark:from-slate-900 dark:to-orange-950/20 shadow-lg">
                  {selectedDates.length > 0 ? (
                    <motion.div 
                      className="space-y-3"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                    >
                      {selectedDates
                        .sort((a, b) => a.getTime() - b.getTime())
                        .map((date, index) => (
                          <motion.div
                            key={date.toISOString()}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.1 * index }}
                            className="flex items-center justify-between p-4 bg-gradient-to-r from-white to-orange-50 dark:from-slate-800 dark:to-orange-950/20 rounded-xl border-2 border-orange-100 dark:border-orange-800 shadow-sm hover:shadow-md transition-all duration-300"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg flex items-center justify-center">
                                <CalendarIcon className="w-5 h-5 text-white" />
                              </div>
                              <div>
                                <span className="font-bold text-slate-900 dark:text-white text-lg">
                                  {date.toLocaleDateString('en-US', { 
                                    weekday: 'short', 
                                    month: 'short', 
                                    day: 'numeric' 
                                  })}
                                </span>
                                <p className="text-sm text-slate-600 dark:text-slate-400">
                                  {date.toLocaleDateString('en-US', { year: 'numeric' })}
                                </p>
                              </div>
                            </div>
                            <motion.div
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                            >
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setSelectedDates(prev => prev.filter(d => d.getTime() !== date.getTime()));
                                }}
                                className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-100 dark:hover:bg-red-900/20 rounded-lg"
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </motion.div>
                          </motion.div>
                        ))}
                    </motion.div>
                  ) : (
                    <motion.div 
                      className="flex flex-col items-center justify-center h-full text-center"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                    >
                      <div className="w-20 h-20 bg-gradient-to-br from-orange-200 to-red-200 dark:from-orange-800 dark:to-red-800 rounded-2xl flex items-center justify-center mb-4">
                        <CalendarDays className="w-10 h-10 text-orange-600 dark:text-orange-400" />
                      </div>
                      <p className="text-slate-700 dark:text-slate-300 font-semibold text-lg mb-2">No dates selected yet</p>
                      <p className="text-sm text-slate-500 dark:text-slate-400">Choose dates from the calendar to block this amenity</p>
                    </motion.div>
                  )}
                </div>
              </div>
            </motion.div>

            {/* Beautiful Action Buttons */}
            <motion.div 
              className="flex justify-end gap-4 pt-8 border-t-2 border-gradient-to-r from-orange-200 to-red-200 dark:from-orange-800 dark:to-red-800"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => {
                    setShowDateBlockDialog(false);
                    setSelectedDates([]);
                    setFestiveReason('');
                  }}
                  className="px-8 py-3 border-2 border-slate-300 dark:border-slate-600 hover:border-slate-400 dark:hover:border-slate-500 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all duration-300"
                >
                  <X className="w-5 h-5 mr-2" />
                  Cancel
                </Button>
              </motion.div>
              
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  onClick={addBlackoutDates}
                  disabled={selectedDates.length === 0}
                  size="lg"
                  className="px-8 py-3 bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 hover:from-orange-600 hover:via-red-600 hover:to-pink-600 disabled:from-gray-400 disabled:to-gray-500 text-white font-bold shadow-xl hover:shadow-2xl disabled:shadow-none transition-all duration-300 ring-4 ring-orange-200/50 dark:ring-orange-700/50"
                >
                  <Star className="w-5 h-5 mr-2" />
                  🎉 Block {selectedDates.length} Date{selectedDates.length !== 1 ? 's' : ''}
                </Button>
              </motion.div>
            </motion.div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}