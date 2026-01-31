"use client"

import { useEffect, useState } from "react"
import { RefreshCw } from "lucide-react"

// Types for Google Ads data
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

// Types for Organic data
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

// Types for Campaign data
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

// Initial loading states
const LOADING_ADS: AdsData = {
  this_week: { week_label: "Last Week", date_range: "Loading...", spend: 0, impressions: 0, clicks: 0, ctr: 0, conversions: 0, conversion_rate: 0, cpa: 0, roas: 0 },
  last_week: { week_label: "2 Weeks Ago", date_range: "Loading...", spend: 0, impressions: 0, clicks: 0, ctr: 0, conversions: 0, conversion_rate: 0, cpa: 0, roas: 0 },
  two_weeks_ago: { week_label: "3 Weeks Ago", date_range: "Loading...", spend: 0, impressions: 0, clicks: 0, ctr: 0, conversions: 0, conversion_rate: 0, cpa: 0, roas: 0 },
  three_weeks_ago: { week_label: "4 Weeks Ago", date_range: "Loading...", spend: 0, impressions: 0, clicks: 0, ctr: 0, conversions: 0, conversion_rate: 0, cpa: 0, roas: 0 },
  last_updated: new Date().toISOString()
}

const LOADING_CHANNEL: ChannelMetrics = { users: 0, purchases: 0, conv_rate: 0, pct_of_users: 0, pct_of_purchases: 0 }
const LOADING_CAMPAIGNS: CampaignData = {
  weeks: [],
  campaigns: [],
  last_updated: new Date().toISOString()
}

// Bing Ads types (same structure as Google)
interface BingAdsData {
  this_week: WeeklyMetrics
  last_week: WeeklyMetrics
  two_weeks_ago: WeeklyMetrics
  three_weeks_ago: WeeklyMetrics
  last_updated: string
}

