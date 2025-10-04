'use client';

import { useSession } from 'next-auth/react';
import { motion } from 'framer-motion';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  Globe, 
  Building, 
  Edit,
  Settings,
  Shield,
  TrendingUp,
  Activity,
  Star,
  Clock,
  Bell
} from 'lucide-react';
import Link from 'next/link';
import useBookingStats from '@/hooks/use-booking-stats';
import { toast } from 'sonner';

export default function ProfilePage() {
  const { data: session } = useSession();
  const bookingStats = useBookingStats();
  
  // Determine if user is admin
  const isAdmin = (session?.user as any)?.role === 'admin';
  const userFlatNumber = (session?.user as any)?.flatNumber;

  // Test function to create sample notifications
  const createSampleNotifications = async () => {
    try {
      const response = await fetch('/api/seed-notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        toast.success(`Created ${data.count} sample notifications! Check the notification bell.`);
      } else {
        const errorData = await response.json();
        toast.error('Failed to create notifications: ' + errorData.error);
      }
    } catch (error) {
      console.error('Error creating sample notifications:', error);
      toast.error('Failed to create sample notifications');
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="space-y-6"
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Profile</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              {isAdmin ? 'Manage your admin profile and community settings' : 'View and manage your profile information'}
            </p>
          </div>
          <Link href="/settings">
            <Button variant="outline" className="flex items-center gap-2">
              <Edit className="h-4 w-4" />
              Edit Profile
            </Button>
          </Link>
        </div>

        {/* Profile Card */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
              {/* Avatar */}
              <Avatar className="h-32 w-32">
                <AvatarImage src={session?.user?.image || ''} />
                <AvatarFallback className="text-3xl bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                  {session?.user?.name?.charAt(0) || 'U'}
                </AvatarFallback>
              </Avatar>

              {/* Basic Info */}
              <div className="flex-1 space-y-4">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {session?.user?.name || 'User Name'}
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400">
                    {isAdmin ? 'Community Administrator' : 'Community Resident'}
                    {userFlatNumber && !isAdmin && (
                      <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
                        Flat {userFlatNumber}
                      </span>
                    )}
                    {!userFlatNumber && !isAdmin && (
                      <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                        No flat number set
                      </span>
                    )}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <Shield className="h-3 w-3" />
                    Verified Account
                  </Badge>
                  {isAdmin ? (
                    <Badge variant="destructive" className="flex items-center gap-1">
                      <Shield className="h-3 w-3" />
                      Administrator
                    </Badge>
                  ) : (
                    <Badge variant="outline">Active Resident</Badge>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                    <Mail className="h-4 w-4" />
                    {session?.user?.email || 'email@example.com'}
                  </div>
                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                    <Calendar className="h-4 w-4" />
                    Member since {new Date().getFullYear()}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contact Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Contact Information
            </CardTitle>
            <CardDescription>
              Your contact details and preferences
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Email Address
                </label>
                <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <Mail className="h-4 w-4 text-gray-500" />
                  <span className="text-sm">{session?.user?.email || 'Not provided'}</span>
                </div>
              </div>

              {!isAdmin && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Flat Number
                  </label>
                  {userFlatNumber ? (
                    <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                      <Building className="h-4 w-4 text-blue-500" />
                      <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                        Flat {userFlatNumber}
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                      <Building className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        Not set - Add in settings
                      </span>
                    </div>
                  )}
                </div>
              )}

              {isAdmin && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Role
                  </label>
                  <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                    <Shield className="h-4 w-4 text-red-500" />
                    <span className="text-sm font-medium text-red-700 dark:text-red-300">
                      Community Administrator
                    </span>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Phone Number
                </label>
                <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <Phone className="h-4 w-4 text-gray-500" />
                  <span className="text-sm">Not provided</span>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Location
                </label>
                <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <MapPin className="h-4 w-4 text-gray-500" />
                  <span className="text-sm">Not provided</span>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Company
                </label>
                <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <Building className="h-4 w-4 text-gray-500" />
                  <span className="text-sm">Not provided</span>
                </div>
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Bio
              </label>
              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  No bio provided yet. Click "Edit Profile" to add information about yourself.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Activity Summary */}
        <Card>
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
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="text-center space-y-2">
                    <Skeleton className="h-8 w-16 mx-auto" />
                    <Skeleton className="h-4 w-20 mx-auto" />
                  </div>
                ))}
              </div>
            ) : bookingStats.error ? (
              <div className="text-center py-8">
                <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400 mb-4">{bookingStats.error}</p>
                <div className="space-y-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => window.location.reload()}
                    className="mr-2"
                  >
                    Retry Connection
                  </Button>
                  <details className="text-left max-w-md mx-auto">
                    <summary className="text-sm text-gray-500 cursor-pointer hover:text-gray-700">
                      Troubleshooting
                    </summary>
                    <div className="text-xs text-gray-400 mt-2 p-3 bg-gray-50 dark:bg-gray-800 rounded border space-y-1">
                      <p>• Check your internet connection</p>
                      <p>• Ensure you're properly signed in</p>
                      <p>• Contact support if the issue persists</p>
                      <p className="font-mono">Error: {bookingStats.error}</p>
                    </div>
                  </details>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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

                {/* Recent Bookings Preview */}
                {bookingStats.recentBookings.length > 0 && (
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

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>
              {isAdmin ? 'Administrative tools and settings' : 'Common tasks and settings'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Link href="/settings">
                <Button variant="outline" className="w-full flex items-center gap-2 h-12">
                  <Settings className="h-4 w-4" />
                  Account Settings
                </Button>
              </Link>
              <Link href="/bookings">
                <Button variant="outline" className="w-full flex items-center gap-2 h-12">
                  <Calendar className="h-4 w-4" />
                  {isAdmin ? 'Manage Bookings' : 'View Bookings'}
                </Button>
              </Link>
              {isAdmin && (
                <>
                  <Link href="/admin">
                    <Button variant="outline" className="w-full flex items-center gap-2 h-12">
                      <Shield className="h-4 w-4" />
                      Admin Dashboard
                    </Button>
                  </Link>
                  <Link href="/admin/users">
                    <Button variant="outline" className="w-full flex items-center gap-2 h-12">
                      <User className="h-4 w-4" />
                      Manage Users
                    </Button>
                  </Link>
                </>
              )}
              <Button 
                onClick={createSampleNotifications}
                className="w-full flex items-center gap-2 h-12 bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 text-white"
              >
                <Bell className="h-4 w-4" />
                Test Notifications
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}