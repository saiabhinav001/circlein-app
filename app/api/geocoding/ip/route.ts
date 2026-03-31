import { NextRequest, NextResponse } from 'next/server'
import type { GeocodingResult } from '@/lib/geocoding'

export const dynamic = 'force-dynamic'

type CachedResult = {
  expiresAt: number
  result: GeocodingResult | null
}

const IP_LOOKUP_CACHE = new Map<string, CachedResult>()

function getClientIp(request: NextRequest): string {
  const candidates = [
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim(),
    request.headers.get('x-real-ip')?.trim(),
    request.headers.get('cf-connecting-ip')?.trim(),
    request.headers.get('x-vercel-forwarded-for')?.trim(),
  ]

  return candidates.find(Boolean) || 'anonymous'
}

function isPublicIp(ip: string): boolean {
  const normalized = ip.trim()
  if (!normalized) return false

  if (normalized.includes(':')) {
    const lower = normalized.toLowerCase()
    return !(lower === '::1' || lower.startsWith('fe80:') || lower.startsWith('fc') || lower.startsWith('fd'))
  }

  const parts = normalized.split('.').map((part) => Number(part))
  if (parts.length !== 4 || parts.some((part) => !Number.isInteger(part) || part < 0 || part > 255)) {
    return false
  }

  if (parts[0] === 10) return false
  if (parts[0] === 127) return false
  if (parts[0] === 192 && parts[1] === 168) return false
  if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return false

  return true
}

async function fetchJson(url: string, timeoutMs: number): Promise<any | null> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)

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
    clearTimeout(timer)
  }
}

function buildDisplayName(city: string, region: string, country: string): string {
  const parts = [city, region, country].filter(Boolean)
  return parts.length > 0 ? parts.join(', ') : 'Approximate location'
}

function mapIpApiCo(data: any): GeocodingResult | null {
  const lat = Number(data?.latitude)
  const lon = Number(data?.longitude)

  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    return null
  }

  const city = String(data?.city || '').trim()
  const state = String(data?.region || '').trim()
  const country = String(data?.country_name || '').trim()

  return {
    id: 'ipapi',
    source: 'ip',
    displayName: buildDisplayName(city, state, country),
    shortName: city || state || country || 'Approximate location',
    city,
    state,
    country,
    countryCode: String(data?.country_code || '').toUpperCase(),
    lat,
    lon,
  }
}

function mapIpWhoIs(data: any): GeocodingResult | null {
  if (data?.success === false) {
    return null
  }

  const lat = Number(data?.latitude)
  const lon = Number(data?.longitude)

  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    return null
  }

  const city = String(data?.city || '').trim()
  const state = String(data?.region || '').trim()
  const country = String(data?.country || '').trim()

  return {
    id: 'ipwhois',
    source: 'ip',
    displayName: buildDisplayName(city, state, country),
    shortName: city || state || country || 'Approximate location',
    city,
    state,
    country,
    countryCode: String(data?.country_code || '').toUpperCase(),
    lat,
    lon,
  }
}

function mapIpInfo(data: any): GeocodingResult | null {
  const loc = String(data?.loc || '').trim()
  if (!loc.includes(',')) {
    return null
  }

  const [latRaw, lonRaw] = loc.split(',')
  const lat = Number(latRaw)
  const lon = Number(lonRaw)

  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    return null
  }

  const city = String(data?.city || '').trim()
  const state = String(data?.region || '').trim()
  const country = String(data?.country || '').trim()

  return {
    id: 'ipinfo',
    source: 'ip',
    displayName: buildDisplayName(city, state, country),
    shortName: city || state || country || 'Approximate location',
    city,
    state,
    country,
    countryCode: String(data?.country || '').toUpperCase(),
    lat,
    lon,
  }
}

async function lookupApproximateLocation(clientIp: string): Promise<GeocodingResult | null> {
  const encodedIp = encodeURIComponent(clientIp)
  const ipSegment = isPublicIp(clientIp) ? `/${encodedIp}` : ''

  const providers: Array<() => Promise<GeocodingResult | null>> = [
    async () => {
      const data = await fetchJson(`https://ipapi.co${ipSegment}/json/`, 4500)
      return data ? mapIpApiCo(data) : null
    },
    async () => {
      const data = await fetchJson(`https://ipwho.is${ipSegment}`, 4500)
      return data ? mapIpWhoIs(data) : null
    },
    async () => {
      const data = await fetchJson(`https://ipinfo.io${ipSegment}/json`, 4500)
      return data ? mapIpInfo(data) : null
    },
  ]

  for (const provider of providers) {
    const result = await provider()
    if (result) {
      return result
    }
  }

  return null
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const clientIp = getClientIp(request)
    const cacheKey = `ip:${clientIp}`
    const cached = IP_LOOKUP_CACHE.get(cacheKey)

    if (cached && cached.expiresAt > Date.now()) {
      return NextResponse.json(
        { result: cached.result },
        {
          status: cached.result ? 200 : 502,
          headers: {
            'Cache-Control': 'private, max-age=300',
          },
        }
      )
    }

    const result = await lookupApproximateLocation(clientIp)

    IP_LOOKUP_CACHE.set(cacheKey, {
      expiresAt: Date.now() + 5 * 60 * 1000,
      result,
    })

    if (!result) {
      return NextResponse.json(
        { result: null, error: 'ip_coordinates_unavailable' },
        {
          status: 502,
          headers: {
            'Cache-Control': 'private, max-age=120',
          },
        }
      )
    }

    return NextResponse.json(
      { result },
      {
        headers: {
          'Cache-Control': 'private, max-age=300',
        },
      }
    )
  } catch (error: any) {
    console.error('Approximate location lookup failed:', error)
    return NextResponse.json({ result: null, error: 'ip_lookup_failed' }, { status: 500 })
  }
}
