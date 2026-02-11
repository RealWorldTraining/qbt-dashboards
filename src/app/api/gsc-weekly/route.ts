import { google } from 'googleapis'
import { NextResponse } from 'next/server'

// Adveronix: Paid Search sheet
const SHEET_ID = '1T8PZjlf2vBz7YTlz1GCXe68UczWGL8_ERYuBLd_r6H0'
const RANGE = 'GSC: Account Daily!A:D'

function parseNumber(val: string): number {
  if (!val) return 0
  const cleaned = val.replace(/[,$%]/g, '')
  return parseFloat(cleaned) || 0
}

// Normalize date strings to YYYY-MM-DD format
// Handles: M/D/YYYY, MM/DD/YYYY, YYYY-MM-DD, Excel serial numbers
function normalizeDate(dateStr: string): string {
  if (!dateStr) return ''
  const trimmed = dateStr.trim()
  // Already YYYY-MM-DD
  if (/^\d{4}-\d{1,2}-\d{1,2}$/.test(trimmed)) return trimmed
  // M/D/YYYY or MM/DD/YYYY
  if (trimmed.includes('/')) {
    const parts = trimmed.split('/')
    if (parts.length === 3) {
      const [m, d, y] = parts.map(Number)
      if (!isNaN(m) && !isNaN(d) && !isNaN(y)) {
        return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`
      }
    }
  }
  // Excel serial date number
  const num = Number(trimmed)
  if (!isNaN(num) && num > 40000 && num < 60000) {
    const epoch = new Date(1899, 11, 30)
    const date = new Date(epoch.getTime() + num * 86400000)
    return date.toISOString().split('T')[0]
  }
  return trimmed
}

function formatDateRange(start: string, end: string): string {
  const [startYear, startMonth, startDay] = start.split('-').map(Number)
  const [endYear, endMonth, endDay] = end.split('-').map(Number)

  const startDate = new Date(startYear, startMonth - 1, startDay)
  const endDate = new Date(endYear, endMonth - 1, endDay)

  const opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' }
  return `${startDate.toLocaleDateString('en-US', opts)} - ${endDate.toLocaleDateString('en-US', opts)}`
}

function getWeekStart(dateStr: string): string {
  // Get the Sunday of the week containing this date
  const [year, month, day] = dateStr.split('-').map(Number)
  const date = new Date(year, month - 1, day)
  const dayOfWeek = date.getDay() // 0 = Sunday, 6 = Saturday
  const sunday = new Date(date)
  sunday.setDate(date.getDate() - dayOfWeek)
  return sunday.toISOString().split('T')[0]
}

function getWeekEnd(weekStart: string): string {
  // Get the Saturday (6 days after Sunday)
  const [year, month, day] = weekStart.split('-').map(Number)
  const sunday = new Date(year, month - 1, day)
  const saturday = new Date(sunday)
  saturday.setDate(sunday.getDate() + 6)
  return saturday.toISOString().split('T')[0]
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

    // Detect columns by header name (case-insensitive)
    const headers = rows[0].map((h: string) => h?.toLowerCase().trim() || '')
    const dateCol = headers.findIndex((h: string) => h.includes('date'))
    const impCol = headers.findIndex((h: string) => h.includes('impression'))
    const clickCol = headers.findIndex((h: string) => h.includes('click'))

    // Fallback to positional if headers not found
    const colDate = dateCol >= 0 ? dateCol : 0
    const colImp = impCol >= 0 ? impCol : 1
    const colClick = clickCol >= 0 ? clickCol : 2

    // Aggregate daily data into weeks (Sunday-Saturday)
    const weeklyAgg = new Map<string, { impressions: number; clicks: number }>()

    rows.slice(1).forEach(row => {
      const rawDate = row[colDate]
      if (!rawDate) return
      const date = normalizeDate(rawDate)
      if (!date) return

      const weekStart = getWeekStart(date)
      const existing = weeklyAgg.get(weekStart) || { impressions: 0, clicks: 0 }

      existing.impressions += parseNumber(row[colImp])
      existing.clicks += parseNumber(row[colClick])

      weeklyAgg.set(weekStart, existing)
    })

    // Convert to array and sort by date (most recent first)
    const allWeeks: WeekData[] = Array.from(weeklyAgg.entries())
      .map(([weekStart, data]) => {
        const weekEnd = getWeekEnd(weekStart)
        const year = parseInt(weekStart.split('-')[0])
        
        return {
          week: formatDateRange(weekStart, weekEnd),
          week_start: weekStart,
          week_end: weekEnd,
          year,
          impressions: data.impressions,
          clicks: data.clicks,
          ctr: data.impressions > 0 ? (data.clicks / data.impressions) * 100 : 0,
          queries: 0 // Not available in account-level data
        }
      })
      .sort((a, b) => b.week_start.localeCompare(a.week_start))

    // Filter to complete weeks only (week end date is before today)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const completeWeeks = allWeeks.filter(w => {
      const [year, month, day] = w.week_end.split('-').map(Number)
      const weekEnd = new Date(year, month - 1, day)
      return weekEnd < today
    })

    // Get last 14 weeks for current year and matching weeks from previous year
    const last14Weeks = completeWeeks.slice(0, 14)
    const currentYearWeeks = last14Weeks.filter(w => w.year === new Date().getFullYear())

    // Find year-over-year comparison weeks (same weeks from previous year)
    const yoyWeeks: WeekData[] = []
    for (const currentWeek of currentYearWeeks.slice(0, 4)) {
      const [year, month, day] = currentWeek.week_start.split('-').map(Number)
      const lastYearWeekStart = `${year - 1}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
      const yoyWeek = allWeeks.find(w => w.week_start === lastYearWeekStart)
      if (yoyWeek) {
        yoyWeeks.push(yoyWeek)
      }
    }

    // Aggregate daily data into months (reusing dynamic column indices)
    const monthlyAgg = new Map<string, { impressions: number; clicks: number }>()
    rows.slice(1).forEach(row => {
      const rawDate = row[colDate]
      if (!rawDate) return
      const date = normalizeDate(rawDate)
      if (!date) return
      const [y, m] = date.split('-').map(Number)
      if (isNaN(y) || isNaN(m)) return
      const monthKey = `${y}-${String(m).padStart(2, '0')}`
      const existing = monthlyAgg.get(monthKey) || { impressions: 0, clicks: 0 }
      existing.impressions += parseNumber(row[colImp])
      existing.clicks += parseNumber(row[colClick])
      monthlyAgg.set(monthKey, existing)
    })

    // Convert to sorted array (most recent first), include current month as MTD
    const currentMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`
    const monthlyData = Array.from(monthlyAgg.entries())
      .sort((a, b) => b[0].localeCompare(a[0]))
      .map(([key, data]) => {
        const [y, m] = key.split('-').map(Number)
        const monthDate = new Date(y, m - 1, 1)
        const isMtd = key === currentMonth
        return {
          month: isMtd
            ? `${monthDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })} (MTD)`
            : monthDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
          month_key: key,
          impressions: data.impressions,
          clicks: data.clicks,
          ctr: data.impressions > 0 ? (data.clicks / data.impressions) * 100 : 0,
          isMtd,
        }
      })

    return NextResponse.json({
      data: last14Weeks,
      monthlyData,
      yoyData: yoyWeeks.length === 4 ? yoyWeeks : null,
      _debug: {
        headers: rows[0],
        columnMapping: { date: colDate, impressions: colImp, clicks: colClick },
        totalRows: rows.length - 1,
        sampleRow: rows[1],
      },
      last_updated: new Date().toISOString()
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
