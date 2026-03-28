'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
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
  Star,
  Shield,
  Loader2,
  ImageIcon
} from 'lucide-react';
import { toast } from 'sonner';
import { Calendar } from '@/components/ui/calendar';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogPortal, DialogOverlay } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { collection, query, where, getDocs, doc, updateDoc, deleteDoc, addDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { notifyDateSpecificBlock } from '@/lib/notification-helpers';
import { useNotifications } from '@/components/notifications/notification-system';
import { useResidentNotifications } from '@/hooks/use-community-notifications';
import { useCommunityTimeZone } from '@/components/providers/community-branding-provider';
import { formatDateInTimeZone } from '@/lib/timezone';

// ============================================================================
// SCHEMA & TYPES
// ============================================================================

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
    weekdayHours: { startTime: string; endTime: string };
    weekendHours: { startTime: string; endTime: string };
  };
  rules?: {
    maxSlotsPerFamily: number;
    blackoutDates: any[];
  };
}

// ============================================================================
// ANIMATION CONFIG
// ============================================================================

const easeOut = "easeOut";
const transitionDuration = 0.2;

const staggerContainer = {
  animate: { transition: { staggerChildren: 0.05 } }
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function AdminPanel() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const timeZone = useCommunityTimeZone();
  const { addNotification } = useNotifications();
  const { sendAmenityBlockNotification, sendAmenityUnblockNotification, sendInstantBlockNotification } = useResidentNotifications();
  
  const [amenities, setAmenities] = useState<Amenity[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showDateBlockDialog, setShowDateBlockDialog] = useState(false);
  const [selectedAmenityForBlock, setSelectedAmenityForBlock] = useState<Amenity | null>(null);
  const [selectedDates, setSelectedDates] = useState<Date[]>([]);
  const [festiveReason, setFestiveReason] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const formatDateLabel = (date: Date, options: Intl.DateTimeFormatOptions = {}) =>
    formatDateInTimeZone(date, timeZone, options);

  // ============================================================================
  // AUTH & DATA FETCHING
  // ============================================================================

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

  // ============================================================================
  // FORM SETUP
  // ============================================================================

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

  // ============================================================================
  // CRUD OPERATIONS
  // ============================================================================

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
    setActionLoading('save');
    try {
      const amenityRef = doc(db, 'amenities', editingId!);
      await updateDoc(amenityRef, {
        name: data.name.trim(),
        description: data.description.trim(),
        imageUrl: data.imageUrl || undefined,
        booking: {
          maxPeople: data.maxPeople,
          slotDuration: data.slotDuration,
          weekdayHours: { startTime: data.weekdayStartTime, endTime: data.weekdayEndTime },
          weekendHours: { startTime: data.weekendStartTime, endTime: data.weekendEndTime },
        },
        operatingHours: { start: data.weekdayStartTime, end: data.weekdayEndTime },
        rules: { maxSlotsPerFamily: data.maxPeople, blackoutDates: [] },
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
    } finally {
      setActionLoading(null);
    }
  };

  const deleteAmenity = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}"?\n\nThis action cannot be undone. All bookings for this amenity will be affected.`)) {
      return;
    }
    setActionLoading(id);
    try {
      await deleteDoc(doc(db, 'amenities', id));
      toast.success('Amenity deleted successfully');
      fetchAmenities();
    } catch (error) {
      console.error('Error deleting amenity:', error);
      toast.error('Failed to delete amenity');
    } finally {
      setActionLoading(null);
    }
  };

  const toggleAmenityBlock = async (id: string, name: string, currentStatus: boolean) => {
    const action = currentStatus ? 'unblock' : 'block';
    const reason = currentStatus ? '' : prompt(`Reason for blocking "${name}":\n(e.g., Maintenance, Festive Season)`) || 'Administrative block';
    
    if (!currentStatus && !reason.trim()) return;

    setActionLoading(id);
    try {
      await updateDoc(doc(db, 'amenities', id), {
        isBlocked: !currentStatus,
        blockReason: !currentStatus ? reason : null,
        blockedAt: !currentStatus ? new Date() : null,
        updatedAt: new Date(),
      });

      if (!currentStatus) {
        await sendInstantBlockNotification(name, reason);
        try {
          await fetch('/api/notifications/amenity-block', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              amenityName: name,
              reason: reason,
              startDate: formatDateLabel(new Date(), { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
              endDate: 'Until further notice',
              communityId: session?.user?.communityId,
              communityName: (session?.user as any)?.communityName || 'Your Community',
              isFestive: false,
            }),
          });
        } catch (emailError) {
          console.error('Failed to send block emails:', emailError);
        }
      } else {
        addNotification({
          title: `${name} Now Available`,
          message: `${name} is now available for booking.`,
          type: 'system',
          priority: 'normal',
          autoHide: false
        });
        try {
          await fetch('/api/notifications/amenity-unblock', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              amenityName: name,
              communityId: session?.user?.communityId,
              communityName: (session?.user as any)?.communityName || 'Your Community',
            }),
          });
        } catch (emailError) {
          console.error('Failed to send unblock emails:', emailError);
        }
      }

      toast.success(`Amenity ${action}ed successfully`);
      fetchAmenities();
    } catch (error) {
      console.error(`Error ${action}ing amenity:`, error);
      toast.error(`Failed to ${action} amenity`);
    } finally {
      setActionLoading(null);
    }
  };

  const addAmenity = async (data: AmenityEditData) => {
    setActionLoading('add');
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
          weekdayHours: { startTime: data.weekdayStartTime, endTime: data.weekdayEndTime },
          weekendHours: { startTime: data.weekendStartTime, endTime: data.weekendEndTime },
        },
        rules: { maxSlotsPerFamily: data.maxPeople, blackoutDates: [] },
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
    } finally {
      setActionLoading(null);
    }
  };

  // ============================================================================
  // DATE BLOCKING
  // ============================================================================

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
    setActionLoading('blackout');

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

      await notifyDateSpecificBlock(selectedAmenityForBlock.name, selectedDates, reason, timeZone);
      await sendAmenityBlockNotification(selectedAmenityForBlock.name, selectedDates, reason);

      try {
        const startDate = formatDateLabel(selectedDates[0], { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
        const endDate = formatDateLabel(selectedDates[selectedDates.length - 1], { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
        
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
      } catch (emailError) {
        console.error('Failed to send festive block emails:', emailError);
      }

      toast.success(`Added ${selectedDates.length} blackout date(s)`);
      setShowDateBlockDialog(false);
      setSelectedDates([]);
      setFestiveReason('');
      fetchAmenities();
    } catch (error) {
      console.error('Error adding blackout dates:', error);
      toast.error('Failed to add blackout dates');
    } finally {
      setActionLoading(null);
    }
  };

  const removeBlackoutDate = async (amenityId: string, dateToRemove: any) => {
    try {
      const amenity = amenities.find(a => a.id === amenityId);
      if (!amenity) return;

      const updatedBlackoutDates = (amenity.rules?.blackoutDates || []).filter((d: any) => d !== dateToRemove);

      await updateDoc(doc(db, 'amenities', amenityId), {
        'rules.blackoutDates': updatedBlackoutDates,
        updatedAt: new Date(),
      });

      let removedDateDisplay = '';
      try {
        if (dateToRemove?.date) {
          if (dateToRemove.date instanceof Date) {
            removedDateDisplay = formatDateLabel(dateToRemove.date, { year: 'numeric', month: 'short', day: 'numeric' });
          } else if (dateToRemove.date.seconds) {
            removedDateDisplay = formatDateLabel(new Date(dateToRemove.date.seconds * 1000), { year: 'numeric', month: 'short', day: 'numeric' });
          } else {
            removedDateDisplay = formatDateLabel(new Date(dateToRemove.date), { year: 'numeric', month: 'short', day: 'numeric' });
          }
        } else if (dateToRemove instanceof Date) {
          removedDateDisplay = formatDateLabel(dateToRemove, { year: 'numeric', month: 'short', day: 'numeric' });
        } else if (dateToRemove?.seconds) {
          removedDateDisplay = formatDateLabel(new Date(dateToRemove.seconds * 1000), { year: 'numeric', month: 'short', day: 'numeric' });
        } else {
          removedDateDisplay = formatDateLabel(new Date(dateToRemove), { year: 'numeric', month: 'short', day: 'numeric' });
        }
      } catch {
        removedDateDisplay = 'Selected date';
      }
      
      await sendAmenityUnblockNotification(amenity.name, removedDateDisplay);
      toast.success('Blackout date removed');
      fetchAmenities();
    } catch (error) {
      console.error('Error removing blackout date:', error);
      toast.error('Failed to remove blackout date');
    }
  };

  // ============================================================================
  // LOADING STATE
  // ============================================================================

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 rounded-xl bg-gray-900 dark:bg-white flex items-center justify-center mx-auto mb-4">
            <Loader2 className="w-6 h-6 text-white dark:text-gray-900 animate-spin" />
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">Loading admin panel...</p>
        </div>
      </div>
    );
  }

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12">
        
        {/* ================================================================
            PAGE HEADER
        ================================================================ */}
        <motion.header 
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: transitionDuration, ease: easeOut }}
          className="mb-8 sm:mb-10"
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-gray-900 dark:bg-white flex items-center justify-center flex-shrink-0">
                <Shield className="w-5 h-5 sm:w-6 sm:h-6 text-white dark:text-gray-900" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white">
                    Admin Panel
                  </h1>
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-5 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 font-medium">
                    Admin
                  </Badge>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Manage community amenities and availability
                </p>
              </div>
            </div>
            
            <Button
              onClick={() => setShowAddForm(true)}
              className="w-full sm:w-auto h-10 px-4 bg-gray-900 dark:bg-white text-white dark:text-gray-900 
                       hover:bg-gray-800 dark:hover:bg-gray-100 
                       transition-colors duration-150"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Amenity
            </Button>
          </div>
        </motion.header>

        {/* ================================================================
            ADD AMENITY FORM
        ================================================================ */}
        <AnimatePresence>
          {showAddForm && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="mb-6 sm:mb-8 overflow-hidden"
            >
              <AmenityForm
                form={addForm}
                onSubmit={addForm.handleSubmit(addAmenity)}
                onCancel={() => setShowAddForm(false)}
                isLoading={actionLoading === 'add'}
                title="Add New Amenity"
                submitLabel="Add Amenity"
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* ================================================================
            AMENITIES LIST
        ================================================================ */}
        <motion.div 
          variants={staggerContainer}
          initial="initial"
          animate="animate"
          className="space-y-4"
        >
          {amenities.map((amenity, index) => (
            <motion.div
              key={amenity.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05, duration: transitionDuration, ease: easeOut }}
            >
              {editingId === amenity.id ? (
                <AmenityForm
                  form={editForm}
                  onSubmit={editForm.handleSubmit(saveEdit)}
                  onCancel={cancelEdit}
                  isLoading={actionLoading === 'save'}
                  title={`Edit ${amenity.name}`}
                  submitLabel="Save Changes"
                />
              ) : (
                <AmenityCard
                  amenity={amenity}
                  onEdit={() => startEdit(amenity)}
                  onDelete={() => deleteAmenity(amenity.id, amenity.name)}
                  onToggleBlock={() => toggleAmenityBlock(amenity.id, amenity.name, amenity.isBlocked || false)}
                  onFestiveBlock={() => handleDateBlocking(amenity)}
                  onRemoveBlackoutDate={(date) => removeBlackoutDate(amenity.id, date)}
                  isLoading={actionLoading === amenity.id}
                />
              )}
            </motion.div>
          ))}
        </motion.div>

        {/* ================================================================
            EMPTY STATE
        ================================================================ */}
        {amenities.length === 0 && !loading && (
          <motion.div 
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: transitionDuration, ease: easeOut }}
            className="text-center py-16 sm:py-20"
          >
            <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-gray-900 flex items-center justify-center mx-auto mb-5">
              <Settings className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No amenities yet
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 max-w-sm mx-auto">
              Start managing your community by adding your first amenity.
            </p>
            <Button
              onClick={() => setShowAddForm(true)}
              className="bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add First Amenity
            </Button>
          </motion.div>
        )}
      </div>

      {/* ================================================================
          DATE BLOCKING DIALOG
      ================================================================ */}
      <DateBlockDialog
        open={showDateBlockDialog}
        onOpenChange={setShowDateBlockDialog}
        amenity={selectedAmenityForBlock}
        selectedDates={selectedDates}
        setSelectedDates={setSelectedDates}
        festiveReason={festiveReason}
        setFestiveReason={setFestiveReason}
        onConfirm={addBlackoutDates}
        isLoading={actionLoading === 'blackout'}
      />
    </div>
  );
}

