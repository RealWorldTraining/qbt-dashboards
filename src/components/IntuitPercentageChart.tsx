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

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
)

interface CategoryData {
  amount: number
  percentage: number
}

interface IntuitPercentageChartProps {
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

export function IntuitPercentageChart({ months, categories, data }: IntuitPercentageChartProps) {
  const datasets = categories.map(cat => ({
    label: cat.label,
    data: months.map(month => data[month]?.[cat.key]?.percentage || 0),
    backgroundColor: categoryColors[cat.key] || '#6B7280',
    borderWidth: 0
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
            return `${context.dataset.label}: ${value.toFixed(1)}%`
          },
          footer: function(tooltipItems: any) {
            const total = tooltipItems.reduce((sum: number, item: any) => sum + item.parsed.y, 0)
            return `Total: ${total.toFixed(1)}%`
          }
        }
      }
    },
    scales: {
      x: {
        stacked: true,
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
        stacked: true,
        max: 100,
        grid: {
          color: '#1F2937'
        },
        ticks: {
          color: '#9CA3AF',
          font: {
            size: 11
          },
          callback: function(value: any) {
            return value + '%'
          }
        }
      }
    }
  }

  return (
    <div className="bg-[#1a1a1a] rounded-lg p-6 mb-6">
      <h3 className="text-gray-300 text-sm font-medium mb-4 uppercase tracking-wide">
        Revenue Mix by Category (% of Total)
      </h3>
      <div className="h-[350px]">
        <Bar data={chartData} options={options} />
      </div>
    </div>
  )
}
