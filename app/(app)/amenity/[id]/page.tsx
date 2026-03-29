'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { doc, getDoc, collection, query, where, getDocs, addDoc, serverTimestamp, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useSession } from 'next-auth/react';
import { Calendar as CalendarIcon, Clock, Users, Info, ArrowLeft, CheckCircle2, AlertCircle, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import AmenityGalleryReviews from '@/components/amenity/amenity-gallery-reviews';
import { enqueueOfflineBooking, flushOfflineBookings } from '@/lib/offline-booking-queue';
import { useCommunityTimeZone } from '@/components/providers/community-branding-provider';
import { formatDateInTimeZone } from '@/lib/timezone';

interface Amenity {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  gallery?: string[];
  category?: string;
  isBlocked?: boolean;
  blockReason?: string;
  timeSlots?: string[]; // Dynamic time slots from Firestore
  weekdaySlots?: string[]; // Specific slots for Monday-Friday
  weekendSlots?: string[]; // Specific slots for Saturday-Sunday
  booking?: {
    slotDuration?: number; // Duration in hours (e.g., 2 for 2-hour slots)
    maxPeople?: number;
  };
  operatingHours?: {
    start: string; // e.g., "09:00"
    end: string;   // e.g., "21:00"
  };
  weekdayHours?: {
    start: string;
    end: string;
  };
  weekendHours?: {
    start: string;
    end: string;
  };
  rules: {
    maxSlotsPerFamily: number;
    blackoutDates: any[];
  };
}

interface Booking {
  id: string;
  startTime: Date;
  endTime: Date;
  attendees: string[];
  status: string;
}

// Default time slots (fallback if amenity doesn't have custom slots)
const DEFAULT_TIME_SLOTS = [
  '09:00-11:00',
  '11:00-13:00',
  '13:00-15:00',
  '15:00-17:00',
  '17:00-19:00',
  '19:00-21:00',
];

const CALENDAR_MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export default function AmenityBooking() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const timeZone = useCommunityTimeZone();
  const [amenity, setAmenity] = useState<Amenity | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [isMonthPickerOpen, setIsMonthPickerOpen] = useState(false);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSlot, setSelectedSlot] = useState<string>('');
  const [attendees, setAttendees] = useState<string[]>(['']);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [isBooking, setIsBooking] = useState(false); // Prevent double booking
  const [timeSlots, setTimeSlots] = useState<string[]>(DEFAULT_TIME_SLOTS); // Dynamic time slots

  const monthPickerYears = useMemo(() => {
    const centerYear = currentMonth.getFullYear();
    return Array.from({ length: 15 }, (_, index) => centerYear - 7 + index);
  }, [currentMonth]);

  // Generate time slots dynamically based on operating hours and duration
  const generateTimeSlots = (startHour: string, endHour: string, durationHours: number): string[] => {
    const slots: string[] = [];
    const [startH, startM] = startHour.split(':').map(Number);
    const [endH, endM] = endHour.split(':').map(Number);
    
    // Convert to minutes for accurate calculation
    let currentMinutes = startH * 60 + (startM || 0);
    const endMinutes = endH * 60 + (endM || 0);
    const slotDurationMinutes = Math.round(durationHours * 60);
    
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

  useEffect(() => {
    if (params.id && session?.user?.communityId) {
      // Set up real-time listener for amenity changes
      const amenityRef = doc(db, 'amenities', params.id as string);
      const unsubscribe = onSnapshot(amenityRef, (docSnap) => {
        if (docSnap.exists()) {
          const amenityData = docSnap.data();
          
          // Check if amenity belongs to user's community
          if (amenityData.communityId !== session.user.communityId) {
            console.error('Amenity not accessible to this community');
            toast.error('This amenity is not available in your community');
            return;
          }
          
          const fetchedAmenity = {
            id: docSnap.id,
            ...amenityData,
          } as Amenity;
          
          // Check if amenity just got blocked and show notification
          if (fetchedAmenity.isBlocked && (!amenity || !amenity.isBlocked)) {
            toast.error(
              `${fetchedAmenity.name} is currently unavailable${fetchedAmenity.blockReason ? `: ${fetchedAmenity.blockReason}` : '. Please check back later.'}`,
              { duration: 6000 }
            );
          }
          
          setAmenity(fetchedAmenity);
          
          // DEBUG: Log what we received
          console.log('🔥 FIRESTORE UPDATE RECEIVED:', {
            slotDuration: fetchedAmenity.booking?.slotDuration,
            hasWeekendSlots: !!fetchedAmenity.weekendSlots,
            hasWeekdaySlots: !!fetchedAmenity.weekdaySlots,
            hasTimeSlots: !!fetchedAmenity.timeSlots,
            hasOperatingHours: !!fetchedAmenity.operatingHours,
            operatingHours: fetchedAmenity.operatingHours,
            booking: fetchedAmenity.booking
          });
          
          // CRITICAL: Update time slots IMMEDIATELY when Firestore data changes
          // This runs every time booking.slotDuration or operating hours change
          const currentDate = selectedDate || new Date();
          const dayOfWeek = currentDate.getDay();
          const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
          
          // Generate slots based on current data
          if (isWeekend && fetchedAmenity.weekendSlots && fetchedAmenity.weekendSlots.length > 0) {
            console.log('✅ Using weekendSlots');

            setTimeSlots(fetchedAmenity.weekendSlots);
          } else if (!isWeekend && fetchedAmenity.weekdaySlots && fetchedAmenity.weekdaySlots.length > 0) {
            console.log('✅ Using weekdaySlots');
            setTimeSlots(fetchedAmenity.weekdaySlots);
          } else if (fetchedAmenity.timeSlots && fetchedAmenity.timeSlots.length > 0) {
            console.log('✅ Using timeSlots (custom) - THIS OVERRIDES GENERATION!');
            setTimeSlots(fetchedAmenity.timeSlots);
          } else if (isWeekend && fetchedAmenity.weekendHours && fetchedAmenity.booking?.slotDuration) {
            console.log('✅ Generating from weekendHours with duration:', fetchedAmenity.booking.slotDuration);
            const slots = generateTimeSlots(
              fetchedAmenity.weekendHours.start,
              fetchedAmenity.weekendHours.end,
              fetchedAmenity.booking.slotDuration
            );
            console.log('Generated weekend slots:', slots);
            setTimeSlots(slots);
          } else if (!isWeekend && fetchedAmenity.weekdayHours && fetchedAmenity.booking?.slotDuration) {
            console.log('✅ Generating from weekdayHours with duration:', fetchedAmenity.booking.slotDuration);
            const slots = generateTimeSlots(
              fetchedAmenity.weekdayHours.start,
              fetchedAmenity.weekdayHours.end,
              fetchedAmenity.booking.slotDuration
            );
            console.log('Generated weekday slots:', slots);
            setTimeSlots(slots);
          } else if (fetchedAmenity.operatingHours && fetchedAmenity.booking?.slotDuration) {
            console.log('✅ Generating from operatingHours with duration:', fetchedAmenity.booking.slotDuration, fetchedAmenity.operatingHours);
            const slots = generateTimeSlots(
              fetchedAmenity.operatingHours.start,
              fetchedAmenity.operatingHours.end,
              fetchedAmenity.booking.slotDuration
            );
            console.log('Generated operating hours slots:', slots);
            setTimeSlots(slots);
          } else {
            console.log('⚠️ USING DEFAULT_TIME_SLOTS - No booking config found!');
            setTimeSlots(DEFAULT_TIME_SLOTS);
          }
          
          setLoading(false);
        }
      }, (error) => {
        console.error('Error listening to amenity changes:', error);
        toast.error('Failed to load amenity details');
        setLoading(false);
      });

      // Cleanup listener on unmount
      return () => unsubscribe();
    }
  }, [params.id, session?.user?.communityId]);

  useEffect(() => {
    if (selectedDate && params.id) {
      fetchBookings(params.id as string, selectedDate);
      
      // Update time slots when date changes (weekday vs weekend)
      if (amenity) {
        updateTimeSlotsForDate(amenity, selectedDate);
      }
    }
  }, [selectedDate, params.id]);

  useEffect(() => {
    const onOnline = async () => {
      const processed = await flushOfflineBookings();
      if (processed > 0) {
        toast.success(`${processed} offline booking${processed > 1 ? 's were' : ' was'} synced.`);
      }
    };

    window.addEventListener('online', onOnline);
    return () => window.removeEventListener('online', onOnline);
  }, []);

  // Update time slots based on selected date (weekday vs weekend)
  const updateTimeSlotsForDate = (amenityData: Amenity, date: Date) => {
    const dayOfWeek = date.getDay(); // 0 = Sunday, 6 = Saturday
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    
    // Priority 1: Check for weekday/weekend specific slots
    if (isWeekend && amenityData.weekendSlots && amenityData.weekendSlots.length > 0) {
      console.log('📅 [Real-time] Using weekend slots:', amenityData.weekendSlots);
      setTimeSlots(amenityData.weekendSlots);
      return;
    }
    
    if (!isWeekend && amenityData.weekdaySlots && amenityData.weekdaySlots.length > 0) {
      console.log('📅 [Real-time] Using weekday slots:', amenityData.weekdaySlots);
      setTimeSlots(amenityData.weekdaySlots);
      return;
    }
    
    // Priority 2: Check for custom time slots (applies to all days)
    if (amenityData.timeSlots && Array.isArray(amenityData.timeSlots) && amenityData.timeSlots.length > 0) {
      console.log('📅 [Real-time] Using custom time slots:', amenityData.timeSlots);
      setTimeSlots(amenityData.timeSlots);
      return;
    }
    
    // Priority 3: Generate from weekday/weekend operating hours
    if (isWeekend && amenityData.weekendHours && amenityData.booking?.slotDuration) {
      const generatedSlots = generateTimeSlots(
        amenityData.weekendHours.start,
        amenityData.weekendHours.end,
        amenityData.booking.slotDuration
      );
      console.log('📅 [Real-time] Generated weekend slots:', generatedSlots);
      setTimeSlots(generatedSlots);
      return;
    }
    
    if (!isWeekend && amenityData.weekdayHours && amenityData.booking?.slotDuration) {
      const generatedSlots = generateTimeSlots(
        amenityData.weekdayHours.start,
        amenityData.weekdayHours.end,
        amenityData.booking.slotDuration
      );
      console.log('📅 [Real-time] Generated weekday slots:', generatedSlots);
      setTimeSlots(generatedSlots);
      return;
    }
    
    // Priority 4: Generate from general operating hours
    if (amenityData.operatingHours && amenityData.booking?.slotDuration) {
      const generatedSlots = generateTimeSlots(
        amenityData.operatingHours.start,
        amenityData.operatingHours.end,
        amenityData.booking.slotDuration
      );
      console.log('📅 [Real-time] Generated time slots:', generatedSlots);
      setTimeSlots(generatedSlots);
      return;
    }
    
    // Priority 5: Use default time slots
    console.log('📅 [Real-time] Using default time slots');
    setTimeSlots(DEFAULT_TIME_SLOTS);
  };

  const fetchBookings = async (amenityId: string, date: Date) => {
    try {
      if (!session?.user?.communityId) {
        console.error('No community ID found in session');
        return;
      }

      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      const q = query(
        collection(db, 'bookings'),
        where('amenityId', '==', amenityId),
        where('communityId', '==', session.user.communityId), // ADDED
        where('startTime', '>=', startOfDay),
        where('startTime', '<=', endOfDay),
        where('status', '==', 'confirmed')
      );

      const querySnapshot = await getDocs(q);
      const bookingList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        startTime: doc.data().startTime.toDate(),
        endTime: doc.data().endTime.toDate(),
      })) as Booking[];

      setBookings(bookingList);
    } catch (error) {
      console.error('Error fetching bookings:', error);
    }
  };

  const isSlotBooked = (timeSlot: string) => {
    const [startTime] = timeSlot.split('-');
    const [hours, minutes] = startTime.split(':').map(Number);
    
    return bookings.some(booking => {
      const bookingHour = booking.startTime.getHours();
      return bookingHour === hours;
    });
  };

  const navigateCalendarMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth((prev) => {
      const next = new Date(prev);
      next.setDate(1);
      next.setMonth(prev.getMonth() + (direction === 'prev' ? -1 : 1));

      setSelectedDate((currentSelected) => {
        if (!currentSelected) {
          return currentSelected;
        }

        const selectedDay = currentSelected.getDate();
        const maxDayInTargetMonth = new Date(
          next.getFullYear(),
          next.getMonth() + 1,
          0
        ).getDate();

        const nextSelectedDate = new Date(currentSelected);
        nextSelectedDate.setFullYear(
          next.getFullYear(),
          next.getMonth(),
          Math.min(selectedDay, maxDayInTargetMonth)
        );

        return nextSelectedDate;
      });

      return next;
    });
  };

  const applyCalendarMonthYear = (year: number, month: number) => {
    setCurrentMonth((prev) => {
      const next = new Date(prev);
      next.setDate(1);
      next.setFullYear(year, month, 1);

      setSelectedDate((currentSelected) => {
        if (!currentSelected) {
          return currentSelected;
        }

        const selectedDay = currentSelected.getDate();
        const maxDayInTargetMonth = new Date(year, month + 1, 0).getDate();
        const nextSelectedDate = new Date(currentSelected);
        nextSelectedDate.setFullYear(
          year,
          month,
          Math.min(selectedDay, maxDayInTargetMonth)
        );

        return nextSelectedDate;
      });

      return next;
    });
  };

  const jumpToToday = () => {
    const today = new Date();
    setSelectedDate(today);
    setCurrentMonth(new Date(today));
    setSelectedSlot('');
  };

  const handleBooking = async () => {
    // Prevent double booking
    if (isBooking) {
      console.log('🚫 Booking already in progress, ignoring duplicate request');
      return;
    }

    if (!selectedDate || !selectedSlot || !session?.user?.email || !amenity) {
      toast.error('Please fill in all required fields');
      return;
    }

    // Haptic feedback
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate([50, 30, 50]);
    }

    setIsBooking(true); // Lock the booking process

    // Check if the selected date is a blackout date
    const isBlackoutDate = amenity.rules?.blackoutDates?.some((blackoutItem: any) => {
      try {
        let blackoutDate: Date | null = null;
        
        if (blackoutItem?.date) {
          if (blackoutItem.date instanceof Date) {
            blackoutDate = blackoutItem.date;
          } else if (blackoutItem.date.seconds) {
            blackoutDate = new Date(blackoutItem.date.seconds * 1000);
          } else {
            blackoutDate = new Date(blackoutItem.date);
          }
        } else if (blackoutItem instanceof Date) {
          blackoutDate = blackoutItem;
        } else if (blackoutItem?.seconds) {
          blackoutDate = new Date(blackoutItem.seconds * 1000);
        } else if (typeof blackoutItem === 'string') {
          blackoutDate = new Date(blackoutItem);
        }
        
        if (blackoutDate && !isNaN(blackoutDate.getTime())) {
          const dateToCheck = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());
          const blackoutDateToCheck = new Date(blackoutDate.getFullYear(), blackoutDate.getMonth(), blackoutDate.getDate());
          return dateToCheck.getTime() === blackoutDateToCheck.getTime();
        }
        
        return false;
      } catch (error) {
        return false;
      }
    });

    if (isBlackoutDate) {
      toast.error('This date is blocked and not available for booking. Please select another date.');
      return;
    }

    const [slotStartTime, slotEndTime] = selectedSlot.split('-');
    const [startHours, startMinutes] = slotStartTime.split(':').map(Number);
    const [endHours, endMinutes] = slotEndTime.split(':').map(Number);

    const bookingStart = new Date(selectedDate);
    bookingStart.setHours(startHours, startMinutes, 0, 0);

    const bookingEnd = new Date(selectedDate);
    bookingEnd.setHours(endHours, endMinutes, 0, 0);

    try {
      // 🔥 NEW: Use transaction-based API
      console.log('🚀 Creating booking via transaction API...');
      
      const response = await fetch('/api/bookings/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amenityId: amenity.id,
          amenityName: amenity.name,
          startTime: bookingStart.toISOString(),
          endTime: bookingEnd.toISOString(),
          attendees: attendees.filter(name => name.trim() !== ''),
          selectedDate: selectedDate.toISOString(),
          selectedSlot: selectedSlot,
          userName: session.user.name || session.user.email.split('@')[0],
          userFlatNumber: (session.user as any).flatNumber || '',
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create booking');
      }

      console.log('✅ Booking created:', data);

      // Show appropriate success message based on status
      if (data.status === 'confirmed') {
        toast.success('🎉 Booking confirmed! Check your email for details. Redirecting...');
      } else if (data.status === 'waitlist') {
        toast.success(
          `📋 You're #${data.position} on the waitlist. We'll notify you if a spot opens up!`,
          { duration: 5000 }
        );
      }
      
      setShowBookingModal(false);
      
      // Redirect to bookings page
      setTimeout(() => {
        router.push('/bookings');
      }, 1500);
      
      // Refresh bookings
      fetchBookings(amenity.id, selectedDate);
      
    } catch (error) {
      console.error('❌ Booking error:', error);

      const offlinePayload = {
        amenityId: amenity.id,
        amenityName: amenity.name,
        startTime: bookingStart.toISOString(),
        endTime: bookingEnd.toISOString(),
        attendees: attendees.filter(name => name.trim() !== ''),
        selectedDate: selectedDate.toISOString(),
        selectedSlot,
        userName: session.user.name || session.user.email.split('@')[0],
        userFlatNumber: (session.user as any).flatNumber || '',
      };

      if (!navigator.onLine || error instanceof TypeError) {
        enqueueOfflineBooking(offlinePayload);
        toast.success('No internet. Booking was queued and will sync automatically when online.');
        setShowBookingModal(false);
        return;
      }

      toast.error(
        error instanceof Error 
          ? error.message 
          : 'Failed to create booking. Please try again.'
      );
    } finally {
      setIsBooking(false); // Unlock booking process
    }
  };

  const addAttendee = () => {
    setAttendees([...attendees, '']);
  };

  const removeAttendee = (index: number) => {
    setAttendees(attendees.filter((_, i) => i !== index));
  };

  const updateAttendee = (index: number, value: string) => {
    const updated = [...attendees];
    updated[index] = value;
    setAttendees(updated);
  };

  if (loading || !amenity) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          {/* Skeleton Header */}
          <div className="mb-6">
            <div className="h-4 w-32 bg-slate-200 dark:bg-slate-800 rounded animate-pulse mb-4" />
            <div className="h-8 w-64 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            {/* Skeleton Amenity Info */}
            <div className="lg:col-span-2">
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                <div className="h-48 bg-slate-200 dark:bg-slate-800 animate-pulse" />
                <div className="p-5">
                  <div className="h-5 w-3/4 bg-slate-200 dark:bg-slate-800 rounded animate-pulse mb-3" />
                  <div className="h-4 w-full bg-slate-200 dark:bg-slate-800 rounded animate-pulse mb-2" />
                  <div className="h-4 w-2/3 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
                </div>
              </div>
            </div>
            
            {/* Skeleton Booking Panel */}
            <div className="lg:col-span-3">
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5">
                <div className="h-6 w-40 bg-slate-200 dark:bg-slate-800 rounded animate-pulse mb-4" />
                <div className="h-64 bg-slate-100 dark:bg-slate-800 rounded-lg animate-pulse" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Page Header - Clean & Human-Readable */}
        <div className="mb-6 sm:mb-8">
          <Link 
            href="/dashboard" 
            className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 mb-3 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100">
                {amenity.name}
              </h1>
              <p className="text-slate-500 dark:text-slate-400 mt-1">
                {amenity.isBlocked ? 'Currently unavailable for booking' : 'Select a date and time to book'}
              </p>
            </div>
            <Badge 
              className={cn(
                "w-fit",
                amenity.isBlocked 
                  ? "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800" 
                  : "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800"
              )}
            >
              <span className={cn(
                "w-1.5 h-1.5 rounded-full mr-1.5",
                amenity.isBlocked ? "bg-red-500" : "bg-emerald-500"
              )} />
              {amenity.isBlocked ? 'Blocked' : 'Available'}
            </Badge>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Amenity Info Panel - Left Column */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
              {/* Image */}
              <div className="relative h-48 sm:h-56">
                <img
                  src={amenity.imageUrl || 'https://images.pexels.com/photos/296282/pexels-photo-296282.jpeg?auto=compress&cs=tinysrgb&w=1200'}
                  alt={amenity.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                {amenity.category && (
                  <Badge className="absolute top-3 left-3 bg-white/90 dark:bg-slate-900/90 text-slate-700 dark:text-slate-300 border-0">
                    {amenity.category}
                  </Badge>
                )}
              </div>
              
              {/* Details */}
              <div className="p-5">
                <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed mb-4">
                  {amenity.description}
                </p>
                
                {/* Quick Info Grid */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center gap-2 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                    <Users className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                    <div>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Max per booking</p>
                      <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                        {amenity.rules?.maxSlotsPerFamily || amenity.booking?.maxPeople || 4} people
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                    <Clock className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                    <div>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Slot duration</p>
                      <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                        {amenity.booking?.slotDuration 
                          ? amenity.booking.slotDuration === 1 
                            ? '1 hour' 
                            : amenity.booking.slotDuration < 1
                              ? `${amenity.booking.slotDuration * 60} min`
                              : `${amenity.booking.slotDuration} hours`
                          : '2 hours'}
                      </p>
                    </div>
                  </div>
                </div>
                
                {/* Block Reason */}
                {amenity.isBlocked && amenity.blockReason && (
                  <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 rounded-lg">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-red-800 dark:text-red-300">Temporarily Unavailable</p>
                        <p className="text-xs text-red-700 dark:text-red-400 mt-0.5">{amenity.blockReason}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <AmenityGalleryReviews
              amenityId={amenity.id}
              amenityName={amenity.name}
              imageUrl={amenity.imageUrl}
              gallery={amenity.gallery || []}
            />
            
            {/* Booking Rules Card */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-3">Booking Guidelines</h3>
              <ul className="space-y-2">
                <li className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-400">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                  <span>Maximum {amenity.rules?.maxSlotsPerFamily || 4} people per booking</span>
                </li>
                <li className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-400">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                  <span>Cancellations allowed up to 24 hours in advance</span>
                </li>
                <li className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-400">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                  <span>Please arrive on time and follow community rules</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Booking Panel - Right Column */}
          <div className="lg:col-span-3">
            {amenity.isBlocked ? (
              /* Blocked State */
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-8 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                  <AlertCircle className="w-8 h-8 text-red-500 dark:text-red-400" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
                  Booking Unavailable
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                  {amenity.blockReason || 'This amenity is temporarily unavailable. Please check back later.'}
                </p>
              </div>
            ) : (
              /* Booking Flow */
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                {/* Header */}
                <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <CalendarIcon className="w-5 h-5 text-slate-500 dark:text-slate-400" />
                    <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                      Select Date & Time
                    </h2>
                  </div>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                    Choose your preferred date and available time slot
                  </p>
                </div>
                
                {/* Calendar Section */}
                <div className="p-3 sm:p-5 border-b border-slate-100 dark:border-slate-800">
                  {/* Calendar Container with subtle elevation */}
<<<<<<< HEAD
                  <div className="bg-slate-50/50 dark:bg-slate-800/30 rounded-xl p-2 sm:p-4">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={setSelectedDate}
                      className="mx-auto w-full"
                      classNames={{
                        months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0 w-full",
                        month: "space-y-4 w-full relative",
                        caption: "flex justify-center pt-1 relative items-center h-10",
                        caption_label: "text-sm font-semibold text-slate-900 dark:text-slate-100",
                        nav: "absolute inset-x-0 top-0 h-10 px-1 flex items-center justify-between",
                        nav_button: cn(
                          "h-8 w-8 p-0 inline-flex items-center justify-center rounded-lg",
                          "text-slate-500 dark:text-slate-400",
                          "hover:bg-slate-100 dark:hover:bg-slate-800",
                          "active:scale-95 transition-all duration-100",
                          "disabled:opacity-40"
                        ),
                        nav_button_previous: "",
                        nav_button_next: "",
                        table: "w-full border-collapse",
                        head_row: "flex w-full justify-between",
                        head_cell: "text-slate-500 dark:text-slate-400 rounded-md w-9 font-medium text-xs text-center",
                        row: "flex w-full mt-1 justify-between",
                        cell: cn(
                          "relative p-0 sm:p-0.5 text-center text-sm focus-within:relative focus-within:z-20",
                          "[&:has([aria-selected])]:bg-transparent"
                        ),
                        day: cn(
                          "h-9 w-9 p-0 font-normal rounded-lg text-sm",
                          "transition-all duration-100",
                          "text-slate-900 dark:text-slate-100",
                          "hover:bg-slate-100 dark:hover:bg-slate-800",
                          "focus:outline-none",
                          
                        ),
                        day_selected: "bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-900 dark:hover:bg-white",
                        day_today: "ring-1 ring-slate-300 dark:ring-slate-700",
                        day_outside: "text-slate-300 dark:text-slate-700 opacity-30 hover:opacity-30 cursor-default",
                        day_disabled: "text-slate-300 dark:text-slate-700 opacity-20 cursor-not-allowed hover:bg-transparent dark:hover:bg-transparent",
                        day_hidden: "invisible",
                      }}
                    disabled={(date) => {
                      // Disable past dates
                      if (date < new Date(Date.now() - 86400000)) return true;
                      
                      // Disable blackout dates
                      if (amenity.rules?.blackoutDates && amenity.rules.blackoutDates.length > 0) {
                        return amenity.rules.blackoutDates.some((blackoutItem: any) => {
                          try {
                            let blackoutDate: Date | null = null;
                            
                            if (blackoutItem?.date) {
                              if (blackoutItem.date instanceof Date) {
                                blackoutDate = blackoutItem.date;
                              } else if (blackoutItem.date.seconds) {
                                blackoutDate = new Date(blackoutItem.date.seconds * 1000);
                              } else {
                                blackoutDate = new Date(blackoutItem.date);
=======
                  <div className="rounded-2xl border border-slate-200/70 dark:border-slate-700/70 bg-gradient-to-b from-white to-slate-50 dark:from-slate-900 dark:to-slate-900/60 shadow-sm p-3 sm:p-4">
                    <div className="mx-auto w-full max-w-[22.5rem] sm:max-w-[24.5rem]">
                    <div className="relative flex items-center justify-center mb-2.5 sm:mb-3">
                      <Button
                        variant="ghost"
                        size="sm"
                        aria-label="Previous month"
                        onClick={() => navigateCalendarMonth('prev')}
                        className={cn(
                          'absolute left-0 h-10 w-10 p-2 rounded-full',
                          'bg-white/60 dark:bg-white/10 backdrop-blur-md',
                          'border border-slate-200/60 dark:border-white/15',
                          'shadow-sm shadow-slate-900/5 dark:shadow-black/20',
                          'text-slate-600 dark:text-slate-300',
                          'hover:bg-black/5 dark:hover:bg-white/20',
                          'hover:text-slate-900 dark:hover:text-white',
                          'transition-all duration-200 ease-out hover:scale-105 active:scale-95'
                        )}
                      >
                        <ChevronLeft className="h-5 w-5" />
                      </Button>
                      <Popover open={isMonthPickerOpen} onOpenChange={setIsMonthPickerOpen}>
                        <PopoverTrigger asChild>
                          <Button
                            type="button"
                            variant="ghost"
                            className={cn(
                              "h-9 rounded-full px-4 text-base font-semibold tracking-tight",
                              "text-slate-900 dark:text-white",
                              "hover:bg-black/5 dark:hover:bg-white/10",
                              "focus-visible:ring-2 focus-visible:ring-black/25 dark:focus-visible:ring-white/35"
                            )}
                          >
                            <span>{formatDateInTimeZone(currentMonth, timeZone, { month: 'long', year: 'numeric' })}</span>
                            <ChevronDown
                              className={cn(
                                "ml-1.5 h-4 w-4 transition-transform duration-200",
                                isMonthPickerOpen && "rotate-180"
                              )}
                            />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent
                          align="center"
                          className={cn(
                            "w-[18.5rem] rounded-2xl border p-3",
                            "border-slate-200 dark:border-slate-800",
                            "bg-white/95 dark:bg-slate-900/95 backdrop-blur-md"
                          )}
                        >
                          <div className="space-y-3">
                            <Select
                              value={String(currentMonth.getFullYear())}
                              onValueChange={(value) => {
                                applyCalendarMonthYear(Number(value), currentMonth.getMonth());
                              }}
                            >
                              <SelectTrigger className="h-9 rounded-lg border-slate-200 dark:border-slate-700">
                                <SelectValue placeholder="Select year" />
                              </SelectTrigger>
                              <SelectContent className="max-h-64 rounded-xl border-slate-200 dark:border-slate-800">
                                {monthPickerYears.map((year) => (
                                  <SelectItem key={year} value={String(year)} className="rounded-md">
                                    {year}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>

                            <div className="grid grid-cols-4 gap-1.5">
                              {CALENDAR_MONTH_LABELS.map((monthLabel, monthIndex) => {
                                const isActiveMonth = monthIndex === currentMonth.getMonth();

                                return (
                                  <button
                                    key={monthLabel}
                                    type="button"
                                    onClick={() => {
                                      applyCalendarMonthYear(currentMonth.getFullYear(), monthIndex);
                                      setIsMonthPickerOpen(false);
                                    }}
                                    className={cn(
                                      "h-8 rounded-lg text-xs font-semibold transition-colors",
                                      isActiveMonth
                                        ? "bg-black text-white dark:bg-white dark:text-black"
                                        : "bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                                    )}
                                  >
                                    {monthLabel}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        </PopoverContent>
                      </Popover>
                      <Button
                        variant="ghost"
                        size="sm"
                        aria-label="Next month"
                        onClick={() => navigateCalendarMonth('next')}
                        className={cn(
                          'absolute right-0 h-10 w-10 p-2 rounded-full',
                          'bg-white/60 dark:bg-white/10 backdrop-blur-md',
                          'border border-slate-200/60 dark:border-white/15',
                          'shadow-sm shadow-slate-900/5 dark:shadow-black/20',
                          'text-slate-600 dark:text-slate-300',
                          'hover:bg-black/5 dark:hover:bg-white/20',
                          'hover:text-slate-900 dark:hover:text-white',
                          'transition-all duration-200 ease-out hover:scale-105 active:scale-95'
                        )}
                      >
                        <ChevronRight className="h-5 w-5" />
                      </Button>
                    </div>

                    <div className="mb-2.5 flex items-center justify-between gap-2">
                      <span className="inline-flex h-7 items-center rounded-full border border-slate-200 bg-slate-50 px-2.5 text-[11px] font-medium text-slate-600 dark:border-slate-700 dark:bg-slate-800/70 dark:text-slate-300">
                        Today: {formatDateInTimeZone(new Date(), timeZone, { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={jumpToToday}
                        className="h-7 rounded-full px-2.5 text-xs font-semibold text-slate-600 hover:bg-black/5 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white"
                      >
                        Go to today
                      </Button>
                    </div>

                    <AnimatePresence mode="wait" initial={false}>
                      <motion.div
                        key={`${currentMonth.getFullYear()}-${currentMonth.getMonth()}`}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.3, ease: 'easeOut' }}
                      >
                        <Calendar
                          mode="single"
                          selected={selectedDate}
                          onSelect={(date) => {
                            setSelectedDate(date);
                            if (date) {
                              setCurrentMonth(new Date(date));
                            }
                          }}
                          month={currentMonth}
                          onMonthChange={setCurrentMonth}
                          className="mx-auto w-full p-0"
                          classNames={{
                            months: "flex flex-col w-full",
                            month: "space-y-3 w-full",
                            month_caption: "hidden",
                            nav: "hidden",
                            month_grid: "w-full table-fixed border-collapse",
                            weekdays: "",
                            weekday: "h-8 pb-1 text-center align-middle text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400 dark:text-slate-500 sm:h-9 sm:pb-1.5",
                            week: "",
                            day: "h-10 p-0 text-center align-middle relative focus-within:relative focus-within:z-20 sm:h-11",
                            day_button: cn(
                              "mx-auto aspect-square w-full max-w-[2rem] sm:max-w-[2.2rem] lg:max-w-[2.35rem]",
                              "rounded-xl text-sm font-medium",
                              "flex items-center justify-center p-0",
                              "transition-all duration-200 ease-out",
                              "hover:bg-black/5 dark:hover:bg-white/10",
                              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/25 dark:focus-visible:ring-white/35 focus-visible:ring-offset-2",
                              "focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-900",
                              "[&[aria-current=date]]:font-semibold",
                              "disabled:text-slate-400 dark:disabled:text-slate-600",
                              "disabled:opacity-40 disabled:cursor-not-allowed"
                            ),
                            selected: "[&>button]:!bg-black [&>button]:!text-white dark:[&>button]:!bg-white dark:[&>button]:!text-slate-900 [&>button]:font-semibold [&>button]:ring-1 [&>button]:ring-inset [&>button]:ring-black/20 dark:[&>button]:ring-white/25",
                            today: "[&>button]:ring-1 [&>button]:ring-inset [&>button]:ring-slate-500 dark:[&>button]:ring-slate-300 [&>button]:font-semibold [&>button]:bg-slate-100/80 dark:[&>button]:bg-slate-800/80",
                            outside: "text-slate-400 dark:text-slate-600 opacity-55",
                            disabled: "",
                            day_hidden: "invisible",
                          }}
                        disabled={(date) => {
                          // Disable past dates
                          if (date < new Date(Date.now() - 86400000)) return true;
                          
                          // Disable blackout dates
                          if (amenity.rules?.blackoutDates && amenity.rules.blackoutDates.length > 0) {
                            return amenity.rules.blackoutDates.some((blackoutItem: any) => {
                              try {
                                let blackoutDate: Date | null = null;
                                
                                if (blackoutItem?.date) {
                                  if (blackoutItem.date instanceof Date) {
                                    blackoutDate = blackoutItem.date;
                                  } else if (blackoutItem.date.seconds) {
                                    blackoutDate = new Date(blackoutItem.date.seconds * 1000);
                                  } else {
                                    blackoutDate = new Date(blackoutItem.date);
                                  }
                                } else if (blackoutItem instanceof Date) {
                                  blackoutDate = blackoutItem;
                                } else if (blackoutItem?.seconds) {
                                  blackoutDate = new Date(blackoutItem.seconds * 1000);
                                } else if (typeof blackoutItem === 'string') {
                                  blackoutDate = new Date(blackoutItem);
                                }
                                
                                if (blackoutDate && !isNaN(blackoutDate.getTime())) {
                                  const dateToCheck = new Date(date.getFullYear(), date.getMonth(), date.getDate());
                                  const blackoutDateToCheck = new Date(blackoutDate.getFullYear(), blackoutDate.getMonth(), blackoutDate.getDate());
                                  return dateToCheck.getTime() === blackoutDateToCheck.getTime();
                                }
                                
                                return false;
                              } catch (error) {
                                return false;
>>>>>>> 3fcb4da (fixup! fix(vercel): resolve React 19 peer dependency install failures)
                              }
                            });
                          }
                          
                          return false;
                        }}
                        />
                      </motion.div>
                    </AnimatePresence>
                    </div>
                  </div>
                  
                  {/* Blocked Dates Notice */}
                  {amenity.rules?.blackoutDates && amenity.rules.blackoutDates.length > 0 && (
                    <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Info className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                        <span className="text-sm font-medium text-amber-800 dark:text-amber-300">
                          Some dates are blocked
                        </span>
                      </div>
                      <p className="text-xs text-amber-700 dark:text-amber-400 mt-1">
                        Blocked dates are unavailable due to maintenance or community events.
                      </p>
                    </div>
                  )}
                </div>

                {/* Time Slots Section */}
                {selectedDate ? (
                  <div className="p-4 sm:p-5">
                    <div className="flex items-center justify-between mb-3 sm:mb-4">
                      <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                        Available Slots
                      </h3>
                      <span className="text-xs font-medium px-2 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                        {formatDateInTimeZone(selectedDate, timeZone, { weekday: 'short', month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-2.5">
                      {timeSlots.map((slot) => {
                        const booked = isSlotBooked(slot);
                        const isSelected = selectedSlot === slot;
                        
                        return (
                          <button
                            key={slot}
                            disabled={booked}
                            onClick={() => !booked && setSelectedSlot(slot)}
                            className={cn(
                              "relative px-2 sm:px-3 py-3 sm:py-3.5 rounded-xl text-sm font-medium",
                              "border-2 transition-all duration-100",
                              "focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-slate-500",
                              booked 
                                ? "bg-slate-50 dark:bg-slate-800/50 text-slate-400 dark:text-slate-500 border-slate-100 dark:border-slate-800 cursor-not-allowed"
                                : isSelected
                                  ? cn(
                                      "bg-slate-900 dark:bg-white text-white dark:text-slate-900",
                                      "border-slate-900 dark:border-white",
                                      "shadow-md shadow-slate-900/20 dark:shadow-white/10",
                                      "scale-[1.02]"
                                    )
                                  : cn(
                                      "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300",
                                      "border-slate-200 dark:border-slate-700",
                                      "hover:border-slate-400 dark:hover:border-slate-500",
                                      "hover:bg-slate-50 dark:hover:bg-slate-700/70",
                                      "hover:shadow-sm",
                                      "active:scale-[0.98] active:shadow-none"
                                    )
                            )}
                          >
                            <div className="flex items-center justify-center gap-1.5">
                              <Clock className={cn(
                                "w-3.5 h-3.5 transition-colors",
                                isSelected ? "text-white/80 dark:text-slate-900/80" : ""
                              )} />
                              <span>{slot}</span>
                            </div>
                            {booked && (
                              <span className="absolute -top-2 -right-2 px-1.5 py-0.5 text-[10px] font-semibold bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400 rounded-md">
                                Taken
                              </span>
                            )}
                            {isSelected && !booked && (
                              <span className="absolute -top-2 -right-2 w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center shadow-sm">
                                <CheckCircle2 className="w-4 h-4 text-white" />
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                    
                    {/* Book Button */}
                    {selectedSlot && (
                      <Dialog open={showBookingModal} onOpenChange={setShowBookingModal}>
                        <DialogTrigger asChild>
                          <Button 
                            className={cn(
                              "w-full mt-5 sm:mt-6 h-12 sm:h-13 text-base font-semibold",
                              "bg-slate-900 dark:bg-white text-white dark:text-slate-900",
                              "hover:bg-slate-800 dark:hover:bg-slate-100",
                              "shadow-lg shadow-slate-900/20 dark:shadow-white/10",
                              "active:scale-[0.98] active:shadow-md transition-all duration-150"
                            )}
                          >
                            Book {selectedSlot}
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-md">
                          <DialogHeader>
                            <DialogTitle className="text-lg">Confirm Your Booking</DialogTitle>
                            <DialogDescription className="text-slate-500 dark:text-slate-400">
                              {amenity.name} • {formatDateInTimeZone(selectedDate, timeZone, { weekday: 'short', month: 'short', day: 'numeric' })} • {selectedSlot}
                            </DialogDescription>
                          </DialogHeader>
                          
                          <div className="space-y-4 mt-4">
                            <div>
                              <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                Attendees
                              </Label>
                              <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
                                Add names of people attending (including yourself)
                              </p>
                              {attendees.map((attendee, index) => (
                                <div key={index} className="flex items-center gap-2 mt-2">
                                  <Input
                                    placeholder={index === 0 ? "Your name" : "Attendee name"}
                                    value={attendee}
                                    onChange={(e) => updateAttendee(index, e.target.value)}
                                    className="flex-1"
                                  />
                                  {index > 0 && (
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => removeAttendee(index)}
                                      className="text-slate-500 hover:text-red-500"
                                    >
                                      Remove
                                    </Button>
                                  )}
                                </div>
                              ))}
                              {attendees.length < (amenity.rules?.maxSlotsPerFamily || 4) && (
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={addAttendee}
                                  className="mt-2"
                                >
                                  + Add attendee
                                </Button>
                              )}
                            </div>
                            
                            {/* Summary */}
                            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                              <div className="flex items-center gap-2 mb-2">
                                <Info className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                                <span className="text-sm font-medium text-slate-900 dark:text-slate-100">Booking Summary</span>
                              </div>
                              <ul className="text-sm text-slate-600 dark:text-slate-400 space-y-1">
                                <li>• {amenity.name}</li>
                                <li>• {formatDateInTimeZone(selectedDate, timeZone, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</li>
                                <li>• Time: {selectedSlot}</li>
                                <li>• {attendees.filter(a => a.trim()).length || 1} attendee(s)</li>
                              </ul>
                            </div>
                            
                            {/* Actions */}
                            <div className="flex gap-3 pt-2">
                              <Button
                                variant="outline"
                                onClick={() => setShowBookingModal(false)}
                                disabled={isBooking}
                                className="flex-1"
                              >
                                Cancel
                              </Button>
                              <Button
                                onClick={handleBooking}
                                disabled={isBooking}
                                className={cn(
                                  "flex-1",
                                  "bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900",
                                  "hover:bg-slate-800 dark:hover:bg-slate-200"
                                )}
                              >
                                {isBooking ? (
                                  <span className="flex items-center gap-2">
                                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                    </svg>
                                    Booking...
                                  </span>
                                ) : (
                                  'Confirm Booking'
                                )}
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    )}
                  </div>
                ) : (
                  /* No Date Selected State */
                  <div className="p-6 sm:p-8 text-center">
                    <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                      <CalendarIcon className="w-6 h-6 text-slate-400 dark:text-slate-500" />
                    </div>
                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Select a date to continue</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 max-w-[200px] mx-auto">
                      Pick your preferred date from the calendar above
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}