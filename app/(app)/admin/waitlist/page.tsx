'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSession } from 'next-auth/react';
import { motion } from 'framer-motion';
import {
  Users,
  Clock,
  TrendingUp,
  Search,
  Calendar,
  ChevronRight,
  RefreshCw,
  Send,
  AlertTriangle,
  AlarmClock,
} from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import TypedConfirmDialog from '@/components/ui/typed-confirm-dialog';
import { useTimeFormat } from '@/lib/time-format-context';
import { formatDateTime } from '@/lib/time-format';

interface WaitlistEntry {
  id: string;
  userEmail: string;
  userName: string;
  amenityId: string;
  amenityName: string;
  startTime: any;
  endTime: any;
  waitlistPosition: number;
  createdAt: any;
  status: string;
  userFlatNumber?: string;
  lastWaitlistReminderAt?: any;
  lastWaitlistReminderStatus?: 'success' | 'error' | null;
  lastWaitlistReminderError?: string | null;
}

interface WaitlistStats {
  totalWaitlist: number;
  byAmenity: Record<string, number>;
  recentPromotions: number;
}

interface RowAuditEvent {
  type: 'reminder' | 'promotion';
  status: 'success' | 'error';
  message: string;
  at: string;
}

const defaultStats: WaitlistStats = {
  totalWaitlist: 0,
  byAmenity: {},
  recentPromotions: 0,
};

const REMINDER_COOLDOWN_MINUTES = 15;

