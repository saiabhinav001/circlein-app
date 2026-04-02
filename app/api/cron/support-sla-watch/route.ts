import { NextRequest, NextResponse } from 'next/server';
import { runSupportSlaWatch } from '@/lib/support-sla-watch';

export const dynamic = 'force-dynamic';

function isAuthorized(request: NextRequest): boolean {
  const configuredSecret = process.env.CRON_SECRET;
  if (!configuredSecret) {
    return true;
  }

  const authHeader = request.headers.get('authorization') || '';
  const token = authHeader.replace('Bearer ', '').trim();
  const cronHeader = request.headers.get('x-cron-secret') || '';
  const queryToken = request.nextUrl.searchParams.get('secret') || '';

  return token === configuredSecret || cronHeader === configuredSecret || queryToken === configuredSecret;
}

function isDryRun(request: NextRequest): boolean {
  const value = String(request.nextUrl.searchParams.get('dryRun') || '').trim().toLowerCase();
  return value === '1' || value === 'true' || value === 'yes';
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    if (!isAuthorized(request)) {
      return NextResponse.json({ error: 'Unauthorized cron call' }, { status: 401 });
    }

    const dryRun = isDryRun(request);

    const result = await runSupportSlaWatch({
      dryRun,
      source: 'cron',
      triggeredBy: 'system:cron-support-sla-watch',
    });

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error: any) {
    console.error('Failed to run support SLA watch:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to run support SLA watch' },
      { status: 500 }
    );
  }
}
