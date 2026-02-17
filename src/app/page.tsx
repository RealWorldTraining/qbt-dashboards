"use client"

import Link from "next/link"
import {
  DollarSign,
  Repeat,
  BarChart3,
  Search,
  Users,
  TrendingUp,
  MapPin,
  Layers,
  FileText,
  Activity,
  Eye,
  Phone,
  UserCheck,
  Star,
  Headphones,
  Archive,
  LayoutGrid,
  Monitor,
  ShoppingCart,
  ArrowUpRight,
  Zap,
  Smartphone,
} from "lucide-react"

interface DashboardCard {
  name: string
  description: string
  href: string
  icon: any
  tags?: string[]
  subtabs?: string[]
}

interface DashboardSection {
  title: string
  accent: string
  glowColor: string
  iconBg: string
  borderColor: string
  gradientBar: string
  items: DashboardCard[]
}

const sections: DashboardSection[] = [
  {
    title: "Revenue",
    accent: "text-emerald-400",
    glowColor: "group-hover:shadow-emerald-500/25",
    iconBg: "bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/20",
    borderColor: "border-white/[0.06] hover:border-emerald-400/40",
    gradientBar: "from-emerald-400 to-emerald-600",
    items: [
      {
        name: "Sales",
        description: "Daily sales analysis, hourly pace & forecasts",
        href: "/dashboard?tab=sales",
        icon: DollarSign,
        tags: ["Revenue", "Orders", "Forecasts"],
      },
      {
        name: "Subscriptions",
        description: "Subscription metrics, MRR & churn analysis",
        href: "/dashboard?tab=subscriptions",
        icon: Repeat,
        tags: ["MRR", "Churn", "Retention"],
      },
    ],
  },
  {
    title: "Advertising",
    accent: "text-blue-400",
    glowColor: "group-hover:shadow-blue-500/25",
    iconBg: "bg-blue-500/15 text-blue-400 ring-1 ring-blue-500/20",
    borderColor: "border-white/[0.06] hover:border-blue-400/40",
    gradientBar: "from-blue-400 to-blue-600",
    items: [
      {
        name: "Google Ads",
        description: "Campaign performance, spend & ROAS",
        href: "/dashboard?tab=google-ads",
        icon: BarChart3,
        tags: ["Spend", "Conversions", "ROAS"],
        subtabs: ["Summary", "CPC", "Age", "Assets"],
      },
      {
        name: "Bing Ads",
        description: "Microsoft Advertising performance metrics",
        href: "/dashboard?tab=bing-ads",
        icon: Search,
        tags: ["Spend", "Conversions", "ROAS"],
        subtabs: ["Summary", "CPC"],
      },
    ],
  },
  {
    title: "Organic & SEO",
    accent: "text-violet-400",
    glowColor: "group-hover:shadow-violet-500/25",
    iconBg: "bg-violet-500/15 text-violet-400 ring-1 ring-violet-500/20",
    borderColor: "border-white/[0.06] hover:border-violet-400/40",
    gradientBar: "from-violet-400 to-violet-600",
    items: [
      {
        name: "Traffic",
        description: "GA4 traffic by channel & source",
        href: "/dashboard?tab=traffic",
        icon: Users,
        tags: ["Sessions", "Channels"],
      },
      {
        name: "Conversions",
        description: "Goal completions & conversion tracking",
        href: "/dashboard?tab=conversions",
        icon: TrendingUp,
        tags: ["Goals", "Rates"],
      },
      {
        name: "Search Console",
        description: "Search rankings, clicks & impressions",
        href: "/dashboard?tab=gsc",
        icon: Search,
        tags: ["Rankings", "CTR"],
      },
      {
        name: "Landing Pages",
        description: "Page performance & engagement analysis",
        href: "/dashboard?tab=landing-pages",
        icon: MapPin,
        tags: ["Pages", "Performance"],
      },
      {
        name: "Combined Performance",
        description: "Cross-channel organic performance overview",
        href: "/dashboard?tab=combined",
        icon: Layers,
        tags: ["Overview", "All Channels"],
      },
    ],
  },
  {
    title: "TV / Mobile Optimized",
    accent: "text-amber-400",
    glowColor: "group-hover:shadow-amber-500/25",
    iconBg: "bg-amber-500/15 text-amber-400 ring-1 ring-amber-500/20",
    borderColor: "border-white/[0.06] hover:border-amber-400/40",
    gradientBar: "from-amber-400 to-amber-600",
    items: [
      {
        name: "Sales (iPhone)",
        description: "Sales report optimized for mobile",
        href: "/phone",
        icon: Smartphone,
        tags: ["Sales", "Mobile"],
      },
      {
        name: "Sales Snapshot",
        description: "Real-time forecasts for office TV & mobile",
        href: "/data",
        icon: Monitor,
        tags: ["TV", "Real-time"],
      },
    ],
  },
  {
    title: "Other Reports",
    accent: "text-slate-400",
    glowColor: "group-hover:shadow-slate-500/15",
    iconBg: "bg-slate-500/15 text-slate-400 ring-1 ring-slate-500/20",
    borderColor: "border-white/[0.06] hover:border-slate-400/30",
    gradientBar: "from-slate-400 to-slate-600",
    items: [
      {
        name: "Command Center",
        description: "Comprehensive all-in-one dashboard",
        href: "/dashboard",
        icon: LayoutGrid,
        tags: ["All-in-one"],
      },
      {
        name: "Marketing Dashboard",
        description: "Traffic by channel, Google & Bing Ads",
        href: "/ads",
        icon: Activity,
        tags: ["Traffic", "Ads", "ROI"],
      },
      {
        name: "Sales Dashboard",
        description: "Detailed sales analytics and trends",
        href: "/sales",
        icon: ShoppingCart,
        tags: ["Revenue", "Orders"],
      },
      {
        name: "P&L Recap",
        description: "Monthly profit & loss reports",
        href: "/recap",
        icon: FileText,
        tags: ["Monthly"],
      },
      {
        name: "GA4 Summary",
        description: "Monthly traffic by channel from GA4",
        href: "/playground",
        icon: BarChart3,
        tags: ["Traffic", "Channels"],
      },
      {
        name: "Google Ads Summary",
        description: "Monthly Google Ads: spend, conversions, ROAS",
        href: "/google-ads-summary",
        icon: BarChart3,
        tags: ["Spend", "ROAS"],
      },
      {
        name: "Bing Ads Summary",
        description: "Monthly Bing Ads performance",
        href: "/bing-ads-summary",
        icon: Search,
        tags: ["Spend", "ROAS"],
      },
      {
        name: "Trend Analysis",
        description: "YoY comparisons & 4-week trends",
        href: "/trend-analysis",
        icon: TrendingUp,
        tags: ["Trends", "YoY"],
      },
      {
        name: "Vision Analytics",
        description: "Search keyword deep analysis",
        href: "/vision",
        icon: Eye,
        tags: ["Keywords"],
      },
      {
        name: "Intuit Revenue",
        description: "Intuit revenue breakdown by category",
        href: "/intuit-sales",
        icon: DollarSign,
        tags: ["Intuit"],
      },
      {
        name: "Team Dashboard",
        description: "Team performance metrics",
        href: "/team",
        icon: UserCheck,
        tags: ["Team"],
      },
      {
        name: "Reviews",
        description: "Customer reviews dashboard",
        href: "/reviews",
        icon: Star,
        tags: ["Reviews"],
      },
      {
        name: "Live Help",
        description: "Real-time live help status",
        href: "/live-help",
        icon: Headphones,
        tags: ["Real-time"],
      },
      {
        name: "Live Help Archive",
        description: "Historical live help logs",
        href: "/live-help-archive",
        icon: Archive,
        tags: ["History"],
      },
      {
        name: "SEO Rankings",
        description: "AWR keyword rankings & visibility",
        href: "/seo/rankings",
        icon: TrendingUp,
        tags: ["Rankings", "AWR"],
      },
      {
        name: "SEO Competitors",
        description: "Competitor ranking analysis",
        href: "/seo/competitors",
        icon: Users,
        tags: ["Competitors"],
      },
      {
        name: "AI Search",
        description: "AI search visibility & citations",
        href: "/seo/ai-search",
        icon: Search,
        tags: ["AI", "Citations"],
      },
      {
        name: "Age Analysis",
        description: "Google Ads age demographic breakdown",
        href: "/age-analysis",
        icon: BarChart3,
        tags: ["Demographics"],
      },
    ],
  },
]

