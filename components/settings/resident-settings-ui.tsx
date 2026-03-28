'use client';

import { useState, useEffect, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/components/providers/theme-provider';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { getResidentPasswordValidationError } from '@/lib/validation';
import { EmailAuthProvider, reauthenticateWithCredential, updatePassword } from 'firebase/auth';
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
  Compass,
  Download,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';
import { registerPushNotifications } from '@/lib/push-notifications';

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
  weeklyDigest: boolean;
  smsAlerts: boolean;
}

interface ResidentPrivacy {
  showProfile: boolean;
  showBookings: boolean;
  shareContactInfo: boolean;
  allowDirectMessages: boolean;
  profileVisibility: string;
}

interface AccountDeletionRequestStatus {
  status: 'requested' | 'approved' | 'rejected';
  requestedAt?: string;
  reviewedAt?: string;
  reviewNote?: string;
  reason?: string;
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

const DEFAULT_NOTIFICATIONS: ResidentNotifications = {
  bookingReminders: true,
  communityUpdates: true,
  maintenanceAlerts: true,
  eventNotifications: true,
  emergencyAlerts: true,
  pushNotifications: false,
  emailDigest: true,
  weeklyDigest: true,
  smsAlerts: false,
};

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
    ...DEFAULT_NOTIFICATIONS,
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
  const [originalTheme, setOriginalTheme] = useState<string | undefined>(undefined);
  
  // Password state
  const [passwords, setPasswords] = useState({
    current: '',
    new: '',
    confirm: '',
  });
  const [deletionRequestStatus, setDeletionRequestStatus] = useState<AccountDeletionRequestStatus | null>(null);

  // ─────────────────────────────────────────────────────────────────────────────
  // Load settings from localStorage
  // ─────────────────────────────────────────────────────────────────────────────
  
