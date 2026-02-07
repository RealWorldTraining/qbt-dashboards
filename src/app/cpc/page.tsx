'use client'

import { useState, useEffect } from 'react'
import { DashboardNav } from '@/components/DashboardNav'
import { Doughnut, Scatter, Bar } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  ArcElement,
  CategoryScale,
  LinearScale,
  PointElement,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js'

ChartJS.register(
  ArcElement,
  CategoryScale,
  LinearScale,
  PointElement,
  BarElement,
  Title,
  Tooltip,
  Legend
)

interface CPCRecommendation {
  analysisDate: string
  campaign: string
  keyword: string
  device: string
  action: string
  currentMaxCPC: number
  suggestedMaxCPC: number
  changeAmount: number
  confidence: string
  imprTopPct: number
  imprTopClass: string
  imprAbsTopPct: number
  imprAbsTopClass: string
  searchImprShare: number
  searchImprClass: string
  clickShare: number
  clickShareClass: string
  searchLostIsRank: number
  searchLostClass: string
  headroomPct: number
  headroomClass: string
  avgCPC: number
  trendSummary: string
  primarySignal: string
  reason: string
  competitionContext: string
}

interface CPCData {
  recommendations: CPCRecommendation[]
  summary: {
    total: number
    actions: Record<string, number>
    confidence: Record<string, number>
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

export default function CPCPage() {
  const [data, setData] = useState<CPCData | null>(null)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('ALL')

  useEffect(() => {
    fetch('/api/cpc-recommendations')
      .then(res => res.json())
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-black p-4">
        <DashboardNav />
        <div className="text-center py-16">
          <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-gray-300 border-t-green-600"></div>
          <p className="mt-4 text-gray-400">Loading CPC recommendations...</p>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-black p-4">
        <DashboardNav />
        <div className="text-center py-16">
          <p className="text-red-500">Error loading data</p>
        </div>
      </div>
    )
  }

  // Define campaign order
  const campaignOrder = [
    'Certification-Desktop',
    'Training-Desktop',
    'Courses-Desktop',
    'Classes-Desktop',
    'Certification-Mobile',
    'Training-Mobile',
    'Courses-Mobile',
    'Classes-Mobile'
  ]

  const getCampaignSortKey = (campaign: string): number => {
    const index = campaignOrder.findIndex(c => campaign.includes(c))
    return index === -1 ? 999 : index
  }

  const filtered = (filter === 'ALL' 
    ? data.recommendations 
    : data.recommendations.filter(r => r.action === filter)
  ).sort((a, b) => getCampaignSortKey(a.campaign) - getCampaignSortKey(b.campaign))

  // Action distribution chart
  const actionData = {
    labels: Object.keys(data.summary.actions),
    datasets: [{
      data: Object.values(data.summary.actions),
      backgroundColor: ['#10B981', '#EF4444', '#6B7280', '#F59E0B'],
      borderWidth: 0
    }]
  }

  // Confidence distribution
  const confidenceData = {
    labels: Object.keys(data.summary.confidence).map(k => k.toUpperCase()),
    datasets: [{
      label: 'Keywords',
      data: Object.values(data.summary.confidence),
      backgroundColor: ['#10B981', '#F59E0B', '#EF4444'],
      borderWidth: 0,
      borderRadius: 4
    }]
  }

  // Current vs Suggested CPC scatter
  const scatterData = {
    datasets: [{
      label: 'RAISE',
      data: data.recommendations
        .filter(r => r.action === 'RAISE')
        .map(r => ({ x: r.currentMaxCPC, y: r.suggestedMaxCPC })),
      backgroundColor: '#10B981',
      pointRadius: 6
    }, {
      label: 'LOWER',
      data: data.recommendations
        .filter(r => r.action === 'LOWER')
        .map(r => ({ x: r.currentMaxCPC, y: r.suggestedMaxCPC })),
      backgroundColor: '#EF4444',
      pointRadius: 6
    }, {
      label: 'HOLD',
      data: data.recommendations
        .filter(r => r.action === 'HOLD')
        .map(r => ({ x: r.currentMaxCPC, y: r.suggestedMaxCPC })),
      backgroundColor: '#6B7280',
      pointRadius: 6
    }]
  }

  return (
    <div className="min-h-screen bg-black p-4">
      <DashboardNav />
      <div className="max-w-[1920px] mx-auto">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-white text-2xl font-bold">Max CPC Recommendations</h1>
          <span className="text-gray-500 text-sm">Updated: {data.summary.lastUpdated}</span>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-[#1a1a1a] rounded-lg p-4">
            <div className="text-gray-400 text-xs mb-1">TOTAL KEYWORDS</div>
            <div className="text-white text-3xl font-bold">{data.summary.total}</div>
          </div>
          <div className="bg-[#1a1a1a] rounded-lg p-4">
            <div className="text-gray-400 text-xs mb-1">RAISE BIDS</div>
            <div className="text-green-500 text-3xl font-bold">{data.summary.actions.RAISE || 0}</div>
            <div className="text-gray-500 text-xs">+${data.summary.totalBidIncrease.toFixed(2)}</div>
          </div>
          <div className="bg-[#1a1a1a] rounded-lg p-4">
            <div className="text-gray-400 text-xs mb-1">LOWER BIDS</div>
            <div className="text-red-500 text-3xl font-bold">{data.summary.actions.LOWER || 0}</div>
            <div className="text-gray-500 text-xs">-${data.summary.totalBidDecrease.toFixed(2)}</div>
          </div>
          <div className="bg-[#1a1a1a] rounded-lg p-4">
            <div className="text-gray-400 text-xs mb-1">HOLD</div>
            <div className="text-gray-400 text-3xl font-bold">{data.summary.actions.HOLD || 0}</div>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-[#1a1a1a] rounded-lg p-6">
            <h3 className="text-gray-300 text-sm font-medium mb-4">ACTION DISTRIBUTION</h3>
            <div className="h-[280px] flex items-center justify-center">
              <Doughnut data={actionData} options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: 'bottom',
                    labels: { color: '#9CA3AF', font: { size: 11 } }
                  }
                }
              }} />
            </div>
          </div>

          <div className="bg-[#1a1a1a] rounded-lg p-6">
            <h3 className="text-gray-300 text-sm font-medium mb-4">CONFIDENCE LEVELS</h3>
            <div className="h-[280px]">
              <Bar data={confidenceData} options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { display: false },
                  tooltip: {
                    backgroundColor: '#1F2937',
                    titleColor: '#F3F4F6',
                    bodyColor: '#D1D5DB'
                  }
                },
                scales: {
                  x: {
                    grid: { display: false },
                    ticks: { color: '#9CA3AF', font: { size: 11 } }
                  },
                  y: {
                    grid: { color: '#1F2937' },
                    ticks: { color: '#9CA3AF', font: { size: 11 } }
                  }
                }
              }} />
            </div>
          </div>

          <div className="bg-[#1a1a1a] rounded-lg p-6">
            <h3 className="text-gray-300 text-sm font-medium mb-4">CURRENT VS SUGGESTED CPC</h3>
            <div className="h-[280px]">
              <Scatter data={scatterData} options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: 'bottom',
                    labels: { color: '#9CA3AF', font: { size: 11 } }
                  },
                  tooltip: {
                    backgroundColor: '#1F2937',
                    titleColor: '#F3F4F6',
                    bodyColor: '#D1D5DB',
                    callbacks: {
                      label: (ctx: any) => {
                        return `Current: $${ctx.parsed.x.toFixed(2)}, Suggested: $${ctx.parsed.y.toFixed(2)}`
                      }
                    }
                  }
                },
                scales: {
                  x: {
                    title: { display: true, text: 'Current Max CPC', color: '#9CA3AF' },
                    grid: { color: '#1F2937' },
                    ticks: { color: '#9CA3AF', callback: (v: any) => '$' + v.toFixed(2) }
                  },
                  y: {
                    title: { display: true, text: 'Suggested Max CPC', color: '#9CA3AF' },
                    grid: { color: '#1F2937' },
                    ticks: { color: '#9CA3AF', callback: (v: any) => '$' + v.toFixed(2) }
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
              className={`px-4 py-2 rounded text-sm font-medium ${
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
            <table className="w-full text-sm">
              <thead className="bg-black">
                <tr className="text-gray-400 text-xs">
                  <th className="text-left p-3">KEYWORD</th>
                  <th className="text-left p-3">CAMPAIGN</th>
                  <th className="text-center p-3">ACTION</th>
                  <th className="text-right p-3">CURRENT</th>
                  <th className="text-right p-3">SUGGESTED</th>
                  <th className="text-right p-3">CHANGE</th>
                  <th className="text-center p-3">CONFIDENCE</th>
                  <th className="text-center p-3">TOP%</th>
                  <th className="text-center p-3">ABS TOP%</th>
                  <th className="text-center p-3">IMPR SHARE</th>
                  <th className="text-center p-3">CLICK SHARE</th>
                  <th className="text-center p-3">LOST IS</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((rec, i) => {
                  const isTrainingOrClasses = rec.campaign.includes('Training-') || rec.campaign.includes('Classes-')
                  const bgClass = isTrainingOrClasses ? 'bg-gray-900/50' : ''
                  return (
                  <tr key={i} className={`border-t border-gray-800 hover:bg-gray-900 ${bgClass}`}>
                    <td className="p-3 text-gray-300">{rec.keyword}</td>
                    <td className="p-3 text-gray-500 text-xs">{rec.campaign}</td>
                    <td className="p-3 text-center">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        rec.action === 'RAISE' ? 'bg-green-900 text-green-300' :
                        rec.action === 'LOWER' ? 'bg-red-900 text-red-300' :
                        'bg-gray-800 text-gray-400'
                      }`}>
                        {rec.action}
                      </span>
                    </td>
                    <td className="p-3 text-right text-gray-300">${rec.currentMaxCPC.toFixed(2)}</td>
                    <td className="p-3 text-right text-white font-medium">${rec.suggestedMaxCPC.toFixed(2)}</td>
                    <td className={`p-3 text-right font-medium ${
                      rec.changeAmount > 0 ? 'text-green-500' : 'text-red-500'
                    }`}>
                      {rec.changeAmount > 0 ? '+' : ''}${rec.changeAmount.toFixed(2)}
                    </td>
                    <td className="p-3 text-center">
                      <span className={`px-2 py-1 rounded text-xs ${
                        rec.confidence === 'high' ? 'bg-green-900 text-green-300' :
                        rec.confidence === 'medium' ? 'bg-yellow-900 text-yellow-300' :
                        'bg-red-900 text-red-300'
                      }`}>
                        {rec.confidence}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <div className={`w-12 h-6 rounded mx-auto flex items-center justify-center text-xs font-medium`}
                           style={{ backgroundColor: classColors[rec.imprTopClass], color: 'white' }}>
                        {rec.imprTopPct.toFixed(0)}%
                      </div>
                    </td>
                    <td className="p-3 text-center">
                      <div className={`w-12 h-6 rounded mx-auto flex items-center justify-center text-xs font-medium`}
                           style={{ backgroundColor: classColors[rec.imprAbsTopClass], color: 'white' }}>
                        {rec.imprAbsTopPct.toFixed(0)}%
                      </div>
                    </td>
                    <td className="p-3 text-center">
                      <div className={`w-12 h-6 rounded mx-auto flex items-center justify-center text-xs font-medium`}
                           style={{ backgroundColor: classColors[rec.searchImprClass], color: 'white' }}>
                        {rec.searchImprShare.toFixed(0)}%
                      </div>
                    </td>
                    <td className="p-3 text-center">
                      <div className={`w-12 h-6 rounded mx-auto flex items-center justify-center text-xs font-medium`}
                           style={{ backgroundColor: classColors[rec.clickShareClass], color: 'white' }}>
                        {rec.clickShare.toFixed(0)}%
                      </div>
                    </td>
                    <td className="p-3 text-center">
                      <div className={`w-12 h-6 rounded mx-auto flex items-center justify-center text-xs font-medium`}
                           style={{ backgroundColor: classColors[rec.searchLostClass], color: 'white' }}>
                        {rec.searchLostIsRank.toFixed(1)}%
                      </div>
                    </td>
                  </tr>
                )})}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
