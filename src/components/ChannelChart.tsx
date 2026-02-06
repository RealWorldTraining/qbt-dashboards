"use client"

import { Bar } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js'

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
)

interface ChannelMetrics {
  users: number
  purchases: number
  conv_rate: number
  pct_of_users: number
  pct_of_purchases: number
}

interface OrganicWeek {
  week_label: string
  date_range: string
  totals: { users: number; purchases: number }
  google_ads: ChannelMetrics
  google_organic: ChannelMetrics
  direct: ChannelMetrics
  bing_organic: ChannelMetrics
  qb_intuit: ChannelMetrics
  other: ChannelMetrics
}

interface ChannelChartProps {
  data: {
    this_week: OrganicWeek
    last_week: OrganicWeek
    two_weeks_ago: OrganicWeek
    three_weeks_ago: OrganicWeek
  }
}

export function ChannelChart({ data }: ChannelChartProps) {
  const channels = [
    { key: 'google_ads', label: 'Google Ads', color: '#10B981' },
    { key: 'google_organic', label: 'Google Organic', color: '#3B82F6' },
    { key: 'direct', label: 'Direct', color: '#6B7280' },
    { key: 'bing_organic', label: 'Bing Organic', color: '#14B8A6' },
    { key: 'qb_intuit', label: 'QB Intuit', color: '#059669' },
    { key: 'other', label: 'Other', color: '#A855F7' }
  ]

  const chartData = {
    labels: channels.map(c => c.label),
    datasets: [
      {
        label: 'New Visitors',
        data: channels.map(c => data.this_week[c.key as keyof OrganicWeek] as ChannelMetrics).map(m => m.users),
        backgroundColor: '#3B82F6',
        borderRadius: 4
      },
      {
        label: 'Purchases',
        data: channels.map(c => data.this_week[c.key as keyof OrganicWeek] as ChannelMetrics).map(m => m.purchases),
        backgroundColor: '#10B981',
        borderRadius: 4
      }
    ]
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index' as const,
      intersect: false
    },
    plugins: {
      legend: {
        display: true,
        position: 'top' as const,
        labels: {
          color: '#9CA3AF',
          font: {
            size: 11,
            weight: 500
          },
          padding: 15,
          usePointStyle: true,
          pointStyle: 'circle'
        }
      },
      tooltip: {
        backgroundColor: '#1F2937',
        titleColor: '#F3F4F6',
        bodyColor: '#D1D5DB',
        borderColor: '#374151',
        borderWidth: 1,
        padding: 12,
        displayColors: true,
        callbacks: {
          afterTitle: function(context: any) {
            if (context[0]) {
              const channelKey = channels[context[0].dataIndex].key
              const channelData = data.this_week[channelKey as keyof OrganicWeek] as ChannelMetrics
              return `Conv Rate: ${channelData.conv_rate.toFixed(2)}%`
            }
            return ''
          }
        }
      }
    },
    scales: {
      x: {
        grid: {
          display: false
        },
        ticks: {
          color: '#9CA3AF',
          font: {
            size: 11
          }
        }
      },
      y: {
        grid: {
          color: '#1F2937'
        },
        ticks: {
          color: '#9CA3AF',
          font: {
            size: 11
          },
          callback: function(value: any) {
            return value.toLocaleString()
          }
        }
      }
    }
  }

  return (
    <div className="bg-[#1a1a1a] rounded-lg p-4">
      <h3 className="text-gray-400 text-xs font-medium mb-4 uppercase tracking-wide">
        Channel Performance (This Week)
      </h3>
      <div className="h-[280px]">
        <Bar data={chartData} options={options} />
      </div>
    </div>
  )
}
