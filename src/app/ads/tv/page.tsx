"use client"

import { useEffect, useState } from "react"
import { RefreshCw } from "lucide-react"

// ============================================
// TV DASHBOARD - Optimized for 2304x1296
// ============================================

// Types
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
  week_label: string
  date_range: string
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
  last_updated: string
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

interface CampaignData {
  weeks: { week: string; label: string; date_range: string }[]
  campaigns: { name: string; data: (CampaignMetrics | null)[] }[]
  last_updated: string
}

// Loading states
const LOADING_CHANNEL: ChannelMetrics = { users: 0, purchases: 0, conv_rate: 0, pct_of_users: 0, pct_of_purchases: 0 }
const LOADING_ADS: AdsData = {
  this_week: { week_label: "Last Week", date_range: "Loading...", spend: 0, impressions: 0, clicks: 0, ctr: 0, conversions: 0, conversion_rate: 0, cpa: 0, roas: 0 },
  last_week: { week_label: "2 Weeks Ago", date_range: "Loading...", spend: 0, impressions: 0, clicks: 0, ctr: 0, conversions: 0, conversion_rate: 0, cpa: 0, roas: 0 },
  two_weeks_ago: { week_label: "3 Weeks Ago", date_range: "Loading...", spend: 0, impressions: 0, clicks: 0, ctr: 0, conversions: 0, conversion_rate: 0, cpa: 0, roas: 0 },
  three_weeks_ago: { week_label: "4 Weeks Ago", date_range: "Loading...", spend: 0, impressions: 0, clicks: 0, ctr: 0, conversions: 0, conversion_rate: 0, cpa: 0, roas: 0 },
  last_updated: new Date().toISOString()
}
const LOADING_ORGANIC: OrganicData = {
  this_week: { week_label: "Last Week", date_range: "Loading...", totals: { users: 0, purchases: 0 }, google_ads: LOADING_CHANNEL, google_organic: LOADING_CHANNEL, direct: LOADING_CHANNEL, bing_organic: LOADING_CHANNEL, qb_intuit: LOADING_CHANNEL, other: LOADING_CHANNEL },
  last_week: { week_label: "2 Weeks Ago", date_range: "Loading...", totals: { users: 0, purchases: 0 }, google_ads: LOADING_CHANNEL, google_organic: LOADING_CHANNEL, direct: LOADING_CHANNEL, bing_organic: LOADING_CHANNEL, qb_intuit: LOADING_CHANNEL, other: LOADING_CHANNEL },
  two_weeks_ago: { week_label: "3 Weeks Ago", date_range: "Loading...", totals: { users: 0, purchases: 0 }, google_ads: LOADING_CHANNEL, google_organic: LOADING_CHANNEL, direct: LOADING_CHANNEL, bing_organic: LOADING_CHANNEL, qb_intuit: LOADING_CHANNEL, other: LOADING_CHANNEL },
  three_weeks_ago: { week_label: "4 Weeks Ago", date_range: "Loading...", totals: { users: 0, purchases: 0 }, google_ads: LOADING_CHANNEL, google_organic: LOADING_CHANNEL, direct: LOADING_CHANNEL, bing_organic: LOADING_CHANNEL, qb_intuit: LOADING_CHANNEL, other: LOADING_CHANNEL },
  last_updated: new Date().toISOString()
}
const LOADING_CAMPAIGNS: CampaignData = { weeks: [], campaigns: [], last_updated: new Date().toISOString() }

// Formatters
const fmt = (n: number) => new Intl.NumberFormat("en-US").format(Math.round(n))
const fmtCurrency = (n: number) => "$" + fmt(n)
const fmtPct = (n: number) => n.toFixed(1) + "%"

// Change indicator
function Delta({ current, previous, inverse = false }: { current: number; previous: number; inverse?: boolean }) {
  if (!previous) return <span className="text-gray-500">--</span>
  const change = ((current - previous) / previous) * 100
  const isGood = inverse ? change < 0 : change > 0
  const color = Math.abs(change) < 1 ? "text-gray-500" : isGood ? "text-green-500" : "text-red-500"
  return <span className={color}>{change >= 0 ? "+" : ""}{change.toFixed(0)}%</span>
}

