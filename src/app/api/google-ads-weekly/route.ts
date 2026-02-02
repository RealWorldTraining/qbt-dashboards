import { google } from 'googleapis'
import { NextResponse } from 'next/server'

// Adveronix: Paid Search sheet
const SHEET_ID = '1T8PZjlf2vBz7YTlz1GCXe68UczWGL8_ERYuBLd_r6H0'
const RANGE = 'GADS: Account: Weekly (Devices)!A:L'

function parseNumber(val: string): number {
  if (!val) return 0
  const cleaned = val.replace(/,/g, '').replace(/%/g, '')
  return parseFloat(cleaned) || 0
}

function formatDateRange(start: string, end: string): string {
  // Parse dates without timezone shift (YYYY-MM-DD format)
  const [startYear, startMonth, startDay] = start.split('-').map(Number)
  const [endYear, endMonth, endDay] = end.split('-').map(Number)
  
  const startDate = new Date(startYear, startMonth - 1, startDay)
  const endDate = new Date(endYear, endMonth - 1, endDay)
  
  const opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' }
  return `${startDate.toLocaleDateString('en-US', opts)} - ${endDate.toLocaleDateString('en-US', opts)}`
}

export async function GET() {
  try {
    const credsJson = process.env.GOOGLE_SHEETS_CREDENTIALS
    if (!credsJson) {
      return NextResponse.json({ error: 'Missing credentials' }, { status: 500 })
    }

    const credentials = JSON.parse(
      Buffer.from(credsJson, 'base64').toString('utf-8')
    )

    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    })

    const sheets = google.sheets({ version: 'v4', auth })
    
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: RANGE,
    })

    const rows = response.data.values
    if (!rows || rows.length < 2) {
      return NextResponse.json({ error: 'No data found' }, { status: 404 })
    }

    // Adveronix structure: Week | Account | Device | Clicks | Impressions | CTR | Avg.CPC | Cost | CPM | Conv | Cross-dev | CPA
    // Group by week and aggregate across devices
    const weeklyAgg = new Map()
    
    rows.slice(1).forEach((row) => {
      const week = row[0]
      if (!week) return
      
      const existing = weeklyAgg.get(week) || {
        week_start: week,
        clicks: 0,
        impressions: 0,
        spend: 0,
        conversions: 0,
        conv_value: 0
      }
      
      existing.clicks += parseNumber(row[3])
      existing.impressions += parseNumber(row[4])
      existing.spend += parseNumber(row[7])
      existing.conversions += parseNumber(row[9])
      // Assume $500 value per conversion for conv_value calculation
      existing.conv_value += parseNumber(row[9]) * 500
      
      weeklyAgg.set(week, existing)
    })
    
    const allWeeks = Array.from(weeklyAgg.values()).map(w => {
      // Calculate week_end (week_start is Monday, so add 6 days for Sunday)
      const [year, month, day] = w.week_start.split('-').map(Number)
      const startDate = new Date(year, month - 1, day)
      const endDate = new Date(startDate)
      endDate.setDate(endDate.getDate() + 6)
      const week_end = endDate.toISOString().split('T')[0]
      
      return {
        ...w,
        week_end,
        ctr: w.impressions > 0 ? (w.clicks / w.impressions) * 100 : 0,
        avg_cpc: w.clicks > 0 ? w.spend / w.clicks : 0,
        conv_rate: w.clicks > 0 ? (w.conversions / w.clicks) * 100 : 0,
        cpa: w.conversions > 0 ? w.spend / w.conversions : 0
      }
    }).filter(w => w.week_start)

    // Get last 6 complete weeks
    // A week is complete if its end date is before today
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const completeWeeks = allWeeks.filter(w => {
      const [year, month, day] = w.week_end.split('-').map(Number)
      const weekEnd = new Date(year, month - 1, day)
      return weekEnd < today
    })
    
    // Sort by date ascending before slicing (in case rows are not in order)
    completeWeeks.sort((a, b) => {
      const dateA = new Date(a.week_start)
      const dateB = new Date(b.week_start)
      return dateA.getTime() - dateB.getTime()
    })
    
    const last8Complete = completeWeeks.slice(-8)

    const weeklyData = last8Complete.map(w => ({
      week: formatDateRange(w.week_start, w.week_end),
      week_start: w.week_start,
      spend: Math.round(w.spend),
      impressions: w.impressions,
      clicks: w.clicks,
      ctr: w.ctr,
      avg_cpc: w.avg_cpc,
      conversions: Math.round(w.conversions),
      conv_rate: w.conv_rate,
      cpa: Math.round(w.cpa),
      roas: w.spend > 0 ? w.conv_value / w.spend : 0,
    })).reverse() // Most recent first
    
    // Find YoY data: same 4-week period from last year
    // Current 4 weeks are weeklyData[0..3], find matching weeks from prior year
    const current4Weeks = weeklyData.slice(0, 4)
    const yoyWeeks: typeof weeklyData = []
    
    if (current4Weeks.length === 4) {
      // For each current week, find the equivalent week from last year (52 weeks prior)
      // Use a Set to track which weeks we've already matched (avoid duplicates)
      const matchedWeekStarts = new Set<string>()
      
      for (const currentWeek of current4Weeks) {
        const [year, month, day] = currentWeek.week_start.split('-').map(Number)
        const targetDate = new Date(year - 1, month - 1, day)
        
        // Find the closest week in allWeeks from last year (not already matched)
        let bestMatch: typeof allWeeks[0] | null = null
        let bestDiff = Infinity
        
        for (const w of allWeeks) {
          const [wYear, wMonth, wDay] = w.week_start.split('-').map(Number)
          if (wYear !== year - 1) continue
          if (matchedWeekStarts.has(w.week_start)) continue
          
          const weekStart = new Date(wYear, wMonth - 1, wDay)
          const diffDays = Math.abs((targetDate.getTime() - weekStart.getTime()) / (1000 * 60 * 60 * 24))
          
          if (diffDays <= 7 && diffDays < bestDiff) {
            bestDiff = diffDays
            bestMatch = w
          }
        }
        
        const matchingWeek = bestMatch
        if (matchingWeek) {
          matchedWeekStarts.add(matchingWeek.week_start)
        }
        
        if (matchingWeek) {
          yoyWeeks.push({
            week: formatDateRange(matchingWeek.week_start, matchingWeek.week_end),
            week_start: matchingWeek.week_start,
            spend: Math.round(matchingWeek.spend),
            impressions: matchingWeek.impressions,
            clicks: matchingWeek.clicks,
            ctr: matchingWeek.ctr,
            avg_cpc: matchingWeek.avg_cpc,
            conversions: Math.round(matchingWeek.conversions),
            conv_rate: matchingWeek.conv_rate,
            cpa: Math.round(matchingWeek.cpa),
            roas: matchingWeek.spend > 0 ? matchingWeek.conv_value / matchingWeek.spend : 0,
          })
        }
      }
    }

    return NextResponse.json({
      data: weeklyData,
      yoyData: yoyWeeks.length === 4 ? yoyWeeks : null,
      last_updated: new Date().toISOString()
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=60',
      },
    })
  } catch (error) {
    console.error('Error fetching Google Ads weekly data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch data' },
      { status: 500 }
    )
  }
}
