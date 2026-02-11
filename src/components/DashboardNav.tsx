"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { 
  LayoutGrid, 
  DollarSign, 
  Users, 
  FileText, 
  Tv,
  ChevronDown,
  Home,
  BarChart3,
  TrendingUp,
  Search,
  Smartphone,
  MapPin,
  Brain,
} from "lucide-react"

const dashboards = [
  { name: "Command Center", href: "/", icon: LayoutGrid, description: "Sales, Traffic, Ads & more" },
  { name: "Jedi Council", href: "https://jedi-council-zeta.vercel.app", icon: Brain, description: "Multi-agent AI analysis", external: true },
  { name: "GA4 Summary", href: "/?tab=traffic", icon: BarChart3, description: "Monthly traffic by channel" },
  { name: "Google Ads", href: "/?tab=google-ads", icon: BarChart3, description: "Google Ads weekly metrics" },
  { name: "Bing Ads", href: "/?tab=bing-ads", icon: Search, description: "Bing Ads weekly metrics" },
  { name: "Landing Pages", href: "/?tab=landing-pages", icon: MapPin, description: "GA4 & Google Ads page performance" },
  { name: "Trend Analysis", href: "/trend-analysis", icon: TrendingUp, description: "YoY & 4-week trends" },
  { name: "P&L Recap", href: "/recap", icon: FileText, description: "Monthly P&L reports" },
  { name: "Intuit Sales", href: "/intuit-sales", icon: DollarSign, description: "Intuit revenue by category" },
  { name: "The Prophet", href: "/data", icon: Tv, description: "Profit predictions & forecasts" },
  { name: "Live Help", href: "/live-help", icon: Users, description: "Real-time room status" },
  { name: "Phone", href: "/phone", icon: Smartphone, description: "Mobile sales dashboard" },
]

interface DashboardNavProps {
  theme?: "dark" | "light"
}

export function DashboardNav({ theme = "dark" }: DashboardNavProps) {
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()
  const [fullPath, setFullPath] = useState(pathname)

  useEffect(() => {
    const tab = new URLSearchParams(window.location.search).get("tab")
    setFullPath(tab && pathname === "/" ? `/?tab=${tab}` : pathname)
  }, [pathname])

  const currentDashboard = dashboards.find(d => d.href === fullPath) || dashboards[0]
  const CurrentIcon = currentDashboard.icon

  const isDark = theme === "dark"

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
          isDark 
            ? "text-gray-300 hover:text-white hover:bg-white/10" 
            : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
        }`}
      >
        <CurrentIcon className="h-4 w-4" />
        <span>{currentDashboard.name}</span>
        <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
          <div className={`absolute top-full left-0 mt-2 w-64 rounded-lg shadow-xl z-50 overflow-hidden ${
            isDark 
              ? "bg-gray-900 border border-gray-700" 
              : "bg-white border border-gray-200"
          }`}>
            {dashboards.map((dashboard) => {
              const Icon = dashboard.icon
              const isActive = fullPath === dashboard.href
              const isExternal = 'external' in dashboard && dashboard.external
              const linkProps = isExternal ? { target: "_blank", rel: "noopener noreferrer" } : {}
              
              return (
                <Link
                  key={dashboard.href}
                  href={dashboard.href}
                  onClick={() => setIsOpen(false)}
                  {...linkProps}
                  className={`flex items-center gap-3 px-4 py-3 transition-colors border-l-2 ${
                    isDark
                      ? `hover:bg-white/5 ${isActive ? 'bg-white/10 border-cyan-400' : 'border-transparent'}`
                      : `hover:bg-gray-50 ${isActive ? 'bg-blue-50 border-blue-500' : 'border-transparent'}`
                  }`}
                >
                  <Icon className={`h-5 w-5 ${
                    isDark
                      ? isActive ? 'text-cyan-400' : 'text-gray-400'
                      : isActive ? 'text-blue-500' : 'text-gray-400'
                  }`} />
                  <div>
                    <div className={`font-medium ${
                      isDark
                        ? isActive ? 'text-white' : 'text-gray-200'
                        : isActive ? 'text-gray-900' : 'text-gray-700'
                    }`}>
                      {dashboard.name}
                    </div>
                    <div className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                      {dashboard.description}
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
