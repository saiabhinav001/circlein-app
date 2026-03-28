'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSession } from 'next-auth/react';
import { doc, runTransaction } from 'firebase/firestore';
import { Clock, BarChart3 } from 'lucide-react';
import { toast } from 'sonner';
import { db } from '@/lib/firebase';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

type PollsRole = 'admin' | 'resident';

interface PollItem {
  id: string;
  question: string;
  options: string[];
  votes: Record<string, number>;
  deadline: string;
  status: 'open' | 'closed';
  createdAt: string;
}

interface PollsApiResponse {
  polls?: PollItem[];
  error?: string;
}

const formatCountdown = (deadline: Date, nowMs: number): string => {
  const diff = deadline.getTime() - nowMs;
  if (diff <= 0) return 'Closed';

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const mins = Math.floor((diff / (1000 * 60)) % 60);

  if (days > 0) return `${days}d ${hours}h left`;
  if (hours > 0) return `${hours}h ${mins}m left`;
  return `${mins}m left`;
};

const toDate = (value: string | undefined): Date => {
  if (!value) return new Date();
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
};

export default function PollsWidget({ role }: { role: PollsRole }) {
  const { data: session } = useSession();
  const userEmail = session?.user?.email || '';

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [polls, setPolls] = useState<PollItem[]>([]);
  const [creatingPoll, setCreatingPoll] = useState(false);
  const [votingPollId, setVotingPollId] = useState<string | null>(null);
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOptions, setPollOptions] = useState<string[]>(['', '']);
  const [pollDeadline, setPollDeadline] = useState('');
  const [nowMs, setNowMs] = useState(() => Date.now());

  const fetchPolls = async (showLoader = false) => {
    if (showLoader) {
      setLoading(true);
    }

    setError(null);

    try {
      await fetch('/api/community/polls/close-expired', {
        method: 'POST',
      }).catch(() => undefined);

      const response = await fetch('/api/community/polls', {
        method: 'GET',
        cache: 'no-store',
      });

      const payload = (await response.json().catch(() => ({}))) as PollsApiResponse;

      if (!response.ok) {
        throw new Error(payload.error || 'Failed to load polls');
      }

      setPolls(Array.isArray(payload.polls) ? payload.polls : []);
    } catch (fetchError: any) {
      setError(fetchError?.message || 'Failed to load polls');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchPolls(true);
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNowMs(Date.now());
    }, 30000);

    return () => window.clearInterval(timer);
  }, []);

  const handleCreatePoll = async () => {
    if (role !== 'admin') return;

    const question = pollQuestion.trim();
    const options = pollOptions.map((option) => option.trim()).filter(Boolean);

    if (!question || options.length < 2 || options.length > 4 || !pollDeadline) {
      toast.error('Question, 2-4 options, and expiry are required.');
      return;
    }

    const deadlineDate = new Date(pollDeadline);
    if (Number.isNaN(deadlineDate.getTime()) || deadlineDate.getTime() <= Date.now()) {
      toast.error('Expiry must be a valid future date and time.');
      return;
    }

    setCreatingPoll(true);

    try {
      const response = await fetch('/api/community/polls', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question,
          options,
          deadline: deadlineDate.toISOString(),
        }),
      });

      const payload = (await response.json().catch(() => ({}))) as { error?: string };

      if (!response.ok) {
        throw new Error(payload.error || 'Failed to create poll');
      }

      setPollQuestion('');
      setPollOptions(['', '']);
      setPollDeadline('');
      toast.success('Poll published.');
      await fetchPolls();
    } catch (createError: any) {
      toast.error(createError?.message || 'Failed to create poll.');
    } finally {
      setCreatingPoll(false);
    }
  };

  const handleVote = async (poll: PollItem, optionIndex: number) => {
    if (!userEmail) {
      toast.error('Sign in required to vote.');
      return;
    }

    const deadline = toDate(poll.deadline);
    const isClosed = poll.status !== 'open' || deadline.getTime() <= Date.now();

    if (isClosed) {
      toast.error('This poll is closed.');
      return;
    }

    if (poll.votes?.[userEmail] !== undefined) {
      toast.error('You can only vote once in this poll.');
      return;
    }

    setVotingPollId(poll.id);

    try {
      await runTransaction(db, async (transaction) => {
        const pollRef = doc(db, 'polls', poll.id);
        const pollSnap = await transaction.get(pollRef);

        if (!pollSnap.exists()) {
          throw new Error('Poll not found');
        }

        const data = pollSnap.data() as any;
        const votes = { ...(data.votes || {}) } as Record<string, number>;
        const status = String(data.status || 'open');
        const rawDeadline = data.deadline?.toDate ? data.deadline.toDate() : new Date(data.deadline);

        if (votes[userEmail] !== undefined) {
          throw new Error('You already voted');
        }

        if (status !== 'open' || rawDeadline.getTime() <= Date.now()) {
          throw new Error('Poll is closed');
        }

        votes[userEmail] = optionIndex;
        transaction.update(pollRef, { votes });
      });

      toast.success('Vote recorded.');
      await fetchPolls();
    } catch (voteError: any) {
      if (voteError?.message === 'You already voted') {
        toast.error('You can only vote once in this poll.');
      } else if (voteError?.message === 'Poll is closed') {
        toast.error('This poll is closed.');
      } else {
        toast.error('Failed to submit vote.');
      }
    } finally {
      setVotingPollId(null);
    }
  };

  const orderedPolls = useMemo(() => {
    return [...polls].sort((a, b) => toDate(b.createdAt).getTime() - toDate(a.createdAt).getTime());
  }, [polls]);

  return (
    <div className="space-y-4">
      {role === 'admin' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Create poll</CardTitle>
            <CardDescription>
              Ask residents a question and collect one vote per resident.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input
              value={pollQuestion}
              onChange={(event) => setPollQuestion(event.target.value)}
              placeholder="Poll question"
            />

            <div className="grid gap-2 sm:grid-cols-2">
              {pollOptions.map((option, index) => (
                <Input
                  key={index}
                  value={option}
                  onChange={(event) => {
                    const next = [...pollOptions];
                    next[index] = event.target.value;
                    setPollOptions(next);
                  }}
                  placeholder={`Option ${index + 1}`}
                />
              ))}
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={pollOptions.length >= 4}
                onClick={() => setPollOptions((current) => [...current, ''])}
              >
                Add option
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={pollOptions.length <= 2}
                onClick={() => setPollOptions((current) => current.slice(0, -1))}
              >
                Remove option
              </Button>
            </div>

            <div className="max-w-xs">
              <Input
                type="datetime-local"
                value={pollDeadline}
                onChange={(event) => setPollDeadline(event.target.value)}
              />
            </div>

            <div className="flex justify-end">
              <Button type="button" onClick={handleCreatePoll} disabled={creatingPoll}>
                {creatingPoll ? 'Publishing...' : 'Publish poll'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <div className="grid gap-3">
          {[1, 2].map((key) => (
            <Card key={key}>
              <CardHeader className="space-y-2">
                <div className="h-5 w-60 rounded-md bg-slate-200 dark:bg-slate-800 animate-pulse" />
                <div className="h-4 w-48 rounded-md bg-slate-100 dark:bg-slate-900 animate-pulse" />
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="h-9 rounded-md bg-slate-100 dark:bg-slate-900 animate-pulse" />
                <div className="h-9 rounded-md bg-slate-100 dark:bg-slate-900 animate-pulse" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : error ? (
        <Card>
          <CardContent className="pt-6 text-sm text-red-600 dark:text-red-300 space-y-3">
            <p>{error}</p>
            <Button type="button" variant="outline" onClick={() => void fetchPolls(true)}>
              Retry
            </Button>
          </CardContent>
        </Card>
      ) : orderedPolls.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-sm text-slate-500 flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            No active polls yet.
          </CardContent>
        </Card>
      ) : (
        orderedPolls.map((poll) => {
          const deadline = toDate(poll.deadline);
          const totalVotes = Object.keys(poll.votes || {}).length;
          const hasVoted = userEmail ? poll.votes?.[userEmail] !== undefined : false;
          const isClosed = poll.status !== 'open' || deadline.getTime() <= nowMs;

          return (
            <Card key={poll.id}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between gap-2">
                  <CardTitle className="text-lg">{poll.question}</CardTitle>
                  <Badge variant={isClosed ? 'secondary' : 'default'}>{isClosed ? 'Closed' : 'Open'}</Badge>
                </div>
                <CardDescription className="flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5" />
                  {formatCountdown(deadline, nowMs)} • {totalVotes} votes
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-3">
                <div className="grid gap-2">
                  {poll.options.map((option, index) => {
                    const votes = Object.values(poll.votes || {}).filter((value) => value === index).length;
                    const percent = totalVotes > 0 ? Math.round((votes / totalVotes) * 100) : 0;

                    return (
                      <button
                        key={`${poll.id}-${index}`}
                        type="button"
                        disabled={hasVoted || isClosed || votingPollId === poll.id}
                        onClick={() => void handleVote(poll, index)}
                        className={cn(
                          'text-left rounded-lg border px-3 py-2 transition-colors',
                          hasVoted && poll.votes?.[userEmail] === index
                            ? 'border-slate-900 dark:border-slate-100 bg-slate-100 dark:bg-slate-800'
                            : 'border-slate-200 dark:border-slate-800',
                          !hasVoted && !isClosed && 'hover:bg-slate-50 dark:hover:bg-slate-900'
                        )}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-sm text-slate-800 dark:text-slate-200">{option}</span>
                          <span className="text-xs text-slate-500 dark:text-slate-400">
                            {votes} ({percent}%)
                          </span>
                        </div>
                        <div className="mt-2 h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                          <div
                            className="h-full bg-slate-900 dark:bg-slate-200 transition-all duration-500"
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </button>
                    );
                  })}
                </div>

                {hasVoted && (
                  <div className="text-xs text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 rounded-md px-2.5 py-1.5 inline-flex items-center gap-1.5">
                    Your vote has been recorded
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })
      )}
    </div>
  );
}
