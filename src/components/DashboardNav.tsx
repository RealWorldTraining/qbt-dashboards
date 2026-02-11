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
  ChevronRight,
  Home,
  BarChart3,
  TrendingUp,
  Search,
  Smartphone,
  MapPin,
  Brain,
  Target,
  Sprout,
  FileType,
  Repeat,
  Sparkles,
} from "lucide-react"

interface DashboardItem {
  name: string
  href: string
  icon: any
  description: string
  external?: boolean
}

interface DashboardCategory {
  name: string
  icon: any
  items: DashboardItem[]
}

const dashboardGroups: (DashboardItem | DashboardCategory)[] = [
  {
    name: "Command Center",
    href: "/",
    icon: LayoutGrid,
    description: "Overview dashboard - Sales, Traffic, Ads"
  },
  {
    name: "Revenue",
    icon: DollarSign,
    items: [
      { name: "Sales", href: "/?tab=sales", icon: DollarSign, description: "Daily sales analysis" },
      { name: "Subscriptions", href: "/?tab=subscriptions", icon: Repeat, description: "Subscription metrics & churn" },
      { name: "Intuit Revenue", href: "/intuit-sales", icon: FileText, description: "Intuit revenue by category" },
    ]
  },
  {
    name: "Advertising",
    icon: Target,
    items: [
      { name: "Google Ads", href: "/?tab=google-ads", icon: BarChart3, description: "Google Ads performance" },
      { name: "Bing Ads", href: "/?tab=bing-ads", icon: Search, description: "Bing Ads performance" },
    ]
  },
  {
    name: "Organic & SEO",
    icon: Sprout,
    items: [
      { name: "Traffic", href: "/?tab=traffic", icon: Users, description: "GA4 traffic by channel" },
      { name: "Conversions", href: "/?tab=conversions", icon: TrendingUp, description: "Conversion tracking" },
      { name: "Search Console", href: "/?tab=gsc", icon: Search, description: "Search rankings & clicks" },
      { name: "Landing Pages", href: "/?tab=landing-pages", icon: MapPin, description: "Page performance analysis" },
    ]
  },
  {
    name: "Insights & Tools",
    icon: Sparkles,
    items: [
      { name: "Jedi Council", href: "https://jedi-council-zeta.vercel.app", icon: Brain, description: "Multi-agent AI analysis", external: true },
      { name: "The Prophet", href: "/data", icon: Tv, description: "Sales forecasting & predictions" },
      { name: "Live Help", href: "/live-help", icon: Users, description: "Real-time room status" },
      { name: "P&L Recap", href: "/recap", icon: FileText, description: "Monthly P&L reports" },
    ]
  },
]

interface DashboardNavProps {
  theme?: "dark" | "light"
}

function isCategory(item: DashboardItem | DashboardCategory): item is DashboardCategory {
  return 'items' in item
}

function isDashboardItem(item: DashboardItem | DashboardCategory): item is DashboardItem {
  return 'href' in item
}

