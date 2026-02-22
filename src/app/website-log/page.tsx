'use client'

import { useEffect, useState, useMemo, useRef } from 'react'

// --- Types -------------------------------------------------------------------

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

interface AiResult {
  answer: string
  relevantIds: string[]
}

// --- Style Maps --------------------------------------------------------------

const CATEGORY_STYLES: Record<string, { bg: string; text: string; dot: string }> = {
  'SEO':            { bg: 'bg-indigo-500/20',  text: 'text-indigo-300',  dot: 'bg-indigo-400' },
  'Feature':        { bg: 'bg-emerald-500/20', text: 'text-emerald-300', dot: 'bg-emerald-400' },
  'Infrastructure': { bg: 'bg-orange-500/20',  text: 'text-orange-300',  dot: 'bg-orange-400' },
  'Bug Fix':        { bg: 'bg-rose-500/20',    text: 'text-rose-300',    dot: 'bg-rose-400' },
  'Design':         { bg: 'bg-purple-500/20',  text: 'text-purple-300',  dot: 'bg-purple-400' },
  'Content':        { bg: 'bg-amber-500/20',   text: 'text-amber-300',   dot: 'bg-amber-400' },
  'Performance':    { bg: 'bg-cyan-500/20',    text: 'text-cyan-300',    dot: 'bg-cyan-400' },
  'Integration':    { bg: 'bg-blue-500/20',    text: 'text-blue-300',    dot: 'bg-blue-400' },
}
const CATEGORY_DEFAULT = { bg: 'bg-white/10', text: 'text-gray-300', dot: 'bg-gray-400' }

const IMPACT = {
  high:   { dot: 'bg-red-400',   label: 'High',   text: 'text-red-400',   border: 'border-red-500/40' },
  medium: { dot: 'bg-amber-400', label: 'Medium', text: 'text-amber-400', border: 'border-amber-500/40' },
  low:    { dot: 'bg-green-400', label: 'Low',    text: 'text-green-400', border: 'border-green-500/40' },
}

// --- Helpers -----------------------------------------------------------------

function formatDisplayDate(dateStr: string) {
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
  })
}

function formatLastUpdated(iso: string) {
  try {
    return new Date(iso).toLocaleDateString('en-US', {
      month: 'long', day: 'numeric', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    })
  } catch { return iso }
}

function textMatch(event: LogEvent, term: string): boolean {
  const t = term.toLowerCase()
  return (
    event.title.toLowerCase().includes(t) ||
    event.description.toLowerCase().includes(t) ||
    event.category.toLowerCase().includes(t) ||
    event.author.toLowerCase().includes(t) ||
    event.date.includes(t)
  )
}

function groupByDate(events: LogEvent[]): { date: string; events: LogEvent[] }[] {
  const map = new Map<string, LogEvent[]>()
  for (const e of events) {
    if (!map.has(e.date)) map.set(e.date, [])
    map.get(e.date)!.push(e)
  }
  return Array.from(map.entries()).map(([date, events]) => ({ date, events }))
}

// --- Sub-components ----------------------------------------------------------

function StatCard({ value, label, sub }: { value: string | number; label: string; sub?: string }) {
  return (
    <div className="bg-white/5 rounded-2xl p-5 border border-white/10 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-cyan-500/10 transition-all">
      <div className="text-xs text-gray-400 uppercase tracking-wider mb-1">{label}</div>
      <div className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-green-400 bg-clip-text text-transparent">
        {value}
      </div>
      {sub && <div className="text-xs text-gray-500 mt-1">{sub}</div>}
    </div>
  )
}

