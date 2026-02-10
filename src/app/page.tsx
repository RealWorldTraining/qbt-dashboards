"use client"

import { useState } from "react"
import Link from "next/link"
import { 
  LayoutGrid, 
  TrendingUp, 
  DollarSign, 
  Users, 
  FileText, 
  Tv,
  Megaphone,
  ArrowRight,
  BarChart3,
  Zap,
  Search,
  Smartphone,
  RefreshCw,
  Check,
  AlertCircle,
  Target,
  MapPin,
  ShoppingCart,
} from "lucide-react"

// Dashboard categories
const dashboardSections = [
  {
    title: "Sales",
    description: "Revenue, orders, and P&L analysis",
    icon: ShoppingCart,
    color: "from-green-500 to-emerald-600",
    dashboards: [
      { 
        name: "Sales", 
        href: "/sales", 
        icon: DollarSign, 
        description: "Detailed sales analytics and trends",
        color: "from-green-500 to-emerald-600",
        stats: "Revenue • Orders"
      },
      { 
        name: "Intuit Sales", 
        href: "/intuit-sales", 
        icon: DollarSign, 
        description: "Intuit revenue breakdown by category (IES, Priority Circle, Classes, Videos, Webinars)",
        color: "from-blue-500 to-cyan-600",
        stats: "Feb 2024 → Present"
      },
      { 
        name: "P&L Recap", 
        href: "/recap", 
        icon: FileText, 
        description: "Monthly profit & loss reports and analysis",
        color: "from-emerald-500 to-teal-600",
        stats: "Monthly reports"
      },
    ]
  },
  {
    title: "Traffic",
    description: "Visitor analytics and trends",
    icon: Users,
    color: "from-purple-500 to-indigo-600",
    dashboards: [
      { 
        name: "GA4 Summary", 
        href: "/playground", 
        icon: BarChart3, 
        description: "Monthly traffic by channel from Google Analytics",
        color: "from-yellow-500 to-amber-600",
        stats: "Traffic • Channels"
      },
      { 
        name: "Trend Analysis", 
        href: "/trend-analysis", 
        icon: TrendingUp, 
        description: "YoY comparisons, 4-week trends & Vision's insights",
        color: "from-violet-500 to-purple-600",
        stats: "Trends • YoY • Analysis"
      },
    ]
  },
  {
    title: "Paid Advertising",
    description: "Google Ads, Bing Ads, and CPC optimization",
    icon: Megaphone,
    color: "from-orange-500 to-red-600",
    dashboards: [
      { 
        name: "Marketing Dashboard", 
        href: "/ads", 
        icon: Megaphone, 
        description: "Traffic by channel, Google Ads & Bing Ads performance",
        color: "from-orange-500 to-red-600",
        stats: "Traffic • Ads • ROI"
      },
      { 
        name: "Google Ads Summary", 
        href: "/google-ads-summary", 
        icon: TrendingUp, 
        description: "Monthly Google Ads performance: spend, conversions, ROAS",
        color: "from-red-500 to-rose-600",
        stats: "Spend • Conversions • ROAS"
      },
      { 
        name: "Bing Ads Summary", 
        href: "/bing-ads-summary", 
        icon: Search, 
        description: "Monthly Microsoft Advertising performance metrics",
        color: "from-sky-500 to-blue-600",
        stats: "Spend • Conversions • ROAS"
      },
      { 
        name: "Google Ads CPC Optimizer", 
        href: "/cpc", 
        icon: Target, 
        description: "Google Ads Max CPC bid recommendations with confidence scores & performance metrics",
        color: "from-cyan-500 to-teal-600",
        stats: "Keywords • Bids • Signals"
      },
      { 
        name: "Bing Ads CPC Optimizer", 
        href: "/cpc-bing", 
        icon: Target, 
        description: "Bing Ads Max CPC bid recommendations with urgency levels & performance metrics",
        color: "from-blue-500 to-purple-600",
        stats: "Keywords • Bids • Urgency"
      },
      { 
        name: "Age Analysis", 
        href: "/age-analysis", 
        icon: Users, 
        description: "Google Ads performance trends by age group: clicks, impressions, CTR, CPC, spend, conversions",
        color: "from-indigo-500 to-purple-600",
        stats: "Age Groups • Trends • 2024-Present"
      },
      { 
        name: "Vision Analytics", 
        href: "/vision", 
        icon: Zap, 
        description: "Keyword-level bid optimization & CPA trend analysis",
        color: "from-fuchsia-500 to-pink-600",
        stats: "Bids • Keywords • CPA"
      },
    ]
  },
  {
    title: "TV Dashboards",
    description: "Large-format displays for office monitors",
    icon: Tv,
    color: "from-cyan-500 to-blue-600",
    dashboards: [
      { 
        name: "Marketing Dashboard (TV)", 
        href: "/ads-tv", 
        icon: Tv, 
        description: "TV-optimized marketing performance with large fonts and high contrast",
        color: "from-orange-500 to-red-600",
        stats: "Traffic • Conversions • Landing Pages"
      },
      { 
        name: "Sales Snapshot", 
        href: "/data", 
        icon: Tv, 
        description: "Real-time sales forecasts for the office TV",
        color: "from-cyan-500 to-blue-600",
        stats: "Today • Week • Month"
      },
    ]
  },
  {
    title: "Miscellaneous",
    description: "Other tools and views",
    icon: LayoutGrid,
    color: "from-gray-500 to-slate-600",
    dashboards: [
      { 
        name: "Dashboard", 
        href: "/dashboard", 
        icon: LayoutGrid, 
        description: "Comprehensive view with Sales, Traffic, Ads, Subscriptions & Jedi Council",
        color: "from-purple-500 to-indigo-600",
        stats: "All-in-one"
      },
      { 
        name: "Phone", 
        href: "/phone", 
        icon: Smartphone, 
        description: "Mobile-optimized sales dashboard for iPhone",
        color: "from-slate-500 to-gray-600",
        stats: "Today • Yesterday • Week • MTD"
      },
    ]
  },
]

