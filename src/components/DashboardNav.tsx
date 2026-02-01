"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { 
  LayoutGrid, 
  DollarSign, 
  Users, 
  FileText, 
  Tv,
  Megaphone,
  ChevronDown,
  Home,
  BarChart3,
  TrendingUp,
  Search,
} from "lucide-react"

const dashboards = [
  { name: "Home", href: "/", icon: Home, description: "Dashboard directory" },
  { name: "Mission Control", href: "/data", icon: Tv, description: "TV display - forecasts" },
  { name: "Dashboard", href: "/dashboard", icon: LayoutGrid, description: "Sales, Traffic, Ads & more" },
  { name: "Marketing", href: "/ads", icon: Megaphone, description: "Traffic & ad performance" },
  { name: "P&L Recap", href: "/recap", icon: FileText, description: "Monthly P&L reports" },
  { name: "Sales", href: "/sales", icon: DollarSign, description: "Sales analytics" },
  { name: "Team", href: "/team", icon: Users, description: "Team performance" },
  { name: "GA4 Summary", href: "/playground", icon: BarChart3, description: "Monthly traffic by channel" },
  { name: "Google Ads", href: "/google-ads-summary", icon: TrendingUp, description: "Google Ads monthly metrics" },
  { name: "Bing Ads", href: "/bing-ads-summary", icon: Search, description: "Bing Ads monthly metrics" },
]

interface DashboardNavProps {
  theme?: "dark" | "light"
}

export function DashboardNav({ theme = "dark" }: DashboardNavProps) {
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()

  const currentDashboard = dashboards.find(d => d.href === pathname) || dashboards[0]
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
              const isActive = pathname === dashboard.href
              return (
                <Link
                  key={dashboard.href}
                  href={dashboard.href}
                  onClick={() => setIsOpen(false)}
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
