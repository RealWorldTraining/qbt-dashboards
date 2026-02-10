"use client"

import { useEffect, useState } from "react"
import { RefreshCw } from "lucide-react"
import { DashboardNav } from "@/components/DashboardNav"
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Bar,
  ComposedChart,
  Line,
  LabelList,
} from "recharts"

interface WeeklyData {
  week: string
  week_start: string
  spend: number
  impressions: number
  clicks: number
  conversions: number
  ctr: number
  conv_rate: number
  cpa: number
  roas: number
}

interface CampaignMetrics {
  week: string
  campaign: string
  clicks: number
  impressions: number
  ctr: number
  avg_cpc: number
  cost: number
  conversions: number
  conv_rate: number
  search_impression_share: number
  search_top_impression_share: number
  search_abs_top_impression_share: number
  click_share: number
}

interface CampaignWeek {
  week: string
  label: string
  date_range: string
}

interface CampaignResponse {
  weeks: CampaignWeek[]
  campaigns: {
    name: string
    data: (CampaignMetrics | null)[]
  }[]
  last_updated: string
}

interface ApiResponse {
  data: WeeklyData[]
  last_updated: string
}

const METRIC_COLORS = {
  spend: "#FF3B30",       // red (matching Google Ads dashboard)
  impressions: "#3b82f6", // blue
  clicks: "#22c55e",      // green
  conversions: "#34C759", // green (matching Google Ads dashboard)
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
  const [data, setData] = useState<WeeklyData[]>([])
  const [campaignData, setCampaignData] = useState<CampaignResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [lastRefresh, setLastRefresh] = useState(new Date())
  const [selectedWeekIndex, setSelectedWeekIndex] = useState(0)

  const fetchData = async () => {
    setLoading(true)
    try {
      const [weeklyRes, campaignRes] = await Promise.all([
        fetch('/api/bing-ads-weekly'),
        fetch('/api/bing-campaigns')
      ])
      
      if (weeklyRes.ok) {
        const json: ApiResponse = await weeklyRes.json()
        setData(json.data)
      }
      
      if (campaignRes.ok) {
        const json: CampaignResponse = await campaignRes.json()
        setCampaignData(json)
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

  // Calculate changes for summary cards (selected vs previous week)
  const currentWeek = data[selectedWeekIndex]
  const previousWeek = data[selectedWeekIndex + 1]
  
  const calculateChange = (current: number, previous: number) => {
    if (!previous) return 0
    return ((current - previous) / previous) * 100
  }

  const metrics = ["spend", "impressions", "clicks", "conversions", "ctr", "conv_rate", "cpa", "roas"] as const

  // Reverse data for charts (oldest first)
  const chartData = [...data].reverse()

  return (
    <div className="min-h-screen bg-black p-6">
      <div className="max-w-[1800px] mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <DashboardNav />
            <div>
              <h1 className="text-white text-2xl font-bold">Bing Ads Summary</h1>
              <p className="text-gray-400 text-sm mt-1">Last 6 weeks performance</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-gray-500 text-sm">
              {lastRefresh.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
            </span>
            <button onClick={fetchData} disabled={loading} className="p-2 rounded-lg hover:bg-gray-800 transition-colors">
              <RefreshCw className={`h-5 w-5 text-gray-400 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Overall Summary Cards */}
        {currentWeek && (
          <>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-baseline gap-3">
                <div className="text-white text-base font-semibold uppercase tracking-wide">Overall (Desktop Only)</div>
                <span className="text-gray-500 text-sm">{currentWeek.week}</span>
              </div>
              {data.length > 0 && (
                <div className="flex gap-1.5">
                  {data.map((w, i) => {
                    const weekStart = new Date(w.week_start + 'T00:00:00')
                    const label = weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                    const isActive = i === selectedWeekIndex
                    return (
                      <button
                        key={i}
                        onClick={() => setSelectedWeekIndex(i)}
                        className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                          isActive
                            ? 'bg-sky-600 text-white'
                            : 'bg-[#1a1a1a] text-gray-400 hover:bg-[#222] hover:text-gray-300'
                        }`}
                      >
                        {label}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
            <div className="grid grid-cols-7 gap-3 mb-6">
              {(["spend", "impressions", "clicks", "conversions", "ctr", "conv_rate", "cpa"] as const).map((metric) => {
                const current = currentWeek[metric]
                const previous = previousWeek?.[metric] || 0
                const absoluteChange = current - previous
                const color = METRIC_COLORS[metric]
                
                let displayValue = formatNumber(current)
                if (metric === "spend" || metric === "cpa") {
                  displayValue = formatCurrency(current)
                } else if (metric === "ctr" || metric === "conv_rate") {
                  displayValue = formatPercent(current)
                }
                
                // Format the absolute change based on metric type
                let changeDisplay = ""
                if (metric === "spend" || metric === "cpa") {
                  changeDisplay = (absoluteChange >= 0 ? '+' : '-') + formatCurrency(Math.abs(absoluteChange))
                } else if (metric === "ctr" || metric === "conv_rate") {
                  changeDisplay = (absoluteChange >= 0 ? '+' : '') + absoluteChange.toFixed(1) + "%"
                } else {
                  changeDisplay = (absoluteChange >= 0 ? '+' : '') + formatNumber(absoluteChange)
                }
                
                // For CPA, lower is better
                const isInverse = metric === "cpa"
                const changeColor = isInverse 
                  ? (absoluteChange <= 0 ? 'text-green-500' : 'text-red-500')
                  : (absoluteChange >= 0 ? 'text-green-500' : 'text-red-500')
                
                return (
                  <div key={metric} className="bg-[#1a1a1a] rounded-lg overflow-hidden">
                    <div className="h-1" style={{ backgroundColor: color }} />
                    <div className="p-4">
                      <div className="text-gray-400 text-xs mb-1 uppercase tracking-wide">
                        {METRIC_LABELS[metric]}
                      </div>
                      <div className="text-white text-3xl font-bold mb-1">
                        {displayValue}
                      </div>
                      <div className={`text-sm ${changeColor}`}>
                        {changeDisplay} vs prev
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}

        {/* Main Chart - Spend & Conversions */}
        <div className="bg-[#1a1a1a] rounded-xl p-6 mb-6">
          <h2 className="text-white text-lg font-semibold mb-4">Weekly Spend & Conversions</h2>
          <div style={{ width: '100%', height: 400 }}>
            {chartData.length > 0 && (
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                  <XAxis 
                    dataKey="week" 
                    stroke="#666" 
                    tick={{ fill: '#999', fontSize: 11 }}
                  />
                  <YAxis 
                    yAxisId="left"
                    stroke="#666" 
                    tick={{ fill: '#999', fontSize: 12 }}
                    tickFormatter={(value) => value >= 1000 ? `$${(value / 1000).toFixed(0)}k` : `$${value}`}
                    domain={[0, 15000]}
                  />
                  <YAxis 
                    yAxisId="right"
                    orientation="right"
                    stroke="#666" 
                    tick={{ fill: '#999', fontSize: 12 }}
                    domain={[0, 60]}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ paddingTop: '20px' }} />
                  <Bar
                    yAxisId="left"
                    dataKey="spend"
                    name="spend"
                    fill={METRIC_COLORS.spend}
                    radius={[4, 4, 0, 0]}
                  >
                    <LabelList
                      dataKey="spend"
                      position="insideTop"
                      fill="#ffffff"
                      fontSize={33}
                      formatter={(value) => typeof value === 'number' ? `$${(value / 1000).toFixed(1)}k` : ''}
                    />
                  </Bar>
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="conversions"
                    name="conversions"
                    stroke={METRIC_COLORS.conversions}
                    strokeWidth={3}
                    dot={{ fill: METRIC_COLORS.conversions, r: 5 }}
                  >
                    <LabelList
                      dataKey="conversions"
                      position="top"
                      fill={METRIC_COLORS.conversions}
                      fontSize={33}
                      offset={10}
                    />
                  </Line>
                </ComposedChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* CPC & CPA Chart */}
        <div className="bg-[#1a1a1a] rounded-xl p-6 mb-6">
          <h2 className="text-white text-lg font-semibold mb-4">CTR & Cost Per Conversion</h2>
          <div style={{ width: '100%', height: 400 }}>
            {chartData.length > 0 && (
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chartData} margin={{ top: 30, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                  <XAxis
                    dataKey="week"
                    stroke="#666"
                    tick={{ fill: '#999', fontSize: 11 }}
                  />
                  <YAxis
                    yAxisId="left"
                    stroke="#666"
                    tick={{ fill: '#999', fontSize: 12 }}
                    tickFormatter={(value) => `$${value}`}
                    label={{ value: 'CPA', angle: -90, position: 'insideLeft', fill: '#999', fontSize: 12 }}
                    domain={[0, 300]}
                  />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    stroke="#666"
                    tick={{ fill: '#999', fontSize: 12 }}
                    tickFormatter={(value) => `${value}%`}
                    label={{ value: 'CTR', angle: 90, position: 'insideRight', fill: '#999', fontSize: 12 }}
                    domain={[0, 40]}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ paddingTop: '20px' }} />
                  <Bar
                    yAxisId="left"
                    dataKey="cpa"
                    name="cpa"
                    fill={METRIC_COLORS.cpa}
                    radius={[4, 4, 0, 0]}
                  >
                    <LabelList
                      dataKey="cpa"
                      position="insideTop"
                      fill="#ffffff"
                      fontSize={33}
                      formatter={(value) => typeof value === 'number' ? `$${Math.round(value)}` : ''}
                    />
                  </Bar>
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="ctr"
                    name="ctr"
                    stroke={METRIC_COLORS.ctr}
                    strokeWidth={3}
                    dot={{ fill: METRIC_COLORS.ctr, r: 5 }}
                  >
                    <LabelList
                      dataKey="ctr"
                      position="top"
                      fill={METRIC_COLORS.ctr}
                      fontSize={30}
                      offset={12}
                      formatter={(value) => typeof value === 'number' ? `${value.toFixed(1)}%` : ''}
                    />
                  </Line>
                </ComposedChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Weekly Data Table */}
        <div className="bg-[#1a1a1a] rounded-xl p-6 mb-6">
          <h2 className="text-white text-lg font-semibold mb-4">Weekly Data</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">Week</th>
                  <th className="text-right py-3 px-4 font-medium" style={{ color: METRIC_COLORS.spend }}>Spend</th>
                  <th className="text-right py-3 px-4 font-medium" style={{ color: METRIC_COLORS.impressions }}>Impr</th>
                  <th className="text-right py-3 px-4 font-medium" style={{ color: METRIC_COLORS.clicks }}>Clicks</th>
                  <th className="text-right py-3 px-4 font-medium" style={{ color: METRIC_COLORS.ctr }}>CTR</th>
                  <th className="text-right py-3 px-4 font-medium" style={{ color: METRIC_COLORS.conversions }}>Conv</th>
                  <th className="text-right py-3 px-4 font-medium" style={{ color: METRIC_COLORS.conv_rate }}>Conv %</th>
                  <th className="text-right py-3 px-4 font-medium" style={{ color: METRIC_COLORS.cpa }}>CPA</th>
                  <th className="text-right py-3 px-4 font-medium" style={{ color: METRIC_COLORS.roas }}>ROAS</th>
                </tr>
              </thead>
              <tbody>
                {data.map((row, idx) => (
                  <tr key={idx} className="border-b border-gray-800 hover:bg-gray-800/50 transition-colors">
                    <td className="py-3 px-4 text-white font-medium">{row.week}</td>
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

        {/* Campaign Performance Section */}
        {campaignData && campaignData.campaigns.length > 0 && (
          <div className="bg-[#1a1a1a] rounded-xl p-6">
            <h2 className="text-white text-lg font-semibold mb-4">Campaign Performance (Last 4 Weeks)</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="text-left py-3 px-4 text-gray-400 font-medium">Campaign</th>
                    <th className="text-center py-3 px-4 text-gray-400 font-medium" colSpan={2}>
                      {campaignData.weeks[0]?.date_range || 'Last Week'}
                    </th>
                    <th className="text-center py-3 px-4 text-gray-400 font-medium" colSpan={2}>
                      {campaignData.weeks[1]?.date_range || '2 Weeks Ago'}
                    </th>
                    <th className="text-center py-3 px-4 text-gray-400 font-medium" colSpan={2}>
                      {campaignData.weeks[2]?.date_range || '3 Weeks Ago'}
                    </th>
                    <th className="text-center py-3 px-4 text-gray-400 font-medium" colSpan={2}>
                      {campaignData.weeks[3]?.date_range || '4 Weeks Ago'}
                    </th>
                  </tr>
                  <tr className="border-b border-gray-700">
                    <th className="text-left py-2 px-4 text-gray-500 text-xs"></th>
                    {[0, 1, 2, 3].map((i) => (
                      <>
                        <th key={`spend-${i}`} className="text-right py-2 px-2 text-gray-500 text-xs">Spend</th>
                        <th key={`conv-${i}`} className="text-right py-2 px-2 text-gray-500 text-xs">Conv</th>
                      </>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {campaignData.campaigns.map((campaign, idx) => (
                    <tr key={idx} className="border-b border-gray-800 hover:bg-gray-800/50 transition-colors">
                      <td className="py-3 px-4 text-white font-medium">{campaign.name}</td>
                      {[0, 1, 2, 3].map((weekIdx) => {
                        const weekData = campaign.data[weekIdx]
                        return (
                          <>
                            <td key={`spend-${weekIdx}`} className="text-right py-3 px-2 text-gray-300">
                              {weekData ? formatCurrency(weekData.cost) : '-'}
                            </td>
                            <td key={`conv-${weekIdx}`} className="text-right py-3 px-2 text-gray-300">
                              {weekData ? formatNumber(weekData.conversions) : '-'}
                            </td>
                          </>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {/* Detailed Campaign Metrics - Last Week */}
            <h3 className="text-white text-md font-semibold mt-8 mb-4">Detailed Metrics - {campaignData.weeks[0]?.date_range || 'Last Week'}</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="text-left py-3 px-4 text-gray-400 font-medium">Campaign</th>
                    <th className="text-right py-3 px-3 text-gray-400 font-medium">Spend</th>
                    <th className="text-right py-3 px-3 text-gray-400 font-medium">Impr</th>
                    <th className="text-right py-3 px-3 text-gray-400 font-medium">Clicks</th>
                    <th className="text-right py-3 px-3 text-gray-400 font-medium">CTR</th>
                    <th className="text-right py-3 px-3 text-gray-400 font-medium">Avg CPC</th>
                    <th className="text-right py-3 px-3 text-gray-400 font-medium">Conv</th>
                    <th className="text-right py-3 px-3 text-gray-400 font-medium">Conv %</th>
                  </tr>
                </thead>
                <tbody>
                  {campaignData.campaigns.map((campaign, idx) => {
                    const lastWeek = campaign.data[0]
                    if (!lastWeek) return null
                    return (
                      <tr key={idx} className="border-b border-gray-800 hover:bg-gray-800/50 transition-colors">
                        <td className="py-3 px-4 text-white font-medium">{campaign.name}</td>
                        <td className="text-right py-3 px-3 text-gray-300">{formatCurrency(lastWeek.cost)}</td>
                        <td className="text-right py-3 px-3 text-gray-300">{formatNumber(lastWeek.impressions)}</td>
                        <td className="text-right py-3 px-3 text-gray-300">{formatNumber(lastWeek.clicks)}</td>
                        <td className="text-right py-3 px-3 text-gray-300">{formatPercent(lastWeek.ctr)}</td>
                        <td className="text-right py-3 px-3 text-gray-300">{formatCurrency(lastWeek.avg_cpc)}</td>
                        <td className="text-right py-3 px-3 text-gray-300">{formatNumber(lastWeek.conversions)}</td>
                        <td className="text-right py-3 px-3 text-gray-300">{formatPercent(lastWeek.conv_rate)}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

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
