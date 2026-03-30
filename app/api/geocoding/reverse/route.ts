import { NextRequest, NextResponse } from 'next/server'
import { reverseGeocode } from '@/lib/geocoding'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const latRaw = request.nextUrl.searchParams.get('lat')
    const lonRaw = request.nextUrl.searchParams.get('lon')

    const lat = Number(latRaw)
    const lon = Number(lonRaw)

    if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
      return NextResponse.json({ result: null, error: 'invalid_coordinates' }, { status: 400 })
    }

    const result = await reverseGeocode(lat, lon)
    return NextResponse.json({ result })
  } catch (error: any) {
    console.error('Reverse geocoding failed:', error)
    return NextResponse.json({ result: null, error: 'reverse_failed' }, { status: 500 })
  }
}
