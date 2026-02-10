'use client'

import { useEffect, useState } from 'react'
import { DashboardNav } from '@/components/DashboardNav'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { TrendingUp, Users, MousePointer, DollarSign, Target, ShoppingCart } from 'lucide-react'

interface AgeSeriesData {
  age: string
  data: number[]
}

interface ChartData {
  months: string[]
  monthKeys: string[]
  ageGroups: string[]
  clicks: AgeSeriesData[]
  impressions: AgeSeriesData[]
  ctr: AgeSeriesData[]
  avg_cpc: AgeSeriesData[]
  cost: AgeSeriesData[]
  conversions: AgeSeriesData[]
}

interface ApiResponse {
  chartData: ChartData
  last_updated: string
}

const AGE_COLORS: Record<string, string> = {
  '18-24': '#3b82f6', // blue
  '25-34': '#10b981', // green
  '35-44': '#f59e0b', // amber
  '45-54': '#ef4444', // red
  '55-64': '#8b5cf6', // purple
  '>64': '#ec4899',   // pink
}

export default function AgeAnalysisPage() {
  const [data, setData] = useState<ApiResponse | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('/api/age-analysis')
        if (res.ok) {
          const json = await res.json()
          setData(json)
        }
      } catch (err) {
        console.error('Error fetching age analysis:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
    const interval = setInterval(fetchData, 5 * 60 * 1000) // Refresh every 5 min
    return () => clearInterval(interval)
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
        <div className="text-4xl">Loading Age Analysis...</div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
        <div className="text-4xl">No data available</div>
      </div>
    )
  }

  const { chartData } = data

  // Transform data for Recharts with abbreviated labels
  const transformDataForChart = (metricData: AgeSeriesData[]) => {
    return chartData.months.map((month, idx) => {
      // Convert "Jan 2024" to "Jan\n'24"
      const parts = month.split(' ')
      const monthAbbr = parts[0] // Already abbreviated (Jan, Feb, etc.)
      const yearAbbr = parts[1] ? `'${parts[1].slice(2)}` : '' // 2024 -> '24
      const label = `${monthAbbr}\n${yearAbbr}`
      
      const point: any = { month: label }
      metricData.forEach(series => {
        point[series.age] = series.data[idx]
      })
      return point
    })
  }

  const clicksData = transformDataForChart(chartData.clicks)
  const impressionsData = transformDataForChart(chartData.impressions)
  const ctrData = transformDataForChart(chartData.ctr)
  const cpcData = transformDataForChart(chartData.avg_cpc)
  const costData = transformDataForChart(chartData.cost)
  const conversionsData = transformDataForChart(chartData.conversions)

  // Calculate summary stats (last month totals)
  const lastMonthIdx = chartData.months.length - 1
  const totalClicks = chartData.clicks.reduce((sum, series) => sum + series.data[lastMonthIdx], 0)
  const totalImpressions = chartData.impressions.reduce((sum, series) => sum + series.data[lastMonthIdx], 0)
  const totalCost = chartData.cost.reduce((sum, series) => sum + series.data[lastMonthIdx], 0)
  const totalConversions = chartData.conversions.reduce((sum, series) => sum + series.data[lastMonthIdx], 0)
  const avgCTR = chartData.ctr.reduce((sum, series) => sum + series.data[lastMonthIdx], 0) / chartData.ageGroups.length
  const avgCPC = totalClicks > 0 ? totalCost / totalClicks : 0

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <DashboardNav />
      
      <div className="w-full px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-5xl font-bold mb-2">Google Ads Age Analysis</h1>
          <p className="text-gray-400 text-lg">Monthly performance trends by age group • 2024 to present</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-6 gap-4 mb-8">
          <div className="bg-gradient-to-br from-blue-900/50 to-blue-700/30 border border-blue-500/30 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-2">
              <MousePointer className="h-6 w-6 text-blue-400" />
              <span className="text-gray-400 text-sm">Total Clicks</span>
            </div>
            <div className="text-3xl font-bold text-white">{totalClicks.toLocaleString()}</div>
            <div className="text-xs text-gray-500 mt-1">Last month</div>
          </div>

          <div className="bg-gradient-to-br from-green-900/50 to-green-700/30 border border-green-500/30 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-2">
              <TrendingUp className="h-6 w-6 text-green-400" />
              <span className="text-gray-400 text-sm">Impressions</span>
            </div>
            <div className="text-3xl font-bold text-white">{totalImpressions.toLocaleString()}</div>
            <div className="text-xs text-gray-500 mt-1">Last month</div>
          </div>

          <div className="bg-gradient-to-br from-amber-900/50 to-amber-700/30 border border-amber-500/30 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-2">
              <Target className="h-6 w-6 text-amber-400" />
              <span className="text-gray-400 text-sm">Avg CTR</span>
            </div>
            <div className="text-3xl font-bold text-white">{avgCTR.toFixed(2)}%</div>
            <div className="text-xs text-gray-500 mt-1">Last month</div>
          </div>

          <div className="bg-gradient-to-br from-red-900/50 to-red-700/30 border border-red-500/30 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-2">
              <DollarSign className="h-6 w-6 text-red-400" />
              <span className="text-gray-400 text-sm">Avg CPC</span>
            </div>
            <div className="text-3xl font-bold text-white">${avgCPC.toFixed(2)}</div>
            <div className="text-xs text-gray-500 mt-1">Last month</div>
          </div>

          <div className="bg-gradient-to-br from-purple-900/50 to-purple-700/30 border border-purple-500/30 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-2">
              <DollarSign className="h-6 w-6 text-purple-400" />
              <span className="text-gray-400 text-sm">Total Spend</span>
            </div>
            <div className="text-3xl font-bold text-white">${totalCost.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
            <div className="text-xs text-gray-500 mt-1">Last month</div>
          </div>

          <div className="bg-gradient-to-br from-pink-900/50 to-pink-700/30 border border-pink-500/30 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-2">
              <ShoppingCart className="h-6 w-6 text-pink-400" />
              <span className="text-gray-400 text-sm">Conversions</span>
            </div>
            <div className="text-3xl font-bold text-white">{totalConversions.toFixed(0)}</div>
            <div className="text-xs text-gray-500 mt-1">Last month</div>
          </div>
        </div>

        {/* Charts - 2 Column Grid */}
        <div className="grid grid-cols-2 gap-6">
          {/* Clicks Chart */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <h2 className="text-2xl font-bold mb-4 text-blue-400">Clicks by Age Group</h2>
            <ResponsiveContainer width="100%" height={350}>
              <LineChart data={clicksData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis 
                  dataKey="month" 
                  stroke="#9ca3af"
                  
                  
                  height={50}
                  style={{ fontSize: '11px' }}
                  interval={0}
                />
                <YAxis stroke="#9ca3af" style={{ fontSize: '11px' }}
                  interval={0} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151' }}
                  labelStyle={{ color: '#fff' }}
                />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                {chartData.ageGroups.map(age => (
                  <Line
                    key={age}
                    type="monotone"
                    dataKey={age}
                    stroke={AGE_COLORS[age]}
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    activeDot={{ r: 5 }}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Impressions Chart */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <h2 className="text-2xl font-bold mb-4 text-green-400">Impressions by Age Group</h2>
            <ResponsiveContainer width="100%" height={350}>
              <LineChart data={impressionsData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis 
                  dataKey="month" 
                  stroke="#9ca3af"
                  
                  
                  height={50}
                  style={{ fontSize: '11px' }}
                  interval={0}
                />
                <YAxis stroke="#9ca3af" style={{ fontSize: '11px' }}
                  interval={0} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151' }}
                  labelStyle={{ color: '#fff' }}
                />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                {chartData.ageGroups.map(age => (
                  <Line
                    key={age}
                    type="monotone"
                    dataKey={age}
                    stroke={AGE_COLORS[age]}
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    activeDot={{ r: 5 }}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* CTR Chart */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <h2 className="text-2xl font-bold mb-4 text-amber-400">Click-Through Rate (CTR)</h2>
            <ResponsiveContainer width="100%" height={350}>
              <LineChart data={ctrData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis 
                  dataKey="month" 
                  stroke="#9ca3af"
                  
                  
                  height={50}
                  style={{ fontSize: '11px' }}
                  interval={0}
                />
                <YAxis stroke="#9ca3af" style={{ fontSize: '11px' }}
                  interval={0} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151' }}
                  labelStyle={{ color: '#fff' }}
                  formatter={(value: any) => typeof value === 'number' ? `${value.toFixed(2)}%` : value}
                />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                {chartData.ageGroups.map(age => (
                  <Line
                    key={age}
                    type="monotone"
                    dataKey={age}
                    stroke={AGE_COLORS[age]}
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    activeDot={{ r: 5 }}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Average CPC Chart */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <h2 className="text-2xl font-bold mb-4 text-red-400">Average Cost Per Click</h2>
            <ResponsiveContainer width="100%" height={350}>
              <LineChart data={cpcData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis 
                  dataKey="month" 
                  stroke="#9ca3af"
                  
                  
                  height={50}
                  style={{ fontSize: '11px' }}
                  interval={0}
                />
                <YAxis stroke="#9ca3af" style={{ fontSize: '11px' }}
                  interval={0} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151' }}
                  labelStyle={{ color: '#fff' }}
                  formatter={(value: any) => typeof value === 'number' ? `$${value.toFixed(2)}` : value}
                />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                {chartData.ageGroups.map(age => (
                  <Line
                    key={age}
                    type="monotone"
                    dataKey={age}
                    stroke={AGE_COLORS[age]}
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    activeDot={{ r: 5 }}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Cost/Spend Chart */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <h2 className="text-2xl font-bold mb-4 text-purple-400">Cost (Spend) by Age Group</h2>
            <ResponsiveContainer width="100%" height={350}>
              <LineChart data={costData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis 
                  dataKey="month" 
                  stroke="#9ca3af"
                  
                  
                  height={50}
                  style={{ fontSize: '11px' }}
                  interval={0}
                />
                <YAxis stroke="#9ca3af" style={{ fontSize: '11px' }}
                  interval={0} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151' }}
                  labelStyle={{ color: '#fff' }}
                  formatter={(value: any) => typeof value === 'number' ? `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : value}
                />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                {chartData.ageGroups.map(age => (
                  <Line
                    key={age}
                    type="monotone"
                    dataKey={age}
                    stroke={AGE_COLORS[age]}
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    activeDot={{ r: 5 }}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Conversions Chart */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <h2 className="text-2xl font-bold mb-4 text-pink-400">Conversions by Age Group</h2>
            <ResponsiveContainer width="100%" height={350}>
              <LineChart data={conversionsData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis 
                  dataKey="month" 
                  stroke="#9ca3af"
                  
                  
                  height={50}
                  style={{ fontSize: '11px' }}
                  interval={0}
                />
                <YAxis stroke="#9ca3af" style={{ fontSize: '11px' }}
                  interval={0} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151' }}
                  labelStyle={{ color: '#fff' }}
                  formatter={(value: any) => typeof value === 'number' ? value.toFixed(2) : value}
                />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                {chartData.ageGroups.map(age => (
                  <Line
                    key={age}
                    type="monotone"
                    dataKey={age}
                    stroke={AGE_COLORS[age]}
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    activeDot={{ r: 5 }}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-gray-500 text-sm mt-8 pb-8">
          <p>Data source: Google Ads (Adveronix Sheet: Age Analysis_Device)</p>
          <p className="mt-2">Last updated: {new Date(data.last_updated).toLocaleString()}</p>
        </div>
      </div>
    </div>
  )
}
