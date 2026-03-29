'use client';

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { collection, getDocs, query, where, orderBy, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Area,
  AreaChart,
  BarChart,
  Bar,
  Cell,
  Pie,
  PieChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  CalendarDays,
  Clock3,
  Download,
  Sparkles,
  Target,
  TrendingUp,
  Users,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface BookingRecord {
  id: string;
  amenityName?: string;
  userEmail?: string;
  status?: string;
  communityId?: string;
  createdAt?: any;
  startTime?: any;
}

interface WeeklyReportRecord {
  weekStart: string;
  weekEnd: string;
  totalBookings: number;
  completedBookings: number;
  cancelledBookings: number;
  noShowRate: number;
  peakDay: string;
  peakHour: number;
  mostPopularAmenity: {
    amenityId: string;
    amenityName: string;
    bookingCount: number;
  } | null;
  generatedAt: string;
}

const DATE_RANGES = [
  { key: 7, label: 'Last 7 days' },
  { key: 30, label: 'Last 30 days' },
  { key: 90, label: 'Last 90 days' },
];

const STATUS_COLORS: Record<string, string> = {
  confirmed: '#0ea5e9',
  completed: '#10b981',
  cancelled: '#f43f5e',
  pending_confirmation: '#f59e0b',
  no_show: '#64748b',
};

const DAY_FORMATTER = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' });

const toDate = (value: any): Date | null => {
  if (!value) return null;
  if (value?.toDate) return value.toDate();
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const toIsoDate = (date: Date) => date.toISOString().slice(0, 10);

const asPct = (value: number) => `${Math.round(value)}%`;

const toNumber = (value: number) => value.toLocaleString('en-US');

const formatHourLabel = (hour: number) => {
  const normalizedHour = ((hour + 11) % 12) + 1;
  const meridiem = hour >= 12 ? 'pm' : 'am';
  return `${normalizedHour}${meridiem}`;
};

const getDelta = (current: number, previous: number) => {
  if (previous === 0) {
    return current > 0 ? 100 : 0;
  }

  return ((current - previous) / previous) * 100;
};

const buildTrendSeries = (bookings: BookingRecord[], rangeDays: number) => {
  const now = new Date();
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - (rangeDays - 1));

  const byDate = new Map<string, { bookings: number; completed: number; cancelled: number }>();

  for (let i = 0; i < rangeDays; i += 1) {
    const point = new Date(start);
    point.setDate(start.getDate() + i);
    byDate.set(toIsoDate(point), { bookings: 0, completed: 0, cancelled: 0 });
  }

  bookings.forEach((booking) => {
    const date = toDate(booking.createdAt) || toDate(booking.startTime);
    if (!date) return;

    const key = toIsoDate(date);
    const bucket = byDate.get(key);
    if (!bucket) return;

    bucket.bookings += 1;
    if (booking.status === 'completed') bucket.completed += 1;
    if (booking.status === 'cancelled') bucket.cancelled += 1;
  });

  return Array.from(byDate.entries()).map(([day, values]) => ({
    day,
    dayLabel: DAY_FORMATTER.format(new Date(`${day}T00:00:00`)),
    ...values,
  }));
};

export default function AdminAnalyticsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [rangeDays, setRangeDays] = useState(30);
  const [bookings, setBookings] = useState<BookingRecord[]>([]);
  const [latestWeeklyReport, setLatestWeeklyReport] = useState<WeeklyReportRecord | null>(null);

  useEffect(() => {
    if (status === 'loading') return;
    if (!session?.user?.email || session.user.role !== 'admin') {
      router.push('/dashboard');
      return;
    }

    loadBookings();
  }, [status, session?.user?.email, session?.user?.role, session?.user?.communityId, router]);

  const loadBookings = async () => {
    if (!session?.user?.communityId) return;

    try {
      setLoading(true);
      const [bookingsSnapshot, weeklyReportSnapshot] = await Promise.all([
        getDocs(
          query(collection(db, 'bookings'), where('communityId', '==', session.user.communityId))
        ),
        getDocs(
          query(collection(db, 'weekly_reports'), orderBy('generatedAt', 'desc'), limit(1))
        ),
      ]);

      const rows = bookingsSnapshot.docs.map((docSnapshot) => ({
        id: docSnapshot.id,
        ...(docSnapshot.data() as any),
      }));

      setBookings(rows);

      if (weeklyReportSnapshot.empty) {
        setLatestWeeklyReport(null);
      } else {
        setLatestWeeklyReport(weeklyReportSnapshot.docs[0].data() as WeeklyReportRecord);
      }
    } catch (error) {
      console.error('Failed to load analytics:', error);
      toast.error('Failed to load analytics data');
      setLatestWeeklyReport(null);
    } finally {
      setLoading(false);
    }
  };

  const currentRangeStart = useMemo(() => {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    start.setDate(start.getDate() - (rangeDays - 1));
    return start;
  }, [rangeDays]);

  const previousRangeStart = useMemo(() => {
    const start = new Date(currentRangeStart);
    start.setDate(start.getDate() - rangeDays);
    return start;
  }, [currentRangeStart, rangeDays]);

  const currentRangeBookings = useMemo(() => {
    return bookings.filter((booking) => {
      const date = toDate(booking.createdAt) || toDate(booking.startTime);
      return date ? date >= currentRangeStart : false;
    });
  }, [bookings, currentRangeStart]);

  const previousRangeBookings = useMemo(() => {
    return bookings.filter((booking) => {
      const date = toDate(booking.createdAt) || toDate(booking.startTime);
      return date ? date >= previousRangeStart && date < currentRangeStart : false;
    });
  }, [bookings, previousRangeStart, currentRangeStart]);

  const filteredBookings = currentRangeBookings;

  const metrics = useMemo(() => {
    const total = currentRangeBookings.length;
    const cancelled = currentRangeBookings.filter((b) => b.status === 'cancelled').length;
    const completed = currentRangeBookings.filter((b) => b.status === 'completed').length;
    const activeUsers = new Set(currentRangeBookings.map((b) => b.userEmail).filter(Boolean)).size;
    const cancellationRate = total > 0 ? Math.round((cancelled / total) * 100) : 0;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    const hourCounts = Array.from({ length: 24 }, (_, hour) => ({ hour, count: 0 }));
    currentRangeBookings.forEach((booking) => {
      const date = toDate(booking.startTime);
      if (!date) return;
      hourCounts[date.getHours()].count += 1;
    });

    const peak = hourCounts.reduce((max, item) => (item.count > max.count ? item : max), { hour: 0, count: 0 });

    return {
      total,
      cancelled,
      completed,
      activeUsers,
      cancellationRate,
      completionRate,
      peakHour: `${String(peak.hour).padStart(2, '0')}:00`,
    };
  }, [currentRangeBookings]);

  const previousMetrics = useMemo(() => {
    const total = previousRangeBookings.length;
    const cancelled = previousRangeBookings.filter((b) => b.status === 'cancelled').length;
    const completed = previousRangeBookings.filter((b) => b.status === 'completed').length;
    const activeUsers = new Set(previousRangeBookings.map((b) => b.userEmail).filter(Boolean)).size;
    return {
      total,
      cancelled,
      completed,
      activeUsers,
      cancellationRate: total > 0 ? (cancelled / total) * 100 : 0,
      completionRate: total > 0 ? (completed / total) * 100 : 0,
    };
  }, [previousRangeBookings]);

  const trendData = useMemo(() => {
    return buildTrendSeries(filteredBookings, rangeDays);
  }, [filteredBookings, rangeDays]);

  const amenityData = useMemo(() => {
    const byAmenity: Record<string, number> = {};

    filteredBookings.forEach((booking) => {
      const amenity = booking.amenityName || 'Unknown';
      byAmenity[amenity] = (byAmenity[amenity] || 0) + 1;
    });

    return Object.entries(byAmenity)
      .map(([amenity, count]) => ({ amenity, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);
  }, [filteredBookings]);

  const peakHourData = useMemo(() => {
    const buckets = Array.from({ length: 24 }, (_, hour) => ({
      hour: `${String(hour).padStart(2, '0')}:00`,
      count: 0,
    }));

    filteredBookings.forEach((booking) => {
      const date = toDate(booking.startTime);
      if (!date) return;
      buckets[date.getHours()].count += 1;
    });

    return buckets;
  }, [filteredBookings]);

  const statusData = useMemo(() => {
    const statusCounts: Record<string, number> = {};

    filteredBookings.forEach((booking) => {
      const status = booking.status || 'unknown';
      statusCounts[status] = (statusCounts[status] || 0) + 1;
    });

    return Object.entries(statusCounts)
      .map(([status, count]) => ({
        status,
        count,
        color: STATUS_COLORS[status] || '#64748b',
      }))
      .sort((a, b) => b.count - a.count);
  }, [filteredBookings]);

  const weekdayData = useMemo(() => {
    const buckets = Array.from({ length: 7 }, (_, idx) => ({
      day: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][idx],
      count: 0,
    }));

    filteredBookings.forEach((booking) => {
      const date = toDate(booking.startTime);
      if (!date) return;
      buckets[date.getDay()].count += 1;
    });

    return buckets;
  }, [filteredBookings]);

  const insightCards = useMemo(() => {
    const busiestDay = weekdayData.reduce((best, day) => (day.count > best.count ? day : best), {
      day: 'N/A',
      count: 0,
    });

    const busiestHour = peakHourData.reduce(
      (best, hour) => (hour.count > best.count ? hour : best),
      { hour: '00:00', count: 0 }
    );

    const topAmenity = amenityData[0];

    return [
      {
        label: 'Busiest day',
        value: busiestDay.day,
        detail: `${toNumber(busiestDay.count)} bookings`,
        icon: CalendarDays,
      },
      {
        label: 'Busiest hour',
        value: busiestHour.hour,
        detail: `${toNumber(busiestHour.count)} bookings`,
        icon: Clock3,
      },
      {
        label: 'Top amenity',
        value: topAmenity?.amenity || 'N/A',
        detail: `${toNumber(topAmenity?.count || 0)} bookings`,
        icon: Target,
      },
    ];
  }, [amenityData, peakHourData, weekdayData]);

  const kpiCards = useMemo(
    () => [
      {
        label: 'Total bookings',
        value: toNumber(metrics.total),
        delta: getDelta(metrics.total, previousMetrics.total),
        icon: CalendarDays,
      },
      {
        label: 'Active residents',
        value: toNumber(metrics.activeUsers),
        delta: getDelta(metrics.activeUsers, previousMetrics.activeUsers),
        icon: Users,
      },
      {
        label: 'Completion rate',
        value: asPct(metrics.completionRate),
        delta: metrics.completionRate - previousMetrics.completionRate,
        icon: TrendingUp,
      },
      {
        label: 'Cancellation rate',
        value: asPct(metrics.cancellationRate),
        delta: metrics.cancellationRate - previousMetrics.cancellationRate,
        inverseDelta: true,
        icon: Target,
      },
    ],
    [metrics, previousMetrics]
  );

  const latestReportCompletionRate = useMemo(() => {
    if (!latestWeeklyReport || latestWeeklyReport.totalBookings === 0) {
      return 0;
    }

    return Math.round((latestWeeklyReport.completedBookings / latestWeeklyReport.totalBookings) * 100);
  }, [latestWeeklyReport]);

  const latestReportNoShowRate = useMemo(() => {
    if (!latestWeeklyReport) {
      return 0;
    }

    return Math.round((latestWeeklyReport.noShowRate || 0) * 100);
  }, [latestWeeklyReport]);

  const latestPoint = trendData[trendData.length - 1];
  const previousPoint = trendData[trendData.length - 2];
  const todayBookingsDelta = latestPoint && previousPoint ? latestPoint.bookings - previousPoint.bookings : 0;

  const exportCsv = () => {
    const lines = [
      'bookingId,amenityName,userEmail,status,createdAt,startTime',
      ...filteredBookings.map((b) => [
        b.id,
        String(b.amenityName || ''),
        String(b.userEmail || ''),
        String(b.status || ''),
        String(toDate(b.createdAt)?.toISOString() || ''),
        String(toDate(b.startTime)?.toISOString() || ''),
      ].map((value) => `"${value.replace(/\"/g, '""')}"`).join(',')),
    ];

    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `analytics-${rangeDays}d.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100/50 dark:from-slate-950 dark:via-slate-950 dark:to-slate-900/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10 space-y-6">
        <section className="relative overflow-hidden rounded-3xl border border-slate-200/80 dark:border-slate-700/60 bg-white/80 dark:bg-slate-900/70 p-6 sm:p-8 shadow-premium backdrop-blur-sm">
          <div className="absolute -top-16 -right-16 h-56 w-56 rounded-full bg-cyan-300/35 blur-3xl dark:bg-cyan-500/20" />
          <div className="absolute -bottom-20 -left-16 h-56 w-56 rounded-full bg-teal-300/35 blur-3xl dark:bg-teal-500/20" />

          <div className="relative flex flex-col gap-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex items-start gap-3 sm:gap-4 min-w-0">
                <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-br from-cyan-500 to-teal-600 text-white flex items-center justify-center shadow-lg ring-1 ring-cyan-200/70 dark:ring-cyan-500/30 shrink-0">
                  <BarChart3 className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-700 dark:text-cyan-300">Operations Intelligence</p>
                  <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100 mt-1">Analytics Command Center</h1>
                  <p className="text-sm text-slate-600 dark:text-slate-300 mt-2 max-w-2xl">
                    Real-time booking intelligence with executive-level visual storytelling across demand, performance, and amenity utilization.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 xs:grid-cols-2 gap-2 w-full sm:w-auto">
                <Button onClick={loadBookings} variant="outline" className="border-slate-300 dark:border-slate-600 w-full">
                  Refresh
                </Button>
                <Button onClick={exportCsv} className="bg-slate-900 text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white w-full">
                  <Download className="w-4 h-4 mr-2" /> Export CSV
                </Button>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {DATE_RANGES.map((item) => (
                <Button
                  key={item.key}
                  size="sm"
                  variant={item.key === rangeDays ? 'default' : 'outline'}
                  className={cn(
                    'rounded-full px-4',
                    item.key === rangeDays
                      ? 'bg-slate-900 text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900'
                      : 'border-slate-300 dark:border-slate-600'
                  )}
                  onClick={() => setRangeDays(item.key)}
                >
                  {item.label}
                </Button>
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {insightCards.map((insight) => {
                const Icon = insight.icon;
                return (
                  <div key={insight.label} className="rounded-2xl border border-slate-200/80 dark:border-slate-700 bg-white/70 dark:bg-slate-900/60 p-4">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">{insight.label}</p>
                      <Icon className="w-4 h-4 text-cyan-600 dark:text-cyan-300" />
                    </div>
                    <p className="mt-2 text-lg font-semibold text-slate-900 dark:text-slate-100">{insight.value}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{insight.detail}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {loading ? (
          <Card className="border-slate-200/90 dark:border-slate-800/70 bg-white/85 dark:bg-slate-900/70">
            <CardContent className="min-h-[86px] sm:min-h-[96px] px-6 py-6 sm:px-8 sm:py-7 flex items-center justify-center text-center">
              <p className="text-sm sm:text-base font-medium text-slate-600 dark:text-slate-300 leading-relaxed">
                Loading analytics...
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
              {kpiCards.map((kpi) => (
                <MetricCard
                  key={kpi.label}
                  icon={<kpi.icon className="w-4 h-4" />}
                  label={kpi.label}
                  value={kpi.value}
                  delta={kpi.delta}
                  inverseDelta={kpi.inverseDelta}
                />
              ))}
            </div>

            <Card className="rounded-2xl border-slate-200/90 dark:border-slate-700/70 bg-white/80 dark:bg-slate-900/70 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-base">Latest weekly report</CardTitle>
                <CardDescription>Generated by cron and stored in weekly_reports</CardDescription>
              </CardHeader>
              <CardContent>
                {latestWeeklyReport ? (
                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/40 px-3 py-2.5">
                      <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Week of</p>
                      <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">
                        {latestWeeklyReport.weekStart} to {latestWeeklyReport.weekEnd}
                      </p>
                    </div>
                    <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/40 px-3 py-2.5">
                      <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Total bookings</p>
                      <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">{toNumber(latestWeeklyReport.totalBookings)}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Completion rate: {latestReportCompletionRate}%</p>
                    </div>
                    <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/40 px-3 py-2.5">
                      <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">No-show rate</p>
                      <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">{latestReportNoShowRate}%</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Peak: {latestWeeklyReport.peakDay} at {formatHourLabel(latestWeeklyReport.peakHour)}</p>
                    </div>
                    <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/40 px-3 py-2.5">
                      <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Most popular amenity</p>
                      <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">
                        {latestWeeklyReport.mostPopularAmenity
                          ? `${latestWeeklyReport.mostPopularAmenity.amenityName} (${latestWeeklyReport.mostPopularAmenity.bookingCount})`
                          : 'N/A'}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Report generated: {new Date(latestWeeklyReport.generatedAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-slate-500 dark:text-slate-400">No report available yet.</p>
                )}
              </CardContent>
            </Card>

            <div className="grid xl:grid-cols-3 gap-4">
              <Card className="xl:col-span-2 rounded-2xl border-slate-200/90 dark:border-slate-700/70 bg-white/80 dark:bg-slate-900/70 backdrop-blur-sm">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <CardTitle className="text-base">Booking momentum</CardTitle>
                      <CardDescription>Demand, completions, and daily cadence over {rangeDays} days</CardDescription>
                    </div>
                    <div className="text-right">
                      <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Latest day</p>
                      <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                        {latestPoint ? toNumber(latestPoint.bookings) : 0} bookings
                      </p>
                      <p className={cn('text-xs', todayBookingsDelta >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400')}>
                        {todayBookingsDelta >= 0 ? '+' : ''}{todayBookingsDelta} vs previous day
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={trendData} margin={{ top: 8, right: 10, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="bookingsGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.45} />
                          <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.03} />
                        </linearGradient>
                        <linearGradient id="completedGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0.03} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#94a3b8" opacity={0.2} />
                      <XAxis dataKey="dayLabel" tick={{ fontSize: 11 }} interval="preserveStartEnd" minTickGap={22} />
                      <YAxis allowDecimals={false} tick={{ fontSize: 11 }} width={26} />
                      <Tooltip content={<AnalyticsTooltip />} />
                      <Area type="monotone" dataKey="bookings" stroke="#0891b2" fill="url(#bookingsGradient)" strokeWidth={2.5} />
                      <Area type="monotone" dataKey="completed" stroke="#059669" fill="url(#completedGradient)" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="rounded-2xl border-slate-200/90 dark:border-slate-700/70 bg-white/80 dark:bg-slate-900/70 backdrop-blur-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Status health</CardTitle>
                  <CardDescription>Booking quality mix and operational stability</CardDescription>
                </CardHeader>
                <CardContent className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={statusData}
                        dataKey="count"
                        nameKey="status"
                        innerRadius={62}
                        outerRadius={92}
                        paddingAngle={2}
                      >
                        {statusData.map((entry) => (
                          <Cell key={entry.status} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip content={<AnalyticsTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
                <div className="px-6 pb-5 grid grid-cols-2 gap-2">
                  {statusData.slice(0, 4).map((item) => (
                    <div key={item.status} className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="capitalize">{item.status.replace('_', ' ')}</span>
                      <span className="ml-auto font-semibold text-slate-900 dark:text-slate-100">{toNumber(item.count)}</span>
                    </div>
                  ))}
                </div>
              </Card>
            </div>

            <div className="grid xl:grid-cols-2 gap-4">
              <Card className="rounded-2xl border-slate-200/90 dark:border-slate-700/70 bg-white/80 dark:bg-slate-900/70 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-base">Amenity league table</CardTitle>
                  <CardDescription>Most demanded amenities in current range</CardDescription>
                </CardHeader>
                <CardContent className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={amenityData} layout="vertical" margin={{ top: 8, right: 12, left: 8, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#94a3b8" opacity={0.2} />
                      <XAxis type="number" allowDecimals={false} />
                      <YAxis type="category" dataKey="amenity" width={110} tick={{ fontSize: 12 }} />
                      <Tooltip content={<AnalyticsTooltip />} />
                      <Bar dataKey="count" radius={[0, 10, 10, 0]}>
                        {amenityData.map((_, index) => (
                          <Cell
                            key={`amenity-${index}`}
                            fill={index % 2 === 0 ? '#0891b2' : '#4f46e5'}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="rounded-2xl border-slate-200/90 dark:border-slate-700/70 bg-white/80 dark:bg-slate-900/70 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-base">Demand clock</CardTitle>
                  <CardDescription>Hourly booking distribution and peak capacity</CardDescription>
                </CardHeader>
                <CardContent className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={peakHourData} margin={{ top: 8, right: 10, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#94a3b8" opacity={0.2} />
                      <XAxis dataKey="hour" tick={{ fontSize: 10 }} interval="preserveStartEnd" minTickGap={16} />
                      <YAxis allowDecimals={false} tick={{ fontSize: 11 }} width={26} />
                      <Tooltip content={<AnalyticsTooltip />} />
                      <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                        {peakHourData.map((item, idx) => {
                          const intensity = item.count === 0 ? 0.25 : Math.min(0.95, 0.35 + item.count / 20);
                          return <Cell key={`hour-${idx}`} fill={`rgba(14,165,233,${intensity})`} />;
                        })}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            <Card className="rounded-2xl border-slate-200/90 dark:border-slate-700/70 bg-white/80 dark:bg-slate-900/70 backdrop-blur-sm">
              <CardHeader>
                <div className="flex flex-col xs:flex-row xs:items-center xs:justify-between gap-2">
                  <div>
                    <CardTitle className="text-base">Executive highlights</CardTitle>
                    <CardDescription>AI-style summary cards for quick operations decisions</CardDescription>
                  </div>
                  <span className="inline-flex items-center gap-1 rounded-full bg-cyan-100 dark:bg-cyan-900/40 px-3 py-1 text-xs font-semibold text-cyan-700 dark:text-cyan-300 self-start xs:self-auto whitespace-nowrap shrink-0">
                    <Sparkles className="w-3.5 h-3.5" />
                    Snapshot
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-3">
                  <InsightPanel
                    title="Utilization pulse"
                    description={`${toNumber(metrics.completed)} completed bookings out of ${toNumber(metrics.total)} total in the selected period.`}
                    tone={metrics.completionRate >= 70 ? 'good' : 'neutral'}
                  />
                  <InsightPanel
                    title="Risk watch"
                    description={`Cancellation is at ${asPct(metrics.cancellationRate)} and peaks around ${metrics.peakHour}. Consider targeted nudges 1 hour prior.`}
                    tone={metrics.cancellationRate > 20 ? 'warn' : 'good'}
                  />
                  <InsightPanel
                    title="Growth signal"
                    description={`Total demand moved ${getDelta(metrics.total, previousMetrics.total) >= 0 ? 'up' : 'down'} ${Math.abs(Math.round(getDelta(metrics.total, previousMetrics.total)))}% versus the prior period.`}
                    tone={getDelta(metrics.total, previousMetrics.total) >= 0 ? 'good' : 'warn'}
                  />
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}

function MetricCard({
  icon,
  label,
  value,
  delta,
  inverseDelta,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  delta: number;
  inverseDelta?: boolean;
}) {
  const positive = inverseDelta ? delta <= 0 : delta >= 0;

  return (
    <Card className="rounded-2xl border-slate-200/90 dark:border-slate-700/70 bg-white/80 dark:bg-slate-900/70 backdrop-blur-sm h-full">
      <CardContent className="p-4 sm:p-5">
        <div className="flex flex-col gap-3.5 sm:gap-4 h-full">
          <div className="flex items-start justify-between gap-3">
            <p className="text-[10px] sm:text-[11px] leading-[1.4] font-semibold uppercase tracking-[0.09em] text-slate-500 dark:text-slate-400 max-w-[70%] min-h-[2.05rem]">
              {label}
            </p>
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-br from-cyan-500 to-teal-600 text-white flex items-center justify-center shadow-md shrink-0">
              {icon}
            </div>
          </div>

          <p className="text-3xl sm:text-4xl leading-none font-bold text-slate-900 dark:text-slate-100">{value}</p>

          <div className={cn('flex items-start gap-1.5 max-w-full text-xs sm:text-[13px] font-semibold leading-5', positive ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400')}>
            {positive ? <ArrowUpRight className="w-3.5 h-3.5 shrink-0 mt-0.5" /> : <ArrowDownRight className="w-3.5 h-3.5 shrink-0 mt-0.5" />}
            <span className="break-words">{Math.abs(delta).toFixed(1)}% vs previous period</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function InsightPanel({
  title,
  description,
  tone,
}: {
  title: string;
  description: string;
  tone: 'good' | 'warn' | 'neutral';
}) {
  return (
    <div
      className={cn(
        'rounded-2xl border p-4',
        tone === 'good' && 'border-emerald-200 bg-emerald-50/70 dark:border-emerald-800/70 dark:bg-emerald-900/20',
        tone === 'warn' && 'border-amber-200 bg-amber-50/70 dark:border-amber-800/70 dark:bg-amber-900/20',
        tone === 'neutral' && 'border-slate-200 bg-slate-50/70 dark:border-slate-700 dark:bg-slate-800/60'
      )}
    >
      <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{title}</p>
      <p className="text-sm text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">{description}</p>
    </div>
  );
}

function AnalyticsTooltip({ active, payload, label }: any) {
  if (!active || !payload || !payload.length) {
    return null;
  }

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white/95 dark:bg-slate-900/95 p-3 shadow-lg backdrop-blur-sm">
      {label && <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">{label}</p>}
      <div className="space-y-1">
        {payload.map((entry: any) => (
          <div key={entry.dataKey} className="flex items-center justify-between gap-4 text-xs">
            <span className="text-slate-500 dark:text-slate-400 capitalize">{String(entry.name || entry.dataKey).replace('_', ' ')}</span>
            <span className="font-semibold text-slate-900 dark:text-slate-100">{toNumber(Number(entry.value || 0))}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