// ============================================================================
// AMENITY FORM COMPONENT
// ============================================================================

interface AmenityFormProps {
  form: any;
  onSubmit: () => void;
  onCancel: () => void;
  isLoading: boolean;
  title: string;
  submitLabel: string;
}

function AmenityForm({ form, onSubmit, onCancel, isLoading, title, submitLabel }: AmenityFormProps) {
  return (
    <Card className="border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm overflow-hidden">
      {/* Form Header */}
      <div className="px-5 sm:px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
        <h2 className="text-base font-medium text-gray-900 dark:text-white">{title}</h2>
        <button
          type="button"
          onClick={onCancel}
          className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <form onSubmit={onSubmit}>
        <CardContent className="px-5 sm:px-6 py-7 sm:py-8 space-y-8">
          {/* SECTION: Basic Information */}
          <div className="space-y-6">
            <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-[0.1em]">
              Basic Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                label="Amenity Name"
                error={form.formState.errors.name?.message}
              >
                <Input
                  {...form.register('name')}
                  placeholder="e.g., Swimming Pool"
                  className="h-10"
                />
              </FormField>
              <FormField
                label="Image URL"
                hint="Optional - leave empty for default"
              >
                <Input
                  {...form.register('imageUrl')}
                  placeholder="https://..."
                  className="h-10"
                />
              </FormField>
            </div>
            <FormField
              label="Description"
              error={form.formState.errors.description?.message}
            >
              <Textarea
                {...form.register('description')}
                placeholder="Describe this amenity and any rules..."
                rows={3}
                className="resize-none"
              />
            </FormField>
          </div>

          {/* SECTION: Booking Rules */}
          <div className="space-y-5 pt-1">
            <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-[0.1em]">
              Booking Rules
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField label="Maximum People">
                <Input
                  type="number"
                  min="1"
                  max="100"
                  {...form.register('maxPeople', { valueAsNumber: true })}
                  className="h-10"
                />
              </FormField>
              <FormField label="Slot Duration (hours)">
                <Input
                  type="number"
                  min="0.5"
                  max="8"
                  step="0.5"
                  {...form.register('slotDuration', { valueAsNumber: true })}
                  className="h-10"
                />
              </FormField>
            </div>
          </div>

          {/* SECTION: Operating Hours */}
          <div className="space-y-5 pt-1">
            <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-[0.1em]">
              Operating Hours
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField label="Weekday Hours">
                <div className="flex items-center gap-2">
                  <Input type="time" {...form.register('weekdayStartTime')} className="h-10 flex-1" />
                  <span className="text-gray-400 text-sm">to</span>
                  <Input type="time" {...form.register('weekdayEndTime')} className="h-10 flex-1" />
                </div>
              </FormField>
              <FormField label="Weekend Hours">
                <div className="flex items-center gap-2">
                  <Input type="time" {...form.register('weekendStartTime')} className="h-10 flex-1" />
                  <span className="text-gray-400 text-sm">to</span>
                  <Input type="time" {...form.register('weekendEndTime')} className="h-10 flex-1" />
                </div>
              </FormField>
            </div>
          </div>
        </CardContent>

        {/* Form Actions */}
        <div className="px-5 sm:px-6 py-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50 flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
          <Button
            type="button"
            variant="ghost"
            onClick={onCancel}
            className="h-10"
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isLoading}
            className="h-10 bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            {submitLabel}
          </Button>
        </div>
      </form>
    </Card>
  );
}

