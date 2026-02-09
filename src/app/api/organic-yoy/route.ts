import { google } from 'googleapis'
import { NextResponse } from 'next/server'

// Adveronix: Paid Search sheet
const SHEET_ID = '1T8PZjlf2vBz7YTlz1GCXe68UczWGL8_ERYuBLd_r6H0'
const ACCOUNT_RANGE = 'GA4: Traffic Weekly Account!A:E'

function parseNumber(val: string): number {
  if (!val) return 0
  const cleaned = val.replace(/[,$%]/g, '')
  return parseFloat(cleaned) || 0
}

function parseDate(dateStr: string): Date {
  if (dateStr.includes('/')) {
    const [month, day, year] = dateStr.split('/').map(Number)
    return new Date(year, month - 1, day)
  } else {
    const [year, month, day] = dateStr.split('-').map(Number)
    return new Date(year, month - 1, day)
  }
}

function getWeekStart(date: Date): string {
  const dayOfWeek = date.getDay()
  const daysToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
  const monday = new Date(date)
  monday.setDate(date.getDate() + daysToMonday)
  const year = monday.getFullYear()
  const month = String(monday.getMonth() + 1).padStart(2, '0')
  const day = String(monday.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function formatDateRange(weekStart: string): string {
  const start = parseDate(weekStart)
  const end = new Date(start)
  end.setDate(start.getDate() + 6)
  const opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' }
  return `${start.toLocaleDateString('en-US', opts)} - ${end.toLocaleDateString('en-US', opts)}`
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
      range: ACCOUNT_RANGE,
    })

    const rows = response.data.values
    if (!rows || rows.length < 2) {
      return NextResponse.json({ error: 'No data found' }, { status: 404 })
    }

    // Aggregate by week
    // Structure: Date | Account | New users | Total users | Ecommerce purchases
    const weeklyData = new Map<string, { users: number; purchases: number }>()
    
    rows.slice(1).forEach(row => {
      const dateStr = row[0]
      if (!dateStr) return
      
      const date = parseDate(dateStr)
      const weekKey = getWeekStart(date)
      
      const users = parseNumber(row[2]) // New users column
      const purchases = parseNumber(row[4]) // Ecommerce purchases column
      
      const existing = weeklyData.get(weekKey) || { users: 0, purchases: 0 }
      existing.users += users
      existing.purchases += purchases
      weeklyData.set(weekKey, existing)
    })

    // Get current week start and last 5 weeks (including current week)
    const now = new Date()
    const currentWeekStart = getWeekStart(now)
    
    const sortedWeeks = Array.from(weeklyData.keys()).sort().reverse()
    const currentWeekIndex = sortedWeeks.indexOf(currentWeekStart)
    const last5Weeks = currentWeekIndex >= 0 
      ? sortedWeeks.slice(currentWeekIndex, currentWeekIndex + 5)
      : sortedWeeks.slice(0, 5)

    // For each week, find the corresponding week from last year
    const weeksData = last5Weeks.map((weekKey, idx) => {
      const weekDate = parseDate(weekKey)
      
      // Get same week from last year (subtract 52 weeks = 364 days)
      const lastYearDate = new Date(weekDate)
      lastYearDate.setDate(weekDate.getDate() - (52 * 7))
      const lastYearWeekKey = getWeekStart(lastYearDate)
      
      const currentData = weeklyData.get(weekKey) || { users: 0, purchases: 0 }
      const lastYearData = weeklyData.get(lastYearWeekKey) || { users: 0, purchases: 0 }
      
      const convRate = currentData.users > 0 ? (currentData.purchases / currentData.users) * 100 : 0
      const lastYearConvRate = lastYearData.users > 0 ? (lastYearData.purchases / lastYearData.users) * 100 : 0
      
      const labels = ['This Week', 'Last Week', '2 Weeks Ago', '3 Weeks Ago', '4 Weeks Ago']
      
      return {
        week_key: weekKey,
        label: labels[idx] || `${idx} weeks ago`,
        date_range: formatDateRange(weekKey),
        users: currentData.users,
        purchases: currentData.purchases,
        conversion_rate: convRate,
        yoy: {
          week_key: lastYearWeekKey,
          date_range: formatDateRange(lastYearWeekKey),
          users: lastYearData.users,
          purchases: lastYearData.purchases,
          conversion_rate: lastYearConvRate,
          users_change: currentData.users - lastYearData.users,
          users_change_pct: lastYearData.users > 0 ? ((currentData.users - lastYearData.users) / lastYearData.users) * 100 : 0,
          purchases_change: currentData.purchases - lastYearData.purchases,
          purchases_change_pct: lastYearData.purchases > 0 ? ((currentData.purchases - lastYearData.purchases) / lastYearData.purchases) * 100 : 0,
          conv_rate_change: convRate - lastYearConvRate,
          conv_rate_change_pct: lastYearConvRate > 0 ? ((convRate - lastYearConvRate) / lastYearConvRate) * 100 : 0,
        }
      }
    })

    return NextResponse.json({
      weeks: weeksData,
      last_updated: new Date().toISOString()
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=60',
      },
    })
  } catch (error) {
    console.error('Error fetching organic YoY data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch data', details: String(error) },
      { status: 500 }
    )
  }
}
