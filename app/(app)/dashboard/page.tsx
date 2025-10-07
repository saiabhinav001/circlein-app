'use client';

// Disable static generation for this page
export const dynamic = 'force-dynamic';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { collection, getDocs, query, orderBy, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { motion } from 'framer-motion';
import { Calendar, Clock, Users, Ban, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { useUserCreation } from '@/hooks/use-user-creation';
import { useSearch } from '@/components/providers/search-provider';

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

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
    },
  },
};

export default function Dashboard() {
  const [amenities, setAmenities] = useState<Amenity[]>([]);
  const [loading, setLoading] = useState(true);
  const { session, status } = useUserCreation(); // This will handle user creation
  const router = useRouter();
  const { searchQuery } = useSearch();

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
      
      // Only check for onboarding if we're coming from a fresh session
      // Don't redirect if we just came from onboarding (check URL params or local storage)
      const urlParams = new URLSearchParams(window.location.search);
      const fromOnboarding = urlParams.get('from') === 'onboarding' || 
                           sessionStorage.getItem('onboarding-completed') === 'true';
      
      if (fromOnboarding) {
        // Clear the flag and don't redirect
        sessionStorage.removeItem('onboarding-completed');
        return;
      }
      
      if (session?.user?.role === 'admin' && session.user.communityId) {
        try {
          // Check if community has any amenities
          const amenitiesQuery = query(
            collection(db, 'amenities'),
            where('communityId', '==', session.user.communityId)
          );
          const amenitiesSnapshot = await getDocs(amenitiesQuery);
          
          // If no amenities exist, redirect to onboarding
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

  // Add a page visibility listener to refetch data when returning to the page
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && session?.user?.communityId) {
        console.log('Page became visible, refreshing amenities...');
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

      console.log('Fetching amenities for community:', session.user.communityId);

      // Remove orderBy to avoid index requirement - we'll sort in JavaScript instead
      const q = query(
        collection(db, 'amenities'), 
        where('communityId', '==', session.user.communityId)
      );
      
      console.log('Executing Firestore query...');
      const querySnapshot = await getDocs(q);
      
      console.log('Amenities query result:', {
        size: querySnapshot.size,
        docs: querySnapshot.docs.length,
        empty: querySnapshot.empty
      });
      
      const amenityList = querySnapshot.docs.map(doc => {
        const data = doc.data();
        console.log('Processing amenity document:', { id: doc.id, data });
        return {
          id: doc.id,
          ...data,
        };
      }) as Amenity[];
      
      // Sort by name in JavaScript instead of Firestore
      amenityList.sort((a, b) => a.name.localeCompare(b.name));
      
      console.log('Final processed amenities:', amenityList);
      setAmenities(amenityList);
    } catch (error) {
      console.error('Error fetching amenities:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-3 sm:p-4 md:p-6 lg:p-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 md:gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <div className="h-40 sm:h-48 bg-slate-200 dark:bg-slate-700 rounded-t-lg"></div>
              <CardHeader>
                <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-full"></div>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="p-3 sm:p-4 md:p-6 lg:p-8"
    >
      <motion.div variants={itemVariants} className="mb-6 sm:mb-8">
        <div className="flex flex-col gap-3 mb-4">
          <div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 bg-clip-text text-transparent mb-1 sm:mb-2">
              Welcome to CircleIn
            </h1>
            <p className="text-slate-600 dark:text-slate-400 text-sm sm:text-base md:text-lg">
              Discover and book community amenities with ease
            </p>
          </div>
        </div>
        
        {/* No amenities at all */}
        {amenities.length === 0 && !loading && (
          <div className="text-center py-8 px-4">
            <p className="text-slate-700 dark:text-slate-400 mb-4 text-sm sm:text-base">
              No amenities found. If you just completed onboarding, try refreshing.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                onClick={() => {
                  console.log('Retry fetch triggered');
                  setLoading(true);
                  fetchAmenities();
                }}
                variant="outline"
                className="w-full sm:w-auto"
              >
                Retry Loading Amenities
              </Button>
              <Button
                onClick={async () => {
                  console.log('Checking database directly...');
                  try {
                    const response = await fetch('/api/debug/amenities');
                    const data = await response.json();
                    console.log('Database debug results:', data);
                    alert(`Database Check Results:\n\nCommunity Amenities: ${data.counts.communityAmenities}\nTotal Amenities: ${data.counts.totalAmenities}\n\nCheck console for details.`);
                  } catch (error) {
                    console.error('Debug API error:', error);
                    alert('Error checking database. See console for details.');
                  }
                }}
                variant="outline"
                className="w-full sm:w-auto"
              >
                Debug Database
              </Button>
            </div>
          </div>
        )}

        {/* No search results */}
        {amenities.length > 0 && filteredAmenities.length === 0 && searchQuery.trim() && !loading && (
          <div className="text-center py-8 px-4">
            <p className="text-slate-700 dark:text-slate-400 mb-4 text-sm sm:text-base">
              No amenities found matching &quot;{searchQuery}&quot;. Try a different search term.
            </p>
            <Button
              onClick={() => {
                // Clear search
                const searchInput = document.querySelector('input[placeholder="Search..."]') as HTMLInputElement;
                if (searchInput) {
                  searchInput.value = '';
                  searchInput.dispatchEvent(new Event('input', { bubbles: true }));
                }
              }}
              variant="outline"
              className="w-full sm:w-auto"
            >
              Clear Search
            </Button>
          </div>
        )}
      </motion.div>

      <motion.div
        variants={containerVariants}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 md:gap-6"
      >
        {filteredAmenities.map((amenity) => (
          <motion.div key={amenity.id} variants={itemVariants}>
            <Card className="group hover:shadow-2xl hover:shadow-blue-500/10 transition-all duration-300 overflow-hidden border-0 bg-white dark:bg-slate-900 h-full flex flex-col">
              <div className="relative overflow-hidden">
                <img
                  src={amenity.imageUrl || 'https://images.pexels.com/photos/296282/pexels-photo-296282.jpeg?auto=compress&cs=tinysrgb&w=600'}
                  alt={amenity.name}
                  className="w-full h-40 sm:h-48 object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </div>
              
              <CardHeader className="pb-3 flex-grow">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <CardTitle className="text-lg sm:text-xl font-semibold group-hover:text-blue-500 transition-colors line-clamp-2">
                    {amenity.name}
                  </CardTitle>
                  <div className="flex gap-1 shrink-0">
                    {amenity.isBlocked ? (
                      <Badge variant="destructive" className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 text-xs whitespace-nowrap">
                        <Ban className="w-3 h-3 mr-1" />
                        Blocked
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 text-xs whitespace-nowrap">
                        Available
                      </Badge>
                    )}
                  </div>
                </div>
                <CardDescription className="text-slate-800 dark:text-slate-400 text-sm line-clamp-2">
                  {amenity.description}
                </CardDescription>
                {amenity.isBlocked && amenity.blockReason && (
                  <div className="mt-2 flex items-start text-xs sm:text-sm text-red-600 dark:text-red-400">
                    <AlertTriangle className="w-4 h-4 mr-1 shrink-0 mt-0.5" />
                    <span className="line-clamp-2">{amenity.blockReason}</span>
                  </div>
                )}
              </CardHeader>
              
              <CardContent className="pt-0 pb-4">
                <div className="flex items-center justify-between text-xs sm:text-sm text-slate-700 dark:text-slate-400 mb-3 sm:mb-4">
                  <div className="flex items-center">
                    <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1" />
                    <span>Max {amenity.booking?.maxPeople || amenity.rules?.maxSlotsPerFamily || 2}</span>
                  </div>
                  <div className="flex items-center">
                    <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1" />
                    <span>{amenity.booking?.slotDuration || 2}h slots</span>
                  </div>
                </div>
                
                <Link href={`/amenity/${amenity.id}`}>
                  <Button 
                    className={`w-full shadow-lg hover:shadow-xl transition-all duration-300 text-sm sm:text-base ${
                      amenity.isBlocked 
                        ? 'bg-gray-400 hover:bg-gray-500 text-white cursor-not-allowed' 
                        : 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white'
                    }`}
                    disabled={amenity.isBlocked}
                  >
                    {amenity.isBlocked ? (
                      <>
                        <Ban className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-2" />
                        Currently Blocked
                      </>
                    ) : (
                      <>
                        <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-2" />
                        Book Now
                      </>
                    )}
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>
    </motion.div>
  );
}