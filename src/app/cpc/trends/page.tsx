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

interface KeywordWeek {
  date: string
  keyword: string
  campaign: string
  clicks: number
  impressions: number
  ctr: number
  avgCpc: number
  cost: number
  conversions: number
  cpa: number
  convRate: number
  searchImprShare: number
  imprTopPct: number
  imprAbsTopPct: number
  searchLostIsRank: number
  clickShare: number
}

interface TrendsData {
  trends: Record<string, Record<string, KeywordWeek[]>>
  lastUpdated: string
}

const campaignTabs = [
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
  { key: 'avgCpc', label: 'Avg CPC', color: '#06B6D4' }
]

export default function CPCTrendsPage() {
  const [data, setData] = useState<TrendsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedTab, setSelectedTab] = useState(campaignTabs[0])

  useEffect(() => {
    fetch('/api/cpc-trends')
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

  // Find campaigns that match the selected tab filter
  const matchingCampaigns = Object.keys(data.trends).filter(campaign => {
    const tabFilter = selectedTab.toLowerCase().replace('-', ' ')
    return campaign.toLowerCase().includes(tabFilter.split(' ')[0]) || 
           campaign.toLowerCase().includes('base') || 
           campaign.toLowerCase().includes('2025')
  })

  // Collect all keywords across matching campaigns
  const allKeywords: Record<string, KeywordWeek[]> = {}
  matchingCampaigns.forEach(campaign => {
    Object.entries(data.trends[campaign]).forEach(([keyword, weeks]) => {
      if (!allKeywords[keyword] || weeks.length > allKeywords[keyword].length) {
        allKeywords[keyword] = weeks
      }
    })
  })

  const keywordNames = Object.keys(allKeywords).slice(0, 8) // Show top 8 keywords

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
          <span className="text-gray-500 text-sm">Last week: {data.lastUpdated}</span>
        </div>

        {/* Campaign Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {campaignTabs.map(tab => (
            <button
              key={tab}
              onClick={() => setSelectedTab(tab)}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                selectedTab === tab
                  ? 'bg-green-600 text-white'
                  : 'bg-[#1a1a1a] text-gray-400 hover:bg-gray-800'
              }`}
            >
              {tab.replace('-', ' ')}
            </button>
          ))}
        </div>

        {/* Keywords Count */}
        <div className="mb-4 text-gray-400">
          Showing {keywordNames.length} keywords for {selectedTab}
        </div>

        {/* Metric Charts Grid */}
        <div className="grid grid-cols-2 gap-6 mb-6">
          {metricConfigs.map(metric => (
            <div key={metric.key} className="bg-[#1a1a1a] rounded-lg p-6">
              <h3 className="text-gray-300 text-sm font-medium mb-4 uppercase">{metric.label} TRENDS (8 WEEKS)</h3>
              <div className="h-[300px]">
                <Line
                  data={{
                    labels: allKeywords[keywordNames[0]]?.map((w, i) => {
                      const date = new Date(w.date)
                      return `${date.getMonth() + 1}/${date.getDate()}`
                    }) || [],
                    datasets: keywordNames.map((kw, i) => {
                      const weeks = allKeywords[kw]
                      const colors = ['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EF4444', '#06B6D4', '#EC4899', '#14B8A6']
                      return {
                        label: kw.substring(0, 30) + (kw.length > 30 ? '...' : ''),
                        data: weeks.map(w => w[metric.key as keyof KeywordWeek] as number),
                        borderColor: colors[i % colors.length],
                        backgroundColor: colors[i % colors.length] + '30',
                        borderWidth: 2,
                        tension: 0.4,
                        pointRadius: 3
                      }
                    })
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
                            return metric.key === 'avgCpc' ? '$' + value.toFixed(2) : value.toFixed(1) + '%'
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
            <h3 className="text-gray-300 text-sm font-medium">KEYWORD SUMMARIES (MOST RECENT WEEK)</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-black">
                <tr className="text-gray-400 text-xs">
                  <th className="text-left p-3">KEYWORD</th>
                  <th className="text-right p-3">AVG CPC</th>
                  <th className="text-center p-3">TOP%</th>
                  <th className="text-center p-3">ABS TOP%</th>
                  <th className="text-center p-3">IMPR SHARE</th>
                  <th className="text-center p-3">CLICK SHARE</th>
                  <th className="text-center p-3">LOST IS</th>
                  <th className="text-right p-3">CONVERSIONS</th>
                  <th className="text-right p-3">CPA</th>
                </tr>
              </thead>
              <tbody>
                {keywordNames.map((kw, i) => {
                  const latest = allKeywords[kw][allKeywords[kw].length - 1]
                  return (
                    <tr key={i} className="border-t border-gray-800 hover:bg-gray-900">
                      <td className="p-3 text-gray-300">{kw}</td>
                      <td className="p-3 text-right text-white font-medium">${latest.avgCpc.toFixed(2)}</td>
                      <td className="p-3 text-center text-gray-300">{latest.imprTopPct.toFixed(0)}%</td>
                      <td className="p-3 text-center text-gray-300">{latest.imprAbsTopPct.toFixed(0)}%</td>
                      <td className="p-3 text-center text-gray-300">{latest.searchImprShare.toFixed(0)}%</td>
                      <td className="p-3 text-center text-gray-300">{latest.clickShare.toFixed(0)}%</td>
                      <td className="p-3 text-center text-gray-300">{latest.searchLostIsRank.toFixed(1)}%</td>
                      <td className="p-3 text-right text-gray-300">{latest.conversions.toFixed(1)}</td>
                      <td className="p-3 text-right text-gray-300">${latest.cpa.toFixed(2)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
