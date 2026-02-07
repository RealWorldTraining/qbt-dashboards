'use client'

import { useState, useEffect } from 'react'
import { DashboardNav } from '@/components/DashboardNav'
import { Line } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
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

const campaigns = [
  'Certification-Desktop',
  'Training-Desktop',
  'Courses-Desktop',
  'Classes-Desktop',
  'Certification-Mobile',
  'Training-Mobile',
  'Courses-Mobile',
  'Classes-Mobile'
]

const metricConfigs = [
  { key: 'imprTopPct', label: 'Top %', color: '#3B82F6' },
  { key: 'imprAbsTopPct', label: 'Abs Top %', color: '#10B981' },
  { key: 'searchImprShare', label: 'Impr Share', color: '#F59E0B' },
  { key: 'clickShare', label: 'Click Share', color: '#8B5CF6' },
  { key: 'searchLostIsRank', label: 'Lost IS', color: '#EF4444' },
  { key: 'currentMaxCPC', label: 'Max CPC', color: '#06B6D4' }
]

export default function CPCTrendsPage() {
  const [data, setData] = useState<CPCData | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedCampaign, setSelectedCampaign] = useState(campaigns[0])

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
          <p className="mt-4 text-gray-400">Loading CPC trends...</p>
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

  const campaignKeywords = data.recommendations.filter(r => r.campaign === selectedCampaign)

  // For now, we'll show current snapshot data
  // As historical data accumulates, this will show 8-week trends
  const weeks = ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5', 'Week 6', 'Week 7', 'Week 8']

  return (
    <div className="min-h-screen bg-black p-4">
      <DashboardNav />
      <div className="max-w-[1920px] mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <a
              href="/cpc"
              className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg text-sm font-medium transition-colors"
            >
              ← Back to Recommendations
            </a>
            <h1 className="text-white text-2xl font-bold">CPC Keyword Trends</h1>
          </div>
          <span className="text-gray-500 text-sm">Updated: {data.summary.lastUpdated}</span>
        </div>

        {/* Campaign Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {campaigns.map(campaign => (
            <button
              key={campaign}
              onClick={() => setSelectedCampaign(campaign)}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                selectedCampaign === campaign
                  ? 'bg-green-600 text-white'
                  : 'bg-[#1a1a1a] text-gray-400 hover:bg-gray-800'
              }`}
            >
              {campaign.replace('-', ' ')}
            </button>
          ))}
        </div>

        {/* Keywords Count */}
        <div className="mb-4 text-gray-400">
          Showing {campaignKeywords.length} keywords for {selectedCampaign}
        </div>

        {/* Note about historical data */}
        <div className="bg-yellow-900/20 border border-yellow-600/30 rounded-lg p-4 mb-6">
          <p className="text-yellow-400 text-sm">
            📊 <strong>Historical Data:</strong> As the sheet updates daily, this page will build an 8-week trend history for each keyword. 
            Currently showing snapshot from {data.summary.lastUpdated}.
          </p>
        </div>

        {/* Metric Charts Grid */}
        <div className="grid grid-cols-2 gap-6 mb-6">
          {metricConfigs.map(metric => (
            <div key={metric.key} className="bg-[#1a1a1a] rounded-lg p-6">
              <h3 className="text-gray-300 text-sm font-medium mb-4 uppercase">{metric.label} TRENDS</h3>
              <div className="h-[300px]">
                <Line
                  data={{
                    labels: weeks,
                    datasets: campaignKeywords.slice(0, 5).map((kw, i) => ({
                      label: kw.keyword.substring(0, 30) + (kw.keyword.length > 30 ? '...' : ''),
                      data: weeks.map(() => kw[metric.key as keyof CPCRecommendation] as number),
                      borderColor: metric.color,
                      backgroundColor: metric.color + '30',
                      borderWidth: 2,
                      tension: 0.4,
                      pointRadius: 3
                    }))
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    interaction: {
                      mode: 'index' as const,
                      intersect: false
                    },
                    plugins: {
                      legend: {
                        display: true,
                        position: 'bottom' as const,
                        labels: {
                          color: '#9CA3AF',
                          font: { size: 10 },
                          padding: 10,
                          usePointStyle: true
                        }
                      },
                      tooltip: {
                        backgroundColor: '#1F2937',
                        titleColor: '#F3F4F6',
                        bodyColor: '#D1D5DB',
                        borderColor: '#374151',
                        borderWidth: 1
                      }
                    },
                    scales: {
                      x: {
                        grid: { display: false },
                        ticks: { color: '#9CA3AF', font: { size: 10 } }
                      },
                      y: {
                        grid: { color: '#1F2937' },
                        ticks: { 
                          color: '#9CA3AF', 
                          font: { size: 10 },
                          callback: (value: any) => {
                            return metric.key === 'currentMaxCPC' ? '$' + value.toFixed(2) : value.toFixed(1) + '%'
                          }
                        }
                      }
                    }
                  }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Keywords Table */}
        <div className="bg-[#1a1a1a] rounded-lg overflow-hidden">
          <div className="p-4 border-b border-gray-800">
            <h3 className="text-gray-300 text-sm font-medium">CURRENT SNAPSHOT</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-black">
                <tr className="text-gray-400 text-xs">
                  <th className="text-left p-3">KEYWORD</th>
                  <th className="text-center p-3">ACTION</th>
                  <th className="text-right p-3">MAX CPC</th>
                  <th className="text-center p-3">TOP%</th>
                  <th className="text-center p-3">ABS TOP%</th>
                  <th className="text-center p-3">IMPR SHARE</th>
                  <th className="text-center p-3">CLICK SHARE</th>
                  <th className="text-center p-3">LOST IS</th>
                </tr>
              </thead>
              <tbody>
                {campaignKeywords.map((kw, i) => (
                  <tr key={i} className="border-t border-gray-800 hover:bg-gray-900">
                    <td className="p-3 text-gray-300">{kw.keyword}</td>
                    <td className="p-3 text-center">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        kw.action === 'RAISE' ? 'bg-green-900 text-green-300' :
                        kw.action === 'LOWER' ? 'bg-red-900 text-red-300' :
                        'bg-gray-800 text-gray-400'
                      }`}>
                        {kw.action}
                      </span>
                    </td>
                    <td className="p-3 text-right text-white font-medium">${kw.currentMaxCPC.toFixed(2)}</td>
                    <td className="p-3 text-center text-gray-300">{kw.imprTopPct.toFixed(0)}%</td>
                    <td className="p-3 text-center text-gray-300">{kw.imprAbsTopPct.toFixed(0)}%</td>
                    <td className="p-3 text-center text-gray-300">{kw.searchImprShare.toFixed(0)}%</td>
                    <td className="p-3 text-center text-gray-300">{kw.clickShare.toFixed(0)}%</td>
                    <td className="p-3 text-center text-gray-300">{kw.searchLostIsRank.toFixed(1)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
