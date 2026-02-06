"use client"

import { Line } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js'

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

interface WeeklyMetrics {
  week_label: string
  date_range: string
  spend: number
  impressions: number
  clicks: number
  ctr: number
  conversions: number
  conversion_rate: number
  cpa: number
  roas: number
}

interface PerformanceChartProps {
  title: string
  data: {
    this_week: WeeklyMetrics
    last_week: WeeklyMetrics
    two_weeks_ago: WeeklyMetrics
    three_weeks_ago: WeeklyMetrics
  }
  metrics: {
    key: keyof WeeklyMetrics
    label: string
    color: string
    yAxisID?: string
  }[]
}

export function PerformanceChart({ title, data, metrics }: PerformanceChartProps) {
  // Build labels from oldest to newest
  const labels = [
    data.three_weeks_ago.week_label,
    data.two_weeks_ago.week_label,
    data.last_week.week_label,
    data.this_week.week_label
  ]

  // Build datasets
  const datasets = metrics.map(metric => ({
    label: metric.label,
    data: [
      data.three_weeks_ago[metric.key] as number,
      data.two_weeks_ago[metric.key] as number,
      data.last_week[metric.key] as number,
      data.this_week[metric.key] as number
    ],
    borderColor: metric.color,
    backgroundColor: metric.color + '20', // Add transparency
    borderWidth: 3,
    tension: 0.4,
    fill: false,
    yAxisID: metric.yAxisID || 'y'
  }))

  const chartData = {
    labels,
    datasets
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
          label: function(context: any) {
            let label = context.dataset.label || ''
            if (label) {
              label += ': '
            }
            const value = context.parsed.y
            // Format based on metric type
            if (context.dataset.label.includes('Spend') || context.dataset.label.includes('CPA')) {
              label += '$' + value.toLocaleString()
            } else if (context.dataset.label.includes('Rate') || context.dataset.label.includes('CTR')) {
              label += value.toFixed(2) + '%'
            } else if (context.dataset.label.includes('ROAS')) {
              label += value.toFixed(2) + 'x'
            } else {
              label += value.toLocaleString()
            }
            return label
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
        position: 'left' as const,
        grid: {
          color: '#1F2937'
        },
        ticks: {
          color: '#9CA3AF',
          font: {
            size: 11
          },
          callback: function(value: any) {
            // Format based on first metric
            const firstMetric = metrics[0]
            if (firstMetric.label.includes('Spend') || firstMetric.label.includes('CPA')) {
              return '$' + value.toLocaleString()
            } else if (firstMetric.label.includes('Rate') || firstMetric.label.includes('CTR')) {
              return value + '%'
            } else if (firstMetric.label.includes('ROAS')) {
              return value.toFixed(1) + 'x'
            }
            return value.toLocaleString()
          }
        }
      },
      y1: metrics.some(m => m.yAxisID === 'y1') ? {
        position: 'right' as const,
        grid: {
          display: false
        },
        ticks: {
          color: '#9CA3AF',
          font: {
            size: 11
          },
          callback: function(value: any) {
            // Find metric using y1
            const metric = metrics.find(m => m.yAxisID === 'y1')
            if (metric?.label.includes('Spend') || metric?.label.includes('CPA')) {
              return '$' + value.toLocaleString()
            } else if (metric?.label.includes('Rate') || metric?.label.includes('CTR')) {
              return value + '%'
            }
            return value.toLocaleString()
          }
        }
      } : undefined
    }
  }

  return (
    <div className="bg-[#1a1a1a] rounded-lg p-4">
      <h3 className="text-gray-400 text-xs font-medium mb-4 uppercase tracking-wide">{title}</h3>
      <div className="h-[280px]">
        <Line data={chartData} options={options} />
      </div>
    </div>
  )
}
