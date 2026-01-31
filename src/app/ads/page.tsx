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

// Initial loading states
const LOADING_ADS: AdsData = {
  this_week: { week_label: "Last Week", date_range: "Loading...", spend: 0, impressions: 0, clicks: 0, ctr: 0, conversions: 0, conversion_rate: 0, cpa: 0, roas: 0 },
  last_week: { week_label: "2 Weeks Ago", date_range: "Loading...", spend: 0, impressions: 0, clicks: 0, ctr: 0, conversions: 0, conversion_rate: 0, cpa: 0, roas: 0 },
  two_weeks_ago: { week_label: "3 Weeks Ago", date_range: "Loading...", spend: 0, impressions: 0, clicks: 0, ctr: 0, conversions: 0, conversion_rate: 0, cpa: 0, roas: 0 },
  three_weeks_ago: { week_label: "4 Weeks Ago", date_range: "Loading...", spend: 0, impressions: 0, clicks: 0, ctr: 0, conversions: 0, conversion_rate: 0, cpa: 0, roas: 0 },
  last_updated: new Date().toISOString()
}

const LOADING_CHANNEL: ChannelMetrics = { users: 0, purchases: 0, conv_rate: 0, pct_of_users: 0, pct_of_purchases: 0 }
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
  const [loading, setLoading] = useState(true)
  const [lastRefresh, setLastRefresh] = useState(new Date())

  const fetchData = async () => {
    setLoading(true)
    try {
      const [adsRes, organicRes] = await Promise.all([
        fetch('/api/ads'),
        fetch('/api/organic')
      ])
      
      if (adsRes.ok) setAdsData(await adsRes.json())
      if (organicRes.ok) setOrganicData(await organicRes.json())
      
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

        {/* Totals Banner */}
        <div className="bg-[#1a1a1a] rounded-lg p-4 mb-4 flex justify-center gap-12">
          <div className="text-center">
            <div className="text-white text-3xl font-bold">{formatNumber(organicData.this_week.totals.users)}</div>
            <div className="text-gray-500 text-xs">Total New Visitors</div>
          </div>
          <div className="text-center">
            <div className="text-white text-3xl font-bold">{organicData.this_week.totals.purchases}</div>
            <div className="text-gray-500 text-xs">Total Purchases</div>
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
