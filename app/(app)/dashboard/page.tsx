'use client';

// Disable static generation for this page
export const dynamic = 'force-dynamic';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar, 
  Clock, 
  Users, 
  Ban, 
  AlertTriangle, 
  ArrowRight,
  Sparkles,
  Building2,
  Settings,
  ChevronRight,
  Search as SearchIcon
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { useSessionProvision } from '@/hooks/use-user-creation';
import { useSearch } from '@/components/providers/search-provider';
import { useCommunityTimeFormat, useCommunityTimeZone } from '@/components/providers/community-branding-provider';
import { formatDateInTimeZone, formatTimeInTimeZone } from '@/lib/timezone';
import { cn } from '@/lib/utils';
import { SmartSuggestionsCard } from '@/components/booking/smart-suggestions-card';
import { WeatherWidget } from '@/components/dashboard/widgets/weather-widget';
import { QuickBookingWidget } from '@/components/dashboard/widgets/quick-booking-widget';
import { CommunityPulseWidget } from '@/components/dashboard/widgets/community-pulse-widget';
import { StreakWidget } from '@/components/dashboard/widgets/streak-widget';

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

interface UpcomingBooking {
  id: string;
  amenityName?: string;
  startTime: Date;
  endTime: Date;
  status?: string;
  userEmail?: string;
  userName?: string;
}

// Premium animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16, scale: 0.98 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: "spring" as const,
      stiffness: 400,
      damping: 30,
    },
  },
};

const cardHoverVariants = {
  rest: { scale: 1, y: 0 },
  hover: { 
    scale: 1.01, 
    y: -2,
    transition: { 
      type: "spring" as const, 
      stiffness: 400, 
      damping: 25 
    }
  },
  tap: { scale: 0.99 }
};

// Premium Skeleton Loader
function SkeletonCard() {
  return (
    <div className="group relative bg-white dark:bg-slate-900/80 rounded-2xl border border-slate-200 dark:border-slate-800/60 overflow-hidden shadow-sm">
      {/* Shimmer effect */}
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-slate-200/60 dark:via-slate-800/50 to-transparent" />
      
      {/* Image skeleton */}
      <div className="relative h-44 bg-slate-100 dark:bg-slate-800/80">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-200/40 dark:from-slate-700/50 to-transparent" />
      </div>
      
      {/* Content skeleton */}
      <div className="p-5 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="h-6 bg-slate-200 dark:bg-slate-700/80 rounded-lg w-3/4" />
          <div className="h-6 bg-slate-200 dark:bg-slate-700/80 rounded-full w-16" />
        </div>
        <div className="space-y-2">
          <div className="h-4 bg-slate-100 dark:bg-slate-800/60 rounded w-full" />
          <div className="h-4 bg-slate-100 dark:bg-slate-800/60 rounded w-2/3" />
        </div>
        <div className="flex items-center justify-between pt-2">
          <div className="flex gap-4">
            <div className="h-4 bg-slate-100 dark:bg-slate-800/60 rounded w-16" />
            <div className="h-4 bg-slate-100 dark:bg-slate-800/60 rounded w-16" />
          </div>
        </div>
        <div className="h-11 bg-slate-100 dark:bg-slate-800/60 rounded-xl w-full mt-4" />
      </div>
    </div>
  );
}

