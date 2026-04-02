import { NextRequest, NextResponse } from 'next/server'
import { searchLocations, type GeocodingResult } from '@/lib/geocoding'

export const dynamic = 'force-dynamic'

function buildDisplayName(city: string, region: string, country: string): string {
  const parts = [city, region, country].filter(Boolean)
  return parts.length > 0 ? parts.join(', ') : 'Approximate location'
}

type ProviderResult = {
  lat: number
  lon: number
  city: string
  state: string
  country: string
  countryCode: string
}

async function fetchJson(url: string, timeoutMs: number): Promise<any | null> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const response = await fetch(url, {
      cache: 'no-store',
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
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

function toNormalizedString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

function toCountryCode(value: unknown): string {
  return toNormalizedString(value).toUpperCase()
}

function toFiniteNumber(value: unknown): number | null {
  const numericValue = Number(value)
  return Number.isFinite(numericValue) ? numericValue : null
}

function toGeocodingResult(payload: ProviderResult): GeocodingResult {
  return {
    source: 'ip',
    displayName: buildDisplayName(payload.city, payload.state, payload.country),
    shortName: payload.city || payload.state || payload.country || 'Approximate location',
    city: payload.city,
    state: payload.state,
    country: payload.country,
    countryCode: payload.countryCode,
    lat: payload.lat,
    lon: payload.lon,
  }
}

async function fromIpApiCo(): Promise<ProviderResult | null> {
  const data = await fetchJson('https://ipapi.co/json/', 3500)
  if (!data) {
    return null
  }

  const lat = toFiniteNumber(data?.latitude)
  const lon = toFiniteNumber(data?.longitude)
  if (lat === null || lon === null) {
    return null
  }

  return {
    lat,
    lon,
    city: toNormalizedString(data?.city),
    state: toNormalizedString(data?.region),
    country: toNormalizedString(data?.country_name),
    countryCode: toCountryCode(data?.country_code),
  }
}

async function fromIpWhoIs(): Promise<ProviderResult | null> {
  const data = await fetchJson('https://ipwho.is/', 3500)
  if (!data || data?.success === false) {
    return null
  }

  const lat = toFiniteNumber(data?.latitude)
  const lon = toFiniteNumber(data?.longitude)
  if (lat === null || lon === null) {
    return null
  }

  return {
    lat,
    lon,
    city: toNormalizedString(data?.city),
    state: toNormalizedString(data?.region),
    country: toNormalizedString(data?.country),
    countryCode: toCountryCode(data?.country_code),
  }
}

async function fromIpInfo(): Promise<ProviderResult | null> {
  const data = await fetchJson('https://ipinfo.io/json', 3500)
  if (!data) {
    return null
  }

  const [latRaw, lonRaw] = String(data?.loc || '').split(',')
  const lat = toFiniteNumber(latRaw)
  const lon = toFiniteNumber(lonRaw)
  if (lat === null || lon === null) {
    return null
  }

  return {
    lat,
    lon,
    city: toNormalizedString(data?.city),
    state: toNormalizedString(data?.region),
    country: toNormalizedString(data?.country),
    countryCode: toCountryCode(data?.country),
  }
}

async function fromEdgeHeaders(request: NextRequest): Promise<GeocodingResult | null> {
  const city = toNormalizedString(request.headers.get('x-vercel-ip-city'))
  const state = toNormalizedString(request.headers.get('x-vercel-ip-country-region'))
  const country = toNormalizedString(request.headers.get('x-vercel-ip-country'))

  if (!city && !state && !country) {
    return null
  }

  const hint = [city, state, country].filter(Boolean).join(', ')
  const candidates = await searchLocations(hint)
  const best = candidates[0]

  if (!best) {
    return null
  }

  return {
    ...best,
    source: 'ip',
    displayName: buildDisplayName(city || best.city, state || best.state, country || best.country),
    shortName: city || state || country || best.shortName,
    city: city || best.city,
    state: state || best.state,
    country: country || best.country,
    countryCode: toCountryCode(country || best.countryCode),
  }
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const providers = [fromIpApiCo, fromIpWhoIs, fromIpInfo]

    for (const provider of providers) {
      const providerResult = await provider()
      if (providerResult) {
        return NextResponse.json({ result: toGeocodingResult(providerResult) })
      }
    }

    const edgeHeaderFallback = await fromEdgeHeaders(request)
    if (edgeHeaderFallback) {
      return NextResponse.json({ result: edgeHeaderFallback })
    }

    return NextResponse.json({ result: null, error: 'ip_lookup_failed' }, { status: 502 })
  } catch (error: any) {
    console.error('Approximate location lookup failed:', error)
    return NextResponse.json({ result: null, error: 'ip_lookup_failed' }, { status: 500 })
  }
}
