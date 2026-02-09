'use client'

import { useEffect, useState } from 'react'

interface YoYWeekData {
  week_key: string
  label: string
  date_range: string
  users: number
  purchases: number
  conversion_rate: number
  yoy: {
    week_key: string
    date_range: string
    users: number
    purchases: number
    conversion_rate: number
    users_change: number
    users_change_pct: number
    purchases_change: number
    purchases_change_pct: number
    conv_rate_change: number
    conv_rate_change_pct: number
  }
}

interface YoYData {
  weeks: YoYWeekData[]
  last_updated: string
}

interface ChannelWeek {
  label: string
  date_range: string
  users: number
  purchases: number
}

interface ChannelData {
  channel: string
  weeks: ChannelWeek[]
}

interface WeekHeader {
  label: string
  date_range: string
}

interface TrafficChannelsData {
  channels: ChannelData[]
  week_headers: WeekHeader[]
  last_updated: string
}

const CHANNEL_COLORS: Record<string, string> = {
  'Paid Search': 'text-blue-400',
  'Organic Search': 'text-green-400',
  'Direct': 'text-purple-400',
  'Referral': 'text-orange-400',
  'Cross-network': 'text-cyan-400',
  'Organic Video': 'text-red-400',
  'Email': 'text-yellow-400',
  'Organic Social': 'text-pink-400',
  'Unassigned': 'text-gray-500',
}

const formatNumber = (n: number) => Math.round(n).toLocaleString()
const formatPercent = (n: number) => n.toFixed(2) + '%'

