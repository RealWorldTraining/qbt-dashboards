"use client"

import { useEffect, useState, useCallback } from "react"
import { RefreshCw, Loader2 } from "lucide-react"

// Sales metrics types
interface PeriodMetrics {
  label: string
  date_range: string
  direct_qty: number
  direct_revenue: number
  py_qty: number
  py_revenue: number
  qty_change_pct: number
  revenue_change_pct: number
}

interface MetricsResponse {
  yesterday: PeriodMetrics
  today: PeriodMetrics
  this_week: PeriodMetrics
  this_month: PeriodMetrics
}

interface EODForecast {
  predicted_sales: number
  predicted_lower: number
  predicted_upper: number
  current_sales: number
}

interface EOMForecast {
  predicted_sales: number
  current_month_sales: number
  days_remaining: number
  month_name: string
}

interface WeekForecast {
  predicted_sales: number
  current_week_sales: number
  week_start_date: string
  week_end_date: string
  daily_breakdown: Array<{
    day: string
    predicted: number
    actual: number | null
  }>
}

interface HourlyPeriod {
  period_label: string
  hourly_sales: Record<string, number | null>
  end_of_day: number | null
}

interface HourlyComparison {
  periods: HourlyPeriod[]
}

interface MonthWeeklyBreakdown {
  week_number: number
  week_label: string
  forecast: number
  actual: number | null
  variance: number | null
  variance_pct: number | null
}

interface MonthWeekly {
  month_name: string
  weeks: MonthWeeklyBreakdown[]
  total_forecast: number
  total_actual: number
  total_variance: number
  total_variance_pct: number
}

const PROPHET_API_URL = "https://qbtraining-site-production.up.railway.app"

