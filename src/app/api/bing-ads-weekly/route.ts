import { google } from 'googleapis'
import { NextResponse } from 'next/server'

// Adveronix: Paid Search sheet
const SHEET_ID = '1T8PZjlf2vBz7YTlz1GCXe68UczWGL8_ERYuBLd_r6H0'
const RANGE = 'BING: Account Summary Weekly!A:J'

function parseNumber(val: string): number {
  if (!val) return 0
  const cleaned = val.replace(/[$,]/g, '').replace(/%/g, '')
  return parseFloat(cleaned) || 0
}

function formatDateRange(weekStart: string): string {
  const start = new Date(weekStart)
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
      range: RANGE,
    })

    const rows = response.data.values
    if (!rows || rows.length < 2) {
      return NextResponse.json({ error: 'No data found' }, { status: 404 })
    }

    // Adveronix structure: Week | Ad distribution | Impressions | Clicks | CTR | Avg.CPC | Spend | Conversions | Conv.Rate | CPA
    const allWeeks = rows.slice(1)
      .filter(row => row[0])
      .map(row => ({
        week_start: row[0],
        impressions: parseNumber(row[2]),
        clicks: parseNumber(row[3]),
        ctr: parseNumber(row[4]),
        spend: parseNumber(row[6]),
        conversions: parseNumber(row[7]),
        conv_rate: parseNumber(row[8]),
        cpa: parseNumber(row[9]),
      }))
      .sort((a, b) => a.week_start.localeCompare(b.week_start))

    // Filter to only complete weeks (week end date is before today)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const completeWeeks = allWeeks.filter(w => {
      const start = new Date(w.week_start)
      const weekEnd = new Date(start)
      weekEnd.setDate(start.getDate() + 6)
      return weekEnd < today
    })

    // Get last 6 complete weeks
    const last6 = completeWeeks.slice(-6)

    const weeklyData = last6.map(w => ({
      week: formatDateRange(w.week_start),
      week_start: w.week_start,
      spend: Math.round(w.spend),
      impressions: w.impressions,
      clicks: w.clicks,
      ctr: w.ctr,
      conversions: Math.round(w.conversions),
      conv_rate: w.conv_rate,
      cpa: Math.round(w.cpa),
      roas: w.spend > 0 && w.conversions > 0 ? (w.conversions * 100) / w.spend : 0,
    })).reverse() // Most recent first

    return NextResponse.json({
      data: weeklyData,
      last_updated: new Date().toISOString()
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=60',
      },
    })
  } catch (error) {
    console.error('Error fetching Bing Ads weekly data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch data' },
      { status: 500 }
    )
  }
}
