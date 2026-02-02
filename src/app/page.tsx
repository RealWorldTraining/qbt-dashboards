"use client"

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
} from "lucide-react"

const dashboards = [
  { 
    name: "Sales Snapshot", 
    href: "/data", 
    icon: Tv, 
    description: "Real-time forecasts for the office TV",
    color: "from-cyan-500 to-blue-600",
    stats: "Today • Week • Month"
  },
  { 
    name: "Phone", 
    href: "/phone", 
    icon: Smartphone, 
    description: "Mobile-optimized sales dashboard for iPhone",
    color: "from-slate-500 to-gray-600",
    stats: "Today • Yesterday • Week • MTD"
  },
  { 
    name: "Dashboard", 
    href: "/dashboard", 
    icon: LayoutGrid, 
    description: "Comprehensive view with Sales, Traffic, Ads, Subscriptions & Jedi Council",
    color: "from-purple-500 to-indigo-600",
    stats: "All-in-one"
  },
  { 
    name: "Marketing Dashboard", 
    href: "/ads", 
    icon: Megaphone, 
    description: "Traffic by channel, Google Ads & Bing Ads performance",
    color: "from-orange-500 to-red-600",
    stats: "Traffic • Ads • ROI"
  },
  { 
    name: "P&L Recap", 
    href: "/recap", 
    icon: FileText, 
    description: "Monthly profit & loss reports and analysis",
    color: "from-emerald-500 to-teal-600",
    stats: "Monthly reports"
  },
  { 
    name: "Sales", 
    href: "/sales", 
    icon: DollarSign, 
    description: "Detailed sales analytics and trends",
    color: "from-green-500 to-emerald-600",
    stats: "Revenue • Orders"
  },
  { 
    name: "GA4 Summary", 
    href: "/playground", 
    icon: BarChart3, 
    description: "Monthly traffic by channel from Google Analytics",
    color: "from-yellow-500 to-amber-600",
    stats: "Traffic • Channels"
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
    name: "Trend Analysis", 
    href: "/trend-analysis", 
    icon: TrendingUp, 
    description: "YoY comparisons, 4-week trends & Vision's insights",
    color: "from-violet-500 to-purple-600",
    stats: "Trends • YoY • Analysis"
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

export default function Home() {
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

      {/* Dashboard Grid */}
      <div className="max-w-7xl mx-auto px-6 py-10">
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-6">
          Dashboards
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {dashboards.map((dashboard) => {
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
            <Link 
              href="/live-help-archive" 
              className="px-4 py-2 text-sm text-gray-400 hover:text-white bg-gray-900 hover:bg-gray-800 border border-gray-800 rounded-lg transition-colors"
            >
              Live Help Archive
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
