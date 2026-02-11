"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { RefreshCw, TrendingUp, Target, Users } from "lucide-react"
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
  LineChart,
  Area,
} from "recharts"
import { Doughnut, Bar as ChartJSBar } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  ArcElement,
  CategoryScale,
  LinearScale,
  PointElement,
  BarElement,
  Title,
  Tooltip as ChartJSTooltip,
  Legend as ChartJSLegend
} from 'chart.js'

ChartJS.register(
  ArcElement,
  CategoryScale,
  LinearScale,
  PointElement,
  BarElement,
  Title,
  ChartJSTooltip,
  ChartJSLegend
)

// ─── Tab types ──────────────────────────────────────────────
type TabType = "summary" | "cpc" | "age"

const tabs: { id: TabType; label: string; icon: typeof TrendingUp }[] = [
  { id: "summary", label: "Summary", icon: TrendingUp },
  { id: "cpc", label: "CPC Optimizer", icon: Target },
  { id: "age", label: "Age Analysis", icon: Users },
]

// ─── Summary tab types & helpers ────────────────────────────
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

// ─── CPC tab types ──────────────────────────────────────────
interface CPCRecommendation {
  analysisDate: string
  campaign: string
  keyword: string
  device: string
  action: string
  impressions: number
  clicks: number
  cost: number
  conversions: number
  costPerConv: number
  currentMaxCPC: number
  suggestedMaxCPC: number
  changeAmount: number
  signals: string
  searchImprShare: number
  searchImprClass: string
  imprTopPct: number
  imprTopClass: string
  clickShare: number
  clickShareClass: string
  imprAbsTopPct: number
  imprAbsTopClass: string
  searchLostIsRank: number
  searchLostClass: string
  headroomPct: number
  headroomClass: string
  avgCPC: number
  trendSummary: string
  primarySignal: string
}

interface CPCData {
  recommendations: CPCRecommendation[]
  summary: {
    total: number
    actions: Record<string, number>
    totalBidIncrease: number
    totalBidDecrease: number
    lastUpdated: string
  }
}

const classColors: Record<string, string> = {
  BLUE: '#3B82F6',
  GREEN: '#10B981',
  YELLOW: '#F59E0B',
  RED: '#EF4444'
}

// ─── Age tab types ──────────────────────────────────────────
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

interface AgeApiResponse {
  chartData: ChartData
  ytd2026Summary: YTDAgeSummary[]
  deviceFilter: string
  last_updated: string
}

const AGE_COLORS: Record<string, string> = {
  '18-24': '#3b82f6',
  '25-34': '#10b981',
  '35-44': '#f59e0b',
  '45-54': '#ef4444',
  '55-64': '#8b5cf6',
  '>64': '#ec4899',
}

const DEVICE_OPTIONS = ['All', 'Computers', 'Mobile', 'Tablets']

