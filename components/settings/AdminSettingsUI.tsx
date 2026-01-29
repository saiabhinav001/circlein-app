'use client';

import { useState, useEffect, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/components/providers/theme-provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  User,
  Bell,
  Shield,
  Palette,
  Sun,
  Moon,
  Monitor,
  Eye,
  EyeOff,
  Save,
  X,
  Check,
  AlertCircle,
  Lock,
  Mail,
  Phone,
  Building2,
  UserCircle,
  Settings,
  Calendar,
  Database,
  Users,
  Clock,
  Globe,
  AlertTriangle,
} from 'lucide-react';
import { toast } from 'sonner';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface AdminProfile {
  name: string;
  email: string;
  phone: string;
  title: string;
  department: string;
  emergencyContact: string;
  bio: string;
  avatar: string;
}

interface AdminNotifications {
  newResidentAlerts: boolean;
  maintenanceRequests: boolean;
  securityAlerts: boolean;
  bookingIssues: boolean;
  systemUpdates: boolean;
  emergencyNotifications: boolean;
  reportAlerts: boolean;
  complianceNotifications: boolean;
  criticalSystemAlerts: boolean;
}

interface SystemSettings {
  autoApproveBookings: boolean;
  requireBookingApproval: boolean;
  allowGuestBookings: boolean;
  enableMaintenanceMode: boolean;
  backupFrequency: string;
  dataRetention: string;
  auditLogging: boolean;
  twoFactorRequired: boolean;
}

interface CommunitySettings {
  maxBookingDuration: string;
  advanceBookingDays: string;
  cancellationDeadline: string;
  maxActiveBookings: string;
  communityName: string;
  timezone: string;
  businessHours: string;
  weekendBookings: boolean;
}

type SettingsSection = 
  | 'account' 
  | 'community' 
  | 'booking-rules' 
  | 'notifications' 
  | 'appearance' 
  | 'security' 
  | 'system';

// ─────────────────────────────────────────────────────────────────────────────
// Navigation Items
// ─────────────────────────────────────────────────────────────────────────────

const navigationItems: { id: SettingsSection; label: string; icon: typeof User; description: string }[] = [
  { id: 'account', label: 'Account', icon: User, description: 'Your admin profile' },
  { id: 'community', label: 'Community', icon: Building2, description: 'Community settings' },
  { id: 'booking-rules', label: 'Booking Rules', icon: Calendar, description: 'Booking configuration' },
  { id: 'notifications', label: 'Notifications', icon: Bell, description: 'Alert preferences' },
  { id: 'appearance', label: 'Appearance', icon: Palette, description: 'Theme and display' },
  { id: 'security', label: 'Security', icon: Shield, description: 'Access and authentication' },
  { id: 'system', label: 'System', icon: Database, description: 'Data and maintenance' },
];

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

