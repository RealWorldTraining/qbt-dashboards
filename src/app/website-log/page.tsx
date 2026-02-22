'use client'

import { useEffect, useState, useMemo } from 'react'

// â”€â”€â”€ Types â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

interface EventLink {
  label: string
  url: string
}

interface LogEvent {
  id: string
  date: string
  time: string
  timezone: string
  title: string
  description: string
  category: string
  impact: 'high' | 'medium' | 'low'
  author: string
  links?: EventLink[]
}

interface ChangelogData {
  project: string
  description: string
  lastUpdated: string
  events: LogEvent[]
}

// â”€â”€â”€ Style Maps â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const CATEGORY_STYLES: Record<string, string> = {
  'SEO':            'bg-indigo-50 text-indigo-800 border-indigo-200',
  'Feature':        'bg-emerald-50 text-emerald-800 border-emerald-200',
  'Infrastructure': 'bg-orange-50 text-orange-800 border-orange-200',
  'Bug Fix':        'bg-rose-50 text-rose-800 border-rose-200',
  'Design':         'bg-purple-50 text-purple-800 border-purple-200',
  'Content':        'bg-amber-50 text-amber-800 border-amber-200',
  'Performance':    'bg-cyan-50 text-cyan-800 border-cyan-200',
  'Integration':    'bg-blue-50 text-blue-800 border-blue-200',
}
const CATEGORY_STYLE_DEFAULT = 'bg-gray-50 text-gray-700 border-gray-200'

const IMPACT = {
  high:   { dot: 'bg-red-500',   label: 'High',   badge: 'text-red-600 bg-red-50 border-red-200' },
  medium: { dot: 'bg-amber-400', label: 'Medium', badge: 'text-amber-700 bg-amber-50 border-amber-200' },
  low:    { dot: 'bg-green-500', label: 'Low',    badge: 'text-green-700 bg-green-50 border-green-200' },
}

// â”€â”€â”€ Helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function formatDisplayDate(dateStr: string) {
  // Parse as local date (avoid UTC shift)
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
  })
}

function formatLastUpdated(iso: string) {
  try {
    return new Date(iso).toLocaleDateString('en-US', {
      month: 'long', day: 'numeric', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    })
  } catch {
    return iso
  }
}

// Group events by date, preserving order
function groupByDate(events: LogEvent[]): { date: string; events: LogEvent[] }[] {
  const map = new Map<string, LogEvent[]>()
  for (const e of events) {
    if (!map.has(e.date)) map.set(e.date, [])
    map.get(e.date)!.push(e)
  }
  return Array.from(map.entries()).map(([date, events]) => ({ date, events }))
}

