'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Clock, Save, Eye, Plus, Trash2, Calendar, AlertCircle, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Amenity {
  id: string;
  name: string;
  category?: string;
  timeSlots?: string[];
  slotDuration?: number;
  operatingHours?: {
    start: string;
    end: string;
  };
}

export default function AdminTimeSlotsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [amenities, setAmenities] = useState<Amenity[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [editingAmenity, setEditingAmenity] = useState<string | null>(null);

  // Form state for editing
  const [customSlots, setCustomSlots] = useState<string[]>([]);
  const [operatingStart, setOperatingStart] = useState('09:00');
  const [operatingEnd, setOperatingEnd] = useState('21:00');
  const [slotDuration, setSlotDuration] = useState(2);
  const [useCustomSlots, setUseCustomSlots] = useState(false);
  const [previewSlots, setPreviewSlots] = useState<string[]>([]);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    } else if (session?.user?.role !== 'admin') {
      router.push('/dashboard');
      toast.error('Admin access required');
    } else {
      fetchAmenities();
    }
  }, [session, status, router]);

  const fetchAmenities = async () => {
    try {
      const response = await fetch('/api/amenities/list');
      if (!response.ok) throw new Error('Failed to fetch amenities');
      
      const data = await response.json();
      setAmenities(data.amenities || []);
    } catch (error) {
      console.error('Error fetching amenities:', error);
      toast.error('Failed to load amenities');
    } finally {
      setLoading(false);
    }
  };

  const generateTimeSlots = (start: string, end: string, duration: number): string[] => {
    const slots: string[] = [];
    const [startH, startM] = start.split(':').map(Number);
    const [endH, endM] = end.split(':').map(Number);
    
    // Convert to minutes for accurate calculation
    let currentMinutes = startH * 60 + (startM || 0);
    const endMinutes = endH * 60 + (endM || 0);
    const slotDurationMinutes = Math.round(duration * 60);
    
    while (currentMinutes + slotDurationMinutes <= endMinutes) {
      const startHourCalc = Math.floor(currentMinutes / 60);
      const startMinuteCalc = currentMinutes % 60;
      const slotStart = `${String(startHourCalc).padStart(2, '0')}:${String(startMinuteCalc).padStart(2, '0')}`;
      
      const endMinutesCalc = currentMinutes + slotDurationMinutes;
      const endHourCalc = Math.floor(endMinutesCalc / 60);
      const endMinuteCalc = endMinutesCalc % 60;
      const slotEnd = `${String(endHourCalc).padStart(2, '0')}:${String(endMinuteCalc).padStart(2, '0')}`;
      
      slots.push(`${slotStart}-${slotEnd}`);
      
      // Move to next slot
      currentMinutes += slotDurationMinutes;
    }
    
    return slots;
  };

  const handleEditAmenity = (amenity: Amenity) => {
    setEditingAmenity(amenity.id);
    
    if (amenity.timeSlots && amenity.timeSlots.length > 0) {
      setUseCustomSlots(true);
      setCustomSlots(amenity.timeSlots);
      setPreviewSlots(amenity.timeSlots);
    } else if (amenity.operatingHours && amenity.slotDuration) {
      setUseCustomSlots(false);
      setOperatingStart(amenity.operatingHours.start);
      setOperatingEnd(amenity.operatingHours.end);
      setSlotDuration(amenity.slotDuration);
      const generated = generateTimeSlots(
        amenity.operatingHours.start,
        amenity.operatingHours.end,
        amenity.slotDuration
      );
      setPreviewSlots(generated);
    } else {
      setUseCustomSlots(false);
      setOperatingStart('09:00');
      setOperatingEnd('21:00');
      setSlotDuration(2);
      setPreviewSlots(generateTimeSlots('09:00', '21:00', 2));
    }
  };

  const handlePreview = () => {
    if (useCustomSlots) {
      setPreviewSlots(customSlots.filter(slot => slot.trim() !== ''));
    } else {
      const generated = generateTimeSlots(operatingStart, operatingEnd, slotDuration);
      setPreviewSlots(generated);
    }
  };

  const handleSaveTimeSlots = async (amenityId: string) => {
    setSaving(amenityId);
    
    try {
      const updateData: any = {};
      
      if (useCustomSlots) {
        const validSlots = customSlots.filter(slot => slot.trim() !== '');
        if (validSlots.length === 0) {
          toast.error('Please add at least one time slot');
          return;
        }
        updateData.timeSlots = validSlots;
        updateData.operatingHours = null;
        updateData.slotDuration = null;
      } else {
        updateData.operatingHours = {
          start: operatingStart,
          end: operatingEnd,
        };
        updateData.slotDuration = slotDuration;
        updateData.timeSlots = null;
      }
      
      const response = await fetch(`/api/amenities/update-time-slots`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amenityId,
          ...updateData,
        }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update time slots');
      }
      
      toast.success('Time slots updated successfully! 🎉');
      setEditingAmenity(null);
      fetchAmenities(); // Refresh list
      
    } catch (error) {
      console.error('Error saving time slots:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to save time slots');
    } finally {
      setSaving(null);
    }
  };

  const addCustomSlot = () => {
    setCustomSlots([...customSlots, '']);
  };

  const removeCustomSlot = (index: number) => {
    setCustomSlots(customSlots.filter((_, i) => i !== index));
  };

  const updateCustomSlot = (index: number, value: string) => {
    const updated = [...customSlots];
    updated[index] = value;
    setCustomSlots(updated);
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-1/3"></div>
            <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/2"></div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-64 bg-slate-200 dark:bg-slate-700 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
            <Clock className="w-8 h-8 text-blue-500" />
            Time Slots Management
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Configure dynamic time slots for each amenity. Choose custom slots or auto-generate from operating hours.
          </p>
        </motion.div>

        {/* Amenities Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {amenities.map((amenity, index) => (
            <motion.div
              key={amenity.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
                <CardHeader className="bg-gradient-to-r from-blue-500 to-purple-600 text-white">
                  <CardTitle className="flex items-center justify-between">
                    <span>{amenity.name}</span>
                    {amenity.category && (
                      <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                        {amenity.category}
                      </Badge>
                    )}
                  </CardTitle>
                  <CardDescription className="text-white/90">
                    {amenity.timeSlots?.length ? (
                      <span className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4" />
                        {amenity.timeSlots.length} custom slots configured
                      </span>
                    ) : amenity.operatingHours ? (
                      <span className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        Auto-generated ({amenity.operatingHours.start} - {amenity.operatingHours.end})
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <AlertCircle className="w-4 h-4" />
                        Using default time slots
                      </span>
                    )}
                  </CardDescription>
                </CardHeader>

                <CardContent className="p-6">
                  {editingAmenity === amenity.id ? (
                    <div className="space-y-4">
                      {/* Toggle between custom and auto-generated */}
                      <div className="flex gap-2">
                        <Button
                          variant={useCustomSlots ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setUseCustomSlots(true)}
                          className="flex-1"
                        >
                          Custom Slots
                        </Button>
                        <Button
                          variant={!useCustomSlots ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setUseCustomSlots(false)}
                          className="flex-1"
                        >
                          Auto-Generate
                        </Button>
                      </div>

                      {useCustomSlots ? (
                        <div className="space-y-3">
                          <Label>Custom Time Slots</Label>
                          {customSlots.map((slot, index) => (
                            <div key={index} className="flex gap-2">
                              <Input
                                placeholder="09:00-11:00"
                                value={slot}
                                onChange={(e) => updateCustomSlot(index, e.target.value)}
                                className="flex-1"
                              />
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={() => removeCustomSlot(index)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          ))}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={addCustomSlot}
                            className="w-full"
                          >
                            <Plus className="w-4 h-4 mr-2" />
                            Add Slot
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <div>
                            <Label>Operating Hours - Start</Label>
                            <Input
                              type="time"
                              value={operatingStart}
                              onChange={(e) => setOperatingStart(e.target.value)}
                            />
                          </div>
                          <div>
                            <Label>Operating Hours - End</Label>
                            <Input
                              type="time"
                              value={operatingEnd}
                              onChange={(e) => setOperatingEnd(e.target.value)}
                            />
                          </div>
                          <div>
                            <Label>Slot Duration (hours)</Label>
                            <Input
                              type="number"
                              min="0.5"
                              step="0.5"
                              value={slotDuration}
                              onChange={(e) => setSlotDuration(parseFloat(e.target.value))}
                            />
                          </div>
                        </div>
                      )}

                      {/* Preview */}
                      <div className="pt-4 border-t">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handlePreview}
                          className="w-full mb-3"
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          Preview Slots
                        </Button>
                        
                        <AnimatePresence>
                          {previewSlots.length > 0 && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              className="space-y-2 max-h-40 overflow-y-auto"
                            >
                              <Label className="text-xs text-slate-600">Preview ({previewSlots.length} slots)</Label>
                              <div className="grid grid-cols-2 gap-2">
                                {previewSlots.map((slot, i) => (
                                  <Badge key={i} variant="outline" className="justify-center">
                                    {slot}
                                  </Badge>
                                ))}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2 pt-4">
                        <Button
                          variant="outline"
                          onClick={() => setEditingAmenity(null)}
                          className="flex-1"
                          disabled={saving === amenity.id}
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={() => handleSaveTimeSlots(amenity.id)}
                          disabled={saving === amenity.id}
                          className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white"
                        >
                          {saving === amenity.id ? (
                            <span className="flex items-center">
                              <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              Saving...
                            </span>
                          ) : (
                            <>
                              <Save className="w-4 h-4 mr-2" />
                              Save
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Current Configuration */}
                      <div className="space-y-2">
                        <Label className="text-xs text-slate-600">Current Time Slots</Label>
                        <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto">
                          {amenity.timeSlots?.map((slot, i) => (
                            <Badge key={i} variant="secondary" className="justify-center">
                              {slot}
                            </Badge>
                          )) || (
                            amenity.operatingHours ? (
                              generateTimeSlots(
                                amenity.operatingHours.start,
                                amenity.operatingHours.end,
                                amenity.slotDuration || 2
                              ).map((slot, i) => (
                                <Badge key={i} variant="secondary" className="justify-center">
                                  {slot}
                                </Badge>
                              ))
                            ) : (
                              <span className="col-span-2 text-sm text-slate-500">Using default slots</span>
                            )
                          )}
                        </div>
                      </div>

                      <Button
                        onClick={() => handleEditAmenity(amenity)}
                        className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white"
                      >
                        <Clock className="w-4 h-4 mr-2" />
                        Edit Time Slots
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {amenities.length === 0 && (
          <Card className="border-0 shadow-lg">
            <CardContent className="p-12 text-center">
              <AlertCircle className="w-12 h-12 mx-auto mb-4 text-slate-400" />
              <p className="text-slate-600 dark:text-slate-400">No amenities found</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