export function DashboardNav({ theme = "dark" }: DashboardNavProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set())
  const pathname = usePathname()
  const [fullPath, setFullPath] = useState(pathname)

  useEffect(() => {
    const tab = new URLSearchParams(window.location.search).get("tab")
    setFullPath(tab && pathname === "/" ? `/?tab=${tab}` : pathname)
  }, [pathname])

  // Find current dashboard and determine which group it belongs to
  const findCurrentDashboard = () => {
    for (const group of dashboardGroups) {
      if (isDashboardItem(group) && group.href === fullPath) {
        return { item: group, group: null }
      }
      if (isCategory(group)) {
        const item = group.items.find(i => i.href === fullPath)
        if (item) return { item, group: group.name }
      }
    }
    return { item: dashboardGroups[0] as DashboardItem, group: null }
  }

  const { item: currentDashboard } = findCurrentDashboard()
  const CurrentIcon = currentDashboard.icon

  const isDark = theme === "dark"

  const toggleGroup = (groupName: string) => {
    const newExpanded = new Set(expandedGroups)
    if (newExpanded.has(groupName)) {
      newExpanded.delete(groupName)
    } else {
      newExpanded.add(groupName)
    }
    setExpandedGroups(newExpanded)
  }

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
          <div className={`absolute top-full left-0 mt-2 w-72 rounded-lg shadow-xl z-50 overflow-hidden max-h-[80vh] overflow-y-auto ${
            isDark 
              ? "bg-gray-900 border border-gray-700" 
              : "bg-white border border-gray-200"
          }`}>
            {dashboardGroups.map((group, idx) => {
              if (isDashboardItem(group)) {
                // Render individual item
                const Icon = group.icon
                const isActive = fullPath === group.href
                const isExternal = group.external
                const linkProps = isExternal ? { target: "_blank", rel: "noopener noreferrer" } : {}
                
                return (
                  <Link
                    key={group.href}
                    href={group.href}
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
                    <div className="flex-1">
                      <div className={`font-medium ${
                        isDark
                          ? isActive ? 'text-white' : 'text-gray-200'
                          : isActive ? 'text-gray-900' : 'text-gray-700'
                      }`}>
                        {group.name}
                      </div>
                      <div className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                        {group.description}
                      </div>
                    </div>
                  </Link>
                )
              } else {
                // Render category with items
                const Icon = group.icon
                const isExpanded = expandedGroups.has(group.name)
                const hasActiveItem = group.items.some(item => item.href === fullPath)
                
                return (
                  <div key={group.name}>
                    <button
                      onClick={() => toggleGroup(group.name)}
                      className={`w-full flex items-center gap-3 px-4 py-3 transition-colors ${
                        isDark
                          ? 'hover:bg-white/5 text-gray-300'
                          : 'hover:bg-gray-50 text-gray-600'
                      }`}
                    >
                      <Icon className={`h-5 w-5 ${
                        isDark
                          ? hasActiveItem ? 'text-cyan-400' : 'text-gray-400'
                          : hasActiveItem ? 'text-blue-500' : 'text-gray-500'
                      }`} />
                      <div className={`flex-1 text-left font-semibold ${
                        isDark
                          ? hasActiveItem ? 'text-cyan-400' : 'text-gray-200'
                          : hasActiveItem ? 'text-blue-600' : 'text-gray-700'
                      }`}>
                        {group.name}
                      </div>
                      <ChevronRight className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-90' : ''} ${
                        isDark ? 'text-gray-500' : 'text-gray-400'
                      }`} />
                    </button>
                    {isExpanded && (
                      <div className={isDark ? 'bg-white/5' : 'bg-gray-50'}>
                        {group.items.map((item) => {
                          const ItemIcon = item.icon
                          const isActive = fullPath === item.href
                          const isExternal = item.external
                          const linkProps = isExternal ? { target: "_blank", rel: "noopener noreferrer" } : {}
                          
                          return (
                            <Link
                              key={item.href}
                              href={item.href}
                              onClick={() => setIsOpen(false)}
                              {...linkProps}
                              className={`flex items-center gap-3 pl-12 pr-4 py-2.5 transition-colors border-l-2 ${
                                isDark
                                  ? `hover:bg-white/5 ${isActive ? 'bg-white/10 border-cyan-400' : 'border-transparent'}`
                                  : `hover:bg-gray-100 ${isActive ? 'bg-blue-50 border-blue-500' : 'border-transparent'}`
                              }`}
                            >
                              <ItemIcon className={`h-4 w-4 ${
                                isDark
                                  ? isActive ? 'text-cyan-400' : 'text-gray-500'
                                  : isActive ? 'text-blue-500' : 'text-gray-500'
                              }`} />
                              <div className="flex-1">
                                <div className={`text-sm font-medium ${
                                  isDark
                                    ? isActive ? 'text-white' : 'text-gray-300'
                                    : isActive ? 'text-gray-900' : 'text-gray-700'
                                }`}>
                                  {item.name}
                                </div>
                                <div className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                                  {item.description}
                                </div>
                              </div>
                            </Link>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )
              }
            })}
          </div>
        </>
      )}
    </div>
  )
}
