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

interface CategoryData {
  amount: number
  percentage: number
}

interface IntuitRevenueChartProps {
  months: string[]
  categories: Array<{ key: string; label: string }>
  data: Record<string, Record<string, CategoryData>>
}

const categoryColors: Record<string, string> = {
  'ies': '#10B981',           // green
  'priority_circle': '#3B82F6', // blue
  'classes': '#F59E0B',        // orange
  'videos': '#8B5CF6',         // purple
  'webinars': '#EC4899',       // pink
  'other': '#6B7280'           // gray
}

export function IntuitRevenueChart({ months, categories, data }: IntuitRevenueChartProps) {
  const datasets = categories.map(cat => ({
    label: cat.label,
    data: months.map(month => data[month]?.[cat.key]?.amount || 0),
    borderColor: categoryColors[cat.key] || '#6B7280',
    backgroundColor: (categoryColors[cat.key] || '#6B7280') + '30',
    borderWidth: 3,
    tension: 0.4,
    fill: false,
    pointRadius: 4,
    pointHoverRadius: 6
  }))

  const chartData = {
    labels: months,
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
          color: '#D1D5DB',
          font: {
            size: 12,
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
            const value = context.parsed.y
            return `${context.dataset.label}: $${value.toLocaleString()}`
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
            return '$' + value.toLocaleString()
          }
        }
      }
    }
  }

  return (
    <div className="bg-[#1a1a1a] rounded-lg p-6 mb-6">
      <h3 className="text-gray-300 text-sm font-medium mb-4 uppercase tracking-wide">
        Revenue Trends by Category
      </h3>
      <div className="h-[350px]">
        <Line data={chartData} options={options} />
      </div>
    </div>
  )
}