function FilterChip({
  label, active, dot, onClick,
}: {
  label: string; active: boolean; dot?: string; onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${
        active
          ? 'bg-cyan-500/30 text-cyan-200 border-cyan-500/60'
          : 'bg-white/5 text-gray-400 border-white/10 hover:border-white/30 hover:text-white'
      }`}
    >
      {dot && <span className={`w-2 h-2 rounded-full flex-shrink-0 ${active ? 'bg-cyan-300' : dot}`} />}
      {label}
    </button>
  )
}

// --- Page --------------------------------------------------------------------

export default function WebsiteLogPage() {
  const [data, setData] = useState<ChangelogData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Filters
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const [activeImpact, setActiveImpact] = useState<string | null>(null)

  // Search
  const [searchText, setSearchText] = useState('')
  const [aiResult, setAiResult] = useState<AiResult | null>(null)
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

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

  // Clear AI result when user types (switch back to text search)
  const handleSearchChange = (val: string) => {
    setSearchText(val)
    if (aiResult) setAiResult(null)
    if (aiError) setAiError(null)
  }

  // AI smart search
  const runSmartSearch = async () => {
    if (!data || !searchText.trim()) return
    setAiLoading(true)
    setAiError(null)
    setAiResult(null)
    try {
      const res = await fetch('/api/website-log-search', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ query: searchText, events: data.events }),
      })
      const json = await res.json()
      if (json.error) throw new Error(json.error)
      setAiResult(json)
    } catch (e: unknown) {
      setAiError(e instanceof Error ? e.message : 'Smart search failed')
    } finally {
      setAiLoading(false)
    }
  }

  const clearSearch = () => {
    setSearchText('')
    setAiResult(null)
    setAiError(null)
    inputRef.current?.focus()
  }

  // Filter logic
  const filtered = useMemo(() => {
    if (!data) return []

    let pool: LogEvent[]

    if (aiResult) {
      // AI mode: sort by AI relevance order, then apply category/impact filters
      const idOrder = new Map(aiResult.relevantIds.map((id, i) => [id, i]))
      pool = data.events
        .filter(e => idOrder.has(e.id))
        .sort((a, b) => (idOrder.get(a.id) ?? 99) - (idOrder.get(b.id) ?? 99))
    } else if (searchText.trim()) {
      // Text search mode
      pool = data.events.filter(e => textMatch(e, searchText))
    } else {
      pool = data.events
    }

    // Apply category + impact filters on top
    return pool.filter(e => {
      if (activeCategory && e.category !== activeCategory) return false
      if (activeImpact && e.impact !== activeImpact) return false
      return true
    })
  }, [data, searchText, aiResult, activeCategory, activeImpact])

  // For AI mode, don't group by date - show in relevance order as a flat list
  const grouped = useMemo(
    () => aiResult ? null : groupByDate(filtered),
    [filtered, aiResult],
  )

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#1a1a2e] to-[#16213e] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-400 text-sm">Loading development log...</p>
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#1a1a2e] to-[#16213e] flex items-center justify-center">
        <div className="bg-white/5 rounded-2xl border border-red-500/30 p-10 text-center max-w-md">
          <h2 className="text-lg font-semibold text-white mb-2">Could not load log</h2>
          <p className="text-sm text-red-400">{error}</p>
        </div>
      </div>
    )
  }

  const impactCounts = {
    high:   data.events.filter(e => e.impact === 'high').length,
    medium: data.events.filter(e => e.impact === 'medium').length,
    low:    data.events.filter(e => e.impact === 'low').length,
  }

  const isSearchActive = searchText.trim().length > 0

  // Shared event card renderer
  const EventCard = ({ event }: { event: LogEvent }) => {
    const catStyle = CATEGORY_STYLES[event.category] ?? CATEGORY_DEFAULT
    const impact = IMPACT[event.impact] ?? IMPACT.medium
    return (
      <div className={`bg-white/5 rounded-2xl border ${impact.border} p-6 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-cyan-500/10 transition-all`}>
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-3">
          <h3 className="text-base font-semibold text-white leading-snug flex-1 pr-2">
            {event.title}
          </h3>
          <div className="flex flex-wrap items-center gap-2 flex-shrink-0">
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-white/5 border border-white/10 ${impact.text}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${impact.dot}`} />
              {impact.label} Impact
            </span>
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${catStyle.bg} ${catStyle.text}`}>
              {event.category}
            </span>
          </div>
        </div>
        <p className="text-sm text-gray-400 leading-relaxed mb-4">{event.description}</p>
        <div className="flex flex-wrap items-center justify-between gap-2 pt-4 border-t border-white/10">
          <div className="flex items-center gap-3 text-xs text-gray-600">
            <span>{event.date} {event.time} {event.timezone}</span>
            <span>|</span>
            <span>{event.author}</span>
          </div>
          {event.links && event.links.length > 0 && (
            <div className="flex gap-3">
              {event.links.map(link => (
                <a key={link.url} href={link.url} target="_blank" rel="noopener noreferrer"
                  className="text-xs text-cyan-400 hover:text-cyan-300 font-medium transition-colors">
                  {link.label} -&gt;
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a1a2e] to-[#16213e] text-white">
      <div className="max-w-5xl mx-auto p-6">

        {/* Header */}
        <header className="text-center py-8 border-b border-white/10 mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-400 to-green-400 bg-clip-text text-transparent mb-2">
            Website Development Log
          </h1>
          <p className="text-gray-400 text-sm">{data.project} - {data.description}</p>
          <p className="text-gray-600 text-xs mt-1">Last updated {formatLastUpdated(data.lastUpdated)}</p>
        </header>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <StatCard value={data.events.length} label="Total Events" />
          <StatCard value={impactCounts.high}   label="High Impact"   sub="Major milestones" />
          <StatCard value={impactCounts.medium} label="Medium Impact" sub="Notable improvements" />
          <StatCard value={impactCounts.low}    label="Low Impact"    sub="Minor updates" />
        </div>

        {/* Search + Filters panel */}
        <div className="bg-white/5 rounded-2xl border border-white/10 p-5 mb-8 space-y-4">

          {/* Search bar */}
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <input
                ref={inputRef}
                type="text"
                value={searchText}
                onChange={e => handleSearchChange(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && runSmartSearch()}
                placeholder="Search events... (press Enter or click Smart Search for AI)"
                className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/60 transition-colors"
              />
              {isSearchActive && (
                <button
                  onClick={clearSearch}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 text-lg leading-none"
                >
                  x
                </button>
              )}
            </div>
            <button
              onClick={runSmartSearch}
              disabled={!isSearchActive || aiLoading}
              className="px-4 py-2.5 rounded-xl text-sm font-semibold border transition-all disabled:opacity-40 disabled:cursor-not-allowed bg-cyan-500/20 border-cyan-500/40 text-cyan-300 hover:bg-cyan-500/30"
            >
              {aiLoading ? 'Thinking...' : 'Smart Search'}
            </button>
          </div>

          {/* AI answer panel */}
          {aiResult && (
            <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-xl p-4">
              <div className="text-xs font-semibold text-cyan-400 uppercase tracking-wider mb-1">
                AI Answer
              </div>
              <p className="text-sm text-gray-200 leading-relaxed">{aiResult.answer}</p>
              <p className="text-xs text-gray-500 mt-2">
                Showing {filtered.length} relevant event{filtered.length !== 1 ? 's' : ''} - sorted by relevance
              </p>
            </div>
          )}

          {aiError && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-sm text-red-400">
              Smart search error: {aiError}
            </div>
          )}

          {/* Category + Impact filters */}
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-widest mr-1">Category</span>
            <FilterChip label="All" active={!activeCategory} onClick={() => setActiveCategory(null)} />
            {categories.map(cat => {
              const style = CATEGORY_STYLES[cat] ?? CATEGORY_DEFAULT
              return (
                <FilterChip key={cat} label={cat} active={activeCategory === cat}
                  dot={style.dot} onClick={() => setActiveCategory(activeCategory === cat ? null : cat)} />
              )
            })}
          </div>
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-widest mr-1">Impact</span>
            <FilterChip label="All" active={!activeImpact} onClick={() => setActiveImpact(null)} />
            {(['high', 'medium', 'low'] as const).map(impact => (
              <FilterChip key={impact} label={IMPACT[impact].label} active={activeImpact === impact}
                dot={IMPACT[impact].dot} onClick={() => setActiveImpact(activeImpact === impact ? null : impact)} />
            ))}
            {(activeCategory || activeImpact || isSearchActive) && (
              <button onClick={() => { setActiveCategory(null); setActiveImpact(null); clearSearch() }}
                className="ml-2 text-xs text-gray-500 hover:text-gray-300 underline underline-offset-2 transition-colors">
                Clear all
              </button>
            )}
          </div>

          <p className="text-xs text-gray-600">
            Showing <span className="text-gray-400 font-semibold">{filtered.length}</span> of {data.events.length} events
            {aiResult ? ' - AI relevance order' : isSearchActive ? ' - text match' : ''}
          </p>
        </div>

        {/* Timeline / Results */}
        {filtered.length === 0 ? (
          <div className="text-center text-gray-500 py-20 text-sm">
            {isSearchActive ? 'No events match your search.' : 'No events match the selected filters.'}
          </div>
        ) : aiResult ? (
          // AI mode: flat list in relevance order (no date grouping)
          <div className="space-y-4">
            {filtered.map(event => <EventCard key={event.id} event={event} />)}
          </div>
        ) : (
          // Normal mode: grouped by date
          <div className="space-y-10">
            {grouped!.map(({ date, events }) => (
              <div key={date}>
                <div className="flex items-center gap-4 mb-5">
                  <div className="h-px flex-1 bg-white/10" />
                  <span className="text-xs font-semibold text-cyan-400/70 uppercase tracking-widest whitespace-nowrap">
                    {formatDisplayDate(date)}
                  </span>
                  <div className="h-px flex-1 bg-white/10" />
                </div>
                <div className="space-y-4">
                  {events.map(event => <EventCard key={event.id} event={event} />)}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Footer */}
        <footer className="text-center text-gray-600 text-xs mt-16 pb-8">
          Source: RealWorldTraining/qbtraining-site - website-changelog.json - Updates within 5 minutes
        </footer>

      </div>
    </div>
  )
}
