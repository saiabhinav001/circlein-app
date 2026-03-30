import { NextRequest, NextResponse } from 'next/server'
import { searchLocations } from '@/lib/geocoding'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const query = (request.nextUrl.searchParams.get('q') || '').trim()
    if (query.length < 2) {
      return NextResponse.json({ results: [] })
    }

    const results = await searchLocations(query)
    return NextResponse.json({ results })
  } catch (error: any) {
    console.error('Geocoding search failed:', error)
    return NextResponse.json({ results: [], error: 'search_failed' }, { status: 500 })
  }
}
