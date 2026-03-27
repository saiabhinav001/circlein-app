'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
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
  ChevronDown,
  History,
  ExternalLink,
  Download,
} from 'lucide-react';
import { toast } from 'sonner';
import { useCommunityTimeZone } from '@/components/providers/community-branding-provider';
import { formatDateInTimeZone } from '@/lib/timezone';
import { collection, query, where, getDocs, doc, setDoc, serverTimestamp, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { cn } from '@/lib/utils';
import TypedConfirmDialog from '@/components/ui/typed-confirm-dialog';

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

interface DeletionRequest {
  id: string;
  userEmail?: string;
  userName?: string;
  status?: string;
  reason?: string;
  requestedAt?: string;
  reviewNote?: string | null;
  reviewedBy?: string;
  reviewedAt?: string;
  deletionExecuted?: boolean;
  deletionExecutionResult?: {
    bookings?: number;
    notifications?: number;
    [key: string]: any;
  } | null;
}

type CodeFilter = 'all' | 'available' | 'used';
type RoleFilter = 'all' | 'admin' | 'resident';

type PendingTypedAction =
  | { kind: 'revoke-code'; codeId: string }
  | { kind: 'delete-user'; userId: string; userEmail: string }
  | { kind: 'approve-delete-now'; requestId: string; userEmail: string; reviewNote: string };

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
  const [deletionRequests, setDeletionRequests] = useState<DeletionRequest[]>([]);
  const [deletionReviewNotes, setDeletionReviewNotes] = useState<Record<string, string>>({});
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [historyRequests, setHistoryRequests] = useState<DeletionRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [pendingTypedAction, setPendingTypedAction] = useState<PendingTypedAction | null>(null);
  
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

      const deletionResponse = await fetch('/api/account/delete-request/admin?status=requested', {
        cache: 'no-store',
      });
      const deletionData = await deletionResponse.json().catch(() => ({}));
      if (!deletionResponse.ok) {
        throw new Error(deletionData?.error || 'Failed to load deletion requests');
      }
      
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
      const requests = Array.isArray(deletionData?.requests) ? deletionData.requests : [];
      setDeletionRequests(requests);
      setDeletionReviewNotes((prev) => {
        const next = { ...prev };
        for (const item of requests) {
          const existing = next[item.id];
          if (typeof existing !== 'string') {
            next[item.id] = String(item.reviewNote || '');
          }
        }
        return next;
      });
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

  const reviewedHistory = useMemo(
    () =>
      historyRequests
        .filter((item) => item.status === 'approved' || item.status === 'rejected')
        .sort((a, b) => {
          const aTs = new Date(a.reviewedAt || a.requestedAt || 0).getTime();
          const bTs = new Date(b.reviewedAt || b.requestedAt || 0).getTime();
          return bTs - aTs;
        }),
    [historyRequests]
  );

  const formatDateTime = (value?: string) => {
    if (!value) return 'Unknown';
    const dt = new Date(value);
    if (Number.isNaN(dt.getTime())) return 'Unknown';
    return dt.toLocaleString();
  };

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

  const executeDeleteAccessCode = async (codeId: string, confirmationText: string) => {
    if (confirmationText.trim().toUpperCase() !== 'DELETE') {
      toast.error('Confirmation text mismatch. Type DELETE to continue.');
      return false;
    }

    setActionLoading(codeId);
    try {
      await deleteDoc(doc(db, 'accessCodes', codeId));
      toast.success('Access code revoked');
      fetchData();
      return true;
    } catch (error) {
      console.error('Error deleting access code:', error);
      toast.error('Failed to revoke access code');
      return false;
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

  const executeDeleteUser = async (userId: string, userEmail: string, confirmationText: string) => {
    if (confirmationText.trim().toUpperCase() !== 'DELETE') {
      toast.error('Confirmation text mismatch. Type DELETE to continue.');
      return false;
    }

    setActionLoading(userId);
    const loadingToast = toast.loading(`Removing ${userEmail}...`);
    
    try {
      const response = await fetch('/api/admin/delete-resident', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, userEmail, confirmationText }),
      });
      const data = await response.json();
      toast.dismiss(loadingToast);

      if (response.ok) {
        toast.success(`User removed (${data.deletedData.bookings} bookings deleted)`);
        fetchData();
        return true;
      } else {
        toast.error(data.error || 'Failed to remove user');
        return false;
      }
    } catch (error) {
      toast.dismiss(loadingToast);
      console.error('Error deleting user:', error);
      toast.error('Failed to remove user');
      return false;
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

  const exportAuditLogs = async () => {
    setActionLoading('audit-export');
    try {
      const response = await fetch('/api/admin/audit-logs/export?format=csv');
      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}));
        throw new Error(errorBody?.error || 'Failed to export audit logs');
      }

      const blob = await response.blob();
      const downloadUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `circlein-audit-logs-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(downloadUrl);

      toast.success('Audit logs exported');
    } catch (error: any) {
      console.error('Audit export failed:', error);
      toast.error(error?.message || 'Failed to export audit logs');
    } finally {
      setActionLoading(null);
    }
  };

  const reviewDeletionRequest = async (
    requestId: string,
    status: 'approved' | 'rejected',
    options?: { executeDeletion?: boolean; reviewNote?: string; confirmationText?: string }
  ) => {
    const executeDeletion = Boolean(options?.executeDeletion);
    const reviewNote = String(options?.reviewNote || '').trim();
    const confirmationText = String(options?.confirmationText || '').trim();
    const loadingKey = `deletion-${requestId}-${status}${executeDeletion ? '-execute' : ''}`;
    setActionLoading(loadingKey);

    try {
      const response = await fetch(`/api/account/delete-request/admin/${requestId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status,
          executeDeletion,
          confirmationText,
          reviewNote:
            reviewNote ||
            (executeDeletion
              ? 'Approved and executed from user management panel.'
              : 'Reviewed from user management panel.'),
        }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        toast.error(data?.error || 'Failed to review deletion request');
        return false;
      }

      const successMessage =
        status === 'approved'
          ? executeDeletion
            ? 'Request approved and deletion executed'
            : 'Deletion request approved'
          : 'Deletion request rejected';

      toast.success(successMessage);
      setDeletionReviewNotes((prev) => ({ ...prev, [requestId]: '' }));
      fetchData();
      return true;
    } catch (error) {
      console.error('Error reviewing deletion request:', error);
      toast.error('Failed to review deletion request');
      return false;
    } finally {
      setActionLoading(null);
    }
  };

  const requestTypedConfirmation = (action: PendingTypedAction) => {
    setPendingTypedAction(action);
  };

  const handleTypedConfirmation = async (confirmationText: string) => {
    if (!pendingTypedAction) {
      return;
    }

    let success = false;

    if (pendingTypedAction.kind === 'revoke-code') {
      success = await executeDeleteAccessCode(pendingTypedAction.codeId, confirmationText);
    }

    if (pendingTypedAction.kind === 'delete-user') {
      success = await executeDeleteUser(
        pendingTypedAction.userId,
        pendingTypedAction.userEmail,
        confirmationText
      );
    }

    if (pendingTypedAction.kind === 'approve-delete-now') {
      success = await reviewDeletionRequest(pendingTypedAction.requestId, 'approved', {
        executeDeletion: true,
        confirmationText,
        reviewNote: pendingTypedAction.reviewNote,
      });
    }

    if (success) {
      setPendingTypedAction(null);
    }
  };

  const typedConfirmationTitle =
    pendingTypedAction?.kind === 'revoke-code'
      ? 'Revoke Access Code'
      : pendingTypedAction?.kind === 'delete-user'
      ? 'Delete User'
      : pendingTypedAction?.kind === 'approve-delete-now'
      ? 'Approve And Delete Account'
      : '';

  const typedConfirmationDescription =
    pendingTypedAction?.kind === 'revoke-code'
      ? `This will permanently revoke code ${pendingTypedAction.codeId}.`
      : pendingTypedAction?.kind === 'delete-user'
      ? `This will permanently remove ${pendingTypedAction.userEmail} and associated data.`
      : pendingTypedAction?.kind === 'approve-delete-now'
      ? `This will approve and permanently delete ${pendingTypedAction.userEmail || 'this user'} immediately.`
      : '';

  const typedConfirmationActionKey =
    pendingTypedAction?.kind === 'revoke-code'
      ? pendingTypedAction.codeId
      : pendingTypedAction?.kind === 'delete-user'
      ? pendingTypedAction.userId
      : pendingTypedAction?.kind === 'approve-delete-now'
      ? `deletion-${pendingTypedAction.requestId}-approved-execute`
      : '';

  const openHistoryDrawer = async () => {
    setHistoryOpen(true);
    setHistoryLoading(true);
    setHistoryError(null);

    try {
      const response = await fetch('/api/account/delete-request/admin?status=all', {
        cache: 'no-store',
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data?.error || 'Failed to load request history');
      }
      setHistoryRequests(Array.isArray(data?.requests) ? data.requests : []);
    } catch (error: any) {
      console.error('Error loading deletion request history:', error);
      setHistoryError(error?.message || 'Failed to load request history');
    } finally {
      setHistoryLoading(false);
    }
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
            PENDING DELETION REQUESTS (Inline Admin Review)
        ================================================================ */}
        <motion.section
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08, duration, ease: easeOut }}
          className="mb-8 sm:mb-10"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                Pending Deletion Requests
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                {deletionRequests.length} request{deletionRequests.length === 1 ? '' : 's'} waiting for review
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs"
                onClick={exportAuditLogs}
                disabled={Boolean(actionLoading)}
              >
                {actionLoading === 'audit-export' ? (
                  <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                ) : (
                  <Download className="w-4 h-4 mr-1.5" />
                )}
                Export Audit Logs
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs"
                onClick={openHistoryDrawer}
                disabled={historyLoading}
              >
                {historyLoading ? (
                  <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                ) : (
                  <History className="w-3.5 h-3.5 mr-1.5" />
                )}
                History
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs"
                onClick={fetchData}
                disabled={Boolean(actionLoading)}
              >
                <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
                Refresh
              </Button>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
            {deletionRequests.length > 0 ? (
              <div className="divide-y divide-gray-100 dark:divide-gray-800">
                {deletionRequests.slice(0, 6).map((item) => {
                  const requester = item.userName || item.userEmail || 'Unknown user';
                  const reasonText = item.reason?.trim() || 'No reason provided';
                  const rowActionLoading = Boolean(actionLoading?.startsWith(`deletion-${item.id}-`));

                  return (
                    <div key={item.id} className="px-4 py-3">
                      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{requester}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{item.userEmail || 'No email'}</p>
                          <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">{reasonText}</p>
                          <Input
                            value={deletionReviewNotes[item.id] || ''}
                            onChange={(e) =>
                              setDeletionReviewNotes((prev) => ({
                                ...prev,
                                [item.id]: e.target.value,
                              }))
                            }
                            placeholder="Optional review note (shared with resident)"
                            className="mt-2 h-8 text-xs bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700"
                            disabled={rowActionLoading}
                          />
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 text-xs"
                            disabled={rowActionLoading}
                            onClick={() =>
                              reviewDeletionRequest(item.id, 'rejected', {
                                reviewNote: deletionReviewNotes[item.id] || '',
                              })
                            }
                          >
                            {actionLoading === `deletion-${item.id}-rejected` ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                            ) : null}
                            Reject
                          </Button>

                          <Button
                            size="sm"
                            className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                            disabled={rowActionLoading}
                            onClick={() =>
                              reviewDeletionRequest(item.id, 'approved', {
                                reviewNote: deletionReviewNotes[item.id] || '',
                              })
                            }
                          >
                            {actionLoading === `deletion-${item.id}-approved` ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                            ) : null}
                            Approve
                          </Button>

                          <Button
                            size="sm"
                            className="h-8 text-xs bg-red-600 hover:bg-red-700 text-white"
                            disabled={rowActionLoading}
                            onClick={() => {
                              requestTypedConfirmation({
                                kind: 'approve-delete-now',
                                requestId: item.id,
                                userEmail: item.userEmail || 'this user',
                                reviewNote: deletionReviewNotes[item.id] || '',
                              });
                            }}
                          >
                            {actionLoading === `deletion-${item.id}-approved-execute` ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                            ) : null}
                            Approve + Delete Now
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <EmptyState
                icon={CheckCircle}
                title="No pending deletion requests"
                description="All account deletion requests are up to date."
              />
            )}
          </div>
        </motion.section>

        <Sheet open={historyOpen} onOpenChange={setHistoryOpen}>
          <SheetContent side="right" className="w-full sm:max-w-xl p-0">
            <div className="h-full flex flex-col">
              <SheetHeader className="px-6 py-5 border-b border-gray-200 dark:border-gray-800">
                <SheetTitle className="text-left">Deletion Request History</SheetTitle>
                <SheetDescription className="text-left">
                  Reviewed requests with reviewer notes and deletion execution details.
                </SheetDescription>
              </SheetHeader>

              <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
                {historyError ? (
                  <div className="rounded-xl border border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-950/30 p-3">
                    <p className="text-sm text-red-700 dark:text-red-300">{historyError}</p>
                  </div>
                ) : historyLoading ? (
                  <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 text-center">
                    <Loader2 className="w-5 h-5 mx-auto mb-2 animate-spin text-gray-500" />
                    <p className="text-sm text-gray-500 dark:text-gray-400">Loading history...</p>
                  </div>
                ) : reviewedHistory.length > 0 ? (
                  reviewedHistory.map((item) => {
                    const status = item.status === 'approved' ? 'Approved' : 'Rejected';
                    const reviewer = item.reviewedBy || 'Unknown reviewer';
                    const note = item.reviewNote?.trim() || 'No note provided';

                    return (
                      <div
                        key={item.id}
                        className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                              {item.userName || item.userEmail || 'Unknown user'}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{item.userEmail || 'No email'}</p>
                          </div>
                          <Badge
                            variant="secondary"
                            className={cn(
                              'text-[10px] px-2 py-0.5',
                              item.status === 'approved'
                                ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
                                : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                            )}
                          >
                            {status}
                          </Badge>
                        </div>

                        <div className="mt-3 space-y-1.5 text-xs text-gray-600 dark:text-gray-300">
                          <p><span className="font-medium">Requested:</span> {formatDateTime(item.requestedAt)}</p>
                          <p><span className="font-medium">Reviewed:</span> {formatDateTime(item.reviewedAt)}</p>
                          <p><span className="font-medium">Reviewed by:</span> {reviewer}</p>
                          <p><span className="font-medium">Reason:</span> {item.reason?.trim() || 'No reason provided'}</p>
                          <p><span className="font-medium">Note:</span> {note}</p>
                          {item.status === 'approved' && (
                            <p>
                              <span className="font-medium">Execution:</span>{' '}
                              {item.deletionExecuted
                                ? `Deletion executed${item.deletionExecutionResult?.bookings !== undefined ? ` (${item.deletionExecutionResult.bookings} bookings removed)` : ''}`
                                : 'Approved, awaiting execution'}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 text-center">
                    <p className="text-sm text-gray-500 dark:text-gray-400">No reviewed deletion requests yet.</p>
                  </div>
                )}
              </div>

              <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-800">
                <Link href="/admin/deletion-requests" className="inline-flex items-center text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">
                  Open full deletion requests page
                  <ExternalLink className="w-4 h-4 ml-1.5" />
                </Link>
              </div>
            </div>
          </SheetContent>
        </Sheet>

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
                    onRevoke={() => requestTypedConfirmation({ kind: 'revoke-code', codeId: code.id })}
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
                    onDelete={() =>
                      requestTypedConfirmation({ kind: 'delete-user', userId: user.id, userEmail: user.email })
                    }
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

        <TypedConfirmDialog
          open={Boolean(pendingTypedAction)}
          onOpenChange={(open) => {
            if (!open) {
              setPendingTypedAction(null);
            }
          }}
          title={typedConfirmationTitle}
          description={typedConfirmationDescription}
          confirmLabel="Type DELETE And Continue"
          isLoading={actionLoading === typedConfirmationActionKey}
          onConfirm={handleTypedConfirmation}
        />
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
    highlight: 'bg-teal-50 dark:bg-teal-900/20 text-teal-700 dark:text-teal-400',
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
          <Button
            variant="ghost"
            size="sm"
            onClick={onRevoke}
            disabled={isLoading}
            className="h-8 w-8 p-0 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
            title="Revoke code"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
          </Button>
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
            ? "bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400" 
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
                  ? "bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400" 
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
            <Button
              variant="ghost"
              size="sm"
              onClick={onDelete}
              disabled={isLoading}
              className="h-8 w-8 p-0 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
              title="Remove user"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
            </Button>
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