export default function AdsTVPage() {
  const [yoyData, setYoyData] = useState<YoYData | null>(null)
  const [channelsData, setChannelsData] = useState<TrafficChannelsData | null>(null)
  const [time, setTime] = useState(new Date())

  const fetchData = async () => {
    try {
      const [yoyRes, channelsRes] = await Promise.all([
        fetch('/api/organic-yoy'),
        fetch('/api/traffic-channels')
      ])
      if (yoyRes.ok) setYoyData(await yoyRes.json())
      if (channelsRes.ok) setChannelsData(await channelsRes.json())
    } catch (err) {
      console.error('Error fetching data:', err)
    }
  }

  useEffect(() => {
    fetchData()
    const dataInterval = setInterval(fetchData, 5 * 60 * 1000)
    const clockInterval = setInterval(() => setTime(new Date()), 1000)
    return () => {
      clearInterval(dataInterval)
      clearInterval(clockInterval)
    }
  }, [])

  if (!yoyData || !channelsData) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-4xl md:text-6xl">Loading Marketing Dashboard...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white p-4 md:p-6 xl:p-8 overflow-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 xl:mb-8">
        <h1 className="text-3xl md:text-5xl xl:text-7xl font-bold">Marketing Dashboard</h1>
        <div className="text-right">
          <div className="text-2xl md:text-4xl xl:text-6xl font-mono">{time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</div>
          <div className="text-sm md:text-xl xl:text-3xl text-gray-500 mt-1">{yoyData.weeks[0]?.date_range}</div>
        </div>
      </div>

      {/* Row 1: New Visitors + Conversions side by side */}
      <div className="flex flex-col lg:flex-row gap-4 xl:gap-6 mb-4 xl:mb-6">
        {/* New Visitors */}
        <div className="flex-1 bg-gradient-to-br from-blue-900/40 to-blue-600/20 rounded-2xl xl:rounded-3xl p-4 md:p-6 border border-blue-500/30">
          <div className="text-xl md:text-2xl xl:text-3xl text-blue-400 font-medium mb-3 xl:mb-4">NEW VISITORS</div>
          <div className="grid grid-cols-5 gap-2 md:gap-4">
            {yoyData.weeks.map((week, idx) => (
              <div key={idx} className="text-center">
                <div className="text-xs md:text-base xl:text-xl text-gray-400 mb-1">{week.label}</div>
                <div className="text-xs md:text-sm text-gray-500 mb-1 xl:mb-2">{week.date_range}</div>
                <div className="text-xl md:text-3xl xl:text-5xl font-bold mb-1 xl:mb-2">{formatNumber(week.users)}</div>
                <div className="text-xs text-gray-400 mb-1">YoY: {week.yoy.date_range}</div>
                <div className="text-xs md:text-sm">
                  <span className={week.yoy.users_change >= 0 ? 'text-green-400' : 'text-red-400'}>
                    {week.yoy.users_change >= 0 ? '+' : ''}{formatNumber(week.yoy.users_change)}
                  </span>
                </div>
                <div className="text-xs">
                  <span className={week.yoy.users_change_pct >= 0 ? 'text-green-400' : 'text-red-400'}>
                    ({week.yoy.users_change_pct >= 0 ? '+' : ''}{week.yoy.users_change_pct.toFixed(1)}%)
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Conversions */}
        <div className="flex-1 bg-gradient-to-br from-green-900/40 to-green-600/20 rounded-2xl xl:rounded-3xl p-4 md:p-6 border border-green-500/30">
          <div className="text-xl md:text-2xl xl:text-3xl text-green-400 font-medium mb-3 xl:mb-4">CONVERSIONS</div>
          <div className="grid grid-cols-5 gap-2 md:gap-4">
            {yoyData.weeks.map((week, idx) => (
              <div key={idx} className="text-center">
                <div className="text-xs md:text-base xl:text-xl text-gray-400 mb-1">{week.label}</div>
                <div className="text-xs md:text-sm text-gray-500 mb-1 xl:mb-2">{week.date_range}</div>
                <div className="text-xl md:text-3xl xl:text-5xl font-bold mb-1 xl:mb-2">{week.purchases}</div>
                <div className="text-xs text-gray-400 mb-1">YoY: {week.yoy.date_range}</div>
                <div className="text-xs md:text-sm">
                  <span className={week.yoy.purchases_change >= 0 ? 'text-green-400' : 'text-red-400'}>
                    {week.yoy.purchases_change >= 0 ? '+' : ''}{week.yoy.purchases_change}
                  </span>
                </div>
                <div className="text-xs">
                  <span className={week.yoy.purchases_change_pct >= 0 ? 'text-green-400' : 'text-red-400'}>
                    ({week.yoy.purchases_change_pct >= 0 ? '+' : ''}{week.yoy.purchases_change_pct.toFixed(1)}%)
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Row 2: Traffic Channels Breakdown */}
      <div className="bg-[#0a0a0a] rounded-2xl xl:rounded-3xl p-4 md:p-6 border border-gray-800 mb-4 xl:mb-6">
        <div className="text-xl md:text-2xl xl:text-3xl text-gray-300 font-medium mb-4 xl:mb-6">TRAFFIC CHANNELS</div>
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-800">
              <th className="text-left py-2 xl:py-3 px-2 text-gray-500 font-medium text-xs md:text-sm xl:text-lg">Channel</th>
              {channelsData.week_headers.map((header, idx) => (
                <th key={idx} className="text-center py-2 xl:py-3 px-2" colSpan={2}>
                  <div className="text-gray-400 font-medium text-xs md:text-sm xl:text-lg">{header.label}</div>
                  <div className="text-gray-600 text-xs md:text-xs xl:text-sm">{header.date_range}</div>
                </th>
              ))}
            </tr>
            <tr className="border-b border-gray-800/50">
              <th></th>
              {channelsData.week_headers.map((_, idx) => (
                <th key={`u-${idx}`} colSpan={2} className="text-center py-1 px-2">
                  <div className="flex justify-center gap-4 md:gap-8">
                    <span className="text-gray-500 text-xs xl:text-sm">Users</span>
                    <span className="text-gray-500 text-xs xl:text-sm">Sales</span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {channelsData.channels.map((channel, rowIdx) => (
              <tr key={rowIdx} className="border-b border-gray-800/50 hover:bg-white/5 transition-colors">
                <td className={`py-3 xl:py-4 px-2 font-medium text-sm md:text-base xl:text-xl ${CHANNEL_COLORS[channel.channel] || 'text-gray-400'}`}>
                  {channel.channel}
                </td>
                {channel.weeks.map((week, colIdx) => (
                  <td key={colIdx} className="text-center py-3 xl:py-4 px-2" colSpan={2}>
                    <div className="flex justify-center gap-4 md:gap-8">
                      <span className="text-white font-bold text-sm md:text-lg xl:text-2xl">{formatNumber(week.users)}</span>
                      <span className="text-green-400 font-semibold text-sm md:text-lg xl:text-2xl">{week.purchases}</span>
                    </div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Row 3: Conversion Rate - full width */}
      <div className="bg-gradient-to-br from-purple-900/40 to-purple-600/20 rounded-2xl xl:rounded-3xl p-4 md:p-6 border border-purple-500/30">
        <div className="text-xl md:text-2xl xl:text-3xl text-purple-400 font-medium mb-3 xl:mb-4">CONVERSION RATE</div>
        <div className="grid grid-cols-5 gap-2 md:gap-4">
          {yoyData.weeks.map((week, idx) => (
            <div key={idx} className="text-center">
              <div className="text-xs md:text-base xl:text-xl text-gray-400 mb-1">{week.label}</div>
              <div className="text-xs md:text-sm text-gray-500 mb-1 xl:mb-2">{week.date_range}</div>
              <div className="text-xl md:text-3xl xl:text-5xl font-bold mb-1 xl:mb-2">{formatPercent(week.conversion_rate)}</div>
              <div className="text-xs text-gray-400 mb-1">YoY: {week.yoy.date_range}</div>
              <div className="text-xs md:text-sm">
                <span className={week.yoy.conv_rate_change >= 0 ? 'text-green-400' : 'text-red-400'}>
                  {week.yoy.conv_rate_change >= 0 ? '+' : ''}{week.yoy.conv_rate_change.toFixed(2)}pp
                </span>
              </div>
              <div className="text-xs">
                <span className={week.yoy.conv_rate_change_pct >= 0 ? 'text-green-400' : 'text-red-400'}>
                  ({week.yoy.conv_rate_change_pct >= 0 ? '+' : ''}{week.yoy.conv_rate_change_pct.toFixed(1)}%)
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
