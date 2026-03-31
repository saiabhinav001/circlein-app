import { NextResponse } from 'next/server'
import type { GeocodingResult } from '@/lib/geocoding'

export const dynamic = 'force-dynamic'

function buildDisplayName(city: string, region: string, country: string): string {
  const parts = [city, region, country].filter(Boolean)
  return parts.length > 0 ? parts.join(', ') : 'Approximate location'
}

export async function GET(): Promise<NextResponse> {
  try {
    const response = await fetch('https://ipapi.co/json/', {
      cache: 'no-store',
      headers: {
        Accept: 'application/json',
      },
    })

    if (!response.ok) {
      return NextResponse.json({ result: null, error: 'ip_lookup_failed' }, { status: 502 })
    }

    const data = await response.json()
    const lat = Number(data?.latitude)
    const lon = Number(data?.longitude)

    if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
      return NextResponse.json({ result: null, error: 'ip_coordinates_unavailable' }, { status: 422 })
    }

    const city = String(data?.city || '').trim()
    const state = String(data?.region || '').trim()
    const country = String(data?.country_name || '').trim()

    const result: GeocodingResult = {
      displayName: buildDisplayName(city, state, country),
      shortName: city || state || country || 'Approximate location',
      city,
      state,
      country,
      countryCode: String(data?.country_code || '').toUpperCase(),
      lat,
      lon,
    }

    return NextResponse.json({ result })
  } catch (error: any) {
    console.error('Approximate location lookup failed:', error)
    return NextResponse.json({ result: null, error: 'ip_lookup_failed' }, { status: 500 })
  }
}
