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

interface YTDAgeSummary {
  age: string
  clicks: number
  impressions: number
  ctr: number
  avg_cpc: number
  cost: number
  conversions: number
}

interface ApiResponse {
  chartData: ChartData
  ytd2026Summary: YTDAgeSummary[]
  deviceFilter: string
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

const DEVICE_OPTIONS = ['All', 'Computers', 'Mobile', 'Tablets']

export default function AgeAnalysisPage() {
  const [data, setData] = useState<ApiResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedDevice, setSelectedDevice] = useState('All')

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`/api/age-analysis?device=${selectedDevice}`)
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
  }, [selectedDevice])

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

  const { chartData, ytd2026Summary } = data

  // Transform data for Recharts with abbreviated labels
  const transformDataForChart = (metricData: AgeSeriesData[]) => {
    return chartData.months.map((month, idx) => {
      // Convert "Jan 2024" to "Jan\n'24"
      const parts = month.split(' ')
      const monthAbbr = parts[0]
      const yearAbbr = parts[1] ? `'${parts[1].slice(2)}` : ''
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

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <DashboardNav />
      
      <div className="w-full px-8 py-8">
        {/* Header with Device Toggle */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-5xl font-bold mb-2">Google Ads Age Analysis</h1>
              <p className="text-gray-400 text-lg">2026 YTD performance by age group • Device: {selectedDevice}</p>
            </div>
            
            {/* Device Toggle */}
            <div className="flex gap-2">
              {DEVICE_OPTIONS.map(device => (
                <button
                  key={device}
                  onClick={() => setSelectedDevice(device)}
                  className={`px-6 py-3 rounded-lg font-medium transition-all ${
                    selectedDevice === device
                      ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-500/50'
                      : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                  }`}
                >
                  {device}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Age Group Summary Cards - 2026 YTD */}
        <div className="grid grid-cols-5 gap-4 mb-8">
          {ytd2026Summary.map((ageSummary, idx) => {
            const ageColor = AGE_COLORS[ageSummary.age]
            return (
              <div key={ageSummary.age} className="bg-gray-900 border-2 rounded-xl p-4" style={{ borderColor: ageColor }}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Users className="h-5 w-5" style={{ color: ageColor }} />
                    <span className="text-xl font-bold" style={{ color: ageColor }}>
                      {ageSummary.age}
                    </span>
                  </div>
                  <span className="text-xs text-gray-500">2026 YTD</span>
                </div>
                
                <div className="space-y-3">
                  <div>
                    <div className="text-gray-500 text-xs mb-1">Clicks</div>
                    <div className="text-white text-lg font-bold">{ageSummary.clicks.toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="text-gray-500 text-xs mb-1">Impressions</div>
                    <div className="text-white text-lg font-bold">{ageSummary.impressions.toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="text-gray-500 text-xs mb-1">CTR</div>
                    <div className="text-white text-lg font-bold">{ageSummary.ctr.toFixed(2)}%</div>
                  </div>
                  <div>
                    <div className="text-gray-500 text-xs mb-1">Avg CPC</div>
                    <div className="text-white text-lg font-bold">${ageSummary.avg_cpc.toFixed(2)}</div>
                  </div>
                  <div>
                    <div className="text-gray-500 text-xs mb-1">Spend</div>
                    <div className="text-white text-lg font-bold">
                      ${ageSummary.cost.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-500 text-xs mb-1">Conversions</div>
                    <div className="text-white text-lg font-bold">{ageSummary.conversions.toFixed(0)}</div>
                  </div>
                </div>
              </div>
            )
          })}
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
                />
                <YAxis stroke="#9ca3af" style={{ fontSize: '11px' }} />
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
                />
                <YAxis stroke="#9ca3af" style={{ fontSize: '11px' }} />
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
                />
                <YAxis stroke="#9ca3af" style={{ fontSize: '11px' }} />
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
                />
                <YAxis stroke="#9ca3af" style={{ fontSize: '11px' }} />
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
                />
                <YAxis stroke="#9ca3af" style={{ fontSize: '11px' }} />
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
                />
                <YAxis stroke="#9ca3af" style={{ fontSize: '11px' }} />
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
          <p>Data source: Google Ads (Adveronix Sheet: Age Analysis_Device) • Device Filter: {selectedDevice}</p>
          <p className="mt-2">Last updated: {new Date(data.last_updated).toLocaleString()}</p>
        </div>
      </div>
    </div>
  )
}
