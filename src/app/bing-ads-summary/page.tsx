"use client"

import { useEffect, useState, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { RefreshCw, TrendingUp, Target } from "lucide-react"
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
type TabType = "summary" | "cpc"

const tabItems: { id: TabType; label: string; icon: typeof TrendingUp }[] = [
  { id: "summary", label: "Summary", icon: TrendingUp },
  { id: "cpc", label: "CPC Optimizer", icon: Target },
]

// ═══════════════════════════════════════════════════════════════
// SUMMARY TAB
// ═══════════════════════════════════════════════════════════════

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

  const currentWeek = data[selectedWeekIndex]
  const previousWeek = data[selectedWeekIndex + 1]

  const chartData = [...data].reverse()

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
      )}

      {/* Main Chart - Spend & Conversions */}
      <div className="bg-gradient-to-br from-[#1a1a2e] to-[#16213e] rounded-xl p-6 mb-6 border border-white/5">
        <h2 className="text-white text-lg font-semibold mb-4">Weekly Spend & Conversions</h2>
        <div style={{ width: '100%', height: 420 }}>
          {chartData.length > 0 && (
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData} margin={{ top: 20, right: 40, left: 0, bottom: 5 }}>
                <defs>
                  <linearGradient id="bing-spendGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6366f1" stopOpacity={1} />
                    <stop offset="100%" stopColor="#4338ca" stopOpacity={0.8} />
                  </linearGradient>
                  <linearGradient id="bing-convAreaGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                  <filter id="bing-glow">
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
                <Bar yAxisId="left" dataKey="spend" name="spend" fill="url(#bing-spendGradient)" radius={[6, 6, 0, 0]}>
                  <LabelList dataKey="spend" position="insideTop" fill="#ffffff" fontSize={20} fontWeight={700} formatter={(value) => typeof value === 'number' ? `$${(value / 1000).toFixed(1)}k` : ''} />
                </Bar>
                <Area yAxisId="right" type="monotone" dataKey="conversions" fill="url(#bing-convAreaGradient)" stroke="transparent" />
                <Line yAxisId="right" type="monotone" dataKey="conversions" name="conversions" stroke="#34d399" strokeWidth={3} dot={{ fill: '#1a1a2e', stroke: '#34d399', strokeWidth: 3, r: 6 }} activeDot={{ r: 8, fill: '#34d399' }} filter="url(#bing-glow)">
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
                  <linearGradient id="bing-cpaGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#06b6d4" stopOpacity={1} />
                    <stop offset="100%" stopColor="#0891b2" stopOpacity={0.7} />
                  </linearGradient>
                  <linearGradient id="bing-ctrAreaGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#f59e0b" stopOpacity={0} />
                  </linearGradient>
                  <filter id="bing-glowAmber">
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
                <Bar yAxisId="left" dataKey="cpa" name="cpa" fill="url(#bing-cpaGradient)" radius={[6, 6, 0, 0]}>
                  <LabelList dataKey="cpa" position="insideTop" fill="#ffffff" fontSize={20} fontWeight={700} formatter={(value) => typeof value === 'number' ? `$${Math.round(value)}` : ''} />
                </Bar>
                <Area yAxisId="right" type="monotone" dataKey="ctr" fill="url(#bing-ctrAreaGradient)" stroke="transparent" />
                <Line yAxisId="right" type="monotone" dataKey="ctr" name="ctr" stroke="#fbbf24" strokeWidth={3} dot={{ fill: '#1a1a2e', stroke: '#fbbf24', strokeWidth: 3, r: 6 }} activeDot={{ r: 8, fill: '#fbbf24' }} filter="url(#bing-glowAmber)">
                  <LabelList dataKey="ctr" position="top" fill="#fbbf24" fontSize={16} fontWeight={700} offset={14} formatter={(value) => typeof value === 'number' ? `${value.toFixed(1)}%` : ''} />
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
    </>
  )
}

// ═══════════════════════════════════════════════════════════════
// CPC OPTIMIZER TAB
// ═══════════════════════════════════════════════════════════════

interface BingCPCRecommendation {
  analysisDate: string
  campaign: string
  keyword: string
  action: string
  impressions: number
  clicks: number
  cost: number
  conversions: number
  costPerConv: number
  currentMaxCPC: number
  suggestedMaxCPC: number
  changeAmount: number
  urgency: string
  searchImprShare: number
  searchImprClass: string
  imprTopPct: number
  imprTopClass: string
  imprAbsTopPct: number
  imprAbsTopClass: string
  headroomPct: number
  headroomClass: string
  avgCPC: number
  trendSummary: string
  primarySignal: string
}

