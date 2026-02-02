import { google } from 'googleapis'
import { NextResponse } from 'next/server'

// Adveronix: Paid Search sheet
const SHEET_ID = '1T8PZjlf2vBz7YTlz1GCXe68UczWGL8_ERYuBLd_r6H0'
const RANGE = 'GSC: Query Daily!A:E'

function parseNumber(val: string): number {
  if (!val) return 0
  const cleaned = val.replace(/[,$%]/g, '')
  return parseFloat(cleaned) || 0
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

function formatWeekLabel(weekStart: string): string {
  const [year, month, day] = weekStart.split('-').map(Number)
  const date = new Date(year, month - 1, day)
  const endDate = new Date(date)
  endDate.setDate(date.getDate() + 6)
  
  const opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' }
  return `${date.toLocaleDateString('en-US', opts).replace(',', '')}-${endDate.getDate()}`
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

    // Aggregate daily keyword data into weeks
    // Structure: Map<weekStart, Map<query, {clicks, impressions}>>
    const weeklyKeywordAgg = new Map<string, Map<string, { clicks: number; impressions: number }>>()
    
    rows.slice(1).forEach(row => {
      const date = row[0]
      const query = row[1]
      if (!date || !query) return
      
      const weekStart = getWeekStart(date)
      
      if (!weeklyKeywordAgg.has(weekStart)) {
        weeklyKeywordAgg.set(weekStart, new Map())
      }
      
      const weekData = weeklyKeywordAgg.get(weekStart)!
      const existing = weekData.get(query) || { clicks: 0, impressions: 0 }
      
      existing.clicks += parseNumber(row[3])
      existing.impressions += parseNumber(row[2])
      
      weekData.set(query, existing)
    })

    // Get the last 4 complete weeks
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const allWeekStarts = Array.from(weeklyKeywordAgg.keys()).sort().reverse()
    
    const completeWeeks = allWeekStarts.filter(weekStart => {
      const [year, month, day] = weekStart.split('-').map(Number)
      const sunday = new Date(year, month - 1, day)
      const saturday = new Date(sunday)
      saturday.setDate(sunday.getDate() + 6)
      return saturday < today
    })

    const last4Weeks = completeWeeks.slice(0, 4)

    // Get top 20 queries by clicks for each of the last 4 weeks
    const keywordData: Array<{
      query: string
      weeks: Array<{ week: string; clicks: number; impressions: number }>
    }> = []

    // Collect all queries that appear in any of the last 4 weeks
    const allQueriesSet = new Set<string>()
    last4Weeks.forEach(weekStart => {
      const weekData = weeklyKeywordAgg.get(weekStart)!
      weekData.forEach((_, query) => allQueriesSet.add(query))
    })

    // For each query, get its data for all 4 weeks
    allQueriesSet.forEach(query => {
      const weeks = last4Weeks.map(weekStart => {
        const weekData = weeklyKeywordAgg.get(weekStart)!
        const queryData = weekData.get(query) || { clicks: 0, impressions: 0 }
        return {
          week: formatWeekLabel(weekStart),
          clicks: queryData.clicks,
          impressions: queryData.impressions
        }
      })

      keywordData.push({ query, weeks })
    })

    // Sort by total clicks across all 4 weeks (descending)
    keywordData.sort((a, b) => {
      const totalA = a.weeks.reduce((sum, w) => sum + w.clicks, 0)
      const totalB = b.weeks.reduce((sum, w) => sum + w.clicks, 0)
      return totalB - totalA
    })

    // Return top 20 keywords
    const top20 = keywordData.slice(0, 20)

    return NextResponse.json({
      data: top20,
      weeks: last4Weeks.map(ws => formatWeekLabel(ws)),
      last_updated: new Date().toISOString()
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=60',
      },
    })
  } catch (error) {
    console.error('Error fetching GSC keyword weekly data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch data', details: String(error) },
      { status: 500 }
    )
  }
}