// Premium Amenity Card Component
function AmenityCard({ amenity, index }: { amenity: Amenity; index: number }) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div
      variants={itemVariants}
      initial="rest"
      whileHover="hover"
      whileTap="tap"
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
    >
      <Link href={`/amenity/${amenity.id}`} className="block h-full">
        <motion.div 
          variants={cardHoverVariants}
          className={cn(
            "group relative h-full bg-white dark:bg-slate-900/80 rounded-2xl overflow-hidden",
            "border border-slate-200 dark:border-slate-800/60",
            "shadow-sm hover:shadow-lg hover:shadow-slate-200/60 dark:hover:shadow-slate-900/50",
            "transition-shadow duration-300",
            amenity.isBlocked && "opacity-75"
          )}
        >
          {/* Image Container */}
          <div className="relative h-36 sm:h-44 overflow-hidden bg-slate-100 dark:bg-slate-800">
            {/* Placeholder gradient while loading */}
            <div className={cn(
              "absolute inset-0 bg-gradient-to-br from-slate-200 via-slate-100 to-slate-200 dark:from-slate-800 dark:via-slate-700 dark:to-slate-800",
              "transition-opacity duration-500",
              imageLoaded ? "opacity-0" : "opacity-100"
            )} />
            
            <img
              src={amenity.imageUrl || 'https://images.pexels.com/photos/296282/pexels-photo-296282.jpeg?auto=compress&cs=tinysrgb&w=600'}
              alt={amenity.name}
              className={cn(
                "w-full h-full object-cover transition-all duration-700",
                "group-hover:scale-105",
                imageLoaded ? "opacity-100" : "opacity-0"
              )}
              loading="lazy"
              onLoad={() => setImageLoaded(true)}
            />
            
            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            
            {/* Status Badge */}
            <div className="absolute top-3 right-3">
              <AnimatePresence>
                {amenity.isBlocked ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                  >
                    <Badge className="bg-red-500/90 text-white border-0 shadow-lg backdrop-blur-sm px-2.5 py-1 text-xs font-medium">
                      <Ban className="w-3 h-3 mr-1" />
                      Blocked
                    </Badge>
                  </motion.div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                  >
                    <Badge className="bg-emerald-500/90 text-white border-0 shadow-lg backdrop-blur-sm px-2.5 py-1 text-xs font-medium">
                      <Sparkles className="w-3 h-3 mr-1" />
                      Available
                    </Badge>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Quick action on hover */}
            <motion.div 
              className="absolute bottom-3 left-3 right-3"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: isHovered ? 1 : 0, y: isHovered ? 0 : 10 }}
              transition={{ duration: 0.2 }}
            >
              <div className="flex items-center gap-2 text-white text-sm font-medium">
                <span>View Details</span>
                <ChevronRight className="w-4 h-4" />
              </div>
            </motion.div>
          </div>

          {/* Content */}
          <div className="p-4 sm:p-5">
            {/* Title & Description */}
            <div className="mb-3 sm:mb-4">
              <h3 className="text-base sm:text-lg font-semibold text-slate-900 dark:text-white mb-1 sm:mb-1.5 line-clamp-1 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors duration-300">
                {amenity.name}
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
                {amenity.description}
              </p>
            </div>

            {/* Block Reason */}
            {amenity.isBlocked && amenity.blockReason && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mb-4 p-3 bg-red-50 dark:bg-red-950/30 rounded-xl border border-red-100 dark:border-red-900/50"
              >
                <div className="flex items-start gap-2 text-sm text-red-700 dark:text-red-300">
                  <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                  <span className="line-clamp-2">{amenity.blockReason}</span>
                </div>
              </motion.div>
            )}

            {/* Meta Info */}
            <div className="flex items-center gap-3 sm:gap-4 mb-3 sm:mb-4 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              <div className="flex items-center gap-1 sm:gap-1.5">
                <div className="p-1 rounded-md bg-slate-100 dark:bg-slate-800">
                  <Users className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                </div>
                <span>Max {amenity.booking?.maxPeople || amenity.rules?.maxSlotsPerFamily || 2}</span>
              </div>
              <div className="flex items-center gap-1 sm:gap-1.5">
                <div className="p-1 rounded-md bg-slate-100 dark:bg-slate-800">
                  <Clock className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                </div>
                <span>{amenity.booking?.slotDuration || 2}h slots</span>
              </div>
            </div>

            {/* CTA Button */}
            <Button 
              className={cn(
                "w-full h-10 sm:h-11 rounded-xl font-medium text-xs sm:text-sm transition-all duration-300",
                amenity.isBlocked 
                  ? "bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed" 
                  : "bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 shadow-sm hover:shadow-md"
              )}
              disabled={amenity.isBlocked}
            >
              {amenity.isBlocked ? (
                <>
                  <Ban className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
                  <span className="hidden xs:inline">Currently </span>Unavailable
                </>
              ) : (
                <>
                  <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
                  Book Now
                  <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 ml-1.5 sm:ml-2 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </Button>
          </div>
        </motion.div>
      </Link>
    </motion.div>
  );
}

// Empty State Component
function EmptyState({ 
  title, 
  description, 
  action 
}: { 
  title: string; 
  description: string; 
  action?: React.ReactNode 
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-16 px-6"
    >
      <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-6">
        <Building2 className="w-8 h-8 text-slate-400 dark:text-slate-500" />
      </div>
      <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2 text-center">
        {title}
      </h3>
      <p className="text-sm text-slate-500 dark:text-slate-400 text-center max-w-sm mb-6">
        {description}
      </p>
      {action}
    </motion.div>
  );
}

