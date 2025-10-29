'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { doc, getDoc, collection, query, where, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useSession } from 'next-auth/react';
import { motion } from 'framer-motion';
import { Calendar as CalendarIcon, Clock, Users, MapPin, Info } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

interface Amenity {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  category?: string;
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

const timeSlots = [
  '09:00-11:00',
  '11:00-13:00',
  '13:00-15:00',
  '15:00-17:00',
  '17:00-19:00',
  '19:00-21:00',
];

export default function AmenityBooking() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const [amenity, setAmenity] = useState<Amenity | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSlot, setSelectedSlot] = useState<string>('');
  const [attendees, setAttendees] = useState<string[]>(['']);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [isBooking, setIsBooking] = useState(false); // Prevent double booking

  useEffect(() => {
    if (params.id) {
      fetchAmenity(params.id as string);
    }
  }, [params.id]);

  useEffect(() => {
    if (selectedDate && params.id) {
      fetchBookings(params.id as string, selectedDate);
    }
  }, [selectedDate, params.id]);

  const fetchAmenity = async (amenityId: string) => {
    try {
      if (!session?.user?.communityId) {
        console.error('No community ID found in session');
        return;
      }

      const amenityDoc = await getDoc(doc(db, 'amenities', amenityId));
      if (amenityDoc.exists()) {
        const amenityData = amenityDoc.data();
        
        // Check if amenity belongs to user's community
        if (amenityData.communityId !== session.user.communityId) {
          console.error('Amenity not accessible to this community');
          toast.error('This amenity is not available in your community');
          return;
        }
        
        setAmenity({
          id: amenityDoc.id,
          ...amenityData,
        } as Amenity);
      }
    } catch (error) {
      console.error('Error fetching amenity:', error);
      toast.error('Failed to load amenity details');
    } finally {
      setLoading(false);
    }
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

    try {
      const [startTime] = selectedSlot.split('-');
      const [hours, minutes] = startTime.split(':').map(Number);
      
      const bookingStart = new Date(selectedDate);
      bookingStart.setHours(hours, minutes, 0, 0);
      
      const bookingEnd = new Date(bookingStart);
      bookingEnd.setHours(hours + 2, minutes, 0, 0);

      const bookingData = {
        amenityId: amenity.id,
        amenityName: amenity.name, // CRITICAL: Save the actual amenity name
        amenityType: amenity.category || 'general', // Use category instead of rules.type
        userId: session.user.email,
        userEmail: session.user.email, // Add userEmail field
        userName: session.user.name || session.user.email.split('@')[0], // Add userName
        userFlatNumber: (session.user as any).flatNumber || '', // Add flat number
        communityId: session.user.communityId,
        attendees: attendees.filter(name => name.trim() !== ''),
        startTime: bookingStart,
        endTime: bookingEnd,
        status: 'confirmed',
        qrId: Math.random().toString(36).substring(2, 15),
        createdAt: serverTimestamp(),
      };

      const docRef = await addDoc(collection(db, 'bookings'), bookingData);
      
      // Send instant email confirmation
      try {
        await fetch('/api/notifications/email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'booking_confirmation',
            data: {
              userEmail: session.user.email,
              userName: session.user.name || 'Resident',
              amenityName: amenity.name,
              date: selectedDate.toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              }),
              timeSlot: selectedSlot,
              bookingId: docRef.id,
              communityName: (session.user as any).communityName || 'Your Community',
            },
          }),
        });
        console.log('✅ Booking confirmation email sent');
      } catch (emailError) {
        console.error('⚠️ Failed to send email, but booking created:', emailError);
        // Don't fail the booking if email fails
      }
      
      toast.success('Booking confirmed successfully! Check your email for details. Redirecting...');
      setShowBookingModal(false);
      
      // Redirect to bookings page after successful booking
      setTimeout(() => {
        router.push('/bookings');
      }, 1500); // Give time for user to see the success message
      
      fetchBookings(amenity.id, selectedDate);
    } catch (error) {
      console.error('Error creating booking:', error);
      toast.error('Failed to create booking. Please try again.');
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
      <div className="p-8">
        <Card className="animate-pulse">
          <div className="h-64 bg-slate-200 dark:bg-slate-700 rounded-t-lg"></div>
          <CardHeader>
            <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-1/2 mb-4"></div>
            <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-full mb-2"></div>
            <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4"></div>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-8"
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
        {/* Amenity Info */}
        <Card className="border-0 bg-white dark:bg-slate-900">
          <div className="relative overflow-hidden rounded-t-lg">
            <img
              src={amenity.imageUrl || 'https://images.pexels.com/photos/296282/pexels-photo-296282.jpeg?auto=compress&cs=tinysrgb&w=1200'}
              alt={amenity.name}
              className="w-full h-48 sm:h-56 lg:h-64 object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
            <div className="absolute bottom-4 left-4">
              <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">{amenity.name}</h1>
              <Badge className="bg-white/20 text-white border-white/30 text-xs sm:text-sm">
                Available Now
              </Badge>
            </div>
          </div>
          
          <CardHeader className="p-4 sm:p-6">
            <CardDescription className="text-slate-600 dark:text-slate-400 text-sm sm:text-base">
              {amenity.description}
            </CardDescription>
            
            <div className="flex flex-wrap gap-3 sm:gap-4 pt-4">
              <div className="flex items-center text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                <Users className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                <span>Max {amenity.rules.maxSlotsPerFamily} per family</span>
              </div>
              <div className="flex items-center text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                <Clock className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                <span>2-hour slots</span>
              </div>
              <div className="flex items-center text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                <MapPin className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                <span>Community Center</span>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Booking Calendar */}
        <Card className="border-0 bg-white dark:bg-slate-900">
          <CardHeader>
            <CardTitle className="flex items-center text-base sm:text-lg">
              <CalendarIcon className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
              Select Date & Time
            </CardTitle>
            <CardDescription className="text-sm">
              Choose your preferred date and time slot
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            <div className="flex justify-center w-full overflow-x-auto">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                className="rounded-md border w-full max-w-full"
                classNames={{
                  months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
                  month: "space-y-4 w-full",
                  caption: "flex justify-center pt-1 relative items-center",
                  caption_label: "text-sm font-medium",
                  nav: "space-x-1 flex items-center",
                  nav_button: "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100",
                  nav_button_previous: "absolute left-1",
                  nav_button_next: "absolute right-1",
                  table: "w-full border-collapse space-y-1",
                  head_row: "flex w-full",
                  head_cell: "text-muted-foreground rounded-md w-full font-normal text-[0.8rem]",
                  row: "flex w-full mt-2",
                  cell: "text-center text-sm p-0 relative [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20 w-full",
                  day: "h-8 w-full sm:h-9 p-0 font-normal aria-selected:opacity-100 hover:bg-accent hover:text-accent-foreground rounded-md",
                  day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
                  day_today: "bg-accent text-accent-foreground",
                  day_outside: "text-muted-foreground opacity-50",
                  day_disabled: "text-muted-foreground opacity-50",
                  day_range_middle: "aria-selected:bg-accent aria-selected:text-accent-foreground",
                  day_hidden: "invisible",
                }}
                disabled={(date) => {
                // Disable past dates
                if (date < new Date(Date.now() - 86400000)) return true;
                
                // Disable blackout dates with improved date handling
                if (amenity.rules?.blackoutDates && amenity.rules.blackoutDates.length > 0) {
                  return amenity.rules.blackoutDates.some((blackoutItem: any) => {
                    try {
                      let blackoutDate: Date | null = null;
                      
                      // Handle different date formats
                      if (blackoutItem?.date) {
                        if (blackoutItem.date instanceof Date) {
                          blackoutDate = blackoutItem.date;
                        } else if (blackoutItem.date.seconds) {
                          // Firestore timestamp
                          blackoutDate = new Date(blackoutItem.date.seconds * 1000);
                        } else {
                          // String date
                          blackoutDate = new Date(blackoutItem.date);
                        }
                      } else if (blackoutItem instanceof Date) {
                        blackoutDate = blackoutItem;
                      } else if (blackoutItem?.seconds) {
                        // Direct Firestore timestamp
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
                      console.error('Error checking blackout date:', error, blackoutItem);
                      return false;
                    }
                  });
                }
                
                return false;
              }}
            />
            </div>
            
            {/* Show blocked dates info */}
            {amenity.rules?.blackoutDates && amenity.rules.blackoutDates.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg"
              >
                <div className="flex items-center gap-2 mb-2">
                  <Info className="w-4 h-4 text-red-600 dark:text-red-400" />
                  <span className="text-sm font-medium text-red-800 dark:text-red-200">
                    Blocked Dates
                  </span>
                </div>
                <div className="text-xs text-red-700 dark:text-red-300">
                  Some dates are unavailable due to festive seasons or maintenance.
                  {amenity.rules.blackoutDates.length <= 5 && (
                    <div className="mt-1 flex flex-wrap gap-1">
                      {amenity.rules.blackoutDates.map((blackoutItem: any, index: number) => {
                        let displayDate = '';
                        let reason = '';
                        
                        try {
                          // Handle different date formats
                          if (blackoutItem?.date) {
                            if (blackoutItem.date instanceof Date) {
                              displayDate = blackoutItem.date.toLocaleDateString();
                            } else if (blackoutItem.date.seconds) {
                              displayDate = new Date(blackoutItem.date.seconds * 1000).toLocaleDateString();
                            } else {
                              displayDate = new Date(blackoutItem.date).toLocaleDateString();
                            }
                            reason = blackoutItem.reason || 'Blocked';
                          } else if (blackoutItem instanceof Date) {
                            displayDate = blackoutItem.toLocaleDateString();
                            reason = 'Blocked';
                          } else if (blackoutItem?.seconds) {
                            displayDate = new Date(blackoutItem.seconds * 1000).toLocaleDateString();
                            reason = 'Blocked';
                          } else if (typeof blackoutItem === 'string') {
                            displayDate = new Date(blackoutItem).toLocaleDateString();
                            reason = 'Blocked';
                          } else {
                            displayDate = 'Invalid Date';
                            reason = 'Blocked';
                          }
                        } catch (error) {
                          displayDate = 'Invalid Date';
                          reason = 'Blocked';
                        }
                        
                        return (
                          <span
                            key={index}
                            title={reason}
                            className="inline-block px-2 py-1 bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-200 rounded-full"
                          >
                            {displayDate}
                          </span>
                        );
                      })}
                    </div>
                  )}
                </div>
              </motion.div>
            )}
            
            {selectedDate && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mt-6"
              >
                <h3 className="font-semibold mb-4 text-sm sm:text-base">Available Time Slots</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                  {timeSlots.map((slot) => {
                    const booked = isSlotBooked(slot);
                    return (
                      <Button
                        key={slot}
                        variant={booked ? 'secondary' : 'outline'}
                        disabled={booked}
                        className={`text-xs sm:text-sm py-2 sm:py-3 ${
                          selectedSlot === slot
                            ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white'
                            : ''
                        } ${booked ? 'opacity-50 cursor-not-allowed' : ''}`}
                        onClick={() => !booked && setSelectedSlot(slot)}
                      >
                        <span className="flex items-center justify-center gap-1 sm:gap-2 w-full">
                          <Clock className="w-3 h-3 sm:w-4 sm:h-4" />
                          {slot}
                          {booked && <Badge className="ml-1 sm:ml-2 text-xs">Booked</Badge>}
                        </span>
                      </Button>
                    );
                  })}
                </div>
                
                {selectedSlot && (
                  <Dialog open={showBookingModal} onOpenChange={setShowBookingModal}>
                    <DialogTrigger asChild>
                      <Button className="w-full mt-4 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white text-sm sm:text-base py-2 sm:py-3">
                        Book {selectedSlot}
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-[95vw] sm:max-w-md">
                      <DialogHeader>
                        <DialogTitle className="text-base sm:text-lg">Confirm Booking</DialogTitle>
                        <DialogDescription className="text-sm">
                          {amenity.name} on {selectedDate.toLocaleDateString()} at {selectedSlot}
                        </DialogDescription>
                      </DialogHeader>
                      
                      <div className="space-y-4">
                        <div>
                          <Label className="text-sm">Attendees (including yourself)</Label>
                          {attendees.map((attendee, index) => (
                            <div key={index} className="flex items-center space-x-2 mt-2">
                              <Input
                                placeholder={index === 0 ? "Your name" : "Attendee name"}
                                value={attendee}
                                onChange={(e) => updateAttendee(index, e.target.value)}
                                className="text-sm"
                              />
                              {index > 0 && (
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => removeAttendee(index)}
                                >
                                  Remove
                                </Button>
                              )}
                            </div>
                          ))}
                          {attendees.length < amenity.rules.maxSlotsPerFamily && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={addAttendee}
                              className="mt-2"
                            >
                              Add Attendee
                            </Button>
                          )}
                        </div>
                        
                        <div className="flex items-center space-x-2 p-4 bg-blue-50 dark:bg-blue-950/50 rounded-lg">
                          <Info className="w-5 h-5 text-blue-500" />
                          <div className="text-sm text-blue-700 dark:text-blue-300">
                            <p className="font-medium">Booking Rules:</p>
                            <p>• Maximum {amenity.rules.maxSlotsPerFamily} people per booking</p>
                            <p>• Bookings can be cancelled up to 24 hours in advance</p>
                          </div>
                        </div>
                        
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            onClick={() => setShowBookingModal(false)}
                            className="flex-1"
                            disabled={isBooking}
                          >
                            Cancel
                          </Button>
                          <Button
                            onClick={handleBooking}
                            disabled={isBooking}
                            className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {isBooking ? (
                              <span className="flex items-center justify-center">
                                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
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
              </motion.div>
            )}
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
}