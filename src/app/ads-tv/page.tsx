'use client'

import { useEffect, useState } from 'react'

interface WeeklyMetrics {
  week_label: string
  date_range: string
  spend: number
  impressions: number
  clicks: number
  ctr: number
  conversions: number
  conversion_rate: number
  cpa: number
  roas: number
}

interface DeviceAdsData {
  this_week: WeeklyMetrics
  last_week: WeeklyMetrics
  two_weeks_ago: WeeklyMetrics
  three_weeks_ago: WeeklyMetrics
}

interface GoogleAdsData {
  desktop: DeviceAdsData
  mobile: DeviceAdsData
  last_updated: string
}

interface BingAdsData {
  this_week: WeeklyMetrics
  last_week: WeeklyMetrics
  two_weeks_ago: WeeklyMetrics
  three_weeks_ago: WeeklyMetrics
  last_updated: string
}

interface ChannelMetrics {
  users: number
  purchases: number
  conv_rate: number
  pct_of_users: number
  pct_of_purchases: number
}

interface OrganicWeek {
  totals: { users: number; purchases: number }
  google_ads: ChannelMetrics
  google_organic: ChannelMetrics
  direct: ChannelMetrics
  bing_organic: ChannelMetrics
  qb_intuit: ChannelMetrics
  other: ChannelMetrics
}

interface OrganicData {
  this_week: OrganicWeek
  last_week: OrganicWeek
  two_weeks_ago: OrganicWeek
  three_weeks_ago: OrganicWeek
}

interface YoYWeekData {
  week_key: string
  label: string
  date_range: string
  users: number
  purchases: number
  conversion_rate: number
  yoy: {
    week_key: string
    date_range: string
    users: number
    purchases: number
    conversion_rate: number
    users_change: number
    users_change_pct: number
    purchases_change: number
    purchases_change_pct: number
    conv_rate_change: number
    conv_rate_change_pct: number
  }
}

interface YoYData {
  weeks: YoYWeekData[]
  last_updated: string
}

interface LandingPageWeekData {
  label: string
  date_range: string
  users: number
  purchases: number
  conversion_rate: number
}

interface LandingPageData {
  landing_page: string
  weeks: LandingPageWeekData[]
}

interface LandingPagesData {
  landing_pages: LandingPageData[]
  last_updated: string
}

const formatNumber = (n: number) => Math.round(n).toLocaleString()
const formatPercent = (n: number) => n.toFixed(2) + '%'
const formatDollar = (n: number) => '$' + Math.round(n).toLocaleString()

