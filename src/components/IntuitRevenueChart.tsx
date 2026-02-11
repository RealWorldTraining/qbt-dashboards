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
          color: '#6E6E73',
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
        backgroundColor: '#ffffff',
        titleColor: '#1D1D1F',
        bodyColor: '#6E6E73',
        borderColor: '#E5E5EA',
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
          color: '#8E8E93',
          font: {
            size: 11
          }
        }
      },
      y: {
        grid: {
          color: '#F2F2F7'
        },
        ticks: {
          color: '#8E8E93',
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
    <div className="bg-white rounded-xl p-5 mb-5 shadow-sm">
      <h3 className="text-[#1D1D1F] text-sm font-semibold mb-4 uppercase tracking-wide">
        Revenue Trends by Category
      </h3>
      <div className="h-[350px]">
        <Line data={chartData} options={options} />
      </div>
    </div>
  )
}
