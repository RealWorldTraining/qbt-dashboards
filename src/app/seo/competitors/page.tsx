'use client'

import { useState, useEffect } from 'react'
import { DashboardNav } from '@/components/DashboardNav'
import { Crown, Target, TrendingUp, TrendingDown, ExternalLink } from 'lucide-react'

interface DomainMetrics {
  visibility_percent: number
  visibility_change: number
  average_rank: number
  avg_rank_change: number
  click_share: number
  click_share_change: number
  first_place: number
  first_place_change: number
  top3: number
  top3_change: number
  top5: number
  top10: number
  ranked: number
  not_ranked: number
  estimated_visits: number
  visits_change: number
  traffic_cost: string
}

interface DomainDistribution {
  total_keywords: number
  first_place: number
  pos_2_5: number
  pos_6_10: number
  pos_11_20: number
  pos_21_50: number
  not_ranked: number
}

interface IntuitUrl {
  url: string
  ranked_keywords: number
  first_place: number
  pos_2_5: number
  pos_6_10: number
}

interface CompetitorData {
  snapshot_date: string
  previous_date: string
  search_engine: string
  comparison: Record<string, DomainMetrics>
  domain_distribution: Record<string, DomainDistribution>
  intuit_top_urls: IntuitUrl[]
}

export default function CompetitorIntelPage() {
  const [data, setData] = useState<CompetitorData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/awr/competitors')
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch competitor data')
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
            <p className="mt-4 text-gray-400">Loading competitor data...</p>
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

  const qbt = data.comparison['quickbookstraining.com']
  const intuit = data.comparison['intuit.com']
  const qbtDist = data.domain_distribution['quickbookstraining.com']
  const intuitDist = data.domain_distribution['intuit.com']

  const MetricCard = ({ label, qbtVal, intuitVal, qbtChange, intuitChange, lowerBetter = false }: {
    label: string
    qbtVal: string | number
    intuitVal: string | number
    qbtChange?: number
    intuitChange?: number
    lowerBetter?: boolean
  }) => {
    const qbtNum = typeof qbtVal === 'number' ? qbtVal : parseFloat(qbtVal)
    const intuitNum = typeof intuitVal === 'number' ? intuitVal : parseFloat(intuitVal)
    const qbtWins = lowerBetter ? qbtNum < intuitNum : qbtNum > intuitNum

    return (
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
        <div className="text-xs font-medium text-gray-400 uppercase mb-3">{label}</div>
        <div className="grid grid-cols-2 gap-4">
          <div className={`${qbtWins ? 'text-cyan-400' : 'text-gray-300'}`}>
            <div className="text-xs text-gray-500 mb-1 flex items-center gap-1">
              {qbtWins && <Crown className="h-3 w-3 text-yellow-400" />}
              QBT
            </div>
            <div className="text-xl font-bold">{typeof qbtVal === 'number' ? qbtVal.toLocaleString() : qbtVal}</div>
            {qbtChange !== undefined && (
              <div className={`text-xs mt-1 ${
                lowerBetter
                  ? qbtChange <= 0 ? 'text-green-400' : 'text-red-400'
                  : qbtChange >= 0 ? 'text-green-400' : 'text-red-400'
              }`}>
                {qbtChange >= 0 ? '+' : ''}{qbtChange}
              </div>
            )}
          </div>
          <div className={`${!qbtWins ? 'text-purple-400' : 'text-gray-300'}`}>
            <div className="text-xs text-gray-500 mb-1 flex items-center gap-1">
              {!qbtWins && <Crown className="h-3 w-3 text-yellow-400" />}
              Intuit
            </div>
            <div className="text-xl font-bold">{typeof intuitVal === 'number' ? intuitVal.toLocaleString() : intuitVal}</div>
            {intuitChange !== undefined && (
              <div className={`text-xs mt-1 ${
                lowerBetter
                  ? intuitChange <= 0 ? 'text-green-400' : 'text-red-400'
                  : intuitChange >= 0 ? 'text-green-400' : 'text-red-400'
              }`}>
                {intuitChange >= 0 ? '+' : ''}{intuitChange}
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  const distSegments = [
    { label: '1st', key: 'first_place' as const, color: 'bg-yellow-400' },
    { label: '2-5', key: 'pos_2_5' as const, color: 'bg-green-400' },
    { label: '6-10', key: 'pos_6_10' as const, color: 'bg-blue-400' },
    { label: '11-20', key: 'pos_11_20' as const, color: 'bg-purple-400' },
    { label: '21-50', key: 'pos_21_50' as const, color: 'bg-orange-400' },
    { label: 'N/R', key: 'not_ranked' as const, color: 'bg-gray-600' },
  ]

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <DashboardNav theme="dark" />

        <div className="mb-6 mt-2">
          <h1 className="text-2xl font-bold">Competitor Intel</h1>
          <p className="text-gray-400 text-sm mt-1">
            quickbookstraining.com vs intuit.com &bull; {data.search_engine} &bull; {data.snapshot_date}
          </p>
        </div>

        {/* Side-by-side KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          <MetricCard
            label="Visibility %"
            qbtVal={qbt.visibility_percent}
            intuitVal={intuit.visibility_percent}
            qbtChange={qbt.visibility_change}
            intuitChange={intuit.visibility_change}
          />
          <MetricCard
            label="Avg Rank"
            qbtVal={qbt.average_rank}
            intuitVal={intuit.average_rank}
            qbtChange={qbt.avg_rank_change}
            intuitChange={intuit.avg_rank_change}
            lowerBetter
          />
          <MetricCard
            label="First Place"
            qbtVal={qbt.first_place}
            intuitVal={intuit.first_place}
            qbtChange={qbt.first_place_change}
            intuitChange={intuit.first_place_change}
          />
          <MetricCard
            label="Top 3"
            qbtVal={qbt.top3}
            intuitVal={intuit.top3}
            qbtChange={qbt.top3_change}
            intuitChange={intuit.top3_change}
          />
          <MetricCard
            label="Click Share %"
            qbtVal={qbt.click_share}
            intuitVal={intuit.click_share}
            qbtChange={qbt.click_share_change}
            intuitChange={intuit.click_share_change}
          />
          <MetricCard
            label="Est. Visits"
            qbtVal={Math.round(qbt.estimated_visits)}
            intuitVal={Math.round(intuit.estimated_visits)}
            qbtChange={Math.round(qbt.visits_change)}
            intuitChange={Math.round(intuit.visits_change)}
          />
        </div>

        {/* Domain Distribution */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 mb-6">
          <h2 className="font-semibold mb-4">Ranking Distribution</h2>
          <div className="space-y-4">
            {[
              { name: 'QBT', dist: qbtDist, color: 'cyan' },
              { name: 'Intuit', dist: intuitDist, color: 'purple' },
            ].map(({ name, dist }) => (
              <div key={name}>
                <div className="text-sm font-medium text-gray-300 mb-2">{name}</div>
                <div className="flex rounded-lg overflow-hidden h-8">
                  {distSegments.map(seg => {
                    const val = dist[seg.key]
                    const pct = (val / 174) * 100
                    if (pct === 0) return null
                    return (
                      <div
                        key={seg.key}
                        className={`${seg.color} flex items-center justify-center text-xs font-bold text-gray-900 transition-all`}
                        style={{ width: `${pct}%` }}
                        title={`${seg.label}: ${val}`}
                      >
                        {val > 0 && pct > 5 ? val : ''}
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
            <div className="flex gap-4 flex-wrap mt-2">
              {distSegments.map(seg => (
                <div key={seg.key} className="flex items-center gap-1.5 text-xs text-gray-400">
                  <div className={`w-3 h-3 rounded ${seg.color}`} />
                  {seg.label}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Intuit Top URLs */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-800">
            <h2 className="font-semibold">Intuit&apos;s Top Ranking URLs</h2>
            <p className="text-xs text-gray-500 mt-0.5">Pages competing for your keyword set</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-800/50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">URL</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Ranked</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">1st Place</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Pos 2-5</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Pos 6-10</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {data.intuit_top_urls.map(url => (
                  <tr key={url.url} className="hover:bg-gray-800/30 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <ExternalLink className="h-3 w-3 text-gray-500 flex-shrink-0" />
                        <span className="text-sm text-gray-300 truncate max-w-[400px]">{url.url}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm">{url.ranked_keywords}</td>
                    <td className="px-4 py-3">
                      <span className={`text-sm font-medium ${url.first_place > 0 ? 'text-yellow-400' : 'text-gray-500'}`}>
                        {url.first_place}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">{url.pos_2_5}</td>
                    <td className="px-4 py-3 text-sm">{url.pos_6_10}</td>
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
