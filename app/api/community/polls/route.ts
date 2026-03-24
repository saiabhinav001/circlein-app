import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { adminDb } from '@/lib/firebase-admin';

export const dynamic = 'force-dynamic';

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

    const body = await request.json();
    const question = String(body?.question || '').trim();
    const options = Array.isArray(body?.options)
      ? body.options.map((option: unknown) => String(option || '').trim()).filter(Boolean)
      : [];
    const deadlineRaw = String(body?.deadline || '');

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
