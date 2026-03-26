'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  Key,
  Users,
  Copy,
  CheckCircle,
  Plus,
  Trash2,
  AlertTriangle,
  Search,
  X,
  RefreshCw,
  Shield,
  Loader2,
  MoreHorizontal,
  Clock,
  Filter,
  ChevronDown
} from 'lucide-react';
import { toast } from 'sonner';
import { useCommunityTimeZone } from '@/components/providers/community-branding-provider';
import { formatDateInTimeZone } from '@/lib/timezone';
import { collection, query, where, getDocs, doc, setDoc, serverTimestamp, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { cn } from '@/lib/utils';

// ============================================================================
// TYPES
// ============================================================================

interface AccessCode {
  id: string;
  communityId: string;
  isUsed: boolean;
  usedBy?: string;
  usedAt?: any;
  createdAt: any;
  type: string;
  description?: string;
}

interface User {
  id: string;
  name?: string;
  email: string;
  role: string;
  communityId: string;
  createdAt: any;
  lastLogin: any;
}

type CodeFilter = 'all' | 'available' | 'used';
type RoleFilter = 'all' | 'admin' | 'resident';

// ============================================================================
// ANIMATION CONFIG
// ============================================================================

const easeOut = "easeOut";
const duration = 0.2;

const toTitleCase = (value: string) =>
  value
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ');

const getFallbackNameFromEmail = (email?: string) => {
  if (!email) return 'Unknown User';
  const local = email.split('@')[0] || '';
  const cleaned = local.replace(/[._-]+/g, ' ').trim();
  return cleaned ? toTitleCase(cleaned) : 'Unknown User';
};

const getUserDisplayName = (user: User) => {
  const preferred = user.name?.trim();
  return preferred || getFallbackNameFromEmail(user.email);
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function ManageUsers() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  // Data state
  const [accessCodes, setAccessCodes] = useState<AccessCode[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  
  // Filter & search state
  const [globalSearch, setGlobalSearch] = useState('');
  const [codeFilter, setCodeFilter] = useState<CodeFilter>('all');
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('all');
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // ============================================================================
  // AUTH & DATA FETCHING
  // ============================================================================

  useEffect(() => {
    if (status === 'loading') return;
    if (!session?.user?.email || session.user.role !== 'admin') {
      router.push('/dashboard');
      return;
    }
    fetchData();
  }, [session, status, router]);

  const fetchData = useCallback(async () => {
    try {
      if (!session?.user?.communityId) return;
      
      const [codesSnapshot, usersSnapshot] = await Promise.all([
        getDocs(query(collection(db, 'accessCodes'), where('communityId', '==', session.user.communityId))),
        getDocs(query(collection(db, 'users'), where('communityId', '==', session.user.communityId)))
      ]);
      
      setAccessCodes(codesSnapshot.docs.map(d => ({ id: d.id, ...d.data() } as AccessCode)));
      setUsers(
        usersSnapshot.docs.map((d) => {
          const raw = d.data() as any;
          const email = String(raw.email || d.id || '').trim();
          const preferredName =
            raw.name ||
            raw.displayName ||
            raw.fullName ||
            raw.userName ||
            (email && email === session?.user?.email ? session?.user?.name : '');

          return {
            id: d.id,
            ...raw,
            email,
            name: typeof preferredName === 'string' ? preferredName.trim() : '',
          } as User;
        })
      );
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [session?.user?.communityId]);

  // ============================================================================
  // COMPUTED VALUES (KPIs & Filtered Data)
  // ============================================================================

  const stats = useMemo(() => ({
    totalUsers: users.length,
    activeResidents: users.filter(u => u.role === 'resident').length,
    admins: users.filter(u => u.role === 'admin').length,
    totalCodes: accessCodes.length,
    usedCodes: accessCodes.filter(c => c.isUsed).length,
    availableCodes: accessCodes.filter(c => !c.isUsed).length,
  }), [users, accessCodes]);

  const filteredCodes = useMemo(() => {
    let result = accessCodes;
    
    // Apply code filter
    if (codeFilter === 'available') result = result.filter(c => !c.isUsed);
    else if (codeFilter === 'used') result = result.filter(c => c.isUsed);
    
    // Apply global search
    if (globalSearch.trim()) {
      const search = globalSearch.toLowerCase();
      result = result.filter(c => 
        c.id.toLowerCase().includes(search) ||
        c.usedBy?.toLowerCase().includes(search)
      );
    }
    
    return result.sort((a, b) => {
      // Available codes first, then by ID
      if (a.isUsed !== b.isUsed) return a.isUsed ? 1 : -1;
      return a.id.localeCompare(b.id);
    });
  }, [accessCodes, codeFilter, globalSearch]);

  const filteredUsers = useMemo(() => {
    let result = users;
    
    // Apply role filter
    if (roleFilter !== 'all') result = result.filter(u => u.role === roleFilter);
    
    // Apply global search
    if (globalSearch.trim()) {
      const search = globalSearch.toLowerCase();
      result = result.filter(u => 
        getUserDisplayName(u).toLowerCase().includes(search) ||
        u.email.toLowerCase().includes(search)
      );
    }
    
    return result.sort((a, b) => {
      // Admins first, then by name
      if (a.role !== b.role) return a.role === 'admin' ? -1 : 1;
      return getUserDisplayName(a).localeCompare(getUserDisplayName(b));
    });
  }, [users, roleFilter, globalSearch]);

  const hasActiveFilters = codeFilter !== 'all' || roleFilter !== 'all' || globalSearch.trim();

  // ============================================================================
  // ACTIONS
  // ============================================================================

  const generateAccessCode = async () => {
    setActionLoading('generate');
    try {
      if (!session?.user?.communityId) return;
      const code = Math.random().toString(36).substr(2, 8).toUpperCase();
      
      await setDoc(doc(db, 'accessCodes', code), {
        communityId: session.user.communityId,
        isUsed: false,
        createdAt: serverTimestamp(),
        type: 'resident',
        description: `Generated by ${session.user.name || session.user.email}`
      });
      
      toast.success(`Access code ${code} generated`);
      await navigator.clipboard.writeText(code);
      toast.success('Code copied to clipboard');
      fetchData();
    } catch (error) {
      console.error('Error generating access code:', error);
      toast.error('Failed to generate access code');
    } finally {
      setActionLoading(null);
    }
  };

  const deleteAccessCode = async (codeId: string) => {
    setActionLoading(codeId);
    try {
      await deleteDoc(doc(db, 'accessCodes', codeId));
      toast.success('Access code revoked');
      fetchData();
    } catch (error) {
      console.error('Error deleting access code:', error);
      toast.error('Failed to revoke access code');
    } finally {
      setActionLoading(null);
    }
  };

  const replaceUsedCode = async (usedCodeId: string) => {
    setActionLoading(usedCodeId);
    try {
      const response = await fetch('/api/access-codes/auto-replace', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usedCodeId }),
      });
      const data = await response.json();

      if (response.ok) {
        toast.success(`New code ${data.newCode} generated`);
        await navigator.clipboard.writeText(data.newCode);
        toast.success('New code copied to clipboard');
        fetchData();
      } else {
        toast.error(data.error || 'Failed to replace code');
      }
    } catch (error) {
      console.error('Error replacing code:', error);
      toast.error('Failed to replace code');
    } finally {
      setActionLoading(null);
    }
  };

  const deleteUser = async (userId: string, userEmail: string) => {
    setActionLoading(userId);
    const loadingToast = toast.loading(`Removing ${userEmail}...`);
    
    try {
      const response = await fetch('/api/admin/delete-resident', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, userEmail }),
      });
      const data = await response.json();
      toast.dismiss(loadingToast);

      if (response.ok) {
        toast.success(`User removed (${data.deletedData.bookings} bookings deleted)`);
        fetchData();
      } else {
        toast.error(data.error || 'Failed to remove user');
      }
    } catch (error) {
      toast.dismiss(loadingToast);
      console.error('Error deleting user:', error);
      toast.error('Failed to remove user');
    } finally {
      setActionLoading(null);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  const clearFilters = () => {
    setGlobalSearch('');
    setCodeFilter('all');
    setRoleFilter('all');
  };

  // ============================================================================
  // LOADING STATE
  // ============================================================================

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 rounded-xl bg-gray-900 dark:bg-white flex items-center justify-center mx-auto mb-4">
            <Loader2 className="w-6 h-6 text-white dark:text-gray-900 animate-spin" />
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">Loading user management...</p>
        </div>
      </div>
    );
  }

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12">
        
        {/* ================================================================
            PAGE HEADER (Sticky on scroll)
        ================================================================ */}
        <motion.header 
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration, ease: easeOut }}
          className="mb-6 sm:mb-8"
        >
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            {/* Title */}
            <div className="flex items-center gap-4">
              <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-gray-900 dark:bg-white flex items-center justify-center flex-shrink-0">
                <Shield className="w-5 h-5 sm:w-6 sm:h-6 text-white dark:text-gray-900" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white">
                  Manage Users
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Access control & community membership
                </p>
              </div>
            </div>
            
            {/* Search + Primary Action */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3">
              {/* Global Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  value={globalSearch}
                  onChange={(e) => setGlobalSearch(e.target.value)}
                  placeholder="Search users or codes..."
                  className="pl-9 pr-8 h-10 w-full sm:w-64 bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800"
                />
                {globalSearch && (
                  <button
                    onClick={() => setGlobalSearch('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
              
              {/* Generate Code Button */}
              <Button
                onClick={generateAccessCode}
                disabled={actionLoading === 'generate'}
                className="h-10 px-4 w-full sm:w-auto bg-gray-900 dark:bg-white text-white dark:text-gray-900
                         hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors"
              >
                {actionLoading === 'generate' ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Plus className="w-4 h-4 mr-2" />
                )}
                Generate Code
              </Button>
            </div>
          </div>
        </motion.header>

        {/* ================================================================
            KPI SUMMARY ROW
        ================================================================ */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05, duration, ease: easeOut }}
          className="mb-6 sm:mb-8"
        >
          <div className="flex flex-wrap gap-2 sm:gap-3">
            <StatChip label="Total Users" value={stats.totalUsers} />
            <StatChip label="Residents" value={stats.activeResidents} />
            <StatChip label="Admins" value={stats.admins} variant="highlight" />
            <div className="hidden sm:block w-px h-8 bg-gray-200 dark:bg-gray-800 self-center mx-1" />
            <StatChip label="Access Codes" value={stats.totalCodes} />
            <StatChip label="Available" value={stats.availableCodes} variant="success" />
            <StatChip label="Used" value={stats.usedCodes} variant="muted" />
          </div>
        </motion.div>

        {/* ================================================================
            ACCESS CODES SECTION
        ================================================================ */}
        <motion.section
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration, ease: easeOut }}
          className="mb-8 sm:mb-10"
        >
          {/* Section Header with Filters */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
            <div>
              <h2 className="text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <Key className="w-4 h-4 text-gray-400" />
                Access Codes
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                {filteredCodes.length} of {accessCodes.length} codes
              </p>
            </div>
            
            {/* Filter Pills - Desktop */}
            <div className="hidden sm:flex items-center gap-2">
              <FilterPill 
                active={codeFilter === 'all'} 
                onClick={() => setCodeFilter('all')}
                label="All"
              />
              <FilterPill 
                active={codeFilter === 'available'} 
                onClick={() => setCodeFilter('available')}
                label="Available"
                count={stats.availableCodes}
              />
              <FilterPill 
                active={codeFilter === 'used'} 
                onClick={() => setCodeFilter('used')}
                label="Used"
                count={stats.usedCodes}
              />
            </div>

            {/* Filter Dropdown - Mobile */}
            <div className="sm:hidden">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="h-8 text-xs">
                    <Filter className="w-3.5 h-3.5 mr-1.5" />
                    {codeFilter === 'all' ? 'All Codes' : codeFilter === 'available' ? 'Available' : 'Used'}
                    <ChevronDown className="w-3.5 h-3.5 ml-1.5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setCodeFilter('all')}>All Codes</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setCodeFilter('available')}>Available ({stats.availableCodes})</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setCodeFilter('used')}>Used ({stats.usedCodes})</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Codes List */}
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
            {filteredCodes.length > 0 ? (
              <div className="divide-y divide-gray-100 dark:divide-gray-800">
                {filteredCodes.map((code) => (
                  <CodeRow
                    key={code.id}
                    code={code}
                    onCopy={() => copyToClipboard(code.id)}
                    onReplace={() => replaceUsedCode(code.id)}
                    onRevoke={() => deleteAccessCode(code.id)}
                    isLoading={actionLoading === code.id}
                  />
                ))}
              </div>
            ) : (
              <EmptyState
                icon={Key}
                title="No access codes"
                description={hasActiveFilters ? "Try adjusting your filters" : "Generate your first access code to invite residents"}
                action={!hasActiveFilters && (
                  <Button onClick={generateAccessCode} size="sm" className="mt-3">
                    <Plus className="w-4 h-4 mr-2" />
                    Generate Code
                  </Button>
                )}
              />
            )}
          </div>
        </motion.section>

        {/* ================================================================
            COMMUNITY MEMBERS SECTION
        ================================================================ */}
        <motion.section
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration, ease: easeOut }}
        >
          {/* Section Header with Filters */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
            <div>
              <h2 className="text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-gray-400" />
                Community Members
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                {filteredUsers.length} of {users.length} registered users
              </p>
            </div>
            
            {/* Filter Pills - Desktop */}
            <div className="hidden sm:flex items-center gap-2">
              <FilterPill 
                active={roleFilter === 'all'} 
                onClick={() => setRoleFilter('all')}
                label="All"
              />
              <FilterPill 
                active={roleFilter === 'admin'} 
                onClick={() => setRoleFilter('admin')}
                label="Admins"
                count={stats.admins}
              />
              <FilterPill 
                active={roleFilter === 'resident'} 
                onClick={() => setRoleFilter('resident')}
                label="Residents"
                count={stats.activeResidents}
              />
            </div>

            {/* Filter Dropdown - Mobile */}
            <div className="sm:hidden">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="h-8 text-xs">
                    <Filter className="w-3.5 h-3.5 mr-1.5" />
                    {roleFilter === 'all' ? 'All Roles' : roleFilter === 'admin' ? 'Admins' : 'Residents'}
                    <ChevronDown className="w-3.5 h-3.5 ml-1.5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setRoleFilter('all')}>All Roles</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setRoleFilter('admin')}>Admins ({stats.admins})</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setRoleFilter('resident')}>Residents ({stats.activeResidents})</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Users List */}
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
            {filteredUsers.length > 0 ? (
              <div className="divide-y divide-gray-100 dark:divide-gray-800">
                {filteredUsers.map((user) => (
                  <UserRow
                    key={user.id}
                    user={user}
                    onDelete={() => deleteUser(user.id, user.email)}
                    isLoading={actionLoading === user.id}
                  />
                ))}
              </div>
            ) : (
              <EmptyState
                icon={Users}
                title="No users found"
                description={hasActiveFilters ? "Try adjusting your filters" : "Users will appear here once they register"}
              />
            )}
          </div>
        </motion.section>

        {/* ================================================================
            CLEAR FILTERS BAR (Conditional)
        ================================================================ */}
        {hasActiveFilters && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="fixed bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-1.5rem)] sm:w-auto max-w-md"
          >
            <Button
              onClick={clearFilters}
              variant="outline"
              size="sm"
              className="h-9 w-full sm:w-auto px-4 bg-white dark:bg-gray-900 shadow-lg border-gray-200 dark:border-gray-700"
            >
              <X className="w-3.5 h-3.5 mr-2" />
              Clear all filters
            </Button>
          </motion.div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// STAT CHIP COMPONENT
// ============================================================================

interface StatChipProps {
  label: string;
  value: number;
  variant?: 'default' | 'success' | 'muted' | 'highlight';
}

function StatChip({ label, value, variant = 'default' }: StatChipProps) {
  const variants = {
    default: 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300',
    success: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400',
    muted: 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-500',
    highlight: 'bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-400',
  };

  return (
    <div className={cn(
      "inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium",
      variants[variant]
    )}>
      <span className="text-[10px] uppercase tracking-wider opacity-70">{label}</span>
      <span className="font-semibold">{value}</span>
    </div>
  );
}

// ============================================================================
// FILTER PILL COMPONENT
// ============================================================================

interface FilterPillProps {
  active: boolean;
  onClick: () => void;
  label: string;
  count?: number;
}

function FilterPill({ active, onClick, label, count }: FilterPillProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150",
        active 
          ? "bg-gray-900 dark:bg-white text-white dark:text-gray-900"
          : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
      )}
    >
      {label}
      {count !== undefined && (
        <span className={cn("ml-1.5", active ? "opacity-70" : "opacity-50")}>
          {count}
        </span>
      )}
    </button>
  );
}

