"use client"

import React, { useEffect, useState } from "react"
import { RefreshCw, TrendingUp, TrendingDown, Minus, Info } from "lucide-react"
import { DashboardNav } from "@/components/DashboardNav"

interface WeeklyData {
  week: string
  week_start: string
  spend: number
  impressions: number
  clicks: number
  ctr: number
  conversions: number
  conv_rate: number
  cpa: number
  roas: number
}

interface TrendData {
  current4Weeks: WeeklyData[]
  previous4Weeks: WeeklyData[]
  yoyData: {
    thisYear: WeeklyData[]
    lastYear: WeeklyData[]
  } | null
}

function formatCurrency(value: number): string {
  return "$" + new Intl.NumberFormat("en-US").format(Math.round(value))
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-US").format(Math.round(value))
}

function formatPercent(value: number): string {
  return Math.round(value) + "%"
}

function calculateChange(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0
  return ((current - previous) / previous) * 100
}

function TrendIndicator({ change, inverse = false }: { change: number; inverse?: boolean }) {
  const isPositive = inverse ? change < 0 : change > 0
  const isNeutral = Math.abs(change) < 1
  
  if (isNeutral) {
    return <Minus className="h-4 w-4 text-gray-400" />
  }
  
  return isPositive ? (
    <TrendingUp className="h-4 w-4 text-green-500" />
  ) : (
    <TrendingDown className="h-4 w-4 text-red-500" />
  )
}

function MetricCard({ 
  label, 
  current, 
  previous, 
  format = "number",
  inverse = false 
}: { 
  label: string
  current: number
  previous: number
  format?: "currency" | "number" | "percent"
  inverse?: boolean
}) {
  const change = calculateChange(current, previous)
  const isPositive = inverse ? change < 0 : change > 0
  const changeColor = Math.abs(change) < 1 ? "text-gray-400" : isPositive ? "text-green-500" : "text-red-500"
  
  let displayCurrent = ""
  let displayPrevious = ""
  
  switch (format) {
    case "currency":
      displayCurrent = formatCurrency(current)
      displayPrevious = formatCurrency(previous)
      break
    case "percent":
      displayCurrent = formatPercent(current)
      displayPrevious = formatPercent(previous)
      break
    default:
      displayCurrent = formatNumber(current)
      displayPrevious = formatNumber(previous)
  }
  
  return (
    <div className="bg-[#252525] rounded-lg p-4">
      <div className="text-gray-400 text-xs uppercase tracking-wide mb-2">{label}</div>
      <div className="flex items-center justify-between">
        <div>
          <div className="text-white text-xl font-bold">{displayCurrent}</div>
          <div className="text-gray-500 text-sm">was {displayPrevious}</div>
        </div>
        <div className="flex items-center gap-2">
          <TrendIndicator change={change} inverse={inverse} />
          <span className={`text-sm font-medium ${changeColor}`}>
            {change >= 0 ? "+" : ""}{change.toFixed(1)}%
          </span>
        </div>
      </div>
    </div>
  )
}

interface GSCData {
  summary: {
    totalKeywords: number
    demandIndex: number
    totalClicks: number
    totalImpressions: number
    avgPosition: number
    overallCTR: number
    week: string
    lastUpdated: string
  }
  topByClicks: Array<{
    query: string
    clicks: number
    impressions: number
    ctr: number
    position: number
  }>
  topByPosition: Array<{
    query: string
    clicks: number
    impressions: number
    ctr: number
    position: number
  }>
}

interface GSCWeeklyData {
  current4Weeks: Array<{
    week: string
    impressions: number
    clicks: number
    ctr: number
  }>
  wowComparison: {
    current: { week: string; impressions: number; clicks: number; ctr: number }
    previous: { week: string; impressions: number; clicks: number; ctr: number }
    impressionsChange: number
    clicksChange: number
    ctrChange: number
  } | null
  yoyComparison: {
    current: { impressions: number; clicks: number; ctr: number }
    lastYear: { impressions: number; clicks: number; ctr: number }
    impressionsChange: number
    clicksChange: number
    ctrChange: number
  } | null
}

interface KeywordWeekData {
  week: string
  clicks: number
  impressions: number
}

interface KeywordWithWeeks {
  query: string
  weeks: KeywordWeekData[]
  totals: { clicks: number; impressions: number }
  ctr: number
}

interface GSCKeywordsWeekly {
  data: KeywordWithWeeks[]
  weeks: string[]
  last_updated: string
}

