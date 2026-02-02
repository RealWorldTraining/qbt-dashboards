"use client"

import { useEffect, useState } from "react"
import { RefreshCw } from "lucide-react"

const RAILWAY_API_URL = "https://qbtraining-site-production.up.railway.app"

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

interface SalesMetrics {
  today: {
    total: number
    lastWeek: number
    twoWeeksAgo: number
    threeWeeksAgo: number
    timestamp: string
  }
  yesterday: {
    total: number
    priorYear: number
    change: number
  }
  thisWeek: {
    total: number
    priorYear: number
    change: number
  }
  mtd: {
    total: number
    priorYear: number
    change: number
  }
}

interface HourlyData {
  today: { [hour: string]: number | null }
  lastWeek: { [hour: string]: number | null }
  twoWeeks: { [hour: string]: number | null }
  threeWeeks: { [hour: string]: number | null }
  todayEOD: number | null
  lastWeekEOD: number | null
  twoWeeksEOD: number | null
  threeWeeksEOD: number | null
}

export default function PhoneDashboard() {
  const [metrics, setMetrics] = useState<SalesMetrics | null>(null)
  const [hourlyData, setHourlyData] = useState<HourlyData | null>(null)
  const [loading, setLoading] = useState(true)
  const [lastRefresh, setLastRefresh] = useState(new Date())

  async function fetchData() {
    setLoading(true)
    try {
      const [metricsResponse, hourlyResponse] = await Promise.all([
        fetch(`${RAILWAY_API_URL}/metrics`),
        fetch(`${RAILWAY_API_URL}/hourly-comparison`)
      ])
      
      if (!metricsResponse.ok || !hourlyResponse.ok) {
        throw new Error('Failed to fetch data')
      }
      
      const metricsData: MetricsResponse = await metricsResponse.json()
      const hourlyData = await hourlyResponse.json()
      
      // Get current timestamp and hour
      const now = new Date()
      const timestamp = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
      const currentHour = now.getHours()
      
      // Format hour for lookup (e.g., "4pm", "12pm")
      let hourKey = ''
      if (currentHour === 0) hourKey = '12am'
      else if (currentHour < 12) hourKey = `${currentHour}am`
      else if (currentHour === 12) hourKey = '12pm'
      else hourKey = `${currentHour - 12}pm`
      
      // Find "at this time" sales for previous weeks
      const periods = hourlyData.periods || []
      const todayPeriod = periods.find((p: any) => p.period_label === 'Today')
      const lastWeekPeriod = periods.find((p: any) => p.period_label === '1 Week Ago')
      const twoWeeksPeriod = periods.find((p: any) => p.period_label === '2 Weeks Ago')
      const threeWeeksPeriod = periods.find((p: any) => p.period_label === '3 Weeks Ago')
      
      const lastWeekAtTime = lastWeekPeriod?.hourly_sales?.[hourKey] || 0
      const twoWeeksAtTime = twoWeeksPeriod?.hourly_sales?.[hourKey] || 0
      const threeWeeksAtTime = threeWeeksPeriod?.hourly_sales?.[hourKey] || 0
      
      // Extract hourly data for table
      setHourlyData({
        today: todayPeriod?.hourly_sales || {},
        lastWeek: lastWeekPeriod?.hourly_sales || {},
        twoWeeks: twoWeeksPeriod?.hourly_sales || {},
        threeWeeks: threeWeeksPeriod?.hourly_sales || {},
        todayEOD: todayPeriod?.end_of_day || null,
        lastWeekEOD: lastWeekPeriod?.end_of_day || null,
        twoWeeksEOD: twoWeeksPeriod?.end_of_day || null,
        threeWeeksEOD: threeWeeksPeriod?.end_of_day || null,
      })
      
      // Transform Railway API data into phone metrics format
      setMetrics({
        today: {
          total: metricsData.today.direct_qty,
          lastWeek: lastWeekAtTime,
          twoWeeksAgo: twoWeeksAtTime,
          threeWeeksAgo: threeWeeksAtTime,
          timestamp
        },
        yesterday: {
          total: metricsData.yesterday.direct_qty,
          priorYear: metricsData.yesterday.py_qty,
          change: metricsData.yesterday.qty_change_pct
        },
        thisWeek: {
          total: metricsData.this_week.direct_qty,
          priorYear: metricsData.this_week.py_qty,
          change: metricsData.this_week.qty_change_pct
        },
        mtd: {
          total: metricsData.this_month.direct_qty,
          priorYear: metricsData.this_month.py_qty,
          change: metricsData.this_month.qty_change_pct
        }
      })
      setLastRefresh(new Date())
    } catch (error) {
      console.error("Error fetching data:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 5 * 60 * 1000) // Refresh every 5 minutes
    return () => clearInterval(interval)
  }, [])

  if (loading || !metrics) {
    return (
      <div className="min-h-screen bg-[#f5f5f7] flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f5f5f7] p-4 pb-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 mt-2">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-600 mt-1">
            {new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit' })}
          </p>
        </div>
        <button 
          onClick={fetchData} 
          disabled={loading}
          className="p-2 rounded-full hover:bg-gray-200 transition-colors"
        >
          <RefreshCw className={`h-5 w-5 text-gray-600 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Metrics Grid - 2x2 */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        {/* Today Card */}
        <div className="bg-[#1c1c1e] rounded-2xl p-5 flex flex-col items-center text-center">
          <div className="text-gray-400 text-sm mb-2">Today @ {metrics.today.timestamp}</div>
          <div className="text-white text-6xl font-bold mb-4">{metrics.today.total}</div>
          <div className="space-y-1.5">
            <div className="text-sm text-center">
              <span className="text-gray-400">1WA</span>
              <span className="text-white font-medium ml-2">{metrics.today.lastWeek}</span>
            </div>
            <div className="text-sm text-center">
              <span className="text-gray-400">2WA</span>
              <span className="text-white font-medium ml-2">{metrics.today.twoWeeksAgo}</span>
            </div>
            <div className="text-sm text-center">
              <span className="text-gray-400">3WA</span>
              <span className="text-white font-medium ml-2">{metrics.today.threeWeeksAgo}</span>
            </div>
          </div>
        </div>

        {/* Yesterday Card */}
        <div className="bg-[#1c1c1e] rounded-2xl p-5 flex flex-col items-center text-center">
          <div className="text-gray-400 text-sm mb-2">Yesterday</div>
          <div className="text-white text-6xl font-bold mb-4">{metrics.yesterday.total}</div>
          <div className="space-y-1.5">
            <div className="text-gray-400 text-sm">Prior Year: {metrics.yesterday.priorYear}</div>
            <div className={`text-lg font-semibold ${metrics.yesterday.change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {metrics.yesterday.change >= 0 ? '+' : ''}{metrics.yesterday.change.toFixed(1)}% 
              ({metrics.yesterday.change >= 0 ? '+' : ''}{metrics.yesterday.total - metrics.yesterday.priorYear})
            </div>
          </div>
        </div>

        {/* This Week Card */}
        <div className="bg-[#1c1c1e] rounded-2xl p-5 flex flex-col items-center text-center">
          <div className="text-gray-400 text-sm mb-2">This Week</div>
          <div className="text-white text-6xl font-bold mb-4">{metrics.thisWeek.total}</div>
          <div className="space-y-1.5">
            <div className="text-gray-400 text-sm">Prior Year: {metrics.thisWeek.priorYear}</div>
            <div className={`text-lg font-semibold ${metrics.thisWeek.change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {metrics.thisWeek.change >= 0 ? '+' : ''}{metrics.thisWeek.change.toFixed(1)}% 
              ({metrics.thisWeek.change >= 0 ? '+' : ''}{metrics.thisWeek.total - metrics.thisWeek.priorYear})
            </div>
          </div>
        </div>

        {/* MTD Card */}
        <div className="bg-[#1c1c1e] rounded-2xl p-5 flex flex-col items-center text-center">
          <div className="text-gray-400 text-sm mb-2">MTD</div>
          <div className="text-white text-6xl font-bold mb-4">{metrics.mtd.total}</div>
          <div className="space-y-1.5">
            <div className="text-gray-400 text-sm">Prior Year: {metrics.mtd.priorYear}</div>
            <div className={`text-lg font-semibold ${metrics.mtd.change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {metrics.mtd.change >= 0 ? '+' : ''}{metrics.mtd.change.toFixed(1)}% 
              ({metrics.mtd.change >= 0 ? '+' : ''}{metrics.mtd.total - metrics.mtd.priorYear})
            </div>
          </div>
        </div>
      </div>

      {/* Hourly Comparison - 2pm to EOD */}
      <div className="bg-[#1D1D1F] rounded-2xl p-4 mb-6 overflow-x-auto">
        <h3 className="text-white font-semibold text-sm mb-3">Hourly Sales (2pm-EOD)</h3>
        <div className="text-xs">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left py-2 px-2 text-white/60 font-medium">Period</th>
                <th className="text-center py-2 px-1 text-white/60 font-medium">2pm</th>
                <th className="text-center py-2 px-1 text-white/60 font-medium">3pm</th>
                <th className="text-center py-2 px-1 text-white/60 font-medium">4pm</th>
                <th className="text-center py-2 px-1 text-white/60 font-medium">5pm</th>
                <th className="text-center py-2 px-1 text-white/60 font-medium">6pm</th>
                <th className="text-center py-2 px-1 text-white/60 font-medium">7pm</th>
                <th className="text-center py-2 px-1 text-white font-medium bg-[#2D2D2F]">EOD</th>
              </tr>
            </thead>
            <tbody>
              {(() => {
                // Calculate max value for heatmap
                const hours = ['2pm', '3pm', '4pm', '5pm', '6pm', '7pm']
                const allValues = [
                  ...(hourlyData?.today ? hours.map(h => hourlyData.today[h]).filter((v): v is number => typeof v === 'number') : []),
                  ...(hourlyData?.lastWeek ? hours.map(h => hourlyData.lastWeek[h]).filter((v): v is number => typeof v === 'number') : []),
                  ...(hourlyData?.twoWeeks ? hours.map(h => hourlyData.twoWeeks[h]).filter((v): v is number => typeof v === 'number') : []),
                  ...(hourlyData?.threeWeeks ? hours.map(h => hourlyData.threeWeeks[h]).filter((v): v is number => typeof v === 'number') : []),
                ]
                const maxValue = Math.max(...allValues, 1)
                
                const getHeatmapClass = (value: number | string | null | undefined) => {
                  if (!value || value === '-' || typeof value !== 'number') return 'bg-[#1D1D1F]'
                  const intensity = Math.round((value / maxValue) * 100)
                  if (intensity > 80) return 'bg-blue-600'
                  if (intensity > 60) return 'bg-blue-500'
                  if (intensity > 40) return 'bg-blue-600/60'
                  if (intensity > 20) return 'bg-blue-600/40'
                  return 'bg-blue-600/20'
                }
                
                return (
                  <>
                    <tr className="border-b border-white/5">
                      <td className="py-2 px-2 font-medium text-white bg-[#1A3A52]">Today</td>
                      <td className={`text-center py-2 px-1 text-white font-semibold ${getHeatmapClass(hourlyData?.today['2pm'])}`}>{hourlyData?.today['2pm'] ?? '-'}</td>
                      <td className={`text-center py-2 px-1 text-white font-semibold ${getHeatmapClass(hourlyData?.today['3pm'])}`}>{hourlyData?.today['3pm'] ?? '-'}</td>
                      <td className={`text-center py-2 px-1 text-white font-semibold ${getHeatmapClass(hourlyData?.today['4pm'])}`}>{hourlyData?.today['4pm'] ?? '-'}</td>
                      <td className={`text-center py-2 px-1 text-white font-semibold ${getHeatmapClass(hourlyData?.today['5pm'])}`}>{hourlyData?.today['5pm'] ?? '-'}</td>
                      <td className={`text-center py-2 px-1 text-white font-semibold ${getHeatmapClass(hourlyData?.today['6pm'])}`}>{hourlyData?.today['6pm'] ?? '-'}</td>
                      <td className={`text-center py-2 px-1 text-white font-semibold ${getHeatmapClass(hourlyData?.today['7pm'])}`}>{hourlyData?.today['7pm'] ?? '-'}</td>
                      <td className="text-center py-2 px-1 font-semibold text-white bg-[#2D2D2F]">{hourlyData?.todayEOD ?? '-'}</td>
                    </tr>
                    <tr className="border-b border-white/5">
                      <td className="py-2 px-2 text-white/60 bg-[#1D1D1F]">1WA</td>
                      <td className={`text-center py-2 px-1 text-white font-semibold ${getHeatmapClass(hourlyData?.lastWeek['2pm'])}`}>{hourlyData?.lastWeek['2pm'] ?? '-'}</td>
                      <td className={`text-center py-2 px-1 text-white font-semibold ${getHeatmapClass(hourlyData?.lastWeek['3pm'])}`}>{hourlyData?.lastWeek['3pm'] ?? '-'}</td>
                      <td className={`text-center py-2 px-1 text-white font-semibold ${getHeatmapClass(hourlyData?.lastWeek['4pm'])}`}>{hourlyData?.lastWeek['4pm'] ?? '-'}</td>
                      <td className={`text-center py-2 px-1 text-white font-semibold ${getHeatmapClass(hourlyData?.lastWeek['5pm'])}`}>{hourlyData?.lastWeek['5pm'] ?? '-'}</td>
                      <td className={`text-center py-2 px-1 text-white font-semibold ${getHeatmapClass(hourlyData?.lastWeek['6pm'])}`}>{hourlyData?.lastWeek['6pm'] ?? '-'}</td>
                      <td className={`text-center py-2 px-1 text-white font-semibold ${getHeatmapClass(hourlyData?.lastWeek['7pm'])}`}>{hourlyData?.lastWeek['7pm'] ?? '-'}</td>
                      <td className="text-center py-2 px-1 font-semibold text-white bg-[#2D2D2F]">{hourlyData?.lastWeekEOD ?? '-'}</td>
                    </tr>
                    <tr className="border-b border-white/5">
                      <td className="py-2 px-2 text-white/60 bg-[#1D1D1F]">2WA</td>
                      <td className={`text-center py-2 px-1 text-white font-semibold ${getHeatmapClass(hourlyData?.twoWeeks['2pm'])}`}>{hourlyData?.twoWeeks['2pm'] ?? '-'}</td>
                      <td className={`text-center py-2 px-1 text-white font-semibold ${getHeatmapClass(hourlyData?.twoWeeks['3pm'])}`}>{hourlyData?.twoWeeks['3pm'] ?? '-'}</td>
                      <td className={`text-center py-2 px-1 text-white font-semibold ${getHeatmapClass(hourlyData?.twoWeeks['4pm'])}`}>{hourlyData?.twoWeeks['4pm'] ?? '-'}</td>
                      <td className={`text-center py-2 px-1 text-white font-semibold ${getHeatmapClass(hourlyData?.twoWeeks['5pm'])}`}>{hourlyData?.twoWeeks['5pm'] ?? '-'}</td>
                      <td className={`text-center py-2 px-1 text-white font-semibold ${getHeatmapClass(hourlyData?.twoWeeks['6pm'])}`}>{hourlyData?.twoWeeks['6pm'] ?? '-'}</td>
                      <td className={`text-center py-2 px-1 text-white font-semibold ${getHeatmapClass(hourlyData?.twoWeeks['7pm'])}`}>{hourlyData?.twoWeeks['7pm'] ?? '-'}</td>
                      <td className="text-center py-2 px-1 font-semibold text-white bg-[#2D2D2F]">{hourlyData?.twoWeeksEOD ?? '-'}</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-2 text-white/60 bg-[#1D1D1F]">3WA</td>
                      <td className={`text-center py-2 px-1 text-white font-semibold ${getHeatmapClass(hourlyData?.threeWeeks['2pm'])}`}>{hourlyData?.threeWeeks['2pm'] ?? '-'}</td>
                      <td className={`text-center py-2 px-1 text-white font-semibold ${getHeatmapClass(hourlyData?.threeWeeks['3pm'])}`}>{hourlyData?.threeWeeks['3pm'] ?? '-'}</td>
                      <td className={`text-center py-2 px-1 text-white font-semibold ${getHeatmapClass(hourlyData?.threeWeeks['4pm'])}`}>{hourlyData?.threeWeeks['4pm'] ?? '-'}</td>
                      <td className={`text-center py-2 px-1 text-white font-semibold ${getHeatmapClass(hourlyData?.threeWeeks['5pm'])}`}>{hourlyData?.threeWeeks['5pm'] ?? '-'}</td>
                      <td className={`text-center py-2 px-1 text-white font-semibold ${getHeatmapClass(hourlyData?.threeWeeks['6pm'])}`}>{hourlyData?.threeWeeks['6pm'] ?? '-'}</td>
                      <td className={`text-center py-2 px-1 text-white font-semibold ${getHeatmapClass(hourlyData?.threeWeeks['7pm'])}`}>{hourlyData?.threeWeeks['7pm'] ?? '-'}</td>
                      <td className="text-center py-2 px-1 font-semibold text-white bg-[#2D2D2F]">{hourlyData?.threeWeeksEOD ?? '-'}</td>
                    </tr>
                  </>
                )
              })()}
            </tbody>
          </table>
        </div>
      </div>

      {/* Last Updated Footer */}
      <div className="text-center text-xs text-gray-500 mt-4">
        Last updated: {lastRefresh.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
      </div>
    </div>
  )
}