function CardComponent({ card, section, index }: { card: DashboardCard; section: DashboardSection; index: number }) {
  const Icon = card.icon

  return (
    <Link
      href={card.href}
      className={`group relative flex flex-col rounded-2xl border backdrop-blur-sm bg-white/[0.03] p-6 transition-all duration-300 ease-out hover:scale-[1.02] hover:bg-white/[0.07] hover:shadow-2xl ${section.borderColor} ${section.glowColor} card-enter`}
      style={{ animationDelay: `${index * 60}ms` }}
    >
      {/* Arrow indicator */}
      <div className="absolute top-5 right-5 opacity-0 translate-x-[-4px] group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
        <ArrowUpRight className={`h-4 w-4 ${section.accent} opacity-60`} />
      </div>

      {/* Icon */}
      <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${section.iconBg} mb-4 transition-transform duration-300 group-hover:scale-110`}>
        <Icon className="h-6 w-6" />
      </div>

      {/* Content */}
      <h3 className="text-base font-semibold text-white mb-1.5 group-hover:text-white transition-colors">{card.name}</h3>
      <p className="text-[13px] text-white/45 leading-relaxed mb-4 flex-1">{card.description}</p>

      {/* Sub-tabs */}
      {card.subtabs && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {card.subtabs.map((tab) => (
            <span
              key={tab}
              className="px-2.5 py-1 text-[11px] font-medium rounded-lg border border-white/[0.08] bg-white/[0.03] text-white/50 group-hover:border-white/[0.12] group-hover:text-white/60 transition-colors"
            >
              {tab}
            </span>
          ))}
        </div>
      )}

      {/* Tags */}
      {card.tags && (
        <div className="flex items-center gap-1.5 mt-auto">
          {card.tags.map((tag, i) => (
            <span key={tag} className="text-[11px] text-white/25">
              {i > 0 && <span className="mr-1.5">·</span>}
              {tag}
            </span>
          ))}
        </div>
      )}
    </Link>
  )
}

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#0B0F1A]">
      {/* Ambient background glow */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-emerald-500/[0.04] blur-[120px]" />
        <div className="absolute top-[20%] right-[-5%] w-[400px] h-[400px] rounded-full bg-blue-500/[0.04] blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[30%] w-[500px] h-[500px] rounded-full bg-violet-500/[0.03] blur-[120px]" />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 py-12">
        {/* Header */}
        <header className="mb-16 header-enter">
          <div className="flex items-center gap-4 mb-2">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400 to-blue-500 shadow-lg shadow-cyan-500/25">
              <Zap className="h-5.5 w-5.5 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white tracking-tight">
              QuickBooks Training
            </h1>
          </div>
          <p className="text-white/35 text-sm ml-[60px]">Analytics & Dashboards</p>
        </header>

        {/* Sections */}
        {sections.map((section, sectionIdx) => (
          <section
            key={section.title}
            className="mb-14 section-enter"
            style={{ animationDelay: `${sectionIdx * 100}ms` }}
          >
            {/* Section Header */}
            <div className="flex items-center gap-4 mb-7">
              <div className={`h-7 w-1.5 rounded-full bg-gradient-to-b ${section.gradientBar}`} />
              <h2 className={`text-sm font-bold uppercase tracking-[0.15em] ${section.accent}`}>
                {section.title}
              </h2>
              <div className="flex-1 h-px bg-gradient-to-r from-white/[0.06] to-transparent" />
            </div>

            {/* Cards Grid */}
            <div className={`grid gap-4 ${
              section.items.length <= 2
                ? "grid-cols-1 sm:grid-cols-2"
                : section.items.length <= 4
                ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"
                : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
            }`}>
              {section.items.map((card, cardIdx) => (
                <CardComponent
                  key={card.name}
                  card={card}
                  section={section}
                  index={sectionIdx * 4 + cardIdx}
                />
              ))}
            </div>
          </section>
        ))}

        {/* Footer */}
        <footer className="mt-16 pt-8 border-t border-white/[0.06]">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-white/25">
              QuickBooks Training · Internal Analytics
            </p>
            <a
              href="https://quickbookstraining.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-white/25 hover:text-white/50 transition-colors flex items-center gap-1"
            >
              Main Site
              <ArrowUpRight className="h-3 w-3" />
            </a>
          </div>
        </footer>
      </div>
    </div>
  )
}
