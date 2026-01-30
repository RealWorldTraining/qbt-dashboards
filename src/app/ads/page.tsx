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

// Initial loading state
const LOADING_DATA: AdsData = {
  this_week: { week_label: "Last Week", date_range: "Loading...", spend: 0, impressions: 0, clicks: 0, ctr: 0, conversions: 0, conversion_rate: 0, cpa: 0, roas: 0 },
  last_week: { week_label: "2 Weeks Ago", date_range: "Loading...", spend: 0, impressions: 0, clicks: 0, ctr: 0, conversions: 0, conversion_rate: 0, cpa: 0, roas: 0 },
  two_weeks_ago: { week_label: "3 Weeks Ago", date_range: "Loading...", spend: 0, impressions: 0, clicks: 0, ctr: 0, conversions: 0, conversion_rate: 0, cpa: 0, roas: 0 },
  three_weeks_ago: { week_label: "4 Weeks Ago", date_range: "Loading...", spend: 0, impressions: 0, clicks: 0, ctr: 0, conversions: 0, conversion_rate: 0, cpa: 0, roas: 0 },
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

export default function AdsPage() {
  const [data, setData] = useState<AdsData>(LOADING_DATA)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastRefresh, setLastRefresh] = useState(new Date())

  const fetchData = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/ads')
      if (!res.ok) throw new Error('Failed to fetch data')
      const json = await res.json()
      setData(json)
      setLastRefresh(new Date())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      console.error('Error fetching ads data:', err)
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

  // Build comparison data
  const buildComparisons = (metric: keyof WeeklyMetrics, format: (v: number) => string = formatNumber) => {
    const current = data.this_week[metric] as number
    return [
      {
        label: data.last_week.week_label,
        value: data.last_week[metric] as number,
        change: ((current - (data.last_week[metric] as number)) / (data.last_week[metric] as number)) * 100,
        changeAbs: current - (data.last_week[metric] as number)
      },
      {
        label: data.two_weeks_ago.week_label,
        value: data.two_weeks_ago[metric] as number,
        change: ((current - (data.two_weeks_ago[metric] as number)) / (data.two_weeks_ago[metric] as number)) * 100,
        changeAbs: current - (data.two_weeks_ago[metric] as number)
      },
      {
        label: data.three_weeks_ago.week_label,
        value: data.three_weeks_ago[metric] as number,
        change: ((current - (data.three_weeks_ago[metric] as number)) / (data.three_weeks_ago[metric] as number)) * 100,
        changeAbs: current - (data.three_weeks_ago[metric] as number)
      }
    ]
  }

  return (
    <div className="min-h-screen bg-black p-6">
      <div className="max-w-[1920px] mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <h1 className="text-white text-xl font-medium">Google Ads</h1>
            <span className="text-gray-500 text-sm">
              Updated {lastRefresh.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-gray-500 text-sm">{data.this_week.date_range}</span>
            <button 
              onClick={handleRefresh}
              disabled={loading}
              className="p-2 rounded hover:bg-gray-800 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 text-gray-400 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Grid of Hero Cards - 2 rows of 4 */}
        <div className="grid grid-cols-4 gap-4 mb-4">
          <HeroCard
            title="SPEND"
            value={formatCurrency(data.this_week.spend)}
            accentColor="bg-green-500"
            comparisons={buildComparisons('spend', formatCurrency)}
          />
          <HeroCard
            title="IMPRESSIONS"
            value={formatNumber(data.this_week.impressions)}
            accentColor="bg-blue-500"
            comparisons={buildComparisons('impressions')}
          />
          <HeroCard
            title="CLICKS"
            value={formatNumber(data.this_week.clicks)}
            accentColor="bg-purple-500"
            comparisons={buildComparisons('clicks')}
          />
          <HeroCard
            title="CTR"
            value={formatPercent(data.this_week.ctr)}
            accentColor="bg-cyan-500"
            comparisons={buildComparisons('ctr', formatPercent)}
          />
        </div>

        <div className="grid grid-cols-4 gap-4">
          <HeroCard
            title="CONVERSIONS"
            value={data.this_week.conversions}
            accentColor="bg-orange-500"
            comparisons={buildComparisons('conversions')}
          />
          <HeroCard
            title="CONV RATE"
            value={formatPercent(data.this_week.conversion_rate)}
            accentColor="bg-emerald-500"
            comparisons={buildComparisons('conversion_rate', formatPercent)}
          />
          <HeroCard
            title="CPA"
            value={formatCurrency(data.this_week.cpa)}
            accentColor="bg-red-500"
            comparisons={buildComparisons('cpa', formatCurrency)}
            inverse={true}
          />
          <HeroCard
            title="ROAS"
            value={`${data.this_week.roas.toFixed(2)}x`}
            accentColor="bg-pink-500"
            comparisons={buildComparisons('roas', (v) => `${v.toFixed(2)}x`)}
          />
        </div>

        {/* Footer */}
        <div className="mt-6 text-center">
          <div className="flex items-center justify-center gap-2">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-gray-500 text-xs">Live</span>
          </div>
          <p className="text-gray-600 text-xs mt-2">QuickBooks Training • Google Ads Dashboard</p>
        </div>
      </div>
    </div>
  )
}
