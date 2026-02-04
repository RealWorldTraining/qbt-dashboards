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
  last_updated: ""
}
const LOADING_CAMPAIGNS: CampaignData = { weeks: [], campaigns: [], last_updated: "" }

const fmt = (n: number) => new Intl.NumberFormat("en-US").format(Math.round(n))
const fmtK = (n: number) => n >= 1000 ? (n/1000).toFixed(1) + "k" : fmt(n)
const fmtCurrency = (n: number) => "$" + fmt(n)
const fmtPct = (n: number) => n.toFixed(1) + "%"

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
  const totalSpend = adsData.this_week.spend + bingAdsData.this_week.spend
  const totalConv = adsData.this_week.conversions + bingAdsData.this_week.conversions
  const blendedCPA = totalConv > 0 ? totalSpend / totalConv : 0

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

      {/* MAIN GRID - 3 columns */}
      <div className="flex-1 grid grid-cols-3 gap-4">
        
        {/* LEFT COLUMN - Overview + Traffic */}
        <div className="flex flex-col gap-4">
          {/* Big Numbers */}
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-6 flex-1">
            <div className="text-gray-400 text-lg mb-2">SITE OVERVIEW</div>
            <div className="grid grid-cols-3 gap-4 h-full">
              <div className="flex flex-col justify-center">
                <div className="text-6xl font-bold text-white">{fmtK(organicData.this_week.totals.users)}</div>
                <div className="text-xl text-gray-400 mt-1">New Visitors</div>
                <Trend current={organicData.this_week.totals.users} previous={organicData.last_week.totals.users} />
              </div>
              <div className="flex flex-col justify-center">
                <div className="text-6xl font-bold text-green-400">{organicData.this_week.totals.purchases}</div>
                <div className="text-xl text-gray-400 mt-1">Conversions</div>
                <Trend current={organicData.this_week.totals.purchases} previous={organicData.last_week.totals.purchases} />
              </div>
              <div className="flex flex-col justify-center">
                <div className="text-6xl font-bold text-cyan-400">
                  {organicData.this_week.totals.users > 0 ? (organicData.this_week.totals.purchases / organicData.this_week.totals.users * 100).toFixed(1) : "0"}%
                </div>
                <div className="text-xl text-gray-400 mt-1">Conv Rate</div>
              </div>
            </div>
          </div>

          {/* Traffic Channels */}
          <div className="bg-gray-900 rounded-2xl p-5 flex-1">
            <div className="text-gray-400 text-lg mb-3">TRAFFIC BY CHANNEL</div>
            <div className="space-y-3">
              {[
                { name: "Google Ads", data: organicData.this_week.google_ads, prev: organicData.last_week.google_ads, color: "bg-green-500" },
                { name: "Google Organic", data: organicData.this_week.google_organic, prev: organicData.last_week.google_organic, color: "bg-blue-500" },
                { name: "Direct", data: organicData.this_week.direct, prev: organicData.last_week.direct, color: "bg-gray-500" },
                { name: "Bing Organic", data: organicData.this_week.bing_organic, prev: organicData.last_week.bing_organic, color: "bg-teal-500" },
                { name: "QB Intuit", data: organicData.this_week.qb_intuit, prev: organicData.last_week.qb_intuit, color: "bg-emerald-500" },
                { name: "Other", data: organicData.this_week.other, prev: organicData.last_week.other, color: "bg-purple-500" },
              ].map((ch, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className={`w-2 h-10 rounded ${ch.color}`} />
                  <div className="flex-1">
                    <div className="flex justify-between items-baseline">
                      <span className="text-lg text-gray-300">{ch.name}</span>
                      <span className="text-2xl font-bold">{fmtK(ch.data.users)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500">{ch.data.purchases} purchases</span>
                      <span className="text-lg text-cyan-400">{fmtPct(ch.data.pct_of_users)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* CENTER COLUMN - Google Ads */}
        <div className="flex flex-col gap-4">
          <div className="bg-gray-900 rounded-2xl p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-4 h-4 bg-red-500 rounded-full" />
              <span className="text-xl font-semibold">Google Ads</span>
            </div>
            <div className="grid grid-cols-4 gap-3">
              {[
                { label: "Spend", value: fmtCurrency(adsData.this_week.spend), prev: adsData.last_week.spend, curr: adsData.this_week.spend },
                { label: "Clicks", value: fmt(adsData.this_week.clicks), prev: adsData.last_week.clicks, curr: adsData.this_week.clicks },
                { label: "Conv", value: String(adsData.this_week.conversions), prev: adsData.last_week.conversions, curr: adsData.this_week.conversions },
                { label: "CPA", value: fmtCurrency(adsData.this_week.cpa), prev: adsData.last_week.cpa, curr: adsData.this_week.cpa, inverse: true },
              ].map((m, i) => (
                <div key={i} className="bg-gray-800 rounded-xl p-4 text-center">
                  <div className="text-gray-500 text-sm">{m.label}</div>
                  <div className="text-3xl font-bold mt-1">{m.value}</div>
                  <div className="mt-1"><Trend current={m.curr} previous={m.prev} inverse={m.inverse} /></div>
                </div>
              ))}
            </div>
          </div>

          {/* Google Campaigns */}
          <div className="bg-gray-900 rounded-2xl p-5 flex-1">
            <div className="text-gray-400 text-sm mb-3">GOOGLE CAMPAIGNS</div>
            <div className="grid grid-cols-2 gap-3">
              {gCampaigns.slice(0, 8).map((campaign, idx) => {
                const c = campaign.data[0]
                if (!c) return <div key={idx} className="bg-gray-800 rounded-xl p-3 opacity-50 text-center text-gray-500">No data</div>
                const cpa = c.conversions > 0 ? c.cost / c.conversions : 0
                const isDesktop = campaign.name.includes('Desktop')
                return (
                  <div key={campaign.name} className={`bg-gray-800 rounded-xl p-4 ${isDesktop ? 'border-l-4 border-blue-500' : 'border-l-4 border-orange-500'}`}>
                    <div className="text-sm text-gray-400 truncate mb-2">{campaign.name.split('-')[0]}</div>
                    <div className="flex justify-between items-end">
                      <div>
                        <div className="text-3xl font-bold">{fmt(c.clicks)}</div>
                        <div className="text-xs text-gray-500">clicks</div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-green-400">{c.conversions}</div>
                        <div className="text-xs text-gray-500">conv</div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-yellow-400">{fmtCurrency(cpa)}</div>
                        <div className="text-xs text-gray-500">CPA</div>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-2 text-xs">
                      <span className="text-cyan-400">{fmtPct(c.search_impression_share)} IS</span>
                      <span className="text-orange-400">{fmtPct(c.search_abs_top_impression_share)} Top</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN - Bing Ads + Totals */}
        <div className="flex flex-col gap-4">
          <div className="bg-gray-900 rounded-2xl p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-4 h-4 bg-blue-400 rounded-full" />
              <span className="text-xl font-semibold">Bing Ads</span>
            </div>
            <div className="grid grid-cols-4 gap-3">
              {[
                { label: "Spend", value: fmtCurrency(bingAdsData.this_week.spend), prev: bingAdsData.last_week.spend, curr: bingAdsData.this_week.spend },
                { label: "Clicks", value: fmt(bingAdsData.this_week.clicks), prev: bingAdsData.last_week.clicks, curr: bingAdsData.this_week.clicks },
                { label: "Conv", value: String(bingAdsData.this_week.conversions), prev: bingAdsData.last_week.conversions, curr: bingAdsData.this_week.conversions },
                { label: "CPA", value: fmtCurrency(bingAdsData.this_week.cpa), prev: bingAdsData.last_week.cpa, curr: bingAdsData.this_week.cpa, inverse: true },
              ].map((m, i) => (
                <div key={i} className="bg-gray-800 rounded-xl p-4 text-center">
                  <div className="text-gray-500 text-sm">{m.label}</div>
                  <div className="text-3xl font-bold mt-1">{m.value}</div>
                  <div className="mt-1"><Trend current={m.curr} previous={m.prev} inverse={m.inverse} /></div>
                </div>
              ))}
            </div>
          </div>

          {/* Bing Campaigns */}
          <div className="bg-gray-900 rounded-2xl p-5">
            <div className="text-gray-400 text-sm mb-3">BING CAMPAIGNS</div>
            <div className="grid grid-cols-2 gap-3">
              {bCampaigns.slice(0, 4).map((campaign, idx) => {
                const c = campaign.data[0]
                if (!c) return <div key={idx} className="bg-gray-800 rounded-xl p-3 opacity-50 text-gray-500 text-center">No data</div>
                const cpa = c.conversions > 0 ? c.cost / c.conversions : 0
                return (
                  <div key={campaign.name} className="bg-gray-800 rounded-xl p-4 border-l-4 border-teal-500">
                    <div className="text-sm text-gray-400 truncate mb-2">{campaign.name.split('-')[0]}</div>
                    <div className="flex justify-between items-end">
                      <div>
                        <div className="text-2xl font-bold">{fmt(c.clicks)}</div>
                        <div className="text-xs text-gray-500">clicks</div>
                      </div>
                      <div className="text-right">
                        <div className="text-xl font-bold text-green-400">{c.conversions}</div>
                        <div className="text-xs text-gray-500">conv</div>
                      </div>
                      <div className="text-right">
                        <div className="text-xl font-bold text-yellow-400">{fmtCurrency(cpa)}</div>
                        <div className="text-xs text-gray-500">CPA</div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Combined Totals */}
          <div className="bg-gradient-to-br from-cyan-900/50 to-blue-900/50 rounded-2xl p-6 flex-1 border border-cyan-700/50">
            <div className="text-cyan-400 text-xl font-semibold mb-4">COMBINED TOTALS</div>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <div className="text-gray-400 text-lg">Total Spend</div>
                <div className="text-5xl font-bold">{fmtCurrency(totalSpend)}</div>
              </div>
              <div>
                <div className="text-gray-400 text-lg">Total Clicks</div>
                <div className="text-5xl font-bold">{fmt(adsData.this_week.clicks + bingAdsData.this_week.clicks)}</div>
              </div>
              <div>
                <div className="text-gray-400 text-lg">Total Conversions</div>
                <div className="text-5xl font-bold text-green-400">{totalConv}</div>
              </div>
              <div>
                <div className="text-gray-400 text-lg">Blended CPA</div>
                <div className="text-5xl font-bold text-yellow-400">{fmtCurrency(blendedCPA)}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