function toDate(value: any): Date | null {
  if (!value) return null;
  if (typeof value?.toDate === 'function') return value.toDate();

  const seconds = value?.seconds ?? value?._seconds;
  if (typeof seconds === 'number') {
    return new Date(seconds * 1000);
  }

  const millis = value?.milliseconds ?? value?._milliseconds;
  if (typeof millis === 'number') {
    return new Date(millis);
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export default function AdminWaitlistManagement() {
  const { data: session, status } = useSession();
  const timeFormat = useTimeFormat();
  const [waitlistEntries, setWaitlistEntries] = useState<WaitlistEntry[]>([]);
  const [stats, setStats] = useState<WaitlistStats>(defaultStats);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [promotingId, setPromotingId] = useState<string | null>(null);
  const [remindingId, setRemindingId] = useState<string | null>(null);
  const [pendingPromote, setPendingPromote] = useState<WaitlistEntry | null>(null);
  const [nowMs, setNowMs] = useState(() => Date.now());
  const [rowAudit, setRowAudit] = useState<Record<string, RowAuditEvent>>({});

  useEffect(() => {
    const timer = window.setInterval(() => setNowMs(Date.now()), 30000);
    return () => window.clearInterval(timer);
  }, []);

  const setAuditEvent = (entryId: string, event: RowAuditEvent) => {
    setRowAudit((prev) => ({ ...prev, [entryId]: event }));
  };

  const fetchWaitlistData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/waitlist');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || 'Failed to load waitlist data');
      }

      setWaitlistEntries(Array.isArray(data.waitlist) ? data.waitlist : []);
      setStats(data.stats || defaultStats);
    } catch (error: any) {
      console.error('Error fetching waitlist:', error);
      toast.error(error?.message || 'Error loading waitlist data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (status === 'authenticated' && session?.user?.role === 'admin') {
      void fetchWaitlistData();
    }
  }, [status, session?.user?.role]);

  const handleManualPromote = async (entry: WaitlistEntry) => {
    setPromotingId(entry.id);
    try {
      const start = toDate(entry.startTime);
      if (!start) {
        throw new Error('Invalid start time for waitlist entry');
      }

      const response = await fetch('/api/bookings/promote-waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amenityId: entry.amenityId,
          startTime: start.toISOString(),
          reason: 'manual',
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.promoted) {
        throw new Error(data?.message || data?.error || 'Promotion failed');
      }

      toast.success('User promoted successfully', {
        description: `${entry.userName || entry.userEmail} has been confirmed and notified.`,
      });

      setAuditEvent(entry.id, {
        type: 'promotion',
        status: 'success',
        message: 'Promotion completed',
        at: new Date().toISOString(),
      });

      setPendingPromote(null);
      await fetchWaitlistData();
    } catch (error: any) {
      console.error('Promotion error:', error);
      setAuditEvent(entry.id, {
        type: 'promotion',
        status: 'error',
        message: error?.message || 'Promotion failed',
        at: new Date().toISOString(),
      });
      toast.error(error?.message || 'Error promoting user');
    } finally {
      setPromotingId(null);
    }
  };

  const handleSendReminder = async (entry: WaitlistEntry) => {
    setRemindingId(entry.id);
    try {
      const response = await fetch('/api/admin/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId: entry.id }),
      });

      const data = await response.json();
      if (!response.ok || data.success !== true) {
        throw new Error(data?.error || 'Failed to send reminder');
      }

      toast.success('Reminder sent', {
        description: `Notified ${entry.userName || entry.userEmail} about current waitlist status.`,
      });

      setAuditEvent(entry.id, {
        type: 'reminder',
        status: 'success',
        message: 'Reminder sent',
        at: new Date().toISOString(),
      });

      await fetchWaitlistData();
    } catch (error: any) {
      console.error('Reminder error:', error);
      setAuditEvent(entry.id, {
        type: 'reminder',
        status: 'error',
        message: error?.message || 'Reminder failed',
        at: new Date().toISOString(),
      });
      toast.error(error?.message || 'Failed to send reminder');
    } finally {
      setRemindingId(null);
    }
  };

  const filteredEntries = useMemo(() => {
    const searchLower = searchTerm.trim().toLowerCase();
    if (!searchLower) return waitlistEntries;

    return waitlistEntries.filter((entry) => {
      return (
        entry.userName?.toLowerCase().includes(searchLower) ||
        entry.userEmail?.toLowerCase().includes(searchLower) ||
        entry.amenityName?.toLowerCase().includes(searchLower)
      );
    });
  }, [waitlistEntries, searchTerm]);

  if (status === 'loading') {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
          <RefreshCw className="w-4 h-4 animate-spin" />
          Loading waitlist...
        </div>
      </div>
    );
  }

  if (!session || (session.user as any)?.role !== 'admin') {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <Card className="w-full max-w-md">
          <CardContent className="py-10 text-center">
            <AlertTriangle className="w-10 h-10 mx-auto mb-3 text-amber-500" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Access Denied</h2>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">Admin access is required for waitlist management.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
      >
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900 dark:text-white">Waitlist Manager</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Review queue depth, manually promote residents, and send reminder updates.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card className="border-gray-200/80 dark:border-gray-800">
            <CardContent className="h-[92px] p-5 flex items-center justify-between">
              <div className="flex flex-col justify-center">
                <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Total Waitlist</p>
                <p className="mt-1 text-2xl font-semibold text-gray-900 dark:text-white">{stats.totalWaitlist}</p>
              </div>
              <Users className="w-9 h-9 text-cyan-500" />
            </CardContent>
          </Card>

          <Card className="border-gray-200/80 dark:border-gray-800">
            <CardContent className="h-[92px] p-5 flex items-center justify-between">
              <div className="flex flex-col justify-center">
                <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Recent Promotions</p>
                <p className="mt-1 text-2xl font-semibold text-gray-900 dark:text-white">{stats.recentPromotions}</p>
              </div>
              <TrendingUp className="w-9 h-9 text-emerald-500" />
            </CardContent>
          </Card>

          <Card className="border-gray-200/80 dark:border-gray-800">
            <CardContent className="h-[92px] p-5 flex items-center justify-between">
              <div className="flex flex-col justify-center">
                <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Amenities in Queue</p>
                <p className="mt-1 text-2xl font-semibold text-gray-900 dark:text-white">{Object.keys(stats.byAmenity).length}</p>
              </div>
              <AlarmClock className="w-9 h-9 text-violet-500" />
            </CardContent>
          </Card>
        </div>

        <Card className="mb-6 border-gray-200/80 dark:border-gray-800">
          <CardContent className="p-4 sm:p-5 flex flex-col sm:flex-row gap-3 sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                type="search"
                autoComplete="off"
                spellCheck={false}
                autoCapitalize="none"
                placeholder="Search by resident, email, or amenity"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={() => void fetchWaitlistData()}
              disabled={loading}
              className="sm:w-auto w-full"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </CardContent>
        </Card>

        <Card className="border-gray-200/80 dark:border-gray-800">
          <CardHeader>
            <CardTitle className="text-base sm:text-lg">Current Waitlist Entries</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="py-10 text-center text-sm text-gray-500 dark:text-gray-400">Loading entries...</div>
            ) : filteredEntries.length === 0 ? (
              <div className="py-12 text-center">
                <Users className="w-10 h-10 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
                <p className="text-sm text-gray-600 dark:text-gray-400">No waitlist entries found.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredEntries.map((entry) => {
                  const startDate = toDate(entry.startTime);
                  const lastReminderDate = toDate(entry.lastWaitlistReminderAt);
                  const isPromoting = promotingId === entry.id;
                  const isReminding = remindingId === entry.id;
                  const audit = rowAudit[entry.id];

                  const cooldownRemainingMinutes = lastReminderDate
                    ? Math.max(0, Math.ceil((lastReminderDate.getTime() + REMINDER_COOLDOWN_MINUTES * 60 * 1000 - nowMs) / 60000))
                    : 0;
                  const reminderLocked = cooldownRemainingMinutes > 0;
                  const reminderDisabled = isPromoting || isReminding || reminderLocked;

                  return (
                    <div
                      key={entry.id}
                      className="rounded-xl border border-gray-200/80 dark:border-gray-800 p-4 sm:p-5 bg-white dark:bg-gray-900/40"
                    >
                      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="secondary" className="text-xs">#{entry.waitlistPosition}</Badge>
                            <p className="font-medium text-gray-900 dark:text-white truncate">{entry.userName || 'Resident'}</p>
                          </div>

                          <div className="space-y-1.5 text-sm text-gray-600 dark:text-gray-400">
                            <p className="truncate">{entry.userEmail}</p>
                            <p className="flex items-center gap-1.5">
                              <Calendar className="w-4 h-4 text-cyan-500" />
                              <span>{entry.amenityName || 'Amenity'}</span>
                            </p>
                            <p className="flex items-center gap-1.5">
                              <Clock className="w-4 h-4 text-emerald-500" />
                              <span>{startDate ? formatDateTime(startDate, timeFormat) : 'Time unavailable'}</span>
                            </p>
                            {lastReminderDate && (
                              <p className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                                <Send className="w-3.5 h-3.5" />
                                <span>Last reminder: {formatDateTime(lastReminderDate, timeFormat)}</span>
                              </p>
                            )}
                          </div>

                          <div className="mt-3 flex flex-wrap gap-2">
                            {entry.lastWaitlistReminderStatus === 'success' && (
                              <Badge variant="outline" className="text-emerald-700 border-emerald-300 dark:text-emerald-300 dark:border-emerald-800">
                                Reminder success
                              </Badge>
                            )}
                            {entry.lastWaitlistReminderStatus === 'error' && (
                              <Badge variant="outline" className="text-red-700 border-red-300 dark:text-red-300 dark:border-red-800" title={entry.lastWaitlistReminderError || undefined}>
                                Reminder failed
                              </Badge>
                            )}
                            {audit && (
                              <Badge
                                variant="outline"
                                className={
                                  audit.status === 'success'
                                    ? 'text-emerald-700 border-emerald-300 dark:text-emerald-300 dark:border-emerald-800'
                                    : 'text-red-700 border-red-300 dark:text-red-300 dark:border-red-800'
                                }
                                title={`${audit.message} at ${formatDateTime(new Date(audit.at), timeFormat)}`}
                              >
                                {audit.type === 'promotion' ? 'Promotion' : 'Reminder'} {audit.status}
                              </Badge>
                            )}
                          </div>
                        </div>

                        <div className="flex flex-col sm:flex-row sm:items-start gap-2 lg:ml-4">
                          <Button
                            size="sm"
                            onClick={() => setPendingPromote(entry)}
                            disabled={isPromoting || isReminding}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white"
                          >
                            {isPromoting ? <RefreshCw className="w-4 h-4 mr-1.5 animate-spin" /> : <ChevronRight className="w-4 h-4 mr-1.5" />}
                            Promote Now
                          </Button>

                          <div className="flex flex-col gap-1">
                            {reminderLocked && (
                              <Badge variant="secondary" className="justify-center text-[11px] font-medium">
                                Retry in {cooldownRemainingMinutes}m
                              </Badge>
                            )}
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => void handleSendReminder(entry)}
                              disabled={reminderDisabled}
                              title={reminderLocked ? `Retry in ${cooldownRemainingMinutes} minute(s)` : undefined}
                            >
                              {isReminding ? <RefreshCw className="w-4 h-4 mr-1.5 animate-spin" /> : <Send className="w-4 h-4 mr-1.5" />}
                              {reminderLocked ? 'Reminder Locked' : 'Send Reminder'}
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      <TypedConfirmDialog
        open={Boolean(pendingPromote)}
        onOpenChange={(open) => {
          if (!open) setPendingPromote(null);
        }}
        title="Promote Waitlist Entry"
        description={pendingPromote
          ? `Type PROMOTE to confirm promotion for ${pendingPromote.userName || pendingPromote.userEmail}.`
          : 'Type PROMOTE to continue.'}
        keyword="PROMOTE"
        confirmLabel="Promote"
        isLoading={Boolean(pendingPromote && promotingId === pendingPromote.id)}
        onConfirm={async () => {
          if (!pendingPromote) return;
          await handleManualPromote(pendingPromote);
        }}
      />
    </div>
  );
}
