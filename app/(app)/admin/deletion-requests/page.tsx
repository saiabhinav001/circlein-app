'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { CheckCircle2, Search, ShieldAlert, XCircle, Loader2 } from 'lucide-react';
import TypedConfirmDialog from '@/components/ui/typed-confirm-dialog';
import { toast } from 'sonner';
import { useCommunityTimeFormat, useCommunityTimeZone } from '@/components/providers/community-branding-provider';
import { formatDateTimeInTimeZone } from '@/lib/timezone';

type RequestStatus = 'requested' | 'approved' | 'rejected';

interface DeletionRequestItem {
  id: string;
  userEmail: string;
  userName?: string;
  reason?: string;
  status: RequestStatus;
  requestedAt?: string;
  requestedBy?: string;
  reviewedAt?: string;
  reviewedBy?: string;
  reviewNote?: string;
}

export default function AdminDeletionRequestsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const timeZone = useCommunityTimeZone();
  const timeFormat = useCommunityTimeFormat();

  const [items, setItems] = useState<DeletionRequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<RequestStatus | 'all'>('requested');
  const [search, setSearch] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [reviewNotes, setReviewNotes] = useState<Record<string, string>>({});
  const [pendingExecution, setPendingExecution] = useState<{ id: string; userEmail: string } | null>(null);

  useEffect(() => {
    if (status === 'loading') return;

    const role = String((session?.user as any)?.role || '').toLowerCase();
    if (!session?.user?.email || (role !== 'admin' && role !== 'super_admin')) {
      router.push('/dashboard');
    }
  }, [router, session, status]);

  const fetchRequests = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/account/delete-request/admin?status=${activeFilter}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || 'Failed to fetch deletion requests');
      }

      setItems(data.requests || []);
    } catch (error: any) {
      console.error('Failed to fetch deletion requests:', error);
      toast.error(error?.message || 'Failed to fetch deletion requests');
    } finally {
      setLoading(false);
    }
  }, [activeFilter]);

  useEffect(() => {
    if (!session?.user?.email) return;
    void fetchRequests();
  }, [fetchRequests, session?.user?.email]);

  const filteredItems = useMemo(() => {
    const text = search.trim().toLowerCase();
    if (!text) return items;

    return items.filter((item) => {
      const haystack = `${item.userEmail} ${item.userName || ''} ${item.reason || ''}`.toLowerCase();
      return haystack.includes(text);
    });
  }, [items, search]);

  const countByStatus = useMemo(() => ({
    requested: items.filter((item) => item.status === 'requested').length,
    approved: items.filter((item) => item.status === 'approved').length,
    rejected: items.filter((item) => item.status === 'rejected').length,
  }), [items]);

  const formatReviewTimestamp = (value?: string) => {
    if (!value) {
      return 'Unknown time';
    }

    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      return 'Unknown time';
    }

    return formatDateTimeInTimeZone(parsed, timeZone, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: timeFormat !== '24h',
    });
  };

  const reviewRequest = async (
    id: string,
    status: 'approved' | 'rejected',
    executeDeletion = false,
    confirmationText = ''
  ) => {
    setActionLoading(id + status + (executeDeletion ? '-execute' : ''));
    try {
      const response = await fetch(`/api/account/delete-request/admin/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status,
          reviewNote: (reviewNotes[id] || '').trim(),
          executeDeletion,
          confirmationText,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || `Failed to mark as ${status}`);
      }

      if (status === 'approved' && executeDeletion) {
        toast.success('Deletion request approved and deletion executed');
      } else {
        toast.success(status === 'approved' ? 'Deletion request approved' : 'Deletion request rejected');
      }
      await fetchRequests();
      return true;
    } catch (error: any) {
      console.error('Review action failed:', error);
      toast.error(error?.message || 'Review action failed');
      return false;
    } finally {
      setActionLoading(null);
    }
  };

  const handleConfirmExecution = async (confirmationText: string) => {
    if (!pendingExecution) {
      return;
    }

    const success = await reviewRequest(pendingExecution.id, 'approved', true, confirmationText);
    if (success) {
      setPendingExecution(null);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-7 h-7 animate-spin mx-auto text-gray-500" />
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Loading deletion requests...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Deletion Requests</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">Review resident account deletion requests and close the loop.</p>
            </div>
            <Button variant="outline" onClick={fetchRequests}>Refresh</Button>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <Card>
            <CardContent className="p-4 sm:p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2">
                  <Button variant={activeFilter === 'requested' ? 'default' : 'outline'} size="sm" onClick={() => setActiveFilter('requested')}>
                    Requested ({countByStatus.requested})
                  </Button>
                  <Button variant={activeFilter === 'approved' ? 'default' : 'outline'} size="sm" onClick={() => setActiveFilter('approved')}>
                    Approved ({countByStatus.approved})
                  </Button>
                  <Button variant={activeFilter === 'rejected' ? 'default' : 'outline'} size="sm" onClick={() => setActiveFilter('rejected')}>
                    Rejected ({countByStatus.rejected})
                  </Button>
                  <Button variant={activeFilter === 'all' ? 'default' : 'outline'} size="sm" onClick={() => setActiveFilter('all')}>
                    All
                  </Button>
                </div>
                <div className="relative w-full sm:w-72">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search email, name, reason" className="pl-9" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="space-y-4">
          {filteredItems.length === 0 ? (
            <Card className="border-slate-200/90 dark:border-slate-800/70 bg-white/85 dark:bg-slate-900/70">
              <CardContent className="min-h-[86px] sm:min-h-[96px] px-6 py-6 sm:px-8 sm:py-7 flex items-center justify-center text-center">
                <p className="text-sm sm:text-base font-medium text-slate-600 dark:text-slate-300 leading-relaxed">
                  No deletion requests found for this filter.
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredItems.map((item) => {
              const isRequested = item.status === 'requested';
              return (
                <Card key={item.id}>
                  <CardHeader>
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <CardTitle className="text-base">{item.userName || item.userEmail}</CardTitle>
                        <CardDescription>{item.userEmail}</CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        {item.status === 'requested' && <Badge className="bg-amber-500">Requested</Badge>}
                        {item.status === 'approved' && <Badge className="bg-emerald-600">Approved</Badge>}
                        {item.status === 'rejected' && <Badge className="bg-rose-600">Rejected</Badge>}
                        <span className="text-xs text-gray-500">{formatReviewTimestamp(item.requestedAt)}</span>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="rounded-lg border border-gray-200 dark:border-gray-800 p-3 bg-gray-50/70 dark:bg-gray-900/30">
                      <p className="text-xs uppercase tracking-wide text-gray-500 mb-1">Reason</p>
                      <p className="text-sm text-gray-700 dark:text-gray-300">{item.reason || 'No reason provided.'}</p>
                    </div>

                    {!isRequested && (
                      <div className="rounded-lg border border-gray-200 dark:border-gray-800 p-3">
                        <p className="text-xs text-gray-500">
                          Reviewed by {item.reviewedBy || 'Unknown admin'}
                          {item.reviewedAt ? ` on ${formatReviewTimestamp(item.reviewedAt)}` : ''}
                        </p>
                        {item.reviewNote && <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">Note: {item.reviewNote}</p>}
                      </div>
                    )}

                    {isRequested && (
                      <div className="space-y-3">
                        <Textarea
                          value={reviewNotes[item.id] || ''}
                          onChange={(e) => setReviewNotes((current) => ({ ...current, [item.id]: e.target.value }))}
                          placeholder="Optional review note for this user"
                          className="min-h-[84px]"
                        />
                        <p className="text-xs text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/20 rounded-md px-3 py-2">
                          You can either approve for manual follow-up, or approve and execute deletion immediately.
                        </p>
                        <div className="flex flex-wrap items-center gap-2">
                          <Button
                            onClick={() => reviewRequest(item.id, 'approved')}
                            disabled={
                              actionLoading === item.id + 'approved' ||
                              actionLoading === item.id + 'approved-execute' ||
                              actionLoading === item.id + 'rejected'
                            }
                            className="gap-2"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            {actionLoading === item.id + 'approved' ? 'Approving...' : 'Approve'}
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => setPendingExecution({ id: item.id, userEmail: item.userEmail })}
                            disabled={
                              actionLoading === item.id + 'approved' ||
                              actionLoading === item.id + 'approved-execute' ||
                              actionLoading === item.id + 'rejected'
                            }
                            className="gap-2"
                          >
                            <ShieldAlert className="w-4 h-4" />
                            {actionLoading === item.id + 'approved-execute' ? 'Approving + Deleting...' : 'Approve + Delete Now'}
                          </Button>
                          <Button
                            variant="destructive"
                            onClick={() => reviewRequest(item.id, 'rejected')}
                            disabled={
                              actionLoading === item.id + 'approved' ||
                              actionLoading === item.id + 'approved-execute' ||
                              actionLoading === item.id + 'rejected'
                            }
                            className="gap-2"
                          >
                            <XCircle className="w-4 h-4" />
                            {actionLoading === item.id + 'rejected' ? 'Rejecting...' : 'Reject'}
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })
          )}
        </motion.div>

        <TypedConfirmDialog
          open={Boolean(pendingExecution)}
          onOpenChange={(open) => {
            if (!open) {
              setPendingExecution(null);
            }
          }}
          title="Approve And Delete Account"
          description={`This will approve and permanently delete ${pendingExecution?.userEmail || 'this user'} immediately.`}
          confirmLabel="Type DELETE And Continue"
          isLoading={actionLoading === `${pendingExecution?.id || ''}approved-execute`}
          onConfirm={handleConfirmExecution}
        />
      </div>
    </div>
  );
}
