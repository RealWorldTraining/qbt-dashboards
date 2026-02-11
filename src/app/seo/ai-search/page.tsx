'use client'

import { useState, useEffect } from 'react'
import { DashboardNav } from '@/components/DashboardNav'
import { AlertTriangle, TrendingUp, TrendingDown, Bot, Monitor, Smartphone, Search } from 'lucide-react'

interface SearchEngineData {
  name: string
  short_name: string
  visibility_percent: number
  visibility_change: number
  average_rank: number
  avg_rank_change: number
  click_share: number
  click_share_change: number
  estimated_visits: number
  visits_change: number
  first_place: number
  first_place_change: number
  top3: number
  top3_change: number
  ranked: number
  ranked_change: number
  traffic_cost: string
  type: string
}

interface KeywordGroup {
  group: string
  visibility_percent: number
  visibility_change: number
  average_rank: number
  click_share: number
  keywords: number
  first_place: number
  top3: number
}

interface VisibilityData {
  snapshot_date: string
  previous_date: string
  search_engines: SearchEngineData[]
  keyword_groups: KeywordGroup[]
}

export default function AISearchPage() {
  const [data, setData] = useState<VisibilityData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/awr/visibility')
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch visibility data')
        return res.json()
      })
      .then(setData)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 text-white">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <DashboardNav theme="dark" />
          <div className="text-center py-20">
            <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-gray-700 border-t-cyan-400" />
            <p className="mt-4 text-gray-400">Loading AI search data...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gray-950 text-white">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <DashboardNav theme="dark" />
          <div className="text-center py-20">
            <p className="text-red-400 text-lg font-bold">Error: {error || 'Unknown error'}</p>
          </div>
        </div>
      </div>
    )
  }

  const chatgpt = data.search_engines.find(e => e.short_name === 'ChatGPT')
  const aioDesktop = data.search_engines.find(e => e.short_name === 'AIO Desktop')
  const aioMobile = data.search_engines.find(e => e.short_name === 'AIO Mobile')

  const getIcon = (name: string) => {
    if (name === 'ChatGPT') return <Bot className="h-4 w-4" />
    if (name.includes('Mobile')) return <Smartphone className="h-4 w-4" />
    if (name.includes('Desktop')) return <Monitor className="h-4 w-4" />
    return <Search className="h-4 w-4" />
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <DashboardNav theme="dark" />

        <div className="mb-6 mt-2">
          <h1 className="text-2xl font-bold">AI Search Monitor</h1>
          <p className="text-gray-400 text-sm mt-1">
            AI Overviews &amp; ChatGPT performance &bull; {data.snapshot_date} vs {data.previous_date}
          </p>
        </div>

        {/* ChatGPT Alert */}
        {chatgpt && chatgpt.visibility_change < -5 && (
          <div className="mb-6 bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-red-400 mt-0.5 flex-shrink-0" />
            <div>
              <div className="font-semibold text-red-400">ChatGPT Visibility Drop</div>
              <p className="text-sm text-gray-300 mt-1">
                ChatGPT visibility dropped <span className="font-bold text-red-400">{chatgpt.visibility_change}%</span> this week.
                Ranked keywords fell from 80 to {chatgpt.ranked}, with {Math.abs(chatgpt.visits_change).toLocaleString(undefined, { maximumFractionDigits: 0 })} estimated visits lost.
              </p>
            </div>
          </div>
        )}

        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <div className="flex items-center gap-2 text-gray-400 text-xs font-medium mb-1">
              <Bot className="h-3.5 w-3.5" /> CHATGPT
            </div>
            <div className="text-2xl font-bold">{chatgpt?.visibility_percent ?? '—'}%</div>
            <div className={`text-xs mt-1 ${(chatgpt?.visibility_change ?? 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {(chatgpt?.visibility_change ?? 0) >= 0 ? '+' : ''}{chatgpt?.visibility_change ?? 0}% vs prev
            </div>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <div className="flex items-center gap-2 text-gray-400 text-xs font-medium mb-1">
              <Monitor className="h-3.5 w-3.5" /> AIO DESKTOP
            </div>
            <div className="text-2xl font-bold">{aioDesktop?.visibility_percent ?? '—'}%</div>
            <div className={`text-xs mt-1 ${(aioDesktop?.visibility_change ?? 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {(aioDesktop?.visibility_change ?? 0) >= 0 ? '+' : ''}{aioDesktop?.visibility_change ?? 0}% vs prev
            </div>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <div className="flex items-center gap-2 text-gray-400 text-xs font-medium mb-1">
              <Smartphone className="h-3.5 w-3.5" /> AIO MOBILE
            </div>
            <div className="text-2xl font-bold">{aioMobile?.visibility_percent ?? '—'}%</div>
            <div className={`text-xs mt-1 ${(aioMobile?.visibility_change ?? 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {(aioMobile?.visibility_change ?? 0) >= 0 ? '+' : ''}{aioMobile?.visibility_change ?? 0}% vs prev
            </div>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <div className="flex items-center gap-2 text-gray-400 text-xs font-medium mb-1">
              <Bot className="h-3.5 w-3.5" /> CHATGPT RANKED
            </div>
            <div className="text-2xl font-bold">{chatgpt?.ranked ?? '—'}<span className="text-base text-gray-500">/174</span></div>
            <div className={`text-xs mt-1 ${(chatgpt?.ranked_change ?? 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {(chatgpt?.ranked_change ?? 0) >= 0 ? '+' : ''}{chatgpt?.ranked_change ?? 0} vs prev
            </div>
          </div>
        </div>

        {/* Search Engine Comparison Table */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden mb-6">
          <div className="px-4 py-3 border-b border-gray-800">
            <h2 className="font-semibold">Search Engine Comparison</h2>
            <p className="text-xs text-gray-500 mt-0.5">All 6 tracked engines — organic, AI overviews, and ChatGPT</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-800/50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Engine</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Visibility</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Avg Rank</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Click Share</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Est. Visits</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">1st Place</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Top 3</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Ranked</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {data.search_engines.map(engine => (
                  <tr key={engine.name} className={`hover:bg-gray-800/30 transition-colors ${
                    engine.short_name === 'ChatGPT' && engine.visibility_change < -5 ? 'bg-red-500/5' : ''
                  }`}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {getIcon(engine.short_name)}
                        <div>
                          <div className="font-medium text-sm">{engine.short_name}</div>
                          <div className="text-xs text-gray-500">
                            {engine.type === 'ai' ? 'AI Search' : 'Organic'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm font-medium">{engine.visibility_percent}%</div>
                      <div className={`text-xs ${engine.visibility_change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {engine.visibility_change >= 0 ? '+' : ''}{engine.visibility_change}%
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm">{engine.average_rank}</div>
                      <div className={`text-xs flex items-center gap-0.5 ${engine.avg_rank_change <= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {engine.avg_rank_change <= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                        {Math.abs(engine.avg_rank_change)}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm">{engine.click_share}%</div>
                      <div className={`text-xs ${engine.click_share_change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {engine.click_share_change >= 0 ? '+' : ''}{engine.click_share_change}%
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {engine.estimated_visits.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm">{engine.first_place}</div>
                      <div className={`text-xs ${engine.first_place_change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {engine.first_place_change >= 0 ? '+' : ''}{engine.first_place_change}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm">{engine.top3}</div>
                      <div className={`text-xs ${engine.top3_change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {engine.top3_change >= 0 ? '+' : ''}{engine.top3_change}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm">{engine.ranked}<span className="text-gray-500">/174</span></div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Keyword Groups Visibility */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-800">
            <h2 className="font-semibold">Visibility by Keyword Group</h2>
            <p className="text-xs text-gray-500 mt-0.5">Google Desktop Organic — all 11 keyword groups</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-800/50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Group</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Visibility</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Avg Rank</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Click Share</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Keywords</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">1st Place</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Top 3</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {data.keyword_groups.map(group => (
                  <tr key={group.group} className="hover:bg-gray-800/30 transition-colors">
                    <td className="px-4 py-3 font-medium text-sm">{group.group}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-20 bg-gray-800 rounded-full h-2">
                          <div
                            className="bg-cyan-400 h-2 rounded-full"
                            style={{ width: `${group.visibility_percent}%` }}
                          />
                        </div>
                        <span className="text-sm">{group.visibility_percent}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm">{group.average_rank}</td>
                    <td className="px-4 py-3 text-sm">{group.click_share}%</td>
                    <td className="px-4 py-3 text-sm text-gray-400">{group.keywords}</td>
                    <td className="px-4 py-3 text-sm">{group.first_place}</td>
                    <td className="px-4 py-3 text-sm">{group.top3}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-4 text-xs text-gray-500 text-center">
          Data source: Advanced Web Ranking &bull; Updated {data.snapshot_date}
        </div>
      </div>
    </div>
  )
}
