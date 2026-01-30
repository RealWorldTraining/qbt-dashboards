"use client"

import { useEffect, useState } from "react"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { TrendingUp, TrendingDown, Minus, RefreshCw, DollarSign, MousePointerClick, Eye, Target, BarChart3 } from "lucide-react"

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

// Sample data - Vision will replace with real API/Sheet data
const SAMPLE_DATA: AdsData = {
  this_week: {
    week_label: "This Week",
    date_range: "Jan 27 - Feb 2",
    spend: 4250.00,
    impressions: 125000,
    clicks: 3200,
    ctr: 2.56,
    conversions: 48,
    conversion_rate: 1.50,
    cpa: 88.54,
    roas: 4.2
  },
  last_week: {
    week_label: "Last Week",
    date_range: "Jan 20 - Jan 26",
    spend: 4100.00,
    impressions: 118000,
    clicks: 2950,
    ctr: 2.50,
    conversions: 42,
    conversion_rate: 1.42,
    cpa: 97.62,
    roas: 3.8
  },
  two_weeks_ago: {
    week_label: "2 Weeks Ago",
    date_range: "Jan 13 - Jan 19",
    spend: 3950.00,
    impressions: 112000,
    clicks: 2800,
    ctr: 2.50,
    conversions: 38,
    conversion_rate: 1.36,
    cpa: 103.95,
    roas: 3.5
  },
  three_weeks_ago: {
    week_label: "3 Weeks Ago",
    date_range: "Jan 6 - Jan 12",
    spend: 4000.00,
    impressions: 115000,
    clicks: 2900,
    ctr: 2.52,
    conversions: 40,
    conversion_rate: 1.38,
    cpa: 100.00,
    roas: 3.6
  },
  last_updated: new Date().toISOString()
}

