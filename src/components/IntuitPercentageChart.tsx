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
          color: '#8E8E93',
          font: {
            size: 11
          }
        }
      },
      y: {
        stacked: true,
        max: 100,
        grid: {
          color: '#F2F2F7'
        },
        ticks: {
          color: '#8E8E93',
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
    <div className="bg-white rounded-xl p-5 mb-5 shadow-sm">
      <h3 className="text-[#1D1D1F] text-sm font-semibold mb-4 uppercase tracking-wide">
        Revenue Mix by Category (% of Total)
      </h3>
      <div className="h-[350px]">
        <Bar data={chartData} options={options} />
      </div>
    </div>
  )
}
