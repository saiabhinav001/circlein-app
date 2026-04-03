'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { AlertTriangle, Clock3, Flame, LifeBuoy, Mail, User } from 'lucide-react';
import { useCommunityTimeFormat, useCommunityTimeZone } from '@/components/providers/community-branding-provider';
import { formatDateTimeInTimeZone } from '@/lib/timezone';
import { getSupportPriorityRank, getSupportSlaState } from '@/lib/support-ticket';

type TicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed';
type TicketPriority = 'low' | 'normal' | 'high' | 'urgent';

type TicketMetric = {
  totalTickets: number;
  activeTickets: number;
  overdueTickets: number;
  atRiskTickets: number;
  escalatedTickets: number;
  breachedResolvedTickets: number;
  averageFirstResponseMinutes: number | null;
  averageResolutionHours: number | null;
  byPriority: Record<TicketPriority, number>;
};

interface SupportTicket {
  id: string;
  subject: string;
  message: string;
  status: TicketStatus;
  priority?: TicketPriority | string;
  category?: string;
  userEmail?: string;
  userName?: string;
  assignedTo?: string | null;
  createdAt?: string | null;
  dueAt?: string | null;
  firstResponseAt?: string | null;
  escalatedAt?: string | null;
  isEscalated?: boolean;
}

const CANNED_UPDATES: Array<{ value: string; label: string }> = [
  { value: 'Acknowledged. Investigating now.', label: 'Acknowledge and investigate' },
  { value: 'We reproduced the issue and assigned this to engineering.', label: 'Escalate to engineering' },
  { value: 'Please retry and confirm whether the issue persists.', label: 'Ask user to retry' },
  { value: 'Issue addressed and validated. Closing this ticket.', label: 'Resolved and validated' },
];

const COLUMNS: Array<{ key: TicketStatus; title: string; description: string }> = [
  { key: 'open', title: 'Open', description: 'Needs first response' },
  { key: 'in_progress', title: 'In Progress', description: 'Being actively handled' },
  { key: 'resolved', title: 'Resolved', description: 'Awaiting closure or follow-up' },
  { key: 'closed', title: 'Closed', description: 'Completed tickets' },
];

const STATUS_LABELS: Record<TicketStatus, string> = {
  open: 'Open',
  in_progress: 'In Progress',
  resolved: 'Resolved',
  closed: 'Closed',
};

const PRIORITY_LABELS: Record<TicketPriority, string> = {
  low: 'Low',
  normal: 'Normal',
  high: 'High',
  urgent: 'Urgent',
};

const PRIORITY_STYLES: Record<TicketPriority, string> = {
  low: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  normal: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300',
  high: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  urgent: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300',
};

function normalizePriority(value: string | undefined): TicketPriority {
  if (value === 'low' || value === 'normal' || value === 'high' || value === 'urgent') {
    return value;
  }

  return 'normal';
}

function statusBadge(status: TicketStatus) {
  if (status === 'open') {
    return <Badge className="bg-amber-500">Open</Badge>;
  }
  if (status === 'in_progress') {
    return <Badge className="bg-blue-600">In Progress</Badge>;
  }
  if (status === 'resolved') {
    return <Badge className="bg-emerald-600">Resolved</Badge>;
  }
  return <Badge variant="secondary">Closed</Badge>;
}

function priorityBadge(priority: TicketPriority) {
  return <Badge className={PRIORITY_STYLES[priority]}>{PRIORITY_LABELS[priority]}</Badge>;
}

function slaBadge(state: ReturnType<typeof getSupportSlaState>) {
  if (state === 'overdue') {
    return <Badge className="bg-rose-600">SLA Overdue</Badge>;
  }
  if (state === 'at_risk') {
    return <Badge className="bg-amber-500">SLA At Risk</Badge>;
  }
  if (state === 'resolved') {
    return <Badge className="bg-emerald-600">SLA Met</Badge>;
  }
  if (state === 'on_track') {
    return <Badge className="bg-cyan-600">On Track</Badge>;
  }

  return <Badge variant="secondary">No SLA</Badge>;
}

