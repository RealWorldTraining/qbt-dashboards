import { google } from 'googleapis'
import { NextResponse } from 'next/server'

const SHEET_ID = '1T8PZjlf2vBz7YTlz1GCXe68UczWGL8_ERYuBLd_r6H0'

function parseNumber(val: string): number {
  if (!val) return 0
  const cleaned = val.replace(/[$,]/g, '').replace(/%/g, '')
  return parseFloat(cleaned) || 0
}

function normalizeDate(dateStr: string): string {
  if (!dateStr) return ''
  const trimmed = dateStr.trim()
  if (/^\d{4}-\d{1,2}-\d{1,2}$/.test(trimmed)) return trimmed
  if (trimmed.includes('/')) {
    const parts = trimmed.split('/')
    if (parts.length === 3) {
      const [m, d, y] = parts.map(Number)
      if (!isNaN(m) && !isNaN(d) && !isNaN(y)) {
        return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`
      }
    }
  }
  const num = Number(trimmed)
  if (!isNaN(num) && num > 40000 && num < 60000) {
    const epoch = new Date(1899, 11, 30)
    const date = new Date(epoch.getTime() + num * 86400000)
    return date.toISOString().split('T')[0]
  }
  return trimmed
}

function getWeekStartMonday(dateStr: string): string {
  const [year, month, day] = dateStr.split('-').map(Number)
  const date = new Date(year, month - 1, day)
  const dayOfWeek = date.getDay() // 0=Sun, 1=Mon...6=Sat
  const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1 // days since Monday
  const monday = new Date(date)
  monday.setDate(date.getDate() - diff)
  return monday.toISOString().split('T')[0]
}

function formatDateRange(start: string, end: string): string {
  const [sy, sm, sd] = start.split('-').map(Number)
  const [ey, em, ed] = end.split('-').map(Number)
  const s = new Date(sy, sm - 1, sd)
  const e = new Date(ey, em - 1, ed)
  const opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' }
  return `${s.toLocaleDateString('en-US', opts)}–${e.toLocaleDateString('en-US', opts)}`
}

async function getSheets() {
  const credsJson = process.env.GOOGLE_SHEETS_CREDENTIALS
  if (!credsJson) throw new Error('Missing credentials')
  const credentials = JSON.parse(Buffer.from(credsJson, 'base64').toString('utf-8'))
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  })
  return google.sheets({ version: 'v4', auth })
}

interface WeekBucket {
  gsc_impressions: number
  gsc_clicks: number
  gads_impressions: number
  gads_clicks: number
  gads_conversions: number
  bing_impressions: number
  bing_clicks: number
  bing_conversions: number
}

export async function GET() {
  try {
    const sheets = await getSheets()

    // Fetch all 3 data sources in parallel
    const [gscRes, gadsRes, bingRes] = await Promise.all([
      sheets.spreadsheets.values.get({ spreadsheetId: SHEET_ID, range: 'GSC: Account Daily!A:D' }),
      sheets.spreadsheets.values.get({ spreadsheetId: SHEET_ID, range: 'GADS: Account: Weekly (Devices)!A:L' }),
      sheets.spreadsheets.values.get({ spreadsheetId: SHEET_ID, range: 'BING: Account Summary Weekly!A:J' }),
    ])

    // --- GSC: aggregate daily → weekly (Monday-based) ---
    const gscRows = gscRes.data.values || []
    const gscHeaders = gscRows[0]?.map((h: string) => h?.toLowerCase().trim() || '') || []
    const gscDateCol = gscHeaders.findIndex((h: string) => h.includes('date'))
    const gscImpCol = gscHeaders.findIndex((h: string) => h.includes('impression'))
    const gscClickCol = gscHeaders.findIndex((h: string) => h.includes('click'))
    const colDate = gscDateCol >= 0 ? gscDateCol : 0
    const colImp = gscImpCol >= 0 ? gscImpCol : 1
    const colClick = gscClickCol >= 0 ? gscClickCol : 2

    const gscWeekly = new Map<string, { impressions: number; clicks: number }>()
    gscRows.slice(1).forEach(row => {
      const rawDate = row[colDate]
      if (!rawDate) return
      const date = normalizeDate(rawDate)
      if (!date) return
      const weekStart = getWeekStartMonday(date)
      const existing = gscWeekly.get(weekStart) || { impressions: 0, clicks: 0 }
      existing.impressions += parseNumber(row[colImp])
      existing.clicks += parseNumber(row[colClick])
      gscWeekly.set(weekStart, existing)
    })

    // --- Google Ads: aggregate by week_start across devices ---
    const gadsRows = gadsRes.data.values || []
    const gadsWeekly = new Map<string, { impressions: number; clicks: number; conversions: number }>()
    gadsRows.slice(1).forEach(row => {
      const week = row[0]
      if (!week) return
      const existing = gadsWeekly.get(week) || { impressions: 0, clicks: 0, conversions: 0 }
      existing.impressions += parseNumber(row[4])
      existing.clicks += parseNumber(row[3])
      existing.conversions += parseNumber(row[9])
      gadsWeekly.set(week, existing)
    })

    // --- Bing Ads: already weekly ---
    const bingRows = bingRes.data.values || []
    const bingWeekly = new Map<string, { impressions: number; clicks: number; conversions: number }>()
    bingRows.slice(1).forEach(row => {
      const week = row[0]
      if (!week) return
      const existing = bingWeekly.get(week) || { impressions: 0, clicks: 0, conversions: 0 }
      existing.impressions += parseNumber(row[2])
      existing.clicks += parseNumber(row[3])
      existing.conversions += parseNumber(row[7])
      bingWeekly.set(week, existing)
    })

    // --- Find overlapping weeks (all three sources must have data) ---
    const allWeekStarts = new Set<string>()
    gscWeekly.forEach((_, k) => allWeekStarts.add(k))

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const combinedWeeks: Array<{
      week: string
      week_start: string
      gsc_impressions: number
      gsc_clicks: number
      gads_impressions: number
      gads_clicks: number
      gads_conversions: number
      bing_impressions: number
      bing_clicks: number
      bing_conversions: number
      total_impressions: number
      total_clicks: number
      total_conversions: number
      conv_rate: number
    }> = []

    // Only include weeks where all 3 sources have data AND week is complete
    for (const weekStart of allWeekStarts) {
      const gsc = gscWeekly.get(weekStart)
      const gads = gadsWeekly.get(weekStart)
      const bing = bingWeekly.get(weekStart)

      if (!gsc || !gads || !bing) continue

      // Check if week is complete (Sunday = weekStart + 6 days is before today)
      const [y, m, d] = weekStart.split('-').map(Number)
      const weekEnd = new Date(y, m - 1, d + 6)
      if (weekEnd >= today) continue

      const weekEndStr = weekEnd.toISOString().split('T')[0]

      const total_impressions = gsc.impressions + gads.impressions + bing.impressions
      const total_clicks = gsc.clicks + gads.clicks + bing.clicks
      const total_conversions = gads.conversions + bing.conversions // GSC has no conversions
      const conv_rate = total_clicks > 0 ? (total_conversions / total_clicks) * 100 : 0

      combinedWeeks.push({
        week: formatDateRange(weekStart, weekEndStr),
        week_start: weekStart,
        gsc_impressions: gsc.impressions,
        gsc_clicks: gsc.clicks,
        gads_impressions: gads.impressions,
        gads_clicks: gads.clicks,
        gads_conversions: Math.round(gads.conversions),
        bing_impressions: bing.impressions,
        bing_clicks: bing.clicks,
        bing_conversions: Math.round(bing.conversions),
        total_impressions,
        total_clicks,
        total_conversions: Math.round(total_conversions),
        conv_rate,
      })
    }

    // Sort most recent first, take last 6
    combinedWeeks.sort((a, b) => b.week_start.localeCompare(a.week_start))
    const weeklyData = combinedWeeks.slice(0, 6)

    // --- Monthly aggregates ---
    const monthlyAgg = new Map<string, WeekBucket>()

    const addToMonth = (monthKey: string, bucket: Partial<WeekBucket>) => {
      const existing = monthlyAgg.get(monthKey) || {
        gsc_impressions: 0, gsc_clicks: 0,
        gads_impressions: 0, gads_clicks: 0, gads_conversions: 0,
        bing_impressions: 0, bing_clicks: 0, bing_conversions: 0,
      }
      if (bucket.gsc_impressions) existing.gsc_impressions += bucket.gsc_impressions
      if (bucket.gsc_clicks) existing.gsc_clicks += bucket.gsc_clicks
      if (bucket.gads_impressions) existing.gads_impressions += bucket.gads_impressions
      if (bucket.gads_clicks) existing.gads_clicks += bucket.gads_clicks
      if (bucket.gads_conversions) existing.gads_conversions += bucket.gads_conversions
      if (bucket.bing_impressions) existing.bing_impressions += bucket.bing_impressions
      if (bucket.bing_clicks) existing.bing_clicks += bucket.bing_clicks
      if (bucket.bing_conversions) existing.bing_conversions += bucket.bing_conversions
      monthlyAgg.set(monthKey, existing)
    }

    // Use the combined weekly data to build monthly aggregates
    for (const w of combinedWeeks) {
      const [y, m] = w.week_start.split('-').map(Number)
      const monthKey = `${y}-${String(m).padStart(2, '0')}`
      addToMonth(monthKey, {
        gsc_impressions: w.gsc_impressions,
        gsc_clicks: w.gsc_clicks,
        gads_impressions: w.gads_impressions,
        gads_clicks: w.gads_clicks,
        gads_conversions: w.gads_conversions,
        bing_impressions: w.bing_impressions,
        bing_clicks: w.bing_clicks,
        bing_conversions: w.bing_conversions,
      })
    }

    const currentMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`
    const monthlyData = Array.from(monthlyAgg.entries())
      .sort((a, b) => b[0].localeCompare(a[0]))
      .map(([key, data]) => {
        const [y, m] = key.split('-').map(Number)
        const monthDate = new Date(y, m - 1, 1)
        const isMtd = key === currentMonth
        const total_impressions = data.gsc_impressions + data.gads_impressions + data.bing_impressions
        const total_clicks = data.gsc_clicks + data.gads_clicks + data.bing_clicks
        const total_conversions = Math.round(data.gads_conversions + data.bing_conversions)
        const conv_rate = total_clicks > 0 ? (total_conversions / total_clicks) * 100 : 0
        return {
          month: isMtd
            ? `${monthDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })} (MTD)`
            : monthDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
          month_key: key,
          isMtd,
          ...data,
          total_impressions,
          total_clicks,
          total_conversions,
          conv_rate,
        }
      })

    return NextResponse.json({
      weeklyData,
      monthlyData,
      last_updated: new Date().toISOString(),
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=60',
      },
    })
  } catch (error) {
    console.error('Error fetching combined weekly data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch data', details: String(error) },
      { status: 500 }
    )
  }
}
