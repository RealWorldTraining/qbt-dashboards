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

    // Aggregate daily data into weeks (Sunday-Saturday)
    const weeklyAgg = new Map<string, { impressions: number; clicks: number }>()
    
    rows.slice(1).forEach(row => {
      const date = row[0]
      if (!date) return
      
      const weekStart = getWeekStart(date)
      const existing = weeklyAgg.get(weekStart) || { impressions: 0, clicks: 0 }
      
      existing.impressions += parseNumber(row[1])
      existing.clicks += parseNumber(row[2])
      
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

    // Aggregate daily data into months
    const monthlyAgg = new Map<string, { impressions: number; clicks: number }>()
    rows.slice(1).forEach(row => {
      const date = row[0]
      if (!date) return
      const [y, m] = date.split('-').map(Number)
      const monthKey = `${y}-${String(m).padStart(2, '0')}`
      const existing = monthlyAgg.get(monthKey) || { impressions: 0, clicks: 0 }
      existing.impressions += parseNumber(row[1])
      existing.clicks += parseNumber(row[2])
      monthlyAgg.set(monthKey, existing)
    })

    // Convert to sorted array (most recent first), exclude current month (incomplete)
    const currentMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`
    const monthlyData = Array.from(monthlyAgg.entries())
      .filter(([key]) => key !== currentMonth)
      .sort((a, b) => b[0].localeCompare(a[0]))
      .slice(0, 14)
      .map(([key, data]) => {
        const [y, m] = key.split('-').map(Number)
        const monthDate = new Date(y, m - 1, 1)
        return {
          month: monthDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
          month_key: key,
          impressions: data.impressions,
          clicks: data.clicks,
          ctr: data.impressions > 0 ? (data.clicks / data.impressions) * 100 : 0,
        }
      })

    return NextResponse.json({
      data: last14Weeks,
      monthlyData,
      yoyData: yoyWeeks.length === 4 ? yoyWeeks : null,
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