// ============================================================================
// FORM FIELD COMPONENT
// ============================================================================

interface FormFieldProps {
  label: string;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}

function FormField({ label, error, hint, children }: FormFieldProps) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
        {label}
      </Label>
      {children}
      {error && <p className="text-xs text-red-500">{error}</p>}
      {hint && !error && <p className="text-xs text-gray-400">{hint}</p>}
    </div>
  );
}

// ============================================================================
// AMENITY CARD COMPONENT
// ============================================================================

interface AmenityCardProps {
  amenity: Amenity;
  onEdit: () => void;
  onDelete: () => void;
  onToggleBlock: () => void;
  onFestiveBlock: () => void;
  onRemoveBlackoutDate: (date: any) => void;
  isLoading: boolean;
}

function AmenityCard({ 
  amenity, 
  onEdit, 
  onDelete, 
  onToggleBlock, 
  onFestiveBlock,
  onRemoveBlackoutDate,
  isLoading 
}: AmenityCardProps) {
  const blackoutDates = amenity.rules?.blackoutDates || [];

  return (
    <Card className="border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden">
      <CardContent className="p-0">
        <div className="flex flex-col lg:flex-row">
          {/* Image Section */}
          <div className="relative lg:w-48 xl:w-56 flex-shrink-0">
            {amenity.imageUrl ? (
              <img
                src={amenity.imageUrl}
                alt={amenity.name}
                className="w-full h-40 lg:h-full object-cover"
              />
            ) : (
              <div className="w-full h-40 lg:h-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                <ImageIcon className="w-10 h-10 text-gray-300 dark:text-gray-600" />
              </div>
            )}
            {/* Status Badge */}
            {amenity.isBlocked && (
              <div className="absolute top-3 left-3">
                <Badge variant="destructive" className="text-xs font-medium px-2 py-0.5 shadow-sm">
                  <Ban className="w-3 h-3 mr-1" />
                  Blocked
                </Badge>
              </div>
            )}
          </div>

          {/* Content Section */}
          <div className="flex-1 p-5 sm:p-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
              <div className="min-w-0">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
                  {amenity.name}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                  {amenity.description}
                </p>
                {amenity.isBlocked && amenity.blockReason && (
                  <p className="text-xs text-red-600 dark:text-red-400 mt-2 flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    {amenity.blockReason}
                  </p>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <Button
                  variant={amenity.isBlocked ? "outline" : "destructive"}
                  size="sm"
                  onClick={onToggleBlock}
                  disabled={isLoading}
                  className={cn(
                    "h-8 text-xs",
                    amenity.isBlocked && "border-green-200 text-green-700 hover:bg-green-50 dark:border-green-800 dark:text-green-400 dark:hover:bg-green-900/20"
                  )}
                >
                  {amenity.isBlocked ? (
                    <>
                      <CheckCircle className="w-3.5 h-3.5 mr-1" />
                      Unblock
                    </>
                  ) : (
                    <>
                      <Ban className="w-3.5 h-3.5 mr-1" />
                      Block
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onFestiveBlock}
                  className="h-8 text-xs border-amber-200 text-amber-700 hover:bg-amber-50 dark:border-amber-800 dark:text-amber-400 dark:hover:bg-amber-900/20"
                >
                  <CalendarDays className="w-3.5 h-3.5 mr-1" />
                  Festive
                </Button>
                <Button variant="ghost" size="sm" onClick={onEdit} className="h-8 w-8 p-0">
                  <Edit2 className="w-4 h-4 text-gray-500" />
                </Button>
                <Button variant="ghost" size="sm" onClick={onDelete} className="h-8 w-8 p-0 hover:text-red-600">
                  <Trash2 className="w-4 h-4 text-gray-500 hover:text-red-600" />
                </Button>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
              <StatBadge icon={Users} label="Capacity" value={`${amenity.booking?.maxPeople || 6} people`} />
              <StatBadge icon={Clock} label="Duration" value={`${amenity.booking?.slotDuration || 2}h slots`} />
              <StatBadge 
                icon={CalendarIcon} 
                label="Weekdays" 
                value={`${amenity.booking?.weekdayHours?.startTime || '09:00'} - ${amenity.booking?.weekdayHours?.endTime || '21:00'}`} 
              />
              <StatBadge 
                icon={CalendarIcon} 
                label="Weekends" 
                value={`${amenity.booking?.weekendHours?.startTime || '08:00'} - ${amenity.booking?.weekendHours?.endTime || '22:00'}`} 
              />
            </div>

            {/* Blackout Dates */}
            {blackoutDates.length > 0 && (
              <div className="pt-4 border-t border-gray-100 dark:border-gray-800">
                <div className="flex items-center gap-2 mb-3">
                  <Star className="w-4 h-4 text-amber-500" />
                  <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                    Blocked Dates ({blackoutDates.length})
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {blackoutDates.slice(0, 6).map((blackoutItem: any, index: number) => (
                    <BlackoutDateBadge
                      key={index}
                      blackoutItem={blackoutItem}
                      onRemove={() => onRemoveBlackoutDate(blackoutItem)}
                    />
                  ))}
                  {blackoutDates.length > 6 && (
                    <span className="text-xs text-gray-500 dark:text-gray-400 px-2 py-1">
                      +{blackoutDates.length - 6} more
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// STAT BADGE COMPONENT
// ============================================================================

interface StatBadgeProps {
  icon: React.ElementType;
  label: string;
  value: string;
}

function StatBadge({ icon: Icon, label, value }: StatBadgeProps) {
  return (
    <div className="flex items-center gap-2.5 p-2.5 rounded-lg bg-gray-50 dark:bg-gray-800/50">
      <Icon className="w-4 h-4 text-gray-400 flex-shrink-0" />
      <div className="min-w-0">
        <p className="text-[10px] text-gray-400 uppercase tracking-wider">{label}</p>
        <p className="text-xs font-medium text-gray-700 dark:text-gray-300 truncate">{value}</p>
      </div>
    </div>
  );
}

// ============================================================================
// BLACKOUT DATE BADGE COMPONENT
// ============================================================================

interface BlackoutDateBadgeProps {
  blackoutItem: any;
  onRemove: () => void;
}

function BlackoutDateBadge({ blackoutItem, onRemove }: BlackoutDateBadgeProps) {
  const timeZone = useCommunityTimeZone();
  let displayDate = '';

  const formatDate = (date: Date) => formatDateInTimeZone(date, timeZone, {
    month: 'short',
    day: 'numeric',
  });
  
  try {
    if (blackoutItem?.date) {
      if (blackoutItem.date instanceof Date) {
        displayDate = formatDate(blackoutItem.date);
      } else if (blackoutItem.date.seconds) {
        displayDate = formatDate(new Date(blackoutItem.date.seconds * 1000));
      } else {
        const parsedDate = new Date(blackoutItem.date);
        displayDate = !isNaN(parsedDate.getTime()) ? formatDate(parsedDate) : 'Invalid';
      }
    } else if (blackoutItem instanceof Date) {
      displayDate = formatDate(blackoutItem);
    } else if (blackoutItem?.seconds) {
      displayDate = formatDate(new Date(blackoutItem.seconds * 1000));
    } else if (typeof blackoutItem === 'string') {
      const parsedDate = new Date(blackoutItem);
      displayDate = !isNaN(parsedDate.getTime()) ? formatDate(parsedDate) : blackoutItem;
    } else {
      displayDate = 'Invalid';
    }
  } catch {
    displayDate = 'Invalid';
  }

  return (
    <span className="group inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium 
                   bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 
                   border border-amber-200 dark:border-amber-800 rounded-md">
      {displayDate}
      <button
        onClick={onRemove}
        className="opacity-0 group-hover:opacity-100 -mr-1 p-0.5 rounded hover:bg-amber-200 dark:hover:bg-amber-800 transition-opacity"
      >
        <X className="w-3 h-3" />
      </button>
    </span>
  );
}

// ============================================================================
// DATE BLOCK DIALOG COMPONENT
// ============================================================================

interface DateBlockDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  amenity: Amenity | null;
  selectedDates: Date[];
  setSelectedDates: (dates: Date[]) => void;
  festiveReason: string;
  setFestiveReason: (reason: string) => void;
  onConfirm: () => void;
  isLoading: boolean;
}

function DateBlockDialog({
  open,
  onOpenChange,
  amenity,
  selectedDates,
  setSelectedDates,
  festiveReason,
  setFestiveReason,
  onConfirm,
  isLoading
}: DateBlockDialogProps) {
  const timeZone = useCommunityTimeZone();
  const quickReasons = [
    { emoji: '🎆', label: 'Diwali' },
    { emoji: '🎄', label: 'Christmas' },
    { emoji: '🎊', label: 'New Year' },
    { emoji: '🔧', label: 'Maintenance' },
    { emoji: '👥', label: 'Community Event' },
    { emoji: '🕉️', label: 'Religious' },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPortal>
        <DialogOverlay className="fixed inset-0 z-[9998] bg-black/60 backdrop-blur-sm" />
        <DialogContent className="fixed left-[50%] top-[50%] translate-x-[-50%] translate-y-[-50%] z-[9999] 
                                  w-[95vw] max-w-4xl max-h-[90vh] overflow-y-auto
                                  bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 
                                  rounded-xl shadow-2xl">
          <DialogHeader className="px-6 py-5 border-b border-gray-100 dark:border-gray-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                <CalendarDays className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <DialogTitle className="text-lg font-semibold text-gray-900 dark:text-white">
                  Schedule Blocked Dates
                </DialogTitle>
                <DialogDescription className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                  Block {amenity?.name} on specific dates for holidays or events
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="px-6 py-5 space-y-6">
            {/* Reason Input */}
            <div className="space-y-3">
              <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Reason for blocking
              </Label>
              <div className="flex flex-wrap gap-2 mb-3">
                {quickReasons.map((reason) => (
                  <button
                    key={reason.label}
                    type="button"
                    onClick={() => setFestiveReason(`${reason.emoji} ${reason.label}`)}
                    className={cn(
                      "px-3 py-1.5 text-xs font-medium rounded-lg border transition-all duration-150",
                      festiveReason === `${reason.emoji} ${reason.label}`
                        ? "bg-amber-100 dark:bg-amber-900/30 border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-300"
                        : "bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600"
                    )}
                  >
                    {reason.emoji} {reason.label}
                  </button>
                ))}
              </div>
              <Input
                placeholder="e.g., Diwali Festival, Annual Maintenance"
                value={festiveReason}
                onChange={(e) => setFestiveReason(e.target.value)}
                className="h-10"
              />
            </div>

            {/* Calendar & Selected Dates */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Calendar */}
              <div className="space-y-3">
                <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Select dates
                </Label>
                <div className="border border-gray-200 dark:border-gray-800 rounded-lg p-3">
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
                  />
                </div>
                <p className="text-xs text-gray-400">
                  Click dates to select or deselect them
                </p>
              </div>

              {/* Selected Dates List */}
              <div className="space-y-3">
                <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Selected dates ({selectedDates.length})
                </Label>
                <div className="border border-gray-200 dark:border-gray-800 rounded-lg p-4 min-h-[300px] max-h-[360px] overflow-y-auto bg-gray-50 dark:bg-gray-800/30">
                  {selectedDates.length > 0 ? (
                    <div className="space-y-2">
                      {selectedDates
                        .filter((date) => date instanceof Date && !isNaN(date.getTime()))
                        .sort((a, b) => a.getTime() - b.getTime())
                        .map((date, index) => (
                          <div
                            key={`${date.getTime()}-${index}`}
                            className="flex items-center justify-between p-2.5 bg-white dark:bg-gray-800 rounded-lg border border-gray-100 dark:border-gray-700"
                          >
                            <div className="flex items-center gap-2.5">
                              <CalendarIcon className="w-4 h-4 text-amber-500" />
                              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                {formatDateInTimeZone(date, timeZone, {
                                  weekday: 'short', 
                                  month: 'short', 
                                  day: 'numeric',
                                  year: 'numeric'
                                })}
                              </span>
                            </div>
                            <button
                              onClick={() => {
                                setSelectedDates(selectedDates.filter(d => 
                                  d instanceof Date && !isNaN(d.getTime()) && d.getTime() !== date.getTime()
                                ));
                              }}
                              className="p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-400 hover:text-red-500 transition-colors"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-center py-8">
                      <CalendarDays className="w-10 h-10 text-gray-300 dark:text-gray-600 mb-3" />
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        No dates selected
                      </p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                        Pick dates from the calendar
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50 flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
            <Button
              variant="ghost"
              onClick={() => {
                onOpenChange(false);
                setSelectedDates([]);
                setFestiveReason('');
              }}
              className="h-10"
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={onConfirm}
              disabled={selectedDates.length === 0 || isLoading}
              className="h-10 bg-amber-600 hover:bg-amber-700 text-white"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Star className="w-4 h-4 mr-2" />
              )}
              Block {selectedDates.length} Date{selectedDates.length !== 1 ? 's' : ''}
            </Button>
          </div>
        </DialogContent>
      </DialogPortal>
    </Dialog>
  );
}
