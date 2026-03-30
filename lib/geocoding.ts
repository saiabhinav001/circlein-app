export type GeocodingResult = {
  displayName: string
  shortName: string
  city: string
  state: string
  country: string
  countryCode: string
  lat: number
  lon: number
}

type CachedSearch = {
  expiresAt: number
  results: GeocodingResult[]
}

type CachedReverse = {
  expiresAt: number
  result: GeocodingResult | null
}

const SEARCH_CACHE = new Map<string, CachedSearch>()
const REVERSE_CACHE = new Map<string, CachedReverse>()

function buildServerFetchInit(revalidateSeconds: number): RequestInit {
  const init: RequestInit = {}

  if (typeof window === 'undefined') {
    init.headers = { 'User-Agent': 'CircleIn-Community-App/1.0' }
    ;(init as RequestInit & { next?: { revalidate: number } }).next = {
      revalidate: revalidateSeconds,
    }
  }

  return init
}

/**
 * Search communities/locations using Photon (OpenStreetMap, zero cost).
 * Returns up to 8 results ranked by relevance.
 */
export async function searchLocations(query: string): Promise<GeocodingResult[]> {
  const normalized = query.trim()
  if (normalized.length < 2) return []

  const cacheKey = normalized.toLowerCase()
  const cached = SEARCH_CACHE.get(cacheKey)
  if (cached && cached.expiresAt > Date.now()) {
    return cached.results
  }

  const url = `https://photon.komoot.io/api/?q=${encodeURIComponent(normalized)}&limit=8&lang=en`
  const res = await fetch(url, buildServerFetchInit(3600))
  if (!res.ok) return []

  const data = await res.json()
  const results = ((data.features ?? []) as any[])
    .map((feature) => {
      const displayName = [
        feature?.properties?.name,
        feature?.properties?.street,
        feature?.properties?.city,
        feature?.properties?.state,
        feature?.properties?.country,
      ]
        .filter(Boolean)
        .join(', ')

      const lat = Number(feature?.geometry?.coordinates?.[1])
      const lon = Number(feature?.geometry?.coordinates?.[0])

      return {
        displayName,
        shortName: feature?.properties?.name || feature?.properties?.city || normalized,
        city: feature?.properties?.city || feature?.properties?.county || '',
        state: feature?.properties?.state || '',
        country: feature?.properties?.country || '',
        countryCode: String(feature?.properties?.countrycode || '').toUpperCase(),
        lat,
        lon,
      } satisfies GeocodingResult
    })
    .filter((result) => Number.isFinite(result.lat) && Number.isFinite(result.lon) && result.displayName)

  SEARCH_CACHE.set(cacheKey, {
    expiresAt: Date.now() + 60 * 60 * 1000,
    results,
  })

  return results
}

/**
 * Reverse geocode coordinates to a location name.
 */
export async function reverseGeocode(lat: number, lon: number): Promise<GeocodingResult | null> {
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    return null
  }

  const cacheKey = `${lat.toFixed(6)},${lon.toFixed(6)}`
  const cached = REVERSE_CACHE.get(cacheKey)
  if (cached && cached.expiresAt > Date.now()) {
    return cached.result
  }

  const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`
  const res = await fetch(url, buildServerFetchInit(86400))
  if (!res.ok) return null

  const data = await res.json()
  const result: GeocodingResult = {
    displayName: data?.display_name || `${lat.toFixed(4)}, ${lon.toFixed(4)}`,
    shortName:
      data?.address?.suburb ||
      data?.address?.neighbourhood ||
      data?.address?.city ||
      data?.address?.town ||
      data?.address?.village ||
      'Selected location',
    city: data?.address?.city || data?.address?.town || data?.address?.village || '',
    state: data?.address?.state || '',
    country: data?.address?.country || '',
    countryCode: String(data?.address?.country_code || '').toUpperCase(),
    lat,
    lon,
  }

  REVERSE_CACHE.set(cacheKey, {
    expiresAt: Date.now() + 24 * 60 * 60 * 1000,
    result,
  })

  return result
}
