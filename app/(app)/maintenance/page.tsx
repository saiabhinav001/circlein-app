'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { storage } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Wrench, Upload, Clock3, CircleCheckBig, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

interface MaintenanceRequest {
  id: string;
  title: string;
  description: string;
  location?: string;
  category: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'new' | 'in_progress' | 'resolved' | 'closed';
  imageUrls: string[];
  history?: Array<{
    id: string;
    status: string;
    note?: string;
    updatedByName?: string;
    assignedTo?: string | null;
    timestamp?: any;
  }>;
  createdAt?: any;
  updatedAt?: any;
}

export default function MaintenancePage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [requests, setRequests] = useState<MaintenanceRequest[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [category, setCategory] = useState('plumbing');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium');
  const [files, setFiles] = useState<File[]>([]);

  const validateSelectedFiles = (incomingFiles: File[]): File[] => {
    const selected = incomingFiles.slice(0, 3);
    const valid: File[] = [];

    for (const file of selected) {
      if (!file.type.startsWith('image/')) {
        toast.error(`"${file.name}" is not an image file.`);
        continue;
      }
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`"${file.name}" is larger than 10MB.`);
        continue;
      }
      valid.push(file);
    }

    return valid;
  };

  useEffect(() => {
    if (status === 'loading') return;
    if (!session?.user?.email) {
      router.push('/auth/signin');
      return;
    }

    loadRequests();
  }, [status, session?.user?.email, router]);

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

  const uploadImages = async (): Promise<string[]> => {
    if (!files.length || !session?.user?.email || !session?.user?.communityId) {
      return [];
    }

    const uploadedUrls: string[] = [];

    for (const file of files.slice(0, 3)) {
      const safeName = file.name.replace(/\s+/g, '-').toLowerCase();
      const key = `maintenance/${session.user.communityId}/${session.user.email}/${Date.now()}-${safeName}`;
      const storageRef = ref(storage, key);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      uploadedUrls.push(url);
    }

    return uploadedUrls;
  };

  const submitRequest = async () => {
    if (!title.trim() || !description.trim()) {
      toast.error('Title and description are required');
      return;
    }

    setSubmitting(true);
    try {
      const imageUrls = await uploadImages();

      const response = await fetch('/api/maintenance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          location: location.trim(),
          category,
          priority,
          imageUrls,
        }),
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error || 'Failed to submit maintenance request');
      }

      setTitle('');
      setDescription('');
      setLocation('');
      setCategory('plumbing');
      setPriority('medium');
      setFiles([]);
      toast.success('Maintenance request submitted');
      loadRequests();
    } catch (error: any) {
      toast.error(error?.message || 'Failed to submit request');
    } finally {
      setSubmitting(false);
    }
  };

  const statusBadge = (status: string) => {
    if (status === 'resolved') return <Badge className="bg-emerald-600">Resolved</Badge>;
    if (status === 'closed') return <Badge className="bg-slate-700">Closed</Badge>;
    if (status === 'in_progress') return <Badge className="bg-blue-600">In Progress</Badge>;
    return <Badge className="bg-amber-600">New</Badge>;
  };

  const priorityBadge = (priority: string) => {
    if (priority === 'urgent') return <Badge variant="destructive">Urgent</Badge>;
    if (priority === 'high') return <Badge className="bg-orange-600">High</Badge>;
    if (priority === 'low') return <Badge variant="secondary">Low</Badge>;
    return <Badge className="bg-slate-600">Medium</Badge>;
  };

  const sortedRequests = useMemo(() => {
    return [...requests].sort((a, b) => {
      const aTime = a.createdAt?.seconds ? a.createdAt.seconds : new Date(a.createdAt || 0).getTime() / 1000;
      const bTime = b.createdAt?.seconds ? b.createdAt.seconds : new Date(b.createdAt || 0).getTime() / 1000;
      return bTime - aTime;
    });
  }, [requests]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100/50 dark:from-slate-950 dark:via-slate-950 dark:to-slate-900/50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10 space-y-6">
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-gradient-to-br from-slate-50 via-white to-amber-50/70 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800/70 p-5 sm:p-6">
          <div className="flex items-start sm:items-center gap-3 sm:gap-4">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-700 dark:from-slate-100 dark:to-slate-300 text-white dark:text-slate-900 flex items-center justify-center shadow-lg ring-1 ring-slate-200/70 dark:ring-slate-700/60 shrink-0">
              <Wrench className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div className="min-w-0">
              <h1 className="text-2xl sm:text-3xl font-semibold text-slate-900 dark:text-slate-100 leading-tight">Maintenance Requests</h1>
              <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 leading-relaxed">Report issues and track updates from your community admins.</p>
            </div>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Submit request</CardTitle>
            <CardDescription>Provide clear details and optional photos so admins can resolve issues faster.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input
              placeholder="Issue title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />

            <Textarea
              placeholder="Describe the issue, exact location, and any safety concerns"
              className="min-h-[120px]"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />

            <Input
              placeholder="Location (e.g., Tower B - Floor 4 - Corridor)"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />

            <div className="grid sm:grid-cols-2 gap-3">
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="plumbing">Plumbing</SelectItem>
                  <SelectItem value="electrical">Electrical</SelectItem>
                  <SelectItem value="housekeeping">Housekeeping</SelectItem>
                  <SelectItem value="amenity">Amenity</SelectItem>
                  <SelectItem value="security">Security</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>

              <Select value={priority} onValueChange={(value) => setPriority(value as any)}>
                <SelectTrigger>
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="rounded-lg border border-dashed border-slate-300 dark:border-slate-700 p-3">
              <label className="text-sm text-slate-600 dark:text-slate-300 flex items-center gap-2 mb-2">
                <Upload className="w-4 h-4" /> Upload photos (max 3)
              </label>
              <Input
                type="file"
                multiple
                accept="image/*"
                onChange={(e) => {
                  const nextFiles = validateSelectedFiles(Array.from(e.target.files || []));
                  setFiles(nextFiles);
                }}
              />
              {files.length > 0 && (
                <p className="text-xs text-slate-500 mt-2">Selected: {files.map((file) => file.name).join(', ')}</p>
              )}
            </div>

            <div className="flex justify-end">
              <Button onClick={submitRequest} disabled={submitting}>
                {submitting ? 'Submitting...' : 'Submit Request'}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Your requests</CardTitle>
            <CardDescription>Status timeline for all requests you submitted.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {loading ? (
              <p className="text-sm text-slate-500">Loading requests...</p>
            ) : sortedRequests.length === 0 ? (
              <p className="text-sm text-slate-500">No requests yet.</p>
            ) : (
              sortedRequests.map((request) => (
                <div key={request.id} className="rounded-lg border border-slate-200 dark:border-slate-800 p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="font-medium text-slate-900 dark:text-slate-100">{request.title}</h3>
                    <div className="flex items-center gap-2">
                      {priorityBadge(request.priority)}
                      {statusBadge(request.status)}
                    </div>
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">{request.description}</p>
                  <div className="text-xs text-slate-500 mt-2 flex items-center gap-3">
                    <span className="inline-flex items-center gap-1"><Clock3 className="w-3.5 h-3.5" /> {String(request.category || 'general')}</span>
                    {request.status === 'resolved' || request.status === 'closed' ? (
                      <span className="inline-flex items-center gap-1"><CircleCheckBig className="w-3.5 h-3.5" /> Resolved</span>
                    ) : (
                      <span className="inline-flex items-center gap-1"><AlertTriangle className="w-3.5 h-3.5" /> In queue</span>
                    )}
                  </div>
                  {request.location && (
                    <p className="text-xs text-slate-500 mt-1">Location: {request.location}</p>
                  )}

                  {request.history && request.history.length > 0 && (
                    <div className="mt-3 rounded-md border border-slate-200 dark:border-slate-800 p-2.5 bg-slate-50/70 dark:bg-slate-900/40">
                      <p className="text-xs font-medium text-slate-700 dark:text-slate-300 mb-2">Timeline</p>
                      <div className="space-y-2">
                        {[...request.history].slice(-3).reverse().map((event) => (
                          <div key={event.id} className="text-xs text-slate-600 dark:text-slate-400">
                            <p className="font-medium text-slate-700 dark:text-slate-300">{String(event.status || '').replace('_', ' ')}</p>
                            {event.note && <p>{event.note}</p>}
                            <p>
                              {event.updatedByName || 'Admin'}
                              {event.assignedTo ? ` • Assigned: ${event.assignedTo}` : ''}
                              {event.timestamp ? ` • ${new Date(event.timestamp?.seconds ? event.timestamp.seconds * 1000 : event.timestamp).toLocaleString()}` : ''}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {request.imageUrls?.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {request.imageUrls.map((url, idx) => (
                        <a key={`${request.id}-${idx}`} href={url} target="_blank" rel="noreferrer" className="text-xs text-blue-600 dark:text-blue-400 underline">
                          Image {idx + 1}
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
