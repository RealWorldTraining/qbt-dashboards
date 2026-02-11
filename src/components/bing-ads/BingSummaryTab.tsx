"use client"

import React, { useState, useEffect } from "react"
import { RefreshCw } from "lucide-react"
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
  Area,
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
  spend: "#FF3B30",
  impressions: "#3b82f6",
  clicks: "#22c55e",
  conversions: "#34C759",
  ctr: "#8b5cf6",
  conv_rate: "#ec4899",
  cpa: "#06b6d4",
  roas: "#10b981",
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

export function BingSummaryTab() {
  const [data, setData] = useState<WeeklyData[]>([])
  const [campaignData, setCampaignData] = useState<CampaignResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [lastRefresh, setLastRefresh] = useState(new Date())

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

  const chartData = [...data].reverse()

  if (loading && data.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-gray-300 border-t-sky-600"></div>
        <p className="mt-4 text-[#6E6E73]">Loading Summary...</p>
      </div>
    )
  }

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <p className="text-gray-400 text-sm">Last 6 weeks performance</p>
        <div className="flex items-center gap-4">
          <span className="text-gray-500 text-sm">
            {lastRefresh.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
          </span>
          <button onClick={fetchData} disabled={loading} className="p-2 rounded-lg hover:bg-gray-800 transition-colors">
            <RefreshCw className={`h-5 w-5 text-gray-400 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Weekly Account Summary Table */}
      {data.length > 0 && (
        <div className="bg-[#1a1a1a] rounded-xl p-6 mb-6">
          <h2 className="text-white text-lg font-semibold mb-4">Weekly Account Summary</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-base">
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
                {[...data].reverse().map((row, idx) => (
                  <tr key={idx} className="border-b border-gray-800 hover:bg-gray-800/50 transition-colors">
                    <td className="py-3 px-4 text-white font-medium">{row.week.split(' - ')[0]}</td>
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
      )}

      {/* Main Chart - Spend & Conversions */}
      <div className="bg-gradient-to-br from-[#1a1a2e] to-[#16213e] rounded-xl p-6 mb-6 border border-white/5">
        <h2 className="text-white text-lg font-semibold mb-4">Weekly Spend & Conversions</h2>
        <div style={{ width: '100%', height: 420 }}>
          {chartData.length > 0 && (
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData} margin={{ top: 20, right: 40, left: 0, bottom: 5 }}>
                <defs>
                  <linearGradient id="cc-bing-spendGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6366f1" stopOpacity={1} />
                    <stop offset="100%" stopColor="#4338ca" stopOpacity={0.8} />
                  </linearGradient>
                  <linearGradient id="cc-bing-convAreaGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                  <filter id="cc-bing-glow">
                    <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                    <feMerge>
                      <feMergeNode in="coloredBlur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" vertical={false} />
                <XAxis dataKey="week" stroke="transparent" tick={{ fill: '#94a3b8', fontSize: 12 }} tickLine={false} />
                <YAxis
                  yAxisId="left"
                  stroke="transparent"
                  tick={{ fill: '#94a3b8', fontSize: 12 }}
                  tickLine={false}
                  tickFormatter={(value) => value >= 1000 ? `$${(value / 1000).toFixed(0)}k` : `$${value}`}
                  domain={[0, 15000]}
                />
                <YAxis yAxisId="right" orientation="right" stroke="transparent" tick={{ fill: '#94a3b8', fontSize: 12 }} tickLine={false} domain={[0, 60]} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                <Bar yAxisId="left" dataKey="spend" name="spend" fill="url(#cc-bing-spendGradient)" radius={[6, 6, 0, 0]}>
                  <LabelList dataKey="spend" position="insideTop" fill="#ffffff" fontSize={20} fontWeight={700} formatter={(value: any) => typeof value === 'number' ? `$${(value / 1000).toFixed(1)}k` : ''} />
                </Bar>
                <Area yAxisId="right" type="monotone" dataKey="conversions" fill="url(#cc-bing-convAreaGradient)" stroke="transparent" />
                <Line yAxisId="right" type="monotone" dataKey="conversions" name="conversions" stroke="#34d399" strokeWidth={3} dot={{ fill: '#1a1a2e', stroke: '#34d399', strokeWidth: 3, r: 6 }} activeDot={{ r: 8, fill: '#34d399' }} filter="url(#cc-bing-glow)">
                  <LabelList dataKey="conversions" position="top" fill="#34d399" fontSize={16} fontWeight={700} offset={14} />
                </Line>
              </ComposedChart>
            </ResponsiveContainer>
          )}
        </div>
        <div className="flex justify-center gap-6 mt-2">
          <div className="flex items-center gap-2"><div className="w-4 h-3 rounded-sm bg-gradient-to-b from-[#6366f1] to-[#4338ca]" /><span className="text-sm text-slate-400">Spend</span></div>
          <div className="flex items-center gap-2"><div className="w-4 h-0.5 bg-[#34d399] rounded-full" /><span className="text-sm text-slate-400">Conversions</span></div>
        </div>
      </div>

      {/* CTR & CPA Chart */}
      <div className="bg-gradient-to-br from-[#1a1a2e] to-[#16213e] rounded-xl p-6 mb-6 border border-white/5">
        <h2 className="text-white text-lg font-semibold mb-4">CTR & Cost Per Conversion</h2>
        <div style={{ width: '100%', height: 420 }}>
          {chartData.length > 0 && (
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData} margin={{ top: 30, right: 40, left: 0, bottom: 5 }}>
                <defs>
                  <linearGradient id="cc-bing-cpaGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#06b6d4" stopOpacity={1} />
                    <stop offset="100%" stopColor="#0891b2" stopOpacity={0.7} />
                  </linearGradient>
                  <linearGradient id="cc-bing-ctrAreaGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#f59e0b" stopOpacity={0} />
                  </linearGradient>
                  <filter id="cc-bing-glowAmber">
                    <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                    <feMerge>
                      <feMergeNode in="coloredBlur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" vertical={false} />
                <XAxis dataKey="week" stroke="transparent" tick={{ fill: '#94a3b8', fontSize: 12 }} tickLine={false} />
                <YAxis
                  yAxisId="left"
                  stroke="transparent"
                  tick={{ fill: '#94a3b8', fontSize: 12 }}
                  tickLine={false}
                  tickFormatter={(value) => `$${value}`}
                  domain={[0, 300]}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  stroke="transparent"
                  tick={{ fill: '#94a3b8', fontSize: 12 }}
                  tickLine={false}
                  tickFormatter={(value) => `${value}%`}
                  domain={[0, 40]}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                <Bar yAxisId="left" dataKey="cpa" name="cpa" fill="url(#cc-bing-cpaGradient)" radius={[6, 6, 0, 0]}>
                  <LabelList dataKey="cpa" position="insideTop" fill="#ffffff" fontSize={20} fontWeight={700} formatter={(value: any) => typeof value === 'number' ? `$${Math.round(value)}` : ''} />
                </Bar>
                <Area yAxisId="right" type="monotone" dataKey="ctr" fill="url(#cc-bing-ctrAreaGradient)" stroke="transparent" />
                <Line yAxisId="right" type="monotone" dataKey="ctr" name="ctr" stroke="#fbbf24" strokeWidth={3} dot={{ fill: '#1a1a2e', stroke: '#fbbf24', strokeWidth: 3, r: 6 }} activeDot={{ r: 8, fill: '#fbbf24' }} filter="url(#cc-bing-glowAmber)">
                  <LabelList dataKey="ctr" position="top" fill="#fbbf24" fontSize={16} fontWeight={700} offset={14} formatter={(value: any) => typeof value === 'number' ? `${value.toFixed(1)}%` : ''} />
                </Line>
              </ComposedChart>
            </ResponsiveContainer>
          )}
        </div>
        <div className="flex justify-center gap-6 mt-2">
          <div className="flex items-center gap-2"><div className="w-4 h-3 rounded-sm bg-gradient-to-b from-[#06b6d4] to-[#0891b2]" /><span className="text-sm text-slate-400">Cost Per Conversion</span></div>
          <div className="flex items-center gap-2"><div className="w-4 h-0.5 bg-[#fbbf24] rounded-full" /><span className="text-sm text-slate-400">CTR</span></div>
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
                    {campaignData.weeks[0]?.date_range.split(' - ')[0] || 'Last Week'}
                  </th>
                  <th className="text-center py-3 px-4 text-gray-400 font-medium" colSpan={2}>
                    {campaignData.weeks[1]?.date_range.split(' - ')[0] || '2 Weeks Ago'}
                  </th>
                  <th className="text-center py-3 px-4 text-gray-400 font-medium" colSpan={2}>
                    {campaignData.weeks[2]?.date_range.split(' - ')[0] || '3 Weeks Ago'}
                  </th>
                  <th className="text-center py-3 px-4 text-gray-400 font-medium" colSpan={2}>
                    {campaignData.weeks[3]?.date_range.split(' - ')[0] || '4 Weeks Ago'}
                  </th>
                </tr>
                <tr className="border-b border-gray-700">
                  <th className="text-left py-2 px-4 text-gray-500 text-xs"></th>
                  {[0, 1, 2, 3].map((i) => (
                    <React.Fragment key={i}>
                      <th className="text-right py-2 px-2 text-gray-500 text-xs">Spend</th>
                      <th className="text-right py-2 px-2 text-gray-500 text-xs">Conv</th>
                    </React.Fragment>
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
                        <React.Fragment key={weekIdx}>
                          <td className="text-right py-3 px-2 text-gray-300">
                            {weekData ? formatCurrency(weekData.cost) : '-'}
                          </td>
                          <td className="text-right py-3 px-2 text-gray-300">
                            {weekData ? formatNumber(weekData.conversions) : '-'}
                          </td>
                        </React.Fragment>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Detailed Campaign Metrics - Last Week */}
          <h3 className="text-white text-md font-semibold mt-8 mb-4">Detailed Metrics - {campaignData.weeks[0]?.date_range.split(' - ')[0] || 'Last Week'}</h3>
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
    </>
  )
}
