'use client'

import { useEffect, useMemo, useState } from 'react'
import { MapPin, Navigation, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { searchLocations, reverseGeocode, type GeocodingResult } from '@/lib/geocoding'
import { toast } from 'sonner'

interface LocationPickerProps {
  onLocationSelected: (result: GeocodingResult) => void
}

export function LocationPicker({ onLocationSelected }: LocationPickerProps) {
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [geoLoading, setGeoLoading] = useState(false)
  const [results, setResults] = useState<GeocodingResult[]>([])
  const [selected, setSelected] = useState<GeocodingResult | null>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [highlightedIndex, setHighlightedIndex] = useState(-1)

  const previewMapUrl = useMemo(() => {
    if (!selected) return ''
    return `https://staticmap.openstreetmap.de/staticmap.php?center=${selected.lat},${selected.lon}&zoom=15&size=300x100&maptype=mapnik`
  }, [selected])

  useEffect(() => {
    const normalized = query.trim()
    if (normalized.length < 2) {
      setResults([])
      setIsOpen(false)
      setHighlightedIndex(-1)
      return
    }

    const timeout = window.setTimeout(async () => {
      try {
        setLoading(true)
        const nextResults = await searchLocations(normalized)
        setResults(nextResults.slice(0, 6))
        setIsOpen(true)
        setHighlightedIndex(nextResults.length > 0 ? 0 : -1)
      } catch {
        setResults([])
        setIsOpen(false)
      } finally {
        setLoading(false)
      }
    }, 300)

    return () => window.clearTimeout(timeout)
  }, [query])

  const handleSelect = (result: GeocodingResult) => {
    setSelected(result)
    setQuery(result.displayName)
    setResults([])
    setIsOpen(false)
    setHighlightedIndex(-1)
    onLocationSelected(result)
  }

  const handleUseBrowserLocation = () => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      toast.error('Browser geolocation is not available.')
      return
    }

    setGeoLoading(true)

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const result = await reverseGeocode(position.coords.latitude, position.coords.longitude)
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
      () => {
        setGeoLoading(false)
        toast.error('Location permission denied or unavailable.')
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
                  key={`${result.displayName}-${result.lat}-${result.lon}`}
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
      </div>

      <Button type="button" variant="outline" onClick={handleUseBrowserLocation} disabled={geoLoading} className="w-full sm:w-auto">
        {geoLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Navigation className="mr-2 h-4 w-4" />}
        Use my browser location
      </Button>

      {selected && (
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 dark:border-emerald-700/50 dark:bg-emerald-900/20 dark:text-emerald-300">
            <MapPin className="h-3.5 w-3.5" />
            <span>{selected.displayName}</span>
            <span className="text-emerald-600/80 dark:text-emerald-300/80">({selected.lat.toFixed(5)}, {selected.lon.toFixed(5)})</span>
          </div>

          <img
            src={previewMapUrl}
            alt="Selected community location preview"
            className="h-[100px] w-full max-w-[300px] rounded-md border border-slate-200 object-cover dark:border-slate-700"
            loading="lazy"
          />
        </div>
      )}
    </div>
  )
}

export default LocationPicker
