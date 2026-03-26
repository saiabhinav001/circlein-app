'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ClipboardList, Wrench, User, Clock3, CircleCheckBig, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

interface MaintenanceRequest {
  id: string;
  title: string;
  description: string;
  category: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'new' | 'in_progress' | 'resolved';
  imageUrls: string[];
  userId: string;
  userName: string;
  assignedTo?: string | null;
}

const columns: Array<{ key: 'new' | 'in_progress' | 'resolved'; title: string }> = [
  { key: 'new', title: 'New' },
  { key: 'in_progress', title: 'In Progress' },
  { key: 'resolved', title: 'Resolved' },
];

export default function AdminMaintenancePage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState<MaintenanceRequest[]>([]);
  const [actionId, setActionId] = useState('');
  const [updateNote, setUpdateNote] = useState<Record<string, string>>({});

  useEffect(() => {
    if (status === 'loading') return;
    if (!session?.user?.email || session.user.role !== 'admin') {
      router.push('/dashboard');
      return;
    }

    loadRequests();
  }, [status, session?.user?.email, session?.user?.role, router]);

  const loadRequests = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/maintenance', { cache: 'no-store' });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload?.error || 'Failed to load requests');
      }

      setRequests(payload.requests || []);
    } catch (error: any) {
      toast.error(error?.message || 'Failed to load maintenance requests');
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (requestId: string, nextStatus: 'new' | 'in_progress' | 'resolved') => {
    setActionId(requestId + nextStatus);
    try {
      const response = await fetch(`/api/maintenance/admin/${requestId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: nextStatus,
          updateNote: updateNote[requestId] || '',
        }),
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error || 'Failed to update status');
      }

      toast.success('Request status updated');
      setUpdateNote((current) => ({ ...current, [requestId]: '' }));
      loadRequests();
    } catch (error: any) {
      toast.error(error?.message || 'Failed to update status');
    } finally {
      setActionId('');
    }
  };

  const grouped = useMemo(() => {
    const buckets: Record<string, MaintenanceRequest[]> = { new: [], in_progress: [], resolved: [] };
    requests.forEach((request) => {
      buckets[request.status || 'new'].push(request);
    });
    return buckets;
  }, [requests]);

  const priorityBadge = (priority: string) => {
    if (priority === 'urgent') return <Badge variant="destructive">Urgent</Badge>;
    if (priority === 'high') return <Badge className="bg-orange-600">High</Badge>;
    if (priority === 'low') return <Badge variant="secondary">Low</Badge>;
    return <Badge className="bg-slate-600">Medium</Badge>;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100/50 dark:from-slate-950 dark:via-slate-950 dark:to-slate-900/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10 space-y-6">
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-gradient-to-br from-slate-50 via-white to-amber-50/70 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800/70 p-5 sm:p-6">
          <div className="flex items-start sm:items-center gap-3 sm:gap-4">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-700 dark:from-slate-100 dark:to-slate-300 text-white dark:text-slate-900 flex items-center justify-center shadow-lg ring-1 ring-slate-200/70 dark:ring-slate-700/60 shrink-0">
              <ClipboardList className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div className="min-w-0">
              <h1 className="text-2xl sm:text-3xl font-semibold text-slate-900 dark:text-slate-100 leading-tight">Maintenance Desk</h1>
              <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 leading-relaxed">Kanban workflow for all community maintenance issues.</p>
            </div>
          </div>
        </div>

        {loading ? (
          <Card>
            <CardContent className="pt-6 text-sm text-slate-500">Loading maintenance board...</CardContent>
          </Card>
        ) : (
          <div className="grid lg:grid-cols-3 gap-4">
            {columns.map((column) => (
              <Card key={column.key} className="min-h-[420px]">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center justify-between">
                    <span>{column.title}</span>
                    <Badge variant="secondary">{grouped[column.key].length}</Badge>
                  </CardTitle>
                  <CardDescription>
                    {column.key === 'new' && 'Fresh requests waiting for assignment'}
                    {column.key === 'in_progress' && 'Requests actively being resolved'}
                    {column.key === 'resolved' && 'Completed requests'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {grouped[column.key].length === 0 ? (
                    <p className="text-sm text-slate-500">No requests.</p>
                  ) : (
                    grouped[column.key].map((request) => (
                      <div key={request.id} className="rounded-lg border border-slate-200 dark:border-slate-800 p-3 space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-medium text-slate-900 dark:text-slate-100">{request.title}</h3>
                          {priorityBadge(request.priority)}
                        </div>
                        <p className="text-sm text-slate-600 dark:text-slate-300 line-clamp-3">{request.description}</p>
                        <div className="text-xs text-slate-500 flex items-center gap-3">
                          <span className="inline-flex items-center gap-1"><User className="w-3.5 h-3.5" /> {request.userName || request.userId}</span>
                          <span className="inline-flex items-center gap-1"><Clock3 className="w-3.5 h-3.5" /> {request.category}</span>
                        </div>

                        {request.imageUrls?.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {request.imageUrls.map((url, idx) => (
                              <a key={`${request.id}-${idx}`} href={url} target="_blank" rel="noreferrer" className="text-xs text-blue-600 dark:text-blue-400 underline">
                                Image {idx + 1}
                              </a>
                            ))}
                          </div>
                        )}

                        <Input
                          value={updateNote[request.id] || ''}
                          onChange={(e) => setUpdateNote((current) => ({ ...current, [request.id]: e.target.value }))}
                          placeholder="Optional admin note"
                          className="h-8 text-xs"
                        />

                        <div className="flex flex-wrap gap-2">
                          {request.status !== 'new' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateStatus(request.id, 'new')}
                              disabled={actionId === request.id + 'new'}
                            >
                              <AlertTriangle className="w-3.5 h-3.5 mr-1" /> Mark New
                            </Button>
                          )}
                          {request.status !== 'in_progress' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateStatus(request.id, 'in_progress')}
                              disabled={actionId === request.id + 'in_progress'}
                            >
                              <Wrench className="w-3.5 h-3.5 mr-1" /> In Progress
                            </Button>
                          )}
                          {request.status !== 'resolved' && (
                            <Button
                              size="sm"
                              onClick={() => updateStatus(request.id, 'resolved')}
                              disabled={actionId === request.id + 'resolved'}
                            >
                              <CircleCheckBig className="w-3.5 h-3.5 mr-1" /> Resolve
                            </Button>
                          )}
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