export default function DataDashboard() {
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())
  const [currentTime, setCurrentTime] = useState<Date>(new Date())
  const [refreshing, setRefreshing] = useState(false)
  const [metrics, setMetrics] = useState<MetricsResponse | null>(null)
  const [eodForecast, setEodForecast] = useState<EODForecast | null>(null)
  const [eomForecast, setEomForecast] = useState<EOMForecast | null>(null)
  const [weekForecast, setWeekForecast] = useState<WeekForecast | null>(null)
  const [hourlyComparison, setHourlyComparison] = useState<HourlyComparison | null>(null)
  const [monthWeekly, setMonthWeekly] = useState<MonthWeekly | null>(null)

  const fetchData = useCallback(async () => {
    setRefreshing(true)
    try {
      const [metricsRes, eodRes, eomRes, weekRes, hourlyRes, monthWeeklyRes] = await Promise.allSettled([
        fetch(`${PROPHET_API_URL}/metrics`),
        fetch(`${PROPHET_API_URL}/eod-forecast`),
        fetch(`${PROPHET_API_URL}/eom-forecast`),
        fetch(`${PROPHET_API_URL}/this-week-forecast`),
        fetch(`${PROPHET_API_URL}/hourly-comparison`),
        fetch(`${PROPHET_API_URL}/month-weekly`),
      ])

      if (metricsRes.status === 'fulfilled' && metricsRes.value.ok) {
        setMetrics(await metricsRes.value.json())
      }
      if (eodRes.status === 'fulfilled' && eodRes.value.ok) {
        setEodForecast(await eodRes.value.json())
      }
      if (eomRes.status === 'fulfilled' && eomRes.value.ok) {
        setEomForecast(await eomRes.value.json())
      }
      if (weekRes.status === 'fulfilled' && weekRes.value.ok) {
        setWeekForecast(await weekRes.value.json())
      }
      if (hourlyRes.status === 'fulfilled' && hourlyRes.value.ok) {
        setHourlyComparison(await hourlyRes.value.json())
      }
      if (monthWeeklyRes.status === 'fulfilled' && monthWeeklyRes.value.ok) {
        setMonthWeekly(await monthWeeklyRes.value.json())
      }
      setLastUpdated(new Date())
    } catch (error) {
      console.error('Failed to fetch:', error)
    } finally {
      setLoading(false)
      setTimeout(() => setRefreshing(false), 500)
    }
  }, [])

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 30000)
    return () => clearInterval(interval)
  }, [fetchData])

  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(interval)
  }, [])

  // Get current hour key for hourly comparison
  const getCurrentHourKey = () => {
    const hour = currentTime.getHours()
    if (hour < 8) return "8am"
    if (hour >= 23) return "11pm"
    if (hour < 12) return `${hour}am`
    if (hour === 12) return "12pm"
    return `${hour - 12}pm`
  }

  // Get sales at current hour for a period
  const getSalesAtHour = (periodLabel: string) => {
    if (!hourlyComparison) return null
    const hourKey = getCurrentHourKey()
    const period = hourlyComparison.periods.find(p => p.period_label === periodLabel)
    return period?.hourly_sales[hourKey] ?? null
  }

  return (
    <div className="h-screen w-screen bg-[#09090b] flex flex-col overflow-hidden">
      {/* Header - minimal */}
      <header className="flex items-center justify-between px-6 py-3 bg-zinc-900/80 border-b border-zinc-800">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold text-white tracking-tight">Mission Control</h1>
          <div className="flex items-center gap-2 text-zinc-400 text-sm">
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Updated {lastUpdated.toLocaleTimeString()}</span>
          </div>
        </div>
        <div className="text-right">
          <div className="text-4xl font-light text-white tabular-nums">
            {currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}
          </div>
          <div className="text-zinc-400 text-sm">
            {currentTime.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
          </div>
        </div>
      </header>

      {/* Main Grid - 3 rows: all forecast boxes */}
      <main className="flex-1 p-4 grid grid-cols-2 gap-4" style={{ gridTemplateRows: '0.9fr 1.1fr 1fr' }}>
        {loading ? (
          <div className="col-span-2 row-span-4 flex items-center justify-center">
            <Loader2 className="h-16 w-16 animate-spin text-zinc-600" />
          </div>
        ) : metrics ? (
          <>
            {/* Row 1: Today (full width) */}
            <TodayForecastBox
              currentTime={currentTime}
              todaySales={metrics.today.direct_qty}
              lwSales={getSalesAtHour("1 Week Ago")}
              twoWASales={getSalesAtHour("2 Weeks Ago")}
              threeWASales={getSalesAtHour("3 Weeks Ago")}
              eodPrediction={eodForecast?.predicted_sales ?? null}
            />

            {/* Row 2: Week Forecast (full width) */}
            <WeekForecastBox forecast={weekForecast} fullWidth />

            {/* Row 3: January Forecast (full width) */}
            <MonthForecastBox forecast={eomForecast} monthWeekly={monthWeekly} fullWidth />
          </>
        ) : (
          <div className="col-span-2 row-span-4 flex items-center justify-center text-zinc-500">
            No data available
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="px-6 py-2 bg-zinc-900/80 border-t border-zinc-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
          <span className="text-zinc-400 text-sm">Live</span>
        </div>
        <span className="text-zinc-600 text-sm">QuickBooks Training • Mission Control</span>
      </footer>
    </div>
  )
}

// Sales metric box component
function SalesBox({ 
  title, 
  qty, 
  pyQty, 
  changePct, 
  color 
}: { 
  title: string
  qty: number
  pyQty: number
  changePct: number
  color: "emerald" | "blue" | "purple" | "amber"
}) {
  const colorMap = {
    emerald: "from-emerald-600 to-emerald-500",
    blue: "from-blue-600 to-blue-500",
    purple: "from-purple-600 to-purple-500",
    amber: "from-amber-600 to-amber-500"
  }

  const diff = qty - pyQty

  return (
    <div className="bg-zinc-900 rounded-2xl border border-zinc-800 flex flex-col overflow-hidden">
      <div className={`h-1.5 bg-gradient-to-r ${colorMap[color]}`} />
      <div className="flex-1 flex flex-col items-center justify-center p-6">
        <div className="text-zinc-400 text-3xl font-medium mb-3">{title}</div>
        <div className="text-white text-[10rem] font-bold tabular-nums leading-none">
          {new Intl.NumberFormat("en-US").format(qty)}
        </div>
        <div className="mt-6 text-center">
          <div className="text-zinc-500 text-2xl">
            Prior Year: {new Intl.NumberFormat("en-US").format(pyQty)}
          </div>
          <div className={`text-4xl font-semibold mt-2 ${changePct >= 0 ? "text-emerald-400" : "text-red-400"}`}>
            {changePct >= 0 ? "+" : ""}{changePct}% ({diff >= 0 ? "+" : ""}{diff})
          </div>
        </div>
      </div>
    </div>
  )
}

// Today Forecast Box (full width, matches Week/Month layout)
function TodayForecastBox({
  currentTime,
  todaySales,
  lwSales,
  twoWASales,
  threeWASales,
  eodPrediction
}: {
  currentTime: Date
  todaySales: number
  lwSales: number | null
  twoWASales: number | null
  threeWASales: number | null
  eodPrediction: number | null
}) {
  const timeStr = currentTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }).toLowerCase()
  
  // Calculate expected at current time based on EOD forecast
  // Business hours: 8am-11pm (15 hours)
  const hour = currentTime.getHours()
  const minute = currentTime.getMinutes()
  const startHour = 8
  const endHour = 23
  const totalHours = endHour - startHour // 15 hours
  const hoursElapsed = Math.max(0, Math.min(totalHours, (hour - startHour) + (minute / 60)))
  const expectedAtTime = eodPrediction ? Math.round(eodPrediction * (hoursElapsed / totalHours)) : null
  
  // Calculate variance
  const variance = expectedAtTime ? todaySales - expectedAtTime : null
  const variancePct = expectedAtTime && expectedAtTime > 0 ? Math.round((variance! / expectedAtTime) * 100) : null

  return (
    <div className="col-span-2 bg-zinc-900 rounded-2xl border border-zinc-800 flex flex-col overflow-hidden">
      <div className="h-1.5 bg-gradient-to-r from-emerald-600 to-emerald-500" />
      <div className="flex-1 flex flex-col items-center justify-center p-4">
        {/* Title */}
        <div className="text-zinc-400 text-[2rem] font-medium uppercase tracking-wider">Today Forecast</div>
        <div className="text-zinc-500 text-[1.625rem]">@ {timeStr}</div>
        
        {/* Main stats - match Week/Month layout */}
        <div className="flex gap-16 text-xl mt-4 mb-4">
          <div className="text-center">
            <div className="text-[7rem] font-bold text-white leading-none">{todaySales}</div>
            <div className="text-zinc-500 uppercase text-2xl mt-2">Actual</div>
          </div>
          <div className="text-center">
            <div className="text-[7rem] font-bold text-cyan-400 leading-none">{expectedAtTime ?? '—'}</div>
            <div className="text-zinc-500 uppercase text-2xl mt-2">Expected</div>
          </div>
          <div className="text-center">
            <div className={`text-[7rem] font-bold leading-none ${variancePct !== null ? (variancePct >= 0 ? "text-emerald-400" : "text-red-400") : "text-zinc-600"}`}>
              {variancePct !== null ? `${variancePct >= 0 ? "+" : ""}${variancePct}%` : '—'}
            </div>
            <div className="text-zinc-500 uppercase text-2xl mt-2">Variance</div>
          </div>
        </div>

        {/* Comparison table */}
        <div className="w-full max-w-3xl">
          <table className="w-full text-center text-3xl">
            <thead>
              <tr className="text-zinc-500">
                <th className="font-normal px-4 pb-2">Today</th>
                <th className="font-normal px-4 pb-2">LW</th>
                <th className="font-normal px-4 pb-2">2WA</th>
                <th className="font-normal px-4 pb-2">3WA</th>
                <th className="font-semibold px-4 pb-2 border-l border-zinc-700">EOD Fcst</th>
              </tr>
            </thead>
            <tbody>
              <tr className="text-white">
                <td className="px-4 py-1 font-semibold">{todaySales}</td>
                <td className="px-4 py-1 font-semibold">{lwSales ?? '—'}</td>
                <td className="px-4 py-1 font-semibold">{twoWASales ?? '—'}</td>
                <td className="px-4 py-1 font-semibold">{threeWASales ?? '—'}</td>
                <td className="px-4 py-1 border-l border-zinc-700 text-cyan-400 font-semibold">{eodPrediction ?? '—'}</td>
              </tr>
            </tbody>
          </table>
          <div className="flex justify-center mt-4 text-xl px-4">
            <div className="flex items-center gap-6">
              <span className="flex items-center gap-2 text-white">
                <span className="w-4 h-4 bg-white rounded" /> @ {timeStr}
              </span>
              <span className="flex items-center gap-2 text-cyan-400">
                <span className="w-4 h-4 bg-cyan-400 rounded" /> EOD Forecast
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Today @ Time Box (legacy - can be removed)
function TodayAtTimeBox({
  currentTime,
  todaySales,
  lwSales,
  twoWASales,
  threeWASales
}: {
  currentTime: Date
  todaySales: number | null
  lwSales: number | null
  twoWASales: number | null
  threeWASales: number | null
}) {
  const timeStr = currentTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }).toLowerCase()
  
  return (
    <div className="bg-zinc-900 rounded-2xl border border-zinc-800 flex flex-col overflow-hidden">
      <div className="h-1.5 bg-gradient-to-r from-blue-600 to-blue-500" />
      <div className="flex-1 flex flex-col items-center justify-center p-6">
        <div className="text-zinc-400 text-2xl font-medium uppercase tracking-wider">Today @</div>
        <div className="text-white text-7xl font-bold mt-2">{timeStr}</div>
        <div className="mt-8 grid grid-cols-2 gap-x-12 gap-y-4 text-3xl">
          <div className="flex justify-between gap-8">
            <span className="text-zinc-400">Today</span>
            <span className="text-white font-bold">{todaySales ?? '—'}</span>
          </div>
          <div className="flex justify-between gap-8">
            <span className="text-zinc-400">LW</span>
            <span className="text-white font-bold">{lwSales ?? '—'}</span>
          </div>
          <div className="flex justify-between gap-8">
            <span className="text-zinc-400">2WA</span>
            <span className="text-white font-bold">{twoWASales ?? '—'}</span>
          </div>
          <div className="flex justify-between gap-8">
            <span className="text-zinc-400">3WA</span>
            <span className="text-white font-bold">{threeWASales ?? '—'}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

// EOD Forecast Box
function EODForecastBox({ 
  forecast,
  hourlyComparison 
}: { 
  forecast: EODForecast | null
  hourlyComparison: HourlyComparison | null
}) {
  if (!forecast) return <PlaceholderBox />
  
  // Get last week and 2 weeks ago EOD totals
  const lwEOD = hourlyComparison?.periods.find(p => p.period_label === "1 Week Ago")?.end_of_day ?? 0
  const twoWEOD = hourlyComparison?.periods.find(p => p.period_label === "2 Weeks Ago")?.end_of_day ?? 0
  
  const vsLW = forecast.predicted_sales - lwEOD
  const vs2W = forecast.predicted_sales - twoWEOD

  return (
    <div className="bg-zinc-900 rounded-2xl border border-zinc-800 flex flex-col overflow-hidden">
      <div className="h-1.5 bg-gradient-to-r from-cyan-600 to-cyan-500" />
      <div className="flex-1 flex flex-col items-center justify-center p-6">
        <div className="text-zinc-400 text-2xl font-medium uppercase tracking-wider">EOD Forecast</div>
        <div className="text-white text-8xl font-bold mt-2">{forecast.predicted_sales}</div>
        <div className="text-zinc-500 text-2xl mt-2">{forecast.predicted_lower}-{forecast.predicted_upper}</div>
        <div className="mt-6 flex gap-12 text-2xl">
          <div className="text-center">
            <div className="text-zinc-500">VS LW</div>
            <div className={`text-3xl font-bold ${vsLW >= 0 ? "text-emerald-400" : "text-red-400"}`}>
              {vsLW >= 0 ? "+" : ""}{vsLW}
            </div>
          </div>
          <div className="text-center">
            <div className="text-zinc-500">VS 2W</div>
            <div className={`text-3xl font-bold ${vs2W >= 0 ? "text-emerald-400" : "text-red-400"}`}>
              {vs2W >= 0 ? "+" : ""}{vs2W}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Month Forecast Box
function MonthForecastBox({ forecast, monthWeekly, fullWidth = false }: { forecast: EOMForecast | null, monthWeekly?: MonthWeekly | null, fullWidth?: boolean }) {
  if (!forecast) return <PlaceholderBox />
  
  // Calculate expected MTD based on progress
  const daysInMonth = forecast.days_remaining + (forecast.current_month_sales > 0 ? 
    Math.round((forecast.current_month_sales / forecast.predicted_sales) * (forecast.days_remaining + 29)) : 29)
  const daysCompleted = daysInMonth - forecast.days_remaining
  const mtdExpected = Math.round(forecast.predicted_sales * (daysCompleted / daysInMonth))
  const variance = forecast.current_month_sales - mtdExpected
  const variancePct = mtdExpected > 0 ? Math.round((variance / mtdExpected) * 100) : 0

  return (
    <div className={`bg-zinc-900 rounded-2xl border border-zinc-800 flex flex-col overflow-hidden ${fullWidth ? 'col-span-2' : ''}`}>
      <div className="h-1.5 bg-gradient-to-r from-violet-600 to-violet-500" />
      <div className="flex-1 flex flex-col items-center justify-center p-4">
        {/* Title + subtitle - match Week Forecast exactly */}
        <div className={`text-zinc-400 font-medium uppercase tracking-wider ${fullWidth ? 'text-[2rem]' : 'text-xl'}`}>{forecast.month_name} Forecast</div>
        <div className={`text-zinc-500 ${fullWidth ? 'text-[1.625rem]' : 'text-lg'}`}>{forecast.days_remaining}d left</div>
        
        {/* MTD stats - match Week Forecast sizing */}
        <div className={`flex ${fullWidth ? 'gap-16' : 'gap-6'} ${fullWidth ? 'text-xl' : 'text-base'} mt-4 mb-4`}>
          <div className="text-center">
            <div className={`font-bold text-white leading-none ${fullWidth ? 'text-[7rem]' : 'text-2xl'}`}>{new Intl.NumberFormat("en-US").format(forecast.current_month_sales)}</div>
            <div className={`text-zinc-500 uppercase ${fullWidth ? 'text-2xl mt-2' : 'text-sm'}`}>MTD Actual</div>
          </div>
          <div className="text-center">
            <div className={`font-bold text-cyan-400 leading-none ${fullWidth ? 'text-[7rem]' : 'text-2xl'}`}>{new Intl.NumberFormat("en-US").format(mtdExpected)}</div>
            <div className={`text-zinc-500 uppercase ${fullWidth ? 'text-2xl mt-2' : 'text-sm'}`}>MTD Expected</div>
          </div>
          <div className="text-center">
            <div className={`font-bold leading-none ${variancePct >= 0 ? "text-emerald-400" : "text-red-400"} ${fullWidth ? 'text-[7rem]' : 'text-2xl'}`}>
              {variancePct >= 0 ? "+" : ""}{variancePct}%
            </div>
            <div className={`text-zinc-500 uppercase ${fullWidth ? 'text-2xl mt-2' : 'text-sm'}`}>Variance</div>
          </div>
        </div>

        {/* Weekly breakdown table */}
        {fullWidth && monthWeekly && monthWeekly.weeks.length > 0 && (
          <div className="w-full max-w-4xl">
            <table className="w-full text-center text-3xl">
              <thead>
                <tr className="text-zinc-500">
                  {monthWeekly.weeks.map(w => (
                    <th key={w.week_number} className="font-normal px-4 pb-2">{w.week_label}</th>
                  ))}
                  <th className="font-semibold px-4 pb-2 border-l border-zinc-700">Total</th>
                </tr>
              </thead>
              <tbody>
                <tr className="text-blue-400">
                  {monthWeekly.weeks.map(w => (
                    <td key={w.week_number} className="px-4 py-1">{w.forecast}</td>
                  ))}
                  <td className="px-4 py-1 border-l border-zinc-700">{monthWeekly.total_forecast}</td>
                </tr>
                <tr className="text-white">
                  {monthWeekly.weeks.map(w => (
                    <td key={w.week_number} className="px-4 py-1 font-semibold">{w.actual ?? '—'}</td>
                  ))}
                  <td className="px-4 py-1 border-l border-zinc-700 font-semibold">{monthWeekly.total_actual}</td>
                </tr>
                <tr>
                  {monthWeekly.weeks.map(w => {
                    if (w.variance === null) return <td key={w.week_number} className="px-4 py-1 text-zinc-600">—</td>
                    return (
                      <td key={w.week_number} className={`px-4 py-1 ${w.variance >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                        {w.variance >= 0 ? "+" : ""}{w.variance}
                      </td>
                    )
                  })}
                  <td className={`px-4 py-1 border-l border-zinc-700 font-semibold ${monthWeekly.total_variance >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                    {monthWeekly.total_variance >= 0 ? "+" : ""}{monthWeekly.total_variance}
                  </td>
                </tr>
              </tbody>
            </table>
            <div className="flex justify-center mt-4 text-xl px-4">
              <div className="flex items-center gap-6">
                <span className="flex items-center gap-2 text-blue-400">
                  <span className="w-4 h-4 bg-blue-400 rounded" /> Forecast
                </span>
                <span className="flex items-center gap-2 text-white">
                  <span className="w-4 h-4 bg-white rounded" /> Actual
                </span>
                <span className="flex items-center gap-2 text-emerald-400">
                  <span className="w-4 h-4 bg-emerald-400 rounded" /> Variance
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// Week Forecast Box
function WeekForecastBox({ forecast, fullWidth = false }: { forecast: WeekForecast | null, fullWidth?: boolean }) {
  if (!forecast) return <PlaceholderBox />
  
  // Calculate WTD expected
  const completedDays = forecast.daily_breakdown.filter(d => d.actual !== null).length
  const wtdExpected = forecast.daily_breakdown
    .slice(0, completedDays)
    .reduce((sum, d) => sum + d.predicted, 0)
  const variance = forecast.current_week_sales - wtdExpected
  const variancePct = wtdExpected > 0 ? Math.round((variance / wtdExpected) * 100) : 0
  const totalVariance = forecast.current_week_sales - forecast.daily_breakdown
    .filter(d => d.actual !== null)
    .reduce((sum, d) => sum + d.predicted, 0)

  if (fullWidth) {
    return (
      <div className="col-span-2 bg-zinc-900 rounded-2xl border border-zinc-800 flex flex-col overflow-hidden">
        <div className="h-1.5 bg-gradient-to-r from-pink-600 to-pink-500" />
        <div className="flex-1 flex flex-col items-center justify-center p-4">
          {/* Title + date at top */}
          <div className="text-zinc-400 text-[2rem] font-medium uppercase tracking-wider">Week Forecast</div>
          <div className="text-zinc-500 text-[1.625rem]">{forecast.week_start_date} - {forecast.week_end_date}</div>
          
          {/* WTD stats - moved up, no big number */}
          <div className="flex gap-16 text-xl mt-4 mb-4">
            <div className="text-center">
              <div className="text-[7rem] font-bold text-white leading-none">{forecast.current_week_sales}</div>
              <div className="text-zinc-500 uppercase text-2xl mt-2">WTD Actual</div>
            </div>
            <div className="text-center">
              <div className="text-[7rem] font-bold text-cyan-400 leading-none">{wtdExpected}</div>
              <div className="text-zinc-500 uppercase text-2xl mt-2">WTD Expected</div>
            </div>
            <div className="text-center">
              <div className={`text-[7rem] font-bold leading-none ${variancePct >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                {variancePct >= 0 ? "+" : ""}{variancePct}%
              </div>
              <div className="text-zinc-500 uppercase text-2xl mt-2">Variance</div>
            </div>
          </div>

          {/* Daily breakdown at bottom */}
          <div className="w-full max-w-4xl">
            <table className="w-full text-center text-3xl">
              <thead>
                <tr className="text-zinc-500">
                  {forecast.daily_breakdown.map(d => (
                    <th key={d.day} className="font-normal px-4 pb-2">{d.day}</th>
                  ))}
                  <th className="font-semibold px-4 pb-2 border-l border-zinc-700">Total</th>
                </tr>
              </thead>
              <tbody>
                <tr className="text-blue-400">
                  {forecast.daily_breakdown.map(d => (
                    <td key={d.day} className="px-4 py-1">{d.predicted}</td>
                  ))}
                  <td className="px-4 py-1 border-l border-zinc-700">{forecast.predicted_sales}</td>
                </tr>
                <tr className="text-white">
                  {forecast.daily_breakdown.map(d => (
                    <td key={d.day} className="px-4 py-1 font-semibold">{d.actual ?? '—'}</td>
                  ))}
                  <td className="px-4 py-1 border-l border-zinc-700 font-semibold">{forecast.current_week_sales}</td>
                </tr>
                <tr>
                  {forecast.daily_breakdown.map(d => {
                    if (d.actual === null) return <td key={d.day} className="px-4 py-1 text-zinc-600">—</td>
                    const dayVar = d.actual - d.predicted
                    return (
                      <td key={d.day} className={`px-4 py-1 ${dayVar >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                        {dayVar >= 0 ? "+" : ""}{dayVar}
                      </td>
                    )
                  })}
                  <td className={`px-4 py-1 border-l border-zinc-700 font-semibold ${totalVariance >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                    {totalVariance >= 0 ? "+" : ""}{totalVariance}
                  </td>
                </tr>
              </tbody>
            </table>
            <div className="flex justify-center mt-4 text-xl px-4">
              <div className="flex items-center gap-6">
                <span className="flex items-center gap-2 text-blue-400">
                  <span className="w-4 h-4 bg-blue-400 rounded" /> Predicted
                </span>
                <span className="flex items-center gap-2 text-white">
                  <span className="w-4 h-4 bg-white rounded" /> Actual
                </span>
                <span className="flex items-center gap-2 text-emerald-400">
                  <span className="w-4 h-4 bg-emerald-400 rounded" /> Variance
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Non-fullWidth version (compact)
  return (
    <div className="bg-zinc-900 rounded-2xl border border-zinc-800 flex flex-col overflow-hidden">
      <div className="h-1.5 bg-gradient-to-r from-pink-600 to-pink-500" />
      <div className="flex-1 flex flex-col items-center justify-center p-4">
        <div className="text-zinc-400 text-xl font-medium uppercase tracking-wider">Week Forecast</div>
        <div className="text-zinc-500 text-lg">{forecast.week_start_date} - {forecast.week_end_date}</div>
        <div className="text-white text-7xl font-bold mt-1">{forecast.predicted_sales}</div>
        
        <div className="mt-4 flex gap-6 text-lg">
          <div className="text-center">
            <div className="text-3xl font-bold text-white">{forecast.current_week_sales}</div>
            <div className="text-zinc-500 uppercase text-xs">WTD Actual</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-white">{wtdExpected}</div>
            <div className="text-zinc-500 uppercase text-xs">WTD Expected</div>
          </div>
          <div className="text-center">
            <div className={`text-3xl font-bold ${variancePct >= 0 ? "text-emerald-400" : "text-red-400"}`}>
              {variancePct >= 0 ? "+" : ""}{variancePct}%
            </div>
            <div className="text-zinc-500 uppercase text-xs">Variance</div>
          </div>
        </div>

        <div className="mt-4 w-full">
          <table className="w-full text-center text-sm">
            <thead>
              <tr className="text-zinc-500">
                {forecast.daily_breakdown.map(d => (
                  <th key={d.day} className="font-normal px-1">{d.day}</th>
                ))}
                <th className="font-semibold px-1 border-l border-zinc-700">Total</th>
              </tr>
            </thead>
            <tbody>
              <tr className="text-blue-400">
                {forecast.daily_breakdown.map(d => (
                  <td key={d.day} className="px-1">{d.predicted}</td>
                ))}
                <td className="px-1 border-l border-zinc-700">{forecast.predicted_sales}</td>
              </tr>
              <tr className={totalVariance >= 0 ? "text-emerald-400" : "text-red-400"}>
                {forecast.daily_breakdown.map(d => (
                  <td key={d.day} className="px-1 font-semibold">{d.actual ?? '—'}</td>
                ))}
                <td className="px-1 border-l border-zinc-700 font-semibold">{forecast.current_week_sales}</td>
              </tr>
            </tbody>
          </table>
          <div className="flex justify-between mt-2 text-xs px-2">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1 text-blue-400">
                <span className="w-2 h-2 bg-blue-400 rounded" /> Predicted
              </span>
              <span className="flex items-center gap-1 text-white">
                <span className="w-2 h-2 bg-white rounded" /> Actual
              </span>
            </div>
            <span className={`font-semibold ${totalVariance >= 0 ? "text-emerald-400" : "text-red-400"}`}>
              {totalVariance >= 0 ? "+" : ""}{totalVariance} variance
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

// Placeholder box for future content
function PlaceholderBox() {
  return (
    <div className="bg-zinc-900/50 rounded-2xl border border-zinc-800/50 border-dashed flex items-center justify-center">
      <span className="text-zinc-700 text-lg">—</span>
    </div>
  )
}
