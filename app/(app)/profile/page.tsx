'use client';

import { useState, useEffect, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { motion } from 'framer-motion';
import { collection, getDocs } from 'firebase/firestore';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  Building, 
  Edit,
  Shield,
  CheckCircle,
  Clock,
  Save,
  X,
  Loader2,
  ExternalLink,
  Sunrise,
  Waves,
  Star,
  Trophy
} from 'lucide-react';
import Link from 'next/link';
import useBookingStats from '@/hooks/useBookingStats';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { db } from '@/lib/firebase';

// ============================================================================
// TYPES
// ============================================================================

interface ProfileData {
  name: string;
  email: string;
  phone: string;
  location: string;
  company: string;
  bio: string;
  flatNumber?: string;
}

interface UserBadge {
  id: string;
  key: string;
  name: string;
  description: string;
  icon: string;
  earnedAt?: Date;
}

// ============================================================================
// ANIMATION CONFIG
// ============================================================================

const easeOut = "easeOut";
const duration = 0.2;

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const bookingStats = useBookingStats();
  
  const isAdmin = (session?.user as any)?.role === 'admin';
  const userFlatNumber = (session?.user as any)?.flatNumber;

  // Edit state
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [profileData, setProfileData] = useState<ProfileData>({
    name: '',
    email: '',
    phone: '',
    location: '',
    company: '',
    bio: '',
    flatNumber: '',
  });
  const [originalData, setOriginalData] = useState<ProfileData | null>(null);
  const [badges, setBadges] = useState<UserBadge[]>([]);
  const [badgesLoading, setBadgesLoading] = useState(true);

  // Initialize profile data from session
  useEffect(() => {
    if (session?.user) {
      const data: ProfileData = {
        name: session.user.name || '',
        email: session.user.email || '',
        phone: '',
        location: '',
        company: '',
        bio: '',
        flatNumber: userFlatNumber || '',
      };
      setProfileData(data);
      setOriginalData(data);
    }
  }, [session, userFlatNumber]);

  useEffect(() => {
    const loadBadges = async () => {
      if (!session?.user?.email) {
        setBadges([]);
        setBadgesLoading(false);
        return;
      }

      try {
        const snapshot = await getDocs(collection(db, 'users', session.user.email, 'badges'));
        const loaded = snapshot.docs.map((docSnapshot) => {
          const data = docSnapshot.data() as any;
          const earnedAt = data.earnedAt?.toDate ? data.earnedAt.toDate() : undefined;

          return {
            id: docSnapshot.id,
            key: data.key || docSnapshot.id,
            name: data.name || 'Badge',
            description: data.description || '',
            icon: data.icon || 'star',
            earnedAt,
          } as UserBadge;
        });

        loaded.sort((a, b) => (b.earnedAt?.getTime() || 0) - (a.earnedAt?.getTime() || 0));
        setBadges(loaded);
      } catch (error) {
        console.error('Failed to load badges:', error);
      } finally {
        setBadgesLoading(false);
      }
    };

    loadBadges();
  }, [session?.user?.email]);

  // Dirty state detection
  const isDirty = useMemo(() => {
    if (!originalData) return false;
    return JSON.stringify(profileData) !== JSON.stringify(originalData);
  }, [profileData, originalData]);

  // Handlers
  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    if (originalData) {
      setProfileData(originalData);
    }
    setIsEditing(false);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Simulate API call - replace with actual save logic
      await new Promise(resolve => setTimeout(resolve, 1000));
      setOriginalData(profileData);
      setIsEditing(false);
      toast.success('Profile updated successfully');
    } catch (error) {
      toast.error('Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const updateField = (field: keyof ProfileData, value: string) => {
    setProfileData(prev => ({ ...prev, [field]: value }));
  };

  // Computed values
  const initials = (profileData.name?.charAt(0) || profileData.email?.charAt(0) || 'U').toUpperCase();
  const memberSince = new Date().getFullYear(); // Replace with actual join date

  // Loading state
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 rounded-xl bg-gray-900 dark:bg-white flex items-center justify-center mx-auto mb-4">
            <Loader2 className="w-6 h-6 text-white dark:text-gray-900 animate-spin" />
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12">
        
        {/* ================================================================
            PAGE HEADER
        ================================================================ */}
        <motion.header 
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration, ease: easeOut }}
          className="mb-8"
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white">
                Profile
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                Manage your personal information and preferences
              </p>
            </div>
            
            {!isEditing ? (
              <Button
                onClick={handleEdit}
                variant="outline"
                className="h-10 px-4 border-gray-200 dark:border-gray-800 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <Edit className="w-4 h-4 mr-2" />
                Edit Profile
              </Button>
            ) : (
              <div className="flex items-center gap-2">
                <Button
                  onClick={handleCancel}
                  variant="ghost"
                  className="h-10 px-4"
                  disabled={isSaving}
                >
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={!isDirty || isSaving}
                  className="h-10 px-4 bg-gray-900 dark:bg-white text-white dark:text-gray-900 
                           hover:bg-gray-800 dark:hover:bg-gray-100"
                >
                  {isSaving ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  Save changes
                </Button>
              </div>
            )}
          </div>
        </motion.header>

        {/* ================================================================
            IDENTITY CARD
        ================================================================ */}
        <motion.section
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05, duration, ease: easeOut }}
          className="mb-6"
        >
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
              {/* Avatar */}
              <div className="relative flex-shrink-0">
                <Avatar className="w-20 h-20 sm:w-24 sm:h-24">
                  <AvatarImage src={session?.user?.image || ''} />
                  <AvatarFallback className={cn(
                    "text-2xl sm:text-3xl font-semibold",
                    isAdmin 
                      ? "bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400"
                      : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
                  )}>
                    {initials}
                  </AvatarFallback>
                </Avatar>
                {/* Verified indicator */}
                <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-white dark:bg-gray-900 border-2 border-white dark:border-gray-900 flex items-center justify-center">
                  <div className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                </div>
              </div>

              {/* Identity Info */}
              <div className="flex-1 text-center sm:text-left min-w-0">
                {isEditing ? (
                  <div className="space-y-3">
                    <Input
                      value={profileData.name}
                      onChange={(e) => updateField('name', e.target.value)}
                      placeholder="Your name"
                      className="h-10 text-lg font-semibold"
                    />
                  </div>
                ) : (
                  <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white truncate">
                    {profileData.name || 'No name set'}
                  </h2>
                )}

                {/* Role & Status Badges */}
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-3">
                  <Badge 
                    variant="secondary"
                    className={cn(
                      "text-xs font-medium px-2.5 py-0.5",
                      isAdmin 
                        ? "bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400"
                        : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
                    )}
                  >
                    <Shield className="w-3 h-3 mr-1" />
                    {isAdmin ? 'Administrator' : 'Resident'}
                  </Badge>
                  
                  {!isAdmin && userFlatNumber && (
                    <Badge variant="secondary" className="text-xs font-medium px-2.5 py-0.5 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400">
                      <Building className="w-3 h-3 mr-1" />
                      Flat {userFlatNumber}
                    </Badge>
                  )}

                  <Badge variant="secondary" className="text-xs font-medium px-2.5 py-0.5 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Verified
                  </Badge>
                </div>

                {/* Email & Member Since */}
                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-2 sm:gap-4 mt-4 text-sm text-gray-500 dark:text-gray-400">
                  <span className="flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5" />
                    {profileData.email}
                  </span>
                  <span className="hidden sm:inline text-gray-300 dark:text-gray-600">•</span>
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" />
                    Member since {memberSince}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </motion.section>

        {/* ================================================================
            CONTACT INFORMATION
        ================================================================ */}
        <motion.section
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration, ease: easeOut }}
          className="mb-6"
        >
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                Contact Information
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Your contact details and preferences
              </p>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {/* Email (Read-only) */}
                <ProfileField
                  label="Email Address"
                  icon={Mail}
                  value={profileData.email}
                  readOnly
                />

                {/* Phone */}
                <ProfileField
                  label="Phone Number"
                  icon={Phone}
                  value={profileData.phone}
                  placeholder="Not provided"
                  isEditing={isEditing}
                  onChange={(v) => updateField('phone', v)}
                />

                {/* Location */}
                <ProfileField
                  label="Location"
                  icon={MapPin}
                  value={profileData.location}
                  placeholder="Not provided"
                  isEditing={isEditing}
                  onChange={(v) => updateField('location', v)}
                />

                {/* Company */}
                <ProfileField
                  label="Company"
                  icon={Building}
                  value={profileData.company}
                  placeholder="Not provided"
                  isEditing={isEditing}
                  onChange={(v) => updateField('company', v)}
                />
              </div>
            </div>
          </div>
        </motion.section>

        {/* ================================================================
            BIO / ABOUT
        ================================================================ */}
        <motion.section
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration, ease: easeOut }}
          className="mb-6"
        >
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                About
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                A brief description about yourself
              </p>
            </div>
            
            <div className="p-6">
              {isEditing ? (
                <Textarea
                  value={profileData.bio}
                  onChange={(e) => updateField('bio', e.target.value)}
                  placeholder="Write a short bio about yourself..."
                  className="min-h-[100px] resize-none"
                  rows={4}
                />
              ) : (
                <p className={cn(
                  "text-sm leading-relaxed",
                  profileData.bio 
                    ? "text-gray-700 dark:text-gray-300" 
                    : "text-gray-400 dark:text-gray-500 italic"
                )}>
                  {profileData.bio || "No bio provided yet. Click \"Edit Profile\" to add information about yourself."}
                </p>
              )}
            </div>
          </div>
        </motion.section>

        {/* ================================================================
            ACCOUNT & ROLE (Trust Layer)
        ================================================================ */}
        <motion.section
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration, ease: easeOut }}
          className="mb-6"
        >
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                Account & Security
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Your account status and permissions
              </p>
            </div>
            
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              <AccountRow
                label="Role"
                value={isAdmin ? 'Administrator' : 'Resident'}
                description={isAdmin ? 'Full access to all community features' : 'Standard community member access'}
                highlight={isAdmin}
              />
              <AccountRow
                label="Account Status"
                value="Active"
                description="Your account is in good standing"
                status="success"
              />
              <AccountRow
                label="Email Verified"
                value="Verified"
                description={profileData.email}
                status="success"
              />
              <AccountRow
                label="Community"
                value={(session?.user as any)?.communityName || 'Sunny Meadows'}
                description="Your residential community"
              />
            </div>
          </div>
        </motion.section>

        {/* ================================================================
            ACTIVITY SUMMARY (Compact)
        ================================================================ */}
        <motion.section
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration, ease: easeOut }}
          className="mb-6"
        >
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                  Booking Activity
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  Your recent booking statistics
                </p>
              </div>
              <Link href="/bookings">
                <Button variant="ghost" size="sm" className="h-8 text-xs">
                  View all
                  <ExternalLink className="w-3 h-3 ml-1.5" />
                </Button>
              </Link>
            </div>
            
            <div className="p-6">
              {bookingStats.loading ? (
                <div className="grid grid-cols-1 xs:grid-cols-3 gap-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="text-center">
                      <Skeleton className="h-8 w-12 mx-auto mb-2" />
                      <Skeleton className="h-4 w-16 mx-auto" />
                    </div>
                  ))}
                </div>
              ) : bookingStats.error ? (
                <div className="text-center py-4">
                  <p className="text-sm text-gray-500 dark:text-gray-400">Unable to load statistics</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 xs:grid-cols-3 gap-4">
                  <StatCard label="Total" value={bookingStats.totalBookings} />
                  <StatCard label="Active" value={bookingStats.activeBookings} variant="success" />
                  <StatCard label="Favorites" value={bookingStats.favoriteAmenities} variant="highlight" />
                </div>
              )}

              {/* Most booked amenity - compact */}
              {bookingStats.mostBookedAmenity && !bookingStats.loading && (
                <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500 dark:text-gray-400">Most booked</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {bookingStats.mostBookedAmenity}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </motion.section>

        {/* ================================================================
            BADGES
        ================================================================ */}
        <motion.section
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.27, duration, ease: easeOut }}
          className="mb-6"
        >
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-amber-500" />
                  Reputation Badges
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  Earn badges through bookings and community participation
                </p>
              </div>
              <Badge variant="secondary" className="text-xs">
                {badges.length} earned
              </Badge>
            </div>

            <div className="p-6">
              {badgesLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-16 rounded-lg" />
                  ))}
                </div>
              ) : badges.length === 0 ? (
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  No badges yet. Join polls and keep booking amenities to unlock them.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {badges.map((badge) => (
                    <div
                      key={badge.id}
                      className="flex items-start gap-3 rounded-lg border border-gray-200 dark:border-gray-800 px-3.5 py-3"
                    >
                      <div className="w-9 h-9 rounded-lg bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                        <BadgeIcon icon={badge.icon} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{badge.name}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{badge.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </motion.section>

        {/* ================================================================
            QUICK ACTIONS
        ================================================================ */}
        <motion.section
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration, ease: easeOut }}
        >
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <QuickAction
              href={isAdmin ? "/admin/settings" : "/settings"}
              icon={User}
              label="Settings"
            />
            <QuickAction
              href="/bookings"
              icon={Calendar}
              label="Bookings"
            />
            {isAdmin && (
              <>
                <QuickAction
                  href="/admin"
                  icon={Shield}
                  label="Admin Panel"
                />
                <QuickAction
                  href="/admin/users"
                  icon={User}
                  label="Manage Users"
                />
              </>
            )}
          </div>
        </motion.section>
      </div>
    </div>
  );
}