export default function TrendAnalysisPage() {
  const [loading, setLoading] = useState(true)
  const [lastRefresh, setLastRefresh] = useState(new Date())
  const [googleAdsData, setGoogleAdsData] = useState<WeeklyData[]>([])
  const [yoyData, setYoyData] = useState<WeeklyData[] | null>(null)
  const [bingAdsData, setBingAdsData] = useState<WeeklyData[]>([])
  const [gscData, setGscData] = useState<GSCData | null>(null)
  const [gscWeeklyData, setGscWeeklyData] = useState<GSCWeeklyData | null>(null)
  const [gscKeywordsWeekly, setGscKeywordsWeekly] = useState<GSCKeywordsWeekly | null>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [visionAnalysis, setVisionAnalysis] = useState<any | null>(null)

  async function fetchData() {
    setLoading(true)
    try {
      // Fetch all data in parallel
      const [adsResponse, bingResponse, gscResponse, gscWeeklyResponse, gscKeywordsResponse] = await Promise.all([
        fetch("/api/google-ads-weekly"),
        fetch("/api/bing-ads-weekly"),
        fetch("/api/gsc-tracker"),
        fetch("/api/gsc-weekly"),
        fetch("/api/gsc-keywords-weekly")
      ])
      
      if (adsResponse.ok) {
        const data = await adsResponse.json()
        setGoogleAdsData(data.data || [])
        setYoyData(data.yoyData || null)
      }
      
      if (bingResponse.ok) {
        const data = await bingResponse.json()
        setBingAdsData(data.data || [])
      }
      
      if (gscResponse.ok) {
        const data = await gscResponse.json()
        setGscData(data)
      }
      
      if (gscWeeklyResponse.ok) {
        const data = await gscWeeklyResponse.json()
        setGscWeeklyData(data)
      }
      
      if (gscKeywordsResponse.ok) {
        const data = await gscKeywordsResponse.json()
        setGscKeywordsWeekly(data)
      }
      
      // Fetch Vision's analysis
      const visionResponse = await fetch("/api/vision-analysis")
      if (visionResponse.ok) {
        const data = await visionResponse.json()
        setVisionAnalysis(data)
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
  }, [])

  // Calculate 4-week totals
  const current4Weeks = googleAdsData.slice(0, 4)
  const previous4Weeks = googleAdsData.slice(4, 8)
  
  const current4WeekTotals = current4Weeks.reduce(
    (acc, week) => ({
      spend: acc.spend + week.spend,
      impressions: acc.impressions + week.impressions,
      clicks: acc.clicks + week.clicks,
      conversions: acc.conversions + week.conversions,
    }),
    { spend: 0, impressions: 0, clicks: 0, conversions: 0 }
  )
  
  const previous4WeekTotals = previous4Weeks.reduce(
    (acc, week) => ({
      spend: acc.spend + week.spend,
      impressions: acc.impressions + week.impressions,
      clicks: acc.clicks + week.clicks,
      conversions: acc.conversions + week.conversions,
    }),
    { spend: 0, impressions: 0, clicks: 0, conversions: 0 }
  )
  
  // Calculate derived metrics
  const currentCTR = current4WeekTotals.impressions > 0 
    ? (current4WeekTotals.clicks / current4WeekTotals.impressions) * 100 
    : 0
  const previousCTR = previous4WeekTotals.impressions > 0 
    ? (previous4WeekTotals.clicks / previous4WeekTotals.impressions) * 100 
    : 0
  
  const currentCPA = current4WeekTotals.conversions > 0 
    ? current4WeekTotals.spend / current4WeekTotals.conversions 
    : 0
  const previousCPA = previous4WeekTotals.conversions > 0 
    ? previous4WeekTotals.spend / previous4WeekTotals.conversions 
    : 0

  return (
    <div className="min-h-screen bg-[#0a0a0a] p-6">
      <div className="max-w-[1800px] mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <DashboardNav />
            <div>
              <h1 className="text-white text-2xl font-bold">Trend Analysis</h1>
              <p className="text-gray-400 text-sm mt-1">
                YoY comparisons, 4-week trends & Vision's insights
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex gap-2">
              <span className="px-2 py-1 bg-blue-500/20 text-blue-400 text-xs rounded">Trends</span>
              <span className="px-2 py-1 bg-purple-500/20 text-purple-400 text-xs rounded">YoY</span>
              <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded">Analysis</span>
            </div>
            <span className="text-gray-500 text-sm">
              {lastRefresh.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
            </span>
            <button onClick={fetchData} disabled={loading} className="p-2 rounded-lg hover:bg-gray-800 transition-colors">
              <RefreshCw className={`h-5 w-5 text-gray-400 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Google Ads Section */}
        <div className="bg-[#1a1a1a] rounded-xl p-6 mb-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-3 h-3 bg-red-500 rounded-full" />
            <h2 className="text-white text-lg font-semibold">Google Ads</h2>
            <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-xs rounded">Data Ready</span>
          </div>
          
          {/* 4-Week Comparison */}
          <h3 className="text-gray-400 text-sm uppercase tracking-wide mb-4">
            Trailing 4 Weeks vs Previous 4 Weeks
          </h3>
          <div className="grid grid-cols-6 gap-4 mb-8">
            <MetricCard 
              label="Spend" 
              current={current4WeekTotals.spend} 
              previous={previous4WeekTotals.spend}
              format="currency"
            />
            <MetricCard 
              label="Impressions" 
              current={current4WeekTotals.impressions} 
              previous={previous4WeekTotals.impressions}
            />
            <MetricCard 
              label="Clicks" 
              current={current4WeekTotals.clicks} 
              previous={previous4WeekTotals.clicks}
            />
            <MetricCard 
              label="CTR" 
              current={currentCTR} 
              previous={previousCTR}
              format="percent"
            />
            <MetricCard 
              label="Conversions" 
              current={current4WeekTotals.conversions} 
              previous={previous4WeekTotals.conversions}
            />
            <MetricCard 
              label="CPA" 
              current={currentCPA} 
              previous={previousCPA}
              format="currency"
              inverse={true}
            />
          </div>
          
          {/* Week-by-Week Breakdown */}
          <h3 className="text-gray-400 text-sm uppercase tracking-wide mb-4">Week-by-Week</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">Week</th>
                  <th className="text-right py-3 px-4 text-gray-400 font-medium">Spend</th>
                  <th className="text-right py-3 px-4 text-gray-400 font-medium">Impr</th>
                  <th className="text-right py-3 px-4 text-gray-400 font-medium">Clicks</th>
                  <th className="text-right py-3 px-4 text-gray-400 font-medium">CTR</th>
                  <th className="text-right py-3 px-4 text-gray-400 font-medium">Conv</th>
                  <th className="text-right py-3 px-4 text-gray-400 font-medium">CPA</th>
                </tr>
              </thead>
              <tbody>
                {[...current4Weeks].reverse().map((week, idx) => (
                  <tr key={idx} className="border-b border-gray-800 hover:bg-gray-800/50">
                    <td className="py-3 px-4 text-white font-medium">{week.week}</td>
                    <td className="text-right py-3 px-4 text-gray-300">{formatCurrency(week.spend)}</td>
                    <td className="text-right py-3 px-4 text-gray-300">{formatNumber(week.impressions)}</td>
                    <td className="text-right py-3 px-4 text-gray-300">{formatNumber(week.clicks)}</td>
                    <td className="text-right py-3 px-4 text-gray-300">{formatPercent(week.ctr)}</td>
                    <td className="text-right py-3 px-4 text-gray-300">{formatNumber(week.conversions)}</td>
                    <td className="text-right py-3 px-4 text-gray-300">{formatCurrency(week.cpa)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* YoY Comparison Section */}
          {yoyData && yoyData.length === 4 ? (
            <div className="mt-8 pt-6 border-t border-gray-700">
              <h3 className="text-gray-400 text-sm uppercase tracking-wide mb-4">
                Year-Over-Year Comparison (Same 4 Weeks Last Year)
              </h3>
              {(() => {
                const yoyTotals = yoyData.reduce(
                  (acc, week) => ({
                    spend: acc.spend + week.spend,
                    impressions: acc.impressions + week.impressions,
                    clicks: acc.clicks + week.clicks,
                    conversions: acc.conversions + week.conversions,
                  }),
                  { spend: 0, impressions: 0, clicks: 0, conversions: 0 }
                )
                const yoyCTR = yoyTotals.impressions > 0 
                  ? (yoyTotals.clicks / yoyTotals.impressions) * 100 
                  : 0
                const yoyCPA = yoyTotals.conversions > 0 
                  ? yoyTotals.spend / yoyTotals.conversions 
                  : 0
                
                return (
                  <div className="grid grid-cols-6 gap-4">
                    <MetricCard 
                      label="Spend YoY" 
                      current={current4WeekTotals.spend} 
                      previous={yoyTotals.spend}
                      format="currency"
                    />
                    <MetricCard 
                      label="Impressions YoY" 
                      current={current4WeekTotals.impressions} 
                      previous={yoyTotals.impressions}
                    />
                    <MetricCard 
                      label="Clicks YoY" 
                      current={current4WeekTotals.clicks} 
                      previous={yoyTotals.clicks}
                    />
                    <MetricCard 
                      label="CTR YoY" 
                      current={currentCTR} 
                      previous={yoyCTR}
                      format="percent"
                    />
                    <MetricCard 
                      label="Conversions YoY" 
                      current={current4WeekTotals.conversions} 
                      previous={yoyTotals.conversions}
                    />
                    <MetricCard 
                      label="CPA YoY" 
                      current={currentCPA} 
                      previous={yoyCPA}
                      format="currency"
                      inverse={true}
                    />
                  </div>
                )
              })()}
              
              {/* YoY Week-by-Week Table */}
              <div className="overflow-x-auto mt-6">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-700">
                      <th className="text-left py-3 px-4 text-gray-400 font-medium">Week (2025)</th>
                      <th className="text-right py-3 px-4 text-gray-400 font-medium">Spend</th>
                      <th className="text-right py-3 px-4 text-gray-400 font-medium">Impr</th>
                      <th className="text-right py-3 px-4 text-gray-400 font-medium">Clicks</th>
                      <th className="text-right py-3 px-4 text-gray-400 font-medium">CTR</th>
                      <th className="text-right py-3 px-4 text-gray-400 font-medium">Conv</th>
                      <th className="text-right py-3 px-4 text-gray-400 font-medium">CPA</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...yoyData].reverse().map((week, idx) => (
                      <tr key={idx} className="border-b border-gray-800 hover:bg-gray-800/50">
                        <td className="py-3 px-4 text-white font-medium">{week.week}</td>
                        <td className="text-right py-3 px-4 text-gray-300">{formatCurrency(week.spend)}</td>
                        <td className="text-right py-3 px-4 text-gray-300">{formatNumber(week.impressions)}</td>
                        <td className="text-right py-3 px-4 text-gray-300">{formatNumber(week.clicks)}</td>
                        <td className="text-right py-3 px-4 text-gray-300">{formatPercent(week.ctr)}</td>
                        <td className="text-right py-3 px-4 text-gray-300">{formatNumber(week.conversions)}</td>
                        <td className="text-right py-3 px-4 text-gray-300">{formatCurrency(week.cpa)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="mt-8 pt-6 border-t border-gray-700">
              <h3 className="text-gray-400 text-sm uppercase tracking-wide mb-4">
                Year-Over-Year Comparison
              </h3>
              <div className="bg-[#252525] rounded-lg p-4 text-center">
                <p className="text-gray-500">
                  YoY data not available — Need Jan 2025 data in Weekly_Summary sheet
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Bing Ads Section */}
        <div className="bg-[#1a1a1a] rounded-xl p-6 mb-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-3 h-3 bg-blue-500 rounded-full" />
            <h2 className="text-white text-lg font-semibold">Bing Ads</h2>
            <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-xs rounded">Data Ready</span>
          </div>
          
          {bingAdsData.length > 0 ? (
            <>
              {/* 4-Week Totals */}
              {(() => {
                const bing4Weeks = bingAdsData.slice(0, 4)
                const bingTotals = bing4Weeks.reduce(
                  (acc, week) => ({
                    spend: acc.spend + (week.spend || 0),
                    impressions: acc.impressions + (week.impressions || 0),
                    clicks: acc.clicks + (week.clicks || 0),
                    conversions: acc.conversions + (week.conversions || 0),
                  }),
                  { spend: 0, impressions: 0, clicks: 0, conversions: 0 }
                )
                const bingCTR = bingTotals.impressions > 0 
                  ? (bingTotals.clicks / bingTotals.impressions) * 100 
                  : 0
                const bingCPA = bingTotals.conversions > 0 
                  ? bingTotals.spend / bingTotals.conversions 
                  : 0
                
                return (
                  <>
                    <h3 className="text-gray-400 text-sm uppercase tracking-wide mb-4">
                      Trailing 4 Weeks Summary
                    </h3>
                    <div className="grid grid-cols-6 gap-4 mb-8">
                      <div className="bg-[#252525] rounded-lg p-4">
                        <div className="text-gray-400 text-xs uppercase tracking-wide mb-2">Spend</div>
                        <div className="text-white text-xl font-bold">{formatCurrency(bingTotals.spend)}</div>
                      </div>
                      <div className="bg-[#252525] rounded-lg p-4">
                        <div className="text-gray-400 text-xs uppercase tracking-wide mb-2">Impressions</div>
                        <div className="text-white text-xl font-bold">{formatNumber(bingTotals.impressions)}</div>
                      </div>
                      <div className="bg-[#252525] rounded-lg p-4">
                        <div className="text-gray-400 text-xs uppercase tracking-wide mb-2">Clicks</div>
                        <div className="text-white text-xl font-bold">{formatNumber(bingTotals.clicks)}</div>
                      </div>
                      <div className="bg-[#252525] rounded-lg p-4">
                        <div className="text-gray-400 text-xs uppercase tracking-wide mb-2">CTR</div>
                        <div className="text-white text-xl font-bold">{bingCTR.toFixed(1)}%</div>
                      </div>
                      <div className="bg-[#252525] rounded-lg p-4">
                        <div className="text-gray-400 text-xs uppercase tracking-wide mb-2">Conversions</div>
                        <div className="text-white text-xl font-bold">{formatNumber(bingTotals.conversions)}</div>
                      </div>
                      <div className="bg-[#252525] rounded-lg p-4">
                        <div className="text-gray-400 text-xs uppercase tracking-wide mb-2">CPA</div>
                        <div className="text-white text-xl font-bold">{formatCurrency(bingCPA)}</div>
                      </div>
                    </div>
                  </>
                )
              })()}
              
              {/* Week-by-Week Breakdown */}
              <h3 className="text-gray-400 text-sm uppercase tracking-wide mb-4">Week-by-Week</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-700">
                      <th className="text-left py-3 px-4 text-gray-400 font-medium">Week</th>
                      <th className="text-right py-3 px-4 text-gray-400 font-medium">Spend</th>
                      <th className="text-right py-3 px-4 text-gray-400 font-medium">Impr</th>
                      <th className="text-right py-3 px-4 text-gray-400 font-medium">Clicks</th>
                      <th className="text-right py-3 px-4 text-gray-400 font-medium">CTR</th>
                      <th className="text-right py-3 px-4 text-gray-400 font-medium">Conv</th>
                      <th className="text-right py-3 px-4 text-gray-400 font-medium">CPA</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...bingAdsData.slice(0, 4)].reverse().map((week, idx) => (
                      <tr key={idx} className="border-b border-gray-800 hover:bg-gray-800/50">
                        <td className="py-3 px-4 text-white font-medium">{week.week}</td>
                        <td className="text-right py-3 px-4 text-gray-300">{formatCurrency(week.spend || 0)}</td>
                        <td className="text-right py-3 px-4 text-gray-300">{formatNumber(week.impressions || 0)}</td>
                        <td className="text-right py-3 px-4 text-gray-300">{formatNumber(week.clicks || 0)}</td>
                        <td className="text-right py-3 px-4 text-gray-300">{(week.ctr || 0).toFixed(1)}%</td>
                        <td className="text-right py-3 px-4 text-gray-300">{formatNumber(week.conversions || 0)}</td>
                        <td className="text-right py-3 px-4 text-gray-300">{formatCurrency(week.cpa || 0)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <p className="text-gray-500">Loading Bing Ads data...</p>
          )}
        </div>

        {/* Google Search Console Section */}
        <div className="bg-[#1a1a1a] rounded-xl p-6 mb-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-3 h-3 bg-green-500 rounded-full" />
            <h2 className="text-white text-lg font-semibold">Google Search Console</h2>
            <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-xs rounded">Trends Ready</span>
          </div>
          
          {gscWeeklyData ? (
            <>
              {/* WoW Comparison */}
              {gscWeeklyData.wowComparison && (
                <>
                  <h3 className="text-gray-400 text-sm uppercase tracking-wide mb-4">
                    Week-over-Week — {gscWeeklyData.wowComparison.current.week}
                  </h3>
                  <div className="grid grid-cols-3 gap-4 mb-8">
                    <div className="bg-[#252525] rounded-lg p-4">
                      <div className="text-gray-400 text-xs uppercase tracking-wide mb-2">Impressions</div>
                      <div className="flex items-baseline gap-2">
                        <div className="text-white text-xl font-bold">{formatNumber(gscWeeklyData.wowComparison.current.impressions)}</div>
                        <div className={`text-sm font-medium ${gscWeeklyData.wowComparison.impressionsChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {gscWeeklyData.wowComparison.impressionsChange >= 0 ? '↑' : '↓'} {Math.abs(gscWeeklyData.wowComparison.impressionsChange).toFixed(1)}%
                        </div>
                      </div>
                      <div className="text-gray-500 text-sm">was {formatNumber(gscWeeklyData.wowComparison.previous.impressions)}</div>
                    </div>
                    <div className="bg-[#252525] rounded-lg p-4">
                      <div className="text-gray-400 text-xs uppercase tracking-wide mb-2">Clicks</div>
                      <div className="flex items-baseline gap-2">
                        <div className="text-white text-xl font-bold">{formatNumber(gscWeeklyData.wowComparison.current.clicks)}</div>
                        <div className={`text-sm font-medium ${gscWeeklyData.wowComparison.clicksChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {gscWeeklyData.wowComparison.clicksChange >= 0 ? '↑' : '↓'} {Math.abs(gscWeeklyData.wowComparison.clicksChange).toFixed(1)}%
                        </div>
                      </div>
                      <div className="text-gray-500 text-sm">was {formatNumber(gscWeeklyData.wowComparison.previous.clicks)}</div>
                    </div>
                    <div className="bg-[#252525] rounded-lg p-4">
                      <div className="text-gray-400 text-xs uppercase tracking-wide mb-2">CTR</div>
                      <div className="flex items-baseline gap-2">
                        <div className="text-white text-xl font-bold">{gscWeeklyData.wowComparison.current.ctr.toFixed(2)}%</div>
                        <div className={`text-sm font-medium ${gscWeeklyData.wowComparison.ctrChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {gscWeeklyData.wowComparison.ctrChange >= 0 ? '↑' : '↓'} {Math.abs(gscWeeklyData.wowComparison.ctrChange).toFixed(1)}%
                        </div>
                      </div>
                      <div className="text-gray-500 text-sm">was {gscWeeklyData.wowComparison.previous.ctr.toFixed(2)}%</div>
                    </div>
                  </div>
                </>
              )}
              
              {/* 4-Week Trend */}
              {gscWeeklyData.current4Weeks && gscWeeklyData.current4Weeks.length > 0 && (
                <>
                  <h3 className="text-gray-400 text-sm uppercase tracking-wide mb-4">4-Week Trend</h3>
                  <div className="overflow-x-auto mb-8">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-700">
                          <th className="text-left py-2 px-3 text-gray-400 font-medium">Week</th>
                          <th className="text-right py-2 px-3 text-gray-400 font-medium">Impressions</th>
                          <th className="text-right py-2 px-3 text-gray-400 font-medium">Clicks</th>
                          <th className="text-right py-2 px-3 text-gray-400 font-medium">CTR</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[...gscWeeklyData.current4Weeks].reverse().map((week, idx) => (
                          <tr key={idx} className="border-b border-gray-800 hover:bg-gray-800/50">
                            <td className="py-2 px-3 text-white font-medium">{week.week}</td>
                            <td className="text-right py-2 px-3 text-gray-300">{formatNumber(week.impressions)}</td>
                            <td className="text-right py-2 px-3 text-gray-300">{formatNumber(week.clicks)}</td>
                            <td className="text-right py-2 px-3 text-gray-300">{week.ctr.toFixed(2)}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
              
              {/* YoY Comparison */}
              {gscWeeklyData.yoyComparison && (
                <>
                  <h3 className="text-gray-400 text-sm uppercase tracking-wide mb-4">Year-over-Year (4 Weeks)</h3>
                  <div className="grid grid-cols-3 gap-4 mb-8">
                    <div className="bg-[#252525] rounded-lg p-4 relative group">
                      <div className="flex items-center gap-1 text-gray-400 text-xs uppercase tracking-wide mb-2">
                        Impressions YoY
                        <Info className="h-3 w-3 text-gray-500 cursor-help" />
                        <div className="absolute left-0 top-8 z-10 hidden group-hover:block bg-gray-900 text-gray-300 text-xs p-2 rounded shadow-lg w-48">
                          Excludes any query containing &quot;login&quot;. Only includes United States.
                        </div>
                      </div>
                      <div className="flex items-baseline gap-2">
                        <div className="text-white text-xl font-bold">{formatNumber(gscWeeklyData.yoyComparison.current.impressions)}</div>
                        <div className={`text-sm font-medium ${gscWeeklyData.yoyComparison.impressionsChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {gscWeeklyData.yoyComparison.impressionsChange >= 0 ? '↑' : '↓'} {Math.abs(gscWeeklyData.yoyComparison.impressionsChange).toFixed(0)}%
                        </div>
                      </div>
                      <div className="text-blue-400 text-xs mb-1">Jan 4-31, 2026</div>
                      <div className="text-gray-500 text-sm">was {formatNumber(gscWeeklyData.yoyComparison.lastYear.impressions)}</div>
                      <div className="text-gray-600 text-xs">Jan 5 - Feb 1, 2025</div>
                    </div>
                    <div className="bg-[#252525] rounded-lg p-4 relative group">
                      <div className="flex items-center gap-1 text-gray-400 text-xs uppercase tracking-wide mb-2">
                        Clicks YoY
                        <Info className="h-3 w-3 text-gray-500 cursor-help" />
                        <div className="absolute left-0 top-8 z-10 hidden group-hover:block bg-gray-900 text-gray-300 text-xs p-2 rounded shadow-lg w-48">
                          Excludes any query containing &quot;login&quot;. Only includes United States.
                        </div>
                      </div>
                      <div className="flex items-baseline gap-2">
                        <div className="text-white text-xl font-bold">{formatNumber(gscWeeklyData.yoyComparison.current.clicks)}</div>
                        <div className={`text-sm font-medium ${gscWeeklyData.yoyComparison.clicksChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {gscWeeklyData.yoyComparison.clicksChange >= 0 ? '↑' : '↓'} {Math.abs(gscWeeklyData.yoyComparison.clicksChange).toFixed(0)}%
                        </div>
                      </div>
                      <div className="text-blue-400 text-xs mb-1">Jan 4-31, 2026</div>
                      <div className="text-gray-500 text-sm">was {formatNumber(gscWeeklyData.yoyComparison.lastYear.clicks)}</div>
                      <div className="text-gray-600 text-xs">Jan 5 - Feb 1, 2025</div>
                    </div>
                    <div className="bg-[#252525] rounded-lg p-4 relative group">
                      <div className="flex items-center gap-1 text-gray-400 text-xs uppercase tracking-wide mb-2">
                        CTR YoY
                        <Info className="h-3 w-3 text-gray-500 cursor-help" />
                        <div className="absolute left-0 top-8 z-10 hidden group-hover:block bg-gray-900 text-gray-300 text-xs p-2 rounded shadow-lg w-48">
                          Excludes any query containing &quot;login&quot;. Only includes United States.
                        </div>
                      </div>
                      <div className="flex items-baseline gap-2">
                        <div className="text-white text-xl font-bold">{gscWeeklyData.yoyComparison.current.ctr.toFixed(2)}%</div>
                        <div className={`text-sm font-medium ${gscWeeklyData.yoyComparison.ctrChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {gscWeeklyData.yoyComparison.ctrChange >= 0 ? '↑' : '↓'} {Math.abs(gscWeeklyData.yoyComparison.ctrChange).toFixed(0)}%
                        </div>
                      </div>
                      <div className="text-blue-400 text-xs mb-1">Jan 4-31, 2026</div>
                      <div className="text-gray-500 text-sm">was {gscWeeklyData.yoyComparison.lastYear.ctr.toFixed(2)}%</div>
                      <div className="text-gray-600 text-xs">Jan 5 - Feb 1, 2025</div>
                    </div>
                  </div>
                </>
              )}
            </>
          ) : gscData ? (
            <>
              {/* Fallback to original GSC data display */}
              <h3 className="text-gray-400 text-sm uppercase tracking-wide mb-4">
                Keyword Tracking Summary — {gscData.summary.week}
              </h3>
              <div className="grid grid-cols-4 gap-4 mb-8">
                <div className="bg-[#252525] rounded-lg p-4">
                  <div className="text-gray-400 text-xs uppercase tracking-wide mb-2">Demand Index</div>
                  <div className="text-white text-xl font-bold">{formatNumber(gscData.summary.demandIndex)}</div>
                  <div className="text-gray-500 text-sm">total impressions</div>
                </div>
                <div className="bg-[#252525] rounded-lg p-4">
                  <div className="text-gray-400 text-xs uppercase tracking-wide mb-2">Keywords Tracked</div>
                  <div className="text-white text-xl font-bold">{formatNumber(gscData.summary.totalKeywords)}</div>
                  <div className="text-gray-500 text-sm">relevant keywords</div>
                </div>
                <div className="bg-[#252525] rounded-lg p-4">
                  <div className="text-gray-400 text-xs uppercase tracking-wide mb-2">Organic Clicks</div>
                  <div className="text-white text-xl font-bold">{formatNumber(gscData.summary.totalClicks)}</div>
                  <div className="text-gray-500 text-sm">from search</div>
                </div>
                <div className="bg-[#252525] rounded-lg p-4">
                  <div className="text-gray-400 text-xs uppercase tracking-wide mb-2">Overall CTR</div>
                  <div className="text-white text-xl font-bold">{gscData.summary.overallCTR.toFixed(1)}%</div>
                  <div className="text-gray-500 text-sm">click-through rate</div>
                </div>
              </div>
            </>
          ) : (
            <p className="text-gray-500">Loading GSC data...</p>
          )}
          
          {/* Top Keywords - 4-Week Breakdown */}
          {gscKeywordsWeekly && gscKeywordsWeekly.data && gscKeywordsWeekly.data.length > 0 ? (
            <>
              <h3 className="text-gray-400 text-sm uppercase tracking-wide mb-4">Top Keywords — 4-Week Breakdown</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-700">
                      <th className="text-left py-2 px-3 text-gray-400 font-medium">Keyword</th>
                      <th className="text-center py-2 px-3 text-gray-400 font-medium border-l border-gray-700" colSpan={2}>
                        <span className="text-xs">4 wks ago</span><br/>
                        <span className="text-[10px] text-gray-500">Jan 4-10</span>
                      </th>
                      <th className="text-center py-2 px-3 text-gray-400 font-medium border-l border-gray-700" colSpan={2}>
                        <span className="text-xs">3 wks ago</span><br/>
                        <span className="text-[10px] text-gray-500">Jan 11-17</span>
                      </th>
                      <th className="text-center py-2 px-3 text-gray-400 font-medium border-l border-gray-700" colSpan={2}>
                        <span className="text-xs">2 wks ago</span><br/>
                        <span className="text-[10px] text-gray-500">Jan 18-24</span>
                      </th>
                      <th className="text-center py-2 px-3 text-gray-400 font-medium border-l border-gray-700 bg-green-900/20" colSpan={2}>
                        <span className="text-xs text-green-400">Last week</span><br/>
                        <span className="text-[10px] text-gray-500">Jan 25-31</span>
                      </th>
                    </tr>
                    <tr className="border-b border-gray-700">
                      <th className="text-left py-1 px-3"></th>
                      <th className="text-right py-1 px-2 text-gray-500 font-normal text-xs border-l border-gray-700">Clk</th>
                      <th className="text-right py-1 px-2 text-gray-500 font-normal text-xs">Imp</th>
                      <th className="text-right py-1 px-2 text-gray-500 font-normal text-xs border-l border-gray-700">Clk</th>
                      <th className="text-right py-1 px-2 text-gray-500 font-normal text-xs">Imp</th>
                      <th className="text-right py-1 px-2 text-gray-500 font-normal text-xs border-l border-gray-700">Clk</th>
                      <th className="text-right py-1 px-2 text-gray-500 font-normal text-xs">Imp</th>
                      <th className="text-right py-1 px-2 text-gray-500 font-normal text-xs border-l border-gray-700 bg-green-900/20">Clk</th>
                      <th className="text-right py-1 px-2 text-gray-500 font-normal text-xs bg-green-900/20">Imp</th>
                    </tr>
                  </thead>
                  <tbody>
                    {gscKeywordsWeekly.data.map((kw, idx) => (
                      <tr key={idx} className="border-b border-gray-800 hover:bg-gray-800/50">
                        <td className="py-2 px-3 text-white font-medium">{kw.query}</td>
                        {kw.weeks.map((week, wIdx) => (
                          <React.Fragment key={wIdx}>
                            <td className={`text-right py-2 px-2 text-gray-300 border-l border-gray-700 ${wIdx === 3 ? 'bg-green-900/10' : ''}`}>
                              {week.clicks}
                            </td>
                            <td className={`text-right py-2 px-2 text-gray-500 text-xs ${wIdx === 3 ? 'bg-green-900/10' : ''}`}>
                              {formatNumber(week.impressions)}
                            </td>
                          </React.Fragment>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : gscData && (
            <>
              <h3 className="text-gray-400 text-sm uppercase tracking-wide mb-4">Top Keywords by Clicks</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-700">
                      <th className="text-left py-2 px-3 text-gray-400 font-medium">Keyword</th>
                      <th className="text-right py-2 px-3 text-gray-400 font-medium">Clicks</th>
                      <th className="text-right py-2 px-3 text-gray-400 font-medium">Impressions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {gscData.topByClicks.slice(0, 15).map((kw, idx) => (
                      <tr key={idx} className="border-b border-gray-800 hover:bg-gray-800/50">
                        <td className="py-2 px-3 text-white">{kw.query}</td>
                        <td className="text-right py-2 px-3 text-gray-300">{kw.clicks}</td>
                        <td className="text-right py-2 px-3 text-gray-300">{formatNumber(kw.impressions)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>

        {/* Vision's Insights Section */}
        <div className="bg-[#1a1a1a] rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-3 h-3 bg-purple-500 rounded-full animate-pulse" />
            <h2 className="text-white text-lg font-semibold">Vision&apos;s Analysis & Recommendations</h2>
            {visionAnalysis && (
              <span className={`px-2 py-0.5 text-xs rounded ${
                visionAnalysis.status === 'action_required' 
                  ? 'bg-red-500/20 text-red-400' 
                  : 'bg-green-500/20 text-green-400'
              }`}>
                {visionAnalysis.statusLabel}
              </span>
            )}
          </div>
          
          {visionAnalysis ? (
            <div className="space-y-6">
              {/* Generated info */}
              <div className="text-gray-500 text-xs">
                Generated: {visionAnalysis.generated} • Sources: {visionAnalysis.dataSources}
              </div>
              
              {/* Sections */}
              {visionAnalysis.sections.map((section: { id: string; title: string; items: Array<{ title: string; severity?: string; metrics?: Array<{ label: string; value: string; change: string }>; analysis?: string; rootCauses?: string[]; actions?: string[] }> }) => (
                <div key={section.id} className="bg-[#252525] rounded-lg p-4">
                  <h3 className="text-white font-semibold mb-4">{section.title}</h3>
                  <div className="space-y-4">
                    {section.items.map((item, idx) => (
                      <div key={idx} className={`border-l-2 pl-4 ${
                        item.severity === 'critical' ? 'border-red-500' :
                        item.severity === 'warning' ? 'border-yellow-500' :
                        item.severity === 'urgent' ? 'border-orange-500' :
                        item.severity === 'important' ? 'border-blue-500' :
                        'border-gray-600'
                      }`}>
                        <h4 className="text-gray-200 font-medium mb-2">{item.title}</h4>
                        
                        {item.metrics && (
                          <div className="grid grid-cols-3 gap-2 mb-3">
                            {item.metrics.map((m, mIdx) => (
                              <div key={mIdx} className="bg-[#1a1a1a] rounded p-2">
                                <div className="text-gray-500 text-xs">{m.label}</div>
                                <div className="text-white font-medium">{m.value}</div>
                                {m.change && <div className="text-gray-400 text-xs">{m.change}</div>}
                              </div>
                            ))}
                          </div>
                        )}
                        
                        {item.analysis && (
                          <p className="text-gray-400 text-sm mb-2">{item.analysis}</p>
                        )}
                        
                        {item.rootCauses && (
                          <div className="mb-2">
                            <div className="text-gray-500 text-xs uppercase mb-1">Root Causes</div>
                            <ul className="text-gray-400 text-sm list-disc list-inside">
                              {item.rootCauses.map((cause, cIdx) => (
                                <li key={cIdx}>{cause}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        
                        {item.actions && (
                          <div>
                            <div className="text-gray-500 text-xs uppercase mb-1">Actions</div>
                            <ul className="text-gray-300 text-sm space-y-1">
                              {item.actions.map((action, aIdx) => (
                                <li key={aIdx} className="flex items-start gap-2">
                                  <span className="text-purple-400">→</span>
                                  {action}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              
              {/* Vision's Take */}
              {visionAnalysis.summary && (
                <div className="bg-purple-900/20 border border-purple-500/30 rounded-lg p-4">
                  <h3 className="text-purple-300 font-semibold mb-2">{visionAnalysis.summary.title}</h3>
                  <p className="text-gray-300 text-sm mb-3">{visionAnalysis.summary.content}</p>
                  <div className="text-purple-400 text-sm font-medium">
                    Priority: {visionAnalysis.summary.priority}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-[#252525] rounded-lg p-4 min-h-[200px]">
              <p className="text-gray-400 italic">
                Loading Vision&apos;s analysis...
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="text-center mt-6">
          <div className="flex items-center justify-center gap-2">
            <span className="w-2 h-2 bg-purple-500 rounded-full animate-pulse" />
            <span className="text-gray-500 text-xs">Trend Analysis Dashboard</span>
          </div>
        </div>
      </div>
    </div>
  )
}
