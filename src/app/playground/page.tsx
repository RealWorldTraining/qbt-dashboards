"use client"

import { useEffect, useState } from "react"
import { RefreshCw } from "lucide-react"
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  BarChart,
  Bar,
} from "recharts"

interface ChannelData {
  month: string
  organic_search: number
  direct: number
  paid_search: number
  referral: number
  organic_social: number
  email: number
  other: number
  total: number
}

interface ApiResponse {
  headers: string[]
  data: ChannelData[]
  last_updated: string
}

// Channel colors matching our dashboard theme
const CHANNEL_COLORS = {
  organic_search: "#3b82f6", // blue
  direct: "#6b7280",         // gray
  paid_search: "#22c55e",    // green
  referral: "#8b5cf6",       // purple
  organic_social: "#f59e0b", // amber
  email: "#ec4899",          // pink
  other: "#06b6d4",          // cyan
}

const CHANNEL_LABELS: Record<string, string> = {
  organic_search: "Organic Search",
  direct: "Direct",
  paid_search: "Paid Search",
  referral: "Referral",
  organic_social: "Organic Social",
  email: "Email",
  other: "Other",
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-US").format(value)
}

// Custom tooltip
function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number; color: string }>; label?: string }) {
  if (!active || !payload) return null
  
  const total = payload.reduce((sum, entry) => sum + entry.value, 0)
  
  return (
    <div className="bg-[#1a1a1a] border border-gray-700 rounded-lg p-4 shadow-xl">
      <p className="text-white font-bold mb-2">{label}</p>
      <div className="space-y-1">
        {payload.reverse().map((entry, index) => (
          <div key={index} className="flex justify-between gap-4 text-sm">
            <span className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: entry.color }} />
              <span className="text-gray-300">{CHANNEL_LABELS[entry.name] || entry.name}</span>
            </span>
            <span className="text-white font-medium">{formatNumber(entry.value)}</span>
          </div>
        ))}
        <div className="border-t border-gray-700 mt-2 pt-2 flex justify-between">
          <span className="text-gray-400">Total</span>
          <span className="text-white font-bold">{formatNumber(total)}</span>
        </div>
      </div>
    </div>
  )
}

