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
  Home,
  UserCircle,
} from 'lucide-react';
import { toast } from 'sonner';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface ResidentProfile {
  name: string;
  email: string;
  phone: string;
  flatNumber: string;
  emergencyContact: string;
  bio: string;
  avatar: string;
}

interface ResidentNotifications {
  bookingReminders: boolean;
  communityUpdates: boolean;
  maintenanceAlerts: boolean;
  eventNotifications: boolean;
  emergencyAlerts: boolean;
  pushNotifications: boolean;
  emailDigest: boolean;
  smsAlerts: boolean;
}

interface ResidentPrivacy {
  showProfile: boolean;
  showBookings: boolean;
  shareContactInfo: boolean;
  allowDirectMessages: boolean;
  profileVisibility: string;
}

type SettingsSection = 'account' | 'notifications' | 'privacy' | 'appearance' | 'security';

// ─────────────────────────────────────────────────────────────────────────────
// Navigation Items
// ─────────────────────────────────────────────────────────────────────────────

const navigationItems: { id: SettingsSection; label: string; icon: typeof User; description: string }[] = [
  { id: 'account', label: 'Account', icon: User, description: 'Your profile information' },
  { id: 'notifications', label: 'Notifications', icon: Bell, description: 'How you receive alerts' },
  { id: 'privacy', label: 'Privacy', icon: Shield, description: 'Control your visibility' },
  { id: 'appearance', label: 'Appearance', icon: Palette, description: 'Theme and display' },
  { id: 'security', label: 'Security', icon: Lock, description: 'Password and authentication' },
];

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

