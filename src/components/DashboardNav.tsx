"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutGrid,
  DollarSign,
  Users,
  FileText,
  ChevronDown,
  ChevronRight,
  BarChart3,
  TrendingUp,
  Search,
  MapPin,
  Target,
  Sprout,
  Repeat,
  Home,
  Layers,
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
  accent: string      // tailwind color for left border & icon bg
  iconColor: string   // tailwind text color for icon
  items: DashboardItem[]
}

const dashboardGroups: (DashboardItem | DashboardCategory)[] = [
  {
    name: "Home",
    href: "/",
    icon: LayoutGrid,
    description: "All dashboards & reports"
  },
  {
    name: "Revenue",
    icon: DollarSign,
    accent: "border-emerald-500",
    iconColor: "bg-emerald-500/20 text-emerald-400",
    items: [
      { name: "Sales", href: "/dashboard?tab=sales", icon: DollarSign, description: "Daily sales & hourly pace" },
      { name: "Subscriptions", href: "/dashboard?tab=subscriptions", icon: Repeat, description: "MRR, churn & retention" },
      { name: "Intuit Revenue", href: "/intuit-sales", icon: FileText, description: "Revenue by category" },
    ]
  },
  {
    name: "Advertising",
    icon: Target,
    accent: "border-violet-500",
    iconColor: "bg-violet-500/20 text-violet-400",
    items: [
      { name: "Google Ads", href: "/dashboard?tab=google-ads", icon: BarChart3, description: "Campaigns, spend & ROAS" },
      { name: "Bing Ads", href: "/dashboard?tab=bing-ads", icon: Search, description: "Microsoft Ads metrics" },
    ]
  },
  {
    name: "Organic & SEO",
    icon: Sprout,
    accent: "border-sky-500",
    iconColor: "bg-sky-500/20 text-sky-400",
    items: [
      { name: "Traffic", href: "/dashboard?tab=traffic", icon: Users, description: "GA4 traffic by channel" },
      { name: "Conversions", href: "/dashboard?tab=conversions", icon: TrendingUp, description: "Goals & conversion rates" },
      { name: "Search Console", href: "/dashboard?tab=gsc", icon: Search, description: "Rankings, clicks & CTR" },
      { name: "Landing Pages", href: "/dashboard?tab=landing-pages", icon: MapPin, description: "Page performance" },
      { name: "Combined", href: "/dashboard?tab=combined", icon: Layers, description: "All organic channels" },
    ]
  },
]

interface DashboardNavProps {
  theme?: "dark" | "light"
  activeHref?: string
}

function isCategory(item: DashboardItem | DashboardCategory): item is DashboardCategory {
  return 'items' in item
}

function isDashboardItem(item: DashboardItem | DashboardCategory): item is DashboardItem {
  return 'href' in item
}