// â”€â”€â”€ Filter chip â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function Chip({
  label, active, color, dot, onClick,
}: {
  label: string; active: boolean; color?: string; dot?: string; onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium border transition-all ${
        active
          ? 'bg-gray-900 text-white border-gray-900 shadow-sm'
          : `bg-white border-gray-300 text-gray-600 hover:border-gray-500 ${color ?? ''}`
      }`}
    >
      {dot && <span className={`w-2 h-2 rounded-full flex-shrink-0 ${active ? 'bg-white' : dot}`} />}
      {label}
    </button>
  )
}

// â”€â”€â”€ Page â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export default function WebsiteLogPage() {
  const [data, setData] = useState<ChangelogData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const [activeImpact, setActiveImpact] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/website-log')
      .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json() })
      .then(d => { setData(d); setLoading(false) })
      .catch(e => { setError(e.message); setLoading(false) })
  }, [])

  const categories = useMemo(
    () => (data ? [...new Set(data.events.map(e => e.category))] : []),
    [data],
  )

  const filtered = useMemo(() => {
    if (!data) return []
    return data.events.filter(e => {
      if (activeCategory && e.category !== activeCategory) return false
      if (activeImpact && e.impact !== activeImpact) return false
      return true
    })
  }, [data, activeCategory, activeImpact])

  const grouped = useMemo(() => groupByDate(filtered), [filtered])

  // â”€â”€ Loading / Error states â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-500 text-sm">Loading development logâ€¦</p>
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-xl border border-red-200 p-8 text-center max-w-md">
          <div className="text-3xl mb-3">âš ï¸</div>
          <h2 className="text-lg font-semibold text-gray-800 mb-1">Could not load log</h2>
          <p className="text-sm text-red-600">{error}</p>
        </div>
      </div>
    )
  }

  const impactCounts = {
    high:   data.events.filter(e => e.impact === 'high').length,
    medium: data.events.filter(e => e.impact === 'medium').length,
    low:    data.events.filter(e => e.impact === 'low').length,
  }

  // â”€â”€ Render â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  return (
    <div className="min-h-screen bg-gray-50">

      {/* â”€â”€ Header â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-5xl mx-auto px-6 py-8">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <span className="text-3xl select-none">ðŸŒ</span>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
                  Website Development Log
                </h1>
              </div>
              <p className="text-gray-500 text-base mt-1 ml-[52px]">{data.description}</p>
            </div>
            <div className="text-right text-sm text-gray-400 flex-shrink-0 ml-[52px] sm:ml-0">
              <div className="font-semibold text-gray-700 text-base">{data.project}</div>
              <div className="mt-0.5">Last updated {formatLastUpdated(data.lastUpdated)}</div>
            </div>
          </div>

          {/* Stats bar */}
          <div className="flex flex-wrap gap-3 mt-7">
            <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-4 py-2">
              <span className="text-xl font-bold text-gray-900">{data.events.length}</span>
              <span className="text-sm text-gray-500">total events</span>
            </div>
            {(['high', 'medium', 'low'] as const).map(impact => (
              <div key={impact} className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-4 py-2">
                <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${IMPACT[impact].dot}`} />
                <span className="text-xl font-bold text-gray-900">{impactCounts[impact]}</span>
                <span className="text-sm text-gray-500 capitalize">{impact} impact</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* â”€â”€ Filters â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <div className="max-w-5xl mx-auto px-6 pt-5 pb-2">
        <div className="flex flex-wrap gap-2 items-center">

          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide mr-1">Category</span>
          <Chip
            label="All"
            active={!activeCategory}
            onClick={() => setActiveCategory(null)}
          />
          {categories.map(cat => (
            <Chip
              key={cat}
              label={cat}
              active={activeCategory === cat}
              onClick={() => setActiveCategory(activeCategory === cat ? null : cat)}
            />
          ))}

          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide ml-4 mr-1">Impact</span>
          {(['high', 'medium', 'low'] as const).map(impact => (
            <Chip
              key={impact}
              label={IMPACT[impact].label}
              active={activeImpact === impact}
              dot={IMPACT[impact].dot}
              onClick={() => setActiveImpact(activeImpact === impact ? null : impact)}
            />
          ))}

          {(activeCategory || activeImpact) && (
            <button
              onClick={() => { setActiveCategory(null); setActiveImpact(null) }}
              className="ml-2 text-xs text-gray-400 hover:text-gray-600 underline underline-offset-2"
            >
              Clear filters
            </button>
          )}
        </div>

        <p className="text-xs text-gray-400 mt-3">
          Showing <strong className="text-gray-600">{filtered.length}</strong> of {data.events.length} events
        </p>
      </div>

      {/* â”€â”€ Timeline â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <div className="max-w-5xl mx-auto px-6 pt-4 pb-20">
        {grouped.length === 0 ? (
          <div className="text-center text-gray-400 py-20 text-sm">
            No events match the selected filters.
          </div>
        ) : (
          <div className="space-y-8">
            {grouped.map(({ date, events }) => (
              <div key={date}>

                {/* Date divider */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-px flex-1 bg-gray-200" />
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest whitespace-nowrap">
                    {formatDisplayDate(date)}
                  </span>
                  <div className="h-px flex-1 bg-gray-200" />
                </div>

                {/* Events for this date */}
                <div className="space-y-3">
                  {events.map(event => {
                    const catStyle = CATEGORY_STYLES[event.category] ?? CATEGORY_STYLE_DEFAULT
                    const impact = IMPACT[event.impact] ?? IMPACT.medium

                    return (
                      <div
                        key={event.id}
                        className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-shadow"
                      >
                        {/* Top row: title + badges */}
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-3">
                          <h3 className="text-base font-semibold text-gray-900 leading-snug flex-1 pr-2">
                            {event.title}
                          </h3>
                          <div className="flex flex-wrap items-center gap-2 flex-shrink-0">
                            {/* Impact badge */}
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${impact.badge}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${impact.dot}`} />
                              {impact.label} Impact
                            </span>
                            {/* Category badge */}
                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${catStyle}`}>
                              {event.category}
                            </span>
                          </div>
                        </div>

                        {/* Description */}
                        <p className="text-sm text-gray-600 leading-relaxed mb-4">
                          {event.description}
                        </p>

                        {/* Footer: time + author + links */}
                        <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-gray-100">
                          <div className="flex items-center gap-3 text-xs text-gray-400">
                            <span>ðŸ• {event.time} {event.timezone}</span>
                            <span>Â·</span>
                            <span>ðŸ‘¤ {event.author}</span>
                          </div>
                          {event.links && event.links.length > 0 && (
                            <div className="flex gap-3">
                              {event.links.map(link => (
                                <a
                                  key={link.url}
                                  href={link.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs text-indigo-600 hover:text-indigo-800 font-medium underline underline-offset-2"
                                >
                                  {link.label} â†’
                                </a>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