  useEffect(() => {
    if (!session?.user?.email) return;

    const loadSettings = async () => {
      const initialProfile: ResidentProfile = {
        name: session.user?.name || '',
        email: session.user?.email || '',
        phone: '',
        flatNumber: '',
        emergencyContact: '',
        bio: '',
        avatar: session.user?.image || '',
      };

      const storageKey = `resident-settings-${session.user.email}`;
      let loadedFromFirestore = false;

      try {
        const userRef = doc(db, 'users', session.user.email);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          const userData = userSnap.data() as any;
          const persistedSettings = userData.residentSettings;
          const persistedNotifications = userData.notificationPreferences;
          const persistedDeletionRequest = userData.deletionRequest as AccountDeletionRequestStatus | undefined;

          if (persistedSettings?.profile) {
            const nextProfile = {
              ...initialProfile,
              ...persistedSettings.profile,
            } as ResidentProfile;
            setProfile(nextProfile);
            setOriginalProfile(nextProfile);
            loadedFromFirestore = true;
          }

          if (persistedSettings?.notifications || persistedNotifications) {
            const nextNotifications = {
              ...DEFAULT_NOTIFICATIONS,
              ...(persistedSettings?.notifications || {}),
              ...(persistedNotifications || {}),
            } as ResidentNotifications;
            setNotifications(nextNotifications);
            setOriginalNotifications(nextNotifications);
            loadedFromFirestore = true;
          }

          if (persistedSettings?.privacy) {
            const nextPrivacy = {
              ...privacy,
              ...persistedSettings.privacy,
            } as ResidentPrivacy;
            setPrivacy(nextPrivacy);
            setOriginalPrivacy(nextPrivacy);
            loadedFromFirestore = true;
          }

          if (persistedSettings?.appearance?.theme) {
            const persistedTheme = String(persistedSettings.appearance.theme) as 'light' | 'dark' | 'system';
            setTheme(persistedTheme);
            setOriginalTheme(persistedTheme);
            loadedFromFirestore = true;
          }

          if (persistedDeletionRequest?.status) {
            setDeletionRequestStatus(persistedDeletionRequest);
            loadedFromFirestore = true;
          }
        }
      } catch (error) {
        console.error('Failed to load settings from Firestore:', error);
      }

      if (!loadedFromFirestore) {
        const savedSettings = localStorage.getItem(storageKey);
        if (savedSettings) {
          try {
            const parsed = JSON.parse(savedSettings);
            if (parsed.profile) {
              const nextProfile = { ...initialProfile, ...parsed.profile };
              setProfile(nextProfile);
              setOriginalProfile(nextProfile);
            } else {
              setProfile(initialProfile);
              setOriginalProfile(initialProfile);
            }

            if (parsed.notifications) {
              const nextNotifications = { ...DEFAULT_NOTIFICATIONS, ...parsed.notifications };
              setNotifications(nextNotifications);
              setOriginalNotifications(nextNotifications);
            } else {
              setNotifications(DEFAULT_NOTIFICATIONS);
              setOriginalNotifications(DEFAULT_NOTIFICATIONS);
            }

            if (parsed.privacy) {
              setPrivacy(parsed.privacy);
              setOriginalPrivacy(parsed.privacy);
            } else {
              setOriginalPrivacy(privacy);
            }

            if (parsed.appearance?.theme) {
              const savedTheme = String(parsed.appearance.theme) as 'light' | 'dark' | 'system';
              setTheme(savedTheme);
              setOriginalTheme(savedTheme);
            } else {
              setOriginalTheme(theme);
            }
          } catch (e) {
            console.error('Failed to load local settings:', e);
            setProfile(initialProfile);
            setOriginalProfile(initialProfile);
            setNotifications(DEFAULT_NOTIFICATIONS);
            setOriginalNotifications(DEFAULT_NOTIFICATIONS);
            setOriginalPrivacy(privacy);
            setOriginalTheme(theme);
          }
        } else {
          setProfile(initialProfile);
          setOriginalProfile(initialProfile);
          setNotifications(DEFAULT_NOTIFICATIONS);
          setOriginalNotifications(DEFAULT_NOTIFICATIONS);
          setOriginalPrivacy(privacy);
          setOriginalTheme(theme);
        }
      }
    };

    void loadSettings();
  }, [session?.user?.email]);

  // ─────────────────────────────────────────────────────────────────────────────
  // Dirty state detection
  // ─────────────────────────────────────────────────────────────────────────────
  
  const isDirty = useMemo(() => {
    if (!originalProfile || !originalNotifications || !originalPrivacy) return false;
    
    const profileDirty = JSON.stringify(profile) !== JSON.stringify(originalProfile);
    const notificationsDirty = JSON.stringify(notifications) !== JSON.stringify(originalNotifications);
    const privacyDirty = JSON.stringify(privacy) !== JSON.stringify(originalPrivacy);
    const themeDirty = (theme || 'system') !== (originalTheme || 'system');
    const passwordDirty = passwords.current || passwords.new || passwords.confirm;
    
    return profileDirty || notificationsDirty || privacyDirty || themeDirty || !!passwordDirty;
  }, [profile, originalProfile, notifications, originalNotifications, privacy, originalPrivacy, theme, originalTheme, passwords]);

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
        const passwordValidationError = getResidentPasswordValidationError(passwords.new, 8);
        if (passwordValidationError) {
          toast.error(passwordValidationError);
          setIsLoading(false);
          return;
        }

        const currentUser = auth.currentUser;
        if (!currentUser || !currentUser.email) {
          toast.error('Could not verify your account. Please sign in again.');
          setIsLoading(false);
          return;
        }

        const providerIds = (currentUser.providerData || []).map((item) => item.providerId);
        if (!providerIds.includes('password')) {
          toast.error('Password change is only available for email/password sign-ins.');
          setIsLoading(false);
          return;
        }

        try {
          const credential = EmailAuthProvider.credential(currentUser.email, passwords.current);
          await reauthenticateWithCredential(currentUser, credential);
          await updatePassword(currentUser, passwords.new);
        } catch (passwordError: any) {
          const code = String(passwordError?.code || '');
          if (code.includes('auth/wrong-password')) {
            toast.error('Current password is incorrect.');
          } else if (code.includes('auth/too-many-requests')) {
            toast.error('Too many attempts. Please wait and try again.');
          } else {
            toast.error('Failed to update password.');
          }
          setIsLoading(false);
          return;
        }
      }
      
      // Save to localStorage
      const storageKey = `resident-settings-${session.user.email}`;
      localStorage.setItem(storageKey, JSON.stringify({
        profile,
        notifications,
        privacy,
        appearance: {
          theme: theme || 'system',
        },
        updatedAt: new Date().toISOString(),
      }));

      // Persist in Firestore as source of truth for notification jobs
      await setDoc(
        doc(db, 'users', session.user.email),
        {
          residentSettings: {
            profile,
            notifications,
            privacy,
            appearance: {
              theme: theme || 'system',
            },
            updatedAt: new Date().toISOString(),
          },
          notificationPreferences: notifications,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      if (notifications.pushNotifications) {
        await registerPushNotifications();
      }
      
      // Update original states
      setOriginalProfile(profile);
      setOriginalNotifications(notifications);
      setOriginalPrivacy(privacy);
      setOriginalTheme(theme || 'system');
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
    if (originalTheme) {
      setTheme(originalTheme as 'light' | 'dark' | 'system');
    }
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
            userEmail={session?.user?.email || ''}
            deletionRequestStatus={deletionRequestStatus}
            setDeletionRequestStatus={setDeletionRequestStatus}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100/50 dark:from-slate-950 dark:via-slate-950 dark:to-slate-900/50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Settings</h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Manage your account preferences and settings
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            className="gap-2 w-full sm:w-auto"
            onClick={() => {
              window.dispatchEvent(new Event('circlein-restart-tour'));
              toast.success('Onboarding tour restarted');
            }}
          >
            <Compass className="w-4 h-4" />
            Restart Tour
          </Button>
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
                  className="mt-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-3 sm:p-4"
                >
                  <div className="flex items-start sm:items-center gap-2 text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>You have unsaved changes</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full sm:w-auto">
                    <Button
                      variant="outline"
                      onClick={handleCancel}
                      disabled={isLoading}
                      className="gap-1.5 sm:gap-2 flex-1 sm:flex-none text-xs sm:text-sm px-3 sm:px-4 h-9 sm:h-10"
                    >
                      <X className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      Cancel
                    </Button>
                    <Button
                      onClick={handleSave}
                      disabled={isLoading}
                      className="gap-1.5 sm:gap-2 flex-1 sm:flex-none text-xs sm:text-sm px-3 sm:px-4 h-9 sm:h-10 bg-gray-900 hover:bg-gray-800 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100"
                    >
                      {isLoading ? (
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                          className="w-3.5 h-3.5 sm:w-4 sm:h-4 border-2 border-white dark:border-gray-900 border-t-transparent rounded-full"
                        />
                      ) : (
                        <Save className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      )}
                      <span>Save Changes</span>
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
        { key: 'emailDigest', label: 'Email Notifications', description: 'Important updates by email' },
        { key: 'weeklyDigest', label: 'Weekly Digest', description: 'Weekly snapshot of bookings and community news' },
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
  userEmail,
  deletionRequestStatus,
  setDeletionRequestStatus,
}: { 
  passwords: { current: string; new: string; confirm: string };
  setPasswords: (p: { current: string; new: string; confirm: string }) => void;
  showPassword: boolean;
  setShowPassword: (s: boolean) => void;
  userEmail: string;
  deletionRequestStatus: AccountDeletionRequestStatus | null;
  setDeletionRequestStatus: (value: AccountDeletionRequestStatus | null) => void;
}) {
  const [isExporting, setIsExporting] = useState(false);
  const [isRequestingDeletion, setIsRequestingDeletion] = useState(false);

  const handleExportData = async () => {
    setIsExporting(true);
    try {
      const response = await fetch('/api/account/export', {
        method: 'GET',
      });

      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}));
        toast.error(errorBody?.error || 'Failed to export account data');
        return;
      }

      const blob = await response.blob();
      const downloadUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `circlein-data-export-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(downloadUrl);

      toast.success('Data export generated successfully');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export account data');
    } finally {
      setIsExporting(false);
    }
  };

  const handleDeletionRequest = async () => {
    if (!userEmail) {
      toast.error('Could not verify your account. Please sign in again.');
      return;
    }

    const confirmationText = window.prompt('Type DELETE to confirm account deletion request.');

    if (confirmationText === null) {
      toast.info('Deletion request cancelled');
      return;
    }

    setIsRequestingDeletion(true);
    try {
      const response = await fetch('/api/account/delete-request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          confirmationText,
          reason: 'Requested by resident from settings.',
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        toast.error(data?.error || 'Failed to submit deletion request');
        return;
      }

      setDeletionRequestStatus({
        status: 'requested',
        requestedAt: new Date().toISOString(),
        reason: 'Requested by resident from settings.',
      });

      toast.success('Deletion request submitted to community admins');
    } catch (error) {
      console.error('Deletion request error:', error);
      toast.error('Failed to submit deletion request');
    } finally {
      setIsRequestingDeletion(false);
    }
  };

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

        <Separator />

        <div>
          <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-4">Data Rights</h3>
          <div className="space-y-3">
            <div className="rounded-lg border border-gray-200 dark:border-gray-800 p-4 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white">Export your account data</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Download your profile, bookings, maintenance requests, and notifications as JSON.
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={handleExportData}
                disabled={isExporting}
                className="gap-2"
              >
                <Download className="w-5 h-5" />
                {isExporting ? 'Preparing Export...' : 'Export Data'}
              </Button>
            </div>

            <div className="rounded-lg border border-red-200 dark:border-red-900/40 bg-red-50/50 dark:bg-red-950/20 p-4 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="text-sm font-medium text-red-700 dark:text-red-300">Request account deletion</p>
                <p className="text-xs text-red-700/80 dark:text-red-300/80 mt-1">
                  Submit a deletion request for admin review. This action is auditable and cannot be undone automatically.
                </p>
                {deletionRequestStatus?.status && (
                  <p className="mt-2 text-xs font-medium text-red-700 dark:text-red-300">
                    Current status: {deletionRequestStatus.status}
                    {deletionRequestStatus.requestedAt ? ` · requested ${new Date(deletionRequestStatus.requestedAt).toLocaleString()}` : ''}
                    {deletionRequestStatus.reviewedAt ? ` · reviewed ${new Date(deletionRequestStatus.reviewedAt).toLocaleString()}` : ''}
                  </p>
                )}
                {deletionRequestStatus?.reviewNote && (
                  <p className="mt-1 text-xs text-red-700/80 dark:text-red-300/80">
                    Admin note: {deletionRequestStatus.reviewNote}
                  </p>
                )}
              </div>
              <Button
                type="button"
                variant="destructive"
                onClick={handleDeletionRequest}
                disabled={isRequestingDeletion || deletionRequestStatus?.status === 'requested'}
                className="gap-2"
              >
                <Trash2 className="w-5 h-5" />
                {isRequestingDeletion
                  ? 'Submitting...'
                  : deletionRequestStatus?.status === 'requested'
                  ? 'Request Pending'
                  : 'Request Deletion'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
