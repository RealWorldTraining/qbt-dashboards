"use client"

import React, { useState, useEffect } from "react"

interface AssetRow {
  assetText: string
  assetType: string
  fieldType: string
  performanceLabel: string
  campaign: string
  adGroup: string
  impressions: number
  clicks: number
  ctr: number
  conversions: number
  cost: number
}

interface AssetData {
  assets: AssetRow[]
  summary: {
    totalAssets: number
    byType: Record<string, number>
    byPerformanceLabel: Record<string, number>
  }
  lastUpdated: string
}

type SortKey = keyof Pick<AssetRow, 'impressions' | 'clicks' | 'ctr' | 'conversions' | 'cost'> | 'convRate'

const PERF_COLORS: Record<string, { bg: string; text: string }> = {
  BEST: { bg: 'bg-green-900', text: 'text-green-300' },
  GOOD: { bg: 'bg-blue-900', text: 'text-blue-300' },
  LOW: { bg: 'bg-red-900', text: 'text-red-300' },
  LEARNING: { bg: 'bg-amber-900', text: 'text-amber-300' },
  'N/A': { bg: 'bg-gray-800', text: 'text-gray-400' },
}

const PERF_CARD_COLORS: Record<string, string> = {
  BEST: 'text-green-500',
  GOOD: 'text-blue-500',
  LOW: 'text-red-500',
  LEARNING: 'text-amber-500',
}

const TYPE_FILTERS = ['All', 'HEADLINE', 'DESCRIPTION', 'SITELINK', 'CALLOUT', 'STRUCTURED SNIPPET'] as const

