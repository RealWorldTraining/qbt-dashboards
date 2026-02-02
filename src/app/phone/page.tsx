"use client"

import { useEffect, useState } from "react"
import { RefreshCw } from "lucide-react"

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

export default function PhoneDashboard() {
  const [metrics, setMetrics] = useState<SalesMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [lastRefresh, setLastRefresh] = useState(new Date())

  async function fetchData() {
    setLoading(true)
    try {
      const response = await fetch("/api/recap")
      if (response.ok) {
        const data = await response.json()
        // Transform recap data into phone metrics
        // TODO: Calculate today, yesterday, this week, MTD from recap data
        // For now, using placeholder data
        setMetrics({
          today: {
            total: 22,
            lastWeek: 14,
            twoWeeksAgo: 28,
            threeWeeksAgo: 31,
            timestamp: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
          },
          yesterday: {
            total: 22,
            priorYear: 6,
            change: 266.7
          },
          thisWeek: {
            total: 44,
            priorYear: 45,
            change: -2.2
          },
          mtd: {
            total: 44,
            priorYear: 9,
            change: 388.9
          }
        })
      }
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

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        {/* Today Card */}
        <div className="bg-[#1c1c1e] rounded-2xl p-5 col-span-2 sm:col-span-1 flex flex-col items-center text-center">
          <div className="text-gray-400 text-sm mb-2">Today @ {metrics.today.timestamp}</div>
          <div className="text-white text-6xl font-bold mb-4">{metrics.today.total}</div>
          <div className="space-y-1.5 w-full">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">LW @ {metrics.today.timestamp}</span>
              <span className="text-white font-medium">{metrics.today.lastWeek}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">2WA @ {metrics.today.timestamp}</span>
              <span className="text-white font-medium">{metrics.today.twoWeeksAgo}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">3WA @ {metrics.today.timestamp}</span>
              <span className="text-white font-medium">{metrics.today.threeWeeksAgo}</span>
            </div>
          </div>
        </div>

        {/* Yesterday Card */}
        <div className="bg-[#1c1c1e] rounded-2xl p-5 col-span-2 sm:col-span-1 flex flex-col items-center text-center">
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

      {/* Last Updated Footer */}
      <div className="text-center text-xs text-gray-500 mt-4">
        Last updated: {lastRefresh.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
      </div>
    </div>
  )
}
