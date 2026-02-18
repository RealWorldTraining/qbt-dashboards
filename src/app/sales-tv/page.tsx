"use client"

import { useEffect, useState } from "react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"
import { TrendingUp, Calendar, Loader2, Clock } from "lucide-react"

// Always use Railway API
const PROPHET_API_URL = "https://qbtraining-site-production.up.railway.app"

// Interfaces
interface PeriodMetrics {
  label: string
  date_range: string
  direct_qty: number
  direct_revenue: number
  py_qty: number
  py_revenue: number
  qty_change_pct: number
  revenue_change_pct: number
  renewal_qty: number
  renewal_revenue: number
  py_renewal_qty: number
  py_renewal_revenue: number
  renewal_qty_change_pct: number
  renewal_revenue_change_pct: number
  total_gross_revenue: number
  py_total_gross_revenue: number
  total_gross_revenue_change_pct: number
}

interface MetricsResponse {
  yesterday: PeriodMetrics
  today: PeriodMetrics
  this_week: PeriodMetrics
  this_month: PeriodMetrics
  avg_sale_price: number
}

interface HourlyPeriodData {
  period_label: string
  period_date: string
  hourly_sales: { [hour: string]: number | null }
  end_of_day: number | null
}

interface HourlyComparisonResponse {
  periods: HourlyPeriodData[]
  hours: string[]
}

interface WeeklyTrendRow {
  week_label: string
  week_start: string
  daily_cumulative: { [day: string]: number | null }
  week_total: number | null
}

interface ExtendedWeeklyTrendRow {
  week_label: string
  week_start: string
  daily_cumulative: { [day: string]: number | null }
  week_total: number | null
}

interface ExtendedWeeklyTrendsResponse {
  direct_qty: WeeklyTrendRow[]
  direct_revenue: ExtendedWeeklyTrendRow[]
  renewal_qty: WeeklyTrendRow[]
  renewal_revenue: ExtendedWeeklyTrendRow[]
  total_gross_revenue: ExtendedWeeklyTrendRow[]
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

interface WeeklyQtyYoYDataPoint {
  week_num: number
  week_label: string
  y2024: number | null
  y2025: number | null
  y2026: number | null
}

interface WeeklyQtyYoYResponse {
  data: WeeklyQtyYoYDataPoint[]
  current_week: number
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

interface MonthlyTrendRow {
  month_key: string
  month_label: string
  row_label: string
  direct_qty: Record<string, number | null>
  direct_revenue: Record<string, number | null>
  renewal_qty: Record<string, number | null>
  renewal_revenue: Record<string, number | null>
  total_gross_revenue: Record<string, number | null>
  total_direct_qty: number
  cert_total: number
  team_total: number
  learner_total: number
}

interface MonthlyTrendsResponse {
  months: MonthlyTrendRow[]
  weeks: string[]
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-US").format(value)
}

function abbreviatePeriodLabel(label: string): string {
  const mappings: { [key: string]: string } = {
    "1 Week Ago": "1W Ago",
    "2 Weeks Ago": "2W Ago",
    "3 Weeks Ago": "3W Ago",
    "4 Weeks Ago": "4W Ago",
    "1 Year Ago": "1Y Ago",
    "Last 4 Weeks Avg": "L4W Avg",
    "Last 6 Months Avg": "L6M Avg",
    "Last 12 Months Avg": "L12M Avg",
  }
  return mappings[label] || label
}

export default function SalesTVPage() {
  const [metrics, setMetrics] = useState<MetricsResponse | null>(null)
  const [hourlyComparison, setHourlyComparison] = useState<HourlyComparisonResponse | null>(null)
  const [extendedWeeklyTrends, setExtendedWeeklyTrends] = useState<ExtendedWeeklyTrendsResponse | null>(null)
  const [productMix, setProductMix] = useState<ProductMixResponse | null>(null)
  const [monthlyTrends, setMonthlyTrends] = useState<MonthlyTrendsResponse | null>(null)
  const [weeklyQtyYoY, setWeeklyQtyYoY] = useState<WeeklyQtyYoYResponse | null>(null)
  const [monthlyQtyYoY, setMonthlyQtyYoY] = useState<MonthlyQtyYoYResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())

