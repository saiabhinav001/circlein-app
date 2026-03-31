import { NextRequest, NextResponse } from 'next/server'
import { searchLocations, type GeocodingResult } from '@/lib/geocoding'

export const dynamic = 'force-dynamic'

type ApproximateLocation = {
  city: string
  state: string
  country: string
  countryCode: string
  lat: number
  lon: number
}

function buildDisplayName(city: string, region: string, country: string): string {
  const parts = [city, region, country].filter(Boolean)
  return parts.length > 0 ? parts.join(', ') : 'Approximate location'
}

function toText(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

function isValidCoordinates(lat: number, lon: number): boolean {
  return Number.isFinite(lat) && Number.isFinite(lon)
}

function toGeocodingResult(location: ApproximateLocation): GeocodingResult {
  return {
    id: `ip-${location.lat.toFixed(6)}-${location.lon.toFixed(6)}`,
    source: 'ip',
    displayName: buildDisplayName(location.city, location.state, location.country),
    shortName: location.city || location.state || location.country || 'Approximate location',
    city: location.city,
    state: location.state,
    country: location.country,
    countryCode: location.countryCode,
    lat: location.lat,
    lon: location.lon,
  }
}

function fromIpApi(payload: any): ApproximateLocation | null {
  const lat = Number(payload?.latitude)
  const lon = Number(payload?.longitude)

  if (!isValidCoordinates(lat, lon)) {
    return null
  }

  return {
    city: toText(payload?.city),
    state: toText(payload?.region),
    country: toText(payload?.country_name),
    countryCode: toText(payload?.country_code).toUpperCase(),
    lat,
    lon,
  }
}

function fromIpWho(payload: any): ApproximateLocation | null {
  if (payload?.success === false) {
    return null
  }

  const lat = Number(payload?.latitude)
  const lon = Number(payload?.longitude)

  if (!isValidCoordinates(lat, lon)) {
    return null
  }

  return {
    city: toText(payload?.city),
    state: toText(payload?.region),
    country: toText(payload?.country),
    countryCode: toText(payload?.country_code).toUpperCase(),
    lat,
    lon,
  }
}

function fromIpInfo(payload: any): ApproximateLocation | null {
  const loc = toText(payload?.loc)
  const [latText, lonText] = loc.split(',')
  const lat = Number(latText)
  const lon = Number(lonText)

  if (!isValidCoordinates(lat, lon)) {
    return null
  }

  return {
    city: toText(payload?.city),
    state: toText(payload?.region),
    country: toText(payload?.country),
    countryCode: toText(payload?.country).toUpperCase(),
    lat,
    lon,
  }
}

async function fetchWithTimeout(url: string, timeoutMs: number): Promise<any | null> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const response = await fetch(url, {
      cache: 'no-store',
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
        'User-Agent': 'CircleIn-Community-App/1.0',
      },
    })

    if (!response.ok) {
      return null
    }

    return await response.json()
  } catch {
    return null
  } finally {
    clearTimeout(timeout)
  }
}

async function fromVercelGeoHeaders(request: NextRequest): Promise<GeocodingResult | null> {
  const city = toText(request.headers.get('x-vercel-ip-city'))
  const state = toText(request.headers.get('x-vercel-ip-country-region'))
  const countryCode = toText(request.headers.get('x-vercel-ip-country')).toUpperCase()

  if (!city && !state && !countryCode) {
    return null
  }

  const query = [city, state, countryCode].filter(Boolean).join(', ')
  if (!query) {
    return null
  }

  try {
    const matches = await searchLocations(query)
    if (matches.length === 0) {
      return null
    }

    const normalizedCity = city.toLowerCase()
    const preferred =
      matches.find((match) => normalizedCity && match.city.toLowerCase() === normalizedCity) ||
      matches[0]

    return {
      ...preferred,
      source: 'ip',
    }
  } catch {
    return null
  }
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const providers = [
      { url: 'https://ipapi.co/json/', parser: fromIpApi },
      { url: 'https://ipwho.is/', parser: fromIpWho },
      { url: 'https://ipinfo.io/json', parser: fromIpInfo },
    ] as const

    for (const provider of providers) {
      const payload = await fetchWithTimeout(provider.url, 7000)
      if (!payload) {
        continue
      }

      const location = provider.parser(payload)
      if (!location) {
        continue
      }

      return NextResponse.json({ result: toGeocodingResult(location) })
    }

    const vercelFallback = await fromVercelGeoHeaders(request)
    if (vercelFallback) {
      return NextResponse.json({ result: vercelFallback })
    }

    return NextResponse.json({ result: null, error: 'ip_lookup_failed' }, { status: 422 })
  } catch (error: any) {
    console.error('Approximate location lookup failed:', error)
    return NextResponse.json({ result: null, error: 'ip_lookup_failed' }, { status: 500 })
  }
}