// ============================================================================
// CODE ROW COMPONENT
// ============================================================================

interface CodeRowProps {
  code: AccessCode;
  onCopy: () => void;
  onReplace: () => void;
  onRevoke: () => void;
  isLoading: boolean;
}

function CodeRow({ code, onCopy, onReplace, onRevoke, isLoading }: CodeRowProps) {
  const timeZone = useCommunityTimeZone();
  const createdDate = code.createdAt?.toDate?.() ? formatDateInTimeZone(code.createdAt.toDate(), timeZone, {
    month: 'short', day: 'numeric' 
  }) : 'Unknown';

  return (
    <div className={cn(
      "flex items-center justify-between gap-4 px-4 py-3 transition-colors",
      code.isUsed 
        ? "bg-gray-50/50 dark:bg-gray-900/50" 
        : "hover:bg-gray-50 dark:hover:bg-gray-800/50"
    )}>
      {/* Left: Icon + Code */}
      <div className="flex items-center gap-3 min-w-0">
        <div className={cn(
          "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0",
          code.isUsed 
            ? "bg-gray-100 dark:bg-gray-800" 
            : "bg-emerald-100 dark:bg-emerald-900/30"
        )}>
          {code.isUsed ? (
            <CheckCircle className="w-4 h-4 text-gray-400 dark:text-gray-500" />
          ) : (
            <Key className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          )}
        </div>
        <div className="min-w-0">
          <p className={cn(
            "font-mono text-sm font-semibold",
            code.isUsed ? "text-gray-400 dark:text-gray-500" : "text-gray-900 dark:text-white"
          )}>
            {code.id}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
            {code.isUsed ? `Used by ${code.usedBy}` : `Created ${createdDate}`}
          </p>
        </div>
      </div>

      {/* Right: Status + Actions */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <Badge 
          variant="secondary"
          className={cn(
            "text-[10px] px-2 py-0.5 hidden sm:inline-flex",
            code.isUsed 
              ? "bg-gray-100 dark:bg-gray-800 text-gray-500" 
              : "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400"
          )}
        >
          {code.isUsed ? 'Used' : 'Available'}
        </Badge>

        {/* Desktop Actions */}
        <div className="hidden sm:flex items-center gap-1">
          {!code.isUsed && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onCopy}
              className="h-8 w-8 p-0 text-gray-500 hover:text-gray-700"
              title="Copy code"
            >
              <Copy className="w-3.5 h-3.5" />
            </Button>
          )}
          {code.isUsed && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onReplace}
              disabled={isLoading}
              className="h-8 px-2 text-xs text-amber-600 hover:text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-900/20"
              title="Replace with new code"
            >
              {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5 mr-1" />}
              Replace
            </Button>
          )}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                title="Revoke code"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="max-w-sm">
              <AlertDialogHeader>
                <AlertDialogTitle>Revoke Access Code</AlertDialogTitle>
                <AlertDialogDescription className="text-sm">
                  Delete code <span className="font-mono font-semibold">{code.id}</span>?
                  {code.isUsed && " This code has already been used."}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="text-sm">Cancel</AlertDialogCancel>
                <AlertDialogAction 
                  onClick={onRevoke}
                  className="bg-red-600 hover:bg-red-700 text-sm"
                >
                  Revoke
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>

        {/* Mobile Actions */}
        <div className="sm:hidden">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreHorizontal className="w-4 h-4 text-gray-500" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {!code.isUsed && (
                <DropdownMenuItem onClick={onCopy}>
                  <Copy className="w-4 h-4 mr-2" />
                  Copy Code
                </DropdownMenuItem>
              )}
              {code.isUsed && (
                <DropdownMenuItem onClick={onReplace}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Replace Code
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onRevoke} className="text-red-600 focus:text-red-600">
                <Trash2 className="w-4 h-4 mr-2" />
                Revoke Code
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// USER ROW COMPONENT
// ============================================================================

interface UserRowProps {
  user: User;
  onDelete: () => void;
  isLoading: boolean;
}

function UserRow({ user, onDelete, isLoading }: UserRowProps) {
  const isAdmin = user.role === 'admin';
  const timeZone = useCommunityTimeZone();
  const displayName = getUserDisplayName(user);
  const joinDate = user.createdAt?.toDate?.() ? formatDateInTimeZone(user.createdAt.toDate(), timeZone, {
    month: 'short', day: 'numeric', year: 'numeric' 
  }) : 'Unknown';
  const initials = (displayName.charAt(0) || user.email.charAt(0) || 'U').toUpperCase();

  return (
    <div className="flex items-center justify-between gap-4 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
      {/* Left: Avatar + Info */}
      <div className="flex items-center gap-3 min-w-0">
        <div className={cn(
          "w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-semibold",
          isAdmin 
            ? "bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400" 
            : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
        )}>
          {initials}
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
              {displayName}
            </p>
            <Badge 
              variant="secondary"
              className={cn(
                "text-[10px] px-1.5 py-0 h-4",
                isAdmin 
                  ? "bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400" 
                  : "bg-gray-100 dark:bg-gray-800 text-gray-500"
              )}
            >
              {user.role}
            </Badge>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user.email}</p>
        </div>
      </div>

      {/* Right: Join Date + Actions */}
      <div className="flex items-center gap-3 flex-shrink-0">
        <span className="hidden md:flex items-center gap-1 text-xs text-gray-400">
          <Clock className="w-3 h-3" />
          {joinDate}
        </span>

        {/* Desktop Delete */}
        {!isAdmin && (
          <div className="hidden sm:block">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                  title="Remove user"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="max-w-sm">
                <AlertDialogHeader>
                  <AlertDialogTitle className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-red-600" />
                    Remove User
                  </AlertDialogTitle>
                  <AlertDialogDescription className="text-sm space-y-2">
                    <p>Remove <strong>{displayName || user.email}</strong>?</p>
                    <p className="text-red-600 text-xs">
                      This permanently deletes the user, all bookings, and notifications.
                    </p>
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="text-sm">Cancel</AlertDialogCancel>
                  <AlertDialogAction 
                    onClick={onDelete}
                    disabled={isLoading}
                    className="bg-red-600 hover:bg-red-700 text-sm"
                  >
                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                    Remove
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )}

        {/* Mobile Actions */}
        <div className="sm:hidden">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreHorizontal className="w-4 h-4 text-gray-500" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem disabled className="text-xs text-gray-400">
                Joined {joinDate}
              </DropdownMenuItem>
              {!isAdmin && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={onDelete} className="text-red-600 focus:text-red-600">
                    <Trash2 className="w-4 h-4 mr-2" />
                    Remove User
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// EMPTY STATE COMPONENT
// ============================================================================

interface EmptyStateProps {
  icon: React.ElementType;
  title: string;
  description: string;
  action?: React.ReactNode;
}

function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="text-center py-12 px-4">
      <div className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-4">
        <Icon className="w-6 h-6 text-gray-400" />
      </div>
      <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-1">{title}</h3>
      <p className="text-xs text-gray-500 dark:text-gray-400">{description}</p>
      {action}
    </div>
  );
}
