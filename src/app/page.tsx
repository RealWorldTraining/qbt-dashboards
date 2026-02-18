"use client"

import Link from "next/link"
import Image from "next/image"
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
  Star,
  Headphones,
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
  preview?: string
}

interface DashboardSection {
  title: string
  accent: string
  glowColor: string
  iconBg: string
  borderColor: string
  gradientBar: string
  cardGradient: string
  items: DashboardCard[]
}

const sections: DashboardSection[] = [
  {
    title: "Revenue",
    accent: "text-emerald-400",
    glowColor: "group-hover:shadow-emerald-500/20",
    iconBg: "bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/30",
    borderColor: "border-emerald-500/[0.12] hover:border-emerald-400/50",
    gradientBar: "from-emerald-400 to-emerald-600",
    cardGradient: "from-emerald-500/[0.06] via-transparent to-transparent",
    items: [
      {
        name: "Sales",
        description: "Daily sales analysis, hourly pace & forecasts",
        href: "/dashboard?tab=sales",
        icon: DollarSign,
        tags: ["Revenue", "Orders", "Forecasts"],
        preview: "/previews/sales.png",
      },
      {
        name: "Subscriptions",
        description: "Subscription metrics, MRR & churn analysis",
        href: "/dashboard?tab=subscriptions",
        icon: Repeat,
        tags: ["MRR", "Churn", "Retention"],
        preview: "/previews/subscriptions.png",
      },
    ],
  },
  {
    title: "Advertising",
    accent: "text-blue-400",
    glowColor: "group-hover:shadow-blue-500/20",
    iconBg: "bg-blue-500/15 text-blue-400 ring-1 ring-blue-500/30",
    borderColor: "border-blue-500/[0.12] hover:border-blue-400/50",
    gradientBar: "from-blue-400 to-blue-600",
    cardGradient: "from-blue-500/[0.06] via-transparent to-transparent",
    items: [
      {
        name: "Google Ads",
        description: "Campaign performance, spend & ROAS",
        href: "/dashboard?tab=google-ads",
        icon: BarChart3,
        tags: ["Spend", "Conversions", "ROAS"],
        subtabs: ["Summary", "CPC", "Age", "Assets"],
        preview: "/previews/dashboard.png",
      },
      {
        name: "Bing Ads",
        description: "Microsoft Advertising performance metrics",
        href: "/dashboard?tab=bing-ads",
        icon: Search,
        tags: ["Spend", "Conversions", "ROAS"],
        subtabs: ["Summary", "CPC"],
        preview: "/previews/cpc-bing.png",
      },
    ],
  },
  {
    title: "Organic & SEO",
    accent: "text-violet-400",
    glowColor: "group-hover:shadow-violet-500/20",
    iconBg: "bg-violet-500/15 text-violet-400 ring-1 ring-violet-500/30",
    borderColor: "border-violet-500/[0.12] hover:border-violet-400/50",
    gradientBar: "from-violet-400 to-violet-600",
    cardGradient: "from-violet-500/[0.06] via-transparent to-transparent",
    items: [
      {
        name: "Traffic",
        description: "GA4 traffic by channel & source",
        href: "/dashboard?tab=traffic",
        icon: Users,
        tags: ["Sessions", "Channels"],
        preview: "/previews/traffic.png",
      },
      {
        name: "Conversions",
        description: "Goal completions & conversion tracking",
        href: "/dashboard?tab=conversions",
        icon: TrendingUp,
        tags: ["Goals", "Rates"],
        preview: "/previews/conversions.png",
      },
      {
        name: "Search Console",
        description: "Search rankings, clicks & impressions",
        href: "/dashboard?tab=gsc",
        icon: Search,
        tags: ["Rankings", "CTR"],
        preview: "/previews/gsc.png",
      },
      {
        name: "Landing Pages",
        description: "Page performance & engagement analysis",
        href: "/dashboard?tab=landing-pages",
        icon: MapPin,
        tags: ["Pages", "Performance"],
        preview: "/previews/landing-pages.png",
      },
      {
        name: "Combined Performance",
        description: "Cross-channel organic performance overview",
        href: "/dashboard?tab=combined",
        icon: Layers,
        tags: ["Overview", "All Channels"],
        preview: "/previews/combined.png",
      },
      {
        name: "GA4 Traffic by Channel",
        description: "Monthly traffic by channel from GA4",
        href: "/playground",
        icon: BarChart3,
        tags: ["Traffic", "Channels"],
        preview: "/previews/playground.png",
      },
    ],
  },
  {
    title: "TV / Mobile Optimized",
    accent: "text-amber-400",
    glowColor: "group-hover:shadow-amber-500/20",
    iconBg: "bg-amber-500/15 text-amber-400 ring-1 ring-amber-500/30",
    borderColor: "border-amber-500/[0.12] hover:border-amber-400/50",
    gradientBar: "from-amber-400 to-amber-600",
    cardGradient: "from-amber-500/[0.06] via-transparent to-transparent",
    items: [
      {
        name: "Sales (iPhone)",
        description: "Sales report optimized for mobile",
        href: "/phone",
        icon: Smartphone,
        tags: ["Sales", "Mobile"],
        preview: "/previews/phone.png",
      },
      {
        name: "Sales Snapshot",
        description: "Real-time forecasts for office TV & mobile",
        href: "/data",
        icon: Monitor,
        tags: ["TV", "Real-time"],
        preview: "/previews/data.png",
      },
      {
        name: "Marketing Dashboard",
        description: "Traffic by channel, Google & Bing Ads",
        href: "/ads",
        icon: Activity,
        tags: ["Traffic", "Ads", "ROI"],
        preview: "/previews/ads.png",
      },
    ],
  },
  {
    title: "Other Reports",
    accent: "text-slate-400",
    glowColor: "group-hover:shadow-slate-500/15",
    iconBg: "bg-slate-500/15 text-slate-400 ring-1 ring-slate-500/20",
    borderColor: "border-white/[0.08] hover:border-slate-400/40",
    gradientBar: "from-slate-400 to-slate-600",
    cardGradient: "from-slate-500/[0.04] via-transparent to-transparent",
    items: [
      {
        name: "P&L Recap",
        description: "Monthly profit & loss reports",
        href: "/recap",
        icon: FileText,
        tags: ["Monthly"],
        preview: "/previews/recap.png",
      },
      {
        name: "Trend Analysis",
        description: "YoY comparisons & 4-week trends",
        href: "/trend-analysis",
        icon: TrendingUp,
        tags: ["Trends", "YoY"],
        preview: "/previews/trend-analysis.png",
      },
      {
        name: "Vision Analytics",
        description: "Search keyword deep analysis",
        href: "/vision",
        icon: Eye,
        tags: ["Keywords"],
        preview: "/previews/vision.png",
      },
      {
        name: "Intuit Revenue",
        description: "Intuit revenue breakdown by category",
        href: "/intuit-sales",
        icon: DollarSign,
        tags: ["Intuit"],
        preview: "/previews/intuit-sales.png",
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
        preview: "/previews/live-help.png",
      },
      {
        name: "Age Analysis",
        description: "Google Ads age demographic breakdown",
        href: "/age-analysis",
        icon: BarChart3,
        tags: ["Demographics"],
        preview: "/previews/age-analysis.png",
      },
      {
        name: "Health Check",
        description: "System health monitoring and status",
        href: "/health",
        icon: Activity,
        tags: ["System", "Status"],
      },
    ],
  },
]

