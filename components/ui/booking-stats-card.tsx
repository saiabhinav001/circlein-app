'use client';

import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Calendar, Clock, Star, TrendingUp, Activity } from 'lucide-react';
import useBookingStats from '@/hooks/use-booking-stats';
import Link from 'next/link';

interface BookingStatsCardProps {
  compact?: boolean;
  showRecentActivity?: boolean;
}

export default function BookingStatsCard({ 
  compact = false, 
  showRecentActivity = true 
}: BookingStatsCardProps) {
  const bookingStats = useBookingStats();

  if (compact) {
    return (
      <Card className="w-full">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Quick Stats
          </CardTitle>
        </CardHeader>
        <CardContent>
          {bookingStats.loading ? (
            <div className="flex gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex-1 text-center space-y-1">
                  <Skeleton className="h-6 w-8 mx-auto" />
                  <Skeleton className="h-3 w-12 mx-auto" />
                </div>
              ))}
            </div>
          ) : (
            <div className="flex gap-4 text-center">
              <div className="flex-1">
                <div className="text-2xl font-bold text-blue-600">{bookingStats.totalBookings}</div>
                <div className="text-xs text-gray-500">Total</div>
              </div>
              <div className="flex-1">
                <div className="text-2xl font-bold text-green-600">{bookingStats.activeBookings}</div>
                <div className="text-xs text-gray-500">Active</div>
              </div>
              <div className="flex-1">
                <div className="text-2xl font-bold text-purple-600">{bookingStats.favoriteAmenities}</div>
                <div className="text-xs text-gray-500">Favorites</div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Booking Statistics
        </CardTitle>
        <CardDescription>
          Real-time overview of your booking activity
        </CardDescription>
      </CardHeader>
      <CardContent>
        {bookingStats.loading ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="text-center space-y-2 p-4 border rounded-lg">
                  <Skeleton className="h-8 w-16 mx-auto" />
                  <Skeleton className="h-4 w-20 mx-auto" />
                </div>
              ))}
            </div>
            {showRecentActivity && (
              <div className="space-y-2">
                <Skeleton className="h-4 w-32" />
                {[1, 2].map((i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            )}
          </div>
        ) : bookingStats.error ? (
          <div className="text-center py-8">
            <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">{bookingStats.error}</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <motion.div 
                className="text-center space-y-2 p-4 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg border border-blue-200 dark:border-blue-800"
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.2 }}
              >
                <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                  {bookingStats.totalBookings}
                </div>
                <div className="text-sm font-medium text-blue-700 dark:text-blue-300 flex items-center justify-center gap-1">
                  <Calendar className="h-4 w-4" />
                  Total Bookings
                </div>
              </motion.div>
              
              <motion.div 
                className="text-center space-y-2 p-4 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-lg border border-green-200 dark:border-green-800"
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.2 }}
              >
                <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                  {bookingStats.activeBookings}
                </div>
                <div className="text-sm font-medium text-green-700 dark:text-green-300 flex items-center justify-center gap-1">
                  <Clock className="h-4 w-4" />
                  Active Bookings
                </div>
              </motion.div>
              
              <motion.div 
                className="text-center space-y-2 p-4 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-lg border border-purple-200 dark:border-purple-800"
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.2 }}
              >
                <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                  {bookingStats.favoriteAmenities}
                </div>
                <div className="text-sm font-medium text-purple-700 dark:text-purple-300 flex items-center justify-center gap-1">
                  <Star className="h-4 w-4" />
                  Favorite Amenities
                </div>
              </motion.div>
            </div>

            {/* Most Booked Amenity */}
            {bookingStats.mostBookedAmenity && (
              <motion.div 
                className="p-4 bg-gradient-to-r from-orange-50 to-yellow-50 dark:from-orange-900/20 dark:to-yellow-900/20 rounded-lg border border-orange-200 dark:border-orange-800"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold text-orange-900 dark:text-orange-100">
                      Most Booked Amenity
                    </h4>
                    <p className="text-orange-700 dark:text-orange-300">
                      {bookingStats.mostBookedAmenity}
                    </p>
                  </div>
                  <Star className="h-8 w-8 text-orange-500" />
                </div>
              </motion.div>
            )}

            {/* Recent Activity */}
            {showRecentActivity && bookingStats.recentBookings.length > 0 && (
              <motion.div 
                className="space-y-3"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <h4 className="font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Recent Activity
                </h4>
                <div className="space-y-2">
                  {bookingStats.recentBookings.slice(0, 3).map((booking, index) => (
                    <div key={booking.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border">
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${
                          booking.status === 'confirmed' ? 'bg-green-500' :
                          booking.status === 'pending' ? 'bg-yellow-500' :
                          'bg-red-500'
                        }`} />
                        <div>
                          <p className="font-medium text-sm text-gray-900 dark:text-gray-100">
                            {booking.amenityName || booking.amenity || 'Unknown Amenity'}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {booking.date} • {booking.timeSlot}
                          </p>
                        </div>
                      </div>
                      <Badge 
                        variant={booking.status === 'confirmed' ? 'default' : booking.status === 'pending' ? 'secondary' : 'destructive'}
                        className="text-xs"
                      >
                        {booking.status}
                      </Badge>
                    </div>
                  ))}
                </div>
                {bookingStats.recentBookings.length > 3 && (
                  <Link href="/bookings">
                    <Button variant="outline" size="sm" className="w-full">
                      View All Bookings ({bookingStats.totalBookings})
                    </Button>
                  </Link>
                )}
              </motion.div>
            )}

            {/* Empty State */}
            {bookingStats.totalBookings === 0 && (
              <motion.div 
                className="text-center py-8"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                <Calendar className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                  No bookings yet
                </h3>
                <p className="text-gray-500 dark:text-gray-400 mb-4">
                  Start exploring and booking amenities to see your statistics here
                </p>
                <Link href="/amenity">
                  <Button className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700">
                    Explore Amenities
                  </Button>
                </Link>
              </motion.div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}