export function GadsAssetTab() {
  const [data, setData] = useState<AssetData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [typeFilter, setTypeFilter] = useState<string>('All')
  const [perfFilter, setPerfFilter] = useState<string | null>(null)
  const [sortKey, setSortKey] = useState<SortKey>('impressions')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')

  useEffect(() => {
    fetch('/api/gads-asset-performance')
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return res.json()
      })
      .then(d => {
        if (d.error) throw new Error(d.error)
        setData(d)
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="text-center py-16">
        <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-gray-300 border-t-amber-500"></div>
        <p className="mt-4 text-gray-400">Loading asset performance...</p>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="text-center py-16">
        <p className="text-red-500">Error loading asset data{error ? `: ${error}` : ''}</p>
      </div>
    )
  }

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(d => d === 'desc' ? 'asc' : 'desc')
    } else {
      setSortKey(key)
      setSortDir('desc')
    }
  }

  const sortArrow = (key: SortKey) => {
    if (sortKey !== key) return ''
    return sortDir === 'desc' ? ' \u25BC' : ' \u25B2'
  }

  const filtered = data.assets
    .filter(a => typeFilter === 'All' || a.fieldType === typeFilter)
    .filter(a => !perfFilter || a.performanceLabel === perfFilter)
    .sort((a, b) => {
      const mul = sortDir === 'desc' ? -1 : 1
      if (sortKey === 'convRate') {
        const aRate = a.clicks > 0 ? (a.conversions / a.clicks) : 0
        const bRate = b.clicks > 0 ? (b.conversions / b.clicks) : 0
        return (aRate - bRate) * mul
      }
      const aVal = a[sortKey as keyof AssetRow] as number
      const bVal = b[sortKey as keyof AssetRow] as number
      return (aVal - bVal) * mul
    })

  const { byPerformanceLabel } = data.summary

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-[#1D1D1F] text-xl font-bold">Asset Performance</h2>
        <span className="text-gray-500 text-sm">Last 30 days</span>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-5 gap-3 mb-5">
        <div
          onClick={() => setPerfFilter(null)}
          className={`bg-[#1a1a1a] rounded-lg p-4 cursor-pointer transition-all text-center ${!perfFilter ? 'ring-2 ring-amber-500' : 'hover:bg-gray-900'}`}
        >
          <div className="text-gray-400 text-xs uppercase tracking-wide mb-1">Total Assets</div>
          <div className="text-white text-4xl font-bold">{data.summary.totalAssets}</div>
        </div>
        {(['BEST', 'GOOD', 'LOW', 'LEARNING'] as const).map(label => (
          <div
            key={label}
            onClick={() => setPerfFilter(perfFilter === label ? null : label)}
            className={`bg-[#1a1a1a] rounded-lg p-4 cursor-pointer transition-all text-center ${perfFilter === label ? 'ring-2 ring-amber-500' : 'hover:bg-gray-900'}`}
          >
            <div className="text-gray-400 text-xs uppercase tracking-wide mb-1">{label}</div>
            <div className={`text-4xl font-bold ${PERF_CARD_COLORS[label]}`}>
              {byPerformanceLabel[label] || 0}
            </div>
          </div>
        ))}
      </div>

      {/* Filter Pills */}
      <div className="mb-3 flex items-center gap-3">
        <div className="flex gap-1.5">
          {TYPE_FILTERS.map(t => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={`px-3 py-1.5 rounded text-xs font-medium ${
                typeFilter === t
                  ? 'bg-amber-600 text-white'
                  : 'bg-[#1a1a1a] text-gray-400 hover:bg-gray-800'
              }`}
            >
              {t === 'All' ? 'All' : t.charAt(0) + t.slice(1).toLowerCase() + 's'}
            </button>
          ))}
        </div>
        <span className="text-gray-500 text-xs ml-auto">{filtered.length} assets</span>
      </div>

      {/* Table */}
      <div className="bg-[#1a1a1a] rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-black">
              <tr className="text-gray-400 text-xs uppercase">
                <th className="text-left p-2.5">Asset Text</th>
                <th className="text-left p-2.5">Type</th>
                <th className="text-center p-2.5">Performance</th>
                <th className="text-left p-2.5">Campaign</th>
                <th className="text-right p-2.5 cursor-pointer hover:text-white" onClick={() => handleSort('impressions')}>
                  Impr{sortArrow('impressions')}
                </th>
                <th className="text-right p-2.5 cursor-pointer hover:text-white" onClick={() => handleSort('clicks')}>
                  Clicks{sortArrow('clicks')}
                </th>
                <th className="text-right p-2.5 cursor-pointer hover:text-white" onClick={() => handleSort('ctr')}>
                  CTR{sortArrow('ctr')}
                </th>
                <th className="text-right p-2.5 cursor-pointer hover:text-white" onClick={() => handleSort('conversions')}>
                  Conv{sortArrow('conversions')}
                </th>
                <th className="text-right p-2.5 cursor-pointer hover:text-white" onClick={() => handleSort('convRate')}>
                  Conv %{sortArrow('convRate')}
                </th>
                <th className="text-right p-2.5 cursor-pointer hover:text-white" onClick={() => handleSort('cost')}>
                  Cost{sortArrow('cost')}
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((a, i) => {
                const perf = PERF_COLORS[a.performanceLabel] || PERF_COLORS['N/A']
                const convRate = a.clicks > 0 ? (a.conversions / a.clicks) * 100 : 0
                return (
                  <tr key={i} className="border-t border-gray-800 hover:bg-gray-700">
                    <td className="p-2.5 text-gray-300 max-w-xs truncate" title={a.assetText}>{a.assetText}</td>
                    <td className="p-2.5 text-gray-500 text-xs whitespace-nowrap">{a.fieldType}</td>
                    <td className="p-2.5 text-center">
                      {a.performanceLabel !== 'UNSPECIFIED' && (
                        <span className={`px-2 py-1 rounded text-xs font-medium ${perf.bg} ${perf.text}`}>
                          {a.performanceLabel}
                        </span>
                      )}
                    </td>
                    <td className="p-2.5 text-gray-500 text-xs">{a.campaign}</td>
                    <td className="p-2.5 text-right text-gray-400">{a.impressions.toLocaleString()}</td>
                    <td className="p-2.5 text-right text-gray-400">{a.clicks.toLocaleString()}</td>
                    <td className="p-2.5 text-right text-gray-400">{a.ctr.toFixed(1)}%</td>
                    <td className="p-2.5 text-right text-gray-400">{a.conversions.toFixed(1)}</td>
                    <td className="p-2.5 text-right text-gray-400">{convRate.toFixed(1)}%</td>
                    <td className="p-2.5 text-right text-gray-400">${Math.round(a.cost).toLocaleString()}</td>
                  </tr>
                )
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={10} className="p-8 text-center text-gray-500">No assets match the current filters</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}
