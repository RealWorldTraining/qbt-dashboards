"use client"

import { useEffect, useState } from "react"
import { RefreshCw } from "lucide-react"
import { DashboardNav } from "@/components/DashboardNav"
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
  ComposedChart,
  Line,
} from "recharts"

interface MonthlyData {
  month: string
  spend: number
  impressions: number
  clicks: number
  conversions: number
  ctr: number
  conv_rate: number
  cpa: number
  roas: number
}

interface ApiResponse {
  data: MonthlyData[]
  last_updated: string
}

const METRIC_COLORS = {
  spend: "#0ea5e9",       // sky blue (Bing brand)
  impressions: "#3b82f6", // blue
  clicks: "#22c55e",      // green
  conversions: "#f59e0b", // amber
  ctr: "#8b5cf6",         // purple
  conv_rate: "#ec4899",   // pink
  cpa: "#06b6d4",         // cyan
  roas: "#10b981",        // emerald
}

const METRIC_LABELS: Record<string, string> = {
  spend: "Spend",
  impressions: "Impressions",
  clicks: "Clicks",
  conversions: "Conversions",
  ctr: "CTR",
  conv_rate: "Conv Rate",
  cpa: "CPA",
  roas: "ROAS",
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-US").format(Math.round(value))
}

function formatCurrency(value: number): string {
  return "$" + new Intl.NumberFormat("en-US").format(Math.round(value))
}

function formatPercent(value: number): string {
  return value.toFixed(2) + "%"
}

