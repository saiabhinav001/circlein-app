import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { adminDb } from '@/lib/firebase-admin';
import { PollCreateSchema } from '@/lib/schemas';

export const dynamic = 'force-dynamic';

function toIsoString(value: any): string {
  if (!value) return new Date(0).toISOString();
  if (value instanceof Date) return value.toISOString();
  if (typeof value?.toDate === 'function') {
    return value.toDate().toISOString();
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return new Date(0).toISOString();
  }

  return parsed.toISOString();
}

export async function GET(): Promise<NextResponse> {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const communityId = (session.user as any).communityId;
    if (!communityId) {
      return NextResponse.json({ error: 'Community ID missing' }, { status: 400 });
    }

    const snapshot = await adminDb
      .collection('polls')
      .where('communityId', '==', communityId)
      .get();

    const polls = snapshot.docs
      .map((docSnapshot) => {
        const data = docSnapshot.data() as any;

        return {
          id: docSnapshot.id,
          question: String(data.question || ''),
          options: Array.isArray(data.options)
            ? data.options.map((option: unknown) => String(option || '')).filter(Boolean)
            : [],
          votes: data.votes && typeof data.votes === 'object' ? data.votes : {},
          communityId: String(data.communityId || ''),
          createdBy: String(data.createdBy || ''),
          createdAt: toIsoString(data.createdAt),
          deadline: toIsoString(data.deadline),
          status: data.status === 'closed' ? 'closed' : 'open',
        };
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return NextResponse.json({ polls });
  } catch (error: any) {
    console.error('Failed to load polls:', error);
    return NextResponse.json(
      { error: 'Failed to load polls', details: error?.message || 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const role = (session.user as any).role;
    const communityId = (session.user as any).communityId;

    if (role !== 'admin' && role !== 'super_admin') {
      return NextResponse.json({ error: 'Admin privileges required' }, { status: 403 });
    }

    if (!communityId) {
      return NextResponse.json({ error: 'Community ID missing' }, { status: 400 });
    }

    const rawBody = await request.json();
    const parsedBody = PollCreateSchema.safeParse(rawBody);

    if (!parsedBody.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: parsedBody.error.issues },
        { status: 400 }
      );
    }

    const question = String(parsedBody.data.question || '').trim();
    const options = Array.isArray(parsedBody.data.options)
      ? parsedBody.data.options.map((option: unknown) => String(option || '').trim()).filter(Boolean)
      : [];
    const deadlineRaw = String(parsedBody.data.deadline || '');

    if (!question || options.length < 2 || !deadlineRaw) {
      return NextResponse.json(
        { error: 'Question, at least two options, and deadline are required' },
        { status: 400 }
      );
    }

    const deadline = new Date(deadlineRaw);
    if (Number.isNaN(deadline.getTime()) || deadline.getTime() <= Date.now()) {
      return NextResponse.json({ error: 'Deadline must be a valid future date' }, { status: 400 });
    }

    const now = new Date();

    const pollRef = await adminDb.collection('polls').add({
      question,
      options,
      votes: {},
      communityId,
      createdBy: session.user.email,
      createdByName: session.user.name || session.user.email,
      deadline,
      status: 'open',
      createdAt: now,
    });

    return NextResponse.json({
      success: true,
      pollId: pollRef.id,
    });
  } catch (error: any) {
    console.error('Failed to create poll:', error);
    return NextResponse.json(
      { error: 'Failed to create poll', details: error?.message || 'Unknown error' },
      { status: 500 }
    );
  }
}
