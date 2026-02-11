"use client"

import { useState, useEffect } from "react"
import { Users } from "lucide-react"
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Line,
  LineChart,
} from "recharts"

interface AgeSeriesData {
  age: string
  data: number[]
}

interface ChartData {
  months: string[]
  monthKeys: string[]
  ageGroups: string[]
  clicks: AgeSeriesData[]
  impressions: AgeSeriesData[]
  ctr: AgeSeriesData[]
  avg_cpc: AgeSeriesData[]
  cost: AgeSeriesData[]
  conversions: AgeSeriesData[]
}

interface YTDAgeSummary {
  age: string
  clicks: number
  impressions: number
  ctr: number
  avg_cpc: number
  cost: number
  conversions: number
}

interface AgeApiResponse {
  chartData: ChartData
  ytd2026Summary: YTDAgeSummary[]
  deviceFilter: string
  last_updated: string
}

const AGE_COLORS: Record<string, string> = {
  '18-24': '#3b82f6',
  '25-34': '#10b981',
  '35-44': '#f59e0b',
  '45-54': '#ef4444',
  '55-64': '#8b5cf6',
  '>64': '#ec4899',
}

const DEVICE_OPTIONS = ['All', 'Computers', 'Mobile', 'Tablets']

export function GadsAgeTab() {
  const [data, setData] = useState<AgeApiResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedDevice, setSelectedDevice] = useState('All')

  useEffect(() => {
    setLoading(true)
    const fetchData = async () => {
      try {
        const res = await fetch(`/api/age-analysis?device=${selectedDevice}`)
        if (res.ok) {
          const json = await res.json()
          setData(json)
        }
      } catch (err) {
        console.error('Error fetching age analysis:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
    const interval = setInterval(fetchData, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [selectedDevice])

  if (loading) {
    return (
      <div className="text-center py-16">
        <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-gray-300 border-t-cyan-600"></div>
        <p className="mt-4 text-gray-400">Loading Age Analysis...</p>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="text-center py-16">
        <p className="text-red-500">No data available</p>
      </div>
    )
  }

  const { chartData, ytd2026Summary } = data

  const transformDataForChart = (metricData: AgeSeriesData[]) => {
    return chartData.months.map((month, idx) => {
      const parts = month.split(' ')
      const monthAbbr = parts[0]
      const yearAbbr = parts[1] ? `'${parts[1].slice(2)}` : ''
      const label = `${monthAbbr}\n${yearAbbr}`
      const point: any = { month: label }
      metricData.forEach(series => {
        point[series.age] = series.data[idx]
      })
      return point
    })
  }

  const clicksData = transformDataForChart(chartData.clicks)
  const impressionsData = transformDataForChart(chartData.impressions)
  const ctrData = transformDataForChart(chartData.ctr)
  const cpcData = transformDataForChart(chartData.avg_cpc)
  const costData = transformDataForChart(chartData.cost)
  const conversionsData = transformDataForChart(chartData.conversions)

  const renderLineChart = (
    title: string,
    titleColor: string,
    chartDataSet: any[],
    tooltipFormatter?: (value: any) => string
  ) => (
    <div className="bg-[#1a1a1a] border border-gray-800 rounded-xl p-6">
      <h2 className="text-xl font-bold mb-4" style={{ color: titleColor }}>{title}</h2>
      <ResponsiveContainer width="100%" height={350}>
        <LineChart data={chartDataSet}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis dataKey="month" stroke="#9ca3af" height={50} style={{ fontSize: '11px' }} />
          <YAxis stroke="#9ca3af" style={{ fontSize: '11px' }} />
          <Tooltip
            contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151' }}
            labelStyle={{ color: '#fff' }}
            formatter={tooltipFormatter}
          />
          <Legend wrapperStyle={{ fontSize: '12px' }} />
          {chartData.ageGroups.map(age => (
            <Line
              key={age}
              type="monotone"
              dataKey={age}
              stroke={AGE_COLORS[age]}
              strokeWidth={2}
              dot={{ r: 3 }}
              activeDot={{ r: 5 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )

  return (
    <>
      {/* Header with Device Toggle */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <p className="text-gray-400">2026 YTD performance by age group &bull; Device: {selectedDevice}</p>
          <div className="flex gap-2">
            {DEVICE_OPTIONS.map(device => (
              <button
                key={device}
                onClick={() => setSelectedDevice(device)}
                className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                  selectedDevice === device
                    ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-500/50'
                    : 'bg-[#1a1a1a] text-gray-400 hover:bg-gray-800'
                }`}
              >
                {device}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Age Group Summary Cards */}
      <div className="grid grid-cols-5 gap-4 mb-8">
        {ytd2026Summary.map((ageSummary) => {
          const ageColor = AGE_COLORS[ageSummary.age]
          return (
            <div key={ageSummary.age} className="bg-[#1a1a1a] border-2 rounded-xl p-4" style={{ borderColor: ageColor }}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5" style={{ color: ageColor }} />
                  <span className="text-xl font-bold" style={{ color: ageColor }}>
                    {ageSummary.age}
                  </span>
                </div>
                <span className="text-xs text-gray-500">2026 YTD</span>
              </div>
              <div className="space-y-3">
                <div>
                  <div className="text-gray-500 text-xs mb-1">Clicks</div>
                  <div className="text-white text-lg font-bold">{ageSummary.clicks.toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-gray-500 text-xs mb-1">Impressions</div>
                  <div className="text-white text-lg font-bold">{ageSummary.impressions.toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-gray-500 text-xs mb-1">CTR</div>
                  <div className="text-white text-lg font-bold">{ageSummary.ctr.toFixed(2)}%</div>
                </div>
                <div>
                  <div className="text-gray-500 text-xs mb-1">Avg CPC</div>
                  <div className="text-white text-lg font-bold">${ageSummary.avg_cpc.toFixed(2)}</div>
                </div>
                <div>
                  <div className="text-gray-500 text-xs mb-1">Spend</div>
                  <div className="text-white text-lg font-bold">
                    ${ageSummary.cost.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </div>
                </div>
                <div>
                  <div className="text-gray-500 text-xs mb-1">Conversions</div>
                  <div className="text-white text-lg font-bold">{ageSummary.conversions.toFixed(0)}</div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Charts - 2 Column Grid */}
      <div className="grid grid-cols-2 gap-6">
        {renderLineChart('Clicks by Age Group', '#60a5fa', clicksData)}
        {renderLineChart('Impressions by Age Group', '#34d399', impressionsData)}
        {renderLineChart('Click-Through Rate (CTR)', '#fbbf24', ctrData,
          (value: any) => typeof value === 'number' ? `${value.toFixed(2)}%` : value
        )}
        {renderLineChart('Average Cost Per Click', '#f87171', cpcData,
          (value: any) => typeof value === 'number' ? `$${value.toFixed(2)}` : value
        )}
        {renderLineChart('Cost (Spend) by Age Group', '#a78bfa', costData,
          (value: any) => typeof value === 'number' ? `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : value
        )}
        {renderLineChart('Conversions by Age Group', '#f472b6', conversionsData,
          (value: any) => typeof value === 'number' ? value.toFixed(2) : value
        )}
      </div>

      {/* Footer */}
      <div className="text-center text-gray-500 text-sm mt-8">
        <p>Data source: Google Ads (Adveronix Sheet: Age Analysis_Device) &bull; Device Filter: {selectedDevice}</p>
        <p className="mt-2">Last updated: {new Date(data.last_updated).toLocaleString()}</p>
      </div>
    </>
  )
}
