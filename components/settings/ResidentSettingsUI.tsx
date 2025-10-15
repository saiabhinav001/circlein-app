'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { motion } from 'framer-motion';
import { 
  User, 
  Bell, 
  Shield, 
  Palette, 
  Globe, 
  Key, 
  Download, 
  Mail, 
  Phone, 
  MapPin, 
  Camera,
  Save,
  Eye,
  EyeOff,
  Check,
  X,
  Sun,
  Moon,
  Settings,
  Heart,
  Calendar,
  Home,
  Smartphone,
  Lock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { useTheme } from '@/components/providers/theme-provider';
import { useToast } from '@/hooks/use-toast';
import { AnimatedSettingsTabs } from '@/components/settings/AnimatedSettingsTabs';

export default function ResidentSettingsUI() {
  const { data: session, update } = useSession();
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();
  
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  
  // Resident-specific state
  const [residentProfile, setResidentProfile] = useState({
    name: session?.user?.name || '',
    email: session?.user?.email || '',
    phone: '',
    flatNumber: (session?.user as any)?.flatNumber || '',
    emergencyContact: '',
    bio: '',
    avatar: session?.user?.image || ''
  });

  const [residentNotifications, setResidentNotifications] = useState({
    bookingReminders: true,
    communityUpdates: true,
    maintenanceAlerts: true,
    eventNotifications: true,
    emergencyAlerts: true,
    pushNotifications: true,
    emailDigest: true,
    smsAlerts: false
  });

  const [residentPrivacy, setResidentPrivacy] = useState({
    showProfile: true,
    showBookings: false,
    shareContactInfo: false,
    allowDirectMessages: true,
    profileVisibility: 'residents'
  });

  const handleSaveProfile = async () => {
    setIsLoading(true);
    try {
      // Update flat number in database if it has changed
      const currentFlatNumber = (session?.user as any)?.flatNumber || '';
      if (residentProfile.flatNumber !== currentFlatNumber) {
        const response = await fetch('/api/update-flat-number', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: session?.user?.email,
            flatNumber: residentProfile.flatNumber.trim()
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to update flat number');
        }
      }

      // Save other profile data to localStorage for persistence
      const settingsData = {
        profile: residentProfile,
        notifications: residentNotifications,
        privacy: residentPrivacy,
        lastUpdated: new Date().toISOString()
      };
      
      localStorage.setItem(`resident-settings-${session?.user?.email}`, JSON.stringify(settingsData));
      
      // Force session refresh to include updated flat number
      if (residentProfile.flatNumber !== currentFlatNumber) {
        await update(); // This will trigger the JWT callback to refresh user data
        await new Promise(resolve => setTimeout(resolve, 500)); // Brief delay for session update
      }
      
      toast({
        title: 'Profile Updated Successfully! 🏠',
        description: 'Your resident profile has been saved'
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update profile',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Load saved settings on component mount
  useEffect(() => {
    // First, sync session data (this takes priority over localStorage)
    if (session?.user) {
      setResidentProfile(prev => ({
        ...prev,
        name: session.user.name || prev.name,
        email: session.user.email || prev.email,
        flatNumber: (session.user as any)?.flatNumber || prev.flatNumber,
        avatar: session.user.image || prev.avatar
      }));
    }

    // Then load any additional saved settings from localStorage
    const savedSettings = localStorage.getItem(`resident-settings-${session?.user?.email}`);
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        if (parsed.profile) {
          setResidentProfile(prev => ({ 
            ...prev, 
            ...parsed.profile,
            // Ensure session data takes priority for these fields
            name: session?.user?.name || parsed.profile.name,
            email: session?.user?.email || parsed.profile.email,
            flatNumber: (session?.user as any)?.flatNumber || parsed.profile.flatNumber || prev.flatNumber,
            avatar: session?.user?.image || parsed.profile.avatar
          }));
        }
        if (parsed.notifications) setResidentNotifications(prev => ({ ...prev, ...parsed.notifications }));
        if (parsed.privacy) setResidentPrivacy(prev => ({ ...prev, ...parsed.privacy }));
      } catch (error) {
        console.log('Could not load saved settings:', error);
      }
    }
  }, [session?.user?.email, session?.user?.name, session?.user?.image, (session?.user as any)?.flatNumber]);

  // Define tabs configuration
  const settingsTabs = [
    { value: 'profile', label: 'Profile', icon: User },
    { value: 'notifications', label: 'Notifications', icon: Bell, badge: 3 },
    { value: 'privacy', label: 'Privacy', icon: Shield },
    { value: 'appearance', label: 'Appearance', icon: Palette },
    { value: 'security', label: 'Security', icon: Lock },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <div className="container mx-auto p-3 sm:p-4 md:p-6 lg:p-8 max-w-6xl">
        {/* Resident Settings Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 sm:mb-8"
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
            <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-500 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-xl flex-shrink-0">
              <Home className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 dark:text-white truncate">
                Resident Settings
              </h1>
              <p className="text-gray-600 dark:text-gray-300 text-sm sm:text-base md:text-lg">
                Manage your community profile and preferences
              </p>
            </div>
          </div>
          
          {/* Resident Status Badge */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <Badge className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm">
              <User className="w-3 h-3 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
              Community Resident
            </Badge>
            <Badge variant="outline" className="px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm">
              <Calendar className="w-3 h-3 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
              <span className="hidden xs:inline">Member since </span>{new Date().getFullYear()}
            </Badge>
          </div>
        </motion.div>

        {/* Animated Settings Tabs */}
        <div className="mb-6">
          <AnimatedSettingsTabs
            tabs={settingsTabs}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            variant="resident"
          />
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4 sm:space-y-6">
          {/* Profile Tab */}
          <TabsContent value="profile">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6"
            >
              {/* Profile Picture Card */}
              <Card className="lg:col-span-1 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/50 dark:to-indigo-950/50 border-blue-200 dark:border-blue-800">
                <CardHeader className="text-center p-4 sm:p-6">
                  <CardTitle className="flex items-center gap-2 justify-center text-blue-700 dark:text-blue-300 text-base sm:text-lg">
                    <Camera className="w-4 h-4 sm:w-5 sm:h-5" />
                    Profile Picture
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-center p-4 sm:p-6 pt-0">
                  <div className="relative mb-4 sm:mb-6">
                    <Avatar className="w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 mx-auto border-4 border-blue-200 dark:border-blue-700 shadow-xl">
                      <AvatarImage src={residentProfile.avatar} />
                      <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-500 text-white text-2xl sm:text-3xl font-bold">
                        {residentProfile.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    <motion.div
                      whileHover={{ scale: 1.1 }}
                      className="absolute bottom-2 right-1/2 translate-x-1/2 translate-y-1/2"
                    >
                      <Button size="sm" className="rounded-full bg-blue-500 hover:bg-blue-600 shadow-lg h-8 w-8 sm:h-10 sm:w-10 p-0">
                        <Camera className="w-3 h-3 sm:w-4 sm:h-4" />
                      </Button>
                    </motion.div>
                  </div>
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                    Upload a new profile picture to personalize your community presence
                  </p>
                </CardContent>
              </Card>

              {/* Profile Details Card */}
              <Card className="lg:col-span-2">
                <CardHeader className="p-4 sm:p-6">
                  <CardTitle className="flex items-center gap-2 text-base sm:text-lg md:text-xl">
                    <User className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                    Resident Information
                  </CardTitle>
                  <CardDescription className="text-xs sm:text-sm">
                    Update your personal details and contact information
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 sm:space-y-6 p-4 sm:p-6 pt-0">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                    <div>
                      <Label htmlFor="name" className="text-xs sm:text-sm">Full Name</Label>
                      <Input
                        id="name"
                        value={residentProfile.name}
                        onChange={(e) => setResidentProfile({...residentProfile, name: e.target.value})}
                        className="mt-1 h-9 sm:h-10 text-xs sm:text-sm"
                      />
                    </div>
                    <div>
                      <Label htmlFor="email" className="text-xs sm:text-sm">Email Address</Label>
                      <Input
                        id="email"
                        type="email"
                        value={residentProfile.email}
                        onChange={(e) => setResidentProfile({...residentProfile, email: e.target.value})}
                        className="mt-1 h-9 sm:h-10 text-xs sm:text-sm"
                      />
                    </div>
                    <div>
                      <Label htmlFor="phone" className="text-xs sm:text-sm">Phone Number</Label>
                      <Input
                        id="phone"
                        value={residentProfile.phone}
                        onChange={(e) => setResidentProfile({...residentProfile, phone: e.target.value})}
                        className="mt-1 h-9 sm:h-10 text-xs sm:text-sm"
                        placeholder="+1 (555) 123-4567"
                      />
                    </div>
                    <div>
                      <Label htmlFor="flatNumber" className="text-xs sm:text-sm">Flat Number</Label>
                      <Input
                        id="flatNumber"
                        value={residentProfile.flatNumber}
                        onChange={(e) => setResidentProfile({...residentProfile, flatNumber: e.target.value})}
                        className="mt-1 h-9 sm:h-10 text-xs sm:text-sm"
                        placeholder="A-123, B-456, etc."
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="emergency" className="text-xs sm:text-sm">Emergency Contact</Label>
                    <Input
                      id="emergency"
                      value={residentProfile.emergencyContact}
                      onChange={(e) => setResidentProfile({...residentProfile, emergencyContact: e.target.value})}
                      className="mt-1 h-9 sm:h-10 text-xs sm:text-sm"
                      placeholder="Emergency contact name and phone"
                    />
                  </div>

                  <div>
                    <Label htmlFor="bio" className="text-xs sm:text-sm">About Me</Label>
                    <Textarea
                      id="bio"
                      value={residentProfile.bio}
                      onChange={(e) => setResidentProfile({...residentProfile, bio: e.target.value})}
                      className="mt-1 text-xs sm:text-sm"
                      placeholder="Tell your neighbors about yourself..."
                      rows={4}
                    />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6"
            >
              <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/50 dark:to-emerald-950/50 border-green-200 dark:border-green-800">
                <CardHeader className="p-4 sm:p-6">
                  <CardTitle className="flex items-center gap-2 text-green-700 dark:text-green-300 text-base sm:text-lg">
                    <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
                    Community Notifications
                  </CardTitle>
                  <CardDescription className="text-xs sm:text-sm">
                    Stay updated with community activities and announcements
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 sm:space-y-4 p-4 sm:p-6 pt-0">
                  {Object.entries({
                    bookingReminders: 'Booking Reminders',
                    communityUpdates: 'Community Updates',
                    maintenanceAlerts: 'Maintenance Alerts',
                    eventNotifications: 'Event Notifications'
                  }).map(([key, label]) => (
                    <div key={key} className="flex items-center justify-between">
                      <Label htmlFor={key} className="text-xs sm:text-sm font-medium">{label}</Label>
                      <Switch
                        id={key}
                        checked={residentNotifications[key as keyof typeof residentNotifications]}
                        onCheckedChange={(checked) => 
                          setResidentNotifications({...residentNotifications, [key]: checked})
                        }
                      />
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-950/50 dark:to-violet-950/50 border-purple-200 dark:border-purple-800">
                <CardHeader className="p-4 sm:p-6">
                  <CardTitle className="flex items-center gap-2 text-purple-700 dark:text-purple-300 text-base sm:text-lg">
                    <Smartphone className="w-4 h-4 sm:w-5 sm:h-5" />
                    Delivery Methods
                  </CardTitle>
                  <CardDescription className="text-xs sm:text-sm">
                    Choose how you want to receive notifications
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 sm:space-y-4 p-4 sm:p-6 pt-0">
                  {Object.entries({
                    pushNotifications: 'Push Notifications',
                    emailDigest: 'Email Digest',
                    smsAlerts: 'SMS Alerts',
                    emergencyAlerts: 'Emergency Alerts'
                  }).map(([key, label]) => (
                    <div key={key} className="flex items-center justify-between">
                      <Label htmlFor={key} className="text-xs sm:text-sm font-medium">{label}</Label>
                      <Switch
                        id={key}
                        checked={residentNotifications[key as keyof typeof residentNotifications]}
                        onCheckedChange={(checked) => 
                          setResidentNotifications({...residentNotifications, [key]: checked})
                        }
                      />
                    </div>
                  ))}
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          {/* Privacy Tab */}
          <TabsContent value="privacy">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card className="bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-950/50 dark:to-red-950/50 border-orange-200 dark:border-orange-800">
                <CardHeader className="p-4 sm:p-6">
                  <CardTitle className="flex items-center gap-2 text-orange-700 dark:text-orange-300 text-base sm:text-lg">
                    <Shield className="w-4 h-4 sm:w-5 sm:h-5" />
                    Privacy & Visibility
                  </CardTitle>
                  <CardDescription className="text-xs sm:text-sm">
                    Control what information other residents can see
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 sm:space-y-6 p-4 sm:p-6 pt-0">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                    <div className="space-y-3 sm:space-y-4">{Object.entries({
                        showProfile: 'Show Profile to Neighbors',
                        showBookings: 'Show My Facility Bookings',
                        shareContactInfo: 'Share Contact Information',
                        allowDirectMessages: 'Allow Direct Messages'
                      }).map(([key, label]) => (
                        <div key={key} className="flex items-center justify-between">
                          <Label htmlFor={key} className="text-xs sm:text-sm font-medium">{label}</Label>
                          <Switch
                            id={key}
                            checked={residentPrivacy[key as keyof typeof residentPrivacy] as boolean}
                            onCheckedChange={(checked) => 
                              setResidentPrivacy({...residentPrivacy, [key]: checked})
                            }
                          />
                        </div>
                      ))}
                    </div>
                    
                    <div>
                      <Label htmlFor="visibility" className="text-xs sm:text-sm">Profile Visibility</Label>
                      <Select 
                        value={residentPrivacy.profileVisibility} 
                        onValueChange={(value) => 
                          setResidentPrivacy({...residentPrivacy, profileVisibility: value})
                        }
                      >
                        <SelectTrigger className="mt-1 h-9 sm:h-10 text-xs sm:text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="public">Everyone</SelectItem>
                          <SelectItem value="residents">Residents Only</SelectItem>
                          <SelectItem value="neighbors">Close Neighbors</SelectItem>
                          <SelectItem value="private">Private</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          {/* Appearance Tab */}
          <TabsContent value="appearance">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card>
                <CardHeader className="p-4 sm:p-6">
                  <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                    <Palette className="w-4 h-4 sm:w-5 sm:h-5" />
                    Appearance Settings
                  </CardTitle>
                  <CardDescription className="text-xs sm:text-sm">
                    Customize how the application looks and feels
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 sm:space-y-6 p-4 sm:p-6 pt-0">
                  <div>
                    <Label className="text-sm sm:text-base font-medium">Theme</Label>
                    <div className="grid grid-cols-3 gap-3 sm:gap-4 mt-3">
                      {[
                        { value: 'light', label: 'Light', icon: Sun },
                        { value: 'dark', label: 'Dark', icon: Moon },
                        { value: 'system', label: 'System', icon: Settings }
                      ].map((option) => (
                        <motion.div
                          key={option.value}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <Button
                            variant={theme === option.value ? "default" : "outline"}
                            onClick={() => setTheme(option.value as any)}
                            className="w-full h-16 sm:h-20 flex flex-col gap-1 sm:gap-2 text-xs sm:text-sm"
                          >
                            <option.icon className="w-5 h-5 sm:w-6 sm:h-6" />
                            {option.label}
                          </Button>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card className="bg-gradient-to-br from-red-50 to-pink-50 dark:from-red-950/50 dark:to-pink-950/50 border-red-200 dark:border-red-800">
                <CardHeader className="p-4 sm:p-6">
                  <CardTitle className="flex items-center gap-2 text-red-700 dark:text-red-300 text-base sm:text-lg">
                    <Lock className="w-4 h-4 sm:w-5 sm:h-5" />
                    Security Settings
                  </CardTitle>
                  <CardDescription className="text-xs sm:text-sm">
                    Manage your account security and access
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 sm:space-y-6 p-4 sm:p-6 pt-0">
                  <div className="space-y-3 sm:space-y-4">
                    <div>
                      <Label htmlFor="current-password" className="text-xs sm:text-sm">Current Password</Label>
                      <div className="relative mt-1">
                        <Input
                          id="current-password"
                          type={showPassword ? "text" : "password"}
                          placeholder="Enter current password"
                          className="h-9 sm:h-10 text-xs sm:text-sm"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-2 sm:px-3"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? <EyeOff className="w-3 h-3 sm:w-4 sm:h-4" /> : <Eye className="w-3 h-3 sm:w-4 sm:h-4" />}
                        </Button>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                      <div>
                        <Label htmlFor="new-password" className="text-xs sm:text-sm">New Password</Label>
                        <Input
                          id="new-password"
                          type={showPassword ? "text" : "password"}
                          placeholder="Enter new password"
                          className="mt-1 h-9 sm:h-10 text-xs sm:text-sm"
                        />
                      </div>
                      <div>
                        <Label htmlFor="confirm-password" className="text-xs sm:text-sm">Confirm Password</Label>
                        <Input
                          id="confirm-password"
                          type={showPassword ? "text" : "password"}
                          placeholder="Confirm new password"
                          className="mt-1 h-9 sm:h-10 text-xs sm:text-sm"
                        />
                      </div>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-3 sm:space-y-4">
                    <h4 className="font-medium text-sm sm:text-base">Two-Factor Authentication</h4>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-xs sm:text-sm">SMS Verification</p>
                        <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                          Receive verification codes via SMS
                        </p>
                      </div>
                      <Switch />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>
        </Tabs>

        {/* Save Button */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6 sm:mt-8 flex justify-center"
        >
          <Button 
            onClick={handleSaveProfile}
            disabled={isLoading}
            className="bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 hover:from-blue-600 hover:via-indigo-600 hover:to-purple-600 text-white px-6 sm:px-8 py-2.5 sm:py-3 rounded-xl font-medium shadow-lg text-sm sm:text-base w-full sm:w-auto"
          >
            {isLoading ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white border-t-transparent rounded-full"
              />
            ) : (
              <>
                <Save className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                Save All Changes
              </>
            )}
          </Button>
        </motion.div>
      </div>
    </div>
  );
}