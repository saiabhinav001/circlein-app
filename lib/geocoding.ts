export type GeocodingResult = {
  id?: string
  source?: 'photon' | 'nominatim' | 'ip'
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

const SEARCH_LIMIT = 20

function normalizeText(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, ' ')
}

function toSafeString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

function createResultKey(result: GeocodingResult): string {
  const lat = Number.isFinite(result.lat) ? result.lat.toFixed(5) : '0'
  const lon = Number.isFinite(result.lon) ? result.lon.toFixed(5) : '0'
  return `${normalizeText(result.displayName)}|${lat}|${lon}`
}

function dedupeResults(results: GeocodingResult[]): GeocodingResult[] {
  const seen = new Set<string>()
  const deduped: GeocodingResult[] = []

  for (const result of results) {
    const key = createResultKey(result)
    if (seen.has(key)) {
      continue
    }
    seen.add(key)
    deduped.push(result)
  }

  return deduped
}

async function fetchJson(url: string, init: RequestInit, timeoutMs: number): Promise<any | null> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const response = await fetch(url, {
      ...init,
      signal: controller.signal,
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

function mapPhotonResult(feature: any, fallbackQuery: string): GeocodingResult | null {
  const lat = Number(feature?.geometry?.coordinates?.[1])
  const lon = Number(feature?.geometry?.coordinates?.[0])

  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    return null
  }

  const name = toSafeString(feature?.properties?.name)
  const street = toSafeString(feature?.properties?.street)
  const city =
    toSafeString(feature?.properties?.city) ||
    toSafeString(feature?.properties?.county) ||
    toSafeString(feature?.properties?.district)
  const state = toSafeString(feature?.properties?.state)
  const country = toSafeString(feature?.properties?.country)

  const displayName = [name, street, city, state, country].filter(Boolean).join(', ')

  if (!displayName) {
    return null
  }

  const idRaw = feature?.properties?.osm_id || feature?.properties?.osm_key || feature?.properties?.osm_value

  return {
    id: idRaw ? `photon-${String(idRaw)}` : `photon-${lat.toFixed(6)}-${lon.toFixed(6)}`,
    source: 'photon',
    displayName,
    shortName: name || city || fallbackQuery,
    city,
    state,
    country,
    countryCode: String(feature?.properties?.countrycode || '').toUpperCase(),
    lat,
    lon,
  }
}

function mapNominatimResult(entry: any, fallbackQuery: string): GeocodingResult | null {
  const lat = Number(entry?.lat)
  const lon = Number(entry?.lon)

  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    return null
  }

  const address = entry?.address || {}
  const city =
    toSafeString(address.city) ||
    toSafeString(address.town) ||
    toSafeString(address.village) ||
    toSafeString(address.county)
  const state = toSafeString(address.state)
  const country = toSafeString(address.country)
  const displayName = toSafeString(entry?.display_name)

  if (!displayName) {
    return null
  }

  const shortName =
    toSafeString(entry?.name) ||
    toSafeString(address.suburb) ||
    toSafeString(address.neighbourhood) ||
    city ||
    fallbackQuery

  return {
    id: entry?.place_id ? `nominatim-${String(entry.place_id)}` : `nominatim-${lat.toFixed(6)}-${lon.toFixed(6)}`,
    source: 'nominatim',
    displayName,
    shortName,
    city,
    state,
    country,
    countryCode: String(address.country_code || '').toUpperCase(),
    lat,
    lon,
  }
}

function rankResults(results: GeocodingResult[], query: string): GeocodingResult[] {
  const normalizedQuery = normalizeText(query)

  return [...results].sort((a, b) => {
    const aShort = normalizeText(a.shortName)
    const bShort = normalizeText(b.shortName)
    const aDisplay = normalizeText(a.displayName)
    const bDisplay = normalizeText(b.displayName)

    const aStarts = aShort.startsWith(normalizedQuery) ? 2 : aDisplay.startsWith(normalizedQuery) ? 1 : 0
    const bStarts = bShort.startsWith(normalizedQuery) ? 2 : bDisplay.startsWith(normalizedQuery) ? 1 : 0

    if (aStarts !== bStarts) {
      return bStarts - aStarts
    }

    const aContains = aDisplay.includes(normalizedQuery) ? 1 : 0
    const bContains = bDisplay.includes(normalizedQuery) ? 1 : 0

    if (aContains !== bContains) {
      return bContains - aContains
    }

    return aDisplay.localeCompare(bDisplay)
  })
}

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
 * Search global locations with Photon primary and Nominatim fallback.
 * Results are deduplicated, ranked, and cached to avoid repeated provider hits.
 */
export async function searchLocations(query: string): Promise<GeocodingResult[]> {
  const normalized = query.trim()
  if (normalized.length < 2) return []

  const cacheKey = normalized.toLowerCase()
  const cached = SEARCH_CACHE.get(cacheKey)
  if (cached && cached.expiresAt > Date.now()) {
    return cached.results
  }

  const commonInit = buildServerFetchInit(6 * 60 * 60)

  const photonUrl = `https://photon.komoot.io/api/?q=${encodeURIComponent(normalized)}&limit=${SEARCH_LIMIT}&lang=en`
  const photonData = await fetchJson(photonUrl, commonInit, 8000)
  const photonResults = ((photonData?.features ?? []) as any[])
    .map((feature) => mapPhotonResult(feature, normalized))
    .filter((result): result is GeocodingResult => Boolean(result))

  let mergedResults = photonResults

  if (mergedResults.length < Math.min(10, SEARCH_LIMIT)) {
    const nominatimUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
      normalized
    )}&format=jsonv2&addressdetails=1&limit=${SEARCH_LIMIT}`
    const nominatimData = await fetchJson(nominatimUrl, commonInit, 9000)
    const nominatimResults = ((nominatimData ?? []) as any[])
      .map((entry) => mapNominatimResult(entry, normalized))
      .filter((result): result is GeocodingResult => Boolean(result))

    mergedResults = [...mergedResults, ...nominatimResults]
  }

  const results = rankResults(dedupeResults(mergedResults), normalized).slice(0, SEARCH_LIMIT)

  SEARCH_CACHE.set(cacheKey, {
    expiresAt: Date.now() + 6 * 60 * 60 * 1000,
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
