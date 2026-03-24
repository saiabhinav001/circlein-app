import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getSmartBookingSuggestions } from '@/lib/amenity-recommendations';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email || !session.user.communityId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const suggestions = await getSmartBookingSuggestions(
      session.user.email,
      session.user.communityId,
      2
    );

    return NextResponse.json({
      suggestions,
      source: 'local-pattern-engine',
      externalAiUsed: false,
    });
  } catch (error) {
    console.error('Error fetching smart recommendations:', error);
    return NextResponse.json(
      {
        suggestions: [],
        source: 'local-pattern-engine',
        externalAiUsed: false,
      },
      { status: 200 }
    );
  }
}