export default function Dashboard() {
  const [amenities, setAmenities] = useState<Amenity[]>([]);
  const [upcomingBookings, setUpcomingBookings] = useState<UpcomingBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const { session, status } = useSessionProvision();
  const router = useRouter();
  const { searchQuery, setSearchQuery } = useSearch();
  const timeZone = useCommunityTimeZone();
  const timeFormat = useCommunityTimeFormat();
  const communityId = (session?.user as any)?.communityId as string | undefined;
  const isAdmin = session?.user?.role === 'admin' || session?.user?.role === 'super_admin';
  const userName = session?.user?.name?.split(' ')[0] || 'there';

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  }, []);

  // Filter amenities based on search query
  const filteredAmenities = useMemo(() => {
    if (!searchQuery.trim()) {
      return amenities;
    }
    
    return amenities.filter((amenity: Amenity) =>
      amenity.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      amenity.description.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [amenities, searchQuery]);

  const availableAmenitiesCount = useMemo(() => amenities.filter((amenity) => !amenity.isBlocked).length, [amenities]);
  const blockedAmenitiesCount = useMemo(() => amenities.filter((amenity) => amenity.isBlocked).length, [amenities]);

  const communityPulse = useMemo(() => {
    const blocked = blockedAmenitiesCount;
    const active = availableAmenitiesCount;
    const upcoming = upcomingBookings.length;

    return [
      { label: 'Available Amenities', value: active, caption: 'Ready to book now' },
      {
        label: isAdmin ? 'Upcoming Reservations' : 'Your Upcoming Bookings',
        value: upcoming,
        caption: isAdmin ? 'Scheduled in your community' : 'Scheduled for your account',
      },
      { label: 'Temporarily Blocked', value: blocked, caption: blocked > 0 ? 'Under maintenance or paused' : 'All spaces operational' },
    ];
  }, [availableAmenitiesCount, blockedAmenitiesCount, isAdmin, upcomingBookings.length]);

  const quickActions = useMemo(() => {
    if (isAdmin) {
      return [
        { href: '/calendar', label: 'Open Calendar', icon: Calendar },
        { href: '/bookings', label: 'Manage Bookings', icon: Clock },
        { href: '/admin/analytics', label: 'View Analytics', icon: Sparkles },
        { href: '/admin/settings', label: 'Update Community Setup', icon: Building2 },
      ];
    }

    return [
      { href: '/calendar', label: 'Open Calendar', icon: Calendar },
      { href: '/bookings', label: 'Manage Bookings', icon: Clock },
      { href: '/community', label: 'Community Updates', icon: Users },
      { href: '/settings', label: 'Account Settings', icon: Settings },
    ];
  }, [isAdmin]);

  // Check if admin needs onboarding
  useEffect(() => {
    const checkOnboarding = async () => {
      if (status === 'loading') return;
      
      const urlParams = new URLSearchParams(window.location.search);
      const fromOnboarding = urlParams.get('from') === 'onboarding' || 
                           sessionStorage.getItem('onboarding-completed') === 'true';
      
      if (fromOnboarding) {
        sessionStorage.removeItem('onboarding-completed');
        return;
      }
      
      if (session?.user?.role === 'admin' && session.user.communityId) {
        try {
          const amenitiesQuery = query(
            collection(db, 'amenities'),
            where('communityId', '==', session.user.communityId)
          );
          const amenitiesSnapshot = await getDocs(amenitiesQuery);
          
          if (amenitiesSnapshot.size === 0) {
            router.push('/admin/onboarding');
            return;
          }
        } catch (error) {
          console.error('Error checking onboarding status:', error);
        }
      }
    };

    checkOnboarding();
  }, [session, status, router]);

  useEffect(() => {
    if (session?.user?.communityId) {
      fetchDashboardData();
    }
  }, [session]);

  const fetchDashboardData = async () => {
    setLoading(true);
    await Promise.all([fetchAmenities(), fetchUpcomingBookings()]);
    setLoading(false);
  };

  const fetchAmenities = async () => {
    try {
      if (!session?.user?.communityId) {
        console.error('No community ID found in session');
        return;
      }

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
    }
  };

  const fetchUpcomingBookings = async () => {
    try {
      if (!session?.user?.communityId) {
        return;
      }

      const bookingsQuery = query(
        collection(db, 'bookings'),
        where('communityId', '==', session.user.communityId)
      );

      const bookingsSnapshot = await getDocs(bookingsQuery);
      const now = new Date();

      const upcoming = bookingsSnapshot.docs
        .map((doc) => ({ id: doc.id, ...doc.data() }))
        .map((booking: any) => ({
          id: booking.id,
          amenityName: booking.amenityName,
          startTime: booking.startTime?.toDate ? booking.startTime.toDate() : new Date(booking.startTime),
          endTime: booking.endTime?.toDate ? booking.endTime.toDate() : new Date(booking.endTime),
          status: booking.status,
          userId: booking.userId,
          userEmail: booking.userEmail,
          userName: booking.userName,
        }))
        .filter((booking) => {
          if (isAdmin) {
            return true;
          }

          const bookingUserId = String((booking as any).userId || '');
          const bookingUserEmail = String(booking.userEmail || '');
          const sessionEmail = String(session?.user?.email || '');
          return bookingUserId === sessionEmail || bookingUserEmail === sessionEmail;
        })
        .filter((booking) => booking.startTime && !Number.isNaN(booking.startTime.getTime()))
        .filter((booking) => booking.startTime >= now)
        .sort((a, b) => a.startTime.getTime() - b.startTime.getTime())
        .slice(0, 4);

      setUpcomingBookings(upcoming);
    } catch (error) {
      console.error('Error fetching upcoming bookings:', error);
      setUpcomingBookings([]);
    }
  };

  // Loading State
  if (loading) {
    return (
      <div className="min-h-full bg-gradient-to-br from-slate-50 via-white to-slate-100/50 dark:from-slate-950 dark:via-slate-950 dark:to-slate-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header Skeleton */}
          <div className="mb-10">
            <div className="h-10 bg-slate-200 dark:bg-slate-800 rounded-xl w-72 mb-3" />
            <div className="h-5 bg-slate-100 dark:bg-slate-800/60 rounded-lg w-96" />
          </div>
          
          {/* Grid Skeleton */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-gradient-to-br from-slate-50 via-white to-slate-100/50 dark:from-slate-950 dark:via-slate-950 dark:to-slate-900/50">
      {/* Subtle background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/20 via-transparent to-teal-50/15 dark:from-emerald-950/20 dark:via-transparent dark:to-slate-950/10 pointer-events-none" />
      
      <div className="relative max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 md:py-8">
        {/* Header Section */}
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="mb-6 sm:mb-10"
        >
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 sm:gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-900 dark:text-white tracking-tight mb-1 sm:mb-2">
                {greeting}, {userName}
              </h1>
              <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 max-w-xl">
                Your operations dashboard is ready. Book shared spaces, monitor activity, and jump into key workflows.
              </p>
            </div>
            
            {/* Stats Badge */}
            {amenities.length > 0 && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
                className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-900/80 rounded-full border border-slate-200 dark:border-slate-800/60 shadow-sm"
              >
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  {availableAmenitiesCount} available
                </span>
              </motion.div>
            )}
          </div>
        </motion.div>

        <div className="grid gap-4 lg:grid-cols-3 mb-6">
          <section
            className={cn(
              'rounded-2xl border border-slate-200/90 dark:border-slate-800/70 bg-white/80 dark:bg-slate-900/70 p-5 sm:p-6 shadow-sm',
              isAdmin ? 'lg:col-span-2' : 'lg:col-span-3'
            )}
          >
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700 dark:text-emerald-300">Welcome</p>
            <h2 className="mt-2 text-xl sm:text-2xl font-semibold text-slate-900 dark:text-white">What do you want to do next?</h2>
            <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-400">Choose a quick action to keep community operations moving.</p>

            <div className="mt-5 grid gap-2 sm:grid-cols-2">
              {quickActions.map((action) => {
                const Icon = action.icon;
                return (
                  <Link
                    key={action.href}
                    href={action.href}
                    className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-800/40 px-4 py-3 hover:border-emerald-300 dark:hover:border-emerald-700 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <Icon className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        <span className="text-sm font-medium text-slate-800 dark:text-slate-200">{action.label}</span>
                      </div>
                      <ArrowRight className="w-4 h-4 text-slate-400" />
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>

          {isAdmin && (
            <section className="rounded-2xl border border-slate-200/90 dark:border-slate-800/70 bg-white/80 dark:bg-slate-900/70 p-5 sm:p-6 shadow-sm">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Community Pulse</h3>
              <div className="mt-4 space-y-3">
                {communityPulse.map((item) => (
                  <div key={item.label} className="rounded-xl border border-slate-200/80 dark:border-slate-700/80 bg-slate-50/70 dark:bg-slate-800/40 px-3 py-2.5">
                    <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">{item.label}</p>
                    <p className="mt-1 text-xl font-semibold text-slate-900 dark:text-white">{item.value}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{item.caption}</p>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        <section className="mb-6 rounded-2xl border border-slate-200/90 dark:border-slate-800/70 bg-white/80 dark:bg-slate-900/70 p-5 sm:p-6 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">{isAdmin ? 'Upcoming Bookings' : 'Your Upcoming Bookings'}</h3>
            <Link href="/bookings" className="text-xs font-medium text-emerald-700 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-300 inline-flex items-center gap-1">
              View all <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4" aria-live="polite">
            {upcomingBookings.length > 0 ? (
              upcomingBookings.map((booking) => (
                <div key={booking.id} className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/40 px-3 py-3">
                  <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{booking.amenityName || 'Amenity booking'}</p>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    {formatDateInTimeZone(booking.startTime, timeZone, { day: '2-digit', month: '2-digit', year: 'numeric' })}
                    {' '}•{' '}
                    {formatTimeInTimeZone(booking.startTime, timeZone, { hour12: timeFormat !== '24h' })}
                  </p>
                  <Badge className="mt-2 bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400 border-0">
                    {(booking.status || 'confirmed').replace('_', ' ')}
                  </Badge>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-500 dark:text-slate-400 sm:col-span-2 lg:col-span-4">No upcoming bookings scheduled yet.</p>
            )}
          </div>
        </section>

        {!isAdmin && (
          <section className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <WeatherWidget />
            <QuickBookingWidget />
            <CommunityPulseWidget
              availableAmenities={availableAmenitiesCount}
              blockedAmenities={blockedAmenitiesCount}
              upcomingBookings={upcomingBookings.length}
            />
            <StreakWidget
              userEmail={session?.user?.email}
              communityId={communityId}
            />
          </section>
        )}

        {/* Search Results Indicator */}
        <AnimatePresence>
          {searchQuery.trim() && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-6"
            >
              <div role="status" aria-live="polite" className="flex items-center gap-3 px-4 py-3 bg-teal-50 dark:bg-teal-950/20 rounded-xl border border-teal-100 dark:border-teal-900/40">
                <SearchIcon className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                <span className="text-sm text-teal-700 dark:text-teal-300">
                  {filteredAmenities.length} result{filteredAmenities.length !== 1 ? 's' : ''} for "{searchQuery}"
                </span>
                <button 
                  onClick={() => setSearchQuery('')}
                  className="ml-auto text-sm text-teal-600 dark:text-teal-400 hover:text-teal-800 dark:hover:text-teal-200 font-medium"
                >
                  Clear
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* AI Suggestions */}
        <SmartSuggestionsCard />

        {/* Empty States */}
        {amenities.length === 0 && !loading && (
          <EmptyState
            title="No amenities found"
            description="If you just completed onboarding, try refreshing the page. Your amenities will appear here once they're set up."
            action={
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  onClick={() => {
                    fetchDashboardData();
                  }}
                  variant="outline"
                  className="h-10 px-5 rounded-xl"
                >
                  Retry Loading
                </Button>
              </div>
            }
          />
        )}

        {amenities.length > 0 && filteredAmenities.length === 0 && searchQuery.trim() && (
          <EmptyState
            title="No matching amenities"
            description={`We couldn't find any amenities matching "${searchQuery}". Try adjusting your search terms.`}
            action={
              <Button
                onClick={() => setSearchQuery('')}
                variant="outline"
                className="h-10 px-5 rounded-xl"
              >
                Clear Search
              </Button>
            }
          />
        )}

        {/* Amenities Grid */}
        {filteredAmenities.length > 0 && (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6"
          >
            {filteredAmenities.map((amenity, index) => (
              <AmenityCard key={amenity.id} amenity={amenity} index={index} />
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
}