export default function AdminContactTicketsPage() {
  const { data: session } = useSession();
  const timeZone = useCommunityTimeZone();
  const timeFormat = useCommunityTimeFormat();
  const [loading, setLoading] = useState(true);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [metrics, setMetrics] = useState<TicketMetric | null>(null);
  const [actionId, setActionId] = useState('');
  const [assignedToDraft, setAssignedToDraft] = useState<Record<string, string>>({});
  const [updateNoteDraft, setUpdateNoteDraft] = useState<Record<string, string>>({});

  const loadTickets = async () => {
    try {
      setLoading(true);
      const [response, metricsResponse] = await Promise.all([
        fetch('/api/contact/tickets', { cache: 'no-store' }),
        fetch('/api/contact/tickets/metrics', { cache: 'no-store' }),
      ]);

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload?.error || 'Failed to load support tickets');
      }

      setTickets(Array.isArray(payload?.tickets) ? payload.tickets : []);

      if (metricsResponse.ok) {
        const metricsPayload = await metricsResponse.json();
        setMetrics(metricsPayload?.metrics || null);
      } else {
        setMetrics(null);
      }
    } catch (error: any) {
      toast.error(error?.message || 'Failed to load support tickets');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session?.user?.email) {
      void loadTickets();
    }
  }, [session?.user?.email]);

  const grouped = useMemo(() => {
    const buckets: Record<TicketStatus, SupportTicket[]> = {
      open: [],
      in_progress: [],
      resolved: [],
      closed: [],
    };

    tickets.forEach((ticket) => {
      const key = (ticket.status || 'open') as TicketStatus;
      if (!buckets[key]) {
        buckets.open.push(ticket);
      } else {
        buckets[key].push(ticket);
      }
    });

    const sortByPriorityAndSla = (a: SupportTicket, b: SupportTicket) => {
      const priorityDelta = getSupportPriorityRank(b.priority) - getSupportPriorityRank(a.priority);
      if (priorityDelta !== 0) {
        return priorityDelta;
      }

      const aDue = a.dueAt ? new Date(a.dueAt).getTime() : Number.POSITIVE_INFINITY;
      const bDue = b.dueAt ? new Date(b.dueAt).getTime() : Number.POSITIVE_INFINITY;
      if (aDue !== bDue) {
        return aDue - bDue;
      }

      const aCreated = a.createdAt ? new Date(a.createdAt).getTime() : Number.POSITIVE_INFINITY;
      const bCreated = b.createdAt ? new Date(b.createdAt).getTime() : Number.POSITIVE_INFINITY;
      return aCreated - bCreated;
    };

    (Object.keys(buckets) as TicketStatus[]).forEach((key) => {
      buckets[key].sort(sortByPriorityAndSla);
    });

    return buckets;
  }, [tickets]);

  const formatTicketDateTime = (value?: string | null) => {
    if (!value) {
      return 'Unknown date';
    }

    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      return 'Unknown date';
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

  const toSlaState = (ticket: SupportTicket) =>
    getSupportSlaState({ dueAt: ticket.dueAt, status: ticket.status });

  const updateStatus = async (
    ticketId: string,
    status: TicketStatus,
    options?: { escalate?: boolean; priority?: TicketPriority; noteOverride?: string }
  ) => {
    const actionKey = options?.escalate ? `${ticketId}_escalate` : `${ticketId}_${status}`;
    setActionId(actionKey);

    try {
      const response = await fetch(`/api/contact/tickets/${ticketId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status,
          assignedTo: (assignedToDraft[ticketId] || '').trim() || session?.user?.email || '',
          updateNote: options?.noteOverride ?? updateNoteDraft[ticketId] ?? '',
          priority: options?.priority,
          escalate: options?.escalate === true,
        }),
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error || 'Failed to update ticket status');
      }

      toast.success(options?.escalate ? 'Ticket escalated and updated' : `Ticket moved to ${STATUS_LABELS[status]}`);
      setUpdateNoteDraft((current) => ({ ...current, [ticketId]: '' }));
      await loadTickets();
    } catch (error: any) {
      toast.error(error?.message || 'Failed to update ticket status');
    } finally {
      setActionId('');
    }
  };

  const applyCannedUpdate = (ticketId: string, template: string) => {
    setUpdateNoteDraft((current) => ({ ...current, [ticketId]: template }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100/50 dark:from-slate-950 dark:via-slate-950 dark:to-slate-900/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10 space-y-6">
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-gradient-to-br from-slate-50 via-white to-cyan-50/70 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800/70 p-5 sm:p-6">
          <div className="flex items-start sm:items-center gap-3 sm:gap-4">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-700 dark:from-slate-100 dark:to-slate-300 text-white dark:text-slate-900 flex items-center justify-center shadow-lg ring-1 ring-slate-200/70 dark:ring-slate-700/60 shrink-0">
              <LifeBuoy className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div className="min-w-0">
              <h1 className="text-2xl sm:text-3xl font-semibold text-slate-900 dark:text-slate-100 leading-tight">Support Ticket Desk</h1>
              <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 leading-relaxed">Manage resident contact tickets and respond with status updates.</p>
            </div>
          </div>
        </div>

        {!loading && metrics && (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
            <Card>
              <CardContent className="p-4 min-h-[110px] flex flex-col justify-between">
                <p className="text-xs uppercase tracking-wide text-slate-500">Active Queue</p>
                <p className="mt-1 text-2xl font-semibold text-slate-900 dark:text-slate-100">{metrics.activeTickets}</p>
                <p className="mt-1 text-xs text-slate-500">of {metrics.totalTickets} total tickets</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 min-h-[110px] flex flex-col justify-between">
                <p className="text-xs uppercase tracking-wide text-slate-500">SLA Risk</p>
                <p className="mt-1 text-2xl font-semibold text-rose-600 dark:text-rose-400">{metrics.overdueTickets}</p>
                <p className="mt-1 text-xs text-slate-500">{metrics.atRiskTickets} at risk</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 min-h-[110px] flex flex-col justify-between">
                <p className="text-xs uppercase tracking-wide text-slate-500">First Response</p>
                <p className="mt-1 text-2xl font-semibold text-slate-900 dark:text-slate-100">
                  {metrics.averageFirstResponseMinutes == null ? 'N/A' : `${metrics.averageFirstResponseMinutes}m`}
                </p>
                <p className="mt-1 text-xs text-slate-500 leading-relaxed">average response latency</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 min-h-[110px] flex flex-col justify-between">
                <p className="text-xs uppercase tracking-wide text-slate-500">Resolution</p>
                <p className="mt-1 text-2xl font-semibold text-slate-900 dark:text-slate-100">
                  {metrics.averageResolutionHours == null ? 'N/A' : `${metrics.averageResolutionHours}h`}
                </p>
                <p className="mt-1 text-xs text-slate-500 leading-relaxed">{metrics.escalatedTickets} escalated tickets</p>
              </CardContent>
            </Card>
          </div>
        )}

        {loading ? (
          <Card>
            <CardContent className="min-h-[96px] px-6 py-6 flex items-center">
              <p className="text-sm text-slate-500">Loading support tickets...</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid xl:grid-cols-2 gap-4">
            {COLUMNS.map((column) => (
              <Card key={column.key}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center justify-between">
                    <span>{column.title}</span>
                    <Badge variant="secondary">{grouped[column.key].length}</Badge>
                  </CardTitle>
                  <CardDescription>{column.description}</CardDescription>
                </CardHeader>

                <CardContent className="space-y-3">
                  {grouped[column.key].length === 0 ? (
                    <p className="text-sm text-slate-500">No tickets.</p>
                  ) : (
                    grouped[column.key].map((ticket) => (
                      <div key={ticket.id} className="rounded-lg border border-slate-200 dark:border-slate-800 p-3 space-y-2">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                          <h3 className="font-medium text-slate-900 dark:text-slate-100 line-clamp-2">{ticket.subject}</h3>
                          <div className="flex flex-wrap items-center gap-1.5">
                            {statusBadge(ticket.status)}
                            {priorityBadge(normalizePriority(ticket.priority))}
                            {slaBadge(toSlaState(ticket))}
                          </div>
                        </div>

                        <p className="text-sm text-slate-600 dark:text-slate-300 line-clamp-3">{ticket.message}</p>

                        <div className="text-xs text-slate-500 grid gap-1">
                          <span className="inline-flex items-center gap-1"><User className="w-3.5 h-3.5" /> {ticket.userName || 'Resident'}</span>
                          <span className="inline-flex items-center gap-1 break-all"><Mail className="w-3.5 h-3.5" /> {ticket.userEmail || 'N/A'}</span>
                          <span className="inline-flex items-center gap-1"><Clock3 className="w-3.5 h-3.5" /> {formatTicketDateTime(ticket.createdAt)}</span>
                          {ticket.dueAt && (
                            <span className="inline-flex items-center gap-1"><AlertTriangle className="w-3.5 h-3.5" /> SLA due {formatTicketDateTime(ticket.dueAt)}</span>
                          )}
                          {ticket.firstResponseAt && (
                            <span className="inline-flex items-center gap-1"><Clock3 className="w-3.5 h-3.5" /> First response {formatTicketDateTime(ticket.firstResponseAt)}</span>
                          )}
                          {ticket.escalatedAt && (
                            <span className="inline-flex items-center gap-1 text-rose-600 dark:text-rose-400"><Flame className="w-3.5 h-3.5" /> Escalated {formatTicketDateTime(ticket.escalatedAt)}</span>
                          )}
                        </div>

                        <Input
                          value={assignedToDraft[ticket.id] ?? ticket.assignedTo ?? ''}
                          onChange={(event) =>
                            setAssignedToDraft((current) => ({ ...current, [ticket.id]: event.target.value }))
                          }
                          placeholder="Assign to (email)"
                          className="h-8 text-xs"
                        />

                        <Select onValueChange={(value) => applyCannedUpdate(ticket.id, value)}>
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue placeholder="Insert canned response" />
                          </SelectTrigger>
                          <SelectContent>
                            {CANNED_UPDATES.map((template) => (
                              <SelectItem key={template.value} value={template.value}>
                                {template.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>

                        <Textarea
                          value={updateNoteDraft[ticket.id] || ''}
                          onChange={(event) =>
                            setUpdateNoteDraft((current) => ({ ...current, [ticket.id]: event.target.value }))
                          }
                          placeholder="Optional update note"
                          className="min-h-[64px] text-xs"
                        />

                        <div className="flex flex-wrap gap-2">
                          {(ticket.status === 'open' || ticket.status === 'in_progress') && (
                            <Button
                              size="sm"
                              variant="destructive"
                              className="w-full sm:w-auto"
                              disabled={actionId === `${ticket.id}_escalate`}
                              onClick={() =>
                                updateStatus(
                                  ticket.id,
                                  ticket.status === 'open' ? 'in_progress' : ticket.status,
                                  { escalate: true, priority: 'urgent' }
                                )
                              }
                            >
                              Escalate
                            </Button>
                          )}

                          {(Object.keys(STATUS_LABELS) as TicketStatus[])
                            .filter((status) => status !== ticket.status)
                            .map((status) => (
                              <Button
                                key={status}
                                size="sm"
                                variant={status === 'resolved' ? 'default' : 'outline'}
                                className="w-full sm:w-auto"
                                disabled={actionId === `${ticket.id}_${status}`}
                                onClick={() => updateStatus(ticket.id, status)}
                              >
                                {STATUS_LABELS[status]}
                              </Button>
                            ))}
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