export default function AdminSettingsUI() {
  const { data: session } = useSession();
  const { theme, setTheme } = useTheme();
  
  // Active section
  const [activeSection, setActiveSection] = useState<SettingsSection>('account');
  
  // Loading & saving states
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  // Admin Profile state
  const [profile, setProfile] = useState<AdminProfile>({
    name: '',
    email: '',
    phone: '',
    title: '',
    department: '',
    emergencyContact: '',
    bio: '',
    avatar: '',
  });
  
  const [originalProfile, setOriginalProfile] = useState<AdminProfile | null>(null);
  
  // Notifications state
  const [notifications, setNotifications] = useState<AdminNotifications>({
    newResidentAlerts: true,
    maintenanceRequests: true,
    securityAlerts: true,
    bookingIssues: true,
    systemUpdates: true,
    emergencyNotifications: true,
    reportAlerts: true,
    complianceNotifications: true,
    criticalSystemAlerts: true,
  });
  
  const [originalNotifications, setOriginalNotifications] = useState<AdminNotifications | null>(null);
  
  // System Settings state
  const [systemSettings, setSystemSettings] = useState<SystemSettings>({
    autoApproveBookings: true,
    requireBookingApproval: false,
    allowGuestBookings: false,
    enableMaintenanceMode: false,
    backupFrequency: 'daily',
    dataRetention: '90',
    auditLogging: true,
    twoFactorRequired: false,
  });
  
  const [originalSystemSettings, setOriginalSystemSettings] = useState<SystemSettings | null>(null);
  
  // Community Settings state
  const [communitySettings, setCommunitySettings] = useState<CommunitySettings>({
    maxBookingDuration: '4',
    advanceBookingDays: '14',
    cancellationDeadline: '24',
    maxActiveBookings: '3',
    communityName: '',
    timezone: 'America/New_York',
    businessHours: '6:00 AM - 10:00 PM',
    weekendBookings: true,
  });
  
  const [originalCommunitySettings, setOriginalCommunitySettings] = useState<CommunitySettings | null>(null);
  
  // Password state
  const [passwords, setPasswords] = useState({
    current: '',
    new: '',
    confirm: '',
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // Load settings from localStorage
  // ─────────────────────────────────────────────────────────────────────────────
  
  useEffect(() => {
    if (session?.user?.email) {
      const storageKey = `admin-settings-${session.user.email}`;
      const savedSettings = localStorage.getItem(storageKey);
      
      if (savedSettings) {
        try {
          const parsed = JSON.parse(savedSettings);
          if (parsed.profile) {
            setProfile(parsed.profile);
            setOriginalProfile(parsed.profile);
          }
          if (parsed.notifications) {
            setNotifications(parsed.notifications);
            setOriginalNotifications(parsed.notifications);
          }
          if (parsed.systemSettings) {
            setSystemSettings(parsed.systemSettings);
            setOriginalSystemSettings(parsed.systemSettings);
          }
          if (parsed.communitySettings) {
            setCommunitySettings(parsed.communitySettings);
            setOriginalCommunitySettings(parsed.communitySettings);
          }
        } catch (e) {
          console.error('Failed to load settings:', e);
        }
      } else {
        // Initialize with session data
        const initialProfile = {
          name: session.user.name || '',
          email: session.user.email || '',
          phone: '',
          title: 'Administrator',
          department: 'Property Management',
          emergencyContact: '',
          bio: '',
          avatar: session.user.image || '',
        };
        setProfile(initialProfile);
        setOriginalProfile(initialProfile);
        setOriginalNotifications(notifications);
        setOriginalSystemSettings(systemSettings);
        setOriginalCommunitySettings(communitySettings);
      }
    }
  }, [session]);

  // ─────────────────────────────────────────────────────────────────────────────
  // Dirty state detection
  // ─────────────────────────────────────────────────────────────────────────────
  
  const isDirty = useMemo(() => {
    if (!originalProfile || !originalNotifications || !originalSystemSettings || !originalCommunitySettings) {
      return false;
    }
    
    const profileDirty = JSON.stringify(profile) !== JSON.stringify(originalProfile);
    const notificationsDirty = JSON.stringify(notifications) !== JSON.stringify(originalNotifications);
    const systemDirty = JSON.stringify(systemSettings) !== JSON.stringify(originalSystemSettings);
    const communityDirty = JSON.stringify(communitySettings) !== JSON.stringify(originalCommunitySettings);
    const passwordDirty = passwords.current || passwords.new || passwords.confirm;
    
    return profileDirty || notificationsDirty || systemDirty || communityDirty || !!passwordDirty;
  }, [profile, originalProfile, notifications, originalNotifications, systemSettings, originalSystemSettings, communitySettings, originalCommunitySettings, passwords]);

  // ─────────────────────────────────────────────────────────────────────────────
  // Save handler
  // ─────────────────────────────────────────────────────────────────────────────
  
  const handleSave = async () => {
    if (!session?.user?.email) return;
    
    setIsLoading(true);
    
    try {
      // Validate password change if attempted
      if (passwords.new || passwords.confirm) {
        if (!passwords.current) {
          toast.error('Current password is required');
          setIsLoading(false);
          return;
        }
        if (passwords.new !== passwords.confirm) {
          toast.error('New passwords do not match');
          setIsLoading(false);
          return;
        }
        if (passwords.new.length < 12) {
          toast.error('Admin password must be at least 12 characters');
          setIsLoading(false);
          return;
        }
      }
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Save to localStorage
      const storageKey = `admin-settings-${session.user.email}`;
      localStorage.setItem(storageKey, JSON.stringify({
        profile,
        notifications,
        systemSettings,
        communitySettings,
        updatedAt: new Date().toISOString(),
      }));
      
      // Update original states
      setOriginalProfile(profile);
      setOriginalNotifications(notifications);
      setOriginalSystemSettings(systemSettings);
      setOriginalCommunitySettings(communitySettings);
      setPasswords({ current: '', new: '', confirm: '' });
      
      toast.success('Admin settings saved successfully');
    } catch (error) {
      toast.error('Failed to save settings');
      console.error('Save error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // Cancel handler
  // ─────────────────────────────────────────────────────────────────────────────
  
  const handleCancel = () => {
    if (originalProfile) setProfile(originalProfile);
    if (originalNotifications) setNotifications(originalNotifications);
    if (originalSystemSettings) setSystemSettings(originalSystemSettings);
    if (originalCommunitySettings) setCommunitySettings(originalCommunitySettings);
    setPasswords({ current: '', new: '', confirm: '' });
    toast.info('Changes discarded');
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // Render Section Content
  // ─────────────────────────────────────────────────────────────────────────────
  
  const renderSectionContent = () => {
    switch (activeSection) {
      case 'account':
        return <AccountSection profile={profile} setProfile={setProfile} />;
      case 'community':
        return <CommunitySection settings={communitySettings} setSettings={setCommunitySettings} />;
      case 'booking-rules':
        return <BookingRulesSection settings={communitySettings} setSettings={setCommunitySettings} />;
      case 'notifications':
        return <NotificationsSection notifications={notifications} setNotifications={setNotifications} />;
      case 'appearance':
        return <AppearanceSection theme={theme} setTheme={setTheme} />;
      case 'security':
        return (
          <SecuritySection 
            passwords={passwords} 
            setPasswords={setPasswords}
            showPassword={showPassword}
            setShowPassword={setShowPassword}
            systemSettings={systemSettings}
            setSystemSettings={setSystemSettings}
          />
        );
      case 'system':
        return <SystemSection settings={systemSettings} setSettings={setSystemSettings} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Admin Settings</h1>
            <span className="px-2 py-0.5 text-xs font-medium bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded">
              Admin
            </span>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Manage your account, community, and system settings
          </p>
        </div>

        {/* Main Layout: Sidebar + Content */}
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left Sidebar Navigation */}
          <nav className="lg:w-64 flex-shrink-0">
            <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 overflow-hidden">
              {navigationItems.map((item, index) => {
                const Icon = item.icon;
                const isActive = activeSection === item.id;
                
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveSection(item.id)}
                    className={`
                      w-full flex items-center gap-3 px-4 py-3 text-left transition-colors
                      ${isActive 
                        ? 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white' 
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50'
                      }
                      ${index !== 0 ? 'border-t border-gray-100 dark:border-gray-800' : ''}
                    `}
                  >
                    <Icon className={`w-5 h-5 ${isActive ? 'text-gray-900 dark:text-white' : 'text-gray-400 dark:text-gray-500'}`} />
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium ${isActive ? 'text-gray-900 dark:text-white' : ''}`}>
                        {item.label}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-500 truncate">
                        {item.description}
                      </p>
                    </div>
                    {isActive && (
                      <div className="w-1 h-8 bg-gray-900 dark:bg-white rounded-full" />
                    )}
                  </button>
                );
              })}
            </div>
          </nav>

          {/* Right Content Panel */}
          <main className="flex-1 min-w-0">
            <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeSection}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.15 }}
                >
                  {renderSectionContent()}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Action Bar */}
            <AnimatePresence>
              {isDirty && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  className="mt-6 flex items-center justify-between bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-4"
                >
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <AlertCircle className="w-4 h-4" />
                    <span>You have unsaved changes</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Button
                      variant="outline"
                      onClick={handleCancel}
                      disabled={isLoading}
                      className="gap-2"
                    >
                      <X className="w-4 h-4" />
                      Cancel
                    </Button>
                    <Button
                      onClick={handleSave}
                      disabled={isLoading}
                      className="gap-2 bg-gray-900 hover:bg-gray-800 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100"
                    >
                      {isLoading ? (
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                          className="w-4 h-4 border-2 border-white dark:border-gray-900 border-t-transparent rounded-full"
                        />
                      ) : (
                        <Save className="w-4 h-4" />
                      )}
                      Save Changes
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </main>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Account Section
// ─────────────────────────────────────────────────────────────────────────────

function AccountSection({ 
  profile, 
  setProfile 
}: { 
  profile: AdminProfile; 
  setProfile: (p: AdminProfile) => void;
}) {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-lg font-medium text-gray-900 dark:text-white">Account Information</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Your administrative profile details
        </p>
      </div>

      <div className="space-y-6">
        {/* Avatar */}
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center overflow-hidden">
            {profile.avatar ? (
              <img src={profile.avatar} alt="" className="w-full h-full object-cover" />
            ) : (
              <UserCircle className="w-10 h-10 text-gray-400" />
            )}
          </div>
          <div>
            <Button variant="outline" size="sm">Change Photo</Button>
            <p className="mt-1 text-xs text-gray-500">JPG, PNG up to 2MB</p>
          </div>
        </div>

        <Separator />

        {/* Name & Email */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="name" className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Full Name
            </Label>
            <div className="mt-1.5 relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                id="name"
                value={profile.name}
                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                className="pl-10"
                placeholder="Your full name"
              />
            </div>
          </div>
          <div>
            <Label htmlFor="email" className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Email Address
            </Label>
            <div className="mt-1.5 relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                id="email"
                type="email"
                value={profile.email}
                onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                className="pl-10"
                placeholder="admin@example.com"
              />
            </div>
          </div>
        </div>

        {/* Title & Department */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="title" className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Job Title
            </Label>
            <Input
              id="title"
              value={profile.title}
              onChange={(e) => setProfile({ ...profile, title: e.target.value })}
              className="mt-1.5"
              placeholder="Administrator"
            />
          </div>
          <div>
            <Label htmlFor="department" className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Department
            </Label>
            <Input
              id="department"
              value={profile.department}
              onChange={(e) => setProfile({ ...profile, department: e.target.value })}
              className="mt-1.5"
              placeholder="Property Management"
            />
          </div>
        </div>

        {/* Phone & Emergency Contact */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="phone" className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Phone Number
            </Label>
            <div className="mt-1.5 relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                id="phone"
                value={profile.phone}
                onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                className="pl-10"
                placeholder="+1 (555) 000-0000"
              />
            </div>
          </div>
          <div>
            <Label htmlFor="emergency" className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Emergency Contact
            </Label>
            <div className="mt-1.5 relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                id="emergency"
                value={profile.emergencyContact}
                onChange={(e) => setProfile({ ...profile, emergencyContact: e.target.value })}
                className="pl-10"
                placeholder="Emergency contact number"
              />
            </div>
          </div>
        </div>

        {/* Bio */}
        <div>
          <Label htmlFor="bio" className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Bio
          </Label>
          <Textarea
            id="bio"
            value={profile.bio}
            onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
            className="mt-1.5"
            placeholder="A brief description about yourself..."
            rows={3}
          />
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Community Section
// ─────────────────────────────────────────────────────────────────────────────

function CommunitySection({ 
  settings, 
  setSettings 
}: { 
  settings: CommunitySettings; 
  setSettings: (s: CommunitySettings) => void;
}) {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-lg font-medium text-gray-900 dark:text-white">Community Settings</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Configure your community details and preferences
        </p>
      </div>

      <div className="space-y-6">
        {/* Community Name */}
        <div>
          <Label htmlFor="community-name" className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Community Name
          </Label>
          <div className="mt-1.5 relative">
            <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              id="community-name"
              value={settings.communityName}
              onChange={(e) => setSettings({ ...settings, communityName: e.target.value })}
              className="pl-10"
              placeholder="Sunny Meadows Community"
            />
          </div>
        </div>

        {/* Timezone & Business Hours */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Timezone
            </Label>
            <Select
              value={settings.timezone}
              onValueChange={(value) => setSettings({ ...settings, timezone: value })}
            >
              <SelectTrigger className="mt-1.5">
                <Globe className="w-4 h-4 mr-2 text-gray-400" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="America/New_York">Eastern Time (ET)</SelectItem>
                <SelectItem value="America/Chicago">Central Time (CT)</SelectItem>
                <SelectItem value="America/Denver">Mountain Time (MT)</SelectItem>
                <SelectItem value="America/Los_Angeles">Pacific Time (PT)</SelectItem>
                <SelectItem value="UTC">UTC</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="business-hours" className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Business Hours
            </Label>
            <div className="mt-1.5 relative">
              <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                id="business-hours"
                value={settings.businessHours}
                onChange={(e) => setSettings({ ...settings, businessHours: e.target.value })}
                className="pl-10"
                placeholder="6:00 AM - 10:00 PM"
              />
            </div>
          </div>
        </div>

        <Separator />

        {/* Weekend Bookings Toggle */}
        <div className="flex items-center justify-between py-3 px-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
          <div className="flex-1 min-w-0 mr-4">
            <p className="text-sm font-medium text-gray-900 dark:text-white">Allow Weekend Bookings</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Enable amenity bookings on Saturdays and Sundays
            </p>
          </div>
          <Switch
            checked={settings.weekendBookings}
            onCheckedChange={(checked) => setSettings({ ...settings, weekendBookings: checked })}
          />
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Booking Rules Section
// ─────────────────────────────────────────────────────────────────────────────

function BookingRulesSection({ 
  settings, 
  setSettings 
}: { 
  settings: CommunitySettings; 
  setSettings: (s: CommunitySettings) => void;
}) {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-lg font-medium text-gray-900 dark:text-white">Booking Rules</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Configure booking limits and restrictions
        </p>
      </div>

      <div className="space-y-6">
        {/* Duration & Advance Days */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="max-duration" className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Max Booking Duration (Hours)
            </Label>
            <Input
              id="max-duration"
              type="number"
              min="1"
              max="24"
              value={settings.maxBookingDuration}
              onChange={(e) => setSettings({ ...settings, maxBookingDuration: e.target.value })}
              className="mt-1.5"
              placeholder="4"
            />
            <p className="mt-1 text-xs text-gray-500">Maximum hours per booking</p>
          </div>
          <div>
            <Label htmlFor="advance-days" className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Advance Booking Days
            </Label>
            <Input
              id="advance-days"
              type="number"
              min="1"
              max="90"
              value={settings.advanceBookingDays}
              onChange={(e) => setSettings({ ...settings, advanceBookingDays: e.target.value })}
              className="mt-1.5"
              placeholder="14"
            />
            <p className="mt-1 text-xs text-gray-500">How far in advance residents can book</p>
          </div>
        </div>

        {/* Cancellation & Max Active */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="cancellation" className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Cancellation Deadline (Hours)
            </Label>
            <Input
              id="cancellation"
              type="number"
              min="1"
              max="72"
              value={settings.cancellationDeadline}
              onChange={(e) => setSettings({ ...settings, cancellationDeadline: e.target.value })}
              className="mt-1.5"
              placeholder="24"
            />
            <p className="mt-1 text-xs text-gray-500">Hours before booking to allow cancellation</p>
          </div>
          <div>
            <Label htmlFor="max-active" className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Max Active Bookings
            </Label>
            <Input
              id="max-active"
              type="number"
              min="1"
              max="10"
              value={settings.maxActiveBookings}
              onChange={(e) => setSettings({ ...settings, maxActiveBookings: e.target.value })}
              className="mt-1.5"
              placeholder="3"
            />
            <p className="mt-1 text-xs text-gray-500">Per resident at any time</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Notifications Section
// ─────────────────────────────────────────────────────────────────────────────

function NotificationsSection({ 
  notifications, 
  setNotifications 
}: { 
  notifications: AdminNotifications; 
  setNotifications: (n: AdminNotifications) => void;
}) {
  const notificationGroups = [
    {
      title: 'Critical Alerts',
      description: 'High-priority notifications requiring immediate attention',
      items: [
        { key: 'criticalSystemAlerts', label: 'Critical System Alerts', description: 'System failures and critical issues' },
        { key: 'securityAlerts', label: 'Security Incidents', description: 'Unauthorized access attempts' },
        { key: 'emergencyNotifications', label: 'Emergency Notifications', description: 'Building emergencies and safety alerts' },
      ],
    },
    {
      title: 'Operational',
      description: 'Regular administrative notifications',
      items: [
        { key: 'newResidentAlerts', label: 'New Resident Registrations', description: 'When new residents sign up' },
        { key: 'maintenanceRequests', label: 'Maintenance Requests', description: 'New maintenance submissions' },
        { key: 'bookingIssues', label: 'Booking Issues', description: 'Conflicts and booking problems' },
      ],
    },
    {
      title: 'System',
      description: 'System and compliance updates',
      items: [
        { key: 'systemUpdates', label: 'System Updates', description: 'Platform updates and changes' },
        { key: 'reportAlerts', label: 'Report Notifications', description: 'Scheduled report completions' },
        { key: 'complianceNotifications', label: 'Compliance Alerts', description: 'Regulatory and compliance updates' },
      ],
    },
  ];

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-lg font-medium text-gray-900 dark:text-white">Notification Preferences</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Configure which alerts you receive as an administrator
        </p>
      </div>

      <div className="space-y-8">
        {notificationGroups.map((group) => (
          <div key={group.title}>
            <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-1">{group.title}</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">{group.description}</p>
            
            <div className="space-y-3">
              {group.items.map((item) => (
                <div 
                  key={item.key} 
                  className="flex items-center justify-between py-3 px-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg"
                >
                  <div className="flex-1 min-w-0 mr-4">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{item.label}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{item.description}</p>
                  </div>
                  <Switch
                    checked={notifications[item.key as keyof AdminNotifications]}
                    onCheckedChange={(checked) => 
                      setNotifications({ ...notifications, [item.key]: checked })
                    }
                  />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Appearance Section
// ─────────────────────────────────────────────────────────────────────────────

function AppearanceSection({ 
  theme, 
  setTheme 
}: { 
  theme: string | undefined; 
  setTheme: (t: 'light' | 'dark' | 'system') => void;
}) {
  const themes = [
    { value: 'light', label: 'Light', icon: Sun, description: 'A clean, bright interface' },
    { value: 'dark', label: 'Dark', icon: Moon, description: 'Easy on the eyes' },
    { value: 'system', label: 'System', icon: Monitor, description: 'Match your device settings' },
  ];

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-lg font-medium text-gray-900 dark:text-white">Appearance</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Customize the admin interface appearance
        </p>
      </div>

      <div>
        <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4 block">
          Theme
        </Label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {themes.map((option) => {
            const Icon = option.icon;
            const isActive = theme === option.value;
            
            return (
              <button
                key={option.value}
                onClick={() => setTheme(option.value as 'light' | 'dark' | 'system')}
                className={`
                  relative flex flex-col items-center gap-3 p-6 rounded-lg border-2 transition-all
                  ${isActive 
                    ? 'border-gray-900 dark:border-white bg-gray-50 dark:bg-gray-800' 
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  }
                `}
              >
                {isActive && (
                  <div className="absolute top-3 right-3">
                    <Check className="w-4 h-4 text-gray-900 dark:text-white" />
                  </div>
                )}
                <Icon className={`w-8 h-8 ${isActive ? 'text-gray-900 dark:text-white' : 'text-gray-400'}`} />
                <div className="text-center">
                  <p className={`text-sm font-medium ${isActive ? 'text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-400'}`}>
                    {option.label}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">{option.description}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Security Section
// ─────────────────────────────────────────────────────────────────────────────

function SecuritySection({ 
  passwords, 
  setPasswords,
  showPassword,
  setShowPassword,
  systemSettings,
  setSystemSettings,
}: { 
  passwords: { current: string; new: string; confirm: string };
  setPasswords: (p: { current: string; new: string; confirm: string }) => void;
  showPassword: boolean;
  setShowPassword: (s: boolean) => void;
  systemSettings: SystemSettings;
  setSystemSettings: (s: SystemSettings) => void;
}) {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-lg font-medium text-gray-900 dark:text-white">Security</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Manage administrator security settings
        </p>
      </div>

      <div className="space-y-6">
        {/* Change Password */}
        <div>
          <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-4">Change Password</h3>
          <div className="space-y-4">
            <div>
              <Label htmlFor="current-password" className="text-sm text-gray-700 dark:text-gray-300">
                Current Password
              </Label>
              <div className="mt-1.5 relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  id="current-password"
                  type={showPassword ? 'text' : 'password'}
                  value={passwords.current}
                  onChange={(e) => setPasswords({ ...passwords, current: e.target.value })}
                  className="pl-10 pr-10"
                  placeholder="Enter current password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="new-password" className="text-sm text-gray-700 dark:text-gray-300">
                  New Password
                </Label>
                <Input
                  id="new-password"
                  type={showPassword ? 'text' : 'password'}
                  value={passwords.new}
                  onChange={(e) => setPasswords({ ...passwords, new: e.target.value })}
                  className="mt-1.5"
                  placeholder="Enter new password"
                />
              </div>
              <div>
                <Label htmlFor="confirm-password" className="text-sm text-gray-700 dark:text-gray-300">
                  Confirm Password
                </Label>
                <Input
                  id="confirm-password"
                  type={showPassword ? 'text' : 'password'}
                  value={passwords.confirm}
                  onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                  className="mt-1.5"
                  placeholder="Confirm new password"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Password Requirements */}
        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
          <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Admin Password Requirements</h4>
          <ul className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
            <li>• Minimum 12 characters</li>
            <li>• Include uppercase and lowercase letters</li>
            <li>• Include numbers and special characters</li>
            <li>• Cannot reuse last 5 passwords</li>
          </ul>
        </div>

        <Separator />

        {/* Security Features */}
        <div>
          <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-4">Security Features</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between py-3 px-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
              <div className="flex-1 min-w-0 mr-4">
                <p className="text-sm font-medium text-gray-900 dark:text-white">Two-Factor Authentication</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Require 2FA for all admin access
                </p>
              </div>
              <Switch
                checked={systemSettings.twoFactorRequired}
                onCheckedChange={(checked) => setSystemSettings({ ...systemSettings, twoFactorRequired: checked })}
              />
            </div>
            <div className="flex items-center justify-between py-3 px-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
              <div className="flex-1 min-w-0 mr-4">
                <p className="text-sm font-medium text-gray-900 dark:text-white">Audit Logging</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Log all administrative actions
                </p>
              </div>
              <Switch
                checked={systemSettings.auditLogging}
                onCheckedChange={(checked) => setSystemSettings({ ...systemSettings, auditLogging: checked })}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// System Section
// ─────────────────────────────────────────────────────────────────────────────

function SystemSection({ 
  settings, 
  setSettings 
}: { 
  settings: SystemSettings; 
  setSettings: (s: SystemSettings) => void;
}) {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-lg font-medium text-gray-900 dark:text-white">System Settings</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Configure system-wide settings and maintenance options
        </p>
      </div>

      <div className="space-y-6">
        {/* Booking Approval Settings */}
        <div>
          <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-4">Booking Settings</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between py-3 px-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
              <div className="flex-1 min-w-0 mr-4">
                <p className="text-sm font-medium text-gray-900 dark:text-white">Auto-Approve Bookings</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Automatically approve new booking requests
                </p>
              </div>
              <Switch
                checked={settings.autoApproveBookings}
                onCheckedChange={(checked) => setSettings({ ...settings, autoApproveBookings: checked })}
              />
            </div>
            <div className="flex items-center justify-between py-3 px-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
              <div className="flex-1 min-w-0 mr-4">
                <p className="text-sm font-medium text-gray-900 dark:text-white">Allow Guest Bookings</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Allow residents to book for guests
                </p>
              </div>
              <Switch
                checked={settings.allowGuestBookings}
                onCheckedChange={(checked) => setSettings({ ...settings, allowGuestBookings: checked })}
              />
            </div>
          </div>
        </div>

        <Separator />

        {/* Data Management */}
        <div>
          <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-4">Data Management</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Backup Frequency
              </Label>
              <Select
                value={settings.backupFrequency}
                onValueChange={(value) => setSettings({ ...settings, backupFrequency: value })}
              >
                <SelectTrigger className="mt-1.5">
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
              <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Data Retention (Days)
              </Label>
              <Select
                value={settings.dataRetention}
                onValueChange={(value) => setSettings({ ...settings, dataRetention: value })}
              >
                <SelectTrigger className="mt-1.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="30">30 days</SelectItem>
                  <SelectItem value="90">90 days</SelectItem>
                  <SelectItem value="180">180 days</SelectItem>
                  <SelectItem value="365">1 year</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <Separator />

        {/* Maintenance Mode */}
        <div>
          <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-4">Maintenance</h3>
          <div className="flex items-center justify-between py-3 px-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-amber-900 dark:text-amber-100">Maintenance Mode</p>
                <p className="text-xs text-amber-700 dark:text-amber-300">
                  When enabled, residents cannot make new bookings
                </p>
              </div>
            </div>
            <Switch
              checked={settings.enableMaintenanceMode}
              onCheckedChange={(checked) => setSettings({ ...settings, enableMaintenanceMode: checked })}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
