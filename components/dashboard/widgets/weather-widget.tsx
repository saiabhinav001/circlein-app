'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { Droplets, Wind, Umbrella, Sun } from 'lucide-react';
import type { WeatherData } from '@/lib/weather';

type WeatherApiResponse = WeatherData | { error: string };

const WEEKDAY_SHORT_FORMATTER = new Intl.DateTimeFormat('en-US', { weekday: 'short' });

function formatUpdatedAgo(date: Date | null): string {
  if (!date) return 'Updated just now';

  const diffMs = Date.now() - date.getTime();
  const diffMinutes = Math.max(0, Math.floor(diffMs / 60000));

  if (diffMinutes < 1) return 'Updated just now';
  if (diffMinutes < 60) return `Updated ${diffMinutes}m ago`;

  const diffHours = Math.floor(diffMinutes / 60);
  return `Updated ${diffHours}h ago`;
}

function forecastDayLabel(dateText: string): string {
  const date = new Date(`${dateText}T00:00:00`);
  if (Number.isNaN(date.getTime())) return '--';

  return WEEKDAY_SHORT_FORMATTER.format(date);
}

export function WeatherWidget() {
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === 'admin' || session?.user?.role === 'super_admin';
  const communityName = (session?.user as any)?.communityName || 'Community';

  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        const response = await fetch('/api/weather', { cache: 'no-store' });
        const payload: WeatherApiResponse = await response.json();

        if (!active) return;

        if (!response.ok) {
          setWeather(null);
          setApiError('weather_unavailable');
          return;
        }

        if ('error' in payload) {
          setWeather(null);
          setApiError(payload.error);
          return;
        }

        setWeather(payload);
        setApiError(null);
        setLastUpdated(new Date(payload.current.updatedAt));
      } catch {
        if (!active) return;
        setWeather(null);
        setApiError('weather_unavailable');
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    load();
    const interval = setInterval(load, 30 * 60 * 1000);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);

  const alerts = useMemo(() => {
    if (!weather) return [] as { tone: 'amber' | 'red'; message: string }[];

    const nextAlerts: { tone: 'amber' | 'red'; message: string }[] = [];

    if (weather.current.weatherCode >= 95) {
      nextAlerts.push({
        tone: 'red',
        message: 'Thunderstorm alert - outdoor areas closed',
      });
    }

    if (weather.current.precipitationProbability > 60) {
      nextAlerts.push({
        tone: 'amber',
        message: 'High rain chance - pool may close',
      });
    }

    if (weather.current.uvIndex > 7) {
      nextAlerts.push({
        tone: 'red',
        message: 'High UV - limit outdoor exposure',
      });
    }

    return nextAlerts;
  }, [weather]);

  if (loading) {
    return (
      <section className="rounded-2xl border border-slate-700 bg-slate-900 p-5 text-slate-200 shadow-lg">
        <div className="space-y-3 animate-pulse">
          <div className="h-3 w-32 rounded bg-slate-700" />
          <div className="h-10 w-40 rounded bg-slate-700" />
          <div className="h-4 w-52 rounded bg-slate-700" />
        </div>
      </section>
    );
  }

  if (apiError === 'location_not_configured') {
    return (
      <section className="rounded-2xl border border-slate-700 bg-slate-900 p-5 text-slate-200 shadow-lg">
        <p className="text-xs uppercase tracking-[0.18em] text-slate-400">{communityName}</p>
        <h3 className="mt-2 text-lg font-semibold text-white">Weather</h3>
        {isAdmin ? (
          <p className="mt-3 text-sm text-slate-300">
            Set your community location in{' '}
            <Link href="/admin/settings" className="text-emerald-300 hover:text-emerald-200 underline underline-offset-2">
              Admin Settings
            </Link>{' '}
            to enable weather insights.
          </p>
        ) : (
          <p className="mt-3 text-sm text-slate-300">Weather unavailable - contact admin.</p>
        )}
      </section>
    );
  }

  if (!weather) {
    return (
      <section className="rounded-2xl border border-slate-700 bg-slate-900 p-5 text-slate-200 shadow-lg">
        <p className="text-xs uppercase tracking-[0.18em] text-slate-400">{communityName}</p>
        <h3 className="mt-2 text-lg font-semibold text-white">Weather</h3>
        <p className="mt-3 text-sm text-slate-300">Weather data is temporarily unavailable.</p>
      </section>
    );
  }

  return (
    <section className="relative overflow-hidden rounded-2xl border border-slate-700 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 p-5 text-slate-100 shadow-lg shadow-slate-900/60">
      <div className="pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full bg-cyan-500/20 blur-3xl" />
      <div className="pointer-events-none absolute -left-10 bottom-0 h-32 w-32 rounded-full bg-emerald-500/20 blur-3xl" />

      <div className="relative space-y-4">
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-300">{communityName}</p>
          <p className="text-xs text-slate-400">{formatUpdatedAgo(lastUpdated)}</p>
        </div>

        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-5xl leading-none" aria-hidden="true">
              {weather.current.emoji}
            </span>
            <p className="text-5xl font-black text-white leading-none">{weather.current.temperature}°</p>
          </div>

          <div className="space-y-1 text-right text-sm text-slate-200">
            <p className="font-medium text-white">{weather.current.condition}</p>
            <p>Feels like {weather.current.feelsLike}°C</p>
            <p>Humidity {weather.current.humidity}%</p>
            <p>Wind {weather.current.windSpeed} km/h</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-2 text-xs sm:grid-cols-3">
          <div className="rounded-lg border border-slate-700 bg-slate-800/70 px-2 py-2 text-slate-200">
            <p className="flex items-center gap-1"><Droplets className="h-3.5 w-3.5" />Humidity {weather.current.humidity}%</p>
          </div>
          <div className="rounded-lg border border-slate-700 bg-slate-800/70 px-2 py-2 text-slate-200">
            <p className="flex items-center gap-1"><Wind className="h-3.5 w-3.5" />Wind {weather.current.windSpeed}</p>
          </div>
          <div className="rounded-lg border border-slate-700 bg-slate-800/70 px-2 py-2 text-slate-200">
            <p className="flex items-center gap-1"><Umbrella className="h-3.5 w-3.5" />Rain {weather.current.precipitationProbability}%</p>
          </div>
        </div>

        {alerts.map((alert) => (
          <div
            key={alert.message}
            className={
              alert.tone === 'amber'
                ? 'rounded-lg border border-amber-400/50 bg-amber-500/20 px-3 py-2 text-xs text-amber-100'
                : 'rounded-lg border border-red-400/50 bg-red-500/20 px-3 py-2 text-xs text-red-100'
            }
          >
            {alert.message}
          </div>
        ))}

        <div className="overflow-x-auto">
          <div className="flex min-w-max gap-2 pb-1">
            {weather.forecast.map((day) => (
              <div
                key={day.date}
                className="w-20 rounded-lg border border-slate-700 bg-slate-800/70 px-2 py-2 text-center"
              >
                <p className="text-[11px] text-slate-300">{forecastDayLabel(day.date)}</p>
                <p className="mt-1 text-xl leading-none">{day.emoji}</p>
                <p className="mt-1 text-xs font-medium text-white">{day.tempMax}° / {day.tempMin}°</p>
              </div>
            ))}
          </div>
        </div>

        {isAdmin && (
          <div className="rounded-lg border border-slate-700 bg-slate-900/70 px-3 py-3 text-xs text-slate-200">
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.15em] text-slate-400">Facility impact</p>
            <div className="space-y-1.5">
              {weather.current.precipitationProbability > 60 && (
                <p>Consider indoor alternatives for outdoor amenities.</p>
              )}
              {weather.current.temperature > 40 && (
                <p>Extreme heat - pool booking surge likely.</p>
              )}
              {weather.current.uvIndex > 8 && (
                <p className="flex items-center gap-1"><Sun className="h-3.5 w-3.5" />UV alert - enforce shade requirements.</p>
              )}
              {weather.current.precipitationProbability <= 60 && weather.current.temperature <= 40 && weather.current.uvIndex <= 8 && (
                <p>Operations look stable for current conditions.</p>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