export function DashboardNav({ theme = "dark", activeHref }: DashboardNavProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set())
  const pathname = usePathname()
  const [fullPath, setFullPath] = useState(pathname)

  useEffect(() => {
    if (activeHref) {
      setFullPath(activeHref)
    } else {
      const tab = new URLSearchParams(window.location.search).get("tab")
      setFullPath(tab && pathname === "/dashboard" ? `/dashboard?tab=${tab}` : pathname)
    }
  }, [pathname, activeHref])

  // Auto-expand the group containing the active item
  useEffect(() => {
    for (const group of dashboardGroups) {
      if (isCategory(group) && group.items.some(i => i.href === fullPath)) {
        setExpandedGroups(prev => new Set(prev).add(group.name))
        break
      }
    }
  }, [fullPath])

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
    <div className="relative flex items-center gap-1">
      <Link
        href="/"
        className={`flex items-center justify-center h-8 w-8 rounded-lg transition-colors ${
          isDark
            ? "text-gray-400 hover:text-white hover:bg-white/10"
            : "text-gray-400 hover:text-gray-900 hover:bg-gray-100"
        }`}
        title="Home"
      >
        <Home className="h-4 w-4" />
      </Link>
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
        <ChevronDown className={`h-3.5 w-3.5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className={`absolute top-full left-0 mt-2 w-80 rounded-xl shadow-2xl z-50 overflow-hidden max-h-[85vh] overflow-y-auto ${
            isDark
              ? "bg-[#111827] border border-white/10 ring-1 ring-white/5"
              : "bg-white border border-gray-200 ring-1 ring-gray-100"
          }`}>
            {/* Top items: Home & Command Center */}
            <div className={`p-2 ${isDark ? 'border-b border-white/[0.06]' : 'border-b border-gray-100'}`}>
              {dashboardGroups.filter(isDashboardItem).map((group) => {
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
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                      isDark
                        ? `hover:bg-white/[0.06] ${isActive ? 'bg-white/[0.08]' : ''}`
                        : `hover:bg-gray-50 ${isActive ? 'bg-blue-50' : ''}`
                    }`}
                  >
                    <div className={`flex items-center justify-center h-8 w-8 rounded-lg ${
                      isDark
                        ? isActive ? 'bg-cyan-500/20 text-cyan-400' : 'bg-white/[0.06] text-gray-400'
                        : isActive ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500'
                    }`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1">
                      <div className={`text-sm font-medium ${
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
              })}
            </div>

            {/* Category groups */}
            <div className="p-2 space-y-1">
              {dashboardGroups.filter(isCategory).map((group) => {
                const Icon = group.icon
                const isExpanded = expandedGroups.has(group.name)
                const hasActiveItem = group.items.some(item => item.href === fullPath)

                return (
                  <div key={group.name}>
                    {/* Section header */}
                    <button
                      onClick={() => toggleGroup(group.name)}
                      className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-colors group ${
                        isDark
                          ? 'hover:bg-white/[0.04]'
                          : 'hover:bg-gray-50'
                      }`}
                    >
                      <div className={`h-8 w-1 rounded-full ${group.accent}`} />
                      <Icon className={`h-5 w-5 ${
                        isDark
                          ? hasActiveItem ? 'text-white' : 'text-gray-400 group-hover:text-gray-300'
                          : hasActiveItem ? 'text-gray-900' : 'text-gray-400 group-hover:text-gray-600'
                      }`} />
                      <span className={`flex-1 text-left text-[11px] font-bold tracking-[0.1em] uppercase ${
                        isDark
                          ? hasActiveItem ? 'text-white' : 'text-gray-400 group-hover:text-gray-300'
                          : hasActiveItem ? 'text-gray-900' : 'text-gray-500 group-hover:text-gray-700'
                      }`}>
                        {group.name}
                      </span>
                      <ChevronRight className={`h-4 w-4 transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''} ${
                        isDark ? 'text-gray-600 group-hover:text-gray-400' : 'text-gray-300 group-hover:text-gray-500'
                      }`} />
                    </button>

                    {/* Expanded items */}
                    {isExpanded && (
                      <div className="ml-4 pl-3 space-y-0.5 pb-1" style={{ borderLeft: '1px solid rgba(255,255,255,0.06)' }}>
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
                              className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                                isDark
                                  ? `hover:bg-white/[0.06] ${isActive ? 'bg-white/[0.08]' : ''}`
                                  : `hover:bg-gray-50 ${isActive ? 'bg-blue-50' : ''}`
                              }`}
                            >
                              <div className={`flex items-center justify-center h-7 w-7 rounded-md ${
                                isActive
                                  ? group.iconColor
                                  : isDark
                                    ? 'bg-white/[0.04] text-gray-500'
                                    : 'bg-gray-100 text-gray-400'
                              }`}>
                                <ItemIcon className="h-3.5 w-3.5" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className={`text-sm font-medium ${
                                  isDark
                                    ? isActive ? 'text-white' : 'text-gray-300'
                                    : isActive ? 'text-gray-900' : 'text-gray-700'
                                }`}>
                                  {item.name}
                                </div>
                                <div className={`text-[11px] truncate ${
                                  isDark ? 'text-gray-600' : 'text-gray-400'
                                }`}>
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
              })}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
