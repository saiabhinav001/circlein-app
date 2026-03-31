'use client'

import { useEffect, useMemo, useState } from 'react'
import { ExternalLink, Loader2, LocateFixed, MapPin, Navigation } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { GeocodingResult } from '@/lib/geocoding'
import { toast } from 'sonner'

interface LocationPickerProps {
  onLocationSelected: (result: GeocodingResult) => void
  initialDisplayName?: string
  initialLocation?: {
    lat: number | null
    lon: number | null
    city?: string
    displayName?: string
  }
}

function buildResultKey(result: GeocodingResult, index: number): string {
  if (result.id) {
    return `${result.id}-${index}`
  }

  return `${result.displayName}-${result.lat}-${result.lon}-${index}`
}

function dedupeSuggestionResults(items: GeocodingResult[]): GeocodingResult[] {
  const seen = new Set<string>()
  const deduped: GeocodingResult[] = []

  for (const item of items) {
    const key = `${item.displayName.toLowerCase()}|${item.lat.toFixed(6)}|${item.lon.toFixed(6)}`
    if (seen.has(key)) {
      continue
    }

    seen.add(key)
    deduped.push(item)
  }

  return deduped
}

async function fetchLocationSuggestions(query: string): Promise<GeocodingResult[]> {
  const response = await fetch(`/api/geocoding/search?q=${encodeURIComponent(query)}`, {
    method: 'GET',
    cache: 'no-store',
  })

  if (!response.ok) {
    throw new Error('Failed to fetch location suggestions')
  }

  const payload = await response.json()
  return Array.isArray(payload?.results) ? payload.results : []
}

async function fetchReverseLocation(lat: number, lon: number): Promise<GeocodingResult | null> {
  const response = await fetch(`/api/geocoding/reverse?lat=${lat}&lon=${lon}`, {
    method: 'GET',
    cache: 'no-store',
  })

  if (!response.ok) {
    throw new Error('Failed to reverse geocode location')
  }

  const payload = await response.json()
  return payload?.result || null
}

async function fetchApproximateLocation(): Promise<GeocodingResult | null> {
  const response = await fetch('/api/geocoding/ip', {
    method: 'GET',
    cache: 'no-store',
  })

  if (!response.ok) {
    throw new Error('Failed to fetch approximate location')
  }

  const payload = await response.json()
  return payload?.result || null
}