interface BingCPCData {
  recommendations: BingCPCRecommendation[]
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

function CPCTab() {
  const [data, setData] = useState<BingCPCData | null>(null)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('ALL')

  useEffect(() => {
    fetch('/api/cpc-bing-recommendations').then(res => res.json())
      .then(recommendations => {
        setData(recommendations)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="text-center py-16">
        <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-gray-300 border-t-cyan-600"></div>
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
    'Certification-Desktop',
    'Training-Desktop',
    'Courses-Desktop',
    'Classes-Desktop'
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
        <h2 className="text-white text-lg font-bold">Max CPC Recommendations</h2>
        <div className="flex items-center gap-4">
          <a
            href="/cpc-bing/trends"
            className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg text-sm font-medium transition-colors"
          >
            View Trends
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
          className={`bg-[#1a1a1a] rounded-lg p-4 cursor-pointer transition-all ${
            filter === 'ALL' ? 'ring-2 ring-cyan-500' : 'hover:bg-gray-900'
          }`}
        >
          <div className="text-gray-400 text-xs mb-1">TOTAL KEYWORDS</div>
          <div className="text-white text-3xl font-bold">{data.summary.total}</div>
        </div>
        <div
          onClick={() => setFilter('RAISE')}
          className={`bg-[#1a1a1a] rounded-lg p-4 cursor-pointer transition-all ${
            filter === 'RAISE' ? 'ring-2 ring-cyan-500' : 'hover:bg-gray-900'
          }`}
        >
          <div className="text-gray-400 text-xs mb-1">RAISE BIDS</div>
          <div className="text-green-500 text-3xl font-bold">{data.summary.actions.RAISE || 0}</div>
          <div className="text-gray-500 text-xs">+${data.summary.totalBidIncrease.toFixed(2)}</div>
        </div>
        <div
          onClick={() => setFilter('LOWER')}
          className={`bg-[#1a1a1a] rounded-lg p-4 cursor-pointer transition-all ${
            filter === 'LOWER' ? 'ring-2 ring-cyan-500' : 'hover:bg-gray-900'
          }`}
        >
          <div className="text-gray-400 text-xs mb-1">LOWER BIDS</div>
          <div className="text-red-500 text-3xl font-bold">{data.summary.actions.LOWER || 0}</div>
          <div className="text-gray-500 text-xs">-${data.summary.totalBidDecrease.toFixed(2)}</div>
        </div>
        <div
          onClick={() => setFilter('HOLD')}
          className={`bg-[#1a1a1a] rounded-lg p-4 cursor-pointer transition-all ${
            filter === 'HOLD' ? 'ring-2 ring-cyan-500' : 'hover:bg-gray-900'
          }`}
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
                legend: {
                  position: 'bottom',
                  labels: { color: '#9CA3AF', font: { size: 11 } }
                }
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
                ? 'bg-cyan-600 text-white'
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
                <th className="text-center p-3">URGENCY</th>
                <th className="text-center p-3">IMPR SHARE</th>
                <th className="text-center p-3">TOP%</th>
                <th className="text-center p-3">ABS TOP%</th>
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
                  <td className="p-3 text-right text-gray-400">{rec.impressions > 0 ? ((rec.clicks / rec.impressions) * 100).toFixed(1) + '%' : '—'}</td>
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
                  <td className={`p-3 text-right font-medium ${
                    rec.changeAmount > 0 ? 'text-green-500' : 'text-red-500'
                  }`}>
                    {rec.changeAmount > 0 ? '+' : ''}${rec.changeAmount.toFixed(2)}
                  </td>
                  <td className="p-3 text-center text-gray-300 text-xs">{rec.urgency}</td>
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
                         style={{ backgroundColor: classColors[rec.imprAbsTopClass], color: 'white' }}>
                      {rec.imprAbsTopPct.toFixed(0)}%
                    </div>
                  </td>
                </tr>
              )})}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}

// ═══════════════════════════════════════════════════════════════
// MAIN PAGE — Tab Container
// ═══════════════════════════════════════════════════════════════
import React from "react"

function BingAdsPageInner() {
  const searchParams = useSearchParams()
  const tabParam = searchParams.get('tab')
  const initialTab: TabType = tabParam === 'cpc' ? 'cpc' : 'summary'
  const [activeTab, setActiveTab] = useState<TabType>(initialTab)

  return (
    <div className="min-h-screen bg-black p-6">
      <div className="max-w-[1920px] mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-4">
            <DashboardNav />
            <h1 className="text-white text-2xl font-bold">Bing Ads</h1>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-1 border-b border-gray-800 mb-6">
          {tabItems.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? "border-sky-500 text-sky-400"
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
      </div>
    </div>
  )
}

export default function BingAdsSummaryPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-black p-6">
        <div className="max-w-[1920px] mx-auto">
          <div className="flex items-center gap-4 mb-6">
            <DashboardNav />
            <h1 className="text-white text-2xl font-bold">Bing Ads</h1>
          </div>
          <div className="text-center py-16">
            <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-gray-300 border-t-sky-600"></div>
          </div>
        </div>
      </div>
    }>
      <BingAdsPageInner />
    </Suspense>
  )
}