// Custom tooltip
function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number; color: string }>; label?: string }) {
  if (!active || !payload || !payload.length) return null
  
  return (
    <div className="bg-[#1a1a1a] border border-gray-700 rounded-lg p-4 shadow-xl">
      <p className="text-white font-bold mb-2">{label}</p>
      <div className="space-y-1">
        {payload.map((entry, index) => {
          let formattedValue = formatNumber(entry.value)
          if (entry.name === "spend" || entry.name === "cpa") {
            formattedValue = formatCurrency(entry.value)
          } else if (entry.name === "ctr" || entry.name === "conv_rate") {
            formattedValue = formatPercent(entry.value)
          } else if (entry.name === "roas") {
            formattedValue = entry.value.toFixed(2) + "x"
          }
          return (
            <div key={index} className="flex justify-between gap-4 text-sm">
              <span className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: entry.color }} />
                <span className="text-gray-300">{METRIC_LABELS[entry.name] || entry.name}</span>
              </span>
              <span className="text-white font-medium">{formattedValue}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function BingAdsSummaryPage() {
  const [data, setData] = useState<MonthlyData[]>([])
  const [loading, setLoading] = useState(true)
  const [lastRefresh, setLastRefresh] = useState(new Date())
  const [chartType, setChartType] = useState<"area" | "bar">("area")

  const fetchData = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/bing-ads-monthly')
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

  const metrics = ["spend", "impressions", "clicks", "conversions", "ctr", "conv_rate", "cpa", "roas"] as const

  return (
    <div className="min-h-screen bg-black p-6">
      <div className="max-w-[1800px] mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <DashboardNav />
            <div>
              <h1 className="text-white text-2xl font-bold">Bing Ads Summary</h1>
              <p className="text-gray-400 text-sm mt-1">Monthly performance metrics</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {/* Chart Type Toggle */}
            <div className="flex bg-[#1a1a1a] rounded-lg p-1">
              <button
                onClick={() => setChartType("area")}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  chartType === "area" ? "bg-sky-600 text-white" : "text-gray-400 hover:text-white"
                }`}
              >
                Area
              </button>
              <button
                onClick={() => setChartType("bar")}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  chartType === "bar" ? "bg-sky-600 text-white" : "text-gray-400 hover:text-white"
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
            {metrics.map((metric) => {
              const current = latestMonth[metric]
              const previous = previousMonth?.[metric] || 0
              const change = calculateChange(current, previous)
              const color = METRIC_COLORS[metric]
              
              let displayValue = formatNumber(current)
              if (metric === "spend" || metric === "cpa") {
                displayValue = formatCurrency(current)
              } else if (metric === "ctr" || metric === "conv_rate") {
                displayValue = formatPercent(current)
              } else if (metric === "roas") {
                displayValue = current.toFixed(2) + "x"
              }
              
              // For CPA, lower is better (inverse the color logic)
              const isInverse = metric === "cpa"
              const changeColor = isInverse 
                ? (change <= 0 ? 'text-green-500' : 'text-red-500')
                : (change >= 0 ? 'text-green-500' : 'text-red-500')
              
              return (
                <div key={metric} className="bg-[#1a1a1a] rounded-lg overflow-hidden">
                  <div className="h-1" style={{ backgroundColor: color }} />
                  <div className="p-4">
                    <div className="text-gray-400 text-xs mb-1 uppercase tracking-wide">
                      {METRIC_LABELS[metric]}
                    </div>
                    <div className="text-white text-xl font-bold mb-1">
                      {displayValue}
                    </div>
                    <div className={`text-sm ${changeColor}`}>
                      {change >= 0 ? '+' : ''}{change.toFixed(1)}% vs prev
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Main Chart - Spend & Conversions */}
        <div className="bg-[#1a1a1a] rounded-xl p-6 mb-6">
          <h2 className="text-white text-lg font-semibold mb-4">Monthly Spend & Conversions</h2>
          <div style={{ width: '100%', height: 400 }}>
            {data.length > 0 && (
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                  <XAxis 
                    dataKey="month" 
                    stroke="#666" 
                    tick={{ fill: '#999', fontSize: 12 }}
                  />
                  <YAxis 
                    yAxisId="left"
                    stroke="#666" 
                    tick={{ fill: '#999', fontSize: 12 }}
                    tickFormatter={(value) => value >= 1000 ? `$${(value / 1000).toFixed(0)}k` : `$${value}`}
                  />
                  <YAxis 
                    yAxisId="right"
                    orientation="right"
                    stroke="#666" 
                    tick={{ fill: '#999', fontSize: 12 }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ paddingTop: '20px' }} />
                  {chartType === "area" ? (
                    <>
                      <Area
                        yAxisId="left"
                        type="monotone"
                        dataKey="spend"
                        name="spend"
                        stroke={METRIC_COLORS.spend}
                        fill={METRIC_COLORS.spend}
                        fillOpacity={0.3}
                      />
                      <Line
                        yAxisId="right"
                        type="monotone"
                        dataKey="conversions"
                        name="conversions"
                        stroke={METRIC_COLORS.conversions}
                        strokeWidth={3}
                        dot={{ fill: METRIC_COLORS.conversions }}
                      />
                    </>
                  ) : (
                    <>
                      <Bar
                        yAxisId="left"
                        dataKey="spend"
                        name="spend"
                        fill={METRIC_COLORS.spend}
                      />
                      <Line
                        yAxisId="right"
                        type="monotone"
                        dataKey="conversions"
                        name="conversions"
                        stroke={METRIC_COLORS.conversions}
                        strokeWidth={3}
                        dot={{ fill: METRIC_COLORS.conversions }}
                      />
                    </>
                  )}
                </ComposedChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Efficiency Chart - CTR, Conv Rate, ROAS */}
        <div className="bg-[#1a1a1a] rounded-xl p-6 mb-6">
          <h2 className="text-white text-lg font-semibold mb-4">Efficiency Metrics</h2>
          <div style={{ width: '100%', height: 300 }}>
            {data.length > 0 && (
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                  <XAxis 
                    dataKey="month" 
                    stroke="#666" 
                    tick={{ fill: '#999', fontSize: 12 }}
                  />
                  <YAxis 
                    yAxisId="left"
                    stroke="#666" 
                    tick={{ fill: '#999', fontSize: 12 }}
                    tickFormatter={(value) => `${value.toFixed(1)}%`}
                  />
                  <YAxis 
                    yAxisId="right"
                    orientation="right"
                    stroke="#666" 
                    tick={{ fill: '#999', fontSize: 12 }}
                    tickFormatter={(value) => `${value.toFixed(1)}x`}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ paddingTop: '20px' }} />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="ctr"
                    name="ctr"
                    stroke={METRIC_COLORS.ctr}
                    strokeWidth={2}
                    dot={{ fill: METRIC_COLORS.ctr }}
                  />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="conv_rate"
                    name="conv_rate"
                    stroke={METRIC_COLORS.conv_rate}
                    strokeWidth={2}
                    dot={{ fill: METRIC_COLORS.conv_rate }}
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="roas"
                    name="roas"
                    stroke={METRIC_COLORS.roas}
                    strokeWidth={2}
                    dot={{ fill: METRIC_COLORS.roas }}
                  />
                </ComposedChart>
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
                  <th className="text-right py-3 px-4 font-medium" style={{ color: METRIC_COLORS.spend }}>Spend</th>
                  <th className="text-right py-3 px-4 font-medium" style={{ color: METRIC_COLORS.impressions }}>Impressions</th>
                  <th className="text-right py-3 px-4 font-medium" style={{ color: METRIC_COLORS.clicks }}>Clicks</th>
                  <th className="text-right py-3 px-4 font-medium" style={{ color: METRIC_COLORS.ctr }}>CTR</th>
                  <th className="text-right py-3 px-4 font-medium" style={{ color: METRIC_COLORS.conversions }}>Conv</th>
                  <th className="text-right py-3 px-4 font-medium" style={{ color: METRIC_COLORS.conv_rate }}>Conv Rate</th>
                  <th className="text-right py-3 px-4 font-medium" style={{ color: METRIC_COLORS.cpa }}>CPA</th>
                  <th className="text-right py-3 px-4 font-medium" style={{ color: METRIC_COLORS.roas }}>ROAS</th>
                </tr>
              </thead>
              <tbody>
                {data.map((row, idx) => (
                  <tr key={idx} className="border-b border-gray-800 hover:bg-gray-800/50 transition-colors">
                    <td className="py-3 px-4 text-white font-medium">{row.month}</td>
                    <td className="text-right py-3 px-4 text-gray-300">{formatCurrency(row.spend)}</td>
                    <td className="text-right py-3 px-4 text-gray-300">{formatNumber(row.impressions)}</td>
                    <td className="text-right py-3 px-4 text-gray-300">{formatNumber(row.clicks)}</td>
                    <td className="text-right py-3 px-4 text-gray-300">{formatPercent(row.ctr)}</td>
                    <td className="text-right py-3 px-4 text-gray-300">{formatNumber(row.conversions)}</td>
                    <td className="text-right py-3 px-4 text-gray-300">{formatPercent(row.conv_rate)}</td>
                    <td className="text-right py-3 px-4 text-gray-300">{formatCurrency(row.cpa)}</td>
                    <td className="text-right py-3 px-4 text-gray-300">{row.roas.toFixed(2)}x</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-6">
          <div className="flex items-center justify-center gap-2">
            <span className="w-2 h-2 bg-sky-500 rounded-full animate-pulse" />
            <span className="text-gray-500 text-xs">Data from Microsoft Advertising</span>
          </div>
        </div>
      </div>
    </div>
  )
}
