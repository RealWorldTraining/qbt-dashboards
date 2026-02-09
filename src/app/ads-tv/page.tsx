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

interface AdsData {
  this_week: WeeklyMetrics
  last_week: WeeklyMetrics
  two_weeks_ago: WeeklyMetrics
  three_weeks_ago: WeeklyMetrics
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

const formatNumber = (n: number) => Math.round(n).toLocaleString()
const formatPercent = (n: number) => n.toFixed(1) + '%'
const formatDollar = (n: number) => '$' + Math.round(n).toLocaleString()

export default function AdsTVPage() {
  const [adsData, setAdsData] = useState<AdsData | null>(null)
  const [bingAdsData, setBingAdsData] = useState<AdsData | null>(null)
  const [organicData, setOrganicData] = useState<OrganicData | null>(null)
  const [time, setTime] = useState(new Date())

  const fetchData = async () => {
    try {
      const [adsRes, bingRes, organicRes] = await Promise.all([
        fetch('/api/ads'),
        fetch('/api/bing-ads'),
        fetch('/api/organic')
      ])
      
      if (adsRes.ok) setAdsData(await adsRes.json())
      if (bingRes.ok) setBingAdsData(await bingRes.json())
      if (organicRes.ok) setOrganicData(await organicRes.json())
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

  if (!adsData || !bingAdsData || !organicData) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-6xl">Loading Marketing Dashboard...</div>
      </div>
    )
  }

  const gadsSpend = adsData.this_week.spend
  const bingSpend = bingAdsData.this_week.spend
  const totalSpend = gadsSpend + bingSpend
  
  const gadsConv = adsData.this_week.conversions
  const bingConv = bingAdsData.this_week.conversions
  const totalConv = gadsConv + bingConv
  
  const totalCPA = totalConv > 0 ? totalSpend / totalConv : 0
  const totalROAS = totalSpend > 0 ? ((totalConv * 500) / totalSpend) : 0

  const visitors = organicData.this_week.totals.users
  const purchases = organicData.this_week.totals.purchases
  const overallConvRate = visitors > 0 ? (purchases / visitors * 100) : 0

  // Calculate 4-week trends for sparklines
  const gadsSpendTrend = [
    adsData.three_weeks_ago.spend,
    adsData.two_weeks_ago.spend,
    adsData.last_week.spend,
    adsData.this_week.spend
  ]

  const conversionsTrend = [
    adsData.three_weeks_ago.conversions + bingAdsData.three_weeks_ago.conversions,
    adsData.two_weeks_ago.conversions + bingAdsData.two_weeks_ago.conversions,
    adsData.last_week.conversions + bingAdsData.last_week.conversions,
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
          <div className="text-3xl text-gray-500 mt-2">{adsData.this_week.date_range}</div>
        </div>
      </div>

      <div className="flex gap-8 h-[calc(100%-140px)]">
        {/* Left Panel: Giant KPIs (40%) */}
        <div className="w-[40%] flex flex-col gap-6">
          {/* Visitors */}
          <div className="bg-gradient-to-br from-blue-900/40 to-blue-600/20 rounded-3xl p-10 border border-blue-500/30">
            <div className="text-4xl text-blue-400 font-medium mb-4">NEW VISITORS</div>
            <div className="text-9xl font-bold mb-6">{formatNumber(visitors)}</div>
            <Sparkline data={visitorsTrend} color="#3B82F6" />
          </div>

          {/* Conversions */}
          <div className="bg-gradient-to-br from-green-900/40 to-green-600/20 rounded-3xl p-10 border border-green-500/30">
            <div className="text-4xl text-green-400 font-medium mb-4">CONVERSIONS</div>
            <div className="text-9xl font-bold mb-6">{purchases}</div>
            <Sparkline data={conversionsTrend} color="#10B981" />
          </div>

          {/* Conversion Rate */}
          <div className="bg-gradient-to-br from-purple-900/40 to-purple-600/20 rounded-3xl p-10 border border-purple-500/30">
            <div className="text-4xl text-purple-400 font-medium mb-4">CONVERSION RATE</div>
            <div className="text-9xl font-bold mb-6">{formatPercent(overallConvRate)}</div>
          </div>

          {/* Ad Spend */}
          <div className="bg-gradient-to-br from-orange-900/40 to-orange-600/20 rounded-3xl p-10 border border-orange-500/30">
            <div className="text-4xl text-orange-400 font-medium mb-4">TOTAL AD SPEND</div>
            <div className="text-9xl font-bold mb-6">{formatDollar(totalSpend)}</div>
            <Sparkline data={gadsSpendTrend} color="#F97316" />
          </div>
        </div>

        {/* Right Panel: Details (60%) */}
        <div className="w-[60%] flex flex-col gap-6">
          {/* Paid Ads Performance */}
          <div className="bg-[#1a1a1a] rounded-3xl p-10 border border-gray-800">
            <h2 className="text-5xl font-bold mb-8">Paid Advertising Performance</h2>
            <div className="grid grid-cols-2 gap-8">
              {/* Google Ads */}
              <div className="border-l-8 border-blue-500 pl-6">
                <div className="text-3xl text-blue-400 font-medium mb-6">Google Ads</div>
                <div className="space-y-4">
                  <MetricRow label="Spend" value={formatDollar(gadsSpend)} />
                  <MetricRow label="Conversions" value={String(gadsConv)} />
                  <MetricRow label="CPA" value={formatDollar(adsData.this_week.cpa)} />
                  <MetricRow label="ROAS" value={adsData.this_week.roas.toFixed(2) + 'x'} />
                  <MetricRow label="CTR" value={formatPercent(adsData.this_week.ctr)} />
                </div>
              </div>

              {/* Bing Ads */}
              <div className="border-l-8 border-cyan-500 pl-6">
                <div className="text-3xl text-cyan-400 font-medium mb-6">Bing Ads</div>
                <div className="space-y-4">
                  <MetricRow label="Spend" value={formatDollar(bingSpend)} />
                  <MetricRow label="Conversions" value={String(bingConv)} />
                  <MetricRow label="CPA" value={formatDollar(bingAdsData.this_week.cpa)} />
                  <MetricRow label="ROAS" value={bingAdsData.this_week.roas.toFixed(2) + 'x'} />
                  <MetricRow label="CTR" value={formatPercent(bingAdsData.this_week.ctr)} />
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
  
  const points = data.map((val, i) => {
    const x = (i / (data.length - 1)) * 100
    const y = 100 - ((val - min) / range) * 100
    return `${x},${y}`
  }).join(' ')

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