export function LocationPicker({ onLocationSelected, initialDisplayName, initialLocation }: LocationPickerProps) {
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [geoLoading, setGeoLoading] = useState(false)
  const [results, setResults] = useState<GeocodingResult[]>([])
  const [selected, setSelected] = useState<GeocodingResult | null>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [highlightedIndex, setHighlightedIndex] = useState(-1)

  const previewMapUrl = useMemo(() => {
    if (!selected) return ''
    const bbox = `${selected.lon - 0.01}%2C${selected.lat - 0.01}%2C${selected.lon + 0.01}%2C${selected.lat + 0.01}`
    return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${selected.lat}%2C${selected.lon}`
  }, [selected])

  const openStreetMapUrl = useMemo(() => {
    if (!selected) return ''
    return `https://www.openstreetmap.org/?mlat=${selected.lat}&mlon=${selected.lon}#map=15/${selected.lat}/${selected.lon}`
  }, [selected])

  useEffect(() => {
    if (!selected && !query.trim() && initialDisplayName?.trim()) {
      setQuery(initialDisplayName.trim())
    }
  }, [initialDisplayName, query, selected])

  useEffect(() => {
    if (selected) {
      return
    }

    if (
      initialLocation &&
      Number.isFinite(initialLocation.lat) &&
      Number.isFinite(initialLocation.lon)
    ) {
      setSelected({
        displayName: initialLocation.displayName || `${initialLocation.lat}, ${initialLocation.lon}`,
        shortName: initialLocation.city || initialLocation.displayName || 'Saved location',
        city: initialLocation.city || '',
        state: '',
        country: '',
        countryCode: '',
        lat: Number(initialLocation.lat),
        lon: Number(initialLocation.lon),
      })
    }
  }, [initialLocation, selected])

  useEffect(() => {
    const normalized = query.trim()
    if (normalized.length < 2) {
      setResults([])
      setIsOpen(false)
      setHighlightedIndex(-1)
      return
    }

    let isActive = true

    const timeout = window.setTimeout(async () => {
      try {
        setLoading(true)
        const nextResults = await fetchLocationSuggestions(normalized)
        if (!isActive) return
        const dedupedResults = dedupeSuggestionResults(nextResults).slice(0, 20)
        setResults(dedupedResults)
        setIsOpen(true)
        setHighlightedIndex(dedupedResults.length > 0 ? 0 : -1)
      } catch {
        if (!isActive) return
        setResults([])
        setIsOpen(true)
      } finally {
        if (isActive) {
          setLoading(false)
        }
      }
    }, 300)

    return () => {
      isActive = false
      window.clearTimeout(timeout)
    }
  }, [query])

  const handleSelect = (result: GeocodingResult) => {
    setSelected(result)
    setQuery(result.displayName)
    setResults([])
    setIsOpen(false)
    setHighlightedIndex(-1)
    onLocationSelected(result)
  }

  const tryApproximateLocation = async () => {
    try {
      const result = await fetchApproximateLocation()
      if (!result) {
        toast.error('Could not determine approximate location. Try typing your location.')
        return
      }

      handleSelect(result)
      toast.success('Using approximate location based on network. Refine it with search if needed.')
    } catch {
      toast.error('Unable to detect approximate location. Please search manually.')
    }
  }

  const handleUseBrowserLocation = () => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      toast.error('Browser geolocation is not available. Falling back to approximate location.')
      void tryApproximateLocation()
      return
    }

    setGeoLoading(true)

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const result = await fetchReverseLocation(position.coords.latitude, position.coords.longitude)
          if (!result) {
            toast.error('Unable to resolve your current location.')
            return
          }
          handleSelect(result)
        } catch {
          toast.error('Unable to resolve your current location.')
        } finally {
          setGeoLoading(false)
        }
      },
      (error) => {
        setGeoLoading(false)
        if (error?.code === 1) {
          toast.error('Location permission denied. Using approximate location instead.')
        } else {
          toast.error('Precise location unavailable. Using approximate location instead.')
        }
        void tryApproximateLocation()
      },
      {
        enableHighAccuracy: false,
        timeout: 10000,
        maximumAge: 5 * 60 * 1000,
      }
    )
  }

  const handleInputKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || results.length === 0) return

    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setHighlightedIndex((prev) => (prev + 1) % results.length)
      return
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault()
      setHighlightedIndex((prev) => (prev <= 0 ? results.length - 1 : prev - 1))
      return
    }

    if (event.key === 'Enter') {
      event.preventDefault()
      const nextSelection = results[highlightedIndex] || results[0]
      if (nextSelection) {
        handleSelect(nextSelection)
      }
      return
    }

    if (event.key === 'Escape') {
      setIsOpen(false)
      setHighlightedIndex(-1)
    }
  }

  return (
    <div className="space-y-3">
      <div className="relative">
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={handleInputKeyDown}
          onFocus={() => {
            if (results.length > 0 || query.trim().length >= 2) {
              setIsOpen(true)
            }
          }}
          onBlur={() => {
            window.setTimeout(() => {
              setIsOpen(false)
              setHighlightedIndex(-1)
            }, 120)
          }}
          placeholder="Search location (e.g., Prestige Shantiniketan, Bangalore)"
          className="h-10"
          aria-label="Community location"
        />

        {loading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
            <Loader2 className="h-4 w-4 animate-spin" />
          </div>
        )}

        {isOpen && results.length > 0 && (
          <div className="absolute z-20 mt-1 max-h-64 w-full overflow-auto rounded-lg border border-slate-200 bg-white shadow-xl dark:border-slate-700 dark:bg-slate-900">
            {results.map((result, index) => {
              const isHighlighted = index === highlightedIndex

              return (
                <button
                  key={buildResultKey(result, index)}
                  type="button"
                  onClick={() => handleSelect(result)}
                  className={`w-full px-3 py-2 text-left transition-colors ${
                    isHighlighted
                      ? 'bg-emerald-50 dark:bg-emerald-900/30'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800/80'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-slate-900 dark:text-white">{result.shortName}</p>
                      <p className="truncate text-xs text-slate-500 dark:text-slate-400">{result.displayName}</p>
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        )}

        {isOpen && !loading && query.trim().length >= 2 && results.length === 0 && (
          <div className="absolute z-20 mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-500 shadow-xl dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
            No location suggestions found. Try a nearby landmark or city.
          </div>
        )}
      </div>

      <Button type="button" variant="outline" onClick={handleUseBrowserLocation} disabled={geoLoading} className="w-full sm:w-auto">
        {geoLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Navigation className="mr-2 h-4 w-4" />}
        Use my browser location
      </Button>

      <Button type="button" variant="ghost" onClick={tryApproximateLocation} className="w-full sm:w-auto text-xs sm:text-sm">
        <LocateFixed className="mr-2 h-4 w-4" />
        Use approximate location
      </Button>

      {selected && (
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 dark:border-emerald-700/50 dark:bg-emerald-900/20 dark:text-emerald-300">
            <MapPin className="h-3.5 w-3.5" />
            <span>{selected.displayName}</span>
            <span className="text-emerald-600/80 dark:text-emerald-300/80">({selected.lat.toFixed(5)}, {selected.lon.toFixed(5)})</span>
          </div>

          <div className="overflow-hidden rounded-md border border-slate-200 dark:border-slate-700">
            <iframe
              title="Selected community location preview"
              src={previewMapUrl}
              className="h-[140px] w-full max-w-[420px]"
              loading="lazy"
            />
          </div>

          {openStreetMapUrl && (
            <a
              href={openStreetMapUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300"
            >
              Open full map
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          )}
        </div>
      )}
    </div>
  )
}

export default LocationPicker
