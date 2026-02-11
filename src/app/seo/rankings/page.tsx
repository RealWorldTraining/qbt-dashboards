'use client'

import { useState, useEffect } from 'react'
import { DashboardNav } from '@/components/DashboardNav'
import { ArrowUp, ArrowDown, Minus, TrendingUp, Trophy, Hash, Eye } from 'lucide-react'

interface KeywordRanking {
  keyword: string
  position: number
  position_change: number
  search_volume: number
  cpc: string
  estimated_visits: number
  click_share: number
  traffic_cost: string
  search_intent: string[]
  url: string
}

interface RankingSummary {
  visibility_percent: number
  visibility_change: number
  average_rank: number
  average_rank_change: number
  total_keywords: number
  top3: number
  top5: number
  top10: number
  first_place: number
  first_place_change: number
  click_share: number
  click_share_change: number
  estimated_visits: number
  estimated_visits_change: number
  traffic_cost: string
}

interface RankingsData {
  snapshot_date: string
  previous_date: string
  search_engine: string
  website: string
  summary: RankingSummary
  keywords: KeywordRanking[]
}

type SortField = 'keyword' | 'position' | 'position_change' | 'search_volume' | 'cpc' | 'estimated_visits' | 'traffic_cost'

function parseCurrency(val: string): number {
  return parseFloat(val.replace(/[$,]/g, '')) || 0
}

export default function RankTrackerPage() {
  const [data, setData] = useState<RankingsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sortField, setSortField] = useState<SortField>('estimated_visits')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')

  useEffect(() => {
    fetch('/api/awr/rankings')
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch rankings')
        return res.json()
      })
      .then(setData)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDir(field === 'keyword' ? 'asc' : 'desc')
    }
  }

  const sortedKeywords = data?.keywords.slice().sort((a, b) => {
    let aVal: number | string, bVal: number | string
    switch (sortField) {
      case 'keyword': aVal = a.keyword; bVal = b.keyword; break
      case 'position': aVal = a.position; bVal = b.position; break
      case 'position_change': aVal = a.position_change; bVal = b.position_change; break
      case 'search_volume': aVal = a.search_volume; bVal = b.search_volume; break
      case 'cpc': aVal = parseCurrency(a.cpc); bVal = parseCurrency(b.cpc); break
      case 'estimated_visits': aVal = a.estimated_visits; bVal = b.estimated_visits; break
      case 'traffic_cost': aVal = parseCurrency(a.traffic_cost); bVal = parseCurrency(b.traffic_cost); break
      default: return 0
    }
    if (typeof aVal === 'string' && typeof bVal === 'string') {
      return sortDir === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal)
    }
    return sortDir === 'asc' ? (aVal as number) - (bVal as number) : (bVal as number) - (aVal as number)
  }) || []

  const SortHeader = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
    <th
      onClick={() => handleSort(field)}
      className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider cursor-pointer hover:text-cyan-400 transition-colors select-none"
    >
      <div className="flex items-center gap-1">
        {children}
        {sortField === field && (
          <span className="text-cyan-400">{sortDir === 'asc' ? '↑' : '↓'}</span>
        )}
      </div>
    </th>
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 text-white">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <DashboardNav theme="dark" />
          <div className="text-center py-20">
            <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-gray-700 border-t-cyan-400" />
            <p className="mt-4 text-gray-400">Loading rank data...</p>
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

  const { summary } = data

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <DashboardNav theme="dark" />

        <div className="mb-6 mt-2">
          <h1 className="text-2xl font-bold">Rank Tracker</h1>
          <p className="text-gray-400 text-sm mt-1">
            {data.search_engine} &bull; {data.snapshot_date} vs {data.previous_date}
          </p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <div className="flex items-center gap-2 text-gray-400 text-xs font-medium mb-1">
              <Eye className="h-3.5 w-3.5" /> VISIBILITY
            </div>
            <div className="text-2xl font-bold">{summary.visibility_percent}%</div>
            <div className={`text-xs mt-1 ${summary.visibility_change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {summary.visibility_change >= 0 ? '+' : ''}{summary.visibility_change}% vs prev
            </div>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <div className="flex items-center gap-2 text-gray-400 text-xs font-medium mb-1">
              <Hash className="h-3.5 w-3.5" /> AVG RANK
            </div>
            <div className="text-2xl font-bold">{summary.average_rank}</div>
            <div className={`text-xs mt-1 ${summary.average_rank_change <= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {summary.average_rank_change > 0 ? '+' : ''}{summary.average_rank_change} positions
            </div>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <div className="flex items-center gap-2 text-gray-400 text-xs font-medium mb-1">
              <TrendingUp className="h-3.5 w-3.5" /> TOP 3
            </div>
            <div className="text-2xl font-bold">{summary.top3}<span className="text-base text-gray-500">/{summary.total_keywords}</span></div>
            <div className="text-xs mt-1 text-gray-500">
              {((summary.top3 / summary.total_keywords) * 100).toFixed(0)}% of keywords
            </div>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <div className="flex items-center gap-2 text-gray-400 text-xs font-medium mb-1">
              <Trophy className="h-3.5 w-3.5" /> FIRST PLACE
            </div>
            <div className="text-2xl font-bold">{summary.first_place}</div>
            <div className={`text-xs mt-1 ${summary.first_place_change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {summary.first_place_change >= 0 ? '+' : ''}{summary.first_place_change} vs prev
            </div>
          </div>
        </div>

        {/* Rankings Table */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-800/50">
                <tr>
                  <SortHeader field="keyword">Keyword</SortHeader>
                  <SortHeader field="position">Position</SortHeader>
                  <SortHeader field="position_change">Change</SortHeader>
                  <SortHeader field="search_volume">Volume</SortHeader>
                  <SortHeader field="cpc">CPC</SortHeader>
                  <SortHeader field="estimated_visits">Est. Visits</SortHeader>
                  <SortHeader field="traffic_cost">Traffic Cost</SortHeader>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {sortedKeywords.map((kw) => (
                  <tr key={kw.keyword} className="hover:bg-gray-800/30 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-medium text-sm">{kw.keyword}</div>
                      <div className="text-xs text-gray-500 mt-0.5">
                        {kw.search_intent.join(' · ')}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${
                        kw.position === 1 ? 'bg-yellow-500/20 text-yellow-400' :
                        kw.position <= 3 ? 'bg-green-500/20 text-green-400' :
                        kw.position <= 10 ? 'bg-blue-500/20 text-blue-400' :
                        'bg-gray-700 text-gray-300'
                      }`}>
                        {kw.position}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {kw.position_change > 0 ? (
                        <span className="flex items-center gap-1 text-green-400 text-sm">
                          <ArrowUp className="h-3.5 w-3.5" />+{kw.position_change}
                        </span>
                      ) : kw.position_change < 0 ? (
                        <span className="flex items-center gap-1 text-red-400 text-sm">
                          <ArrowDown className="h-3.5 w-3.5" />{kw.position_change}
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-gray-500 text-sm">
                          <Minus className="h-3.5 w-3.5" />0
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-300">
                      {kw.search_volume.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-300">{kw.cpc}</td>
                    <td className="px-4 py-3 text-sm font-medium">
                      {kw.estimated_visits.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </td>
                    <td className="px-4 py-3 text-sm text-emerald-400">{kw.traffic_cost}</td>
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
