"use client"

import React, { useState, useEffect } from "react"
import { Doughnut, Scatter } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  ArcElement,
  CategoryScale,
  LinearScale,
  PointElement,
  BarElement,
  Title,
  Tooltip as ChartJSTooltip,
  Legend as ChartJSLegend
} from 'chart.js'

ChartJS.register(
  ArcElement,
  CategoryScale,
  LinearScale,
  PointElement,
  BarElement,
  Title,
  ChartJSTooltip,
  ChartJSLegend
)

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

interface WeekData {
  date: string
  impressions: number
  clicks: number
  cost: number
  conversions: number
}

interface FourWeekData {
  weeks: WeekData[]
}

const classColors: Record<string, string> = {
  BLUE: '#3B82F6',
  GREEN: '#10B981',
  YELLOW: '#F59E0B',
  RED: '#EF4444'
}

export function GadsCPCTab() {
  const [data, setData] = useState<CPCData | null>(null)
  const [fourWeekData, setFourWeekData] = useState<FourWeekData | null>(null)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('ALL')

  useEffect(() => {
    Promise.all([
      fetch('/api/cpc-recommendations').then(res => res.json()),
      fetch('/api/cpc-four-week').then(res => res.json())
    ])
      .then(([recommendations, fourWeek]) => {
        setData(recommendations)
        setFourWeekData(fourWeek)
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

  const campaignOrder = [
    'Certification-Desktop', 'Training-Desktop', 'Courses-Desktop', 'Classes-Desktop',
    'Certification-Mobile', 'Training-Mobile', 'Courses-Mobile', 'Classes-Mobile'
  ]

  const getCampaignSortKey = (campaign: string): number => {
    const index = campaignOrder.findIndex(c => campaign.includes(c))
    return index === -1 ? 999 : index
  }

  const filtered = (filter === 'ALL'
    ? data.recommendations
    : data.recommendations.filter(r => r.action === filter)
  ).sort((a, b) => getCampaignSortKey(a.campaign) - getCampaignSortKey(b.campaign))

  const actionLabelMap: Record<string, string> = { RAISE_WITH_CPA_CONCERN: 'RAISE*' }
  const actionData = {
    labels: Object.keys(data.summary.actions).map(k => actionLabelMap[k] || k),
    datasets: [{
      data: Object.values(data.summary.actions),
      backgroundColor: ['#10B981', '#EF4444', '#6B7280', '#F59E0B'],
      borderWidth: 0
    }]
  }

  const scatterData = {
    datasets: [{
      label: 'RAISE',
      data: data.recommendations.filter(r => r.action === 'RAISE' || r.action === 'RAISE_WITH_CPA_CONCERN').map(r => ({ x: r.currentMaxCPC, y: r.suggestedMaxCPC })),
      backgroundColor: '#10B981',
      pointRadius: 10
    }, {
      label: 'LOWER',
      data: data.recommendations.filter(r => r.action === 'LOWER').map(r => ({ x: r.currentMaxCPC, y: r.suggestedMaxCPC })),
      backgroundColor: '#EF4444',
      pointRadius: 10
    }, {
      label: 'HOLD',
      data: data.recommendations.filter(r => r.action === 'HOLD').map(r => ({ x: r.currentMaxCPC, y: r.suggestedMaxCPC })),
      backgroundColor: '#6B7280',
      pointRadius: 10
    }]
  }

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-white text-xl font-bold">Max CPC Recommendations</h2>
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
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div
          onClick={() => setFilter('ALL')}
          className={`bg-[#1a1a1a] rounded-lg p-4 cursor-pointer transition-all ${filter === 'ALL' ? 'ring-2 ring-green-500' : 'hover:bg-gray-900'}`}
        >
          <div className="text-gray-400 text-lg mb-1">TOTAL KEYWORDS</div>
          <div className="text-white text-5xl font-bold">{data.summary.total}</div>
        </div>
        <div
          onClick={() => setFilter('RAISE')}
          className={`bg-[#1a1a1a] rounded-lg p-4 cursor-pointer transition-all ${filter === 'RAISE' ? 'ring-2 ring-green-500' : 'hover:bg-gray-900'}`}
        >
          <div className="text-gray-400 text-lg mb-1">RAISE BIDS</div>
          <div className="text-green-500 text-5xl font-bold">{data.summary.actions.RAISE || 0}</div>
          <div className="text-gray-500 text-base">+${data.summary.totalBidIncrease.toFixed(2)}</div>
        </div>
        <div
          onClick={() => setFilter('LOWER')}
          className={`bg-[#1a1a1a] rounded-lg p-4 cursor-pointer transition-all ${filter === 'LOWER' ? 'ring-2 ring-green-500' : 'hover:bg-gray-900'}`}
        >
          <div className="text-gray-400 text-lg mb-1">LOWER BIDS</div>
          <div className="text-red-500 text-5xl font-bold">{data.summary.actions.LOWER || 0}</div>
          <div className="text-gray-500 text-base">-${data.summary.totalBidDecrease.toFixed(2)}</div>
        </div>
        <div
          onClick={() => setFilter('HOLD')}
          className={`bg-[#1a1a1a] rounded-lg p-4 cursor-pointer transition-all ${filter === 'HOLD' ? 'ring-2 ring-green-500' : 'hover:bg-gray-900'}`}
        >
          <div className="text-gray-400 text-lg mb-1">HOLD</div>
          <div className="text-gray-400 text-5xl font-bold">{data.summary.actions.HOLD || 0}</div>
        </div>
      </div>

      {/* 6-Week Performance Table */}
      <div className="mb-6">
        <div className="bg-[#1a1a1a] rounded-lg p-6">
          <h3 className="text-gray-300 text-2xl font-medium mb-4">TRAILING 6-WEEK PERFORMANCE</h3>
          {fourWeekData && fourWeekData.weeks.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-2xl">
                <thead>
                  <tr className="border-b border-gray-800">
                    <th className="text-left text-gray-400 font-medium py-3 pr-4"></th>
                    <th className="text-center py-3 px-3 text-cyan-400 text-xl font-medium">Impressions</th>
                    <th className="text-center py-3 px-3 text-cyan-400 text-xl font-medium">Clicks</th>
                    <th className="text-center py-3 px-3 text-cyan-400 text-xl font-medium">CTR</th>
                    <th className="text-center py-3 px-3 text-cyan-400 text-xl font-medium">Cost</th>
                    <th className="text-center py-3 px-3 text-cyan-400 text-xl font-medium">Conversions</th>
                  </tr>
                </thead>
                <tbody>
                  {[...fourWeekData.weeks].reverse().map((week, idx) => {
                    const labels = ['5 Weeks Ago', '4 Weeks Ago', '3 Weeks Ago', '2 Weeks Ago', 'Last Week', 'Current Week']
                    return (
                      <tr key={week.date} className={idx < fourWeekData.weeks.length - 1 ? 'border-b border-gray-800/50' : ''}>
                        <td className="text-gray-400 font-medium py-3 pr-4 whitespace-nowrap">
                          <div>{labels[idx]}</div>
                          <div className="text-gray-500 text-lg">{week.date}</div>
                        </td>
                        <td className="text-white text-center font-bold py-3 px-3">{week.impressions.toLocaleString()}</td>
                        <td className="text-white text-center font-bold py-3 px-3">{week.clicks.toLocaleString()}</td>
                        <td className="text-white text-center font-bold py-3 px-3">
                          {week.impressions > 0 ? ((week.clicks / week.impressions) * 100).toFixed(1) : '0.0'}%
                        </td>
                        <td className="text-white text-center font-bold py-3 px-3">${Math.round(week.cost).toLocaleString()}</td>
                        <td className="text-white text-center font-bold py-3 px-3">{Math.round(week.conversions)}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-gray-500 text-center py-16">Loading...</div>
          )}
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-[#1a1a1a] rounded-lg p-6">
          <h3 className="text-gray-300 text-xl font-medium mb-4">ACTION DISTRIBUTION</h3>
          <div className="h-[280px] flex items-center justify-center">
            <Doughnut data={actionData} options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: { position: 'bottom', labels: { color: '#9CA3AF', font: { size: 17 } } }
              }
            }} />
          </div>
        </div>
        <div className="bg-[#1a1a1a] rounded-lg p-6">
          <h3 className="text-gray-300 text-xl font-medium mb-4">CURRENT VS SUGGESTED CPC</h3>
          <div className="h-[280px]">
            <Scatter data={scatterData} options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: { position: 'bottom', labels: { color: '#9CA3AF', font: { size: 17 } } },
                tooltip: {
                  backgroundColor: '#1F2937',
                  titleColor: '#F3F4F6',
                  bodyColor: '#D1D5DB',
                  titleFont: { size: 15 },
                  bodyFont: { size: 15 },
                  callbacks: {
                    label: (ctx: any) => `Current: $${ctx.parsed.x.toFixed(2)}, Suggested: $${ctx.parsed.y.toFixed(2)}`
                  }
                }
              },
              scales: {
                x: {
                  title: { display: true, text: 'Current Max CPC', color: '#9CA3AF', font: { size: 15 } },
                  grid: { color: '#1F2937' },
                  ticks: { color: '#9CA3AF', font: { size: 14 }, callback: (v: any) => '$' + v.toFixed(2) }
                },
                y: {
                  title: { display: true, text: 'Suggested Max CPC', color: '#9CA3AF', font: { size: 15 } },
                  grid: { color: '#1F2937' },
                  ticks: { color: '#9CA3AF', font: { size: 14 }, callback: (v: any) => '$' + v.toFixed(2) }
                }
              }
            }} />
          </div>
        </div>
      </div>

      {/* Filter */}
      <div className="mb-4 flex gap-2">
        {['ALL', 'RAISE', 'LOWER', 'HOLD'].map(action => (
          <button
            key={action}
            onClick={() => setFilter(action)}
            className={`px-5 py-3 rounded text-xl font-medium ${
              filter === action
                ? 'bg-green-600 text-white'
                : 'bg-[#1a1a1a] text-gray-400 hover:bg-gray-800'
            }`}
          >
            {action}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-[#1a1a1a] rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xl">
            <thead className="bg-black">
              <tr className="text-gray-400 text-lg">
                <th className="text-left p-3">KEYWORD</th>
                <th className="text-left p-3">CAMPAIGN</th>
                <th className="text-right p-3">IMPR</th>
                <th className="text-right p-3">CLICKS</th>
                <th className="text-right p-3">CTR</th>
                <th className="text-right p-3">COST</th>
                <th className="text-right p-3">CONV</th>
                <th className="text-right p-3">CPA</th>
                <th className="text-center p-3">ACTION</th>
                <th className="text-right p-3">CURRENT</th>
                <th className="text-right p-3">SUGGESTED</th>
                <th className="text-right p-3">CHANGE</th>
                <th className="text-center p-3">SIGNALS</th>
                <th className="text-center p-3">IMPR SHARE</th>
                <th className="text-center p-3">TOP%</th>
                <th className="text-center p-3">CLICK SHARE</th>
                <th className="text-center p-3">ABS TOP%</th>
                <th className="text-center p-3">LOST IS</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((rec, i) => {
                const isTrainingOrClasses = rec.campaign.includes('Training-') || rec.campaign.includes('Classes-')
                const bgClass = isTrainingOrClasses ? 'bg-gray-800' : ''
                return (
                  <tr key={i} className={`border-t border-gray-800 hover:bg-gray-700 ${bgClass}`}>
                    <td className="p-3 text-gray-300">{rec.keyword}</td>
                    <td className="p-3 text-gray-500 text-base">{rec.campaign}</td>
                    <td className="p-3 text-right text-gray-400">{rec.impressions.toLocaleString()}</td>
                    <td className="p-3 text-right text-gray-400">{rec.clicks.toLocaleString()}</td>
                    <td className="p-3 text-right text-gray-400">
                      {rec.impressions > 0 ? ((rec.clicks / rec.impressions) * 100).toFixed(1) : '0.0'}%
                    </td>
                    <td className="p-3 text-right text-gray-400">${Math.round(rec.cost)}</td>
                    <td className="p-3 text-right text-gray-400">{Math.round(rec.conversions)}</td>
                    <td className="p-3 text-right text-gray-400">${Math.round(rec.costPerConv)}</td>
                    <td className="p-3 text-center">
                      <span className={`px-3 py-1.5 rounded text-base font-medium ${
                        rec.action === 'RAISE' ? 'bg-green-900 text-green-300' :
                        rec.action === 'RAISE_WITH_CPA_CONCERN' ? 'bg-yellow-900 text-yellow-300' :
                        rec.action === 'LOWER' ? 'bg-red-900 text-red-300' :
                        'bg-gray-800 text-gray-400'
                      }`}>
                        {rec.action === 'RAISE_WITH_CPA_CONCERN' ? 'RAISE*' : rec.action}
                      </span>
                    </td>
                    <td className="p-3 text-right text-gray-300">${rec.currentMaxCPC.toFixed(2)}</td>
                    <td className="p-3 text-right text-white font-medium">${rec.suggestedMaxCPC.toFixed(2)}</td>
                    <td className={`p-3 text-right font-medium ${rec.changeAmount > 0 ? 'text-green-500' : 'text-red-500'}`}>
                      {rec.changeAmount > 0 ? '+' : ''}${rec.changeAmount.toFixed(2)}
                    </td>
                    <td className="p-3 text-center text-gray-300 text-base">{rec.signals}</td>
                    <td className="p-3 text-center">
                      <div className="w-16 h-8 rounded mx-auto flex items-center justify-center text-sm font-medium"
                           style={{ backgroundColor: classColors[rec.searchImprClass], color: 'white' }}>
                        {rec.searchImprShare.toFixed(0)}%
                      </div>
                    </td>
                    <td className="p-3 text-center">
                      <div className="w-16 h-8 rounded mx-auto flex items-center justify-center text-sm font-medium"
                           style={{ backgroundColor: classColors[rec.imprTopClass], color: 'white' }}>
                        {rec.imprTopPct.toFixed(0)}%
                      </div>
                    </td>
                    <td className="p-3 text-center">
                      <div className="w-16 h-8 rounded mx-auto flex items-center justify-center text-sm font-medium"
                           style={{ backgroundColor: classColors[rec.clickShareClass], color: 'white' }}>
                        {rec.clickShare.toFixed(0)}%
                      </div>
                    </td>
                    <td className="p-3 text-center">
                      <div className="w-16 h-8 rounded mx-auto flex items-center justify-center text-sm font-medium"
                           style={{ backgroundColor: classColors[rec.imprAbsTopClass], color: 'white' }}>
                        {rec.imprAbsTopPct.toFixed(0)}%
                      </div>
                    </td>
                    <td className="p-3 text-center">
                      <div className="w-16 h-8 rounded mx-auto flex items-center justify-center text-sm font-medium"
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
