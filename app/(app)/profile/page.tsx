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
  CheckCircle2,
  BarChart3,
  Award
} from 'lucide-react';
import Link from 'next/link';
import useBookingStats from '@/hooks/use-booking-stats';

export default function ProfilePage() {
  const { data: session } = useSession();
  const bookingStats = useBookingStats();
  
  // Determine if user is admin
  const isAdmin = (session?.user as any)?.role === 'admin';
  const userFlatNumber = (session?.user as any)?.flatNumber;

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
          <Link href={isAdmin ? "/admin/settings" : "/settings"}>
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
                  No bio provided yet. Click &quot;Edit Profile&quot; to add information about yourself.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Activity Summary */}
        <Card className="border-2 border-blue-100 dark:border-blue-900 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  Booking Statistics
                  {!bookingStats.loading && (
                    <span className="flex items-center gap-1 text-xs font-normal text-green-600 dark:text-green-400">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                      </span>
                      Live
                    </span>
                  )}
                </CardTitle>
                <CardDescription className="text-gray-600 dark:text-gray-400">
                  Real-time overview of your booking activity
                </CardDescription>
              </div>
              {!bookingStats.loading && bookingStats.totalBookings > 0 && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  <Award className="h-3 w-3" />
                  {bookingStats.totalBookings} Total
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="pt-6">
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
                      <p>• Ensure you&apos;re properly signed in</p>
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
                    className="relative overflow-hidden text-center space-y-3 p-6 bg-gradient-to-br from-blue-50 via-blue-100 to-blue-50 dark:from-blue-900/30 dark:via-blue-800/30 dark:to-blue-900/30 rounded-xl border-2 border-blue-200 dark:border-blue-700 shadow-md hover:shadow-xl transition-shadow"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    whileHover={{ scale: 1.03, y: -5 }}
                  >
                    <div className="absolute top-0 right-0 w-20 h-20 bg-blue-200 dark:bg-blue-800 rounded-full blur-3xl opacity-50"></div>
                    <div className="relative">
                      <div className="inline-flex items-center justify-center w-12 h-12 mb-2 bg-blue-500 dark:bg-blue-600 rounded-full">
                        <Calendar className="h-6 w-6 text-white" />
                      </div>
                      <div className="text-4xl font-bold text-blue-600 dark:text-blue-400 mb-1">
                        {bookingStats.totalBookings}
                      </div>
                      <div className="text-sm font-semibold text-blue-700 dark:text-blue-300">
                        Total Bookings
                      </div>
                      <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                        All time
                      </div>
                    </div>
                  </motion.div>
                  
                  <motion.div 
                    className="relative overflow-hidden text-center space-y-3 p-6 bg-gradient-to-br from-green-50 via-green-100 to-green-50 dark:from-green-900/30 dark:via-green-800/30 dark:to-green-900/30 rounded-xl border-2 border-green-200 dark:border-green-700 shadow-md hover:shadow-xl transition-shadow"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    whileHover={{ scale: 1.03, y: -5 }}
                  >
                    <div className="absolute top-0 right-0 w-20 h-20 bg-green-200 dark:bg-green-800 rounded-full blur-3xl opacity-50"></div>
                    <div className="relative">
                      <div className="inline-flex items-center justify-center w-12 h-12 mb-2 bg-green-500 dark:bg-green-600 rounded-full">
                        <CheckCircle2 className="h-6 w-6 text-white" />
                      </div>
                      <div className="text-4xl font-bold text-green-600 dark:text-green-400 mb-1">
                        {bookingStats.activeBookings}
                      </div>
                      <div className="text-sm font-semibold text-green-700 dark:text-green-300">
                        Active Bookings
                      </div>
                      <div className="text-xs text-green-600 dark:text-green-400 mt-1">
                        Confirmed
                      </div>
                    </div>
                  </motion.div>
                  
                  <motion.div 
                    className="relative overflow-hidden text-center space-y-3 p-6 bg-gradient-to-br from-purple-50 via-purple-100 to-purple-50 dark:from-purple-900/30 dark:via-purple-800/30 dark:to-purple-900/30 rounded-xl border-2 border-purple-200 dark:border-purple-700 shadow-md hover:shadow-xl transition-shadow"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    whileHover={{ scale: 1.03, y: -5 }}
                  >
                    <div className="absolute top-0 right-0 w-20 h-20 bg-purple-200 dark:bg-purple-800 rounded-full blur-3xl opacity-50"></div>
                    <div className="relative">
                      <div className="inline-flex items-center justify-center w-12 h-12 mb-2 bg-purple-500 dark:bg-purple-600 rounded-full">
                        <Star className="h-6 w-6 text-white" />
                      </div>
                      <div className="text-4xl font-bold text-purple-600 dark:text-purple-400 mb-1">
                        {bookingStats.favoriteAmenities}
                      </div>
                      <div className="text-sm font-semibold text-purple-700 dark:text-purple-300">
                        Favorite Amenities
                      </div>
                      <div className="text-xs text-purple-600 dark:text-purple-400 mt-1">
                        2+ bookings
                      </div>
                    </div>
                  </motion.div>
                </div>

                {/* Most Booked Amenity */}
                {bookingStats.mostBookedAmenity && (
                  <motion.div 
                    className="relative overflow-hidden p-6 bg-gradient-to-r from-orange-50 via-amber-50 to-yellow-50 dark:from-orange-900/30 dark:via-amber-900/30 dark:to-yellow-900/30 rounded-xl border-2 border-orange-200 dark:border-orange-700 shadow-md"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    whileHover={{ scale: 1.02 }}
                  >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-orange-200 dark:bg-orange-800 rounded-full blur-3xl opacity-30"></div>
                    <div className="relative flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Award className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                          <h4 className="text-sm font-semibold text-orange-900 dark:text-orange-100 uppercase tracking-wide">
                            Most Booked Amenity
                          </h4>
                        </div>
                        <p className="text-2xl font-bold text-orange-700 dark:text-orange-300">
                          {bookingStats.mostBookedAmenity}
                        </p>
                        <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">
                          Your favorite spot
                        </p>
                      </div>
                      <div className="relative">
                        <Star className="h-16 w-16 text-orange-400 dark:text-orange-500 fill-orange-300 dark:fill-orange-600" />
                        <div className="absolute inset-0 animate-ping">
                          <Star className="h-16 w-16 text-orange-400 opacity-20" />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Recent Bookings Preview */}
                {bookingStats.recentBookings.length > 0 && (
                  <motion.div 
                    className="space-y-4"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                        <Clock className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        Recent Activity
                      </h4>
                      <Badge variant="outline" className="text-xs">
                        Last {Math.min(3, bookingStats.recentBookings.length)} bookings
                      </Badge>
                    </div>
                    <div className="space-y-3">
                      {bookingStats.recentBookings.slice(0, 3).map((booking, index) => (
                        <motion.div 
                          key={booking.id} 
                          className="group flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-md transition-all"
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.5 + index * 0.1 }}
                          whileHover={{ x: 5 }}
                        >
                          <div className="flex items-center gap-4 flex-1">
                            <div className="relative">
                              <div className={`w-3 h-3 rounded-full ${
                                booking.status === 'confirmed' ? 'bg-green-500' :
                                booking.status === 'pending' ? 'bg-yellow-500' :
                                'bg-red-500'
                              }`}>
                                {booking.status === 'confirmed' && (
                                  <span className="absolute inset-0 animate-ping rounded-full bg-green-500 opacity-75"></span>
                                )}
                              </div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-sm text-gray-900 dark:text-gray-100 truncate">
                                {booking.amenityName || booking.amenity || 'Unknown Amenity'}
                              </p>
                              <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400 mt-1">
                                <Calendar className="h-3 w-3" />
                                <span>{booking.date}</span>
                                <span>•</span>
                                <Clock className="h-3 w-3" />
                                <span>{booking.timeSlot}</span>
                              </div>
                            </div>
                          </div>
                          <Badge 
                            variant={booking.status === 'confirmed' ? 'default' : booking.status === 'pending' ? 'secondary' : 'destructive'}
                            className="text-xs font-semibold shrink-0"
                          >
                            {booking.status}
                          </Badge>
                        </motion.div>
                      ))}
                    </div>
                    {bookingStats.recentBookings.length > 3 && (
                      <Link href="/bookings">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="w-full mt-2 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 hover:from-blue-100 hover:to-purple-100 dark:hover:from-blue-900/30 dark:hover:to-purple-900/30 border-blue-200 dark:border-blue-800"
                        >
                          <Activity className="h-4 w-4 mr-2" />
                          View All Bookings ({bookingStats.totalBookings})
                        </Button>
                      </Link>
                    )}
                  </motion.div>
                )}

                {/* Empty State */}
                {bookingStats.totalBookings === 0 && (
                  <motion.div 
                    className="text-center py-12"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2 }}
                  >
                    <div className="relative inline-block mb-6">
                      <Calendar className="h-24 w-24 text-gray-300 dark:text-gray-600" />
                      <div className="absolute -top-2 -right-2 h-6 w-6 bg-blue-500 rounded-full flex items-center justify-center">
                        <Star className="h-4 w-4 text-white fill-white" />
                      </div>
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                      No bookings yet
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
                      Start exploring and booking amenities to see your statistics here. Your booking journey begins now!
                    </p>
                    <Link href="/bookings">
                      <Button className="bg-gradient-to-r from-blue-500 via-purple-500 to-purple-600 hover:from-blue-600 hover:via-purple-600 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all">
                        <Calendar className="h-4 w-4 mr-2" />
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
              <Link href={isAdmin ? "/admin/settings" : "/settings"}>
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
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}