// ═══════════════════════════════════════════════════════════════
// SUMMARY TAB
// ═══════════════════════════════════════════════════════════════
function SummaryTab() {
  const [data, setData] = useState<WeeklyData[]>([])
  const [campaignData, setCampaignData] = useState<CampaignResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [lastRefresh, setLastRefresh] = useState(new Date())
  const [selectedWeekIndex, setSelectedWeekIndex] = useState(0)

  const fetchData = async () => {
    setLoading(true)
    try {
      const [weeklyRes, campaignRes] = await Promise.all([
        fetch('/api/google-ads-weekly'),
        fetch('/api/campaigns')
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

  const currentDesktop = getDeviceMetrics('Desktop', selectedWeekIndex)
  const previousDesktop = getDeviceMetrics('Desktop', selectedWeekIndex + 1)
  const currentMobile = getDeviceMetrics('Mobile', selectedWeekIndex)
  const previousMobile = getDeviceMetrics('Mobile', selectedWeekIndex + 1)

  const getTotalMetrics = (weekIndex: number) => {
    if (!campaignData) return null
    let spend = 0, impressions = 0, clicks = 0, conversions = 0
    campaignData.campaigns.forEach(campaign => {
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

  const currentTotal = getTotalMetrics(selectedWeekIndex)
  const previousTotal = getTotalMetrics(selectedWeekIndex + 1)

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
      week: week.date_range,
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
        week: week.date_range,
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

  const renderMetricCards = (
    label: string,
    current: Record<string, number> | null,
    previous: Record<string, number> | null,
    keyPrefix: string,
    sizeClass: 'lg' | 'sm'
  ) => {
    if (!current) return null
    return (
      <div className={sizeClass === 'sm' ? 'mb-2' : 'mb-6'}>
        {label && <div className="text-white text-sm font-semibold mb-2 uppercase tracking-wide">{label}</div>}
        <div className="grid grid-cols-7 gap-3">
          {metrics.map((metric) => {
            const cur = current[metric] as number
            const prev = (previous?.[metric] as number) || 0
            const absoluteChange = cur - prev
            const color = METRIC_COLORS[metric]

            let displayValue = formatNumber(cur)
            if (metric === "spend" || metric === "cpa") displayValue = formatCurrency(cur)
            else if (metric === "ctr") displayValue = formatPercent(cur)
            else if (metric === "conv_rate") displayValue = cur.toFixed(2) + "%"

            let changeDisplay = ""
            if (metric === "spend" || metric === "cpa") {
              changeDisplay = (absoluteChange >= 0 ? '+' : '-') + formatCurrency(Math.abs(absoluteChange))
            } else if (metric === "ctr" || metric === "conv_rate") {
              changeDisplay = (absoluteChange >= 0 ? '+' : '') + absoluteChange.toFixed(1) + "%"
            } else {
              changeDisplay = (absoluteChange >= 0 ? '+' : '') + formatNumber(absoluteChange)
            }

            const isInverse = metric === "cpa"
            const changeColor = isInverse
              ? (absoluteChange <= 0 ? 'text-green-500' : 'text-red-500')
              : (absoluteChange >= 0 ? 'text-green-500' : 'text-red-500')

            return (
              <div key={`${keyPrefix}-${metric}`} className="bg-[#1a1a1a] rounded-lg overflow-hidden">
                <div className="h-1" style={{ backgroundColor: color }} />
                <div className={sizeClass === 'sm' ? 'p-3' : 'p-4'}>
                  <div className="text-gray-400 text-xs mb-1 uppercase tracking-wide">
                    {METRIC_LABELS[metric]}
                  </div>
                  <div className={`text-white font-bold mb-1 ${sizeClass === 'sm' ? 'text-lg' : 'text-3xl'}`}>
                    {displayValue}
                  </div>
                  <div className={`${sizeClass === 'sm' ? 'text-xs' : 'text-sm'} ${changeColor}`}>
                    {changeDisplay} vs prev
                  </div>
                </div>
              </div>
            )
          })}
        </div>
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
            <h2 className="text-white text-base font-semibold mb-3">{title}</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
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
                  <linearGradient id="gads-spendGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6366f1" stopOpacity={1} />
                    <stop offset="100%" stopColor="#4338ca" stopOpacity={0.8} />
                  </linearGradient>
                  <linearGradient id="gads-convAreaGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                  <filter id="gads-glow">
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
                <Bar yAxisId="left" dataKey="spend" name="spend" fill="url(#gads-spendGradient)" radius={[6, 6, 0, 0]}>
                  <LabelList dataKey="spend" position="insideTop" fill="#ffffff" fontSize={20} fontWeight={700} formatter={(value: any) => typeof value === 'number' ? `$${(value / 1000).toFixed(0)}k` : ''} />
                </Bar>
                <Area yAxisId="right" type="monotone" dataKey="conversions" fill="url(#gads-convAreaGradient)" stroke="transparent" />
                <Line yAxisId="right" type="monotone" dataKey="conversions" name="conversions" stroke="#34d399" strokeWidth={3} dot={{ fill: '#1a1a2e', stroke: '#34d399', strokeWidth: 3, r: 6 }} activeDot={{ r: 8, fill: '#34d399' }} filter="url(#gads-glow)">
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
                  <linearGradient id="gads-cpaGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#06b6d4" stopOpacity={1} />
                    <stop offset="100%" stopColor="#0891b2" stopOpacity={0.7} />
                  </linearGradient>
                  <linearGradient id="gads-cpcAreaGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#f59e0b" stopOpacity={0} />
                  </linearGradient>
                  <filter id="gads-glowAmber">
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
                <Bar yAxisId="left" dataKey="cpa" name="cpa" fill="url(#gads-cpaGradient)" radius={[6, 6, 0, 0]}>
                  <LabelList dataKey="cpa" position="insideTop" fill="#ffffff" fontSize={20} fontWeight={700} formatter={(value: any) => typeof value === 'number' ? `$${Math.round(value)}` : ''} />
                </Bar>
                <Area yAxisId="right" type="monotone" dataKey="avg_cpc" fill="url(#gads-cpcAreaGradient)" stroke="transparent" />
                <Line yAxisId="right" type="monotone" dataKey="avg_cpc" name="avg_cpc" stroke="#fbbf24" strokeWidth={3} dot={{ fill: '#1a1a2e', stroke: '#fbbf24', strokeWidth: 3, r: 6 }} activeDot={{ r: 8, fill: '#fbbf24' }} filter="url(#gads-glowAmber)">
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
                              {cpa !== null ? formatCurrency(cpa) : '—'}
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

      {/* Footer */}
      <div className="text-center mt-6">
        <div className="flex items-center justify-center gap-2">
          <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
          <span className="text-gray-500 text-xs">Data from Google Ads</span>
        </div>
      </div>
    </>
  )
}

// ═══════════════════════════════════════════════════════════════
// CPC TAB
// ═══════════════════════════════════════════════════════════════
function CPCTab() {
  const [data, setData] = useState<CPCData | null>(null)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('ALL')

  useEffect(() => {
    fetch('/api/cpc-recommendations').then(res => res.json())
      .then(recommendations => {
        setData(recommendations)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="text-center py-16">
        <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-gray-300 border-t-green-600"></div>
        <p className="mt-4 text-gray-400">Loading CPC recommendations...</p>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="text-center py-16">
        <p className="text-red-500">Error loading data</p>
      </div>
    )
  }

  const campaignOrder = [
    'Certification-Desktop', 'Training-Desktop', 'Courses-Desktop', 'Classes-Desktop',
    'Certification-Mobile', 'Training-Mobile', 'Courses-Mobile', 'Classes-Mobile'
  ]

  const getCampaignSortKey = (campaign: string): number => {
    const index = campaignOrder.findIndex(c => campaign.includes(c))
    return index === -1 ? 999 : index
  }

  const filtered = (filter === 'ALL'
    ? data.recommendations
    : data.recommendations.filter(r => r.action === filter)
  ).sort((a, b) => getCampaignSortKey(a.campaign) - getCampaignSortKey(b.campaign))

  const actionData = {
    labels: Object.keys(data.summary.actions),
    datasets: [{
      data: Object.values(data.summary.actions),
      backgroundColor: ['#10B981', '#EF4444', '#6B7280', '#F59E0B'],
      borderWidth: 0
    }]
  }

  const bidChangeRecs = data.recommendations
    .filter(r => r.action === 'RAISE' || r.action === 'LOWER')
    .sort((a, b) => b.changeAmount - a.changeAmount)
    .slice(0, 15)

  const bidChangeData = {
    labels: bidChangeRecs.map(r => r.keyword.length > 25 ? r.keyword.slice(0, 22) + '...' : r.keyword),
    datasets: [{
      label: 'Bid Change',
      data: bidChangeRecs.map(r => r.changeAmount),
      backgroundColor: bidChangeRecs.map(r => r.action === 'RAISE' ? '#10B981' : '#EF4444'),
      borderRadius: 4,
      barThickness: 18,
    }]
  }

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-white text-xl font-bold">Max CPC Recommendations</h2>
        <div className="flex items-center gap-4">
          <a
            href="/cpc/trends"
            className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg text-sm font-medium transition-colors"
          >
            View Google Ads Trends
          </a>
          <span className="text-gray-500 text-sm">Data from: {(() => {
            const today = new Date()
            const currentDay = today.getDay()
            const daysToMonday = currentDay === 0 ? -6 : 1 - currentDay
            const thisMonday = new Date(today)
            thisMonday.setDate(today.getDate() + daysToMonday)
            const priorMonday = new Date(thisMonday)
            priorMonday.setDate(thisMonday.getDate() - 7)
            const priorSunday = new Date(priorMonday)
            priorSunday.setDate(priorMonday.getDate() + 6)
            const formatDate = (d: Date) => {
              const month = String(d.getMonth() + 1).padStart(2, '0')
              const day = String(d.getDate()).padStart(2, '0')
              return `${month}/${day}`
            }
            return `${formatDate(priorMonday)} - ${formatDate(priorSunday)}`
          })()}</span>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div
          onClick={() => setFilter('ALL')}
          className={`bg-[#1a1a1a] rounded-lg p-4 cursor-pointer transition-all ${filter === 'ALL' ? 'ring-2 ring-green-500' : 'hover:bg-gray-900'}`}
        >
          <div className="text-gray-400 text-xs mb-1">TOTAL KEYWORDS</div>
          <div className="text-white text-3xl font-bold">{data.summary.total}</div>
        </div>
        <div
          onClick={() => setFilter('RAISE')}
          className={`bg-[#1a1a1a] rounded-lg p-4 cursor-pointer transition-all ${filter === 'RAISE' ? 'ring-2 ring-green-500' : 'hover:bg-gray-900'}`}
        >
          <div className="text-gray-400 text-xs mb-1">RAISE BIDS</div>
          <div className="text-green-500 text-3xl font-bold">{data.summary.actions.RAISE || 0}</div>
          <div className="text-gray-500 text-xs">+${data.summary.totalBidIncrease.toFixed(2)}</div>
        </div>
        <div
          onClick={() => setFilter('LOWER')}
          className={`bg-[#1a1a1a] rounded-lg p-4 cursor-pointer transition-all ${filter === 'LOWER' ? 'ring-2 ring-green-500' : 'hover:bg-gray-900'}`}
        >
          <div className="text-gray-400 text-xs mb-1">LOWER BIDS</div>
          <div className="text-red-500 text-3xl font-bold">{data.summary.actions.LOWER || 0}</div>
          <div className="text-gray-500 text-xs">-${data.summary.totalBidDecrease.toFixed(2)}</div>
        </div>
        <div
          onClick={() => setFilter('HOLD')}
          className={`bg-[#1a1a1a] rounded-lg p-4 cursor-pointer transition-all ${filter === 'HOLD' ? 'ring-2 ring-green-500' : 'hover:bg-gray-900'}`}
        >
          <div className="text-gray-400 text-xs mb-1">HOLD</div>
          <div className="text-gray-400 text-3xl font-bold">{data.summary.actions.HOLD || 0}</div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-[#1a1a1a] rounded-lg p-6">
          <h3 className="text-gray-300 text-sm font-medium mb-4">ACTION DISTRIBUTION</h3>
          <div className="h-[280px] flex items-center justify-center">
            <Doughnut data={actionData} options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: { position: 'bottom', labels: { color: '#9CA3AF', font: { size: 11 } } }
              }
            }} />
          </div>
        </div>
        <div className="bg-[#1a1a1a] rounded-lg p-6">
          <h3 className="text-gray-300 text-sm font-medium mb-4">BID CHANGES BY KEYWORD</h3>
          <div className="h-[280px]">
            <ChartJSBar data={bidChangeData} options={{
              responsive: true,
              maintainAspectRatio: false,
              indexAxis: 'y' as const,
              plugins: {
                legend: { display: false },
                tooltip: {
                  backgroundColor: '#1F2937',
                  titleColor: '#F3F4F6',
                  bodyColor: '#D1D5DB',
                  callbacks: {
                    label: (ctx: any) => {
                      const val = ctx.parsed.x
                      return `${val >= 0 ? '+' : ''}$${val.toFixed(2)}`
                    }
                  }
                }
              },
              scales: {
                x: {
                  grid: { color: '#1F2937' },
                  ticks: { color: '#9CA3AF', callback: (v: any) => (v >= 0 ? '+$' : '-$') + Math.abs(v).toFixed(2) }
                },
                y: {
                  grid: { display: false },
                  ticks: { color: '#D1D5DB', font: { size: 11 } }
                }
              }
            }} />
          </div>
        </div>
      </div>

      {/* Filter */}
      <div className="mb-4 flex gap-2">
        {['ALL', 'RAISE', 'LOWER', 'HOLD'].map(action => (
          <button
            key={action}
            onClick={() => setFilter(action)}
            className={`px-4 py-2 rounded text-sm font-medium ${
              filter === action
                ? 'bg-green-600 text-white'
                : 'bg-[#1a1a1a] text-gray-400 hover:bg-gray-800'
            }`}
          >
            {action}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-[#1a1a1a] rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-black">
              <tr className="text-gray-400 text-xs">
                <th className="text-left p-3">KEYWORD</th>
                <th className="text-left p-3">CAMPAIGN</th>
                <th className="text-right p-3">IMPR</th>
                <th className="text-right p-3">CLICKS</th>
                <th className="text-right p-3">CTR</th>
                <th className="text-right p-3">COST</th>
                <th className="text-right p-3">CONV</th>
                <th className="text-right p-3">CPA</th>
                <th className="text-center p-3">ACTION</th>
                <th className="text-right p-3">CURRENT</th>
                <th className="text-right p-3">SUGGESTED</th>
                <th className="text-right p-3">CHANGE</th>
                <th className="text-center p-3">SIGNALS</th>
                <th className="text-center p-3">IMPR SHARE</th>
                <th className="text-center p-3">TOP%</th>
                <th className="text-center p-3">CLICK SHARE</th>
                <th className="text-center p-3">ABS TOP%</th>
                <th className="text-center p-3">LOST IS</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((rec, i) => {
                const isTrainingOrClasses = rec.campaign.includes('Training-') || rec.campaign.includes('Classes-')
                const bgClass = isTrainingOrClasses ? 'bg-gray-800' : ''
                return (
                  <tr key={i} className={`border-t border-gray-800 hover:bg-gray-700 ${bgClass}`}>
                    <td className="p-3 text-gray-300">{rec.keyword}</td>
                    <td className="p-3 text-gray-500 text-xs">{rec.campaign}</td>
                    <td className="p-3 text-right text-gray-400">{rec.impressions.toLocaleString()}</td>
                    <td className="p-3 text-right text-gray-400">{rec.clicks.toLocaleString()}</td>
                    <td className="p-3 text-right text-gray-400">
                      {rec.impressions > 0 ? ((rec.clicks / rec.impressions) * 100).toFixed(1) : '0.0'}%
                    </td>
                    <td className="p-3 text-right text-gray-400">${Math.round(rec.cost)}</td>
                    <td className="p-3 text-right text-gray-400">{Math.round(rec.conversions)}</td>
                    <td className="p-3 text-right text-gray-400">${Math.round(rec.costPerConv)}</td>
                    <td className="p-3 text-center">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        rec.action === 'RAISE' ? 'bg-green-900 text-green-300' :
                        rec.action === 'LOWER' ? 'bg-red-900 text-red-300' :
                        'bg-gray-800 text-gray-400'
                      }`}>
                        {rec.action}
                      </span>
                    </td>
                    <td className="p-3 text-right text-gray-300">${rec.currentMaxCPC.toFixed(2)}</td>
                    <td className="p-3 text-right text-white font-medium">${rec.suggestedMaxCPC.toFixed(2)}</td>
                    <td className={`p-3 text-right font-medium ${rec.changeAmount > 0 ? 'text-green-500' : 'text-red-500'}`}>
                      {rec.changeAmount > 0 ? '+' : ''}${rec.changeAmount.toFixed(2)}
                    </td>
                    <td className="p-3 text-center text-gray-300 text-xs">{rec.signals}</td>
                    <td className="p-3 text-center">
                      <div className="w-12 h-6 rounded mx-auto flex items-center justify-center text-xs font-medium"
                           style={{ backgroundColor: classColors[rec.searchImprClass], color: 'white' }}>
                        {rec.searchImprShare.toFixed(0)}%
                      </div>
                    </td>
                    <td className="p-3 text-center">
                      <div className="w-12 h-6 rounded mx-auto flex items-center justify-center text-xs font-medium"
                           style={{ backgroundColor: classColors[rec.imprTopClass], color: 'white' }}>
                        {rec.imprTopPct.toFixed(0)}%
                      </div>
                    </td>
                    <td className="p-3 text-center">
                      <div className="w-12 h-6 rounded mx-auto flex items-center justify-center text-xs font-medium"
                           style={{ backgroundColor: classColors[rec.clickShareClass], color: 'white' }}>
                        {rec.clickShare.toFixed(0)}%
                      </div>
                    </td>
                    <td className="p-3 text-center">
                      <div className="w-12 h-6 rounded mx-auto flex items-center justify-center text-xs font-medium"
                           style={{ backgroundColor: classColors[rec.imprAbsTopClass], color: 'white' }}>
                        {rec.imprAbsTopPct.toFixed(0)}%
                      </div>
                    </td>
                    <td className="p-3 text-center">
                      <div className="w-12 h-6 rounded mx-auto flex items-center justify-center text-xs font-medium"
                           style={{ backgroundColor: classColors[rec.searchLostClass], color: 'white' }}>
                        {rec.searchLostIsRank.toFixed(1)}%
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}

// ═══════════════════════════════════════════════════════════════
// AGE TAB
// ═══════════════════════════════════════════════════════════════
function AgeTab() {
  const [data, setData] = useState<AgeApiResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedDevice, setSelectedDevice] = useState('All')

  useEffect(() => {
    setLoading(true)
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
    const interval = setInterval(fetchData, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [selectedDevice])

  if (loading) {
    return (
      <div className="text-center py-16">
        <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-gray-300 border-t-cyan-600"></div>
        <p className="mt-4 text-gray-400">Loading Age Analysis...</p>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="text-center py-16">
        <p className="text-red-500">No data available</p>
      </div>
    )
  }

  const { chartData, ytd2026Summary } = data

  const transformDataForChart = (metricData: AgeSeriesData[]) => {
    return chartData.months.map((month, idx) => {
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

  const renderLineChart = (
    title: string,
    titleColor: string,
    chartDataSet: any[],
    tooltipFormatter?: (value: any) => string
  ) => (
    <div className="bg-[#1a1a1a] border border-gray-800 rounded-xl p-6">
      <h2 className="text-xl font-bold mb-4" style={{ color: titleColor }}>{title}</h2>
      <ResponsiveContainer width="100%" height={350}>
        <LineChart data={chartDataSet}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis dataKey="month" stroke="#9ca3af" height={50} style={{ fontSize: '11px' }} />
          <YAxis stroke="#9ca3af" style={{ fontSize: '11px' }} />
          <Tooltip
            contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151' }}
            labelStyle={{ color: '#fff' }}
            formatter={tooltipFormatter}
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
  )

  return (
    <>
      {/* Header with Device Toggle */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <p className="text-gray-400">2026 YTD performance by age group &bull; Device: {selectedDevice}</p>
          <div className="flex gap-2">
            {DEVICE_OPTIONS.map(device => (
              <button
                key={device}
                onClick={() => setSelectedDevice(device)}
                className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                  selectedDevice === device
                    ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-500/50'
                    : 'bg-[#1a1a1a] text-gray-400 hover:bg-gray-800'
                }`}
              >
                {device}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Age Group Summary Cards */}
      <div className="grid grid-cols-6 gap-4 mb-8">
        {ytd2026Summary.map((ageSummary) => {
          const ageColor = AGE_COLORS[ageSummary.age]
          return (
            <div key={ageSummary.age} className="bg-[#1a1a1a] border-2 rounded-xl p-4" style={{ borderColor: ageColor }}>
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
        {renderLineChart('Clicks by Age Group', '#60a5fa', clicksData)}
        {renderLineChart('Impressions by Age Group', '#34d399', impressionsData)}
        {renderLineChart('Click-Through Rate (CTR)', '#fbbf24', ctrData,
          (value: any) => typeof value === 'number' ? `${value.toFixed(2)}%` : value
        )}
        {renderLineChart('Average Cost Per Click', '#f87171', cpcData,
          (value: any) => typeof value === 'number' ? `$${value.toFixed(2)}` : value
        )}
        {renderLineChart('Cost (Spend) by Age Group', '#a78bfa', costData,
          (value: any) => typeof value === 'number' ? `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : value
        )}
        {renderLineChart('Conversions by Age Group', '#f472b6', conversionsData,
          (value: any) => typeof value === 'number' ? value.toFixed(2) : value
        )}
      </div>

      {/* Footer */}
      <div className="text-center text-gray-500 text-sm mt-8">
        <p>Data source: Google Ads (Adveronix Sheet: Age Analysis_Device) &bull; Device Filter: {selectedDevice}</p>
        <p className="mt-2">Last updated: {new Date(data.last_updated).toLocaleString()}</p>
      </div>
    </>
  )
}

// ═══════════════════════════════════════════════════════════════
// MAIN PAGE — Tab Container
// ═══════════════════════════════════════════════════════════════
import React, { Suspense } from "react"

function GoogleAdsPageInner() {
  const searchParams = useSearchParams()
  const tabParam = searchParams.get('tab')
  const initialTab: TabType = (tabParam === 'cpc' || tabParam === 'age') ? tabParam : 'summary'
  const [activeTab, setActiveTab] = useState<TabType>(initialTab)

  return (
    <div className="min-h-screen bg-black p-6">
      <div className="max-w-[1920px] mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-4">
            <DashboardNav />
            <h1 className="text-white text-2xl font-bold">Google Ads</h1>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-1 border-b border-gray-800 mb-6">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? "border-red-500 text-red-400"
                    : "border-transparent text-gray-500 hover:text-gray-300 hover:border-gray-700"
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            )
          })}
        </div>

        {/* Tab Content */}
        {activeTab === "summary" && <SummaryTab />}
        {activeTab === "cpc" && <CPCTab />}
        {activeTab === "age" && <AgeTab />}
      </div>
    </div>
  )
}

export default function GoogleAdsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-black p-6">
        <div className="max-w-[1920px] mx-auto">
          <div className="flex items-center gap-4 mb-6">
            <DashboardNav />
            <h1 className="text-white text-2xl font-bold">Google Ads</h1>
          </div>
          <div className="text-center py-16">
            <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-gray-300 border-t-red-600"></div>
          </div>
        </div>
      </div>
    }>
      <GoogleAdsPageInner />
    </Suspense>
  )
}
