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
interface SourceMetrics {
  users: number
  purchases: number
  conv_rate: number
}

interface OrganicWeek {
  week_label: string
  date_range: string
  google_organic: SourceMetrics
  direct: SourceMetrics
  bing_organic: SourceMetrics
  qb_intuit: SourceMetrics
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

const LOADING_SOURCE: SourceMetrics = { users: 0, purchases: 0, conv_rate: 0 }
const LOADING_ORGANIC: OrganicData = {
  this_week: { week_label: "Last Week", date_range: "Loading...", google_organic: LOADING_SOURCE, direct: LOADING_SOURCE, bing_organic: LOADING_SOURCE, qb_intuit: LOADING_SOURCE },
  last_week: { week_label: "2 Weeks Ago", date_range: "Loading...", google_organic: LOADING_SOURCE, direct: LOADING_SOURCE, bing_organic: LOADING_SOURCE, qb_intuit: LOADING_SOURCE },
  two_weeks_ago: { week_label: "3 Weeks Ago", date_range: "Loading...", google_organic: LOADING_SOURCE, direct: LOADING_SOURCE, bing_organic: LOADING_SOURCE, qb_intuit: LOADING_SOURCE },
  three_weeks_ago: { week_label: "4 Weeks Ago", date_range: "Loading...", google_organic: LOADING_SOURCE, direct: LOADING_SOURCE, bing_organic: LOADING_SOURCE, qb_intuit: LOADING_SOURCE },
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

// Hero Card Component - Mission Control Style
interface HeroCardProps {
  title: string
  value: string | number
  subtitle?: string
  accentColor: string
  comparisons: {
    label: string
    value: number
    change: number
    changeAbs: number
  }[]
  format?: (v: number) => string
  inverse?: boolean
}

function HeroCard({ title, value, subtitle, accentColor, comparisons, format = formatNumber, inverse = false }: HeroCardProps) {
  return (
    <div className="bg-[#1a1a1a] rounded-lg overflow-hidden">
      {/* Accent bar */}
      <div className={`h-1 ${accentColor}`} />
      
      <div className="p-6">
        {/* Title */}
        <div className="text-gray-400 text-sm mb-2">{title}</div>
        
        {/* Hero number */}
        <div className="text-white text-5xl font-bold mb-1">{value}</div>
        
        {/* Subtitle */}
        {subtitle && <div className="text-gray-500 text-sm mb-4">{subtitle}</div>}
        
        {/* Comparisons */}
        <div className="mt-4 space-y-2">
          {comparisons.map((comp, i) => {
            const isPositive = inverse ? comp.change < 0 : comp.change > 0
            const isNegative = inverse ? comp.change > 0 : comp.change < 0
            const color = isPositive ? "text-green-500" : isNegative ? "text-red-500" : "text-gray-400"
            const sign = comp.changeAbs >= 0 ? "+" : ""
            
            return (
              <div key={i} className="flex justify-between items-center text-sm">
                <span className="text-gray-500">{comp.label}</span>
                <div className="flex items-center gap-3">
                  <span className="text-gray-300">{format(comp.value)}</span>
                  <span className={`${color} font-medium`}>
                    {sign}{comp.change.toFixed(0)}% ({sign}{format(Math.abs(comp.changeAbs))})
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// Traffic Source Card - Compact version for organic section
interface TrafficCardProps {
  title: string
  accentColor: string
  users: number
  purchases: number
  convRate: number
  comparisons: {
    label: string
    users: number
    purchases: number
  }[]
}

function TrafficCard({ title, accentColor, users, purchases, convRate, comparisons }: TrafficCardProps) {
  return (
    <div className="bg-[#1a1a1a] rounded-lg overflow-hidden">
      <div className={`h-1 ${accentColor}`} />
      <div className="p-4">
        <div className="text-gray-400 text-xs mb-3">{title}</div>
        
        {/* Main metrics row */}
        <div className="grid grid-cols-3 gap-2 mb-3">
          <div>
            <div className="text-white text-2xl font-bold">{formatNumber(users)}</div>
            <div className="text-gray-500 text-xs">New Visitors</div>
          </div>
          <div>
            <div className="text-white text-2xl font-bold">{purchases}</div>
            <div className="text-gray-500 text-xs">Purchases</div>
          </div>
          <div>
            <div className="text-white text-2xl font-bold">{formatPercent(convRate)}</div>
            <div className="text-gray-500 text-xs">Conv Rate</div>
          </div>
        </div>
        
        {/* Comparisons */}
        <div className="space-y-1 border-t border-gray-800 pt-2">
          {comparisons.map((comp, i) => {
            const userChange = users > 0 && comp.users > 0 
              ? ((users - comp.users) / comp.users * 100) 
              : 0
            const purchaseChange = purchases > 0 && comp.purchases > 0 
              ? ((purchases - comp.purchases) / comp.purchases * 100) 
              : 0
            
            const userColor = userChange > 0 ? "text-green-500" : userChange < 0 ? "text-red-500" : "text-gray-400"
            const purchaseColor = purchaseChange > 0 ? "text-green-500" : purchaseChange < 0 ? "text-red-500" : "text-gray-400"
            
            return (
              <div key={i} className="flex justify-between items-center text-xs">
                <span className="text-gray-600">{comp.label}</span>
                <div className="flex gap-4">
                  <span className={userColor}>
                    {userChange >= 0 ? "+" : ""}{userChange.toFixed(0)}% V
                  </span>
                  <span className={purchaseColor}>
                    {purchaseChange >= 0 ? "+" : ""}{purchaseChange.toFixed(0)}% P
                  </span>
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
      
      if (adsRes.ok) {
        const adsJson = await adsRes.json()
        setAdsData(adsJson)
      }
      
      if (organicRes.ok) {
        const organicJson = await organicRes.json()
        setOrganicData(organicJson)
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

  const handleRefresh = () => fetchData()

  // Build comparison data for ads
  const buildAdsComparisons = (metric: keyof WeeklyMetrics, format: (v: number) => string = formatNumber) => {
    const current = adsData.this_week[metric] as number
    return [
      {
        label: adsData.last_week.week_label,
        value: adsData.last_week[metric] as number,
        change: ((current - (adsData.last_week[metric] as number)) / (adsData.last_week[metric] as number)) * 100,
        changeAbs: current - (adsData.last_week[metric] as number)
      },
      {
        label: adsData.two_weeks_ago.week_label,
        value: adsData.two_weeks_ago[metric] as number,
        change: ((current - (adsData.two_weeks_ago[metric] as number)) / (adsData.two_weeks_ago[metric] as number)) * 100,
        changeAbs: current - (adsData.two_weeks_ago[metric] as number)
      },
      {
        label: adsData.three_weeks_ago.week_label,
        value: adsData.three_weeks_ago[metric] as number,
        change: ((current - (adsData.three_weeks_ago[metric] as number)) / (adsData.three_weeks_ago[metric] as number)) * 100,
        changeAbs: current - (adsData.three_weeks_ago[metric] as number)
      }
    ]
  }

  // Build traffic comparisons for organic
  type SourceKey = 'google_organic' | 'direct' | 'bing_organic' | 'qb_intuit'
  
  const buildTrafficComparisons = (source: SourceKey) => [
    {
      label: organicData.last_week.week_label,
      users: organicData.last_week[source].users,
      purchases: organicData.last_week[source].purchases
    },
    {
      label: organicData.two_weeks_ago.week_label,
      users: organicData.two_weeks_ago[source].users,
      purchases: organicData.two_weeks_ago[source].purchases
    },
    {
      label: organicData.three_weeks_ago.week_label,
      users: organicData.three_weeks_ago[source].users,
      purchases: organicData.three_weeks_ago[source].purchases
    }
  ]

  return (
    <div className="min-h-screen bg-black p-6">
      <div className="max-w-[1920px] mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <h1 className="text-white text-xl font-medium">Marketing Dashboard</h1>
            <span className="text-gray-500 text-sm">
              Updated {lastRefresh.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-gray-500 text-sm">{adsData.this_week.date_range}</span>
            <button 
              onClick={handleRefresh}
              disabled={loading}
              className="p-2 rounded hover:bg-gray-800 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 text-gray-400 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Section: Google Ads */}
        <div className="mb-6">
          <h2 className="text-gray-400 text-sm font-medium mb-3 uppercase tracking-wide">Google Ads</h2>
          <div className="grid grid-cols-4 gap-4 mb-4">
            <HeroCard
              title="SPEND"
              value={formatCurrency(adsData.this_week.spend)}
              accentColor="bg-green-500"
              comparisons={buildAdsComparisons('spend', formatCurrency)}
            />
            <HeroCard
              title="IMPRESSIONS"
              value={formatNumber(adsData.this_week.impressions)}
              accentColor="bg-blue-500"
              comparisons={buildAdsComparisons('impressions')}
            />
            <HeroCard
              title="CLICKS"
              value={formatNumber(adsData.this_week.clicks)}
              accentColor="bg-purple-500"
              comparisons={buildAdsComparisons('clicks')}
            />
            <HeroCard
              title="CTR"
              value={formatPercent(adsData.this_week.ctr)}
              accentColor="bg-cyan-500"
              comparisons={buildAdsComparisons('ctr', formatPercent)}
            />
          </div>

          <div className="grid grid-cols-4 gap-4">
            <HeroCard
              title="CONVERSIONS"
              value={adsData.this_week.conversions}
              accentColor="bg-orange-500"
              comparisons={buildAdsComparisons('conversions')}
            />
            <HeroCard
              title="CONV RATE"
              value={formatPercent(adsData.this_week.conversion_rate)}
              accentColor="bg-emerald-500"
              comparisons={buildAdsComparisons('conversion_rate', formatPercent)}
            />
            <HeroCard
              title="CPA"
              value={formatCurrency(adsData.this_week.cpa)}
              accentColor="bg-red-500"
              comparisons={buildAdsComparisons('cpa', formatCurrency)}
              inverse={true}
            />
            <HeroCard
              title="ROAS"
              value={`${adsData.this_week.roas.toFixed(2)}x`}
              accentColor="bg-pink-500"
              comparisons={buildAdsComparisons('roas', (v) => `${v.toFixed(2)}x`)}
            />
          </div>
        </div>

        {/* Section: Organic Traffic */}
        <div className="mb-6">
          <h2 className="text-gray-400 text-sm font-medium mb-3 uppercase tracking-wide">Organic & Direct Traffic</h2>
          <div className="grid grid-cols-4 gap-4">
            <TrafficCard
              title="GOOGLE ORGANIC"
              accentColor="bg-blue-400"
              users={organicData.this_week.google_organic.users}
              purchases={organicData.this_week.google_organic.purchases}
              convRate={organicData.this_week.google_organic.conv_rate}
              comparisons={buildTrafficComparisons('google_organic')}
            />
            <TrafficCard
              title="DIRECT"
              accentColor="bg-gray-400"
              users={organicData.this_week.direct.users}
              purchases={organicData.this_week.direct.purchases}
              convRate={organicData.this_week.direct.conv_rate}
              comparisons={buildTrafficComparisons('direct')}
            />
            <TrafficCard
              title="BING ORGANIC"
              accentColor="bg-teal-400"
              users={organicData.this_week.bing_organic.users}
              purchases={organicData.this_week.bing_organic.purchases}
              convRate={organicData.this_week.bing_organic.conv_rate}
              comparisons={buildTrafficComparisons('bing_organic')}
            />
            <TrafficCard
              title="QB INTUIT REFERRAL"
              accentColor="bg-green-400"
              users={organicData.this_week.qb_intuit.users}
              purchases={organicData.this_week.qb_intuit.purchases}
              convRate={organicData.this_week.qb_intuit.conv_rate}
              comparisons={buildTrafficComparisons('qb_intuit')}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 text-center">
          <div className="flex items-center justify-center gap-2">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-gray-500 text-xs">Live</span>
          </div>
          <p className="text-gray-600 text-xs mt-2">QuickBooks Training • Marketing Dashboard</p>
        </div>
      </div>
    </div>
  )
}
