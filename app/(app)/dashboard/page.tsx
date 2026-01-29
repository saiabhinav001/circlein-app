'use client';

// Disable static generation for this page
export const dynamic = 'force-dynamic';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { collection, getDocs, query, orderBy, where } from 'firebase/firestore';
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
  ChevronRight,
  Search as SearchIcon
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { useUserCreation } from '@/hooks/useUserCreation';
import { useSearch } from '@/components/providers/search-provider';
import { cn } from '@/lib/utils';

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
              <h3 className="text-base sm:text-lg font-semibold text-slate-900 dark:text-white mb-1 sm:mb-1.5 line-clamp-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-300">
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
  const [loading, setLoading] = useState(true);
  const { session, status } = useUserCreation();
  const router = useRouter();
  const { searchQuery, setSearchQuery } = useSearch();

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
      fetchAmenities();
    }
  }, [session]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && session?.user?.communityId) {
        fetchAmenities();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [session]);

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
    } finally {
      setLoading(false);
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
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50/20 via-transparent to-indigo-50/15 dark:from-blue-950/20 dark:via-transparent dark:to-purple-950/10 pointer-events-none" />
      
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
                Community Amenities
              </h1>
              <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 max-w-xl">
                Discover and book shared spaces in your community. Select an amenity to view availability and make a reservation.
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
                  {amenities.filter(a => !a.isBlocked).length} available
                </span>
              </motion.div>
            )}
          </div>
        </motion.div>

        {/* Search Results Indicator */}
        <AnimatePresence>
          {searchQuery.trim() && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-6"
            >
              <div className="flex items-center gap-3 px-4 py-3 bg-blue-50 dark:bg-blue-950/30 rounded-xl border border-blue-100 dark:border-blue-900/50">
                <SearchIcon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span className="text-sm text-blue-700 dark:text-blue-300">
                  {filteredAmenities.length} result{filteredAmenities.length !== 1 ? 's' : ''} for "{searchQuery}"
                </span>
                <button 
                  onClick={() => {
                    const searchInput = document.querySelector('input[placeholder="Search..."]') as HTMLInputElement;
                    if (searchInput) {
                      searchInput.value = '';
                      searchInput.dispatchEvent(new Event('input', { bubbles: true }));
                    }
                  }}
                  className="ml-auto text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200 font-medium"
                >
                  Clear
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Empty States */}
        {amenities.length === 0 && !loading && (
          <EmptyState
            title="No amenities found"
            description="If you just completed onboarding, try refreshing the page. Your amenities will appear here once they're set up."
            action={
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  onClick={() => {
                    setLoading(true);
                    fetchAmenities();
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