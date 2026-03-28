'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useSession } from 'next-auth/react';
import {
  arrayUnion,
  collection,
  collectionGroup,
  doc,
  getDocs,
  onSnapshot,
  query,
  runTransaction,
  Timestamp,
  updateDoc,
  where,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  Megaphone,
  Pin,
  Trash2,
  Pencil,
  RotateCcw,
  MessageSquare,
  Heart,
  ThumbsUp,
  PartyPopper,
  Trophy,
  Clock,
  Users,
  BarChart3,
  Flame,
  Lightbulb,
  ClipboardCheck,
  ShieldCheck,
  FileText,
  Wand2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import PollsWidget from '@/components/community/polls-widget';
import { useCommunityTimeZone } from '@/components/providers/community-branding-provider';
import { formatDateInTimeZone } from '@/lib/timezone';
import { cn } from '@/lib/utils';

interface AnnouncementComment {
  id: string;
  userEmail: string;
  userName: string;
  text: string;
  createdAt: Date;
}

interface Announcement {
  id: string;
  title: string;
  body: string;
  authorId: string;
  authorName: string;
  communityId: string;
  pinnedAt: Date | null;
  deletedAt: Date | null;
  deletedBy: string | null;
  createdAt: Date;
  reactionCounts: Record<string, number>;
  reactionsByUser: Record<string, string>;
  comments: AnnouncementComment[];
}

interface Poll {
  id: string;
  question: string;
  options: string[];
  votes: Record<string, number>;
  communityId: string;
  createdBy: string;
  createdAt: Date;
  deadline: Date;
  status: 'open' | 'closed';
}

interface LeaderboardRow {
  email: string;
  name: string;
  bookingCount: number;
  pollVotes: number;
  badges: number;
  score: number;
}

const REACTIONS = [
  { key: 'heart', label: 'Love', emoji: '❤️', Icon: Heart },
  { key: 'thumbs_up', label: 'Like', emoji: '👍', Icon: ThumbsUp },
  { key: 'party', label: 'Celebrate', emoji: '🎉', Icon: PartyPopper },
] as const;

const REACTION_SPRING = {
  type: 'spring' as const,
  stiffness: 520,
  damping: 28,
  mass: 0.55,
};

const toDateSafe = (value: any): Date => {
  if (!value) {
    return new Date();
  }
  if (value instanceof Date) {
    return value;
  }
  if (value?.toDate) {
    return value.toDate();
  }
  return new Date(value);
};

const randomId = () => Math.random().toString(36).slice(2, 10);

const stripMarkdown = (text: string): string => {
  return text
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\!\[[^\]]*\]\([^\)]*\)/g, ' ')
    .replace(/\[[^\]]+\]\([^\)]*\)/g, '$1')
    .replace(/^\s{0,3}(#{1,6})\s+/gm, '')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/_([^_]+)_/g, '$1')
    .replace(/~~([^~]+)~~/g, '$1')
    .replace(/^\s*[-*+]\s+/gm, '')
    .replace(/^\s*\d+\.\s+/gm, '')
    .replace(/\n+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
};

const formatRelative = (date: Date, timeZone: string): string => {
  const diffSeconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (diffSeconds < 60) return 'just now';
  const diffMinutes = Math.floor(diffSeconds / 60);
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return formatDateInTimeZone(date, timeZone, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

const formatCountdown = (deadline: Date): string => {
  const diff = deadline.getTime() - Date.now();
  if (diff <= 0) return 'Closed';

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const mins = Math.floor((diff / (1000 * 60)) % 60);

  if (days > 0) return `${days}d ${hours}h left`;
  if (hours > 0) return `${hours}h ${mins}m left`;
  return `${mins}m left`;
};

export default function CommunityPage() {
  const { data: session } = useSession();
  const timeZone = useCommunityTimeZone();

  const communityId = session?.user?.communityId;
  const userEmail = session?.user?.email || '';
  const isAdmin = session?.user?.role === 'admin';

  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [polls, setPolls] = useState<Poll[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [leaderboardLoading, setLeaderboardLoading] = useState(true);

  const [announcementTitle, setAnnouncementTitle] = useState('');
  const [announcementBody, setAnnouncementBody] = useState('');
  const [postingAnnouncement, setPostingAnnouncement] = useState(false);

  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});

  const [pollQuestion, setPollQuestion] = useState('');
  const [pollDeadline, setPollDeadline] = useState('');
  const [pollOptions, setPollOptions] = useState(['', '']);
  const [creatingPoll, setCreatingPoll] = useState(false);
  const [nowTick, setNowTick] = useState(Date.now());
  const [selectedAdminTemplate, setSelectedAdminTemplate] = useState<string>('');
  const [deletingAnnouncementId, setDeletingAnnouncementId] = useState<string | null>(null);
  const [restoringAnnouncementId, setRestoringAnnouncementId] = useState<string | null>(null);
  const [reactionPendingByAnnouncement, setReactionPendingByAnnouncement] = useState<Record<string, string | undefined>>({});
  const [reactionPulseByAnnouncement, setReactionPulseByAnnouncement] = useState<Record<string, string>>({});
  const [editingAnnouncementId, setEditingAnnouncementId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [editingBody, setEditingBody] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);
  const [reactionDetail, setReactionDetail] = useState<{ announcementId: string; reactionKey: string } | null>(null);
  const pendingReactionsRef = useRef<Record<string, string | undefined>>({});

  useEffect(() => {
    pendingReactionsRef.current = reactionPendingByAnnouncement;
  }, [reactionPendingByAnnouncement]);

  useEffect(() => {
    const timer = setInterval(() => {
      setNowTick(Date.now());
    }, 30000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!communityId) {
      setAnnouncements([]);
      setPolls([]);
      setLeaderboard([]);
      setLoading(false);
      setLeaderboardLoading(false);
      return;
    }

    const syncPollClosure = async () => {
      try {
        await fetch('/api/community/polls/close-expired', {
          method: 'POST',
        });
      } catch {
        // no-op: onSnapshot + local deadline checks still keep UI accurate
      }
    };

    syncPollClosure();
    const interval = setInterval(syncPollClosure, 60_000);

    return () => clearInterval(interval);
  }, [communityId]);

  useEffect(() => {
    if (!communityId) {
      setLoading(false);
      return;
    }

    setLoading(true);

    const announcementsQuery = query(
      collection(db, 'announcements'),
      where('communityId', '==', communityId)
    );

    const pollsQuery = query(
      collection(db, 'polls'),
      where('communityId', '==', communityId)
    );

    const unsubAnnouncements = onSnapshot(
      announcementsQuery,
      (snapshot) => {
        const next = snapshot.docs.map((docSnapshot) => {
          const data = docSnapshot.data();
          const commentsRaw = Array.isArray(data.comments) ? data.comments : [];

          return {
            id: docSnapshot.id,
            title: data.title || '',
            body: data.body || '',
            authorId: data.authorId || '',
            authorName: data.authorName || 'Admin',
            communityId: data.communityId || '',
            pinnedAt: data.pinnedAt ? toDateSafe(data.pinnedAt) : null,
            deletedAt: data.deletedAt ? toDateSafe(data.deletedAt) : null,
            deletedBy: data.deletedBy || null,
            createdAt: toDateSafe(data.createdAt),
            reactionCounts: data.reactionCounts || {},
            reactionsByUser: data.reactionsByUser || {},
            comments: commentsRaw.map((comment: any) => ({
              id: comment.id || randomId(),
              userEmail: comment.userEmail || '',
              userName: comment.userName || 'Resident',
              text: comment.text || '',
              createdAt: toDateSafe(comment.createdAt),
            })),
          } as Announcement;
        });

        next.sort((a, b) => {
          if (a.pinnedAt && !b.pinnedAt) return -1;
          if (!a.pinnedAt && b.pinnedAt) return 1;
          return b.createdAt.getTime() - a.createdAt.getTime();
        });

        setAnnouncements((current) => {
          const currentById = new Map(current.map((announcement) => [announcement.id, announcement]));

          return next.map((announcement) => {
            const pendingReactionKey = pendingReactionsRef.current[announcement.id];
            if (!pendingReactionKey) {
              return announcement;
            }

            const local = currentById.get(announcement.id);
            if (!local) {
              return announcement;
            }

            return {
              ...announcement,
              reactionCounts: local.reactionCounts,
              reactionsByUser: local.reactionsByUser,
            };
          });
        });
        setLoading(false);
      },
      () => {
        setLoading(false);
        toast.error('Failed to load announcements.');
      }
    );

    const unsubPolls = onSnapshot(
      pollsQuery,
      (snapshot) => {
        const next = snapshot.docs.map((docSnapshot) => {
          const data = docSnapshot.data();

          return {
            id: docSnapshot.id,
            question: data.question || '',
            options: data.options || [],
            votes: data.votes || {},
            communityId: data.communityId || '',
            createdBy: data.createdBy || '',
            createdAt: toDateSafe(data.createdAt),
            deadline: toDateSafe(data.deadline),
            status: data.status || 'open',
          } as Poll;
        });

        next.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

        setPolls(next);
      },
      () => {
        toast.error('Failed to load polls.');
      }
    );

    return () => {
      unsubAnnouncements();
      unsubPolls();
    };
  }, [communityId]);

  useEffect(() => {
    if (!communityId) {
      setLeaderboardLoading(false);
      return;
    }

    const loadLeaderboard = async () => {
      setLeaderboardLoading(true);
      try {
        const [usersSnapshot, bookingsSnapshot, badgesSnapshot] = await Promise.all([
          getDocs(query(collection(db, 'users'), where('communityId', '==', communityId))),
          getDocs(query(collection(db, 'bookings'), where('communityId', '==', communityId))),
          getDocs(query(collectionGroup(db, 'badges'), where('communityId', '==', communityId))),
        ]);

        const badgeCountsByUser: Record<string, number> = {};
        badgesSnapshot.docs.forEach((docSnapshot) => {
          const parentUserId = docSnapshot.ref.parent.parent?.id;
          if (!parentUserId) return;
          badgeCountsByUser[parentUserId] = (badgeCountsByUser[parentUserId] || 0) + 1;
        });

        const bookingsByUser = bookingsSnapshot.docs.reduce((map, docSnapshot) => {
          const booking = docSnapshot.data() as any;
          if (!['confirmed', 'completed', 'pending_confirmation'].includes(booking.status)) {
            return map;
          }

          const email = String(booking.userId || booking.userEmail || '');
          if (!email) return map;

          map[email] = (map[email] || 0) + 1;
          return map;
        }, {} as Record<string, number>);

        const rows = await Promise.all(
          usersSnapshot.docs.map(async (userDoc) => {
            const userData = userDoc.data() as any;
            const email = String(userData.email || userDoc.id);
            const name = String(userData.name || email.split('@')[0] || 'Resident');
            const badgeDocId = userData.email || userDoc.id;
            const badges = badgeCountsByUser[badgeDocId] || 0;

            const pollVotes = polls.reduce((count, poll) => {
              return poll.votes[email] !== undefined ? count + 1 : count;
            }, 0);

            const bookingCount = bookingsByUser[email] || 0;
            const score = badges * 20 + bookingCount * 5 + pollVotes * 3;

            return {
              email,
              name,
              bookingCount,
              pollVotes,
              badges,
              score,
            };
          })
        );

        rows.sort((a, b) => b.score - a.score);
        setLeaderboard(rows.slice(0, 8));
      } catch {
        // Avoid disrupting admins with repeated toast noise if one source is delayed.
        setLeaderboard([]);
      } finally {
        setLeaderboardLoading(false);
      }
    };

    loadLeaderboard();
  }, [communityId, polls]);

  const applyAnnouncementTemplate = (templateKey: string) => {
    if (templateKey === 'maintenance') {
      setAnnouncementTitle('Planned maintenance update');
      setAnnouncementBody(
        '### Heads up\n\nWe will perform scheduled maintenance on **[amenity]** on **[date]** between **[time]**.\n\n- Expected impact: [brief impact]\n- Alternative options: [other amenities]\n\nThanks for your cooperation.'
      );
    }

    if (templateKey === 'event') {
      setAnnouncementTitle('Community event this weekend');
      setAnnouncementBody(
        '### You are invited\n\nJoin us for **[event name]** on **[date]** at **[time]**.\n\n- Location: [location]\n- Bring: [items]\n- Contact: [organizer]\n\nSee you there.'
      );
    }

    if (templateKey === 'policy') {
      setAnnouncementTitle('Policy reminder for shared amenities');
      setAnnouncementBody(
        '### Friendly reminder\n\nTo keep amenities enjoyable for everyone, please follow:\n\n1. [rule one]\n2. [rule two]\n3. [rule three]\n\nIf you need help, contact the admin team.'
      );
    }

    setSelectedAdminTemplate(templateKey);
  };

  const applyPollTemplate = (templateKey: string) => {
    if (templateKey === 'hours') {
      setPollQuestion('Should we extend weekend amenity hours?');
      setPollOptions(['Yes, extend by 1 hour', 'Keep current timing']);
    }

    if (templateKey === 'event') {
      setPollQuestion('Which community activity should we host next?');
      setPollOptions(['Fitness workshop', 'Movie night', 'Family games evening']);
    }

    if (templateKey === 'facility') {
      setPollQuestion('Which facility improvement should be prioritized?');
      setPollOptions(['Gym equipment upgrade', 'Pool seating area', 'Children play zone']);
    }
  };

  const createAnnouncement = async () => {
    if (!isAdmin || !communityId || !userEmail) return;
    if (!announcementTitle.trim() || !announcementBody.trim()) {
      toast.error('Title and content are required.');
      return;
    }

    setPostingAnnouncement(true);
    try {
      const response = await fetch('/api/community/announcements', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: announcementTitle.trim(),
          body: announcementBody.trim(),
          previewText: stripMarkdown(announcementBody).slice(0, 180),
        }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload?.error || 'Failed to post announcement');
      }

      setAnnouncementTitle('');
      setAnnouncementBody('');
      setSelectedAdminTemplate('');
      toast.success('Announcement posted.');
    } catch (error: any) {
      toast.error(error?.message || 'Failed to post announcement.');
    } finally {
      setPostingAnnouncement(false);
    }
  };

  const togglePin = async (announcement: Announcement) => {
    if (!isAdmin) return;

    try {
      const response = await fetch(`/api/community/announcements/${announcement.id}/pin`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          pinned: !announcement.pinnedAt,
        }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload?.error || 'Failed to update pin state');
      }
    } catch {
      toast.error('Failed to update pin state.');
    }
  };

  const reactToAnnouncement = async (announcement: Announcement, reactionKey: string) => {
    if (!userEmail) return;

    if (reactionPendingByAnnouncement[announcement.id]) {
      return;
    }

    const previous = announcement.reactionsByUser[userEmail];
    const previousCounts = { ...announcement.reactionCounts };
    const previousMap = { ...announcement.reactionsByUser };

    const optimisticCounts = { ...announcement.reactionCounts };
    const optimisticMap = { ...announcement.reactionsByUser };

    if (previous) {
      optimisticCounts[previous] = Math.max((optimisticCounts[previous] || 0) - 1, 0);
    }

    if (previous === reactionKey) {
      delete optimisticMap[userEmail];
    } else {
      optimisticMap[userEmail] = reactionKey;
      optimisticCounts[reactionKey] = (optimisticCounts[reactionKey] || 0) + 1;
    }

    setAnnouncements((current) =>
      current.map((currentAnnouncement) =>
        currentAnnouncement.id === announcement.id
          ? {
              ...currentAnnouncement,
              reactionCounts: optimisticCounts,
              reactionsByUser: optimisticMap,
            }
          : currentAnnouncement
      )
    );

    setReactionPendingByAnnouncement((current) => ({
      ...current,
      [announcement.id]: reactionKey,
    }));

    setReactionPulseByAnnouncement((current) => ({
      ...current,
      [announcement.id]: reactionKey,
    }));

    setTimeout(() => {
      setReactionPulseByAnnouncement((current) => {
        if (current[announcement.id] !== reactionKey) {
          return current;
        }

        const next = { ...current };
        delete next[announcement.id];
        return next;
      });
    }, 300);

    try {
      const nextState = await runTransaction(db, async (transaction) => {
        const ref = doc(db, 'announcements', announcement.id);
        const snapshot = await transaction.get(ref);
        if (!snapshot.exists()) {
          throw new Error('Announcement not found');
        }

        const data = snapshot.data() as any;
        const counts = { ...(data.reactionCounts || {}) };
        const map = { ...(data.reactionsByUser || {}) };
        const priorReaction = map[userEmail];

        if (priorReaction) {
          counts[priorReaction] = Math.max((counts[priorReaction] || 0) - 1, 0);
        }

        if (priorReaction === reactionKey) {
          delete map[userEmail];
        } else {
          map[userEmail] = reactionKey;
          counts[reactionKey] = (counts[reactionKey] || 0) + 1;
        }

        transaction.update(ref, {
          reactionCounts: counts,
          reactionsByUser: map,
        });

        return { counts, map };
      });

      setAnnouncements((current) =>
        current.map((currentAnnouncement) =>
          currentAnnouncement.id === announcement.id
            ? {
                ...currentAnnouncement,
                reactionCounts: nextState.counts,
                reactionsByUser: nextState.map,
              }
            : currentAnnouncement
        )
      );
    } catch {
      setAnnouncements((current) =>
        current.map((currentAnnouncement) =>
          currentAnnouncement.id === announcement.id
            ? {
                ...currentAnnouncement,
                reactionCounts: previousCounts,
                reactionsByUser: previousMap,
              }
            : currentAnnouncement
        )
      );
      toast.error('Could not update reaction.');
    } finally {
      setReactionPendingByAnnouncement((current) => {
        const next = { ...current };
        delete next[announcement.id];
        return next;
      });
    }
  };

  const deleteAnnouncement = async (announcement: Announcement) => {
    if (!isAdmin || deletingAnnouncementId) return;

    const shouldDelete = window.confirm(
      `Archive announcement \"${announcement.title}\"? Residents will no longer see it.`
    );

    if (!shouldDelete) {
      return;
    }

    setDeletingAnnouncementId(announcement.id);
    try {
      const response = await fetch(`/api/community/announcements/${announcement.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload?.error || 'Failed to delete announcement');
      }

      setAnnouncements((current) =>
        current.map((currentAnnouncement) =>
          currentAnnouncement.id === announcement.id
            ? {
                ...currentAnnouncement,
                deletedAt: new Date(),
                deletedBy: userEmail || 'admin',
              }
            : currentAnnouncement
        )
      );
      toast.success('Announcement archived.');
    } catch (error: any) {
      toast.error(error?.message || 'Failed to archive announcement.');
    } finally {
      setDeletingAnnouncementId(null);
    }
  };

  const restoreAnnouncement = async (announcement: Announcement) => {
    if (!isAdmin || restoringAnnouncementId) return;

    setRestoringAnnouncementId(announcement.id);
    try {
      const response = await fetch(`/api/community/announcements/${announcement.id}/restore`, {
        method: 'POST',
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload?.error || 'Failed to restore announcement');
      }

      setAnnouncements((current) =>
        current.map((currentAnnouncement) =>
          currentAnnouncement.id === announcement.id
            ? {
                ...currentAnnouncement,
                deletedAt: null,
                deletedBy: null,
              }
            : currentAnnouncement
        )
      );
      toast.success('Announcement restored.');
    } catch (error: any) {
      toast.error(error?.message || 'Failed to restore announcement.');
    } finally {
      setRestoringAnnouncementId(null);
    }
  };

  const startEditingAnnouncement = (announcement: Announcement) => {
    setEditingAnnouncementId(announcement.id);
    setEditingTitle(announcement.title);
    setEditingBody(announcement.body);
  };

  const cancelEditingAnnouncement = () => {
    setEditingAnnouncementId(null);
    setEditingTitle('');
    setEditingBody('');
  };

  const saveAnnouncementEdit = async (announcementId: string) => {
    if (!editingTitle.trim() || !editingBody.trim()) {
      toast.error('Title and content are required.');
      return;
    }

    setSavingEdit(true);
    try {
      const response = await fetch(`/api/community/announcements/${announcementId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: editingTitle.trim(),
          body: editingBody.trim(),
        }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload?.error || 'Failed to update announcement');
      }

      setAnnouncements((current) =>
        current.map((announcement) =>
          announcement.id === announcementId
            ? {
                ...announcement,
                title: editingTitle.trim(),
                body: editingBody.trim(),
              }
            : announcement
        )
      );

      toast.success('Announcement updated.');
      cancelEditingAnnouncement();
    } catch (error: any) {
      toast.error(error?.message || 'Failed to update announcement.');
    } finally {
      setSavingEdit(false);
    }
  };

  const addComment = async (announcement: Announcement) => {
    const text = (commentDrafts[announcement.id] || '').trim();
    if (!text || !userEmail) return;

    try {
      await updateDoc(doc(db, 'announcements', announcement.id), {
        comments: arrayUnion({
          id: randomId(),
          userEmail,
          userName: session?.user?.name || userEmail.split('@')[0],
          text,
          createdAt: Timestamp.now(),
        }),
      });

      setCommentDrafts((current) => ({ ...current, [announcement.id]: '' }));
    } catch {
      toast.error('Failed to add comment.');
    }
  };

  const createPoll = async () => {
    if (!isAdmin || !communityId || !userEmail) return;

    const cleanedOptions = pollOptions.map((opt) => opt.trim()).filter(Boolean);
    if (!pollQuestion.trim() || cleanedOptions.length < 2 || !pollDeadline) {
      toast.error('Question, 2 options, and deadline are required.');
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
          question: pollQuestion.trim(),
          options: cleanedOptions,
          deadline: new Date(pollDeadline).toISOString(),
        }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload?.error || 'Failed to create poll');
      }

      setPollQuestion('');
      setPollDeadline('');
      setPollOptions(['', '']);
      toast.success('Poll published.');
    } catch (error: any) {
      toast.error(error?.message || 'Failed to create poll.');
    } finally {
      setCreatingPoll(false);
    }
  };

  const voteOnPoll = async (poll: Poll, optionIndex: number) => {
    if (!userEmail) return;
    if (poll.status !== 'open' || poll.deadline.getTime() <= Date.now()) {
      toast.error('This poll is closed.');
      return;
    }

    try {
      await runTransaction(db, async (transaction) => {
        const pollRef = doc(db, 'polls', poll.id);
        const pollSnap = await transaction.get(pollRef);
        if (!pollSnap.exists()) {
          throw new Error('Poll not found');
        }

        const data = pollSnap.data() as any;
        const votes = { ...(data.votes || {}) };

        if (votes[userEmail] !== undefined) {
          throw new Error('You already voted');
        }

        const isOpen = data.status === 'open';
        const deadline = toDateSafe(data.deadline);
        if (!isOpen || deadline.getTime() <= Date.now()) {
          throw new Error('Poll is closed');
        }

        votes[userEmail] = optionIndex;
        transaction.update(pollRef, { votes });
      });

      toast.success('Vote recorded.');
    } catch (error: any) {
      if (error?.message === 'You already voted') {
        toast.error('You can only vote once in this poll.');
      } else {
        toast.error('Failed to submit vote.');
      }
    }
  };

  const pollChartData = (poll: Poll) => {
    const totalVotes = Object.keys(poll.votes).length;
    return poll.options.map((option, index) => {
      const votes = Object.values(poll.votes).filter((v) => v === index).length;
      const percentage = totalVotes > 0 ? Math.round((votes / totalVotes) * 100) : 0;
      return {
        name: option,
        votes,
        percentage,
      };
    });
  };

  const leaderboardHasData = useMemo(
    () => leaderboard.some((entry) => entry.score > 0),
    [leaderboard]
  );

  const activeAnnouncements = useMemo(
    () => announcements.filter((announcement) => !announcement.deletedAt),
    [announcements]
  );

  const deletedAnnouncements = useMemo(
    () => announcements.filter((announcement) => !!announcement.deletedAt),
    [announcements]
  );

  const selectedAnnouncementForReactionDetail = useMemo(() => {
    if (!reactionDetail) return null;
    return announcements.find((announcement) => announcement.id === reactionDetail.announcementId) || null;
  }, [announcements, reactionDetail]);

  const reactorsForSelectedReaction = useMemo(() => {
    if (!selectedAnnouncementForReactionDetail || !reactionDetail) {
      return [] as string[];
    }

    return Object.entries(selectedAnnouncementForReactionDetail.reactionsByUser)
      .filter(([, key]) => key === reactionDetail.reactionKey)
      .map(([email]) => email);
  }, [reactionDetail, selectedAnnouncementForReactionDetail]);

  const communityStats = useMemo(() => {
    const totalVotes = polls.reduce((sum, poll) => sum + Object.keys(poll.votes).length, 0);
    const totalComments = activeAnnouncements.reduce((sum, post) => sum + post.comments.length, 0);

    return {
      posts: activeAnnouncements.length,
      polls: polls.length,
      votes: totalVotes,
      comments: totalComments,
    };
  }, [activeAnnouncements, polls]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100/50 dark:from-slate-950 dark:via-slate-950 dark:to-slate-900/50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10">
        <div className="mb-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-gradient-to-br from-slate-50 via-white to-blue-50/70 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800/60 p-5 sm:p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200">
                <div className="w-9 h-9 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 flex items-center justify-center">
                  <Megaphone className="w-4.5 h-4.5" />
                </div>
                <h1 className="text-2xl font-semibold">Community Hub</h1>
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Announcements, polls, and community reputation in one place.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 w-full md:w-auto">
              <div className="rounded-xl border border-slate-200/80 dark:border-slate-700 bg-white/80 dark:bg-slate-900/70 px-3 py-2">
                <div className="text-xs text-slate-500 dark:text-slate-400">Posts</div>
                <div className="text-base font-semibold text-slate-900 dark:text-slate-100">{communityStats.posts}</div>
              </div>
              <div className="rounded-xl border border-slate-200/80 dark:border-slate-700 bg-white/80 dark:bg-slate-900/70 px-3 py-2">
                <div className="text-xs text-slate-500 dark:text-slate-400">Polls</div>
                <div className="text-base font-semibold text-slate-900 dark:text-slate-100">{communityStats.polls}</div>
              </div>
              <div className="rounded-xl border border-slate-200/80 dark:border-slate-700 bg-white/80 dark:bg-slate-900/70 px-3 py-2">
                <div className="text-xs text-slate-500 dark:text-slate-400">Votes</div>
                <div className="text-base font-semibold text-slate-900 dark:text-slate-100">{communityStats.votes}</div>
              </div>
              <div className="rounded-xl border border-slate-200/80 dark:border-slate-700 bg-white/80 dark:bg-slate-900/70 px-3 py-2">
                <div className="text-xs text-slate-500 dark:text-slate-400">Comments</div>
                <div className="text-base font-semibold text-slate-900 dark:text-slate-100">{communityStats.comments}</div>
              </div>
            </div>
          </div>
        </div>

        <Tabs defaultValue="feed" className="space-y-6">
          <TabsList className="grid grid-cols-3 w-full h-11 rounded-xl bg-slate-100/90 dark:bg-slate-900/80 p-1">
            <TabsTrigger value="feed">Feed</TabsTrigger>
            <TabsTrigger value="polls">Polls</TabsTrigger>
            <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
          </TabsList>

          <TabsContent value="feed" className="space-y-4">
            {isAdmin && (
              <Card className="border-blue-200 dark:border-blue-900/40 bg-blue-50/60 dark:bg-blue-950/20">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <ShieldCheck className="w-4.5 h-4.5 text-blue-600 dark:text-blue-400" />
                    Admin Operations Guide
                  </CardTitle>
                  <CardDescription>
                    Quick playbook to run announcements and polls with confidence.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid md:grid-cols-3 gap-2">
                    <Button type="button" variant="outline" className="justify-start" onClick={() => applyAnnouncementTemplate('maintenance')}>
                      <Wand2 className="w-4 h-4 mr-2" /> Maintenance template
                    </Button>
                    <Button type="button" variant="outline" className="justify-start" onClick={() => applyAnnouncementTemplate('event')}>
                      <Wand2 className="w-4 h-4 mr-2" /> Event template
                    </Button>
                    <Button type="button" variant="outline" className="justify-start" onClick={() => applyAnnouncementTemplate('policy')}>
                      <Wand2 className="w-4 h-4 mr-2" /> Policy template
                    </Button>
                  </div>

                  <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="workflow">
                      <AccordionTrigger>
                        <span className="flex items-center gap-2 text-sm">
                          <ClipboardCheck className="w-4 h-4" /> Standard admin workflow
                        </span>
                      </AccordionTrigger>
                      <AccordionContent className="text-sm text-slate-600 dark:text-slate-300 space-y-1">
                        <p>1. Use a template and edit placeholders before publishing.</p>
                        <p>2. Keep titles short and action-oriented so residents scan quickly.</p>
                        <p>3. Pin only one critical announcement at a time.</p>
                        <p>4. Set poll deadlines at least 24 hours ahead for fair participation.</p>
                        <p>5. Review comments after posting and follow up with clarifications.</p>
                      </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="best-practices">
                      <AccordionTrigger>
                        <span className="flex items-center gap-2 text-sm">
                          <Lightbulb className="w-4 h-4" /> Communication best practices
                        </span>
                      </AccordionTrigger>
                      <AccordionContent className="text-sm text-slate-600 dark:text-slate-300 space-y-1">
                        <p>• Include what changed, when it applies, and who is impacted.</p>
                        <p>• Use bullet points for readability on mobile.</p>
                        <p>• For disruption notices, always include alternatives and contact path.</p>
                        <p>• For polls, keep options mutually exclusive and easy to compare.</p>
                      </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="policy">
                      <AccordionTrigger>
                        <span className="flex items-center gap-2 text-sm">
                          <FileText className="w-4 h-4" /> Governance reminders
                        </span>
                      </AccordionTrigger>
                      <AccordionContent className="text-sm text-slate-600 dark:text-slate-300 space-y-1">
                        <p>• Avoid sharing personal resident information in public announcements.</p>
                        <p>• Use neutral language and publish factual updates only.</p>
                        <p>• Archive outdated pinned posts by unpinning once resolved.</p>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </CardContent>
              </Card>
            )}

            {isAdmin && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Post announcement</CardTitle>
                  <CardDescription>
                    Share updates with all residents in this community.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {selectedAdminTemplate && (
                    <div className="text-xs text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/20 rounded-md px-2.5 py-1.5 inline-flex items-center gap-1.5">
                      <Wand2 className="w-3.5 h-3.5" />
                      Template applied: {selectedAdminTemplate}
                    </div>
                  )}

                  <Input
                    value={announcementTitle}
                    onChange={(e) => setAnnouncementTitle(e.target.value)}
                    placeholder="Announcement title"
                  />
                  <Textarea
                    value={announcementBody}
                    onChange={(e) => setAnnouncementBody(e.target.value)}
                    placeholder="Write your announcement. Markdown supported."
                    className="min-h-[110px]"
                  />
                  <div className="flex justify-end">
                    <Button type="button" onClick={createAnnouncement} disabled={postingAnnouncement}>
                      {postingAnnouncement ? 'Posting...' : 'Publish'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {isAdmin && deletedAnnouncements.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Recently archived posts</CardTitle>
                  <CardDescription>
                    Restore posts that were archived by mistake.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  {deletedAnnouncements.slice(0, 6).map((announcement) => (
                    <div
                      key={announcement.id}
                      className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 rounded-lg border border-slate-200 dark:border-slate-800 px-3 py-2"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-800 dark:text-slate-100 truncate">{announcement.title}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          Archived {announcement.deletedAt ? formatRelative(announcement.deletedAt, timeZone) : 'recently'}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full sm:w-auto"
                        disabled={restoringAnnouncementId === announcement.id}
                        onClick={() => restoreAnnouncement(announcement)}
                      >
                        <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
                        {restoringAnnouncementId === announcement.id ? 'Restoring...' : 'Restore'}
                      </Button>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {!communityId ? (
              <Card>
                <CardContent className="pt-6 text-sm text-slate-500 flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Community is not assigned yet. Please complete setup or contact your admin.
                </CardContent>
              </Card>
            ) : loading ? (
              <div className="grid gap-3">
                {[1, 2].map((key) => (
                  <Card key={key}>
                    <CardHeader className="space-y-2">
                      <div className="h-5 w-48 rounded-md bg-slate-200 dark:bg-slate-800 animate-pulse" />
                      <div className="h-4 w-64 rounded-md bg-slate-100 dark:bg-slate-900 animate-pulse" />
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="h-4 w-full rounded-md bg-slate-100 dark:bg-slate-900 animate-pulse" />
                      <div className="h-4 w-4/5 rounded-md bg-slate-100 dark:bg-slate-900 animate-pulse" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : activeAnnouncements.length === 0 ? (
              <Card>
                <CardContent className="pt-6 text-sm text-slate-500 flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  No announcements yet. Admin posts will appear here.
                </CardContent>
              </Card>
            ) : (
              activeAnnouncements.map((announcement) => {
                const selectedReaction = announcement.reactionsByUser[userEmail];

                return (
                  <motion.div
                    key={announcement.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <Card className="border-slate-200 dark:border-slate-800">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <CardTitle className="text-lg">{announcement.title}</CardTitle>
                              {announcement.pinnedAt && (
                                <Badge variant="secondary" className="text-xs gap-1">
                                  <Pin className="w-3 h-3" /> Pinned
                                </Badge>
                              )}
                            </div>
                            <CardDescription>
                              Posted by {announcement.authorName} • {formatRelative(announcement.createdAt, timeZone)}
                            </CardDescription>
                          </div>

                          {isAdmin && (
                            <div className="flex flex-wrap items-center justify-end gap-2">
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="w-full xs:w-auto"
                                onClick={() => togglePin(announcement)}
                              >
                                <Pin className="w-3.5 h-3.5 mr-1.5" />
                                {announcement.pinnedAt ? 'Unpin' : 'Pin'}
                              </Button>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="w-full xs:w-auto"
                                onClick={() => startEditingAnnouncement(announcement)}
                              >
                                <Pencil className="w-3.5 h-3.5 mr-1.5" />
                                Edit
                              </Button>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="w-full xs:w-auto border-red-300 text-red-700 hover:bg-red-50 dark:border-red-900/40 dark:text-red-300 dark:hover:bg-red-900/20"
                                disabled={deletingAnnouncementId === announcement.id}
                                onClick={() => deleteAnnouncement(announcement)}
                              >
                                <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                                {deletingAnnouncementId === announcement.id ? 'Deleting...' : 'Delete'}
                              </Button>
                            </div>
                          )}
                        </div>
                      </CardHeader>

                      <CardContent className="space-y-4">
                        {editingAnnouncementId === announcement.id ? (
                          <div className="space-y-3 rounded-lg border border-slate-200 dark:border-slate-800 p-3">
                            <Input
                              value={editingTitle}
                              onChange={(e) => setEditingTitle(e.target.value)}
                              placeholder="Announcement title"
                            />
                            <Textarea
                              value={editingBody}
                              onChange={(e) => setEditingBody(e.target.value)}
                              className="min-h-[120px]"
                              placeholder="Write your announcement"
                            />
                            <div className="flex flex-col sm:flex-row gap-2 sm:justify-end">
                              <Button type="button" variant="outline" onClick={cancelEditingAnnouncement}>
                                Cancel
                              </Button>
                              <Button
                                type="button"
                                onClick={() => saveAnnouncementEdit(announcement.id)}
                                disabled={savingEdit}
                              >
                                {savingEdit ? 'Saving...' : 'Save changes'}
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="prose prose-sm dark:prose-invert max-w-none">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                              {announcement.body}
                            </ReactMarkdown>
                          </div>
                        )}

                        <div className="relative">
                          <div className="flex flex-wrap gap-2">
                          {REACTIONS.map((reaction) => {
                            const count = announcement.reactionCounts[reaction.key] || 0;
                            const active = selectedReaction === reaction.key;
                            const pendingReactionKey = reactionPendingByAnnouncement[announcement.id];
                            const pending = !!pendingReactionKey;
                            const shouldPulse = reactionPulseByAnnouncement[announcement.id] === reaction.key;
                            return (
                              <motion.div
                                key={reaction.key}
                                whileHover={pending ? undefined : { scale: 1.02, y: -1 }}
                                whileTap={pending ? undefined : { scale: 0.9, y: 0 }}
                                transition={REACTION_SPRING}
                              >
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  className={cn(
                                    'relative gap-1.5 h-8 transition-all duration-150 overflow-hidden',
                                    active && 'border-slate-900 dark:border-slate-100 bg-slate-100 dark:bg-slate-800'
                                  )}
                                  onClick={() => reactToAnnouncement(announcement, reaction.key)}
                                >
                                  {shouldPulse ? (
                                    <motion.span
                                      initial={{ opacity: 0.3, scale: 0.78 }}
                                      animate={{ opacity: 0, scale: 1.28 }}
                                      transition={{ duration: 0.26, ease: 'easeOut' }}
                                      className="pointer-events-none absolute inset-0 rounded-md bg-gradient-to-r from-slate-200/40 via-slate-100/50 to-slate-200/40 dark:from-slate-700/30 dark:via-slate-600/30 dark:to-slate-700/30"
                                    />
                                  ) : null}
                                  <motion.span
                                    animate={shouldPulse ? { scale: [1, 1.28, 0.94, 1], rotate: [0, -6, 5, 0] } : { scale: 1, rotate: 0 }}
                                    transition={{ duration: 0.22 }}
                                  >
                                    {reaction.emoji}
                                  </motion.span>
                                  <motion.span
                                    key={`${announcement.id}-${reaction.key}-${count}`}
                                    initial={{ opacity: 0, y: 6, scale: 0.92 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    transition={REACTION_SPRING}
                                    className="tabular-nums"
                                  >
                                    {count}
                                  </motion.span>
                                </Button>
                              </motion.div>
                            );
                          })}
                          </div>
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            {REACTIONS.filter((reaction) => (announcement.reactionCounts[reaction.key] || 0) > 0).map((reaction) => (
                              <Button
                                type="button"
                                key={`${announcement.id}-${reaction.key}-view`}
                                variant="ghost"
                                size="sm"
                                className="h-7 px-2 text-xs text-slate-600 dark:text-slate-300"
                                onClick={() => setReactionDetail({ announcementId: announcement.id, reactionKey: reaction.key })}
                              >
                                {reaction.emoji} {announcement.reactionCounts[reaction.key]}
                              </Button>
                            ))}
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                            <MessageSquare className="w-3.5 h-3.5" />
                            {announcement.comments.length} comments
                          </div>

                          <div className="space-y-2">
                            {announcement.comments.slice(-4).map((comment) => (
                              <div
                                key={comment.id}
                                className="rounded-lg border border-slate-200 dark:border-slate-800 px-3 py-2"
                              >
                                <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">
                                  {comment.userName} • {formatRelative(comment.createdAt, timeZone)}
                                </div>
                                <p className="text-sm text-slate-800 dark:text-slate-200">{comment.text}</p>
                              </div>
                            ))}
                          </div>

                          <div className="flex flex-col sm:flex-row gap-2">
                            <Input
                              placeholder="Add a comment"
                              value={commentDrafts[announcement.id] || ''}
                              onChange={(e) =>
                                setCommentDrafts((current) => ({
                                  ...current,
                                  [announcement.id]: e.target.value,
                                }))
                              }
                            />
                            <Button type="button" className="w-full sm:w-auto" onClick={() => addComment(announcement)}>Reply</Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })
            )}

            <Dialog
              open={!!reactionDetail}
              onOpenChange={(open) => {
                if (!open) {
                  setReactionDetail(null);
                }
              }}
            >
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Reaction details</DialogTitle>
                  <DialogDescription>
                    Residents who reacted with {REACTIONS.find((reaction) => reaction.key === reactionDetail?.reactionKey)?.emoji || 'this emoji'}.
                  </DialogDescription>
                </DialogHeader>

                {reactorsForSelectedReaction.length === 0 ? (
                  <p className="text-sm text-slate-500">No reactors found.</p>
                ) : (
                  <div className="max-h-64 overflow-y-auto space-y-2">
                    {reactorsForSelectedReaction.map((email) => (
                      <div
                        key={email}
                        className="rounded-md border border-slate-200 dark:border-slate-800 px-3 py-2 text-sm text-slate-700 dark:text-slate-200"
                      >
                        {email}
                      </div>
                    ))}
                  </div>
                )}
              </DialogContent>
            </Dialog>
          </TabsContent>

          <TabsContent value="polls" className="space-y-4">
            <PollsWidget role={isAdmin ? 'admin' : 'resident'} />
          </TabsContent>

          <TabsContent value="leaderboard" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-amber-500" /> Resident reputation
                </CardTitle>
                <CardDescription>
                  Ranking based on badges, bookings, and poll participation.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {leaderboardLoading ? (
                  <p className="text-sm text-slate-500">Loading leaderboard...</p>
                ) : !leaderboardHasData ? (
                  <p className="text-sm text-slate-500">No activity yet. Be the first to participate.</p>
                ) : (
                  <div className="space-y-2">
                    {leaderboard.map((row, index) => (
                      <div
                        key={row.email}
                        className={cn(
                          'flex items-center justify-between rounded-lg border px-3 py-2',
                          index === 0
                            ? 'border-amber-200 bg-amber-50/70 dark:border-amber-900/40 dark:bg-amber-900/10'
                            : 'border-slate-200 dark:border-slate-800'
                        )}
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary">#{index + 1}</Badge>
                            <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                              {row.name}
                            </p>
                          </div>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                            {row.badges} badges • {row.bookingCount} bookings • {row.pollVotes} polls
                          </p>
                        </div>

                        <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                          {row.score} pts
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">How badges are earned</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-2 text-sm text-slate-600 dark:text-slate-300">
                <p>• Early Bird: Book any amenity before 9:00 AM.</p>
                <p>• Pool Regular: Complete 10 or more pool bookings.</p>
                <p>• Community Star: Vote in at least 3 polls.</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
