"use client"

interface MiniLineChartProps {
  data: number[]
  color: string
  height?: number
}

export function MiniLineChart({ data, color, height = 60 }: MiniLineChartProps) {
  if (!data || data.length === 0) {
    return null
  }

  const max = Math.max(...data)
  const min = Math.min(...data)
  const range = max - min || 1

  // Generate SVG path
  const width = 200
  const padding = 4
  const chartHeight = height - padding * 2
  const stepX = width / (data.length - 1)

  const points = data.map((value, index) => {
    const x = index * stepX
    const y = chartHeight - ((value - min) / range) * chartHeight + padding
    return { x, y, value }
  })

  const pathD = points
    .map((point, i) => `${i === 0 ? 'M' : 'L'} ${point.x},${point.y}`)
    .join(' ')

  return (
    <svg width={width} height={height} className="overflow-visible">
      {/* Line */}
      <path
        d={pathD}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      
      {/* Data points */}
      {points.map((point, i) => (
        <circle
          key={i}
          cx={point.x}
          cy={point.y}
          r="3"
          fill={color}
          className="opacity-80"
        />
      ))}
    </svg>
  )
}