export default function AdsTVPage() {
  const [adsData, setAdsData] = useState<GoogleAdsData | null>(null)
  const [bingAdsData, setBingAdsData] = useState<BingAdsData | null>(null)
  const [organicData, setOrganicData] = useState<OrganicData | null>(null)
  const [yoyData, setYoyData] = useState<YoYData | null>(null)
  const [landingPagesData, setLandingPagesData] = useState<LandingPagesData | null>(null)
  const [time, setTime] = useState(new Date())

  const fetchData = async () => {
    try {
      const [adsRes, bingRes, organicRes, yoyRes, lpRes] = await Promise.all([
        fetch('/api/ads-split'),
        fetch('/api/bing-ads'),
        fetch('/api/organic'),
        fetch('/api/organic-yoy'),
        fetch('/api/landing-pages-weekly')
      ])
      
      if (adsRes.ok) setAdsData(await adsRes.json())
      if (bingRes.ok) setBingAdsData(await bingRes.json())
      if (organicRes.ok) setOrganicData(await organicRes.json())
      if (yoyRes.ok) setYoyData(await yoyRes.json())
      if (lpRes.ok) setLandingPagesData(await lpRes.json())
    } catch (err) {
      console.error('Error fetching data:', err)
    }
  }

  useEffect(() => {
    fetchData()
    const dataInterval = setInterval(fetchData, 5 * 60 * 1000) // Refresh every 5 min
    const clockInterval = setInterval(() => setTime(new Date()), 1000)
    return () => {
      clearInterval(dataInterval)
      clearInterval(clockInterval)
    }
  }, [])

  if (!adsData || !bingAdsData || !organicData || !yoyData || !landingPagesData) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-6xl">Loading Marketing Dashboard...</div>
      </div>
    )
  }

  // Combine desktop + mobile Google Ads data
  const combineDeviceData = (desktop: WeeklyMetrics, mobile: WeeklyMetrics): WeeklyMetrics => {
    const totalSpend = desktop.spend + mobile.spend
    const totalImpressions = desktop.impressions + mobile.impressions
    const totalClicks = desktop.clicks + mobile.clicks
    const totalConversions = desktop.conversions + mobile.conversions
    
    return {
      week_label: desktop.week_label,
      date_range: desktop.date_range,
      spend: totalSpend,
      impressions: totalImpressions,
      clicks: totalClicks,
      ctr: totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0,
      conversions: totalConversions,
      conversion_rate: totalClicks > 0 ? (totalConversions / totalClicks) * 100 : 0,
      cpa: totalConversions > 0 ? totalSpend / totalConversions : 0,
      roas: totalSpend > 0 ? (totalConversions * 500) / totalSpend : 0
    }
  }

  const gadsThisWeek = combineDeviceData(adsData.desktop.this_week, adsData.mobile.this_week)
  const gadsLastWeek = combineDeviceData(adsData.desktop.last_week, adsData.mobile.last_week)
  const gadsTwoWeeksAgo = combineDeviceData(adsData.desktop.two_weeks_ago, adsData.mobile.two_weeks_ago)
  const gadsThreeWeeksAgo = combineDeviceData(adsData.desktop.three_weeks_ago, adsData.mobile.three_weeks_ago)

  const gadsSpend = gadsThisWeek.spend
  const bingSpend = bingAdsData.this_week.spend
  const totalSpend = gadsSpend + bingSpend
  
  const gadsConv = gadsThisWeek.conversions
  const bingConv = bingAdsData.this_week.conversions
  const totalConv = gadsConv + bingConv
  
  const totalCPA = totalConv > 0 ? totalSpend / totalConv : 0
  const totalROAS = totalSpend > 0 ? ((totalConv * 500) / totalSpend) : 0

  const visitors = organicData.this_week.totals.users
  const purchases = organicData.this_week.totals.purchases
  const overallConvRate = visitors > 0 ? (purchases / visitors * 100) : 0

  // Calculate 4-week trends for sparklines
  const gadsSpendTrend = [
    gadsThreeWeeksAgo.spend,
    gadsTwoWeeksAgo.spend,
    gadsLastWeek.spend,
    gadsThisWeek.spend
  ]

  const conversionsTrend = [
    gadsThreeWeeksAgo.conversions + bingAdsData.three_weeks_ago.conversions,
    gadsTwoWeeksAgo.conversions + bingAdsData.two_weeks_ago.conversions,
    gadsLastWeek.conversions + bingAdsData.last_week.conversions,
    totalConv
  ]

  const visitorsTrend = [
    organicData.three_weeks_ago.totals.users,
    organicData.two_weeks_ago.totals.users,
    organicData.last_week.totals.users,
    visitors
  ]

  // Top 6 channels
  const channels = [
    { name: 'Google Ads', data: organicData.this_week.google_ads, color: 'bg-blue-500' },
    { name: 'Google Organic', data: organicData.this_week.google_organic, color: 'bg-green-500' },
    { name: 'Direct', data: organicData.this_week.direct, color: 'bg-purple-500' },
    { name: 'Bing Organic', data: organicData.this_week.bing_organic, color: 'bg-cyan-500' },
    { name: 'QuickBooks/Intuit', data: organicData.this_week.qb_intuit, color: 'bg-orange-500' },
    { name: 'Other', data: organicData.this_week.other, color: 'bg-gray-500' },
  ]

  return (
    <div className="h-screen bg-black text-white p-8 overflow-hidden" style={{ width: '3840px', height: '2160px' }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-7xl font-bold">Marketing Dashboard</h1>
        <div className="text-right">
          <div className="text-6xl font-mono">{time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</div>
          <div className="text-3xl text-gray-500 mt-2">{gadsThisWeek.date_range}</div>
        </div>
      </div>

      <div className="flex gap-8 h-[calc(100%-140px)]">
        {/* Left Panel: 5-Week YoY Comparison (40%) */}
        <div className="w-[40%] flex flex-col gap-4">
          {/* New Visitors Row */}
          <div className="bg-gradient-to-br from-blue-900/40 to-blue-600/20 rounded-3xl p-6 border border-blue-500/30">
            <div className="text-3xl text-blue-400 font-medium mb-4">NEW VISITORS</div>
            <div className="grid grid-cols-5 gap-4">
              {yoyData.weeks.map((week, idx) => (
                <div key={idx} className="text-center">
                  <div className="text-xl text-gray-400 mb-1">{week.label}</div>
                  <div className="text-sm text-gray-500 mb-2">{week.date_range}</div>
                  <div className="text-5xl font-bold mb-2">{formatNumber(week.users)}</div>
                  <div className="text-xs text-gray-400 mb-1">YoY: {week.yoy.date_range}</div>
                  <div className="text-sm">
                    <span className={week.yoy.users_change >= 0 ? 'text-green-400' : 'text-red-400'}>
                      {week.yoy.users_change >= 0 ? '+' : ''}{formatNumber(week.yoy.users_change)}
                    </span>
                  </div>
                  <div className="text-xs">
                    <span className={week.yoy.users_change_pct >= 0 ? 'text-green-400' : 'text-red-400'}>
                      ({week.yoy.users_change_pct >= 0 ? '+' : ''}{week.yoy.users_change_pct.toFixed(1)}%)
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Conversions Row */}
          <div className="bg-gradient-to-br from-green-900/40 to-green-600/20 rounded-3xl p-6 border border-green-500/30">
            <div className="text-3xl text-green-400 font-medium mb-4">CONVERSIONS</div>
            <div className="grid grid-cols-5 gap-4">
              {yoyData.weeks.map((week, idx) => (
                <div key={idx} className="text-center">
                  <div className="text-xl text-gray-400 mb-1">{week.label}</div>
                  <div className="text-sm text-gray-500 mb-2">{week.date_range}</div>
                  <div className="text-5xl font-bold mb-2">{week.purchases}</div>
                  <div className="text-xs text-gray-400 mb-1">YoY: {week.yoy.date_range}</div>
                  <div className="text-sm">
                    <span className={week.yoy.purchases_change >= 0 ? 'text-green-400' : 'text-red-400'}>
                      {week.yoy.purchases_change >= 0 ? '+' : ''}{week.yoy.purchases_change}
                    </span>
                  </div>
                  <div className="text-xs">
                    <span className={week.yoy.purchases_change_pct >= 0 ? 'text-green-400' : 'text-red-400'}>
                      ({week.yoy.purchases_change_pct >= 0 ? '+' : ''}{week.yoy.purchases_change_pct.toFixed(1)}%)
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Conversion Rate Row */}
          <div className="bg-gradient-to-br from-purple-900/40 to-purple-600/20 rounded-3xl p-6 border border-purple-500/30">
            <div className="text-3xl text-purple-400 font-medium mb-4">CONVERSION RATE</div>
            <div className="grid grid-cols-5 gap-4">
              {yoyData.weeks.map((week, idx) => (
                <div key={idx} className="text-center">
                  <div className="text-xl text-gray-400 mb-1">{week.label}</div>
                  <div className="text-sm text-gray-500 mb-2">{week.date_range}</div>
                  <div className="text-5xl font-bold mb-2">{formatPercent(week.conversion_rate)}</div>
                  <div className="text-xs text-gray-400 mb-1">YoY: {week.yoy.date_range}</div>
                  <div className="text-sm">
                    <span className={week.yoy.conv_rate_change >= 0 ? 'text-green-400' : 'text-red-400'}>
                      {week.yoy.conv_rate_change >= 0 ? '+' : ''}{week.yoy.conv_rate_change.toFixed(2)}pp
                    </span>
                  </div>
                  <div className="text-xs">
                    <span className={week.yoy.conv_rate_change_pct >= 0 ? 'text-green-400' : 'text-red-400'}>
                      ({week.yoy.conv_rate_change_pct >= 0 ? '+' : ''}{week.yoy.conv_rate_change_pct.toFixed(1)}%)
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Landing Pages Section */}
          <div className="bg-gradient-to-br from-cyan-900/40 to-cyan-600/20 rounded-3xl p-6 border border-cyan-500/30 overflow-hidden">
            <div className="text-3xl text-cyan-400 font-medium mb-4">TOP LANDING PAGES (5 WEEKS)</div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-cyan-500/30">
                    <th className="text-left py-2 px-2 text-cyan-300 font-medium text-sm">Landing Page</th>
                    {landingPagesData.landing_pages[0]?.weeks.map((week, idx) => (
                      <th key={idx} className="text-center py-2 px-2">
                        <div className="text-cyan-300 font-medium text-xl">{week.label}</div>
                        <div className="text-gray-400 text-sm">{week.date_range}</div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {landingPagesData.landing_pages.slice(0, 8).map((lp, lpIdx) => (
                    <tr key={lpIdx} className="border-b border-cyan-500/20 hover:bg-cyan-900/20">
                      <td className="py-3 px-2 text-white font-medium text-sm truncate max-w-[200px]" title={lp.landing_page}>
                        {lp.landing_page}
                      </td>
                      {lp.weeks.map((week, weekIdx) => (
                        <td key={weekIdx} className="text-center py-3 px-2">
                          <div className="text-white font-bold text-5xl mb-1">{formatNumber(week.users)}</div>
                          <div className="text-cyan-300 text-base">{week.purchases} conv</div>
                          <div className="text-green-400 text-base font-semibold">{formatPercent(week.conversion_rate)}</div>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Panel: Details (60%) */}
        <div className="w-[60%] flex flex-col gap-6">
          {/* Paid Ads Performance */}
          <div className="bg-[#1a1a1a] rounded-3xl p-10 border border-gray-800">
            <h2 className="text-5xl font-bold mb-8">Paid Advertising Performance</h2>
            
            {/* GADS Desktop | GADS Mobile | Bing Desktop | Total - 4 columns */}
            <div className="grid grid-cols-4 gap-8">
              {/* Google Ads Desktop */}
              <div className="border-l-8 border-green-500 pl-6">
                <div className="text-3xl text-green-400 font-medium mb-6">GADS Desktop</div>
                <div className="space-y-3">
                  <MetricRow label="Spend" value={formatDollar(adsData.desktop.this_week.spend)} />
                  <MetricRow label="Clicks" value={formatNumber(adsData.desktop.this_week.clicks)} />
                  <MetricRow label="Conv" value={String(adsData.desktop.this_week.conversions)} />
                  <MetricRow label="CPA" value={formatDollar(adsData.desktop.this_week.cpa)} />
                  <MetricRow label="CTR" value={formatPercent(adsData.desktop.this_week.ctr)} />
                </div>
              </div>

              {/* Google Ads Mobile */}
              <div className="border-l-8 border-purple-500 pl-6">
                <div className="text-3xl text-purple-400 font-medium mb-6">GADS Mobile</div>
                <div className="space-y-3">
                  <MetricRow label="Spend" value={formatDollar(adsData.mobile.this_week.spend)} />
                  <MetricRow label="Clicks" value={formatNumber(adsData.mobile.this_week.clicks)} />
                  <MetricRow label="Conv" value={String(adsData.mobile.this_week.conversions)} />
                  <MetricRow label="CPA" value={formatDollar(adsData.mobile.this_week.cpa)} />
                  <MetricRow label="CTR" value={formatPercent(adsData.mobile.this_week.ctr)} />
                </div>
              </div>

              {/* Bing Desktop */}
              <div className="border-l-8 border-cyan-500 pl-6">
                <div className="text-3xl text-cyan-400 font-medium mb-6">Bing Desktop</div>
                <div className="space-y-3">
                  <MetricRow label="Spend" value={formatDollar(bingSpend)} />
                  <MetricRow label="Clicks" value={formatNumber(bingAdsData.this_week.clicks)} />
                  <MetricRow label="Conv" value={String(bingConv)} />
                  <MetricRow label="CPA" value={formatDollar(bingAdsData.this_week.cpa)} />
                  <MetricRow label="CTR" value={formatPercent(bingAdsData.this_week.ctr)} />
                </div>
              </div>

              {/* Total Paid Ads */}
              <div className="border-l-8 border-yellow-500 pl-6">
                <div className="text-3xl text-yellow-400 font-medium mb-6">Total</div>
                <div className="space-y-3">
                  <MetricRow 
                    label="Spend" 
                    value={formatDollar(adsData.desktop.this_week.spend + adsData.mobile.this_week.spend + bingAdsData.this_week.spend)} 
                  />
                  <MetricRow 
                    label="Clicks" 
                    value={formatNumber(adsData.desktop.this_week.clicks + adsData.mobile.this_week.clicks + bingAdsData.this_week.clicks)} 
                  />
                  <MetricRow 
                    label="Conv" 
                    value={String(adsData.desktop.this_week.conversions + adsData.mobile.this_week.conversions + bingAdsData.this_week.conversions)} 
                  />
                  <MetricRow 
                    label="CPA" 
                    value={(() => {
                      const totalSpend = adsData.desktop.this_week.spend + adsData.mobile.this_week.spend + bingAdsData.this_week.spend
                      const totalConv = adsData.desktop.this_week.conversions + adsData.mobile.this_week.conversions + bingAdsData.this_week.conversions
                      return formatDollar(totalConv > 0 ? totalSpend / totalConv : 0)
                    })()} 
                  />
                  <MetricRow 
                    label="CTR" 
                    value={(() => {
                      const totalClicks = adsData.desktop.this_week.clicks + adsData.mobile.this_week.clicks + bingAdsData.this_week.clicks
                      const totalImpr = adsData.desktop.this_week.impressions + adsData.mobile.this_week.impressions + bingAdsData.this_week.impressions
                      return formatPercent(totalImpr > 0 ? (totalClicks / totalImpr) * 100 : 0)
                    })()} 
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Traffic Channels */}
          <div className="bg-[#1a1a1a] rounded-3xl p-10 border border-gray-800 flex-1">
            <h2 className="text-5xl font-bold mb-8">Traffic Sources</h2>
            <div className="grid grid-cols-3 gap-6">
              {channels.map((channel, idx) => (
                <div key={idx} className="bg-black/50 rounded-2xl p-6 border border-gray-800">
                  <div className={`h-3 ${channel.color} rounded-full mb-4`} />
                  <div className="text-2xl text-gray-400 mb-3">{channel.name}</div>
                  <div className="text-5xl font-bold mb-2">{formatNumber(channel.data.users)}</div>
                  <div className="text-xl text-gray-500">visitors</div>
                  <div className="mt-4 pt-4 border-t border-gray-800 flex justify-between">
                    <span className="text-xl text-gray-400">Purchases:</span>
                    <span className="text-2xl font-bold">{channel.data.purchases}</span>
                  </div>
                  <div className="flex justify-between mt-2">
                    <span className="text-xl text-gray-400">Conv Rate:</span>
                    <span className="text-2xl font-bold text-green-400">{formatPercent(channel.data.conv_rate)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function Sparkline({ data, color }: { data: number[], color: string }) {
  const max = Math.max(...data)
  const min = Math.min(...data)
  const range = max - min || 1
  
  const dataPoints = data.map((val, i) => ({
    x: (i / (data.length - 1)) * 100,
    y: 100 - ((val - min) / range) * 100
  }))
  
  const points = dataPoints.map(p => `${p.x},${p.y}`).join(' ')

  return (
    <svg viewBox="0 0 100 30" className="w-full h-24" preserveAspectRatio="none">
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Data points */}
      {dataPoints.map((point, i) => (
        <circle
          key={i}
          cx={point.x}
          cy={point.y}
          r="2"
          fill={color}
          className="opacity-90"
        />
      ))}
    </svg>
  )
}

function MetricRow({ label, value }: { label: string, value: string }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-2xl text-gray-400">{label}</span>
      <span className="text-3xl font-bold">{value}</span>
    </div>
  )
}
