'use client'

import { useEffect, useState } from 'react'

interface LandingPageWeekData {
  label: string
  date_range: string
  users: number
  purchases: number
  conversion_rate: number
}

interface LandingPageData {
  landing_page: string
  weeks: LandingPageWeekData[]
}

interface LandingPagesData {
  landing_pages: LandingPageData[]
  last_updated: string
}

interface GadsLandingPageWeekData {
  label: string
  date_range: string
  clicks: number
  conversions: number
  conversion_rate: number
}

interface GadsLandingPageData {
  landing_page: string
  weeks: GadsLandingPageWeekData[]
}

interface GadsLandingPagesData {
  landing_pages: GadsLandingPageData[]
  last_updated: string
}

const formatNumber = (n: number) => Math.round(n).toLocaleString()
const formatPercent = (n: number) => n.toFixed(2) + '%'

export default function LandingPagesPage() {
  const [landingPagesData, setLandingPagesData] = useState<LandingPagesData | null>(null)
  const [gadsLandingPagesData, setGadsLandingPagesData] = useState<GadsLandingPagesData | null>(null)
  const [time, setTime] = useState(new Date())

  const fetchData = async () => {
    try {
      const [lpRes, gadsLpRes] = await Promise.all([
        fetch('/api/landing-pages-weekly'),
        fetch('/api/gads-landing-pages-weekly')
      ])

      if (lpRes.ok) setLandingPagesData(await lpRes.json())
      if (gadsLpRes.ok) setGadsLandingPagesData(await gadsLpRes.json())
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

  // Reorder GADS landing pages to match GA4 order
  const normalizePath = (p: string) => p.replace(/\/+$/, '') || '/'
  const ga4Order = landingPagesData?.landing_pages.map(lp => normalizePath(lp.landing_page)) ?? []
  const sortedGadsPages = gadsLandingPagesData ? [...gadsLandingPagesData.landing_pages].sort((a, b) => {
    const aIdx = ga4Order.indexOf(normalizePath(a.landing_page))
    const bIdx = ga4Order.indexOf(normalizePath(b.landing_page))
    // Pages found in GA4 list come first in GA4 order, unmatched pages go to the end
    if (aIdx === -1 && bIdx === -1) return 0
    if (aIdx === -1) return 1
    if (bIdx === -1) return -1
    return aIdx - bIdx
  }) : []

  if (!landingPagesData || !gadsLandingPagesData) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-6xl">Loading Landing Pages...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white p-4 md:p-6 xl:p-8 overflow-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 xl:mb-8">
        <h1 className="text-3xl md:text-5xl xl:text-7xl font-bold">Landing Pages</h1>
        <div className="text-right">
          <div className="text-2xl md:text-4xl xl:text-6xl font-mono">{time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</div>
          <div className="text-sm md:text-xl xl:text-3xl text-gray-500 mt-1">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</div>
        </div>
      </div>

      <div className="flex flex-col 2xl:flex-row gap-6 xl:gap-8">
        {/* GA4 Landing Pages - Weekly */}
        <div className="w-full 2xl:w-1/2 flex flex-col">
          <div className="bg-gradient-to-br from-cyan-900/40 to-cyan-600/20 rounded-2xl xl:rounded-3xl p-4 md:p-6 xl:p-8 border border-cyan-500/30 flex-1 overflow-hidden flex flex-col">
            <div className="text-2xl md:text-3xl xl:text-4xl text-cyan-400 font-bold mb-4 xl:mb-6">GA4 Landing Pages (5 Weeks)</div>
            <div className="overflow-auto flex-1">
              <table className="w-full">
                <thead className="sticky top-0 bg-black/80 backdrop-blur-sm">
                  <tr className="border-b-2 border-cyan-500/40">
                    <th className="text-left py-2 xl:py-4 px-2 xl:px-3 text-cyan-300 font-medium text-sm md:text-base xl:text-xl">Landing Page</th>
                    {landingPagesData.landing_pages[0]?.weeks.map((week, idx) => (
                      <th key={idx} className="text-center py-2 xl:py-4 px-2 xl:px-3">
                        <div className="text-cyan-300 font-medium text-sm md:text-lg xl:text-2xl">{week.label}</div>
                        <div className="text-gray-400 text-xs md:text-sm xl:text-base mt-1">{week.date_range}</div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {landingPagesData.landing_pages.map((lp, lpIdx) => (
                    <tr key={lpIdx} className="border-b border-cyan-500/20 hover:bg-cyan-900/20 transition-colors">
                      <td className="py-2 xl:py-4 px-2 xl:px-3 text-white font-medium text-sm md:text-base xl:text-xl truncate max-w-[160px] md:max-w-[220px] xl:max-w-[280px]" title={lp.landing_page}>
                        {lp.landing_page}
                      </td>
                      {lp.weeks.map((week, weekIdx) => (
                        <td key={weekIdx} className="text-center py-2 xl:py-4 px-2 xl:px-3">
                          <div className="text-white font-bold text-sm md:text-base xl:text-xl mb-1">{formatNumber(week.users)}</div>
                          <div className="text-cyan-300 text-xs md:text-sm xl:text-lg">{week.purchases} conv</div>
                          <div className="text-green-400 text-xs md:text-sm xl:text-lg font-semibold">{formatPercent(week.conversion_rate)}</div>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Google Ads Landing Pages - Weekly */}
        <div className="w-full 2xl:w-1/2 flex flex-col">
          <div className="bg-gradient-to-br from-orange-900/40 to-orange-600/20 rounded-2xl xl:rounded-3xl p-4 md:p-6 xl:p-8 border border-orange-500/30 flex-1 overflow-hidden flex flex-col">
            <div className="text-2xl md:text-3xl xl:text-4xl text-orange-400 font-bold mb-4 xl:mb-6">Google Ads Landing Pages (5 Weeks)</div>
            <div className="overflow-auto flex-1">
              <table className="w-full">
                <thead className="sticky top-0 bg-black/80 backdrop-blur-sm">
                  <tr className="border-b-2 border-orange-500/40">
                    <th className="text-left py-2 xl:py-4 px-2 xl:px-3 text-orange-300 font-medium text-sm md:text-base xl:text-xl">Landing Page</th>
                    {sortedGadsPages[0]?.weeks.map((week, idx) => (
                      <th key={idx} className="text-center py-2 xl:py-4 px-2 xl:px-3">
                        <div className="text-orange-300 font-medium text-sm md:text-lg xl:text-2xl">{week.label}</div>
                        <div className="text-gray-400 text-xs md:text-sm xl:text-base mt-1">{week.date_range}</div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sortedGadsPages.map((lp, lpIdx) => (
                    <tr key={lpIdx} className="border-b border-orange-500/20 hover:bg-orange-900/20 transition-colors">
                      <td className="py-2 xl:py-4 px-2 xl:px-3 text-white font-medium text-sm md:text-base xl:text-xl truncate max-w-[160px] md:max-w-[220px] xl:max-w-[280px]" title={lp.landing_page}>
                        {lp.landing_page}
                      </td>
                      {lp.weeks.map((week, weekIdx) => (
                        <td key={weekIdx} className="text-center py-2 xl:py-4 px-2 xl:px-3">
                          <div className="text-white font-bold text-sm md:text-base xl:text-xl mb-1">{formatNumber(week.clicks)}</div>
                          <div className="text-orange-300 text-xs md:text-sm xl:text-lg">{Math.round(week.conversions)} conv</div>
                          <div className="text-green-400 text-xs md:text-sm xl:text-lg font-semibold">{formatPercent(week.conversion_rate)}</div>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