export default function Home() {
  const [recapStatus, setRecapStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [recapMessage, setRecapMessage] = useState('')
  const [prophetStatus, setProphetStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [prophetMessage, setProphetMessage] = useState('')

  const triggerProphetRefresh = async () => {
    setProphetStatus('loading')
    setProphetMessage('')
    try {
      const response = await fetch('https://n8n.srv1266620.hstgr.cloud/webhook/refresh-prophet-cache', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ triggered_by: 'manual' })
      })
      if (response.ok) {
        setProphetStatus('success')
        setProphetMessage('Dashboard data refreshed!')
        setTimeout(() => {
          setProphetStatus('idle')
          setProphetMessage('')
        }, 3000)
      } else {
        setProphetStatus('error')
        setProphetMessage('Refresh failed. Try again.')
      }
    } catch (error) {
      setProphetStatus('error')
      setProphetMessage('Network error. Try again.')
    }
  }

  const triggerRecapRefresh = async () => {
    setRecapStatus('loading')
    setRecapMessage('')
    try {
      const response = await fetch('/api/trigger-recap', {
        method: 'POST',
      })
      const data = await response.json()
      if (response.ok) {
        setRecapStatus('success')
        setRecapMessage(data.message || 'P&L Recap refresh triggered successfully!')
        setTimeout(() => setRecapStatus('idle'), 5000)
      } else {
        throw new Error(data.error || `HTTP ${response.status}`)
      }
    } catch (err) {
      setRecapStatus('error')
      setRecapMessage(`Failed to trigger: ${err}`)
      setTimeout(() => setRecapStatus('idle'), 5000)
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <div className="border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg">
              <Zap className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-3xl font-bold">QuickBooks Training</h1>
          </div>
          <p className="text-gray-400 text-lg">Analytics & Dashboards</p>
        </div>
      </div>

      {/* Dashboard Sections */}
      <div className="max-w-7xl mx-auto px-6 py-10">
        {dashboardSections.map((section, sectionIdx) => {
          const SectionIcon = section.icon
          return (
            <div key={section.title} className={sectionIdx > 0 ? "mt-16" : ""}>
              {/* Section Header */}
              <div className="flex items-center gap-3 mb-6">
                <div className={`p-2 bg-gradient-to-br ${section.color} rounded-lg`}>
                  <SectionIcon className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">{section.title}</h2>
                  <p className="text-sm text-gray-400">{section.description}</p>
                </div>
              </div>

              {/* Dashboard Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {section.dashboards.map((dashboard) => {
                  const Icon = dashboard.icon
                  return (
                    <Link
                      key={dashboard.href}
                      href={dashboard.href}
                      className="group relative bg-gray-900 border border-gray-800 rounded-xl p-6 hover:border-gray-700 hover:bg-gray-900/80 transition-all duration-200"
                    >
                      {/* Gradient accent */}
                      <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${dashboard.color} rounded-t-xl opacity-60 group-hover:opacity-100 transition-opacity`} />
                      
                      <div className="flex items-start justify-between mb-4">
                        <div className={`p-3 bg-gradient-to-br ${dashboard.color} rounded-lg shadow-lg`}>
                          <Icon className="h-6 w-6 text-white" />
                        </div>
                        <ArrowRight className="h-5 w-5 text-gray-600 group-hover:text-gray-400 group-hover:translate-x-1 transition-all" />
                      </div>

                      <h3 className="text-xl font-semibold text-white mb-2 group-hover:text-cyan-400 transition-colors">
                        {dashboard.name}
                      </h3>
                      <p className="text-gray-400 text-sm mb-4 line-clamp-2">
                        {dashboard.description}
                      </p>
                      
                      <div className="text-xs text-gray-500 font-medium">
                        {dashboard.stats}
                      </div>
                    </Link>
                  )
                })}
              </div>
            </div>
          )
        })}

        {/* Quick Links */}
        <div className="mt-12 pt-8 border-t border-gray-800">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">
            Quick Links
          </h2>
          <div className="flex flex-wrap gap-3">
            <Link 
              href="/live-help" 
              className="px-4 py-2 text-sm text-gray-400 hover:text-white bg-gray-900 hover:bg-gray-800 border border-gray-800 rounded-lg transition-colors"
            >
              Live Help (Real-time)
            </Link>
            <a 
              href="https://qbtraining.com" 
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 text-sm text-gray-400 hover:text-white bg-gray-900 hover:bg-gray-800 border border-gray-800 rounded-lg transition-colors"
            >
              Main Site ↗
            </a>
          </div>
        </div>

        {/* Manual Triggers */}
        <div className="mt-8 pt-8 border-t border-gray-800">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">
            Manual Triggers
          </h2>
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={triggerProphetRefresh}
              disabled={prophetStatus === 'loading'}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                prophetStatus === 'loading'
                  ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                  : prophetStatus === 'success'
                  ? 'bg-green-600 text-white'
                  : prophetStatus === 'error'
                  ? 'bg-red-600 text-white'
                  : 'bg-blue-600 hover:bg-blue-500 text-white'
              }`}
            >
              {prophetStatus === 'loading' ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : prophetStatus === 'success' ? (
                <Check className="h-4 w-4" />
              ) : prophetStatus === 'error' ? (
                <AlertCircle className="h-4 w-4" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              {prophetStatus === 'loading' ? 'Refreshing...' : 'Refresh All Dashboards'}
            </button>
            {prophetMessage && (
              <span className={`text-sm ${prophetStatus === 'success' ? 'text-green-400' : 'text-red-400'}`}>
                {prophetMessage}
              </span>
            )}

            <button
              onClick={triggerRecapRefresh}
              disabled={recapStatus === 'loading'}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                recapStatus === 'loading'
                  ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                  : recapStatus === 'success'
                  ? 'bg-green-600 text-white'
                  : recapStatus === 'error'
                  ? 'bg-red-600 text-white'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white'
              }`}
            >
              {recapStatus === 'loading' ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : recapStatus === 'success' ? (
                <Check className="h-4 w-4" />
              ) : recapStatus === 'error' ? (
                <AlertCircle className="h-4 w-4" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              {recapStatus === 'loading' ? 'Running...' : 'Refresh P&L Recap'}
            </button>
            {recapMessage && (
              <span className={`text-sm ${recapStatus === 'success' ? 'text-green-400' : 'text-red-400'}`}>
                {recapMessage}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-gray-800 mt-auto">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <p className="text-gray-500 text-sm">
            QuickBooks Training • Internal Analytics
          </p>
        </div>
      </div>
    </div>
  )
}