// Google Sheet URL - Vision will provide this
const SHEET_ID = "YOUR_SHEET_ID_HERE"
const SHEET_API_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json`

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-US").format(Math.round(value))
}

function formatPercent(value: number): string {
  return `${value.toFixed(2)}%`
}

function getChangeIndicator(current: number, previous: number, inverse: boolean = false) {
  const change = ((current - previous) / previous) * 100
  const isPositive = inverse ? change < 0 : change > 0
  const isNegative = inverse ? change > 0 : change < 0
  
  if (Math.abs(change) < 0.5) {
    return { icon: Minus, color: "text-gray-400", change: 0 }
  }
  
  return {
    icon: isPositive ? TrendingUp : TrendingDown,
    color: isPositive ? "text-green-500" : "text-red-500",
    change: change
  }
}

interface MetricCardProps {
  title: string
  icon: React.ElementType
  thisWeek: number
  lastWeek: number
  twoWeeksAgo: number
  threeWeeksAgo: number
  format: (v: number) => string
  inverse?: boolean
  iconColor: string
}

function MetricCard({ title, icon: Icon, thisWeek, lastWeek, twoWeeksAgo, threeWeeksAgo, format, inverse = false, iconColor }: MetricCardProps) {
  const vsLastWeek = getChangeIndicator(thisWeek, lastWeek, inverse)
  const vsTwoWeeks = getChangeIndicator(thisWeek, twoWeeksAgo, inverse)
  const vsThreeWeeks = getChangeIndicator(thisWeek, threeWeeksAgo, inverse)
  
  return (
    <Card className="border-0 shadow-sm bg-white">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-[#6E6E73]">{title}</CardTitle>
          <Icon className={`h-5 w-5 ${iconColor}`} />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold text-[#1D1D1F] mb-4">{format(thisWeek)}</div>
        
        <div className="space-y-2">
          {/* vs Last Week */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-[#6E6E73]">vs Last Week</span>
            <div className="flex items-center gap-1">
              <vsLastWeek.icon className={`h-4 w-4 ${vsLastWeek.color}`} />
              <span className={vsLastWeek.color}>
                {vsLastWeek.change > 0 ? "+" : ""}{vsLastWeek.change.toFixed(1)}%
              </span>
            </div>
          </div>
          
          {/* vs 2 Weeks Ago */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-[#6E6E73]">vs 2 Weeks</span>
            <div className="flex items-center gap-1">
              <vsTwoWeeks.icon className={`h-4 w-4 ${vsTwoWeeks.color}`} />
              <span className={vsTwoWeeks.color}>
                {vsTwoWeeks.change > 0 ? "+" : ""}{vsTwoWeeks.change.toFixed(1)}%
              </span>
            </div>
          </div>
          
          {/* vs 3 Weeks Ago */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-[#6E6E73]">vs 3 Weeks</span>
            <div className="flex items-center gap-1">
              <vsThreeWeeks.icon className={`h-4 w-4 ${vsThreeWeeks.color}`} />
              <span className={vsThreeWeeks.color}>
                {vsThreeWeeks.change > 0 ? "+" : ""}{vsThreeWeeks.change.toFixed(1)}%
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Weekly Comparison Row Component
interface WeekRowProps {
  data: WeeklyMetrics
  isCurrentWeek?: boolean
}

function WeekRow({ data, isCurrentWeek = false }: WeekRowProps) {
  return (
    <div className={`grid grid-cols-9 gap-4 py-4 px-4 ${isCurrentWeek ? 'bg-blue-50 rounded-lg' : 'border-b border-[#E5E5E7]'}`}>
      <div className="col-span-1">
        <div className={`font-semibold ${isCurrentWeek ? 'text-blue-700' : 'text-[#1D1D1F]'}`}>{data.week_label}</div>
        <div className="text-xs text-[#6E6E73]">{data.date_range}</div>
      </div>
      <div className="text-right">
        <div className="font-medium text-[#1D1D1F]">{formatCurrency(data.spend)}</div>
        <div className="text-xs text-[#6E6E73]">Spend</div>
      </div>
      <div className="text-right">
        <div className="font-medium text-[#1D1D1F]">{formatNumber(data.impressions)}</div>
        <div className="text-xs text-[#6E6E73]">Impr</div>
      </div>
      <div className="text-right">
        <div className="font-medium text-[#1D1D1F]">{formatNumber(data.clicks)}</div>
        <div className="text-xs text-[#6E6E73]">Clicks</div>
      </div>
      <div className="text-right">
        <div className="font-medium text-[#1D1D1F]">{formatPercent(data.ctr)}</div>
        <div className="text-xs text-[#6E6E73]">CTR</div>
      </div>
      <div className="text-right">
        <div className="font-medium text-[#1D1D1F]">{data.conversions}</div>
        <div className="text-xs text-[#6E6E73]">Conv</div>
      </div>
      <div className="text-right">
        <div className="font-medium text-[#1D1D1F]">{formatPercent(data.conversion_rate)}</div>
        <div className="text-xs text-[#6E6E73]">Conv %</div>
      </div>
      <div className="text-right">
        <div className="font-medium text-[#1D1D1F]">{formatCurrency(data.cpa)}</div>
        <div className="text-xs text-[#6E6E73]">CPA</div>
      </div>
      <div className="text-right">
        <div className="font-medium text-[#1D1D1F]">{data.roas.toFixed(2)}x</div>
        <div className="text-xs text-[#6E6E73]">ROAS</div>
      </div>
    </div>
  )
}

export default function AdsPage() {
  const [data, setData] = useState<AdsData>(SAMPLE_DATA)
  const [loading, setLoading] = useState(false)
  const [lastRefresh, setLastRefresh] = useState(new Date())

  // Auto-refresh every 5 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      // TODO: Fetch real data from Vision's API/Sheet
      setLastRefresh(new Date())
    }, 5 * 60 * 1000)
    
    return () => clearInterval(interval)
  }, [])

  const handleRefresh = () => {
    setLoading(true)
    // TODO: Fetch real data
    setTimeout(() => {
      setLastRefresh(new Date())
      setLoading(false)
    }, 1000)
  }

  return (
    <div className="min-h-screen bg-[#F5F5F7] p-6">
      <div className="max-w-[1920px] mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-[#1D1D1F]">Google Ads Performance</h1>
            <p className="text-[#6E6E73] mt-1">Account-level metrics • Week-over-week comparison</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right text-sm">
              <div className="text-[#6E6E73]">Last updated</div>
              <div className="font-medium text-[#1D1D1F]">
                {lastRefresh.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
            <button 
              onClick={handleRefresh}
              disabled={loading}
              className="p-2 rounded-lg bg-white border border-[#D2D2D7] hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`h-5 w-5 text-[#6E6E73] ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Key Metrics Cards - 2 rows of 4 */}
        <div className="grid grid-cols-4 gap-4">
          <MetricCard
            title="Spend"
            icon={DollarSign}
            iconColor="text-green-500"
            thisWeek={data.this_week.spend}
            lastWeek={data.last_week.spend}
            twoWeeksAgo={data.two_weeks_ago.spend}
            threeWeeksAgo={data.three_weeks_ago.spend}
            format={formatCurrency}
          />
          <MetricCard
            title="Impressions"
            icon={Eye}
            iconColor="text-blue-500"
            thisWeek={data.this_week.impressions}
            lastWeek={data.last_week.impressions}
            twoWeeksAgo={data.two_weeks_ago.impressions}
            threeWeeksAgo={data.three_weeks_ago.impressions}
            format={formatNumber}
          />
          <MetricCard
            title="Clicks"
            icon={MousePointerClick}
            iconColor="text-purple-500"
            thisWeek={data.this_week.clicks}
            lastWeek={data.last_week.clicks}
            twoWeeksAgo={data.two_weeks_ago.clicks}
            threeWeeksAgo={data.three_weeks_ago.clicks}
            format={formatNumber}
          />
          <MetricCard
            title="CTR"
            icon={BarChart3}
            iconColor="text-cyan-500"
            thisWeek={data.this_week.ctr}
            lastWeek={data.last_week.ctr}
            twoWeeksAgo={data.two_weeks_ago.ctr}
            threeWeeksAgo={data.three_weeks_ago.ctr}
            format={formatPercent}
          />
        </div>

        <div className="grid grid-cols-4 gap-4">
          <MetricCard
            title="Conversions"
            icon={Target}
            iconColor="text-orange-500"
            thisWeek={data.this_week.conversions}
            lastWeek={data.last_week.conversions}
            twoWeeksAgo={data.two_weeks_ago.conversions}
            threeWeeksAgo={data.three_weeks_ago.conversions}
            format={(v) => v.toString()}
          />
          <MetricCard
            title="Conversion Rate"
            icon={TrendingUp}
            iconColor="text-emerald-500"
            thisWeek={data.this_week.conversion_rate}
            lastWeek={data.last_week.conversion_rate}
            twoWeeksAgo={data.two_weeks_ago.conversion_rate}
            threeWeeksAgo={data.three_weeks_ago.conversion_rate}
            format={formatPercent}
          />
          <MetricCard
            title="Cost Per Acquisition"
            icon={DollarSign}
            iconColor="text-red-500"
            thisWeek={data.this_week.cpa}
            lastWeek={data.last_week.cpa}
            twoWeeksAgo={data.two_weeks_ago.cpa}
            threeWeeksAgo={data.three_weeks_ago.cpa}
            format={formatCurrency}
            inverse={true}
          />
          <MetricCard
            title="ROAS"
            icon={TrendingUp}
            iconColor="text-indigo-500"
            thisWeek={data.this_week.roas}
            lastWeek={data.last_week.roas}
            twoWeeksAgo={data.two_weeks_ago.roas}
            threeWeeksAgo={data.three_weeks_ago.roas}
            format={(v) => `${v.toFixed(2)}x`}
          />
        </div>

        {/* Weekly Comparison Table */}
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-[#1D1D1F]">Weekly Comparison</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              <WeekRow data={data.this_week} isCurrentWeek={true} />
              <WeekRow data={data.last_week} />
              <WeekRow data={data.two_weeks_ago} />
              <WeekRow data={data.three_weeks_ago} />
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center text-sm text-[#6E6E73]">
          <p>Data provided by Vision 🔮 • Dashboard by Professor 🎓</p>
          <p className="mt-1">QuickBooks Training • qbtraining.ai/ads</p>
        </div>
      </div>
    </div>
  )
}
