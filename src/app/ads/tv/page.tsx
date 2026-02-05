"use client"

import { useEffect, useState } from "react"
import { RefreshCw, TrendingUp, TrendingDown } from "lucide-react"

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
  organic_search?: ChannelMetrics
}

interface OrganicData {
  this_week: OrganicWeek
  last_week: OrganicWeek
  two_weeks_ago: OrganicWeek
  three_weeks_ago: OrganicWeek
  four_weeks_ago: OrganicWeek
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

const LOADING_CHANNEL: ChannelMetrics = { users: 0, purchases: 0, conv_rate: 0, pct_of_users: 0, pct_of_purchases: 0 }
const LOADING_ADS: AdsData = {
  this_week: { week_label: "", date_range: "Loading...", spend: 0, impressions: 0, clicks: 0, ctr: 0, conversions: 0, conversion_rate: 0, cpa: 0, roas: 0 },
  last_week: { week_label: "", date_range: "", spend: 0, impressions: 0, clicks: 0, ctr: 0, conversions: 0, conversion_rate: 0, cpa: 0, roas: 0 },
  two_weeks_ago: { week_label: "", date_range: "", spend: 0, impressions: 0, clicks: 0, ctr: 0, conversions: 0, conversion_rate: 0, cpa: 0, roas: 0 },
  three_weeks_ago: { week_label: "", date_range: "", spend: 0, impressions: 0, clicks: 0, ctr: 0, conversions: 0, conversion_rate: 0, cpa: 0, roas: 0 },
  last_updated: ""
}
const LOADING_ORGANIC: OrganicData = {
  this_week: { week_label: "", date_range: "", totals: { users: 0, purchases: 0 }, google_ads: LOADING_CHANNEL, google_organic: LOADING_CHANNEL, direct: LOADING_CHANNEL, bing_organic: LOADING_CHANNEL, qb_intuit: LOADING_CHANNEL, other: LOADING_CHANNEL },
  last_week: { week_label: "", date_range: "", totals: { users: 0, purchases: 0 }, google_ads: LOADING_CHANNEL, google_organic: LOADING_CHANNEL, direct: LOADING_CHANNEL, bing_organic: LOADING_CHANNEL, qb_intuit: LOADING_CHANNEL, other: LOADING_CHANNEL },
  two_weeks_ago: { week_label: "", date_range: "", totals: { users: 0, purchases: 0 }, google_ads: LOADING_CHANNEL, google_organic: LOADING_CHANNEL, direct: LOADING_CHANNEL, bing_organic: LOADING_CHANNEL, qb_intuit: LOADING_CHANNEL, other: LOADING_CHANNEL },
  three_weeks_ago: { week_label: "", date_range: "", totals: { users: 0, purchases: 0 }, google_ads: LOADING_CHANNEL, google_organic: LOADING_CHANNEL, direct: LOADING_CHANNEL, bing_organic: LOADING_CHANNEL, qb_intuit: LOADING_CHANNEL, other: LOADING_CHANNEL },
  four_weeks_ago: { week_label: "", date_range: "", totals: { users: 0, purchases: 0 }, google_ads: LOADING_CHANNEL, google_organic: LOADING_CHANNEL, direct: LOADING_CHANNEL, bing_organic: LOADING_CHANNEL, qb_intuit: LOADING_CHANNEL, other: LOADING_CHANNEL },
  last_updated: ""
}
const LOADING_CAMPAIGNS: CampaignData = { weeks: [], campaigns: [], last_updated: "" }

const fmt = (n: number) => new Intl.NumberFormat("en-US").format(Math.round(n))
const fmtK = (n: number) => n >= 1000 ? (n/1000).toFixed(1) + "k" : fmt(n)
const fmtCurrency = (n: number) => "$" + fmt(n)
const fmtPct = (n: number) => n.toFixed(2) + "%"
const fmtPctWhole = (n: number) => Math.round(n) + "%"

function Trend({ current, previous, inverse = false }: { current: number; previous: number; inverse?: boolean }) {
  if (!previous) return null
  const change = ((current - previous) / previous) * 100
  const isGood = inverse ? change < 0 : change > 0
  const Icon = change >= 0 ? TrendingUp : TrendingDown
  const color = Math.abs(change) < 1 ? "text-gray-500" : isGood ? "text-green-400" : "text-red-400"
  return (
    <div className={`flex items-center gap-1 ${color}`}>
      <Icon className="w-5 h-5" />
      <span className="text-lg font-semibold">{Math.abs(change).toFixed(0)}%</span>
    </div>
  )
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
        fetch('/api/ads'), fetch('/api/organic'), fetch('/api/campaigns'), fetch('/api/bing-ads'), fetch('/api/bing-campaigns')
      ])
      if (adsRes.ok) setAdsData(await adsRes.json())
      if (organicRes.ok) setOrganicData(await organicRes.json())
      if (campaignRes.ok) setCampaignData(await campaignRes.json())
      if (bingAdsRes.ok) setBingAdsData(await bingAdsRes.json())
      if (bingCampaignRes.ok) setBingCampaignData(await bingCampaignRes.json())
      setLastRefresh(new Date())
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchData() }, [])

  const campaignOrder = ['Certification-Desktop', 'Training-Desktop', 'Classes-Desktop', 'Courses-Desktop', 'Certification-Mobile', 'Training-Mobile', 'Classes-Mobile', 'Courses-Mobile']
  const sortCampaigns = (campaigns: CampaignData['campaigns']) => [...campaigns].sort((a, b) => {
    const aIdx = campaignOrder.findIndex(name => a.name.includes(name.split('-')[0]) && a.name.includes(name.split('-')[1]))
    const bIdx = campaignOrder.findIndex(name => b.name.includes(name.split('-')[0]) && b.name.includes(name.split('-')[1]))
    return (aIdx === -1 ? 99 : aIdx) - (bIdx === -1 ? 99 : bIdx)
  })

  const gCampaigns = sortCampaigns(campaignData.campaigns)
  const bCampaigns = sortCampaigns(bingCampaignData.campaigns)
  
  // Combined paid ads totals
  const totalClicks = adsData.this_week.clicks + bingAdsData.this_week.clicks
  const totalConv = adsData.this_week.conversions + bingAdsData.this_week.conversions
  const totalConvRate = totalClicks > 0 ? (totalConv / totalClicks) * 100 : 0
  const prevTotalClicks = adsData.last_week.clicks + bingAdsData.last_week.clicks
  const prevTotalConv = adsData.last_week.conversions + bingAdsData.last_week.conversions
  const prevTotalConvRate = prevTotalClicks > 0 ? (prevTotalConv / prevTotalClicks) * 100 : 0

  // Organic Search traffic (from GA4 "Organic Search" channel group only)
  const organicUsers = organicData.this_week.organic_search?.users || 0
  const organicPurchases = organicData.this_week.organic_search?.purchases || 0
  const organicConvRate = organicUsers > 0 ? (organicPurchases / organicUsers) * 100 : 0
  const prevOrganicUsers = organicData.last_week.organic_search?.users || 0
  const prevOrganicPurchases = organicData.last_week.organic_search?.purchases || 0
  const prevOrganicConvRate = prevOrganicUsers > 0 ? (prevOrganicPurchases / prevOrganicUsers) * 100 : 0

  return (
    <div className="w-[2304px] h-[1296px] bg-black text-white p-6 flex flex-col">
      {/* HEADER */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-6">
          <h1 className="text-3xl font-bold">Marketing Dashboard</h1>
          <span className="text-2xl text-cyan-400 font-medium">{adsData.this_week.date_range}</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
            <span className="text-xl text-gray-400">{lastRefresh.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}</span>
          </div>
          <button onClick={fetchData} className="p-2 hover:bg-gray-800 rounded-lg">
            <RefreshCw className={`w-6 h-6 text-gray-400 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* TOP ROW - 3 Summary Cards */}
      <div className="grid grid-cols-3 gap-6 mb-6">
        {/* Site Overview */}
        <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-8 border-t-4 border-purple-500">
          <div className="text-gray-400 text-xl mb-6 font-semibold">SITE OVERVIEW</div>
          <div className="grid grid-cols-3 gap-6">
            <div>
              <div className="text-6xl font-bold text-white mb-2">{fmt(organicData.this_week.totals.users)}</div>
              <div className="text-lg text-gray-400 mb-3">New Visitors</div>
              <Trend current={organicData.this_week.totals.users} previous={organicData.last_week.totals.users} />
            </div>
            <div>
              <div className="text-6xl font-bold text-green-400 mb-2">{organicData.this_week.totals.purchases}</div>
              <div className="text-lg text-gray-400 mb-3">Conversions</div>
              <Trend current={organicData.this_week.totals.purchases} previous={organicData.last_week.totals.purchases} />
            </div>
            <div>
              <div className="text-6xl font-bold text-cyan-400 mb-2">
                {organicData.this_week.totals.users > 0 ? (organicData.this_week.totals.purchases / organicData.this_week.totals.users * 100).toFixed(2) : "0.00"}%
              </div>
              <div className="text-lg text-gray-400 mb-3">Conv Rate</div>
            </div>
          </div>
        </div>

        {/* Paid Ads Combined */}
        <div className="bg-gradient-to-br from-orange-900/40 to-red-900/40 rounded-2xl p-8 border-t-4 border-orange-500">
          <div className="text-orange-400 text-xl mb-6 font-semibold">PAID ADS (Google + Bing)</div>
          <div className="grid grid-cols-3 gap-6">
            <div>
              <div className="text-6xl font-bold text-white mb-2">{fmt(totalClicks)}</div>
              <div className="text-lg text-gray-400 mb-3">Clicks</div>
              <Trend current={totalClicks} previous={prevTotalClicks} />
            </div>
            <div>
              <div className="text-6xl font-bold text-green-400 mb-2">{totalConv}</div>
              <div className="text-lg text-gray-400 mb-3">Conversions</div>
              <Trend current={totalConv} previous={prevTotalConv} />
            </div>
            <div>
              <div className="text-6xl font-bold text-yellow-400 mb-2">{fmtPct(totalConvRate)}</div>
              <div className="text-lg text-gray-400 mb-3">Conv Rate</div>
              <Trend current={totalConvRate} previous={prevTotalConvRate} />
            </div>
          </div>
        </div>

        {/* Organic Search */}
        <div className="bg-gradient-to-br from-green-900/40 to-emerald-900/40 rounded-2xl p-8 border-t-4 border-green-500">
          <div className="text-green-400 text-xl mb-6 font-semibold">ORGANIC SEARCH</div>
          <div className="grid grid-cols-3 gap-6">
            <div>
              <div className="text-6xl font-bold text-white mb-2">{fmt(organicUsers)}</div>
              <div className="text-lg text-gray-400 mb-3">Visitors</div>
              <Trend current={organicUsers} previous={prevOrganicUsers} />
            </div>
            <div>
              <div className="text-6xl font-bold text-green-400 mb-2">{organicPurchases}</div>
              <div className="text-lg text-gray-400 mb-3">Conversions</div>
              <Trend current={organicPurchases} previous={prevOrganicPurchases} />
            </div>
            <div>
              <div className="text-6xl font-bold text-emerald-400 mb-2">{fmtPct(organicConvRate)}</div>
              <div className="text-lg text-gray-400 mb-3">Conv Rate</div>
              <Trend current={organicConvRate} previous={prevOrganicConvRate} />
            </div>
          </div>
        </div>
      </div>

      {/* BOTTOM ROW - 2 Tables */}
      <div className="grid grid-cols-2 gap-6 flex-1">
        {/* Traffic by Channel */}
        <div className="bg-gray-900 rounded-2xl p-8">
          <div className="text-gray-400 text-2xl mb-6 font-semibold uppercase tracking-wide">Traffic by Channel</div>
          
          {/* Column Headers */}
          <div className="grid grid-cols-[200px_repeat(5,1fr)] gap-4 mb-4 pb-3 border-b border-gray-800">
            <div />
            <div className="text-center text-gray-500 text-sm">This Wk</div>
            <div className="text-center text-gray-500 text-sm">Last Wk</div>
            <div className="text-center text-gray-500 text-sm">2 Wks</div>
            <div className="text-center text-gray-500 text-sm">3 Wks</div>
            <div className="text-center text-gray-500 text-sm">4 Wks</div>
          </div>

          {/* Data Rows */}
          <div className="space-y-3">
            {[
              { name: "Google Ads", key: "google_ads" as const, color: "border-green-500" },
              { name: "Google Organic", key: "google_organic" as const, color: "border-blue-500" },
              { name: "Direct", key: "direct" as const, color: "border-gray-500" },
              { name: "Bing Organic", key: "bing_organic" as const, color: "border-teal-500" },
              { name: "QB Intuit", key: "qb_intuit" as const, color: "border-emerald-500" },
              { name: "Other", key: "other" as const, color: "border-purple-500" },
            ].map((ch) => {
              const weeks = [
                { users: organicData.this_week[ch.key].users, pct: organicData.this_week[ch.key].pct_of_users },
                { users: organicData.last_week[ch.key].users, pct: organicData.last_week[ch.key].pct_of_users },
                { users: organicData.two_weeks_ago[ch.key].users, pct: organicData.two_weeks_ago[ch.key].pct_of_users },
                { users: organicData.three_weeks_ago[ch.key].users, pct: organicData.three_weeks_ago[ch.key].pct_of_users },
                { users: organicData.four_weeks_ago[ch.key].users, pct: organicData.four_weeks_ago[ch.key].pct_of_users },
              ]
              return (
                <div key={ch.key} className={`grid grid-cols-[200px_repeat(5,1fr)] gap-4 items-center border-l-4 ${ch.color} pl-4 py-2`}>
                  <div>
                    <div className="text-xl text-white font-medium">{ch.name}</div>
                    <div className="text-sm text-gray-500">{organicData.this_week[ch.key].purchases} purch</div>
                  </div>
                  {weeks.map((wk, idx) => {
                    const allUsers = weeks.map(w => w.users)
                    const minVal = Math.min(...allUsers)
                    const maxVal = Math.max(...allUsers)
                    const intensity = maxVal > minVal ? ((wk.users - minVal) / (maxVal - minVal)) : 0.5
                    const blueOpacity = 0.2 + (intensity * 0.5) // Range: 0.2 to 0.7
                    return (
                      <div 
                        key={idx} 
                        className="text-center rounded-lg py-3"
                        style={{ backgroundColor: `rgba(59, 130, 246, ${blueOpacity})` }}
                      >
                        <div className="text-2xl font-bold text-white">{fmtK(wk.users)}</div>
                        <div className="text-xl font-bold text-cyan-400">{fmtPctWhole(wk.pct)}</div>
                      </div>
                    )
                  })}
                </div>
              )
            })}
            
            {/* Total Row */}
            <div className="grid grid-cols-[200px_repeat(5,1fr)] gap-4 items-center border-t-2 border-gray-700 pt-3 mt-3">
              <div className="text-xl text-white font-bold">TOTAL</div>
              {[
                organicData.this_week.totals.users,
                organicData.last_week.totals.users,
                organicData.two_weeks_ago.totals.users,
                organicData.three_weeks_ago.totals.users,
                organicData.four_weeks_ago.totals.users,
              ].map((total, idx) => (
                <div key={idx} className="text-center rounded-lg py-3 bg-gray-800">
                  <div className="text-2xl font-bold text-white">{fmtK(total)}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Conversions by Channel */}
        <div className="bg-gray-900 rounded-2xl p-8">
          <div className="text-gray-400 text-2xl mb-6 font-semibold uppercase tracking-wide">Conversions by Channel</div>
          
          {/* Column Headers */}
          <div className="grid grid-cols-[200px_repeat(5,1fr)] gap-4 mb-4 pb-3 border-b border-gray-800">
            <div />
            <div className="text-center text-gray-500 text-sm">This Wk</div>
            <div className="text-center text-gray-500 text-sm">Last Wk</div>
            <div className="text-center text-gray-500 text-sm">2 Wks</div>
            <div className="text-center text-gray-500 text-sm">3 Wks</div>
            <div className="text-center text-gray-500 text-sm">4 Wks</div>
          </div>

          {/* Data Rows */}
          <div className="space-y-3">
            {[
              { name: "Google Ads", key: "google_ads" as const, color: "border-green-500" },
              { name: "Google Organic", key: "google_organic" as const, color: "border-blue-500" },
              { name: "Direct", key: "direct" as const, color: "border-gray-500" },
              { name: "Bing Organic", key: "bing_organic" as const, color: "border-teal-500" },
              { name: "QB Intuit", key: "qb_intuit" as const, color: "border-emerald-500" },
              { name: "Other", key: "other" as const, color: "border-purple-500" },
            ].map((ch) => {
              const weeks = [
                { purchases: organicData.this_week[ch.key].purchases, pct: organicData.this_week[ch.key].pct_of_purchases },
                { purchases: organicData.last_week[ch.key].purchases, pct: organicData.last_week[ch.key].pct_of_purchases },
                { purchases: organicData.two_weeks_ago[ch.key].purchases, pct: organicData.two_weeks_ago[ch.key].pct_of_purchases },
                { purchases: organicData.three_weeks_ago[ch.key].purchases, pct: organicData.three_weeks_ago[ch.key].pct_of_purchases },
                { purchases: organicData.four_weeks_ago[ch.key].purchases, pct: organicData.four_weeks_ago[ch.key].pct_of_purchases },
              ]
              return (
                <div key={ch.key} className={`grid grid-cols-[200px_repeat(5,1fr)] gap-4 items-center border-l-4 ${ch.color} pl-4 py-2`}>
                  <div>
                    <div className="text-xl text-white font-medium">{ch.name}</div>
                    <div className="text-sm text-gray-500">{organicData.this_week[ch.key].conv_rate.toFixed(1)}% rate</div>
                  </div>
                  {weeks.map((wk, idx) => {
                    const allPurchases = weeks.map(w => w.purchases)
                    const minVal = Math.min(...allPurchases)
                    const maxVal = Math.max(...allPurchases)
                    const intensity = maxVal > minVal ? ((wk.purchases - minVal) / (maxVal - minVal)) : 0.5
                    const greenOpacity = 0.2 + (intensity * 0.5) // Range: 0.2 to 0.7
                    return (
                      <div 
                        key={idx} 
                        className="text-center rounded-lg py-3"
                        style={{ backgroundColor: `rgba(34, 197, 94, ${greenOpacity})` }}
                      >
                        <div className="text-2xl font-bold text-white">{wk.purchases}</div>
                        <div className="text-xl font-bold text-yellow-300">{fmtPctWhole(wk.pct)}</div>
                      </div>
                    )
                  })}
                </div>
              )
            })}
            
            {/* Total Row */}
            <div className="grid grid-cols-[200px_repeat(5,1fr)] gap-4 items-center border-t-2 border-gray-700 pt-3 mt-3">
              <div className="text-xl text-white font-bold">TOTAL</div>
              {[
                organicData.this_week.totals.purchases,
                organicData.last_week.totals.purchases,
                organicData.two_weeks_ago.totals.purchases,
                organicData.three_weeks_ago.totals.purchases,
                organicData.four_weeks_ago.totals.purchases,
              ].map((total, idx) => (
                <div key={idx} className="text-center rounded-lg py-3 bg-gray-800">
                  <div className="text-2xl font-bold text-white">{total}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