function CardComponent({
  card,
  section,
  index,
}: {
  card: DashboardCard
  section: DashboardSection
  index: number
}) {
  const Icon = card.icon

  return (
    <Link
      href={card.href}
      className={`group relative rounded-xl border bg-[#141926] hover:bg-[#1a2036] p-5 transition-all duration-200 ease-out hover:scale-[1.02] hover:shadow-xl overflow-hidden cursor-pointer ${section.borderColor} ${section.glowColor} card-enter`}
      style={{ animationDelay: `${index * 60}ms` }}
    >
      {/* Left accent bar */}
      <div className={`absolute left-0 top-3 bottom-3 w-[3px] rounded-full bg-gradient-to-b ${section.gradientBar} opacity-40 group-hover:opacity-80 transition-opacity`} />

      {/* Preview image — fills card on hover */}
      {card.preview && (
        <div className="absolute inset-0 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none rounded-xl overflow-hidden">
          <Image
            src={card.preview}
            alt={`${card.name} preview`}
            fill
            className="object-cover object-top"
            sizes="400px"
            unoptimized
          />
          <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/90 via-black/50 to-transparent" />
          <div className="absolute bottom-3 left-4 right-4">
            <p className="text-sm font-bold text-white drop-shadow-lg">{card.name}</p>
          </div>
        </div>
      )}

      {/* Header row: Icon + Title + Arrow */}
      <div className="flex items-center gap-3 mb-2.5">
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${section.iconBg} transition-all duration-200 group-hover:scale-105`}
        >
          <Icon className="h-5 w-5" />
        </div>
        <h3 className="text-lg font-bold text-white group-hover:text-white transition-colors tracking-tight flex-1">
          {card.name}
        </h3>
        <ArrowUpRight className={`h-4 w-4 shrink-0 ${section.accent} opacity-0 group-hover:opacity-60 translate-x-[-4px] group-hover:translate-x-0 transition-all duration-200`} />
      </div>

      {/* Description */}
      <p className="text-[13px] text-white/40 leading-relaxed ml-[52px] mb-3">
        {card.description}
      </p>

      {/* Sub-tabs */}
      {card.subtabs && (
        <div className="flex flex-wrap gap-1.5 ml-[52px] mb-2">
          {card.subtabs.map((tab) => (
            <span
              key={tab}
              className="px-2.5 py-0.5 text-[11px] font-semibold rounded-full bg-white/[0.06] text-white/50 border border-white/[0.08] group-hover:bg-white/[0.1] group-hover:text-white/70 group-hover:border-white/[0.15] transition-all"
            >
              {tab}
            </span>
          ))}
        </div>
      )}

      {/* Tags */}
      {card.tags && !card.subtabs && (
        <div className="flex items-center gap-2 ml-[52px]">
          {card.tags.map((tag, i) => (
            <span key={tag} className="text-[11px] font-medium text-white/25">
              {i > 0 && <span className="mr-2 text-white/10">·</span>}
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
          <div className="flex items-center gap-4 mb-1">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400 to-blue-500 shadow-lg shadow-cyan-500/25">
              <Zap className="h-5.5 w-5.5 text-white" />
            </div>
            <h1 className="text-4xl font-extrabold text-white tracking-tight uppercase">
              Command Center
            </h1>
          </div>
          <p className="text-white/30 text-sm ml-[60px]">
            QuickBooks Training · Analytics & Dashboards
          </p>
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
              <div
                className={`h-7 w-1.5 rounded-full bg-gradient-to-b ${section.gradientBar}`}
              />
              <h2
                className={`text-sm font-bold uppercase tracking-[0.15em] ${section.accent}`}
              >
                {section.title}
              </h2>
              <div className="flex-1 h-px bg-gradient-to-r from-white/[0.06] to-transparent" />
            </div>

            {/* Cards Grid */}
            <div
              className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
            >
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
