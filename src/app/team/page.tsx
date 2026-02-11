"use client"

import { useEffect, useState } from "react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { DashboardNav } from "@/components/DashboardNav"
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LabelList,
} from "recharts"
import { CardSkeleton } from "@/components/ui/skeleton"
import { TrendingUp, Calendar, Loader2, Users, Play } from "lucide-react"

const PROPHET_API_URL = "https://qbtraining-site-production.up.railway.app"

// Sales interfaces
interface PeriodMetrics {
  label: string
  date_range: string
  direct_qty: number
  py_qty: number
  qty_change_pct: number
  renewal_qty: number
  py_renewal_qty: number
  renewal_qty_change_pct: number
}

interface MetricsResponse {
  yesterday: PeriodMetrics
  today: PeriodMetrics
  this_week: PeriodMetrics
  this_month: PeriodMetrics
}

interface WeeklyTrendRow {
  week_label: string
  week_start: string
  daily_cumulative: { [day: string]: number | null }
  week_total: number | null
}

interface WeeklyTrendsResponse {
  weeks: WeeklyTrendRow[]
  days: string[]
}

interface ProductMixRow {
  week_label: string
  week_start: string
  total: number
  cert_pct: number
  learner_pct: number
  team_pct: number
}

interface ProductMixResponse {
  weeks: ProductMixRow[]
}

interface MonthlyQtyYoYDataPoint {
  month_num: number
  month_label: string
  y2024: number | null
  y2025: number | null
  y2026: number | null
}

interface MonthlyQtyYoYResponse {
  data: MonthlyQtyYoYDataPoint[]
  current_month: number
}

// Subscriptions interfaces
interface SubscriptionMetrics {
  active_subscriptions: number
  total_subscriptions: number
}

interface SubscriptionsResponse {
  metrics: SubscriptionMetrics
}

interface SubscriberMetricsData {
  new_adds_by_month?: { [month: string]: number }
  immediate_cancels_by_month?: { [month: string]: number }
  immediate_cancel_rate_by_month?: { [month: string]: number }
}

interface SubscriberMetricsResponse {
  available: boolean
  data?: SubscriberMetricsData
}

interface SubscriberTimeSeriesPoint {
  ds: string
  y: number // net adds
  new_adds: number
  churned: number
}

interface SubscriberTimeSeriesResponse {
  available: boolean
  time_series?: SubscriberTimeSeriesPoint[]
}

// Helper functions
function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-US").format(value)
}

// Cache utilities
const CACHE_TTL = {
  sales: 5 * 60 * 1000, // 5 minutes for sales data
  subscriptions: 24 * 60 * 60 * 1000, // 24 hours for subscriptions
}

function getFromCache<T>(key: string): T | null {
  if (typeof window === 'undefined') return null
  const cached = localStorage.getItem(`teamstats_${key}`)
  if (!cached) return null
  try {
    const { data, timestamp, ttl } = JSON.parse(cached)
    if (Date.now() - timestamp < ttl) {
      return data as T
    }
    localStorage.removeItem(`teamstats_${key}`)
  } catch {
    localStorage.removeItem(`teamstats_${key}`)
  }
  return null
}

function setInCache<T>(key: string, data: T, ttl: number): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(`teamstats_${key}`, JSON.stringify({
      data,
      timestamp: Date.now(),
      ttl,
    }))
  } catch {
    // localStorage full or unavailable
  }
}

async function fetchWithCache<T>(
  url: string,
  cacheKey: string,
  ttl: number,
  setter: (data: T) => void
): Promise<T | null> {
  const cached = getFromCache<T>(cacheKey)
  if (cached) {
    setter(cached)
  }

  try {
    const res = await fetch(url)
    if (res.ok) {
      const data = await res.json()
      setInCache(cacheKey, data, ttl)
      setter(data)
      return data
    }
  } catch (e) {
    console.error(`Failed to fetch ${cacheKey}:`, e)
  }

  return cached
}


