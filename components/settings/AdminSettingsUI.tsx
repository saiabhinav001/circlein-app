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
  Database, 
  Download, 
  Trash2, 
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
  Sparkles,
  Star,
  Crown,
  Heart,
  Zap,
  Calendar,
  Users,
  Building,
  BarChart3,
  Lock,
  Server,
  AlertTriangle,
  Activity
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

export default function AdminSettingsUI() {
  const { data: session } = useSession();
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();
  
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  
  // Admin tabs configuration
  const settingsTabs = [
    { value: 'profile', label: 'Profile', icon: User },
    { value: 'system', label: 'System', icon: Server },
    { value: 'community', label: 'Community', icon: Building },
    { value: 'notifications', label: 'Alerts', icon: Bell, badge: 5 },
    { value: 'appearance', label: 'Appearance', icon: Palette },
    { value: 'security', label: 'Security', icon: Lock },
  ];
  
  // Admin-specific state
  const [adminProfile, setAdminProfile] = useState({
    name: session?.user?.name || '',
    email: session?.user?.email || '',
    phone: '',
    title: 'Community Administrator',
    department: 'Property Management',
    emergencyContact: '',
    bio: '',
    avatar: session?.user?.image || ''
  });

  const [adminNotifications, setAdminNotifications] = useState({
    newResidentAlerts: true,
    maintenanceRequests: true,
    securityAlerts: true,
    bookingIssues: true,
    systemUpdates: true,
    emergencyNotifications: true,
    reportAlerts: true,
    complianceNotifications: true,
    criticalSystemAlerts: true
  });

  const [systemSettings, setSystemSettings] = useState({
    autoApproveBookings: false,
    requireBookingApproval: true,
    allowGuestBookings: false,
    enableMaintenanceMode: false,
    backupFrequency: 'daily',
    dataRetention: '365',
    auditLogging: true,
    twoFactorRequired: true
  });

  const [communitySettings, setCommunitySettings] = useState({
    maxBookingDuration: '4',
    advanceBookingDays: '30',
    cancellationDeadline: '24',
    maxActiveBookings: '3',
    communityName: 'Elite Community',
    timezone: 'America/New_York',
    businessHours: '9:00 AM - 6:00 PM',
    weekendBookings: true
  });

  const handleSaveProfile = async () => {
    setIsLoading(true);
    try {
      // Save to localStorage for persistence (in a real app, this would be an API call)
      const settingsData = {
        profile: adminProfile,
        notifications: adminNotifications,
        systemSettings: systemSettings,
        communitySettings: communitySettings,
        lastUpdated: new Date().toISOString()
      };
      
      localStorage.setItem(`admin-settings-${session?.user?.email}`, JSON.stringify(settingsData));
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      toast({
        title: 'Admin Settings Updated! ⚡',
        description: 'All administrative configurations have been saved'
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update settings',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Load saved settings on component mount
  useEffect(() => {
    const savedSettings = localStorage.getItem(`admin-settings-${session?.user?.email}`);
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        if (parsed.profile) setAdminProfile(prev => ({ ...prev, ...parsed.profile }));
        if (parsed.notifications) setAdminNotifications(prev => ({ ...prev, ...parsed.notifications }));
        if (parsed.systemSettings) setSystemSettings(prev => ({ ...prev, ...parsed.systemSettings }));
        if (parsed.communitySettings) setCommunitySettings(prev => ({ ...prev, ...parsed.communitySettings }));
      } catch (error) {
        console.log('Could not load saved settings:', error);
      }
    }
  }, [session?.user?.email]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-red-50 dark:from-slate-900 dark:via-amber-950/20 dark:to-red-950/20">
      <div className="container mx-auto p-3 sm:p-4 md:p-6 lg:p-8 max-w-6xl">
        {/* Admin Settings Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 sm:mb-8"
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
            <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 bg-gradient-to-br from-amber-500 via-orange-500 to-red-500 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-xl flex-shrink-0">
              <Crown className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 dark:text-white truncate">
                Administrator Settings
              </h1>
              <p className="text-gray-600 dark:text-gray-300 text-sm sm:text-base md:text-lg">
                Manage system configuration and administrative controls
              </p>
            </div>
          </div>
          
          {/* Admin Status Badges */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm">
              <Crown className="w-3 h-3 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
              <span className="hidden xs:inline">System </span>Administrator
            </Badge>
            <Badge className="bg-gradient-to-r from-red-500 to-pink-500 text-white px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm">
              <Shield className="w-3 h-3 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
              Full Access
            </Badge>
            <Badge variant="outline" className="px-3 sm:px-4 py-1.5 sm:py-2 border-amber-200 text-amber-700 text-xs sm:text-sm">
              <Activity className="w-3 h-3 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
              System Online
            </Badge>
          </div>
        </motion.div>

        {/* Animated Settings Tabs */}
        <div className="mb-6">
          <AnimatedSettingsTabs
            tabs={settingsTabs}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            variant="admin"
          />
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4 sm:space-y-6">
          {/* Admin Profile Tab */}
          <TabsContent value="profile">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6"
            >
              {/* Admin Profile Picture Card */}
              <Card className="lg:col-span-1 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/50 dark:to-orange-950/50 border-amber-200 dark:border-amber-800">
                <CardHeader className="text-center p-4 sm:p-6">
                  <CardTitle className="flex items-center gap-2 justify-center text-amber-700 dark:text-amber-300 text-base sm:text-lg">
                    <Crown className="w-4 h-4 sm:w-5 sm:h-5" />
                    Admin Avatar
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-center p-4 sm:p-6 pt-0">
                  <div className="relative mb-4 sm:mb-6">
                    <Avatar className="w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 mx-auto border-4 border-amber-200 dark:border-amber-700 shadow-xl">
                      <AvatarImage src={adminProfile.avatar} />
                      <AvatarFallback className="bg-gradient-to-br from-amber-500 to-orange-500 text-white text-2xl sm:text-3xl font-bold">
                        {adminProfile.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    <motion.div
                      whileHover={{ scale: 1.1 }}
                      className="absolute bottom-2 right-1/2 translate-x-1/2 translate-y-1/2"
                    >
                      <Button size="sm" className="rounded-full bg-amber-500 hover:bg-amber-600 shadow-lg h-8 w-8 sm:h-10 sm:w-10 p-0">
                        <Camera className="w-3 h-3 sm:w-4 sm:h-4" />
                      </Button>
                    </motion.div>
                    <div className="absolute -top-2 -right-2">
                      <Badge className="bg-red-500 text-white rounded-full px-2 py-1 text-[10px] sm:text-xs">
                        <Star className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-0.5 sm:mr-1" />
                        ADMIN
                      </Badge>
                    </div>
                  </div>
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                    Administrative profile visible to all residents
                  </p>
                </CardContent>
              </Card>

              {/* Admin Details Card */}
              <Card className="lg:col-span-2">
                <CardHeader className="p-4 sm:p-6">
                  <CardTitle className="flex items-center gap-2 text-base sm:text-lg md:text-xl">
                    <User className="w-4 h-4 sm:w-5 sm:h-5 text-amber-600" />
                    Administrator Information
                  </CardTitle>
                  <CardDescription className="text-xs sm:text-sm">
                    Update your administrative profile and contact details
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 sm:space-y-6 p-4 sm:p-6 pt-0">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                    <div>
                      <Label htmlFor="name" className="text-xs sm:text-sm">Full Name</Label>
                      <Input
                        id="name"
                        value={adminProfile.name}
                        onChange={(e) => setAdminProfile({...adminProfile, name: e.target.value})}
                        className="mt-1 h-9 sm:h-10 text-xs sm:text-sm"
                      />
                    </div>
                    <div>
                      <Label htmlFor="email" className="text-xs sm:text-sm">Admin Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={adminProfile.email}
                        onChange={(e) => setAdminProfile({...adminProfile, email: e.target.value})}
                        className="mt-1 h-9 sm:h-10 text-xs sm:text-sm"
                      />
                    </div>
                    <div>
                      <Label htmlFor="phone" className="text-xs sm:text-sm">Direct Phone</Label>
                      <Input
                        id="phone"
                        value={adminProfile.phone}
                        onChange={(e) => setAdminProfile({...adminProfile, phone: e.target.value})}
                        className="mt-1 h-9 sm:h-10 text-xs sm:text-sm"
                        placeholder="+1 (555) 123-4567"
                      />
                    </div>
                    <div>
                      <Label htmlFor="title" className="text-xs sm:text-sm">Job Title</Label>
                      <Input
                        id="title"
                        value={adminProfile.title}
                        onChange={(e) => setAdminProfile({...adminProfile, title: e.target.value})}
                        className="mt-1 h-9 sm:h-10 text-xs sm:text-sm"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="department" className="text-xs sm:text-sm">Department</Label>
                    <Select 
                      value={adminProfile.department} 
                      onValueChange={(value) => setAdminProfile({...adminProfile, department: value})}
                    >
                      <SelectTrigger className="mt-1 h-9 sm:h-10 text-xs sm:text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Property Management">Property Management</SelectItem>
                        <SelectItem value="Facilities Management">Facilities Management</SelectItem>
                        <SelectItem value="Security">Security</SelectItem>
                        <SelectItem value="Maintenance">Maintenance</SelectItem>
                        <SelectItem value="IT Administration">IT Administration</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="emergency" className="text-xs sm:text-sm">Emergency Contact</Label>
                    <Input
                      id="emergency"
                      value={adminProfile.emergencyContact}
                      onChange={(e) => setAdminProfile({...adminProfile, emergencyContact: e.target.value})}
                      className="mt-1 h-9 sm:h-10 text-xs sm:text-sm"
                      placeholder="Emergency contact for after-hours issues"
                    />
                  </div>

                  <div>
                    <Label htmlFor="bio" className="text-xs sm:text-sm">Administrator Bio</Label>
                    <Textarea
                      id="bio"
                      value={adminProfile.bio}
                      onChange={(e) => setAdminProfile({...adminProfile, bio: e.target.value})}
                      className="mt-1 text-xs sm:text-sm"
                      placeholder="Brief description of your role and responsibilities..."
                      rows={4}
                    />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          {/* System Settings Tab */}
          <TabsContent value="system">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6"
            >
              <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/50 dark:to-cyan-950/50 border-blue-200 dark:border-blue-800">
                <CardHeader className="p-4 sm:p-6">
                  <CardTitle className="flex items-center gap-2 text-blue-700 dark:text-blue-300 text-base sm:text-lg">
                    <Server className="w-4 h-4 sm:w-5 sm:h-5" />
                    System Configuration
                  </CardTitle>
                  <CardDescription className="text-xs sm:text-sm">
                    Core system settings and operational parameters
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 sm:space-y-4 p-4 sm:p-6 pt-0">{Object.entries({
                    autoApproveBookings: 'Auto-approve Bookings',
                    requireBookingApproval: 'Require Admin Approval',
                    allowGuestBookings: 'Allow Guest Bookings',
                    enableMaintenanceMode: 'Maintenance Mode',
                    auditLogging: 'Enable Audit Logging',
                    twoFactorRequired: 'Require 2FA for Admins'
                  }).map(([key, label]) => (
                    <div key={key} className="flex items-center justify-between">
                      <Label htmlFor={key} className="text-xs sm:text-sm font-medium">{label}</Label>
                      <Switch
                        id={key}
                        checked={systemSettings[key as keyof typeof systemSettings] as boolean}
                        onCheckedChange={(checked) => 
                          setSystemSettings({...systemSettings, [key]: checked})
                        }
                      />
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/50 dark:to-emerald-950/50 border-green-200 dark:border-green-800">
                <CardHeader className="p-4 sm:p-6">
                  <CardTitle className="flex items-center gap-2 text-green-700 dark:text-green-300 text-base sm:text-lg">
                    <Database className="w-4 h-4 sm:w-5 sm:h-5" />
                    Data & Backup Settings
                  </CardTitle>
                  <CardDescription className="text-xs sm:text-sm">
                    Configure data retention and backup policies
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 sm:space-y-4 p-4 sm:p-6 pt-0">
                  <div>
                    <Label htmlFor="backup-frequency" className="text-xs sm:text-sm">Backup Frequency</Label>
                    <Select 
                      value={systemSettings.backupFrequency} 
                      onValueChange={(value) => setSystemSettings({...systemSettings, backupFrequency: value})}
                    >
                      <SelectTrigger className="mt-1 h-9 sm:h-10 text-xs sm:text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="hourly">Hourly</SelectItem>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="data-retention" className="text-xs sm:text-sm">Data Retention (Days)</Label>
                    <Input
                      id="data-retention"
                      type="number"
                      value={systemSettings.dataRetention}
                      onChange={(e) => setSystemSettings({...systemSettings, dataRetention: e.target.value})}
                      className="mt-1 h-9 sm:h-10 text-xs sm:text-sm"
                    />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          {/* Community Settings Tab */}
          <TabsContent value="community">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card className="bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-950/50 dark:to-violet-950/50 border-purple-200 dark:border-purple-800">
                <CardHeader className="p-4 sm:p-6">
                  <CardTitle className="flex items-center gap-2 text-purple-700 dark:text-purple-300 text-base sm:text-lg">
                    <Building className="w-4 h-4 sm:w-5 sm:h-5" />
                    Community Management
                  </CardTitle>
                  <CardDescription className="text-xs sm:text-sm">
                    Configure community-specific settings and policies
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 sm:space-y-6 p-4 sm:p-6 pt-0">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                    <div className="space-y-3 sm:space-y-4">
                      <div>
                        <Label htmlFor="community-name" className="text-xs sm:text-sm">Community Name</Label>
                        <Input
                          id="community-name"
                          value={communitySettings.communityName}
                          onChange={(e) => setCommunitySettings({...communitySettings, communityName: e.target.value})}
                          className="mt-1 h-9 sm:h-10 text-xs sm:text-sm"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="timezone" className="text-xs sm:text-sm">Timezone</Label>
                        <Select 
                          value={communitySettings.timezone} 
                          onValueChange={(value) => setCommunitySettings({...communitySettings, timezone: value})}
                        >
                          <SelectTrigger className="mt-1 h-9 sm:h-10 text-xs sm:text-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="America/New_York">Eastern Time</SelectItem>
                            <SelectItem value="America/Chicago">Central Time</SelectItem>
                            <SelectItem value="America/Denver">Mountain Time</SelectItem>
                            <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div>
                        <Label htmlFor="business-hours" className="text-xs sm:text-sm">Business Hours</Label>
                        <Input
                          id="business-hours"
                          value={communitySettings.businessHours}
                          onChange={(e) => setCommunitySettings({...communitySettings, businessHours: e.target.value})}
                          className="mt-1 h-9 sm:h-10 text-xs sm:text-sm"
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-3 sm:space-y-4">
                      <div>
                        <Label htmlFor="max-booking" className="text-xs sm:text-sm">Max Booking Duration (Hours)</Label>
                        <Input
                          id="max-booking"
                          type="number"
                          value={communitySettings.maxBookingDuration}
                          onChange={(e) => setCommunitySettings({...communitySettings, maxBookingDuration: e.target.value})}
                          className="mt-1 h-9 sm:h-10 text-xs sm:text-sm"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="advance-days" className="text-xs sm:text-sm">Advance Booking Days</Label>
                        <Input
                          id="advance-days"
                          type="number"
                          value={communitySettings.advanceBookingDays}
                          onChange={(e) => setCommunitySettings({...communitySettings, advanceBookingDays: e.target.value})}
                          className="mt-1 h-9 sm:h-10 text-xs sm:text-sm"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="cancellation" className="text-xs sm:text-sm">Cancellation Deadline (Hours)</Label>
                        <Input
                          id="cancellation"
                          type="number"
                          value={communitySettings.cancellationDeadline}
                          onChange={(e) => setCommunitySettings({...communitySettings, cancellationDeadline: e.target.value})}
                          className="mt-1 h-9 sm:h-10 text-xs sm:text-sm"
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label htmlFor="weekend-bookings" className="text-xs sm:text-sm font-medium">Allow Weekend Bookings</Label>
                    <Switch
                      id="weekend-bookings"
                      checked={communitySettings.weekendBookings}
                      onCheckedChange={(checked) => 
                        setCommunitySettings({...communitySettings, weekendBookings: checked})
                      }
                    />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          {/* Admin Notifications Tab */}
          <TabsContent value="notifications">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6"
            >
              <Card className="bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-950/50 dark:to-orange-950/50 border-red-200 dark:border-red-800">
                <CardHeader className="p-4 sm:p-6">
                  <CardTitle className="flex items-center gap-2 text-red-700 dark:text-red-300 text-base sm:text-lg">
                    <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5" />
                    Critical Alerts
                  </CardTitle>
                  <CardDescription className="text-xs sm:text-sm">
                    High-priority notifications requiring immediate attention
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 sm:space-y-4 p-4 sm:p-6 pt-0">{Object.entries({
                    criticalSystemAlerts: 'Critical System Alerts',
                    securityAlerts: 'Security Incidents',
                    emergencyNotifications: 'Emergency Notifications',
                    maintenanceRequests: 'Urgent Maintenance'
                  }).map(([key, label]) => (
                    <div key={key} className="flex items-center justify-between">
                      <Label htmlFor={key} className="text-xs sm:text-sm font-medium">{label}</Label>
                      <Switch
                        id={key}
                        checked={adminNotifications[key as keyof typeof adminNotifications]}
                        onCheckedChange={(checked) => 
                          setAdminNotifications({...adminNotifications, [key]: checked})
                        }
                      />
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-yellow-950/50 dark:to-amber-950/50 border-yellow-200 dark:border-yellow-800">
                <CardHeader className="p-4 sm:p-6">
                  <CardTitle className="flex items-center gap-2 text-yellow-700 dark:text-yellow-300 text-base sm:text-lg">
                    <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
                    Operational Alerts
                  </CardTitle>
                  <CardDescription className="text-xs sm:text-sm">
                    Regular administrative notifications and updates
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 sm:space-y-4 p-4 sm:p-6 pt-0">{Object.entries({
                    newResidentAlerts: 'New Resident Registrations',
                    bookingIssues: 'Booking Issues',
                    systemUpdates: 'System Updates',
                    reportAlerts: 'Report Notifications',
                    complianceNotifications: 'Compliance Alerts'
                  }).map(([key, label]) => (
                    <div key={key} className="flex items-center justify-between">
                      <Label htmlFor={key} className="text-xs sm:text-sm font-medium">{label}</Label>
                      <Switch
                        id={key}
                        checked={adminNotifications[key as keyof typeof adminNotifications]}
                        onCheckedChange={(checked) => 
                          setAdminNotifications({...adminNotifications, [key]: checked})
                        }
                      />
                    </div>
                  ))}
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
                    Admin Interface Appearance
                  </CardTitle>
                  <CardDescription className="text-xs sm:text-sm">
                    Customize the administrative interface appearance
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 sm:space-y-6 p-4 sm:p-6 pt-0">
                  <div>
                    <Label className="text-sm sm:text-base font-medium">Admin Theme</Label>
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
                    Administrator Security
                  </CardTitle>
                  <CardDescription className="text-xs sm:text-sm">
                    High-security settings for administrative access
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 sm:space-y-6 p-4 sm:p-6 pt-0">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                    <div className="space-y-3 sm:space-y-4">
                      <div>
                        <Label htmlFor="current-admin-password" className="text-xs sm:text-sm">Current Admin Password</Label>
                        <div className="relative mt-1">
                          <Input
                            id="current-admin-password"
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
                      
                      <div>
                        <Label htmlFor="new-admin-password" className="text-xs sm:text-sm">New Admin Password</Label>
                        <Input
                          id="new-admin-password"
                          type={showPassword ? "text" : "password"}
                          placeholder="Enter new password"
                          className="mt-1 h-9 sm:h-10 text-xs sm:text-sm"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="confirm-admin-password" className="text-xs sm:text-sm">Confirm New Password</Label>
                        <Input
                          id="confirm-admin-password"
                          type={showPassword ? "text" : "password"}
                          placeholder="Confirm new password"
                          className="mt-1 h-9 sm:h-10 text-xs sm:text-sm"
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-3 sm:space-y-4">
                      <div className="bg-red-50 dark:bg-red-950/30 p-3 sm:p-4 rounded-lg border border-red-200 dark:border-red-800">
                        <h4 className="font-medium text-red-800 dark:text-red-200 mb-2 text-xs sm:text-sm">Security Requirements</h4>
                        <ul className="text-xs sm:text-sm text-red-700 dark:text-red-300 space-y-1">
                          <li>• Minimum 12 characters</li>
                          <li>• Must include uppercase letters</li>
                          <li>• Must include numbers</li>
                          <li>• Must include special characters</li>
                          <li>• Cannot reuse last 5 passwords</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-3 sm:space-y-4">
                    <h4 className="font-medium text-sm sm:text-base">Administrative Security Features</h4>
                    <div className="space-y-2 sm:space-y-3">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-xs sm:text-sm">Two-Factor Authentication</p>
                          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                            Required for all administrative access
                          </p>
                        </div>
                        <Switch defaultChecked className="flex-shrink-0" />
                      </div>
                      
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-xs sm:text-sm">Session Timeout</p>
                          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                            Auto-logout after 30 minutes of inactivity
                          </p>
                        </div>
                        <Switch defaultChecked className="flex-shrink-0" />
                      </div>
                      
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-xs sm:text-sm">IP Address Restrictions</p>
                          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                            Limit admin access to specific IP ranges
                          </p>
                        </div>
                        <Switch className="flex-shrink-0" />
                      </div>
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
            className="bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 hover:from-amber-600 hover:via-orange-600 hover:to-red-600 text-white px-6 sm:px-8 py-2.5 sm:py-3 rounded-xl font-medium shadow-lg text-sm sm:text-base w-full sm:w-auto"
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
                Save Admin Settings
              </>
            )}
          </Button>
        </motion.div>
      </div>
    </div>
  );
}