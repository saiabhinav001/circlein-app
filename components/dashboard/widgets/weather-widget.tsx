'use client';

import { useEffect, useMemo, useState } from 'react';
import { CloudSun, Droplets, Umbrella, Wind } from 'lucide-react';
import { getWeatherEmoji, getWeatherForecast } from '@/lib/weather-service';

interface WeatherData {
  temp: number;
  feelsLike: number;
  condition: string;
  description: string;
  humidity: number;
  windSpeed: number;
  precipitation: number;
}

const FALLBACK_LOCATION = {
  latitude: 12.9716,
  longitude: 77.5946,
  label: 'Community area',
};

function getConditionAccent(condition: string): string {
  const normalized = condition.toLowerCase();

  if (normalized.includes('rain') || normalized.includes('storm')) {
    return 'bg-blue-500/25';
  }

  if (normalized.includes('cloud') || normalized.includes('overcast') || normalized.includes('fog')) {
    return 'bg-slate-400/25';
  }

  return 'bg-yellow-400/25';
}

function getCurrentCoordinates(): Promise<{ latitude: number; longitude: number } | null> {
  if (typeof window === 'undefined' || !navigator.geolocation) {
    return Promise.resolve(null);
  }

  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      () => resolve(null),
      { enableHighAccuracy: false, timeout: 5000, maximumAge: 5 * 60 * 1000 }
    );
  });
}

export function WeatherWidget() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [locationLabel, setLocationLabel] = useState(FALLBACK_LOCATION.label);

  const accentClass = useMemo(() => getConditionAccent(weather?.condition || ''), [weather?.condition]);

  useEffect(() => {
    let isMounted = true;

    const loadWeather = async () => {
      setLoading(true);

      try {
        const coords = await getCurrentCoordinates();
        const latitude = coords?.latitude ?? FALLBACK_LOCATION.latitude;
        const longitude = coords?.longitude ?? FALLBACK_LOCATION.longitude;
        setLocationLabel(coords ? 'Your location' : FALLBACK_LOCATION.label);

        const forecast = await getWeatherForecast(new Date(), latitude, longitude);

        if (!isMounted) {
          return;
        }

        if (forecast) {
          setWeather({
            temp: forecast.temp,
            feelsLike: forecast.feelsLike,
            condition: forecast.condition,
            description: forecast.description,
            humidity: forecast.humidity,
            windSpeed: forecast.windSpeed,
            precipitation: forecast.precipitation,
          });
        } else {
          setWeather(null);
        }
      } catch (error) {
        if (isMounted) {
          setWeather(null);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadWeather();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <section className="group relative overflow-hidden rounded-2xl border border-slate-200/90 bg-gradient-to-br from-white via-emerald-50/50 to-sky-50/50 p-4 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-lg hover:shadow-emerald-100/70 dark:border-slate-700/70 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800/90 dark:hover:border-emerald-700/60 dark:hover:shadow-emerald-950/40">
      <div className={`pointer-events-none absolute -top-10 -right-10 h-28 w-28 rounded-full blur-2xl ${accentClass}`} />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(16,185,129,0.16),transparent_52%),radial-gradient(circle_at_84%_14%,rgba(56,189,248,0.16),transparent_48%)] dark:bg-[radial-gradient(circle_at_18%_18%,rgba(16,185,129,0.16),transparent_52%),radial-gradient(circle_at_84%_14%,rgba(56,189,248,0.12),transparent_48%)]" />

      <div className="relative">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
          <CloudSun className="h-4 w-4 text-amber-500" />
          Weather
        </div>
        <p className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">{locationLabel}</p>

        {loading ? (
          <div className="mt-4 animate-pulse space-y-2">
            <div className="h-4 w-24 rounded bg-slate-200 dark:bg-slate-700" />
            <div className="h-8 w-16 rounded bg-slate-200 dark:bg-slate-700" />
          </div>
        ) : weather ? (
          <>
            <div className="mt-4 flex items-start justify-between gap-3">
              <div>
                <p className="text-4xl font-bold leading-none text-slate-900 dark:text-white">{weather.temp}°C</p>
                <p className="mt-2 text-sm text-slate-600 capitalize dark:text-slate-300">{weather.description}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Feels like {weather.feelsLike}°C</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/60 bg-white/60 text-3xl leading-none shadow-sm backdrop-blur-sm dark:border-slate-700/80 dark:bg-slate-800/80" aria-hidden="true">
                <span className="group-hover:scale-110 transition-transform duration-300">{getWeatherEmoji(weather.condition)}</span>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-2 text-xs text-slate-600 dark:text-slate-300">
              <div className="rounded-lg border border-white/50 bg-white/60 px-2 py-2 backdrop-blur-sm dark:border-slate-700/70 dark:bg-slate-800/70">
                <p className="flex items-center gap-1"><Droplets className="h-3.5 w-3.5" />{weather.humidity}%</p>
              </div>
              <div className="rounded-lg border border-white/50 bg-white/60 px-2 py-2 backdrop-blur-sm dark:border-slate-700/70 dark:bg-slate-800/70">
                <p className="flex items-center gap-1"><Wind className="h-3.5 w-3.5" />{weather.windSpeed} km/h</p>
              </div>
              <div className="rounded-lg border border-white/50 bg-white/60 px-2 py-2 backdrop-blur-sm dark:border-slate-700/70 dark:bg-slate-800/70">
                <p className="flex items-center gap-1"><Umbrella className="h-3.5 w-3.5" />{weather.precipitation}%</p>
              </div>
            </div>
          </>
        ) : (
          <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">Weather data is unavailable right now.</p>
        )}
      </div>
    </section>
  );
}
