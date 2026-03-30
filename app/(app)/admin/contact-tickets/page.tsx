'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Clock3, LifeBuoy, Mail, User } from 'lucide-react';

type TicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed';

interface SupportTicket {
  id: string;
  subject: string;
  message: string;
  status: TicketStatus;
  category?: string;
  userEmail?: string;
  userName?: string;
  assignedTo?: string | null;
  createdAt?: string | null;
}

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

export default function AdminContactTicketsPage() {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(true);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [actionId, setActionId] = useState('');
  const [assignedToDraft, setAssignedToDraft] = useState<Record<string, string>>({});
  const [updateNoteDraft, setUpdateNoteDraft] = useState<Record<string, string>>({});

  const loadTickets = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/contact/tickets', { cache: 'no-store' });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload?.error || 'Failed to load support tickets');
      }

      setTickets(Array.isArray(payload?.tickets) ? payload.tickets : []);
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

    return buckets;
  }, [tickets]);

  const updateStatus = async (ticketId: string, status: TicketStatus) => {
    setActionId(`${ticketId}_${status}`);

    try {
      const response = await fetch(`/api/contact/tickets/${ticketId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status,
          assignedTo: (assignedToDraft[ticketId] || '').trim() || session?.user?.email || '',
          updateNote: updateNoteDraft[ticketId] || '',
        }),
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error || 'Failed to update ticket status');
      }

      toast.success(`Ticket moved to ${STATUS_LABELS[status]}`);
      setUpdateNoteDraft((current) => ({ ...current, [ticketId]: '' }));
      await loadTickets();
    } catch (error: any) {
      toast.error(error?.message || 'Failed to update ticket status');
    } finally {
      setActionId('');
    }
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

        {loading ? (
          <Card>
            <CardContent className="min-h-[96px] px-6 py-6 flex items-center">
              <p className="text-sm text-slate-500">Loading support tickets...</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid lg:grid-cols-2 gap-4">
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
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-medium text-slate-900 dark:text-slate-100 line-clamp-2">{ticket.subject}</h3>
                          {statusBadge(ticket.status)}
                        </div>

                        <p className="text-sm text-slate-600 dark:text-slate-300 line-clamp-3">{ticket.message}</p>

                        <div className="text-xs text-slate-500 flex flex-wrap items-center gap-3">
                          <span className="inline-flex items-center gap-1"><User className="w-3.5 h-3.5" /> {ticket.userName || 'Resident'}</span>
                          <span className="inline-flex items-center gap-1"><Mail className="w-3.5 h-3.5" /> {ticket.userEmail || 'N/A'}</span>
                          <span className="inline-flex items-center gap-1"><Clock3 className="w-3.5 h-3.5" /> {ticket.createdAt ? new Date(ticket.createdAt).toLocaleString() : 'Unknown date'}</span>
                        </div>

                        <Input
                          value={assignedToDraft[ticket.id] ?? ticket.assignedTo ?? ''}
                          onChange={(event) =>
                            setAssignedToDraft((current) => ({ ...current, [ticket.id]: event.target.value }))
                          }
                          placeholder="Assign to (email)"
                          className="h-8 text-xs"
                        />

                        <Textarea
                          value={updateNoteDraft[ticket.id] || ''}
                          onChange={(event) =>
                            setUpdateNoteDraft((current) => ({ ...current, [ticket.id]: event.target.value }))
                          }
                          placeholder="Optional update note"
                          className="min-h-[64px] text-xs"
                        />

                        <div className="flex flex-wrap gap-2">
                          {(Object.keys(STATUS_LABELS) as TicketStatus[])
                            .filter((status) => status !== ticket.status)
                            .map((status) => (
                              <Button
                                key={status}
                                size="sm"
                                variant={status === 'resolved' ? 'default' : 'outline'}
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