export default function ResidentSettingsUI() {
  const { data: session } = useSession();
  const { theme, setTheme } = useTheme();
  
  // Active section
  const [activeSection, setActiveSection] = useState<SettingsSection>('account');
  
  // Loading & saving states
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  // Profile state
  const [profile, setProfile] = useState<ResidentProfile>({
    name: '',
    email: '',
    phone: '',
    flatNumber: '',
    emergencyContact: '',
    bio: '',
    avatar: '',
  });
  
  // Original profile for dirty checking
  const [originalProfile, setOriginalProfile] = useState<ResidentProfile | null>(null);
  
  // Notifications state
  const [notifications, setNotifications] = useState<ResidentNotifications>({
    bookingReminders: true,
    communityUpdates: true,
    maintenanceAlerts: true,
    eventNotifications: true,
    emergencyAlerts: true,
    pushNotifications: false,
    emailDigest: true,
    smsAlerts: false,
  });
  
  const [originalNotifications, setOriginalNotifications] = useState<ResidentNotifications | null>(null);
  
  // Privacy state
  const [privacy, setPrivacy] = useState<ResidentPrivacy>({
    showProfile: true,
    showBookings: false,
    shareContactInfo: false,
    allowDirectMessages: true,
    profileVisibility: 'residents',
  });
  
  const [originalPrivacy, setOriginalPrivacy] = useState<ResidentPrivacy | null>(null);
  
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
      const storageKey = `resident-settings-${session.user.email}`;
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
          if (parsed.privacy) {
            setPrivacy(parsed.privacy);
            setOriginalPrivacy(parsed.privacy);
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
          flatNumber: '',
          emergencyContact: '',
          bio: '',
          avatar: session.user.image || '',
        };
        setProfile(initialProfile);
        setOriginalProfile(initialProfile);
        setOriginalNotifications(notifications);
        setOriginalPrivacy(privacy);
      }
    }
  }, [session]);

  // ─────────────────────────────────────────────────────────────────────────────
  // Dirty state detection
  // ─────────────────────────────────────────────────────────────────────────────
  
  const isDirty = useMemo(() => {
    if (!originalProfile || !originalNotifications || !originalPrivacy) return false;
    
    const profileDirty = JSON.stringify(profile) !== JSON.stringify(originalProfile);
    const notificationsDirty = JSON.stringify(notifications) !== JSON.stringify(originalNotifications);
    const privacyDirty = JSON.stringify(privacy) !== JSON.stringify(originalPrivacy);
    const passwordDirty = passwords.current || passwords.new || passwords.confirm;
    
    return profileDirty || notificationsDirty || privacyDirty || !!passwordDirty;
  }, [profile, originalProfile, notifications, originalNotifications, privacy, originalPrivacy, passwords]);

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
        if (passwords.new.length < 8) {
          toast.error('Password must be at least 8 characters');
          setIsLoading(false);
          return;
        }
      }
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Save to localStorage
      const storageKey = `resident-settings-${session.user.email}`;
      localStorage.setItem(storageKey, JSON.stringify({
        profile,
        notifications,
        privacy,
        updatedAt: new Date().toISOString(),
      }));
      
      // Update original states
      setOriginalProfile(profile);
      setOriginalNotifications(notifications);
      setOriginalPrivacy(privacy);
      setPasswords({ current: '', new: '', confirm: '' });
      
      toast.success('Settings saved successfully');
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
    if (originalPrivacy) setPrivacy(originalPrivacy);
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
      case 'notifications':
        return <NotificationsSection notifications={notifications} setNotifications={setNotifications} />;
      case 'privacy':
        return <PrivacySection privacy={privacy} setPrivacy={setPrivacy} />;
      case 'appearance':
        return <AppearanceSection theme={theme} setTheme={setTheme} />;
      case 'security':
        return (
          <SecuritySection 
            passwords={passwords} 
            setPasswords={setPasswords}
            showPassword={showPassword}
            setShowPassword={setShowPassword}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Settings</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Manage your account preferences and settings
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
  profile: ResidentProfile; 
  setProfile: (p: ResidentProfile) => void;
}) {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-lg font-medium text-gray-900 dark:text-white">Account Information</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Update your personal details and contact information
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
                placeholder="you@example.com"
              />
            </div>
          </div>
        </div>

        {/* Phone & Flat */}
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
            <Label htmlFor="flat" className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Unit / Flat Number
            </Label>
            <div className="mt-1.5 relative">
              <Home className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                id="flat"
                value={profile.flatNumber}
                onChange={(e) => setProfile({ ...profile, flatNumber: e.target.value })}
                className="pl-10"
                placeholder="A-101"
              />
            </div>
          </div>
        </div>

        {/* Emergency Contact */}
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
          <p className="mt-1.5 text-xs text-gray-500">
            This number will be contacted in case of emergencies
          </p>
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
          <p className="mt-1.5 text-xs text-gray-500">
            Visible to other residents based on your privacy settings
          </p>
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
  notifications: ResidentNotifications; 
  setNotifications: (n: ResidentNotifications) => void;
}) {
  const notificationGroups = [
    {
      title: 'Activity',
      description: 'Notifications about your bookings and community events',
      items: [
        { key: 'bookingReminders', label: 'Booking Reminders', description: 'Get reminded before your bookings start' },
        { key: 'communityUpdates', label: 'Community Updates', description: 'News and updates from your community' },
        { key: 'eventNotifications', label: 'Event Notifications', description: 'Upcoming events and gatherings' },
      ],
    },
    {
      title: 'Alerts',
      description: 'Important alerts and maintenance notifications',
      items: [
        { key: 'maintenanceAlerts', label: 'Maintenance Alerts', description: 'Scheduled maintenance and disruptions' },
        { key: 'emergencyAlerts', label: 'Emergency Alerts', description: 'Critical safety and emergency notifications' },
      ],
    },
    {
      title: 'Delivery Methods',
      description: 'How you want to receive notifications',
      items: [
        { key: 'pushNotifications', label: 'Push Notifications', description: 'Browser and mobile push alerts' },
        { key: 'emailDigest', label: 'Email Digest', description: 'Daily summary of notifications' },
        { key: 'smsAlerts', label: 'SMS Alerts', description: 'Text message notifications' },
      ],
    },
  ];

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-lg font-medium text-gray-900 dark:text-white">Notification Preferences</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Choose what notifications you receive and how
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
                    checked={notifications[item.key as keyof ResidentNotifications]}
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
// Privacy Section
// ─────────────────────────────────────────────────────────────────────────────

function PrivacySection({ 
  privacy, 
  setPrivacy 
}: { 
  privacy: ResidentPrivacy; 
  setPrivacy: (p: ResidentPrivacy) => void;
}) {
  const privacyItems = [
    { key: 'showProfile', label: 'Show Profile', description: 'Allow others to view your profile page' },
    { key: 'showBookings', label: 'Show Bookings', description: 'Display your upcoming bookings to neighbors' },
    { key: 'shareContactInfo', label: 'Share Contact Info', description: 'Allow neighbors to see your contact details' },
    { key: 'allowDirectMessages', label: 'Allow Direct Messages', description: 'Let other residents message you directly' },
  ];

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-lg font-medium text-gray-900 dark:text-white">Privacy Settings</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Control who can see your information
        </p>
      </div>

      <div className="space-y-6">
        {/* Profile Visibility Dropdown */}
        <div>
          <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Profile Visibility
          </Label>
          <Select
            value={privacy.profileVisibility}
            onValueChange={(value) => setPrivacy({ ...privacy, profileVisibility: value })}
          >
            <SelectTrigger className="mt-1.5 w-full md:w-64">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="public">Everyone</SelectItem>
              <SelectItem value="residents">Residents Only</SelectItem>
              <SelectItem value="neighbors">Close Neighbors</SelectItem>
              <SelectItem value="private">Private</SelectItem>
            </SelectContent>
          </Select>
          <p className="mt-1.5 text-xs text-gray-500">
            Choose who can discover and view your profile
          </p>
        </div>

        <Separator />

        {/* Privacy Toggles */}
        <div className="space-y-3">
          {privacyItems.map((item) => (
            <div 
              key={item.key} 
              className="flex items-center justify-between py-3 px-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg"
            >
              <div className="flex-1 min-w-0 mr-4">
                <p className="text-sm font-medium text-gray-900 dark:text-white">{item.label}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{item.description}</p>
              </div>
              <Switch
                checked={privacy[item.key as keyof ResidentPrivacy] as boolean}
                onCheckedChange={(checked) => 
                  setPrivacy({ ...privacy, [item.key]: checked })
                }
              />
            </div>
          ))}
        </div>
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
          Customize how the app looks and feels
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
}: { 
  passwords: { current: string; new: string; confirm: string };
  setPasswords: (p: { current: string; new: string; confirm: string }) => void;
  showPassword: boolean;
  setShowPassword: (s: boolean) => void;
}) {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-lg font-medium text-gray-900 dark:text-white">Security</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Manage your password and security settings
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

        <Separator />

        {/* Two-Factor Authentication */}
        <div>
          <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-4">Two-Factor Authentication</h3>
          <div className="flex items-center justify-between py-3 px-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
            <div className="flex-1 min-w-0 mr-4">
              <p className="text-sm font-medium text-gray-900 dark:text-white">SMS Verification</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Receive verification codes via SMS when signing in
              </p>
            </div>
            <Switch />
          </div>
        </div>

        {/* Security Tips */}
        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
          <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Password Requirements</h4>
          <ul className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
            <li>• At least 8 characters long</li>
            <li>• Include uppercase and lowercase letters</li>
            <li>• Include at least one number</li>
            <li>• Include at least one special character</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
