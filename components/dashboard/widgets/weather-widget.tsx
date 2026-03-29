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
    <section className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-gray-900 to-gray-800 p-4 shadow-lg transition-all duration-200 hover:-translate-y-0.5 hover:border-white/20 hover:shadow-xl">
      <div className={`pointer-events-none absolute -top-10 -right-10 h-28 w-28 rounded-full blur-2xl ${accentClass}`} />

      <div className="relative">
        <div className="flex items-center gap-2 text-sm font-semibold text-white">
          <CloudSun className="h-4 w-4 text-amber-400" />
          Weather
        </div>
        <p className="mt-1 text-xs uppercase tracking-widest text-gray-500">{locationLabel}</p>

        {loading ? (
          <div className="mt-4 animate-pulse space-y-2">
            <div className="h-4 w-24 rounded bg-gray-700" />
            <div className="h-8 w-16 rounded bg-gray-700" />
          </div>
        ) : weather ? (
          <>
            <div className="mt-4 flex items-start justify-between gap-3">
              <div>
                <p className="text-4xl font-bold leading-none text-white">{weather.temp}°C</p>
                <p className="mt-2 text-sm text-gray-400 capitalize">{weather.description}</p>
                <p className="text-xs text-gray-500">Feels like {weather.feelsLike}°C</p>
              </div>
              <div className="text-3xl leading-none" aria-hidden="true">
                {getWeatherEmoji(weather.condition)}
              </div>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-2 text-xs text-gray-300">
              <div className="rounded-lg border border-white/10 bg-black/10 px-2 py-2">
                <p className="flex items-center gap-1"><Droplets className="h-3.5 w-3.5" />{weather.humidity}%</p>
              </div>
              <div className="rounded-lg border border-white/10 bg-black/10 px-2 py-2">
                <p className="flex items-center gap-1"><Wind className="h-3.5 w-3.5" />{weather.windSpeed} km/h</p>
              </div>
              <div className="rounded-lg border border-white/10 bg-black/10 px-2 py-2">
                <p className="flex items-center gap-1"><Umbrella className="h-3.5 w-3.5" />{weather.precipitation}%</p>
              </div>
            </div>
          </>
        ) : (
          <p className="mt-4 text-sm text-gray-400">Weather data is unavailable right now.</p>
        )}
      </div>
    </section>
  );
}