  const fetchData = async () => {
    try {
      const results = await Promise.all([
        fetch(`${PROPHET_API_URL}/metrics`).then(r => r.json()),
        fetch(`${PROPHET_API_URL}/hourly-comparison`).then(r => r.json()),
        fetch(`${PROPHET_API_URL}/weekly-trends-extended`).then(r => r.json()),
        fetch(`${PROPHET_API_URL}/product-mix`).then(r => r.json()),
        fetch('/api/monthly-trends').then(r => r.json()),
        fetch(`${PROPHET_API_URL}/weekly-qty-yoy`).then(r => r.json()),
        fetch(`${PROPHET_API_URL}/monthly-qty-yoy`).then(r => r.json()),
      ])
      setMetrics(results[0])
      setHourlyComparison(results[1])
      setExtendedWeeklyTrends(results[2])
      setProductMix(results[3])
      setMonthlyTrends(results[4])
      setWeeklyQtyYoY(results[5])
      setMonthlyQtyYoY(results[6])
      setLastUpdated(new Date())
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load data")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
    // Auto-refresh every 5 minutes
    const interval = setInterval(fetchData, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0B0F1A] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-emerald-400 mx-auto mb-4" />
          <p className="text-white/60 text-lg">Loading Sales Data...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#0B0F1A] flex items-center justify-center">
        <p className="text-red-400 text-lg">{error}</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0B0F1A] text-white">
      {/* TV-optimized layout: 1080x1920 portrait */}
      <div className="w-full max-w-[1080px] mx-auto px-4 py-6 space-y-6">

        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-extrabold tracking-tight uppercase text-white">Sales Dashboard</h1>
          <p className="text-white/40 text-sm mt-1">
            Last updated: {lastUpdated.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
          </p>
        </div>

        {/* KPI Cards - single row */}
        {metrics && (
          <div className="grid grid-cols-4 gap-4">
            {/* Today */}
            {(() => {
              const now = new Date()
              const hour = now.getHours()
              const minutes = now.getMinutes()
              const timeStr = `${hour > 12 ? hour - 12 : hour === 0 ? 12 : hour}:${minutes.toString().padStart(2, '0')}${hour >= 12 ? 'pm' : 'am'}`
              const hourLabel = hour === 0 ? "12am" : hour < 12 ? `${hour}am` : hour === 12 ? "12pm" : `${hour - 12}pm`
              const todayData = hourlyComparison?.periods.find(p => p.period_label === "Today")
              const lastWeekData = hourlyComparison?.periods.find(p => p.period_label === "1 Week Ago" || p.period_label === "-1W")
              const twoWeeksData = hourlyComparison?.periods.find(p => p.period_label === "2 Weeks Ago" || p.period_label === "-2W")
              const threeWeeksData = hourlyComparison?.periods.find(p => p.period_label === "3 Weeks Ago" || p.period_label === "-3W")
              const lastWeekSales = lastWeekData?.hourly_sales[hourLabel] ?? 0
              const twoWeeksSales = twoWeeksData?.hourly_sales[hourLabel] ?? 0
              const threeWeeksSales = threeWeeksData?.hourly_sales[hourLabel] ?? 0
              return (
                <div className="rounded-2xl bg-gradient-to-br from-[#1D1D1F] to-[#2D2D2F] p-4 shadow-lg flex flex-col items-center justify-center">
                  <div className="text-sm font-medium text-white/70 mb-1">Today @ {timeStr}</div>
                  <div className="text-6xl font-bold text-white mb-2">{formatNumber(metrics.today.direct_qty)}</div>
                  <div className="w-full space-y-0.5 text-sm px-2">
                    <div className="flex justify-center gap-4"><span className="text-white/60">1WA</span><span className="font-semibold text-white/80">{lastWeekSales}</span></div>
                    <div className="flex justify-center gap-4"><span className="text-white/60">2WA</span><span className="font-semibold text-white/80">{twoWeeksSales}</span></div>
                    <div className="flex justify-center gap-4"><span className="text-white/60">3WA</span><span className="font-semibold text-white/80">{threeWeeksSales}</span></div>
                  </div>
                </div>
              )
            })()}
            {/* Yesterday */}
            <div className="rounded-2xl bg-gradient-to-br from-[#1D1D1F] to-[#2D2D2F] p-4 shadow-lg flex flex-col items-center justify-center">
              <div className="text-sm font-medium text-white/70 mb-1">Yesterday</div>
              <div className="text-6xl font-bold text-white">{formatNumber(metrics.yesterday.direct_qty)}</div>
              <div className="mt-2 text-center">
                <div className="text-sm text-white/50">PY: {formatNumber(metrics.yesterday.py_qty)}</div>
                <div className={`text-base font-semibold ${metrics.yesterday.qty_change_pct >= 0 ? "text-[#34C759]" : "text-[#FF6B6B]"}`}>
                  {metrics.yesterday.qty_change_pct >= 0 ? "+" : ""}{metrics.yesterday.qty_change_pct}%
                </div>
              </div>
            </div>
            {/* This Week */}
            <div className="rounded-2xl bg-gradient-to-br from-[#1D1D1F] to-[#2D2D2F] p-4 shadow-lg flex flex-col items-center justify-center">
              <div className="text-sm font-medium text-white/70 mb-1">This Week</div>
              <div className="text-6xl font-bold text-white">{formatNumber(metrics.this_week.direct_qty)}</div>
              <div className="mt-2 text-center">
                <div className="text-sm text-white/50">PY: {formatNumber(metrics.this_week.py_qty)}</div>
                <div className={`text-base font-semibold ${metrics.this_week.qty_change_pct >= 0 ? "text-[#34C759]" : "text-[#FF6B6B]"}`}>
                  {metrics.this_week.qty_change_pct >= 0 ? "+" : ""}{metrics.this_week.qty_change_pct}%
                </div>
              </div>
            </div>
            {/* MTD */}
            <div className="rounded-2xl bg-gradient-to-br from-[#1D1D1F] to-[#2D2D2F] p-4 shadow-lg flex flex-col items-center justify-center">
              <div className="text-sm font-medium text-white/70 mb-1">MTD</div>
              <div className="text-6xl font-bold text-white">{formatNumber(metrics.this_month.direct_qty)}</div>
              <div className="mt-2 text-center">
                <div className="text-sm text-white/50">PY: {formatNumber(metrics.this_month.py_qty)}</div>
                <div className={`text-base font-semibold ${metrics.this_month.qty_change_pct >= 0 ? "text-[#34C759]" : "text-[#FF6B6B]"}`}>
                  {metrics.this_month.qty_change_pct >= 0 ? "+" : ""}{metrics.this_month.qty_change_pct}%
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Hourly Sales Comparison Heatmap */}
        {hourlyComparison && (
          <Card className="bg-[#1D1D1F] border-[#2D2D2F]">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold text-white flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-[#0099FF]" />
                Hourly Sales Comparison
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto rounded-xl">
                <table className="w-full text-base bg-[#1D1D1F]">
                  <thead>
                    <tr className="border-b border-[#3D3D3F]">
                      <th className="text-left py-2 px-2 font-bold text-white sticky left-0 bg-[#1D1D1F] min-w-[90px]">Period</th>
                      {hourlyComparison.hours.map((hour) => (
                        <th key={hour} className="text-center py-2 px-0.5 font-semibold text-white whitespace-nowrap text-xs">
                          {hour.replace('am', 'a').replace('pm', 'p')}
                        </th>
                      ))}
                      <th className="text-center py-2 px-2 font-bold text-white bg-[#0066CC] whitespace-nowrap text-xs">EOD</th>
                    </tr>
                  </thead>
                  <tbody>
                    {hourlyComparison.periods.map((period) => {
                      const isToday = period.period_label === "Today"
                      const isShaded = period.period_label === "1 Year Ago" || period.period_label === "-1Y" || period.period_label.includes("Avg")
                      const cellBg = isToday ? "bg-[#1A3A52]" : isShaded ? "bg-[#2D2D2F]" : "bg-[#1D1D1F]"
                      const rowValues = hourlyComparison.hours.map(h => period.hourly_sales[h]).filter((v): v is number => v !== null)
                      const rowMax = Math.max(...rowValues, 1)
                      return (
                        <tr key={period.period_label} className="border-b border-white/5">
                          <td className={`py-2 px-2 sticky left-0 ${cellBg}`}>
                            <div className="font-semibold text-white text-sm">{abbreviatePeriodLabel(period.period_label)}</div>
                            {period.period_date && <div className="text-[10px] text-white/40">{period.period_date}</div>}
                          </td>
                          {hourlyComparison.hours.map((hour) => {
                            const value = period.hourly_sales[hour]
                            const pct = value ? value / rowMax : 0
                            const bg = value === null ? '#1D1D1F' : `hsl(220, ${20 + pct * 70}%, ${18 + pct * 17}%)`
                            return (
                              <td key={hour} style={{ backgroundColor: bg }} className={`text-center py-2 px-0.5 text-sm ${value === null ? "text-white/20" : "text-white font-semibold"}`}>
                                {value === null ? "-" : value}
                              </td>
                            )
                          })}
                          <td className={`text-center py-2 px-2 font-bold bg-[#2D2D2F] text-sm ${period.end_of_day === null ? "text-white/20" : "text-white"}`}>
                            {period.end_of_day === null ? "-" : period.end_of_day}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Sales Pace (Cumulative) Line Chart */}
        {hourlyComparison && (
          <Card className="bg-[#1D1D1F] border-[#2D2D2F]">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold text-white flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-emerald-400" />
                Sales Pace (Cumulative)
              </CardTitle>
              <CardDescription className="text-sm text-white/50">Today vs 1 week ago vs 1 year ago</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart
                    data={(() => {
                      const hours = hourlyComparison.hours
                      const today = hourlyComparison.periods.find(p => p.period_label === "Today")
                      const w1 = hourlyComparison.periods.find(p => p.period_label === "1 Week Ago" || p.period_label === "-1W")
                      const y1 = hourlyComparison.periods.find(p => p.period_label === "1 Year Ago" || p.period_label === "-1Y")
                      return hours.map((hour) => ({
                        hour: hour.replace('am', 'a').replace('pm', 'p'),
                        Today: today?.hourly_sales[hour] ?? null,
                        '1W Ago': w1?.hourly_sales[hour] ?? null,
                        '1Y Ago': y1?.hourly_sales[hour] ?? null,
                      }))
                    })()}
                    margin={{ top: 25, right: 20, left: 0, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                    <XAxis dataKey="hour" tick={{ fontSize: 10, fill: '#ffffff80' }} tickLine={false} axisLine={{ stroke: '#ffffff15' }} />
                    <YAxis tick={{ fontSize: 10, fill: '#ffffff80' }} tickLine={false} axisLine={false} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#2D2D2F', border: '1px solid #3D3D3F', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.4)', fontSize: 13, color: '#fff' }}
                      labelStyle={{ color: '#ffffff', fontWeight: 600, fontSize: 13 }}
                      itemStyle={{ color: '#ffffffcc' }}
                    />
                    <Legend wrapperStyle={{ paddingTop: '8px', fontSize: 11, color: '#ffffffcc' }} />
                    <Line type="monotone" dataKey="Today" stroke="#34D399" strokeWidth={3} dot={{ fill: '#34D399', r: 3, stroke: '#1D1D1F', strokeWidth: 2 }} activeDot={{ r: 5 }} name="Today" label={{ position: 'top', fontSize: 9, fill: '#34D399', fontWeight: 600, offset: 6 }} />
                    <Line type="monotone" dataKey="1W Ago" stroke="#818CF8" strokeWidth={2} dot={{ fill: '#818CF8', r: 2, stroke: '#1D1D1F', strokeWidth: 2 }} name="1W Ago" label={{ position: 'top', fontSize: 8, fill: '#818CF8', offset: 6 }} />
                    <Line type="monotone" dataKey="1Y Ago" stroke="#FBBF24" strokeWidth={2} strokeDasharray="5 5" dot={{ fill: '#FBBF24', r: 2, stroke: '#1D1D1F', strokeWidth: 2 }} name="1Y Ago" label={{ position: 'bottom', fontSize: 8, fill: '#FBBF24', offset: 6 }} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Weekly Trends (Direct QTY) Line Chart */}
        {extendedWeeklyTrends && (
          <Card className="bg-[#1D1D1F] border-[#2D2D2F]">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold text-white flex items-center gap-2">
                <Calendar className="h-4 w-4 text-blue-400" />
                Weekly Trends (Direct QTY)
              </CardTitle>
              <CardDescription className="text-sm text-white/50">Current week vs last week vs same week last year</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart
                    data={(() => {
                      const days = extendedWeeklyTrends.days
                      const currentWeek = extendedWeeklyTrends.direct_qty[0]
                      const lastWeek = extendedWeeklyTrends.direct_qty[1]
                      const sameWeekLY = extendedWeeklyTrends.direct_qty.length > 52
                        ? extendedWeeklyTrends.direct_qty[52]
                        : extendedWeeklyTrends.direct_qty[extendedWeeklyTrends.direct_qty.length - 1]
                      return days.map(day => ({
                        day,
                        'This Week': currentWeek?.daily_cumulative[day] ?? null,
                        'Last Week': lastWeek?.daily_cumulative[day] ?? null,
                        'Same Wk LY': sameWeekLY?.daily_cumulative[day] ?? null,
                      }))
                    })()}
                    margin={{ top: 25, right: 20, left: 0, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                    <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#ffffff80' }} tickLine={false} axisLine={{ stroke: '#ffffff15' }} />
                    <YAxis tick={{ fontSize: 11, fill: '#ffffff80' }} tickLine={false} axisLine={false} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#2D2D2F', border: '1px solid #3D3D3F', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.4)', fontSize: 13, color: '#fff' }}
                      labelStyle={{ color: '#ffffff', fontWeight: 600, fontSize: 13 }}
                      itemStyle={{ color: '#ffffffcc' }}
                    />
                    <Legend wrapperStyle={{ paddingTop: '8px', fontSize: 11, color: '#ffffffcc' }} />
                    <Line type="monotone" dataKey="This Week" stroke="#34D399" strokeWidth={3} dot={{ fill: '#34D399', r: 4, stroke: '#1D1D1F', strokeWidth: 2 }} activeDot={{ r: 6 }} name="This Week" label={{ position: 'top', fontSize: 10, fill: '#34D399', fontWeight: 600, offset: 8 }} />
                    <Line type="monotone" dataKey="Last Week" stroke="#818CF8" strokeWidth={2} dot={{ fill: '#818CF8', r: 3, stroke: '#1D1D1F', strokeWidth: 2 }} name="Last Week" label={{ position: 'top', fontSize: 9, fill: '#818CF8', offset: 8 }} />
                    <Line type="monotone" dataKey="Same Wk LY" stroke="#FBBF24" strokeWidth={2} strokeDasharray="5 5" dot={{ fill: '#FBBF24', r: 3, stroke: '#1D1D1F', strokeWidth: 2 }} name="Same Wk LY" label={{ position: 'bottom', fontSize: 9, fill: '#FBBF24', offset: 8 }} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Actual Sales Per Hour (non-cumulative heatmap) */}
        {hourlyComparison && (
          <Card className="bg-[#1D1D1F] border-[#2D2D2F]">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold text-white flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-emerald-400" />
                Actual Sales Per Hour
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto rounded-xl">
                <table className="w-full text-base bg-[#1D1D1F]">
                  <thead>
                    <tr className="border-b border-[#3D3D3F]">
                      <th className="text-left py-2 px-2 font-bold text-white sticky left-0 bg-[#1D1D1F] min-w-[90px]">Period</th>
                      {hourlyComparison.hours.map((hour) => (
                        <th key={hour} className="text-center py-2 px-0.5 font-semibold text-white whitespace-nowrap text-xs">
                          {hour.replace('am', 'a').replace('pm', 'p')}
                        </th>
                      ))}
                      <th className="text-center py-2 px-2 font-bold text-white bg-emerald-700 whitespace-nowrap text-xs">EOD</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(() => {
                      const hours = hourlyComparison.hours
                      const getIndividualValue = (period: typeof hourlyComparison.periods[0], hourIdx: number) => {
                        const currentVal = period.hourly_sales[hours[hourIdx]]
                        if (currentVal === null) return null
                        if (hourIdx === 0) return currentVal
                        const prevVal = period.hourly_sales[hours[hourIdx - 1]]
                        if (prevVal === null) return currentVal
                        return currentVal - prevVal
                      }
                      return hourlyComparison.periods.map((period) => {
                        const isToday = period.period_label === "Today"
                        const isShaded = period.period_label === "1 Year Ago" || period.period_label === "-1Y" || period.period_label.includes("Avg")
                        const cellBg = isToday ? "bg-[#1A3A52]" : isShaded ? "bg-[#2D2D2F]" : "bg-[#1D1D1F]"
                        const rowValues = hours.map((_, hIdx) => getIndividualValue(period, hIdx)).filter((v): v is number => v !== null)
                        const rowMax = Math.max(...rowValues, 1)
                        return (
                          <tr key={period.period_label} className="border-b border-white/5">
                            <td className={`py-2 px-2 sticky left-0 ${cellBg}`}>
                              <div className="font-semibold text-white text-sm">{abbreviatePeriodLabel(period.period_label)}</div>
                              {period.period_date && <div className="text-[10px] text-white/40">{period.period_date}</div>}
                            </td>
                            {hours.map((hour, hIdx) => {
                              const value = getIndividualValue(period, hIdx)
                              const pct = value ? value / rowMax : 0
                              const bg = value === null ? '#1D1D1F' : `hsl(155, ${40 + pct * 40}%, ${45 - pct * 25}%)`
                              return (
                                <td key={hour} style={{ backgroundColor: bg }} className={`text-center py-2 px-0.5 text-sm ${value === null ? "text-white/20" : "text-white font-semibold"}`}>
                                  {value === null ? "-" : value}
                                </td>
                              )
                            })}
                            <td className={`text-center py-2 px-2 font-bold bg-[#2D2D2F] text-sm ${period.end_of_day === null ? "text-white/20" : "text-white"}`}>
                              {period.end_of_day === null ? "-" : period.end_of_day}
                            </td>
                          </tr>
                        )
                      })
                    })()}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Remaining Sales Per Hour (countdown) */}
        {hourlyComparison && (
          <Card className="bg-[#1D1D1F] border-[#2D2D2F]">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold text-white flex items-center gap-2">
                <Clock className="h-4 w-4 text-orange-400" />
                Remaining Sales Per Hour
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto rounded-xl">
                <table className="w-full text-base bg-[#1D1D1F]">
                  <thead>
                    <tr className="border-b border-[#3D3D3F]">
                      <th className="text-left py-2 px-2 font-bold text-white sticky left-0 bg-[#1D1D1F] min-w-[90px]">Period</th>
                      {hourlyComparison.hours.map((hour) => (
                        <th key={hour} className="text-center py-2 px-0.5 font-semibold text-white whitespace-nowrap text-xs">
                          {hour.replace('am', 'a').replace('pm', 'p')}
                        </th>
                      ))}
                      <th className="text-center py-2 px-2 font-bold text-white bg-orange-700 whitespace-nowrap text-xs">EOD</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(() => {
                      const hours = hourlyComparison.hours
                      const getRemainingValue = (period: typeof hourlyComparison.periods[0], hour: string) => {
                        const cumulativeAtHour = period.hourly_sales[hour]
                        const eod = period.end_of_day
                        if (cumulativeAtHour === null || eod === null) return null
                        return eod - cumulativeAtHour
                      }
                      return hourlyComparison.periods.map((period) => {
                        const isToday = period.period_label === "Today"
                        const isShaded = period.period_label === "1 Year Ago" || period.period_label === "-1Y" || period.period_label.includes("Avg")
                        const cellBg = isToday ? "bg-[#1A3A52]" : isShaded ? "bg-[#2D2D2F]" : "bg-[#1D1D1F]"
                        const rowValues = hours.map((hour) => getRemainingValue(period, hour)).filter((v): v is number => v !== null)
                        const rowMax = Math.max(...rowValues, 1)
                        return (
                          <tr key={period.period_label} className="border-b border-white/5">
                            <td className={`py-2 px-2 sticky left-0 ${cellBg}`}>
                              <div className="font-semibold text-white text-sm">{abbreviatePeriodLabel(period.period_label)}</div>
                              {period.period_date && <div className="text-[10px] text-white/40">{period.period_date}</div>}
                            </td>
                            {hours.map((hour) => {
                              const value = getRemainingValue(period, hour)
                              const pct = value ? value / rowMax : 0
                              const bg = value === null ? '#1D1D1F' : `hsl(30, ${50 + pct * 40}%, ${50 - pct * 30}%)`
                              return (
                                <td key={hour} style={{ backgroundColor: bg }} className={`text-center py-2 px-0.5 text-sm ${value === null ? "text-white/20" : "text-white font-semibold"}`}>
                                  {value === null ? "-" : value}
                                </td>
                              )
                            })}
                            <td className={`text-center py-2 px-2 font-bold bg-[#2D2D2F] text-sm ${period.end_of_day === null ? "text-white/20" : "text-white"}`}>
                              {period.end_of_day === null ? "-" : 0}
                            </td>
                          </tr>
                        )
                      })
                    })()}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Weekly Trends Heatmap - Direct QTY (cumulative) */}
        {extendedWeeklyTrends && (
          <Card className="bg-[#1D1D1F] border-[#2D2D2F]">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold text-white flex items-center gap-2">
                <Calendar className="h-4 w-4 text-[#0099FF]" />
                Weekly Trends (Direct QTY)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto rounded-xl">
                <table className="w-full text-base bg-[#1D1D1F]">
                  <thead>
                    <tr className="border-b border-[#3D3D3F]">
                      <th className="text-left py-2 px-2 font-bold text-white sticky left-0 bg-[#1D1D1F] min-w-[90px]">Week</th>
                      {extendedWeeklyTrends.days.map((day) => (
                        <th key={day} className="text-center py-2 px-1 font-semibold text-white whitespace-nowrap text-sm">{day}</th>
                      ))}
                      <th className="text-center py-2 px-2 font-bold text-white bg-[#0066CC] whitespace-nowrap text-sm">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {extendedWeeklyTrends.direct_qty.map((week, idx) => {
                      const isCurrentWeek = week.week_label === "Current Week"
                      const cellBg = isCurrentWeek ? "bg-[#1A3A52]" : "bg-[#1D1D1F]"
                      const days = extendedWeeklyTrends.days
                      const rowValues = days.map(day => week.daily_cumulative[day]).filter((v): v is number => typeof v === 'number')
                      const rowMax = Math.max(...rowValues, 1)
                      return (
                        <tr key={idx} className="border-b border-white/5">
                          <td className={`py-2 px-2 sticky left-0 ${cellBg}`}>
                            <div className="font-semibold text-white text-sm">{week.week_label}</div>
                            <div className="text-[10px] text-white/40">{week.week_start}</div>
                          </td>
                          {days.map(day => {
                            const value = week.daily_cumulative[day]
                            const pct = value ? value / rowMax : 0
                            const bg = value === null || value === undefined ? '#1D1D1F' : `hsl(220, ${20 + pct * 70}%, ${18 + pct * 17}%)`
                            return (
                              <td key={day} style={{ backgroundColor: bg }} className={`text-center py-2 px-1 text-sm ${value === null ? "text-white/20" : "text-white font-semibold"}`}>
                                {value ?? '-'}
                              </td>
                            )
                          })}
                          <td className={`text-center py-2 px-2 font-bold bg-[#2D2D2F] text-sm ${week.week_total === null ? "text-white/20" : "text-white"}`}>
                            {week.week_total ?? '-'}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Daily Sales (Direct QTY) non-cumulative */}
        {extendedWeeklyTrends && (
          <Card className="bg-[#1D1D1F] border-[#2D2D2F]">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold text-white flex items-center gap-2">
                <Calendar className="h-4 w-4 text-emerald-400" />
                Daily Sales (Direct QTY)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto rounded-xl">
                <table className="w-full text-base bg-[#1D1D1F]">
                  <thead>
                    <tr className="border-b border-[#3D3D3F]">
                      <th className="text-left py-2 px-2 font-bold text-white sticky left-0 bg-[#1D1D1F] min-w-[90px]">Week</th>
                      {extendedWeeklyTrends.days.map((day) => (
                        <th key={day} className="text-center py-2 px-1 font-semibold text-white whitespace-nowrap text-sm">{day}</th>
                      ))}
                      <th className="text-center py-2 px-2 font-bold text-white bg-emerald-700 whitespace-nowrap text-sm">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(() => {
                      const days = extendedWeeklyTrends.days
                      const getIndividualValue = (week: typeof extendedWeeklyTrends.direct_qty[0], dayIdx: number) => {
                        const currentVal = week.daily_cumulative[days[dayIdx]]
                        if (currentVal === null || currentVal === undefined) return null
                        if (dayIdx === 0) return currentVal
                        const prevVal = week.daily_cumulative[days[dayIdx - 1]]
                        if (prevVal === null || prevVal === undefined) return currentVal
                        return currentVal - prevVal
                      }
                      return extendedWeeklyTrends.direct_qty.map((week, idx) => {
                        const isCurrentWeek = week.week_label === "Current Week"
                        const cellBg = isCurrentWeek ? "bg-[#1A3A52]" : "bg-[#1D1D1F]"
                        const rowValues = days.map((_, dIdx) => getIndividualValue(week, dIdx)).filter((v): v is number => v !== null)
                        const rowMax = Math.max(...rowValues, 1)
                        return (
                          <tr key={idx} className="border-b border-white/5">
                            <td className={`py-2 px-2 sticky left-0 ${cellBg}`}>
                              <div className="font-semibold text-white text-sm">{week.week_label}</div>
                              <div className="text-[10px] text-white/40">{week.week_start}</div>
                            </td>
                            {days.map((day, dIdx) => {
                              const value = getIndividualValue(week, dIdx)
                              const pct = value ? value / rowMax : 0
                              const bg = value === null ? '#1D1D1F' : `hsl(155, ${40 + pct * 40}%, ${45 - pct * 25}%)`
                              return (
                                <td key={day} style={{ backgroundColor: bg }} className={`text-center py-2 px-1 text-sm ${value === null ? "text-white/20" : "text-white font-semibold"}`}>
                                  {value ?? '-'}
                                </td>
                              )
                            })}
                            <td className={`text-center py-2 px-2 font-bold bg-[#2D2D2F] text-sm ${week.week_total === null ? "text-white/20" : "text-white"}`}>
                              {week.week_total ?? '-'}
                            </td>
                          </tr>
                        )
                      })
                    })()}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Weekly Trends Section - 2x3 grid of tables */}
        {extendedWeeklyTrends && (
          <div className="space-y-4">
            <h2 className="text-base font-semibold text-white flex items-center gap-2">
              <Calendar className="h-4 w-4 text-[#0099FF]" />
              Weekly Trends
            </h2>

            <div className="grid grid-cols-2 gap-4">
              {/* Direct QTY */}
              <Card className="bg-[#1D1D1F] border-[#2D2D2F]">
                <CardHeader className="pb-1 px-3 pt-3">
                  <CardTitle className="text-sm font-bold text-white">Direct QTY</CardTitle>
                </CardHeader>
                <CardContent className="pt-0 px-3">
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-[#3D3D3F]">
                          <th className="text-left py-1.5 px-1 font-semibold text-white/70 min-w-[70px]">Week</th>
                          {extendedWeeklyTrends.days.map(d => <th key={d} className="text-center py-1.5 px-0.5 font-medium text-white/60">{d}</th>)}
                          <th className="text-center py-1.5 px-1 font-semibold text-[#0099FF] bg-white/5">Tot</th>
                        </tr>
                      </thead>
                      <tbody>
                        {extendedWeeklyTrends.direct_qty.map(week => (
                          <tr key={week.week_label} className={`border-b border-white/5 ${week.week_label === "Current Week" ? "bg-[#1A3A52]" : ""}`}>
                            <td className="py-1.5 px-1"><div className="font-medium text-white text-xs">{week.week_label}</div><div className="text-[9px] text-white/40">{week.week_start}</div></td>
                            {extendedWeeklyTrends.days.map(d => <td key={d} className={`text-center py-1.5 px-0.5 ${week.daily_cumulative[d] === null ? "text-white/20" : "text-white"}`}>{week.daily_cumulative[d] ?? "-"}</td>)}
                            <td className={`text-center py-1.5 px-1 font-semibold bg-white/5 ${week.week_total === null ? "text-white/20" : "text-[#0099FF]"}`}>{week.week_total ?? "-"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>

              {/* Direct Revenue */}
              <Card className="bg-[#1D1D1F] border-[#2D2D2F]">
                <CardHeader className="pb-1 px-3 pt-3">
                  <CardTitle className="text-sm font-bold text-white">Direct Revenue</CardTitle>
                </CardHeader>
                <CardContent className="pt-0 px-3">
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-[#3D3D3F]">
                          <th className="text-left py-1.5 px-1 font-semibold text-white/70 min-w-[70px]">Week</th>
                          {extendedWeeklyTrends.days.map(d => <th key={d} className="text-center py-1.5 px-0.5 font-medium text-white/60">{d}</th>)}
                          <th className="text-center py-1.5 px-1 font-semibold text-[#0099FF] bg-white/5">Tot</th>
                        </tr>
                      </thead>
                      <tbody>
                        {extendedWeeklyTrends.direct_revenue.map(week => (
                          <tr key={week.week_label} className={`border-b border-white/5 ${week.week_label === "Current Week" ? "bg-[#1A3A52]" : ""}`}>
                            <td className="py-1.5 px-1"><div className="font-medium text-white text-xs">{week.week_label}</div><div className="text-[9px] text-white/40">{week.week_start}</div></td>
                            {extendedWeeklyTrends.days.map(d => { const v = week.daily_cumulative[d]; return <td key={d} className={`text-center py-1.5 px-0.5 ${v === null ? "text-white/20" : "text-white"}`}>{v === null ? "-" : v ? `$${Math.round(v/1000)}k` : "$0"}</td> })}
                            <td className={`text-center py-1.5 px-1 font-semibold bg-white/5 ${week.week_total === null ? "text-white/20" : "text-[#0099FF]"}`}>{week.week_total === null ? "-" : `$${Math.round(week.week_total/1000)}k`}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>

              {/* Renewal QTY */}
              <Card className="bg-[#1D1D1F] border-[#2D2D2F]">
                <CardHeader className="pb-1 px-3 pt-3">
                  <CardTitle className="text-sm font-bold text-white">Renewal QTY</CardTitle>
                </CardHeader>
                <CardContent className="pt-0 px-3">
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-[#3D3D3F]">
                          <th className="text-left py-1.5 px-1 font-semibold text-white/70 min-w-[70px]">Week</th>
                          {extendedWeeklyTrends.days.map(d => <th key={d} className="text-center py-1.5 px-0.5 font-medium text-white/60">{d}</th>)}
                          <th className="text-center py-1.5 px-1 font-semibold text-[#0099FF] bg-white/5">Tot</th>
                        </tr>
                      </thead>
                      <tbody>
                        {extendedWeeklyTrends.renewal_qty.map(week => (
                          <tr key={week.week_label} className={`border-b border-white/5 ${week.week_label === "Current Week" ? "bg-[#1A3A52]" : ""}`}>
                            <td className="py-1.5 px-1"><div className="font-medium text-white text-xs">{week.week_label}</div><div className="text-[9px] text-white/40">{week.week_start}</div></td>
                            {extendedWeeklyTrends.days.map(d => <td key={d} className={`text-center py-1.5 px-0.5 ${week.daily_cumulative[d] === null ? "text-white/20" : "text-white"}`}>{week.daily_cumulative[d] ?? "-"}</td>)}
                            <td className={`text-center py-1.5 px-1 font-semibold bg-white/5 ${week.week_total === null ? "text-white/20" : "text-[#0099FF]"}`}>{week.week_total ?? "-"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>

              {/* Renewal Revenue */}
              <Card className="bg-[#1D1D1F] border-[#2D2D2F]">
                <CardHeader className="pb-1 px-3 pt-3">
                  <CardTitle className="text-sm font-bold text-white">Renewal Revenue</CardTitle>
                </CardHeader>
                <CardContent className="pt-0 px-3">
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-[#3D3D3F]">
                          <th className="text-left py-1.5 px-1 font-semibold text-white/70 min-w-[70px]">Week</th>
                          {extendedWeeklyTrends.days.map(d => <th key={d} className="text-center py-1.5 px-0.5 font-medium text-white/60">{d}</th>)}
                          <th className="text-center py-1.5 px-1 font-semibold text-[#0099FF] bg-white/5">Tot</th>
                        </tr>
                      </thead>
                      <tbody>
                        {extendedWeeklyTrends.renewal_revenue.map(week => (
                          <tr key={week.week_label} className={`border-b border-white/5 ${week.week_label === "Current Week" ? "bg-[#1A3A52]" : ""}`}>
                            <td className="py-1.5 px-1"><div className="font-medium text-white text-xs">{week.week_label}</div><div className="text-[9px] text-white/40">{week.week_start}</div></td>
                            {extendedWeeklyTrends.days.map(d => { const v = week.daily_cumulative[d]; return <td key={d} className={`text-center py-1.5 px-0.5 ${v === null ? "text-white/20" : "text-white"}`}>{v === null ? "-" : v ? `$${Math.round(v/1000)}k` : "$0"}</td> })}
                            <td className={`text-center py-1.5 px-1 font-semibold bg-white/5 ${week.week_total === null ? "text-white/20" : "text-[#0099FF]"}`}>{week.week_total === null ? "-" : `$${Math.round(week.week_total/1000)}k`}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>

              {/* Total Gross Revenue */}
              <Card className="bg-[#1D1D1F] border-[#2D2D2F]">
                <CardHeader className="pb-1 px-3 pt-3">
                  <CardTitle className="text-sm font-bold text-white">Total Gross Revenue</CardTitle>
                </CardHeader>
                <CardContent className="pt-0 px-3">
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-[#3D3D3F]">
                          <th className="text-left py-1.5 px-1 font-semibold text-white/70 min-w-[70px]">Week</th>
                          {extendedWeeklyTrends.days.map(d => <th key={d} className="text-center py-1.5 px-0.5 font-medium text-white/60">{d}</th>)}
                          <th className="text-center py-1.5 px-1 font-semibold text-emerald-400 bg-white/5">Tot</th>
                        </tr>
                      </thead>
                      <tbody>
                        {extendedWeeklyTrends.total_gross_revenue.map(week => (
                          <tr key={week.week_label} className={`border-b border-white/5 ${week.week_label === "Current Week" ? "bg-[#1A3A52]" : ""}`}>
                            <td className="py-1.5 px-1"><div className="font-medium text-white text-xs">{week.week_label}</div><div className="text-[9px] text-white/40">{week.week_start}</div></td>
                            {extendedWeeklyTrends.days.map(d => { const v = week.daily_cumulative[d]; return <td key={d} className={`text-center py-1.5 px-0.5 ${v === null ? "text-white/20" : "text-white"}`}>{v === null ? "-" : v ? `$${Math.round(v/1000)}k` : "$0"}</td> })}
                            <td className={`text-center py-1.5 px-1 font-semibold bg-white/5 ${week.week_total === null ? "text-white/20" : "text-emerald-400"}`}>{week.week_total === null ? "-" : `$${Math.round(week.week_total/1000)}k`}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>

              {/* Product Mix By Week */}
              {productMix && (
                <Card className="bg-[#1D1D1F] border-[#2D2D2F]">
                  <CardHeader className="pb-1 px-3 pt-3">
                    <CardTitle className="text-sm font-bold text-white">Product Mix</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0 px-3">
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="border-b border-[#3D3D3F]">
                            <th className="text-left py-1.5 px-1 font-semibold text-white/70">Week</th>
                            <th className="text-center py-1.5 px-1 font-semibold text-white/70">Tot</th>
                            <th className="text-center py-1.5 px-1 font-semibold text-white/70">Cert</th>
                            <th className="text-center py-1.5 px-1 font-semibold text-white/70">Lrn</th>
                            <th className="text-center py-1.5 px-1 font-semibold text-white/70">Team</th>
                          </tr>
                        </thead>
                        <tbody>
                          {productMix.weeks.map(week => (
                            <tr key={week.week_label} className={`border-b border-white/5 ${week.week_label === "Current Week" ? "bg-[#1A3A52]" : ""}`}>
                              <td className="py-1.5 px-1"><div className="font-medium text-white text-xs">{week.week_label}</div><div className="text-[9px] text-white/40">{week.week_start}</div></td>
                              <td className="text-center py-1.5 px-1 font-medium text-white">{week.total}</td>
                              <td className="text-center py-1.5 px-1 text-white">{week.cert_pct}%</td>
                              <td className="text-center py-1.5 px-1 text-white">{week.learner_pct}%</td>
                              <td className="text-center py-1.5 px-1 text-white">{week.team_pct}%</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        )}

        {/* YoY Charts */}
        {weeklyQtyYoY && (
          <Card className="bg-[#1D1D1F] border-[#2D2D2F]">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold text-white flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-[#0099FF]" />
                Direct Qty by Week (YoY)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={weeklyQtyYoY.data} margin={{ top: 15, right: 20, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                    <XAxis dataKey="week_label" tick={{ fontSize: 10, fill: '#ffffff60' }} tickLine={false} interval={3} axisLine={{ stroke: '#ffffff15' }} />
                    <YAxis tick={{ fontSize: 10, fill: '#ffffff60' }} tickLine={false} axisLine={false} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#2D2D2F', border: '1px solid #3D3D3F', borderRadius: '8px', fontSize: 12, color: '#fff' }}
                      labelStyle={{ color: '#fff', fontWeight: 600 }}
                      formatter={(value, name) => { if (value === null) return ['-', String(name)]; const y = name === 'y2024' ? '2024' : name === 'y2025' ? '2025' : '2026'; return [Number(value).toLocaleString(), y] }}
                    />
                    <Legend wrapperStyle={{ fontSize: 11, color: '#ffffffcc' }} formatter={(v: string) => v === 'y2024' ? '2024' : v === 'y2025' ? '2025' : '2026'} />
                    <Line type="monotone" dataKey="y2024" stroke="#8E8E93" strokeWidth={2} dot={{ fill: '#8E8E93', r: 2 }} connectNulls name="y2024" />
                    <Line type="monotone" dataKey="y2025" stroke="#0099FF" strokeWidth={2} dot={{ fill: '#0099FF', r: 2 }} connectNulls name="y2025" />
                    <Line type="monotone" dataKey="y2026" stroke="#34C759" strokeWidth={3} dot={{ fill: '#34C759', r: 3 }} connectNulls name="y2026" />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Monthly YoY */}
        {monthlyQtyYoY && (
          <Card className="bg-[#1D1D1F] border-[#2D2D2F]">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold text-white flex items-center gap-2">
                <Calendar className="h-4 w-4 text-[#0099FF]" />
                Direct Qty by Month (YoY)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={monthlyQtyYoY.data} margin={{ top: 15, right: 20, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                    <XAxis dataKey="month_label" tick={{ fontSize: 11, fill: '#ffffff60' }} tickLine={false} axisLine={{ stroke: '#ffffff15' }} />
                    <YAxis tick={{ fontSize: 10, fill: '#ffffff60' }} tickLine={false} axisLine={false} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#2D2D2F', border: '1px solid #3D3D3F', borderRadius: '8px', fontSize: 12, color: '#fff' }}
                      labelStyle={{ color: '#fff', fontWeight: 600 }}
                      formatter={(value, name) => { if (value === null) return ['-', String(name)]; const y = name === 'y2024' ? '2024' : name === 'y2025' ? '2025' : '2026'; return [Number(value).toLocaleString(), y] }}
                    />
                    <Legend wrapperStyle={{ fontSize: 11, color: '#ffffffcc' }} formatter={(v: string) => v === 'y2024' ? '2024' : v === 'y2025' ? '2025' : '2026'} />
                    <Line type="monotone" dataKey="y2024" stroke="#8E8E93" strokeWidth={2} dot={{ fill: '#8E8E93', r: 3 }} connectNulls name="y2024" />
                    <Line type="monotone" dataKey="y2025" stroke="#0099FF" strokeWidth={2} dot={{ fill: '#0099FF', r: 3 }} connectNulls name="y2025" />
                    <Line type="monotone" dataKey="y2026" stroke="#34C759" strokeWidth={3} dot={{ fill: '#34C759', r: 4 }} connectNulls name="y2026" />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Cumulative YoY Charts */}
        {weeklyQtyYoY && (
          <Card className="bg-[#1D1D1F] border-[#2D2D2F]">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold text-white flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-[#34C759]" />
                Cumulative Direct Qty by Week
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart
                    data={(() => {
                      let cum2024 = 0, cum2025 = 0, cum2026 = 0
                      return weeklyQtyYoY.data.map(d => {
                        if (d.y2024 !== null) cum2024 += d.y2024
                        if (d.y2025 !== null) cum2025 += d.y2025
                        if (d.y2026 !== null) cum2026 += d.y2026
                        return { week_label: d.week_label, y2024: d.y2024 !== null ? cum2024 : null, y2025: d.y2025 !== null ? cum2025 : null, y2026: d.y2026 !== null ? cum2026 : null }
                      })
                    })()}
                    margin={{ top: 15, right: 20, left: 10, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                    <XAxis dataKey="week_label" tick={{ fontSize: 10, fill: '#ffffff60' }} tickLine={false} interval={3} axisLine={{ stroke: '#ffffff15' }} />
                    <YAxis tick={{ fontSize: 10, fill: '#ffffff60' }} tickLine={false} axisLine={false} tickFormatter={v => v.toLocaleString()} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#2D2D2F', border: '1px solid #3D3D3F', borderRadius: '8px', fontSize: 12, color: '#fff' }}
                      labelStyle={{ color: '#fff', fontWeight: 600 }}
                      formatter={(value, name) => { if (value === null) return ['-', String(name)]; const y = name === 'y2024' ? '2024' : name === 'y2025' ? '2025' : '2026'; return [Number(value).toLocaleString(), y] }}
                    />
                    <Legend wrapperStyle={{ fontSize: 11, color: '#ffffffcc' }} formatter={(v: string) => v === 'y2024' ? '2024' : v === 'y2025' ? '2025' : '2026'} />
                    <Line type="monotone" dataKey="y2024" stroke="#8E8E93" strokeWidth={2} dot={{ fill: '#8E8E93', r: 2 }} connectNulls name="y2024" />
                    <Line type="monotone" dataKey="y2025" stroke="#0099FF" strokeWidth={2} dot={{ fill: '#0099FF', r: 2 }} connectNulls name="y2025" />
                    <Line type="monotone" dataKey="y2026" stroke="#34C759" strokeWidth={3} dot={{ fill: '#34C759', r: 3 }} connectNulls name="y2026" />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}

        {monthlyQtyYoY && (
          <Card className="bg-[#1D1D1F] border-[#2D2D2F]">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold text-white flex items-center gap-2">
                <Calendar className="h-4 w-4 text-[#34C759]" />
                Cumulative Direct Qty by Month
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart
                    data={(() => {
                      let cum2024 = 0, cum2025 = 0, cum2026 = 0
                      return monthlyQtyYoY.data.map(d => {
                        if (d.y2024 !== null) cum2024 += d.y2024
                        if (d.y2025 !== null) cum2025 += d.y2025
                        if (d.y2026 !== null) cum2026 += d.y2026
                        return { month_label: d.month_label, y2024: d.y2024 !== null ? cum2024 : null, y2025: d.y2025 !== null ? cum2025 : null, y2026: d.y2026 !== null ? cum2026 : null }
                      })
                    })()}
                    margin={{ top: 15, right: 20, left: 10, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                    <XAxis dataKey="month_label" tick={{ fontSize: 11, fill: '#ffffff60' }} tickLine={false} axisLine={{ stroke: '#ffffff15' }} />
                    <YAxis tick={{ fontSize: 10, fill: '#ffffff60' }} tickLine={false} axisLine={false} tickFormatter={v => v.toLocaleString()} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#2D2D2F', border: '1px solid #3D3D3F', borderRadius: '8px', fontSize: 12, color: '#fff' }}
                      labelStyle={{ color: '#fff', fontWeight: 600 }}
                      formatter={(value, name) => { if (value === null) return ['-', String(name)]; const y = name === 'y2024' ? '2024' : name === 'y2025' ? '2025' : '2026'; return [Number(value).toLocaleString(), y] }}
                    />
                    <Legend wrapperStyle={{ fontSize: 11, color: '#ffffffcc' }} formatter={(v: string) => v === 'y2024' ? '2024' : v === 'y2025' ? '2025' : '2026'} />
                    <Line type="monotone" dataKey="y2024" stroke="#8E8E93" strokeWidth={2} dot={{ fill: '#8E8E93', r: 3 }} connectNulls name="y2024" />
                    <Line type="monotone" dataKey="y2025" stroke="#0099FF" strokeWidth={2} dot={{ fill: '#0099FF', r: 3 }} connectNulls name="y2025" />
                    <Line type="monotone" dataKey="y2026" stroke="#34C759" strokeWidth={3} dot={{ fill: '#34C759', r: 4 }} connectNulls name="y2026" />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}

      </div>
    </div>
  )
}
