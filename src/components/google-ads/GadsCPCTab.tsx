"use client"

import React, { useState, useEffect } from "react"
import { ForcingFunctions } from "../ForcingFunctions"

interface CPCRecommendation {
  analysisDate: string
  campaign: string
  keyword: string
  device: string
  action: string
  impressions: number
  clicks: number
  cost: number
  conversions: number
  costPerConv: number
  currentMaxCPC: number
  suggestedMaxCPC: number
  changeAmount: number
  signals: string
  searchImprShare: number
  searchImprClass: string
  imprTopPct: number
  imprTopClass: string
  clickShare: number
  clickShareClass: string
  imprAbsTopPct: number
  imprAbsTopClass: string
  searchLostIsRank: number
  searchLostClass: string
  headroomPct: number
  headroomClass: string
  avgCPC: number
  trendSummary: string
  primarySignal: string
}

interface CPCData {
  recommendations: CPCRecommendation[]
  summary: {
    total: number
    actions: Record<string, number>
    totalBidIncrease: number
    totalBidDecrease: number
    lastUpdated: string
  }
}

const classColors: Record<string, string> = {
  BLUE: '#3B82F6',
  GREEN: '#10B981',
  YELLOW: '#F59E0B',
  RED: '#EF4444'
}

export function GadsCPCTab() {
  const [data, setData] = useState<CPCData | null>(null)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('ALL')
  const [search, setSearch] = useState('')
  const [minClicks, setMinClicks] = useState(10)

  useEffect(() => {
    fetch('/api/cpc-recommendations').then(res => res.json())
      .then(recommendations => {
        setData(recommendations)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="text-center py-16">
        <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-gray-300 border-t-green-600"></div>
        <p className="mt-4 text-gray-400">Loading CPC recommendations...</p>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="text-center py-16">
        <p className="text-red-500">Error loading data</p>
      </div>
    )
  }

  const searchLower = search.toLowerCase()
  const filtered = data.recommendations
    .filter(r => filter === 'ALL' || r.action === filter)
    .filter(r => r.clicks >= minClicks)
    .filter(r => !search || r.keyword.toLowerCase().includes(searchLower))
    .sort((a, b) => b.clicks - a.clicks)

  const actionKeywords = data.recommendations
    .filter(r => r.action !== 'HOLD')
    .sort((a, b) => {
      const actionOrder: Record<string, number> = { RAISE: 0, RAISE_WITH_CPA_CONCERN: 1, LOWER: 2 }
      return (actionOrder[a.action] ?? 3) - (actionOrder[b.action] ?? 3)
    })


  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-[#1D1D1F] text-xl font-bold">Max CPC Recommendations</h2>
        <div className="flex items-center gap-4">
          <a
            href="/cpc/trends"
            className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg text-sm font-medium transition-colors"
          >
            View Google Ads Trends
          </a>
          <span className="text-gray-500 text-sm">Data from: {(() => {
            const today = new Date()
            const currentDay = today.getDay()
            const daysToMonday = currentDay === 0 ? -6 : 1 - currentDay
            const thisMonday = new Date(today)
            thisMonday.setDate(today.getDate() + daysToMonday)
            const priorMonday = new Date(thisMonday)
            priorMonday.setDate(thisMonday.getDate() - 7)
            const priorSunday = new Date(priorMonday)
            priorSunday.setDate(priorMonday.getDate() + 6)
            const formatDate = (d: Date) => {
              const month = String(d.getMonth() + 1).padStart(2, '0')
              const day = String(d.getDate()).padStart(2, '0')
              return `${month}/${day}`
            }
            return `${formatDate(priorMonday)} - ${formatDate(priorSunday)}`
          })()}</span>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-3 mb-5">
        <div
          onClick={() => setFilter('ALL')}
          className={`bg-[#1a1a1a] rounded-lg p-4 cursor-pointer transition-all text-center ${filter === 'ALL' ? 'ring-2 ring-green-500' : 'hover:bg-gray-900'}`}
        >
          <div className="text-gray-400 text-xs uppercase tracking-wide mb-1">Total Keywords</div>
          <div className="text-white text-4xl font-bold">{data.summary.total}</div>
        </div>
        <div
          onClick={() => setFilter('RAISE')}
          className={`bg-[#1a1a1a] rounded-lg p-4 cursor-pointer transition-all text-center ${filter === 'RAISE' ? 'ring-2 ring-green-500' : 'hover:bg-gray-900'}`}
        >
          <div className="text-gray-400 text-xs uppercase tracking-wide mb-1">Raise Bids</div>
          <div className="text-green-500 text-4xl font-bold">{data.summary.actions.RAISE || 0}</div>
        </div>
        <div
          onClick={() => setFilter('LOWER')}
          className={`bg-[#1a1a1a] rounded-lg p-4 cursor-pointer transition-all text-center ${filter === 'LOWER' ? 'ring-2 ring-green-500' : 'hover:bg-gray-900'}`}
        >
          <div className="text-gray-400 text-xs uppercase tracking-wide mb-1">Lower Bids</div>
          <div className="text-red-500 text-4xl font-bold">{data.summary.actions.LOWER || 0}</div>
        </div>
        <div
          onClick={() => setFilter('HOLD')}
          className={`bg-[#1a1a1a] rounded-lg p-4 cursor-pointer transition-all text-center ${filter === 'HOLD' ? 'ring-2 ring-green-500' : 'hover:bg-gray-900'}`}
        >
          <div className="text-gray-400 text-xs uppercase tracking-wide mb-1">Hold</div>
          <div className="text-gray-400 text-4xl font-bold">{data.summary.actions.HOLD || 0}</div>
        </div>
      </div>

      {/* Keywords Requiring Action */}
      {actionKeywords.length > 0 && (
        <div className="mb-5">
          <div className="bg-[#1a1a1a] rounded-lg p-4">
            <h3 className="text-gray-300 text-sm font-semibold uppercase tracking-wide mb-3">Keywords Requiring Action</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-800">
                    <th className="text-left text-cyan-400 font-medium py-2 pr-3">Keyword</th>
                    <th className="text-center text-cyan-400 font-medium py-2 px-3">Action</th>
                    <th className="text-right text-cyan-400 font-medium py-2 px-3">Conv</th>
                    <th className="text-right text-cyan-400 font-medium py-2 px-3">Impr</th>
                    <th className="text-right text-cyan-400 font-medium py-2 px-3">Clicks</th>
                    <th className="text-right text-cyan-400 font-medium py-2 px-3">CTR</th>
                    <th className="text-right text-cyan-400 font-medium py-2 px-3">Cost</th>
                    <th className="text-right text-cyan-400 font-medium py-2 px-3">CPA</th>
                    <th className="text-center text-cyan-400 font-medium py-2 px-3">Impr Share</th>
                    <th className="text-center text-cyan-400 font-medium py-2 px-3">Top %</th>
                    <th className="text-center text-cyan-400 font-medium py-2 px-3">Click Share</th>
                    <th className="text-center text-cyan-400 font-medium py-2 px-3">Abs Top %</th>
                    <th className="text-center text-cyan-400 font-medium py-2 px-3">Lost IS</th>
                  </tr>
                </thead>
                <tbody>
                  {actionKeywords.map((r, idx) => {
                    const actionLabel = r.action === 'RAISE_WITH_CPA_CONCERN' ? 'RAISE*' : r.action
                    const actionColor = r.action === 'LOWER' ? 'text-red-400' : r.action === 'RAISE_WITH_CPA_CONCERN' ? 'text-yellow-400' : 'text-green-400'
                    const ctr = r.impressions > 0 ? ((r.clicks / r.impressions) * 100).toFixed(1) : '0.0'
                    return (
                      <tr key={`${r.keyword}-${r.device}-${idx}`} className={idx < actionKeywords.length - 1 ? 'border-b border-gray-800/50' : ''}>
                        <td className="text-white font-medium py-2 pr-3 whitespace-nowrap">
                          <div>{r.keyword}</div>
                          <div className="text-gray-500 text-xs">{r.device}</div>
                        </td>
                        <td className={`text-center font-bold py-2 px-3 ${actionColor}`}>{actionLabel}</td>
                        <td className="text-right text-gray-300 py-2 px-3">{Math.round(r.conversions)}</td>
                        <td className="text-right text-gray-300 py-2 px-3">{r.impressions.toLocaleString()}</td>
                        <td className="text-right text-gray-300 py-2 px-3">{r.clicks.toLocaleString()}</td>
                        <td className="text-right text-gray-300 py-2 px-3">{ctr}%</td>
                        <td className="text-right text-gray-300 py-2 px-3">${Math.round(r.cost)}</td>
                        <td className="text-right text-gray-300 py-2 px-3">${Math.round(r.costPerConv)}</td>
                        <td className="text-center py-2 px-3">
                          <span className={`font-bold ${classColors[r.searchImprClass] ? '' : 'text-white'}`} style={{ color: classColors[r.searchImprClass] }}>
                            {r.searchImprShare.toFixed(1)}%
                          </span>
                        </td>
                        <td className="text-center py-2 px-3">
                          <span className="font-bold" style={{ color: classColors[r.imprTopClass] }}>
                            {r.imprTopPct.toFixed(1)}%
                          </span>
                        </td>
                        <td className="text-center py-2 px-3">
                          <span className="font-bold" style={{ color: classColors[r.clickShareClass] }}>
                            {r.clickShare.toFixed(1)}%
                          </span>
                        </td>
                        <td className="text-center py-2 px-3">
                          <span className="font-bold" style={{ color: classColors[r.imprAbsTopClass] }}>
                            {r.imprAbsTopPct.toFixed(1)}%
                          </span>
                        </td>
                        <td className="text-center py-2 px-3">
                          <span className="font-bold" style={{ color: classColors[r.searchLostClass] }}>
                            {r.searchLostIsRank.toFixed(1)}%
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Forcing Functions Analysis */}
      <ForcingFunctions keywords={actionKeywords} platform="google" />

      {/* Filter Bar */}
      <div className="mb-3 flex items-center gap-3">
        <div className="flex gap-1.5">
          {['ALL', 'RAISE', 'LOWER', 'HOLD'].map(action => (
            <button
              key={action}
              onClick={() => setFilter(action)}
              className={`px-3 py-1.5 rounded text-xs font-medium ${
                filter === action
                  ? 'bg-green-600 text-white'
                  : 'bg-[#1a1a1a] text-gray-400 hover:bg-gray-800'
              }`}
            >
              {action}
            </button>
          ))}
        </div>
        <input
          type="text"
          placeholder="Search keyword..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="bg-[#1a1a1a] text-gray-300 text-xs rounded px-3 py-1.5 border border-gray-700 focus:border-green-500 focus:outline-none w-48"
        />
        <div className="flex items-center gap-1.5">
          <span className="text-gray-500 text-xs">Min clicks:</span>
          <select
            value={minClicks}
            onChange={e => setMinClicks(Number(e.target.value))}
            className="bg-[#1a1a1a] text-gray-300 text-xs rounded px-2 py-1.5 border border-gray-700 focus:border-green-500 focus:outline-none"
          >
            {[0, 10, 25, 50, 100].map(n => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        </div>
        <span className="text-gray-500 text-xs ml-auto">{filtered.length} keywords</span>
      </div>

      {/* Table */}
      <div className="bg-[#1a1a1a] rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-black">
              <tr className="text-gray-400 text-xs uppercase">
                <th className="text-left p-2.5">Keyword</th>
                <th className="text-left p-2.5">Campaign</th>
                <th className="text-right p-2.5">Impr</th>
                <th className="text-right p-2.5">Clicks</th>
                <th className="text-right p-2.5">CTR</th>
                <th className="text-right p-2.5">Cost</th>
                <th className="text-right p-2.5">Conv</th>
                <th className="text-right p-2.5">CPA</th>
                <th className="text-center p-2.5">Action</th>
                <th className="text-right p-2.5">Current</th>
                <th className="text-right p-2.5">Suggested</th>
                <th className="text-right p-2.5">Change</th>
                <th className="text-center p-2.5">Signals</th>
                <th className="text-center p-2.5">Impr Share</th>
                <th className="text-center p-2.5">Top%</th>
                <th className="text-center p-2.5">Click Share</th>
                <th className="text-center p-2.5">Abs Top%</th>
                <th className="text-center p-2.5">Lost IS</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((rec, i) => {
                const isTrainingOrClasses = rec.campaign.includes('Training-') || rec.campaign.includes('Classes-')
                const bgClass = isTrainingOrClasses ? 'bg-gray-800' : ''
                return (
                  <tr key={i} className={`border-t border-gray-800 hover:bg-gray-700 ${bgClass}`}>
                    <td className="p-2.5 text-gray-300">{rec.keyword}</td>
                    <td className="p-2.5 text-gray-500 text-xs">{rec.campaign}</td>
                    <td className="p-2.5 text-right text-gray-400">{rec.impressions.toLocaleString()}</td>
                    <td className="p-2.5 text-right text-gray-400">{rec.clicks.toLocaleString()}</td>
                    <td className="p-2.5 text-right text-gray-400">
                      {rec.impressions > 0 ? ((rec.clicks / rec.impressions) * 100).toFixed(0) : '0'}%
                    </td>
                    <td className="p-2.5 text-right text-gray-400">${Math.round(rec.cost)}</td>
                    <td className="p-2.5 text-right text-gray-400">{Math.round(rec.conversions)}</td>
                    <td className="p-2.5 text-right text-gray-400">${Math.round(rec.costPerConv)}</td>
                    <td className="p-2.5 text-center">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        rec.action === 'RAISE' ? 'bg-green-900 text-green-300' :
                        rec.action === 'RAISE_WITH_CPA_CONCERN' ? 'bg-yellow-900 text-yellow-300' :
                        rec.action === 'LOWER' ? 'bg-red-900 text-red-300' :
                        'bg-gray-800 text-gray-400'
                      }`}>
                        {rec.action === 'RAISE_WITH_CPA_CONCERN' ? 'RAISE*' : rec.action}
                      </span>
                    </td>
                    <td className="p-2.5 text-right text-gray-300">${rec.currentMaxCPC.toFixed(2)}</td>
                    <td className="p-2.5 text-right text-white font-medium">${rec.suggestedMaxCPC.toFixed(2)}</td>
                    <td className={`p-2.5 text-right font-medium ${rec.changeAmount > 0 ? 'text-green-500' : 'text-red-500'}`}>
                      {rec.changeAmount > 0 ? '+' : ''}${rec.changeAmount.toFixed(2)}
                    </td>
                    <td className="p-2.5 text-center text-gray-300 text-xs">{rec.signals}</td>
                    <td className="p-2.5 text-center">
                      <div className="w-14 h-6 rounded mx-auto flex items-center justify-center text-xs font-medium"
                           style={{ backgroundColor: classColors[rec.searchImprClass], color: 'white' }}>
                        {rec.searchImprShare.toFixed(0)}%
                      </div>
                    </td>
                    <td className="p-2.5 text-center">
                      <div className="w-14 h-6 rounded mx-auto flex items-center justify-center text-xs font-medium"
                           style={{ backgroundColor: classColors[rec.imprTopClass], color: 'white' }}>
                        {rec.imprTopPct.toFixed(0)}%
                      </div>
                    </td>
                    <td className="p-2.5 text-center">
                      <div className="w-14 h-6 rounded mx-auto flex items-center justify-center text-xs font-medium"
                           style={{ backgroundColor: classColors[rec.clickShareClass], color: 'white' }}>
                        {rec.clickShare.toFixed(0)}%
                      </div>
                    </td>
                    <td className="p-2.5 text-center">
                      <div className="w-14 h-6 rounded mx-auto flex items-center justify-center text-xs font-medium"
                           style={{ backgroundColor: classColors[rec.imprAbsTopClass], color: 'white' }}>
                        {rec.imprAbsTopPct.toFixed(0)}%
                      </div>
                    </td>
                    <td className="p-2.5 text-center">
                      <div className="w-14 h-6 rounded mx-auto flex items-center justify-center text-xs font-medium"
                           style={{ backgroundColor: classColors[rec.searchLostClass], color: 'white' }}>
                        {rec.searchLostIsRank.toFixed(1)}%
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}
