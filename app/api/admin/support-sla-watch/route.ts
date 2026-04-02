import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { runSupportSlaWatch } from '@/lib/support-sla-watch';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const role = (session.user as any).role;
    if (role !== 'admin' && role !== 'super_admin') {
      return NextResponse.json({ error: 'Admin privileges required' }, { status: 403 });
    }

    const communityId = String((session.user as any).communityId || '').trim();
    if (!communityId) {
      return NextResponse.json({ error: 'Community ID missing' }, { status: 400 });
    }

    const body = await request.json().catch(() => ({}));
    const dryRun = body?.dryRun !== false;

    const result = await runSupportSlaWatch({
      communityId,
      dryRun,
      source: 'admin_manual',
      triggeredBy: session.user.email,
    });

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error: any) {
    console.error('Failed to run admin support SLA watch:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to run support SLA watch' },
      { status: 500 }
    );
  }
}
