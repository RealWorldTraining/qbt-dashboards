import { google } from 'googleapis'
import { NextResponse } from 'next/server'

const SHEET_ID = '1T8PZjlf2vBz7YTlz1GCXe68UczWGL8_ERYuBLd_r6H0'
const LANDING_PAGES_RANGE = 'GA4: Landing Pages!A:E'

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
      range: LANDING_PAGES_RANGE,
    })

    const rows = response.data.values
    if (!rows || rows.length < 2) {
      return NextResponse.json({ error: 'No data found' }, { status: 404 })
    }

    // Structure: Week | Landing page | New users | Total users | Ecommerce purchases
    // Aggregate by week and landing page
    const weeklyData = new Map<string, Map<string, { users: number; purchases: number }>>()
    
    rows.slice(1).forEach(row => {
      const weekStr = row[0]
      const landingPage = row[1]
      if (!weekStr || !landingPage) return
      
      const weekKey = getWeekStart(parseDate(weekStr))
      const users = parseNumber(row[2]) // New users
      const purchases = parseNumber(row[4]) // Ecommerce purchases
      
      if (!weeklyData.has(weekKey)) {
        weeklyData.set(weekKey, new Map())
      }
      
      const weekMap = weeklyData.get(weekKey)!
      const existing = weekMap.get(landingPage) || { users: 0, purchases: 0 }
      existing.users += users
      existing.purchases += purchases
      weekMap.set(landingPage, existing)
    })

    // Get current week start and last 5 weeks (excluding incomplete current week)
    const now = new Date()
    const currentWeekStart = getWeekStart(now)
    
    const sortedWeeks = Array.from(weeklyData.keys()).sort().reverse()
    const completeWeeks = sortedWeeks.filter(w => w < currentWeekStart)
    const last5Weeks = completeWeeks.slice(0, 5)

    // Get top landing pages by total users across all 5 weeks
    const landingPageTotals = new Map<string, { users: number; purchases: number }>()
    
    last5Weeks.forEach(week => {
      const weekMap = weeklyData.get(week)!
      weekMap.forEach((data, page) => {
        const existing = landingPageTotals.get(page) || { users: 0, purchases: 0 }
        existing.users += data.users
        existing.purchases += data.purchases
        landingPageTotals.set(page, existing)
      })
    })

    // Sort landing pages by total users and get top 10
    const topLandingPages = Array.from(landingPageTotals.entries())
      .sort((a, b) => b[1].users - a[1].users)
      .slice(0, 10)
      .map(([page]) => page)

    // Build response data for each landing page
    const labels = ['This Week', 'Last Week', '2 Weeks Ago', '3 Weeks Ago', '4 Weeks Ago']
    
    const landingPagesData = topLandingPages.map(page => {
      const weeks = last5Weeks.map((weekKey, idx) => {
        const weekMap = weeklyData.get(weekKey)!
        const data = weekMap.get(page) || { users: 0, purchases: 0 }
        
        return {
          label: labels[idx],
          date_range: formatDateRange(weekKey),
          users: data.users,
          purchases: data.purchases,
          conversion_rate: data.users > 0 ? (data.purchases / data.users) * 100 : 0
        }
      })
      
      return {
        landing_page: page,
        weeks
      }
    })

    return NextResponse.json({
      landing_pages: landingPagesData,
      last_updated: new Date().toISOString()
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=60',
      },
    })
  } catch (error) {
    console.error('Error fetching landing pages data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch data', details: String(error) },
      { status: 500 }
    )
  }
}