export default function TVDashboard() {
  const [adsData, setAdsData] = useState<AdsData>(LOADING_ADS)
  const [organicData, setOrganicData] = useState<OrganicData>(LOADING_ORGANIC)
  const [campaignData, setCampaignData] = useState<CampaignData>(LOADING_CAMPAIGNS)
  const [bingAdsData, setBingAdsData] = useState<AdsData>(LOADING_ADS)
  const [bingCampaignData, setBingCampaignData] = useState<CampaignData>(LOADING_CAMPAIGNS)
  const [loading, setLoading] = useState(true)
  const [lastRefresh, setLastRefresh] = useState(new Date())

  const fetchData = async () => {
    setLoading(true)
    try {
      const [adsRes, organicRes, campaignRes, bingAdsRes, bingCampaignRes] = await Promise.all([
        fetch('/api/ads'),
        fetch('/api/organic'),
        fetch('/api/campaigns'),
        fetch('/api/bing-ads'),
        fetch('/api/bing-campaigns')
      ])
      if (adsRes.ok) setAdsData(await adsRes.json())
      if (organicRes.ok) setOrganicData(await organicRes.json())
      if (campaignRes.ok) setCampaignData(await campaignRes.json())
      if (bingAdsRes.ok) setBingAdsData(await bingAdsRes.json())
      if (bingCampaignRes.ok) setBingCampaignData(await bingCampaignRes.json())
      setLastRefresh(new Date())
    } catch (err) {
      console.error('Error:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  // Campaign sorting
  const campaignOrder = ['Certification-Desktop', 'Training-Desktop', 'Classes-Desktop', 'Courses-Desktop', 'Certification-Mobile', 'Training-Mobile', 'Classes-Mobile', 'Courses-Mobile']
  const sortCampaigns = (campaigns: CampaignData['campaigns']) => {
    return [...campaigns].sort((a, b) => {
      const aIdx = campaignOrder.findIndex(name => a.name.includes(name.split('-')[0]) && a.name.includes(name.split('-')[1]))
      const bIdx = campaignOrder.findIndex(name => b.name.includes(name.split('-')[0]) && b.name.includes(name.split('-')[1]))
      return (aIdx === -1 ? 99 : aIdx) - (bIdx === -1 ? 99 : bIdx)
    })
  }

  const googleCampaigns = sortCampaigns(campaignData.campaigns)
  const bingCampaigns = sortCampaigns(bingCampaignData.campaigns)

  return (
    <div className="w-[2304px] h-[1296px] bg-[#0a0a0a] p-3 overflow-hidden">
      {/* ===== HEADER ===== */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-4">
          <h1 className="text-white text-xl font-bold">Marketing Dashboard</h1>
          <span className="text-gray-400 text-sm">{adsData.this_week.date_range}</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-gray-500 text-sm">{lastRefresh.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}</span>
          <button onClick={fetchData} className="p-1 rounded hover:bg-gray-800">
            <RefreshCw className={`h-4 w-4 text-gray-400 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* ===== ROW 1: Top KPIs + Traffic Channels ===== */}
      <div className="flex gap-3 mb-3">
        {/* Top 3 KPIs */}
        <div className="flex gap-2 shrink-0">
          {/* New Visitors */}
          <div className="w-[180px] bg-[#1a1a1a] rounded-lg p-3">
            <div className="text-gray-400 text-xs mb-1">NEW VISITORS</div>
            <div className="text-white text-3xl font-bold">{fmt(organicData.this_week.totals.users)}</div>
            <div className="flex justify-between text-xs mt-2">
              <span className="text-gray-500">vs 2w</span>
              <Delta current={organicData.this_week.totals.users} previous={organicData.last_week.totals.users} />
            </div>
          </div>
          {/* Conversions */}
          <div className="w-[180px] bg-[#1a1a1a] rounded-lg p-3">
            <div className="text-gray-400 text-xs mb-1">CONVERSIONS</div>
            <div className="text-white text-3xl font-bold">{organicData.this_week.totals.purchases}</div>
            <div className="flex justify-between text-xs mt-2">
              <span className="text-gray-500">vs 2w</span>
              <Delta current={organicData.this_week.totals.purchases} previous={organicData.last_week.totals.purchases} />
            </div>
          </div>
          {/* Conv Rate */}
          <div className="w-[180px] bg-[#1a1a1a] rounded-lg p-3">
            <div className="text-gray-400 text-xs mb-1">CONV RATE</div>
            <div className="text-white text-3xl font-bold">
              {organicData.this_week.totals.users > 0 ? (organicData.this_week.totals.purchases / organicData.this_week.totals.users * 100).toFixed(2) : "0"}%
            </div>
            <div className="flex justify-between text-xs mt-2">
              <span className="text-gray-500">vs 2w</span>
              <Delta 
                current={organicData.this_week.totals.users > 0 ? organicData.this_week.totals.purchases / organicData.this_week.totals.users : 0} 
                previous={organicData.last_week.totals.users > 0 ? organicData.last_week.totals.purchases / organicData.last_week.totals.users : 0} 
              />
            </div>
          </div>
        </div>

        {/* Traffic by Channel - 6 cards */}
        <div className="flex-1 grid grid-cols-6 gap-2">
          {[
            { name: "GOOGLE ADS", data: organicData.this_week.google_ads, prev: organicData.last_week.google_ads, color: "bg-green-500" },
            { name: "GOOGLE ORG", data: organicData.this_week.google_organic, prev: organicData.last_week.google_organic, color: "bg-blue-500" },
            { name: "DIRECT", data: organicData.this_week.direct, prev: organicData.last_week.direct, color: "bg-gray-500" },
            { name: "BING ORG", data: organicData.this_week.bing_organic, prev: organicData.last_week.bing_organic, color: "bg-teal-500" },
            { name: "QB INTUIT", data: organicData.this_week.qb_intuit, prev: organicData.last_week.qb_intuit, color: "bg-emerald-500" },
            { name: "OTHER", data: organicData.this_week.other, prev: organicData.last_week.other, color: "bg-purple-500" },
          ].map((ch, i) => (
            <div key={i} className="bg-[#1a1a1a] rounded-lg overflow-hidden">
              <div className={`h-1 ${ch.color}`} />
              <div className="p-2">
                <div className="text-gray-400 text-[10px] font-medium">{ch.name}</div>
                <div className="flex items-baseline justify-between">
                  <span className="text-white text-lg font-bold">{fmt(ch.data.users)}</span>
                  <span className="text-cyan-400 text-sm">{fmtPct(ch.data.pct_of_users)}</span>
                </div>
                <div className="flex items-baseline justify-between">
                  <span className="text-gray-400 text-sm">{ch.data.purchases} purch</span>
                  <Delta current={ch.data.users} previous={ch.prev.users} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ===== ROW 2: Google Ads Performance ===== */}
      <div className="mb-2">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-2 h-2 bg-red-500 rounded-full" />
          <span className="text-gray-400 text-xs font-medium">GOOGLE ADS</span>
        </div>
        <div className="grid grid-cols-8 gap-2">
          {[
            { label: "SPEND", value: fmtCurrency(adsData.this_week.spend), prev: adsData.last_week.spend, curr: adsData.this_week.spend },
            { label: "IMPRESSIONS", value: fmt(adsData.this_week.impressions), prev: adsData.last_week.impressions, curr: adsData.this_week.impressions },
            { label: "CLICKS", value: fmt(adsData.this_week.clicks), prev: adsData.last_week.clicks, curr: adsData.this_week.clicks },
            { label: "CTR", value: fmtPct(adsData.this_week.ctr), prev: adsData.last_week.ctr, curr: adsData.this_week.ctr },
            { label: "CONVERSIONS", value: adsData.this_week.conversions, prev: adsData.last_week.conversions, curr: adsData.this_week.conversions },
            { label: "CONV RATE", value: fmtPct(adsData.this_week.conversion_rate), prev: adsData.last_week.conversion_rate, curr: adsData.this_week.conversion_rate },
            { label: "CPA", value: fmtCurrency(adsData.this_week.cpa), prev: adsData.last_week.cpa, curr: adsData.this_week.cpa, inverse: true },
            { label: "ROAS", value: adsData.this_week.roas.toFixed(2) + "x", prev: adsData.last_week.roas, curr: adsData.this_week.roas },
          ].map((m, i) => (
            <div key={i} className="bg-[#1a1a1a] rounded-lg p-2">
              <div className="text-gray-500 text-[10px]">{m.label}</div>
              <div className="text-white text-xl font-bold">{m.value}</div>
              <div className="text-xs"><Delta current={m.curr} previous={m.prev} inverse={m.inverse} /></div>
            </div>
          ))}
        </div>
      </div>

      {/* ===== ROW 3: Google Campaigns (8 cards in 1 row) ===== */}
      <div className="grid grid-cols-8 gap-2 mb-2">
        {googleCampaigns.slice(0, 8).map((campaign, idx) => {
          const c = campaign.data[0]
          if (!c) return <div key={idx} className="bg-[#1a1a1a] rounded-lg p-2 opacity-50"><div className="text-gray-500 text-xs">No data</div></div>
          return (
            <div key={campaign.name} className="bg-[#1a1a1a] rounded-lg p-2">
              <div className="text-gray-400 text-[9px] font-medium truncate mb-1">{campaign.name.replace(/-/g, ' ').toUpperCase()}</div>
              <div className="grid grid-cols-3 gap-1 text-[10px]">
                <div><div className="text-white font-bold">{fmt(c.clicks)}</div><div className="text-gray-600">Clk</div></div>
                <div><div className="text-white font-bold">{fmtCurrency(c.cost)}</div><div className="text-gray-600">Cost</div></div>
                <div><div className="text-white font-bold">{c.conversions}</div><div className="text-gray-600">Conv</div></div>
              </div>
              <div className="flex justify-between text-[10px] mt-1 pt-1 border-t border-gray-800">
                <span className="text-cyan-400">{fmtPct(c.search_impression_share)} IS</span>
                <span className="text-orange-400">{fmtPct(c.search_abs_top_impression_share)} Top</span>
              </div>
            </div>
          )
        })}
      </div>

      {/* ===== ROW 4: Bing Ads Performance ===== */}
      <div className="mb-2">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-2 h-2 bg-blue-400 rounded-full" />
          <span className="text-gray-400 text-xs font-medium">BING ADS</span>
        </div>
        <div className="grid grid-cols-8 gap-2">
          {[
            { label: "SPEND", value: fmtCurrency(bingAdsData.this_week.spend), prev: bingAdsData.last_week.spend, curr: bingAdsData.this_week.spend },
            { label: "IMPRESSIONS", value: fmt(bingAdsData.this_week.impressions), prev: bingAdsData.last_week.impressions, curr: bingAdsData.this_week.impressions },
            { label: "CLICKS", value: fmt(bingAdsData.this_week.clicks), prev: bingAdsData.last_week.clicks, curr: bingAdsData.this_week.clicks },
            { label: "CTR", value: fmtPct(bingAdsData.this_week.ctr), prev: bingAdsData.last_week.ctr, curr: bingAdsData.this_week.ctr },
            { label: "CONVERSIONS", value: bingAdsData.this_week.conversions, prev: bingAdsData.last_week.conversions, curr: bingAdsData.this_week.conversions },
            { label: "CONV RATE", value: fmtPct(bingAdsData.this_week.conversion_rate), prev: bingAdsData.last_week.conversion_rate, curr: bingAdsData.this_week.conversion_rate },
            { label: "CPA", value: fmtCurrency(bingAdsData.this_week.cpa), prev: bingAdsData.last_week.cpa, curr: bingAdsData.this_week.cpa, inverse: true },
            { label: "ROAS", value: bingAdsData.this_week.roas.toFixed(2) + "x", prev: bingAdsData.last_week.roas, curr: bingAdsData.this_week.roas },
          ].map((m, i) => (
            <div key={i} className="bg-[#1a1a1a] rounded-lg p-2">
              <div className="text-gray-500 text-[10px]">{m.label}</div>
              <div className="text-white text-xl font-bold">{m.value}</div>
              <div className="text-xs"><Delta current={m.curr} previous={m.prev} inverse={m.inverse} /></div>
            </div>
          ))}
        </div>
      </div>

      {/* ===== ROW 5: Bing Campaigns (4 cards) + Summary Stats ===== */}
      <div className="flex gap-3">
        {/* Bing Campaigns */}
        <div className="grid grid-cols-4 gap-2 flex-1">
          {bingCampaigns.slice(0, 4).map((campaign, idx) => {
            const c = campaign.data[0]
            if (!c) return <div key={idx} className="bg-[#1a1a1a] rounded-lg p-2 opacity-50"><div className="text-gray-500 text-xs">No data</div></div>
            return (
              <div key={campaign.name} className="bg-[#1a1a1a] rounded-lg p-2">
                <div className="text-gray-400 text-[9px] font-medium truncate mb-1">{campaign.name.replace(/-/g, ' ').toUpperCase()}</div>
                <div className="grid grid-cols-3 gap-1 text-[10px]">
                  <div><div className="text-white font-bold">{fmt(c.clicks)}</div><div className="text-gray-600">Clk</div></div>
                  <div><div className="text-white font-bold">{fmtCurrency(c.cost)}</div><div className="text-gray-600">Cost</div></div>
                  <div><div className="text-white font-bold">{c.conversions}</div><div className="text-gray-600">Conv</div></div>
                </div>
                <div className="flex justify-between text-[10px] mt-1 pt-1 border-t border-gray-800">
                  <span className="text-cyan-400">{fmtPct(c.conv_rate)} CR</span>
                  <span className="text-orange-400">{c.cost > 0 && c.conversions > 0 ? fmtCurrency(c.cost / c.conversions) : '$0'} CPA</span>
                </div>
              </div>
            )
          })}
        </div>

        {/* Weekly Totals Summary */}
        <div className="w-[500px] bg-[#1a1a1a] rounded-lg p-3">
          <div className="text-gray-400 text-xs font-medium mb-2">COMBINED WEEKLY TOTALS</div>
          <div className="grid grid-cols-4 gap-3">
            <div>
              <div className="text-gray-500 text-[10px]">TOTAL SPEND</div>
              <div className="text-white text-2xl font-bold">{fmtCurrency(adsData.this_week.spend + bingAdsData.this_week.spend)}</div>
            </div>
            <div>
              <div className="text-gray-500 text-[10px]">TOTAL CLICKS</div>
              <div className="text-white text-2xl font-bold">{fmt(adsData.this_week.clicks + bingAdsData.this_week.clicks)}</div>
            </div>
            <div>
              <div className="text-gray-500 text-[10px]">TOTAL CONV</div>
              <div className="text-white text-2xl font-bold">{adsData.this_week.conversions + bingAdsData.this_week.conversions}</div>
            </div>
            <div>
              <div className="text-gray-500 text-[10px]">BLENDED CPA</div>
              <div className="text-white text-2xl font-bold">
                {(adsData.this_week.conversions + bingAdsData.this_week.conversions) > 0 
                  ? fmtCurrency((adsData.this_week.spend + bingAdsData.this_week.spend) / (adsData.this_week.conversions + bingAdsData.this_week.conversions))
                  : '$0'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ===== FOOTER ===== */}
      <div className="flex items-center justify-center gap-2 mt-3">
        <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
        <span className="text-gray-600 text-xs">TV Dashboard • 2304×1296 • Auto-refresh 5min</span>
      </div>
    </div>
  )
}