export default function PlaygroundPage() {
  const [data, setData] = useState<ChannelData[]>([])
  const [loading, setLoading] = useState(true)
  const [lastRefresh, setLastRefresh] = useState(new Date())
  const [chartType, setChartType] = useState<"area" | "bar">("area")

  const fetchData = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/monthly-channels')
      if (res.ok) {
        const json: ApiResponse = await res.json()
        setData(json.data)
      }
      setLastRefresh(new Date())
    } catch (err) {
      console.error('Error fetching data:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  // Calculate totals for summary cards
  const latestMonth = data[data.length - 1]
  const previousMonth = data[data.length - 2]
  
  const calculateChange = (current: number, previous: number) => {
    if (!previous) return 0
    return ((current - previous) / previous) * 100
  }

  const channels = ["organic_search", "direct", "paid_search", "referral", "organic_social", "email", "other"] as const

  return (
    <div className="min-h-screen bg-black p-6">
      <div className="max-w-[1800px] mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-white text-2xl font-bold">Traffic Channel Analysis</h1>
            <p className="text-gray-400 text-sm mt-1">Monthly breakdown by first user default channel group</p>
          </div>
          <div className="flex items-center gap-4">
            {/* Chart Type Toggle */}
            <div className="flex bg-[#1a1a1a] rounded-lg p-1">
              <button
                onClick={() => setChartType("area")}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  chartType === "area" ? "bg-blue-600 text-white" : "text-gray-400 hover:text-white"
                }`}
              >
                Area
              </button>
              <button
                onClick={() => setChartType("bar")}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  chartType === "bar" ? "bg-blue-600 text-white" : "text-gray-400 hover:text-white"
                }`}
              >
                Bar
              </button>
            </div>
            <span className="text-gray-500 text-sm">
              {lastRefresh.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
            </span>
            <button onClick={fetchData} disabled={loading} className="p-2 rounded-lg hover:bg-gray-800 transition-colors">
              <RefreshCw className={`h-5 w-5 text-gray-400 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        {latestMonth && (
          <div className="grid grid-cols-8 gap-3 mb-6">
            {channels.map((channel) => {
              const current = latestMonth[channel]
              const previous = previousMonth?.[channel] || 0
              const change = calculateChange(current, previous)
              const color = CHANNEL_COLORS[channel]
              
              return (
                <div key={channel} className="bg-[#1a1a1a] rounded-lg overflow-hidden">
                  <div className="h-1" style={{ backgroundColor: color }} />
                  <div className="p-4">
                    <div className="text-gray-400 text-xs mb-1 uppercase tracking-wide">
                      {CHANNEL_LABELS[channel]}
                    </div>
                    <div className="text-white text-2xl font-bold mb-1">
                      {formatNumber(current)}
                    </div>
                    <div className={`text-sm ${change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                      {change >= 0 ? '+' : ''}{change.toFixed(1)}% vs prev
                    </div>
                  </div>
                </div>
              )
            })}
            {/* Total Card */}
            <div className="bg-[#1a1a1a] rounded-lg overflow-hidden">
              <div className="h-1 bg-white" />
              <div className="p-4">
                <div className="text-gray-400 text-xs mb-1 uppercase tracking-wide">Total</div>
                <div className="text-white text-2xl font-bold mb-1">
                  {formatNumber(latestMonth.total)}
                </div>
                <div className={`text-sm ${calculateChange(latestMonth.total, previousMonth?.total || 0) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {calculateChange(latestMonth.total, previousMonth?.total || 0) >= 0 ? '+' : ''}
                  {calculateChange(latestMonth.total, previousMonth?.total || 0).toFixed(1)}% vs prev
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Main Chart */}
        <div className="bg-[#1a1a1a] rounded-xl p-6 mb-6">
          <h2 className="text-white text-lg font-semibold mb-4">Monthly Traffic by Channel</h2>
          <div style={{ width: '100%', height: 500 }}>
            {data.length > 0 && (
            <ResponsiveContainer width="100%" height="100%">
              {chartType === "area" ? (
                <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <defs>
                    {channels.map((channel) => (
                      <linearGradient key={channel} id={`gradient-${channel}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={CHANNEL_COLORS[channel]} stopOpacity={0.8}/>
                        <stop offset="95%" stopColor={CHANNEL_COLORS[channel]} stopOpacity={0.1}/>
                      </linearGradient>
                    ))}
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                  <XAxis 
                    dataKey="month" 
                    stroke="#666" 
                    tick={{ fill: '#999', fontSize: 12 }}
                    tickLine={{ stroke: '#666' }}
                  />
                  <YAxis 
                    stroke="#666" 
                    tick={{ fill: '#999', fontSize: 12 }}
                    tickLine={{ stroke: '#666' }}
                    tickFormatter={(value) => value >= 1000 ? `${(value / 1000).toFixed(0)}k` : value}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend 
                    formatter={(value) => <span className="text-gray-300">{CHANNEL_LABELS[value] || value}</span>}
                    wrapperStyle={{ paddingTop: '20px' }}
                  />
                  {channels.map((channel) => (
                    <Area
                      key={channel}
                      type="monotone"
                      dataKey={channel}
                      stackId="1"
                      stroke={CHANNEL_COLORS[channel]}
                      fill={`url(#gradient-${channel})`}
                    />
                  ))}
                </AreaChart>
              ) : (
                <BarChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                  <XAxis 
                    dataKey="month" 
                    stroke="#666" 
                    tick={{ fill: '#999', fontSize: 12 }}
                    tickLine={{ stroke: '#666' }}
                  />
                  <YAxis 
                    stroke="#666" 
                    tick={{ fill: '#999', fontSize: 12 }}
                    tickLine={{ stroke: '#666' }}
                    tickFormatter={(value) => value >= 1000 ? `${(value / 1000).toFixed(0)}k` : value}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend 
                    formatter={(value) => <span className="text-gray-300">{CHANNEL_LABELS[value] || value}</span>}
                    wrapperStyle={{ paddingTop: '20px' }}
                  />
                  {channels.map((channel) => (
                    <Bar
                      key={channel}
                      dataKey={channel}
                      stackId="1"
                      fill={CHANNEL_COLORS[channel]}
                    />
                  ))}
                </BarChart>
              )}
            </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Data Table */}
        <div className="bg-[#1a1a1a] rounded-xl p-6">
          <h2 className="text-white text-lg font-semibold mb-4">Monthly Data</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">Month</th>
                  {channels.map((channel) => (
                    <th key={channel} className="text-right py-3 px-4 font-medium" style={{ color: CHANNEL_COLORS[channel] }}>
                      {CHANNEL_LABELS[channel]}
                    </th>
                  ))}
                  <th className="text-right py-3 px-4 text-white font-medium">Total</th>
                </tr>
              </thead>
              <tbody>
                {data.map((row, idx) => (
                  <tr key={idx} className="border-b border-gray-800 hover:bg-gray-800/50 transition-colors">
                    <td className="py-3 px-4 text-white font-medium">{row.month}</td>
                    {channels.map((channel) => (
                      <td key={channel} className="text-right py-3 px-4 text-gray-300">
                        {formatNumber(row[channel])}
                      </td>
                    ))}
                    <td className="text-right py-3 px-4 text-white font-bold">{formatNumber(row.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-6">
          <div className="flex items-center justify-center gap-2">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-gray-500 text-xs">Data from Google Analytics</span>
          </div>
        </div>
      </div>
    </div>
  )
}