const LOADING_BING_ADS: BingAdsData = {
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

function formatCurrency(value: number): string {
  return "$" + new Intl.NumberFormat("en-US").format(Math.round(value))
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-US").format(Math.round(value))
}

function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`
}

// Google Ads Hero Card
interface AdsCardProps {
  title: string
  value: string | number
  accentColor: string
  comparisons: { label: string; value: number; change: number }[]
  format?: (v: number) => string
  inverse?: boolean
}

function AdsCard({ title, value, accentColor, comparisons, format = formatNumber, inverse = false }: AdsCardProps) {
  return (
    <div className="bg-[#1a1a1a] rounded-lg overflow-hidden">
      <div className={`h-1 ${accentColor}`} />
      <div className="p-4">
        <div className="text-gray-400 text-xs mb-1">{title}</div>
        <div className="text-white text-3xl font-bold mb-3">{value}</div>
        <div className="space-y-1">
          {comparisons.map((comp, i) => {
            const isPos = inverse ? comp.change < 0 : comp.change > 0
            const isNeg = inverse ? comp.change > 0 : comp.change < 0
            const color = isPos ? "text-green-500" : isNeg ? "text-red-500" : "text-gray-400"
            return (
              <div key={i} className="flex justify-between text-xs">
                <span className="text-gray-500">{comp.label}</span>
                <span className={color}>{comp.change >= 0 ? "+" : ""}{comp.change.toFixed(0)}%</span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// Traffic Channel Card - Redesigned
interface ChannelCardProps {
  name: string
  accentColor: string
  current: ChannelMetrics
  weeks: { label: string; data: ChannelMetrics }[]
}

function ChannelCard({ name, accentColor, current, weeks }: ChannelCardProps) {
  return (
    <div className="bg-[#1a1a1a] rounded-lg overflow-hidden">
      <div className={`h-1 ${accentColor}`} />
      <div className="p-4">
        {/* Channel name */}
        <div className="text-gray-400 text-xs font-medium mb-3">{name}</div>
        
        {/* Main metrics - 2x2 grid */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div>
            <div className="text-white text-2xl font-bold">{formatNumber(current.users)}</div>
            <div className="text-gray-500 text-xs">New Visitors</div>
          </div>
          <div>
            <div className="text-cyan-400 text-2xl font-bold">{formatPercent(current.pct_of_users)}</div>
            <div className="text-gray-500 text-xs">% of Total</div>
          </div>
          <div>
            <div className="text-white text-2xl font-bold">{current.purchases}</div>
            <div className="text-gray-500 text-xs">Purchases</div>
          </div>
          <div>
            <div className="text-orange-400 text-2xl font-bold">{formatPercent(current.pct_of_purchases)}</div>
            <div className="text-gray-500 text-xs">% of Total</div>
          </div>
        </div>
        
        {/* Conversion rate */}
        <div className="mb-3 pb-3 border-b border-gray-800">
          <span className="text-gray-500 text-xs">Conv Rate: </span>
          <span className="text-white text-sm font-medium">{formatPercent(current.conv_rate)}</span>
        </div>
        
        {/* Week comparisons - Cleaner layout */}
        <div className="space-y-2">
          {weeks.map((week, i) => {
            const userChange = current.users > 0 && week.data.users > 0 
              ? ((current.users - week.data.users) / week.data.users * 100) : 0
            const purchaseChange = current.purchases > 0 && week.data.purchases > 0 
              ? ((current.purchases - week.data.purchases) / week.data.purchases * 100) : 0
            
            const userColor = userChange > 0 ? "text-green-500" : userChange < 0 ? "text-red-500" : "text-gray-500"
            const purchaseColor = purchaseChange > 0 ? "text-green-500" : purchaseChange < 0 ? "text-red-500" : "text-gray-500"
            
            return (
              <div key={i} className="flex items-center justify-between text-xs">
                <span className="text-gray-600 w-20">{week.label}</span>
                <div className="flex gap-4">
                  <div className="text-right w-16">
                    <span className="text-gray-400">{formatNumber(week.data.users)}</span>
                    <span className={`ml-1 ${userColor}`}>
                      ({userChange >= 0 ? "+" : ""}{userChange.toFixed(0)}%)
                    </span>
                  </div>
                  <div className="text-right w-16">
                    <span className="text-gray-400">{week.data.purchases}</span>
                    <span className={`ml-1 ${purchaseColor}`}>
                      ({purchaseChange >= 0 ? "+" : ""}{purchaseChange.toFixed(0)}%)
                    </span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default function AdsPage() {
  const [adsData, setAdsData] = useState<AdsData>(LOADING_ADS)
  const [organicData, setOrganicData] = useState<OrganicData>(LOADING_ORGANIC)
  const [campaignData, setCampaignData] = useState<CampaignData>(LOADING_CAMPAIGNS)
  const [bingAdsData, setBingAdsData] = useState<BingAdsData>(LOADING_BING_ADS)
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

  // Build ads comparisons
  const buildAdsComparisons = (metric: keyof WeeklyMetrics) => {
    const current = adsData.this_week[metric] as number
    return [
      { label: "2 wks", value: adsData.last_week[metric] as number, change: ((current - (adsData.last_week[metric] as number)) / (adsData.last_week[metric] as number)) * 100 },
      { label: "3 wks", value: adsData.two_weeks_ago[metric] as number, change: ((current - (adsData.two_weeks_ago[metric] as number)) / (adsData.two_weeks_ago[metric] as number)) * 100 },
      { label: "4 wks", value: adsData.three_weeks_ago[metric] as number, change: ((current - (adsData.three_weeks_ago[metric] as number)) / (adsData.three_weeks_ago[metric] as number)) * 100 },
    ]
  }

  // Build Bing ads comparisons
  const buildBingComparisons = (metric: keyof WeeklyMetrics) => {
    const current = bingAdsData.this_week[metric] as number
    return [
      { label: "2 wks", value: bingAdsData.last_week[metric] as number, change: ((current - (bingAdsData.last_week[metric] as number)) / (bingAdsData.last_week[metric] as number)) * 100 },
      { label: "3 wks", value: bingAdsData.two_weeks_ago[metric] as number, change: ((current - (bingAdsData.two_weeks_ago[metric] as number)) / (bingAdsData.two_weeks_ago[metric] as number)) * 100 },
      { label: "4 wks", value: bingAdsData.three_weeks_ago[metric] as number, change: ((current - (bingAdsData.three_weeks_ago[metric] as number)) / (bingAdsData.three_weeks_ago[metric] as number)) * 100 },
    ]
  }

  // Build channel weeks data
  type ChannelKey = 'google_ads' | 'google_organic' | 'direct' | 'bing_organic' | 'qb_intuit' | 'other'
  
  const buildChannelWeeks = (channel: ChannelKey) => [
    { label: "2 wks ago", data: organicData.last_week[channel] },
    { label: "3 wks ago", data: organicData.two_weeks_ago[channel] },
    { label: "4 wks ago", data: organicData.three_weeks_ago[channel] },
  ]

  return (
    <div className="min-h-screen bg-black p-4">
      <div className="max-w-[1920px] mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <h1 className="text-white text-lg font-medium">Marketing Dashboard</h1>
            <span className="text-gray-500 text-xs">
              {lastRefresh.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-gray-400 text-sm">{adsData.this_week.date_range}</span>
            <button onClick={fetchData} disabled={loading} className="p-1.5 rounded hover:bg-gray-800">
              <RefreshCw className={`h-4 w-4 text-gray-400 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Top KPI Cards */}
        <div className="grid grid-cols-3 gap-4 mb-4">
          {/* New Visitors Card */}
          <div className="bg-[#1a1a1a] rounded-lg overflow-hidden">
            <div className="h-1 bg-blue-500" />
            <div className="p-6">
              <div className="text-gray-400 text-sm mb-2">NEW VISITORS</div>
              <div className="text-white text-5xl font-bold mb-4">{formatNumber(organicData.this_week.totals.users)}</div>
              <div className="space-y-2">
                {[
                  { label: "vs 2 wks", data: organicData.last_week },
                  { label: "vs 3 wks", data: organicData.two_weeks_ago },
                  { label: "vs 4 wks", data: organicData.three_weeks_ago }
                ].map((comp, i) => {
                  const change = comp.data.totals.users > 0 
                    ? ((organicData.this_week.totals.users - comp.data.totals.users) / comp.data.totals.users * 100) : 0
                  const color = change > 0 ? "text-green-500" : change < 0 ? "text-red-500" : "text-gray-400"
                  return (
                    <div key={i} className="flex justify-between text-sm">
                      <span className="text-gray-500">{comp.label}</span>
                      <span className={color}>{change >= 0 ? "+" : ""}{change.toFixed(1)}%</span>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Conversions Card */}
          <div className="bg-[#1a1a1a] rounded-lg overflow-hidden">
            <div className="h-1 bg-green-500" />
            <div className="p-6">
              <div className="text-gray-400 text-sm mb-2">CONVERSIONS</div>
              <div className="text-white text-5xl font-bold mb-4">{organicData.this_week.totals.purchases}</div>
              <div className="space-y-2">
                {[
                  { label: "vs 2 wks", data: organicData.last_week },
                  { label: "vs 3 wks", data: organicData.two_weeks_ago },
                  { label: "vs 4 wks", data: organicData.three_weeks_ago }
                ].map((comp, i) => {
                  const change = comp.data.totals.purchases > 0 
                    ? ((organicData.this_week.totals.purchases - comp.data.totals.purchases) / comp.data.totals.purchases * 100) : 0
                  const color = change > 0 ? "text-green-500" : change < 0 ? "text-red-500" : "text-gray-400"
                  return (
                    <div key={i} className="flex justify-between text-sm">
                      <span className="text-gray-500">{comp.label}</span>
                      <span className={color}>{change >= 0 ? "+" : ""}{change.toFixed(1)}%</span>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Conversion Rate Card */}
          <div className="bg-[#1a1a1a] rounded-lg overflow-hidden">
            <div className="h-1 bg-purple-500" />
            <div className="p-6">
              <div className="text-gray-400 text-sm mb-2">CONVERSION RATE</div>
              <div className="text-white text-5xl font-bold mb-4">
                {organicData.this_week.totals.users > 0 
                  ? (organicData.this_week.totals.purchases / organicData.this_week.totals.users * 100).toFixed(2) 
                  : "0"}%
              </div>
              <div className="space-y-2">
                {[
                  { label: "vs 2 wks", data: organicData.last_week },
                  { label: "vs 3 wks", data: organicData.two_weeks_ago },
                  { label: "vs 4 wks", data: organicData.three_weeks_ago }
                ].map((comp, i) => {
                  const currentRate = organicData.this_week.totals.users > 0 
                    ? (organicData.this_week.totals.purchases / organicData.this_week.totals.users * 100) : 0
                  const prevRate = comp.data.totals.users > 0 
                    ? (comp.data.totals.purchases / comp.data.totals.users * 100) : 0
                  const change = prevRate > 0 ? ((currentRate - prevRate) / prevRate * 100) : 0
                  const color = change > 0 ? "text-green-500" : change < 0 ? "text-red-500" : "text-gray-400"
                  return (
                    <div key={i} className="flex justify-between text-sm">
                      <span className="text-gray-500">{comp.label}</span>
                      <span className={color}>{change >= 0 ? "+" : ""}{change.toFixed(1)}%</span>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Traffic Channels - 6 columns */}
        <div className="mb-6">
          <h2 className="text-gray-400 text-xs font-medium mb-2 uppercase tracking-wide">Traffic by Channel</h2>
          <div className="grid grid-cols-6 gap-3">
            <ChannelCard
              name="GOOGLE ADS"
              accentColor="bg-green-500"
              current={organicData.this_week.google_ads}
              weeks={buildChannelWeeks('google_ads')}
            />
            <ChannelCard
              name="GOOGLE ORGANIC"
              accentColor="bg-blue-500"
              current={organicData.this_week.google_organic}
              weeks={buildChannelWeeks('google_organic')}
            />
            <ChannelCard
              name="DIRECT"
              accentColor="bg-gray-500"
              current={organicData.this_week.direct}
              weeks={buildChannelWeeks('direct')}
            />
            <ChannelCard
              name="BING ORGANIC"
              accentColor="bg-teal-500"
              current={organicData.this_week.bing_organic}
              weeks={buildChannelWeeks('bing_organic')}
            />
            <ChannelCard
              name="QB INTUIT REFERRAL"
              accentColor="bg-emerald-500"
              current={organicData.this_week.qb_intuit}
              weeks={buildChannelWeeks('qb_intuit')}
            />
            <ChannelCard
              name="OTHER"
              accentColor="bg-purple-500"
              current={organicData.this_week.other}
              weeks={buildChannelWeeks('other')}
            />
          </div>
        </div>

        {/* Google Ads Performance - 2 rows of 4 */}
        <div className="mb-4">
          <h2 className="text-gray-400 text-xs font-medium mb-2 uppercase tracking-wide">Google Ads Performance</h2>
          <div className="grid grid-cols-8 gap-3">
            <AdsCard title="SPEND" value={formatCurrency(adsData.this_week.spend)} accentColor="bg-green-500" comparisons={buildAdsComparisons('spend')} />
            <AdsCard title="IMPRESSIONS" value={formatNumber(adsData.this_week.impressions)} accentColor="bg-blue-500" comparisons={buildAdsComparisons('impressions')} />
            <AdsCard title="CLICKS" value={formatNumber(adsData.this_week.clicks)} accentColor="bg-purple-500" comparisons={buildAdsComparisons('clicks')} />
            <AdsCard title="CTR" value={formatPercent(adsData.this_week.ctr)} accentColor="bg-cyan-500" comparisons={buildAdsComparisons('ctr')} />
            <AdsCard title="CONVERSIONS" value={adsData.this_week.conversions} accentColor="bg-orange-500" comparisons={buildAdsComparisons('conversions')} />
            <AdsCard title="CONV RATE" value={formatPercent(adsData.this_week.conversion_rate)} accentColor="bg-emerald-500" comparisons={buildAdsComparisons('conversion_rate')} />
            <AdsCard title="CPA" value={formatCurrency(adsData.this_week.cpa)} accentColor="bg-red-500" comparisons={buildAdsComparisons('cpa')} inverse={true} />
            <AdsCard title="ROAS" value={`${adsData.this_week.roas.toFixed(2)}x`} accentColor="bg-pink-500" comparisons={buildAdsComparisons('roas')} />
          </div>
        </div>

        {/* Campaign Performance */}
        {campaignData.campaigns.length > 0 && (() => {
          // Custom sort order: Desktop row then Mobile row
          const campaignOrder = [
            'Certification-Desktop', 'Training-Desktop', 'Classes-Desktop', 'Courses-Desktop',
            'Certification-Mobile', 'Training-Mobile', 'Classes-Mobile', 'Courses-Mobile'
          ]
          const sortedCampaigns = [...campaignData.campaigns].sort((a, b) => {
            const aIdx = campaignOrder.findIndex(name => a.name.includes(name.split('-')[0]) && a.name.includes(name.split('-')[1]))
            const bIdx = campaignOrder.findIndex(name => b.name.includes(name.split('-')[0]) && b.name.includes(name.split('-')[1]))
            if (aIdx === -1) return 1
            if (bIdx === -1) return -1
            return aIdx - bIdx
          })
          
          return (
          <div className="mb-4">
            <h2 className="text-gray-400 text-xs font-medium mb-2 uppercase tracking-wide">Google Ads Campaign Performance (Last Week)</h2>
            <div className="grid grid-cols-4 gap-3">
              {sortedCampaigns.map((campaign, idx) => {
                const current = campaign.data[0]
                if (!current) return null
                
                const colors = ['bg-green-500', 'bg-blue-500', 'bg-purple-500', 'bg-cyan-500', 'bg-orange-500', 'bg-pink-500', 'bg-teal-500', 'bg-yellow-500']
                const accentColor = colors[idx % colors.length]
                
                return (
                  <div key={campaign.name} className="bg-[#1a1a1a] rounded-lg overflow-hidden">
                    <div className={`h-1 ${accentColor}`} />
                    <div className="p-3">
                      <div className="text-gray-400 text-xs font-medium mb-2 truncate" title={campaign.name}>
                        {campaign.name.replace(/-/g, ' ').toUpperCase()}
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-xs mb-2">
                        <div>
                          <div className="text-white font-bold">{formatNumber(current.clicks)}</div>
                          <div className="text-gray-500">Clicks</div>
                        </div>
                        <div>
                          <div className="text-white font-bold">{formatNumber(current.impressions)}</div>
                          <div className="text-gray-500">Impr</div>
                        </div>
                        <div>
                          <div className="text-white font-bold">{formatPercent(current.ctr)}</div>
                          <div className="text-gray-500">CTR</div>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-xs mb-2">
                        <div>
                          <div className="text-white font-bold">${current.avg_cpc.toFixed(2)}</div>
                          <div className="text-gray-500">Avg CPC</div>
                        </div>
                        <div>
                          <div className="text-white font-bold">{formatCurrency(current.cost)}</div>
                          <div className="text-gray-500">Cost</div>
                        </div>
                        <div>
                          <div className="text-white font-bold">{current.conversions}</div>
                          <div className="text-gray-500">Conv</div>
                        </div>
                      </div>
                      <div className="grid grid-cols-4 gap-2 text-xs border-t border-gray-800 pt-2">
                        <div>
                          <div className="text-cyan-400 font-bold">{formatPercent(current.search_impression_share)}</div>
                          <div className="text-gray-500">Impr Share</div>
                        </div>
                        <div>
                          <div className="text-yellow-400 font-bold">{formatPercent(current.search_top_impression_share)}</div>
                          <div className="text-gray-500">Top</div>
                        </div>
                        <div>
                          <div className="text-orange-400 font-bold">{formatPercent(current.search_abs_top_impression_share)}</div>
                          <div className="text-gray-500">Abs Top</div>
                        </div>
                        <div>
                          <div className="text-green-400 font-bold">{formatPercent(current.click_share)}</div>
                          <div className="text-gray-500">Click Sh</div>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )})()}

        {/* Bing Ads Performance */}
        <div className="mb-4">
          <h2 className="text-gray-400 text-xs font-medium mb-2 uppercase tracking-wide">Bing Ads Performance</h2>
          <div className="grid grid-cols-8 gap-3">
            <AdsCard title="SPEND" value={formatCurrency(bingAdsData.this_week.spend)} accentColor="bg-teal-500" comparisons={buildBingComparisons('spend')} />
            <AdsCard title="IMPRESSIONS" value={formatNumber(bingAdsData.this_week.impressions)} accentColor="bg-blue-400" comparisons={buildBingComparisons('impressions')} />
            <AdsCard title="CLICKS" value={formatNumber(bingAdsData.this_week.clicks)} accentColor="bg-indigo-500" comparisons={buildBingComparisons('clicks')} />
            <AdsCard title="CTR" value={formatPercent(bingAdsData.this_week.ctr)} accentColor="bg-cyan-400" comparisons={buildBingComparisons('ctr')} />
            <AdsCard title="CONVERSIONS" value={bingAdsData.this_week.conversions} accentColor="bg-amber-500" comparisons={buildBingComparisons('conversions')} />
            <AdsCard title="CONV RATE" value={formatPercent(bingAdsData.this_week.conversion_rate)} accentColor="bg-lime-500" comparisons={buildBingComparisons('conversion_rate')} />
            <AdsCard title="CPA" value={formatCurrency(bingAdsData.this_week.cpa)} accentColor="bg-rose-500" comparisons={buildBingComparisons('cpa')} inverse={true} />
            <AdsCard title="ROAS" value={`${bingAdsData.this_week.roas.toFixed(2)}x`} accentColor="bg-fuchsia-500" comparisons={buildBingComparisons('roas')} />
          </div>
        </div>

        {/* Bing Campaign Performance */}
        {bingCampaignData.campaigns.length > 0 && (() => {
          // Sort order: Certification, Training, Classes, Courses (all Desktop)
          const bingOrder = ['Certification-Desktop', 'Training-Desktop', 'Classes-Desktop', 'Courses-Desktop']
          const sortedBingCampaigns = [...bingCampaignData.campaigns].sort((a, b) => {
            const aIdx = bingOrder.findIndex(name => a.name.includes(name.split('-')[0]))
            const bIdx = bingOrder.findIndex(name => b.name.includes(name.split('-')[0]))
            if (aIdx === -1) return 1
            if (bIdx === -1) return -1
            return aIdx - bIdx
          })
          
          return (
          <div className="mb-4">
            <h2 className="text-gray-400 text-xs font-medium mb-2 uppercase tracking-wide">Bing Ads Campaign Performance (Last Week)</h2>
            <div className="grid grid-cols-4 gap-3">
              {sortedBingCampaigns.map((campaign, idx) => {
                const current = campaign.data[0]
                if (!current) return null
                
                const colors = ['bg-teal-500', 'bg-blue-400', 'bg-indigo-500', 'bg-cyan-400']
                const accentColor = colors[idx % colors.length]
                
                return (
                  <div key={campaign.name} className="bg-[#1a1a1a] rounded-lg overflow-hidden">
                    <div className={`h-1 ${accentColor}`} />
                    <div className="p-3">
                      <div className="text-gray-400 text-xs font-medium mb-2 truncate" title={campaign.name}>
                        {campaign.name.replace(/-/g, ' ').toUpperCase()}
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-xs mb-2">
                        <div>
                          <div className="text-white font-bold">{formatNumber(current.clicks)}</div>
                          <div className="text-gray-500">Clicks</div>
                        </div>
                        <div>
                          <div className="text-white font-bold">{formatNumber(current.impressions)}</div>
                          <div className="text-gray-500">Impr</div>
                        </div>
                        <div>
                          <div className="text-white font-bold">{formatPercent(current.ctr)}</div>
                          <div className="text-gray-500">CTR</div>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-xs mb-2">
                        <div>
                          <div className="text-white font-bold">${current.avg_cpc.toFixed(2)}</div>
                          <div className="text-gray-500">Avg CPC</div>
                        </div>
                        <div>
                          <div className="text-white font-bold">{formatCurrency(current.cost)}</div>
                          <div className="text-gray-500">Cost</div>
                        </div>
                        <div>
                          <div className="text-white font-bold">{current.conversions}</div>
                          <div className="text-gray-500">Conv</div>
                        </div>
                      </div>
                      <div className="grid grid-cols-4 gap-2 text-xs border-t border-gray-800 pt-2">
                        <div>
                          <div className="text-cyan-400 font-bold">{formatPercent(current.search_impression_share)}</div>
                          <div className="text-gray-500">Impr Share</div>
                        </div>
                        <div>
                          <div className="text-yellow-400 font-bold">{formatPercent(current.search_top_impression_share)}</div>
                          <div className="text-gray-500">Top</div>
                        </div>
                        <div>
                          <div className="text-orange-400 font-bold">{formatPercent(current.search_abs_top_impression_share)}</div>
                          <div className="text-gray-500">Abs Top</div>
                        </div>
                        <div>
                          <div className="text-green-400 font-bold">{formatPercent(current.click_share)}</div>
                          <div className="text-gray-500">Click Sh</div>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )})()}

        {/* Footer */}
        <div className="text-center">
          <div className="flex items-center justify-center gap-2">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-gray-500 text-xs">Live</span>
          </div>
        </div>
      </div>
    </div>
  )
}
