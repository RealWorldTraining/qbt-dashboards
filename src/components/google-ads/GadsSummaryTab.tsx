"use client"

import React, { useState, useEffect } from "react"
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
  avg_cpc: number
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

const METRIC_COLORS: Record<string, string> = {
  spend: "#ef4444",
  impressions: "#3b82f6",
  clicks: "#22c55e",
  conversions: "#22c55e",
  ctr: "#8b5cf6",
  avg_cpc: "#a855f7",
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
  avg_cpc: "Avg CPC",
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
  return Math.round(value) + "%"
}

function formatConvRate(value: number): string {
  return value.toFixed(1) + "%"
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
          } else if (entry.name === "ctr") {
            formattedValue = formatPercent(entry.value)
          } else if (entry.name === "conv_rate") {
            formattedValue = formatConvRate(entry.value)
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

export function GadsSummaryTab() {
  const [campaignData, setCampaignData] = useState<CampaignResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedWeekIndex, setSelectedWeekIndex] = useState(0)

  const fetchData = async () => {
    setLoading(true)
    try {
      const campaignRes = await fetch('/api/campaigns')
      if (campaignRes.ok) {
        const json: CampaignResponse = await campaignRes.json()
        setCampaignData(json)
      }
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

  const metrics = ["spend", "impressions", "clicks", "conversions", "ctr", "conv_rate", "cpa"] as const

  const getDeviceMetrics = (deviceType: 'Desktop' | 'Mobile', weekIndex: number) => {
    if (!campaignData) return null
    const campaigns = campaignData.campaigns.filter(c =>
      c.name.toLowerCase().includes(deviceType.toLowerCase())
    )
    let spend = 0, impressions = 0, clicks = 0, conversions = 0
    campaigns.forEach(campaign => {
      const weekData = campaign.data[weekIndex]
      if (weekData) {
        spend += weekData.cost
        impressions += weekData.impressions
        clicks += weekData.clicks
        conversions += weekData.conversions
      }
    })
    const ctr = impressions > 0 ? (clicks / impressions) * 100 : 0
    const conv_rate = clicks > 0 ? (conversions / clicks) * 100 : 0
    const cpa = conversions > 0 ? spend / conversions : 0
    return { spend, impressions, clicks, conversions, ctr, conv_rate, cpa }
  }

  const derivedWeeklyData = campaignData ? campaignData.weeks.map((week, weekIndex) => {
    let spend = 0, impressions = 0, clicks = 0, conversions = 0
    campaignData.campaigns.forEach(campaign => {
      const d = campaign.data[weekIndex]
      if (d) {
        spend += d.cost
        impressions += d.impressions
        clicks += d.clicks
        conversions += d.conversions
      }
    })
    return {
      week: week.date_range.split(' - ')[0],
      week_start: week.week,
      spend: Math.round(spend),
      impressions,
      clicks,
      conversions: Math.round(conversions),
      ctr: impressions > 0 ? (clicks / impressions) * 100 : 0,
      avg_cpc: clicks > 0 ? spend / clicks : 0,
      conv_rate: clicks > 0 ? (conversions / clicks) * 100 : 0,
      cpa: conversions > 0 ? spend / conversions : 0,
      roas: spend > 0 ? (conversions * 500) / spend : 0,
    }
  }) : []

  const deriveDeviceWeeklyData = (deviceType: 'Desktop' | 'Mobile') => {
    if (!campaignData) return []
    const campaigns = campaignData.campaigns.filter(c =>
      c.name.toLowerCase().includes(deviceType.toLowerCase())
    )
    return campaignData.weeks.map((week, weekIndex) => {
      let spend = 0, impressions = 0, clicks = 0, conversions = 0
      campaigns.forEach(campaign => {
        const d = campaign.data[weekIndex]
        if (d) {
          spend += d.cost
          impressions += d.impressions
          clicks += d.clicks
          conversions += d.conversions
        }
      })
      return {
        week: week.date_range.split(' - ')[0],
        week_start: week.week,
        spend: Math.round(spend),
        impressions,
        clicks,
        conversions: Math.round(conversions),
        ctr: impressions > 0 ? (clicks / impressions) * 100 : 0,
        conv_rate: clicks > 0 ? (conversions / clicks) * 100 : 0,
        cpa: conversions > 0 ? spend / conversions : 0,
      }
    })
  }

  const desktopWeeklyData = deriveDeviceWeeklyData('Desktop')
  const mobileWeeklyData = deriveDeviceWeeklyData('Mobile')

  const chartData = [...derivedWeeklyData].reverse()

  if (loading && !campaignData) {
    return (
      <div className="text-center py-16">
        <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-gray-300 border-t-blue-600"></div>
        <p className="mt-4 text-[#6E6E73]">Loading Summary...</p>
      </div>
    )
  }

  return (
    <>
      {/* Weekly Data Tables: Account | Desktop | Mobile */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { title: 'Account', data: [...derivedWeeklyData].reverse() },
          { title: 'Desktop', data: [...desktopWeeklyData].reverse() },
          { title: 'Mobile', data: [...mobileWeeklyData].reverse() },
        ].map(({ title, data: tableData }) => (
          <div key={title} className="bg-[#1a1a1a] rounded-xl p-4">
            <h2 className="text-white text-lg font-semibold mb-3">{title}</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-base">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="text-left py-2 px-2 text-gray-400 font-medium">Week</th>
                    <th className="text-right py-2 px-2 font-medium" style={{ color: METRIC_COLORS.spend }}>Spend</th>
                    <th className="text-right py-2 px-2 font-medium" style={{ color: METRIC_COLORS.impressions }}>Impr</th>
                    <th className="text-right py-2 px-2 font-medium" style={{ color: METRIC_COLORS.clicks }}>Clicks</th>
                    <th className="text-right py-2 px-2 font-medium" style={{ color: METRIC_COLORS.ctr }}>CTR</th>
                    <th className="text-right py-2 px-2 font-medium" style={{ color: METRIC_COLORS.conversions }}>Conv</th>
                    <th className="text-right py-2 px-2 font-medium" style={{ color: METRIC_COLORS.conv_rate }}>Conv %</th>
                    <th className="text-right py-2 px-2 font-medium" style={{ color: METRIC_COLORS.cpa }}>CPA</th>
                  </tr>
                </thead>
                <tbody>
                  {tableData.map((row, idx) => (
                    <tr key={idx} className="border-b border-gray-800 hover:bg-gray-800/50 transition-colors">
                      <td className="py-2 px-2 text-white font-medium whitespace-nowrap">{row.week}</td>
                      <td className="text-right py-2 px-2 text-gray-300">{formatCurrency(row.spend)}</td>
                      <td className="text-right py-2 px-2 text-gray-300">{formatNumber(row.impressions)}</td>
                      <td className="text-right py-2 px-2 text-gray-300">{formatNumber(row.clicks)}</td>
                      <td className="text-right py-2 px-2 text-gray-300">{formatPercent(row.ctr)}</td>
                      <td className="text-right py-2 px-2 text-gray-300">{formatNumber(row.conversions)}</td>
                      <td className="text-right py-2 px-2 text-gray-300">{formatConvRate(row.conv_rate)}</td>
                      <td className="text-right py-2 px-2 text-gray-300">{formatCurrency(row.cpa)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>

      {/* Main Chart - Spend & Conversions */}
      <div className="bg-gradient-to-br from-[#1a1a2e] to-[#16213e] rounded-xl p-6 mb-6 border border-white/5">
        <h2 className="text-white text-lg font-semibold mb-4">Weekly Spend & Conversions</h2>
        <div style={{ width: '100%', height: 420 }}>
          {chartData.length > 0 && (
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData} margin={{ top: 20, right: 40, left: 0, bottom: 5 }}>
                <defs>
                  <linearGradient id="cc-gads-spendGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6366f1" stopOpacity={1} />
                    <stop offset="100%" stopColor="#4338ca" stopOpacity={0.8} />
                  </linearGradient>
                  <linearGradient id="cc-gads-convAreaGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                  <filter id="cc-gads-glow">
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
                  domain={[0, 30000]}
                />
                <YAxis yAxisId="right" orientation="right" stroke="transparent" tick={{ fill: '#94a3b8', fontSize: 12 }} tickLine={false} domain={[0, 150]} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                <Bar yAxisId="left" dataKey="spend" name="spend" fill="url(#cc-gads-spendGradient)" radius={[6, 6, 0, 0]}>
                  <LabelList dataKey="spend" position="insideTop" fill="#ffffff" fontSize={20} fontWeight={700} formatter={(value: any) => typeof value === 'number' ? `$${(value / 1000).toFixed(0)}k` : ''} />
                </Bar>
                <Area yAxisId="right" type="monotone" dataKey="conversions" fill="url(#cc-gads-convAreaGradient)" stroke="transparent" />
                <Line yAxisId="right" type="monotone" dataKey="conversions" name="conversions" stroke="#34d399" strokeWidth={3} dot={{ fill: '#1a1a2e', stroke: '#34d399', strokeWidth: 3, r: 6 }} activeDot={{ r: 8, fill: '#34d399' }} filter="url(#cc-gads-glow)">
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

      {/* CPC & CPA Chart */}
      <div className="bg-gradient-to-br from-[#1a1a2e] to-[#16213e] rounded-xl p-6 mb-6 border border-white/5">
        <h2 className="text-white text-lg font-semibold mb-4">Avg CPC & Cost Per Conversion</h2>
        <div style={{ width: '100%', height: 420 }}>
          {chartData.length > 0 && (
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData} margin={{ top: 30, right: 40, left: 0, bottom: 5 }}>
                <defs>
                  <linearGradient id="cc-gads-cpaGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#06b6d4" stopOpacity={1} />
                    <stop offset="100%" stopColor="#0891b2" stopOpacity={0.7} />
                  </linearGradient>
                  <linearGradient id="cc-gads-cpcAreaGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#f59e0b" stopOpacity={0} />
                  </linearGradient>
                  <filter id="cc-gads-glowAmber">
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
                  domain={[0, 400]}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  stroke="transparent"
                  tick={{ fill: '#94a3b8', fontSize: 12 }}
                  tickLine={false}
                  tickFormatter={(value) => `$${value.toFixed(2)}`}
                  domain={[0, 3]}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                <Bar yAxisId="left" dataKey="cpa" name="cpa" fill="url(#cc-gads-cpaGradient)" radius={[6, 6, 0, 0]}>
                  <LabelList dataKey="cpa" position="insideTop" fill="#ffffff" fontSize={20} fontWeight={700} formatter={(value: any) => typeof value === 'number' ? `$${Math.round(value)}` : ''} />
                </Bar>
                <Area yAxisId="right" type="monotone" dataKey="avg_cpc" fill="url(#cc-gads-cpcAreaGradient)" stroke="transparent" />
                <Line yAxisId="right" type="monotone" dataKey="avg_cpc" name="avg_cpc" stroke="#fbbf24" strokeWidth={3} dot={{ fill: '#1a1a2e', stroke: '#fbbf24', strokeWidth: 3, r: 6 }} activeDot={{ r: 8, fill: '#fbbf24' }} filter="url(#cc-gads-glowAmber)">
                  <LabelList dataKey="avg_cpc" position="top" fill="#fbbf24" fontSize={16} fontWeight={700} offset={14} formatter={(value: any) => typeof value === 'number' ? `$${value.toFixed(2)}` : ''} />
                </Line>
              </ComposedChart>
            </ResponsiveContainer>
          )}
        </div>
        <div className="flex justify-center gap-6 mt-2">
          <div className="flex items-center gap-2"><div className="w-4 h-3 rounded-sm bg-gradient-to-b from-[#06b6d4] to-[#0891b2]" /><span className="text-sm text-slate-400">Cost Per Conversion</span></div>
          <div className="flex items-center gap-2"><div className="w-4 h-0.5 bg-[#fbbf24] rounded-full" /><span className="text-sm text-slate-400">Avg CPC</span></div>
        </div>
      </div>

      {/* Campaign Performance Section */}
      {campaignData && campaignData.campaigns.length > 0 && (() => {
        const campaignOrder = [
          'Certification-Desktop', 'Training-Desktop', 'Classes-Desktop', 'Courses-Desktop',
          'Certification-Mobile', 'Training-Mobile', 'Classes-Mobile', 'Courses-Mobile'
        ]
        const sortedCampaigns = [...campaignData.campaigns].sort((a, b) => {
          const aIdx = campaignOrder.findIndex(name => a.name.toLowerCase().includes(name.toLowerCase().split('-')[0]) && a.name.toLowerCase().includes(name.toLowerCase().split('-')[1]))
          const bIdx = campaignOrder.findIndex(name => b.name.toLowerCase().includes(name.toLowerCase().split('-')[0]) && b.name.toLowerCase().includes(name.toLowerCase().split('-')[1]))
          if (aIdx === -1) return 1
          if (bIdx === -1) return -1
          return aIdx - bIdx
        })

        return (
          <div className="bg-[#1a1a1a] rounded-xl p-6">
            <h2 className="text-white text-lg font-semibold mb-4">Campaign Performance (Last 4 Weeks)</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="text-left py-3 px-4 text-gray-400 font-medium">Campaign</th>
                    <th className="text-center py-3 px-4 text-gray-400 font-medium bg-gray-800/40" colSpan={3}>
                      {campaignData.weeks[3]?.date_range || '4 Weeks Ago'}
                    </th>
                    <th className="text-center py-3 px-4 text-gray-400 font-medium" colSpan={3}>
                      {campaignData.weeks[2]?.date_range || '3 Weeks Ago'}
                    </th>
                    <th className="text-center py-3 px-4 text-gray-400 font-medium bg-gray-800/40" colSpan={3}>
                      {campaignData.weeks[1]?.date_range || '2 Weeks Ago'}
                    </th>
                    <th className="text-center py-3 px-4 text-gray-400 font-medium" colSpan={3}>
                      {campaignData.weeks[0]?.date_range || 'Last Week'}
                    </th>
                  </tr>
                  <tr className="border-b border-gray-700">
                    <th className="text-left py-2 px-4 text-gray-500 text-xs"></th>
                    {[3, 2, 1, 0].map((i) => {
                      const bgClass = i % 2 === 1 ? 'bg-gray-800/40' : ''
                      return (
                        <React.Fragment key={`header-${i}`}>
                          <th className={`text-right py-2 px-2 text-gray-500 text-xs ${bgClass}`}>Spend</th>
                          <th className={`text-right py-2 px-2 text-gray-500 text-xs ${bgClass}`}>Conv</th>
                          <th className={`text-right py-2 px-2 text-gray-500 text-xs ${bgClass}`}>CPA</th>
                        </React.Fragment>
                      )
                    })}
                  </tr>
                </thead>
                <tbody>
                  {sortedCampaigns.map((campaign, idx) => (
                    <tr key={idx} className="border-b border-gray-800 hover:bg-gray-800/50 transition-colors">
                      <td className="py-3 px-4 text-white font-medium">{campaign.name}</td>
                      {[3, 2, 1, 0].map((weekIdx) => {
                        const weekData = campaign.data[weekIdx]
                        const cpa = weekData && weekData.conversions > 0 ? weekData.cost / weekData.conversions : null
                        const bgClass = weekIdx % 2 === 1 ? 'bg-gray-800/40' : ''
                        return (
                          <React.Fragment key={`${idx}-${weekIdx}`}>
                            <td className={`text-right py-3 px-2 text-gray-300 ${bgClass}`}>
                              {weekData ? formatCurrency(weekData.cost) : '-'}
                            </td>
                            <td className={`text-right py-3 px-2 text-gray-300 ${bgClass}`}>
                              {weekData ? formatNumber(weekData.conversions) : '-'}
                            </td>
                            <td className={`text-right py-3 px-2 text-gray-300 ${bgClass}`}>
                              {cpa !== null ? formatCurrency(cpa) : '\u2014'}
                            </td>
                          </React.Fragment>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      })()}
    </>
  )
}