export default function TeamStatsPage() {
  // Sales state
  const [metrics, setMetrics] = useState<MetricsResponse | null>(null)
  const [weeklyTrends, setWeeklyTrends] = useState<WeeklyTrendsResponse | null>(null)
  const [productMix, setProductMix] = useState<ProductMixResponse | null>(null)
  const [monthlyQtyYoY, setMonthlyQtyYoY] = useState<MonthlyQtyYoYResponse | null>(null)

  // Subscriptions state
  const [subscriptions, setSubscriptions] = useState<SubscriptionsResponse | null>(null)
  const [subscriberMetrics, setSubscriberMetrics] = useState<SubscriberMetricsResponse | null>(null)
  const [subscriberTimeSeries, setSubscriberTimeSeries] = useState<SubscriberTimeSeriesResponse | null>(null)

  // Loading state
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch all data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        await Promise.all([
          fetchWithCache(`${PROPHET_API_URL}/metrics`, 'metrics', CACHE_TTL.sales, setMetrics),
          fetchWithCache(`${PROPHET_API_URL}/weekly-trends`, 'weekly', CACHE_TTL.sales, setWeeklyTrends),
          fetchWithCache(`${PROPHET_API_URL}/product-mix`, 'productMix', CACHE_TTL.sales, setProductMix),
          fetchWithCache(`${PROPHET_API_URL}/monthly-qty-yoy`, 'monthlyQtyYoY', CACHE_TTL.sales, setMonthlyQtyYoY),
          fetchWithCache(`${PROPHET_API_URL}/subscriptions`, 'subscriptions', CACHE_TTL.subscriptions, setSubscriptions),
          fetchWithCache(`${PROPHET_API_URL}/subscriber/metrics`, 'subscriberMetrics', CACHE_TTL.subscriptions, setSubscriberMetrics),
          fetchWithCache(`${PROPHET_API_URL}/subscriber/time-series`, 'subscriberTimeSeries', CACHE_TTL.subscriptions, setSubscriberTimeSeries),
        ])
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load data")
      } finally {
        setLoading(false)
      }
    }

    // Load from cache first
    const cachedMetrics = getFromCache<MetricsResponse>('metrics')
    const cachedWeeklyTrends = getFromCache<WeeklyTrendsResponse>('weekly')
    const cachedProductMix = getFromCache<ProductMixResponse>('productMix')
    const cachedMonthlyQtyYoY = getFromCache<MonthlyQtyYoYResponse>('monthlyQtyYoY')
    const cachedSubscriptions = getFromCache<SubscriptionsResponse>('subscriptions')
    const cachedSubscriberMetrics = getFromCache<SubscriberMetricsResponse>('subscriberMetrics')
    const cachedSubscriberTimeSeries = getFromCache<SubscriberTimeSeriesResponse>('subscriberTimeSeries')

    if (cachedMetrics) setMetrics(cachedMetrics)
    if (cachedWeeklyTrends) setWeeklyTrends(cachedWeeklyTrends)
    if (cachedProductMix) setProductMix(cachedProductMix)
    if (cachedMonthlyQtyYoY) setMonthlyQtyYoY(cachedMonthlyQtyYoY)
    if (cachedSubscriptions) setSubscriptions(cachedSubscriptions)
    if (cachedSubscriberMetrics) setSubscriberMetrics(cachedSubscriberMetrics)
    if (cachedSubscriberTimeSeries) setSubscriberTimeSeries(cachedSubscriberTimeSeries)

    fetchData()
  }, [])

  // Build ending active count by month (Jan 2025 onwards)
  // Start with current active count and work backwards
  const activeCountByMonth = (() => {
    if (!subscriberTimeSeries?.available || !subscriberTimeSeries.time_series || !subscriptions) {
      return []
    }

    const currentActive = subscriptions.metrics.active_subscriptions

    // Helper to format date string "2025-01-01" to "Jan 25" without timezone issues
    const formatMonth = (ds: string) => {
      const [year, month] = ds.split('-')
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
      return `${monthNames[parseInt(month) - 1]} ${year.slice(2)}`
    }

    const filtered = subscriberTimeSeries.time_series
      .filter(point => point.ds >= '2025-01-01')
      .map(point => ({
        month: formatMonth(point.ds),
        netAdds: point.y,
      }))

    // Work backwards from current count to calculate ending count for each month
    const result = []
    let runningTotal = currentActive

    // Process in reverse order (most recent first)
    for (let i = filtered.length - 1; i >= 0; i--) {
      result.unshift({
        month: filtered[i].month,
        endingActive: runningTotal,
        netAdds: filtered[i].netAdds,
      })
      // Subtract this month's net adds to get previous month's ending count
      runningTotal = runningTotal - filtered[i].netAdds
    }

    return result
  })()

  return (
    <div className="min-h-screen bg-[#F5F5F7]">
      {/* Header */}
      <div className="bg-white border-b border-[#D2D2D7] sticky top-0 z-10">
        <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-3">
            <DashboardNav theme="light" />
            <div>
              <h1 className="text-2xl font-semibold text-[#1D1D1F]">Team Stats</h1>
              <p className="text-sm text-[#6E6E73] mt-1">Sales and subscription performance metrics</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Error State */}
        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Today, Yesterday, This Week, This Month - 4 cards in a row */}
        <div className="mb-8">
          {loading && !metrics ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[...Array(4)].map((_, i) => (
                <CardSkeleton key={i} className="h-[140px]" />
              ))}
            </div>
          ) : metrics ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[metrics.today, metrics.yesterday, metrics.this_week, metrics.this_month].map((period) => {
                const isToday = period.label === "Today"
                return (
                  <Card
                    key={period.label}
                    className={`${isToday ? "bg-gradient-to-br from-[#0066CC] to-[#0055AA] text-white border-0 shadow-lg" : "bg-white border-[#D2D2D7] shadow-sm"} hover:shadow-md transition-shadow duration-200`}
                  >
                    <CardHeader className="pb-1 space-y-0">
                      <CardTitle className={`text-lg font-semibold leading-tight ${isToday ? "text-white" : "text-[#1D1D1F]"}`}>
                        {period.label}
                      </CardTitle>
                      <CardDescription className={`text-sm mt-0 ${isToday ? "text-white/70" : "text-[#6E6E73]"}`}>
                        {period.date_range}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-2">
                      <div className="grid grid-cols-2 gap-4">
                        {/* Direct Sales QTY */}
                        <div className={`rounded-lg p-3 text-center ${isToday ? "bg-white/95" : "bg-[#F5F5F7]"}`}>
                          <div className="text-[10px] font-semibold uppercase tracking-wider text-[#6E6E73] mb-1">
                            Direct Sales
                          </div>
                          <div className="text-xl font-bold text-[#1D1D1F]">{formatNumber(period.direct_qty)}</div>
                          <div className="text-xs text-[#8E8E93]">PY: {formatNumber(period.py_qty)}</div>
                          <div className={`text-xs font-semibold ${period.qty_change_pct >= 0 ? "text-[#34C759]" : "text-[#FF3B30]"}`}>
                            {period.qty_change_pct >= 0 ? "+" : ""}{period.qty_change_pct}%
                          </div>
                        </div>

                        {/* Renewals QTY */}
                        <div className={`rounded-lg p-3 text-center ${isToday ? "bg-white/95" : "bg-[#F5F5F7]"}`}>
                          <div className="text-[10px] font-semibold uppercase tracking-wider text-[#6E6E73] mb-1">
                            Renewals
                          </div>
                          <div className="text-xl font-bold text-[#1D1D1F]">{formatNumber(period.renewal_qty)}</div>
                          <div className="text-xs text-[#8E8E93]">PY: {formatNumber(period.py_renewal_qty)}</div>
                          <div className={`text-xs font-semibold ${period.renewal_qty_change_pct >= 0 ? "text-[#34C759]" : "text-[#FF3B30]"}`}>
                            {period.renewal_qty_change_pct >= 0 ? "+" : ""}{period.renewal_qty_change_pct}%
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          ) : null}
        </div>

        {/* Weekly Trends and Product Mix - Side by Side */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
          {/* Weekly Trends Table */}
          <Card className="bg-white border-[#D2D2D7] shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold text-[#1D1D1F] flex items-center gap-2">
                <Calendar className="h-4 w-4 text-[#0066CC]" />
                Weekly Trends (Daily Cumulative)
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-2">
              {loading && !weeklyTrends ? (
                <div className="h-48 flex items-center justify-center">
                  <Loader2 className="h-6 w-6 animate-spin text-[#0066CC]" />
                </div>
              ) : error ? (
                <div className="h-48 flex items-center justify-center text-[#FF3B30] text-sm">
                  {error}
                </div>
              ) : weeklyTrends ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-[#D2D2D7]">
                        <th className="text-left py-2 px-1 font-semibold text-[#1D1D1F] min-w-[80px]">
                          Week
                        </th>
                        {weeklyTrends.days.map((day) => (
                          <th key={day} className="text-center py-2 px-1 font-medium text-[#6E6E73]">
                            {day}
                          </th>
                        ))}
                        <th className="text-center py-2 px-1 font-semibold text-[#1D1D1F] bg-[#F5F5F7]">
                          Total
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {weeklyTrends.weeks.map((week) => {
                        const isCurrentWeek = week.week_label === "Current Week"
                        return (
                          <tr
                            key={week.week_label}
                            className={`border-b border-[#E5E5E5] ${isCurrentWeek ? "bg-[#E8F4FF]" : ""}`}
                          >
                            <td className={`py-2 px-1 ${isCurrentWeek ? "bg-[#E8F4FF]" : ""}`}>
                              <div className="font-medium text-[#1D1D1F] text-xs">{week.week_label}</div>
                              <div className="text-[10px] text-[#6E6E73]">{week.week_start}</div>
                            </td>
                            {weeklyTrends.days.map((day) => {
                              const value = week.daily_cumulative[day]
                              return (
                                <td
                                  key={day}
                                  className={`text-center py-2 px-1 ${value === null ? "text-[#D2D2D7]" : "text-[#1D1D1F]"}`}
                                >
                                  {value === null ? "-" : value}
                                </td>
                              )
                            })}
                            <td className={`text-center py-2 px-1 font-semibold bg-[#F5F5F7] ${week.week_total === null ? "text-[#D2D2D7]" : "text-[#1D1D1F]"}`}>
                              {week.week_total === null ? "-" : week.week_total}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              ) : null}
            </CardContent>
          </Card>

          {/* Product Mix By Week Table */}
          <Card className="bg-white border-[#D2D2D7] shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold text-[#1D1D1F] flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-[#0066CC]" />
                Product Mix By Week
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-2">
              {loading && !productMix ? (
                <div className="h-48 flex items-center justify-center">
                  <Loader2 className="h-6 w-6 animate-spin text-[#0066CC]" />
                </div>
              ) : error ? (
                <div className="h-48 flex items-center justify-center text-[#FF3B30] text-sm">
                  {error}
                </div>
              ) : productMix ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-[#D2D2D7]">
                        <th className="text-left py-2 px-2 font-semibold text-[#6E6E73] uppercase text-[10px] tracking-wide">
                          Week
                        </th>
                        <th className="text-center py-2 px-2 font-semibold text-[#6E6E73] uppercase text-[10px] tracking-wide">
                          Total
                        </th>
                        <th className="text-center py-2 px-2 font-semibold text-[#6E6E73] uppercase text-[10px] tracking-wide">
                          Cert
                        </th>
                        <th className="text-center py-2 px-2 font-semibold text-[#6E6E73] uppercase text-[10px] tracking-wide">
                          Learner
                        </th>
                        <th className="text-center py-2 px-2 font-semibold text-[#6E6E73] uppercase text-[10px] tracking-wide">
                          Team
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {productMix.weeks.map((week) => {
                        const isCurrentWeek = week.week_label === "Current Week"
                        return (
                          <tr
                            key={week.week_label}
                            className={`border-b border-[#E5E5E5] ${isCurrentWeek ? "bg-[#E8F4FF]" : ""}`}
                          >
                            <td className={`py-2 px-2 ${isCurrentWeek ? "bg-[#E8F4FF]" : ""}`}>
                              <div className="font-medium text-[#1D1D1F] text-xs">{week.week_label}</div>
                              <div className="text-[10px] text-[#6E6E73]">{week.week_start}</div>
                            </td>
                            <td className="text-center py-2 px-2 font-medium text-[#1D1D1F]">
                              {week.total}
                            </td>
                            <td className="text-center py-2 px-2 text-[#1D1D1F]">
                              {week.cert_pct}%
                            </td>
                            <td className="text-center py-2 px-2 text-[#1D1D1F]">
                              {week.learner_pct}%
                            </td>
                            <td className="text-center py-2 px-2 text-[#1D1D1F]">
                              {week.team_pct}%
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              ) : null}
            </CardContent>
          </Card>
        </div>

        {/* Direct Qty Total by Month Chart */}
        <div className="mb-8">
          <Card className="bg-white border-[#D2D2D7] shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold text-[#1D1D1F] flex items-center gap-2">
                <Calendar className="h-4 w-4 text-[#0066CC]" />
                Direct Qty Total by Month
              </CardTitle>
              <CardDescription className="text-sm text-[#6E6E73]">
                Year-over-year comparison of monthly direct sales (YTD)
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-2">
              {loading && !monthlyQtyYoY ? (
                <div className="h-80 flex items-center justify-center">
                  <Loader2 className="h-6 w-6 animate-spin text-[#0066CC]" />
                </div>
              ) : error ? (
                <div className="h-80 flex items-center justify-center text-[#FF3B30] text-sm">
                  {error}
                </div>
              ) : monthlyQtyYoY ? (
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart
                      data={monthlyQtyYoY.data}
                      margin={{ top: 20, right: 30, left: 0, bottom: 10 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#E5E5E5" />
                      <XAxis
                        dataKey="month_label"
                        tick={{ fontSize: 11, fill: '#6E6E73' }}
                        tickLine={{ stroke: '#D2D2D7' }}
                      />
                      <YAxis
                        tick={{ fontSize: 11, fill: '#6E6E73' }}
                        tickLine={{ stroke: '#D2D2D7' }}
                        axisLine={{ stroke: '#D2D2D7' }}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#FFFFFF',
                          border: '1px solid #D2D2D7',
                          borderRadius: '8px',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                        }}
                        labelStyle={{ color: '#1D1D1F', fontWeight: 600 }}
                        formatter={(value, name) => {
                          if (value === null || value === undefined) return ['-', String(name)]
                          const yearLabel = name === 'y2024' ? '2024' : name === 'y2025' ? '2025' : '2026'
                          return [Number(value).toLocaleString(), yearLabel]
                        }}
                      />
                      <Legend
                        wrapperStyle={{ paddingTop: '10px' }}
                        formatter={(value: string) => {
                          if (value === 'y2024') return '2024'
                          if (value === 'y2025') return '2025'
                          if (value === 'y2026') return '2026'
                          return value
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="y2024"
                        stroke="#8E8E93"
                        strokeWidth={2}
                        dot={{ fill: '#8E8E93', strokeWidth: 2, r: 4 }}
                        connectNulls
                        name="y2024"
                        label={{ position: 'top', fontSize: 12, fill: '#8E8E93' }}
                      />
                      <Line
                        type="monotone"
                        dataKey="y2025"
                        stroke="#0066CC"
                        strokeWidth={2}
                        dot={{ fill: '#0066CC', strokeWidth: 2, r: 4 }}
                        connectNulls
                        name="y2025"
                        label={{ position: 'top', fontSize: 12, fill: '#0066CC' }}
                      />
                      <Line
                        type="monotone"
                        dataKey="y2026"
                        stroke="#34C759"
                        strokeWidth={2}
                        dot={{ fill: '#34C759', strokeWidth: 2, r: 5 }}
                        connectNulls
                        label={{ position: 'top', fontSize: 13, fill: '#34C759', fontWeight: 600 }}
                        name="y2026"
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              ) : null}
            </CardContent>
          </Card>
        </div>

        {/* Subscriptions Section Header */}
        <div className="mb-4">
          <h2 className="text-xl font-semibold text-[#1D1D1F]">Subscriptions</h2>
        </div>

        {/* Active Subscriptions Card */}
        <div className="mb-6">
          {loading && !subscriptions ? (
            <CardSkeleton className="h-[100px] max-w-xs" />
          ) : subscriptions ? (
            <Card className="border-0 shadow-sm hover:shadow-md transition-shadow max-w-xs">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-[#6E6E73]">
                  Active Subscriptions
                </CardTitle>
                <Play className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-[#1D1D1F]">
                  {formatNumber(subscriptions.metrics.active_subscriptions)}
                </div>
                <p className="text-xs text-[#6E6E73] mt-1">
                  {((subscriptions.metrics.active_subscriptions / subscriptions.metrics.total_subscriptions) * 100).toFixed(1)}% of all subs
                </p>
              </CardContent>
            </Card>
          ) : null}
        </div>

        {/* Active Subscribers by Month Chart */}
        <div className="mb-8">
          <Card className="bg-white border-[#D2D2D7] shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold text-[#1D1D1F] flex items-center gap-2">
                <Users className="h-4 w-4 text-[#0066CC]" />
                Active Subscribers by Month
              </CardTitle>
              <CardDescription className="text-sm text-[#6E6E73]">
                Ending active subscriber count for each month
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-2">
              {loading && !subscriberTimeSeries ? (
                <div className="h-64 flex items-center justify-center">
                  <Loader2 className="h-6 w-6 animate-spin text-[#0066CC]" />
                </div>
              ) : activeCountByMonth.length > 0 ? (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart
                      data={activeCountByMonth}
                      margin={{ top: 30, right: 30, left: 0, bottom: 10 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#E5E5E5" />
                      <XAxis
                        dataKey="month"
                        tick={{ fontSize: 10, fill: '#6E6E73' }}
                        tickLine={{ stroke: '#D2D2D7' }}
                      />
                      <YAxis
                        tick={{ fontSize: 11, fill: '#6E6E73' }}
                        tickLine={{ stroke: '#D2D2D7' }}
                        axisLine={{ stroke: '#D2D2D7' }}
                        domain={['dataMin - 500', 'dataMax + 500']}
                        tickFormatter={(value) => value.toLocaleString()}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#FFFFFF',
                          border: '1px solid #D2D2D7',
                          borderRadius: '8px',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                        }}
                        labelStyle={{ color: '#1D1D1F', fontWeight: 600 }}
                        formatter={(value, name) => {
                          const numValue = Number(value ?? 0)
                          if (name === 'endingActive') return [numValue.toLocaleString(), 'Active Subscribers']
                          if (name === 'netAdds') return [numValue >= 0 ? `+${numValue}` : numValue, 'Net Change']
                          return [value, name]
                        }}
                      />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="endingActive"
                        stroke="#0066CC"
                        strokeWidth={3}
                        dot={{ fill: '#0066CC', strokeWidth: 2, r: 5 }}
                        name="endingActive"
                      >
                        <LabelList
                          dataKey="endingActive"
                          position="top"
                          offset={15}
                          fontSize={16}
                          fill="#0066CC"
                          fontWeight={600}
                          formatter={(value) => typeof value === 'number' ? value.toLocaleString() : value}
                        />
                      </Line>
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-64 flex items-center justify-center text-[#6E6E73] text-sm">
                  No time series data available
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
