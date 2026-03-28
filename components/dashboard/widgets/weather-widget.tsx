'use client';

import { useEffect, useState } from 'react';
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
    <section className="rounded-2xl border border-slate-200/90 dark:border-slate-800/70 bg-white/80 dark:bg-slate-900/70 p-4 sm:p-5 shadow-sm">
      <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
        <CloudSun className="h-4 w-4 text-amber-500" />
        Weather Snapshot
      </div>
      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{locationLabel}</p>

      {loading ? (
        <div className="mt-4 space-y-2">
          <div className="h-6 w-24 rounded bg-slate-200 dark:bg-slate-700/70" />
          <div className="h-4 w-40 rounded bg-slate-100 dark:bg-slate-800/60" />
          <div className="h-4 w-32 rounded bg-slate-100 dark:bg-slate-800/60" />
        </div>
      ) : weather ? (
        <>
          <div className="mt-4 flex items-end justify-between">
            <div>
              <p className="text-2xl font-semibold text-slate-900 dark:text-white">
                {getWeatherEmoji(weather.condition)} {weather.temp}°C
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Feels like {weather.feelsLike}°C</p>
            </div>
            <p className="text-xs font-medium text-slate-600 dark:text-slate-300 capitalize">{weather.description}</p>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-2 text-xs text-slate-600 dark:text-slate-300">
            <div className="rounded-lg border border-slate-200 dark:border-slate-700/80 px-2 py-2">
              <p className="flex items-center gap-1"><Droplets className="h-3.5 w-3.5" />{weather.humidity}%</p>
            </div>
            <div className="rounded-lg border border-slate-200 dark:border-slate-700/80 px-2 py-2">
              <p className="flex items-center gap-1"><Wind className="h-3.5 w-3.5" />{weather.windSpeed} km/h</p>
            </div>
            <div className="rounded-lg border border-slate-200 dark:border-slate-700/80 px-2 py-2">
              <p className="flex items-center gap-1"><Umbrella className="h-3.5 w-3.5" />{weather.precipitation}%</p>
            </div>
          </div>
        </>
      ) : (
        <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">Weather data is unavailable right now.</p>
      )}
    </section>
  );
}