// ============================================================================
// PROFILE FIELD COMPONENT
// ============================================================================

interface ProfileFieldProps {
  label: string;
  icon: React.ElementType;
  value: string;
  placeholder?: string;
  readOnly?: boolean;
  isEditing?: boolean;
  onChange?: (value: string) => void;
}

function ProfileField({ label, icon: Icon, value, placeholder = 'Not provided', readOnly, isEditing, onChange }: ProfileFieldProps) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium text-gray-500 dark:text-gray-400">
        {label}
      </Label>
      {isEditing && !readOnly ? (
        <div className="relative">
          <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            value={value}
            onChange={(e) => onChange?.(e.target.value)}
            placeholder={placeholder}
            className="pl-10 h-10"
          />
        </div>
      ) : (
        <div className="flex items-center gap-2.5 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
          <Icon className="w-4 h-4 text-gray-400 flex-shrink-0" />
          <span className={cn(
            "text-sm truncate",
            value ? "text-gray-900 dark:text-white" : "text-gray-400 dark:text-gray-500"
          )}>
            {value || placeholder}
          </span>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// ACCOUNT ROW COMPONENT
// ============================================================================

interface AccountRowProps {
  label: string;
  value: string;
  description: string;
  status?: 'success' | 'warning' | 'error';
  highlight?: boolean;
}

function AccountRow({ label, value, description, status, highlight }: AccountRowProps) {
  const statusColors = {
    success: 'text-emerald-600 dark:text-emerald-400',
    warning: 'text-amber-600 dark:text-amber-400',
    error: 'text-red-600 dark:text-red-400',
  };

  return (
    <div className="px-6 py-4 flex items-center justify-between gap-4">
      <div className="min-w-0">
        <p className="text-sm font-medium text-gray-900 dark:text-white">
          {label}
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
          {description}
        </p>
      </div>
      <span className={cn(
        "text-sm font-medium flex-shrink-0",
        status ? statusColors[status] : highlight ? "text-violet-600 dark:text-violet-400" : "text-gray-700 dark:text-gray-300"
      )}>
        {value}
      </span>
    </div>
  );
}

// ============================================================================
// STAT CARD COMPONENT
// ============================================================================

interface StatCardProps {
  label: string;
  value: number;
  variant?: 'default' | 'success' | 'highlight';
}

function StatCard({ label, value, variant = 'default' }: StatCardProps) {
  const variants = {
    default: 'text-gray-900 dark:text-white',
    success: 'text-emerald-600 dark:text-emerald-400',
    highlight: 'text-violet-600 dark:text-violet-400',
  };

  return (
    <div className="text-center">
      <div className={cn("text-2xl font-semibold", variants[variant])}>
        {value}
      </div>
      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
        {label}
      </div>
    </div>
  );
}

// ============================================================================
// QUICK ACTION COMPONENT
// ============================================================================

interface QuickActionProps {
  href: string;
  icon: React.ElementType;
  label: string;
}

function QuickAction({ href, icon: Icon, label }: QuickActionProps) {
  return (
    <Link href={href}>
      <div className="flex flex-col items-center gap-2 p-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl hover:border-gray-300 dark:hover:border-gray-700 hover:shadow-sm transition-all cursor-pointer">
        <Icon className="w-5 h-5 text-gray-500 dark:text-gray-400" />
        <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{label}</span>
      </div>
    </Link>
  );
}

function BadgeIcon({ icon }: { icon: string }) {
  if (icon === 'sunrise') {
    return <Sunrise className="w-4 h-4" />;
  }

  if (icon === 'waves') {
    return <Waves className="w-4 h-4" />;
  }

  return <Star className="w-4 h-4" />;
}
