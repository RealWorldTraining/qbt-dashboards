import { NextResponse } from 'next/server'

// CORRECTED data from GSC API (US only, Sun-Sat weeks)
// Source: Vision's direct GSC API pull on 2026-02-01
// Filter: Query NOT contains "login" (query filter only, matches Aaron's GSC)
const VERIFIED_GSC_DATA = {
  '2026': [
    { week_start: '2026-01-04', week_end: '2026-01-10', impressions: 199192, clicks: 1164 },
    { week_start: '2026-01-11', week_end: '2026-01-17', impressions: 192954, clicks: 1255 },
    { week_start: '2026-01-18', week_end: '2026-01-24', impressions: 198821, clicks: 1221 },
    { week_start: '2026-01-25', week_end: '2026-01-31', impressions: 170892, clicks: 1115 },
  ],
  '2025': [
    { week_start: '2025-01-05', week_end: '2025-01-11', impressions: 52812, clicks: 2411 },
    { week_start: '2025-01-12', week_end: '2025-01-18', impressions: 58833, clicks: 2541 },
    { week_start: '2025-01-19', week_end: '2025-01-25', impressions: 81142, clicks: 2625 },
    { week_start: '2025-01-26', week_end: '2025-02-01', impressions: 68244, clicks: 2610 },
  ]
}

function formatDateRange(start: string, end: string): string {
  const [startYear, startMonth, startDay] = start.split('-').map(Number)
  const [endYear, endMonth, endDay] = end.split('-').map(Number)
  
  const startDate = new Date(startYear, startMonth - 1, startDay)
  const endDate = new Date(endYear, endMonth - 1, endDay)
  
  const opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' }
  return `${startDate.toLocaleDateString('en-US', opts)} - ${endDate.toLocaleDateString('en-US', opts)}`
}

interface WeekData {
  week: string
  week_start: string
  week_end: string
  year: number
  impressions: number
  clicks: number
  ctr: number
  queries: number
}

export async function GET() {
  try {
    // Build week data from verified GSC data
    const allWeeks: WeekData[] = []
    
    for (const [yearStr, weeks] of Object.entries(VERIFIED_GSC_DATA)) {
      const year = parseInt(yearStr)
      for (const w of weeks) {
        const ctr = w.impressions > 0 ? (w.clicks / w.impressions) * 100 : 0
        allWeeks.push({
          week: formatDateRange(w.week_start, w.week_end),
          week_start: w.week_start,
          week_end: w.week_end,
          year,
          impressions: w.impressions,
          clicks: w.clicks,
          ctr: Math.round(ctr * 100) / 100,
          queries: 0,
        })
      }
    }

    // Sort by date descending
    allWeeks.sort((a, b) => {
      const dateA = new Date(a.week_start)
      const dateB = new Date(b.week_start)
      return dateB.getTime() - dateA.getTime()
    })

    // Separate current year and last year data
    const currentYear = new Date().getFullYear()
    const lastYear = currentYear - 1

    const currentYearWeeks = allWeeks.filter(w => w.year === currentYear)
    const lastYearWeeks = allWeeks.filter(w => w.year === lastYear)

    // Calculate 4-week totals for current year
    const current4Weeks = currentYearWeeks.slice(0, 4)
    const current4WeekTotals = current4Weeks.reduce(
      (acc, week) => ({
        impressions: acc.impressions + week.impressions,
        clicks: acc.clicks + week.clicks,
      }),
      { impressions: 0, clicks: 0 }
    )
    const current4WeekCTR = current4WeekTotals.impressions > 0 
      ? (current4WeekTotals.clicks / current4WeekTotals.impressions) * 100 
      : 0

    // Calculate 4-week totals for last year (YoY)
    const lastYear4Weeks = lastYearWeeks.slice(0, 4)
    const lastYear4WeekTotals = lastYear4Weeks.reduce(
      (acc, week) => ({
        impressions: acc.impressions + week.impressions,
        clicks: acc.clicks + week.clicks,
      }),
      { impressions: 0, clicks: 0 }
    )
    const lastYear4WeekCTR = lastYear4WeekTotals.impressions > 0 
      ? (lastYear4WeekTotals.clicks / lastYear4WeekTotals.impressions) * 100 
      : 0

    // WoW comparison (most recent vs previous)
    const thisWeek = current4Weeks[0] || null
    const lastWeek = current4Weeks[1] || null

    let wowComparison = null
    if (thisWeek && lastWeek) {
      wowComparison = {
        current: thisWeek,
        previous: lastWeek,
        impressionsChange: lastWeek.impressions > 0 
          ? ((thisWeek.impressions - lastWeek.impressions) / lastWeek.impressions) * 100 
          : 0,
        clicksChange: lastWeek.clicks > 0 
          ? ((thisWeek.clicks - lastWeek.clicks) / lastWeek.clicks) * 100 
          : 0,
        ctrChange: lastWeek.ctr > 0 
          ? ((thisWeek.ctr - lastWeek.ctr) / lastWeek.ctr) * 100 
          : 0,
      }
    }

    // YoY comparison
    let yoyComparison = null
    if (current4WeekTotals.impressions > 0 && lastYear4WeekTotals.impressions > 0) {
      yoyComparison = {
        current: {
          impressions: current4WeekTotals.impressions,
          clicks: current4WeekTotals.clicks,
          ctr: current4WeekCTR,
        },
        lastYear: {
          impressions: lastYear4WeekTotals.impressions,
          clicks: lastYear4WeekTotals.clicks,
          ctr: lastYear4WeekCTR,
        },
        impressionsChange: ((current4WeekTotals.impressions - lastYear4WeekTotals.impressions) / lastYear4WeekTotals.impressions) * 100,
        clicksChange: ((current4WeekTotals.clicks - lastYear4WeekTotals.clicks) / lastYear4WeekTotals.clicks) * 100,
        ctrChange: ((current4WeekCTR - lastYear4WeekCTR) / lastYear4WeekCTR) * 100,
      }
    }

    return NextResponse.json({
      current4Weeks,
      lastYear4Weeks,
      wowComparison,
      yoyComparison,
      allWeeks,
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=60',
      },
    })
  } catch (error) {
    console.error('Error fetching GSC weekly data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch data', details: String(error) },
      { status: 500 }
    )
  }
}
