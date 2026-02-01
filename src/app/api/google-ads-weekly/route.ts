import { google } from 'googleapis'
import { NextResponse } from 'next/server'

const SHEET_ID = '1WeRmk0bZ-OU6jnbk0pfC1s3xK32WCwAIlTUa0-jYcuM'
const RANGE = 'Weekly_Summary!A:N'

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

    // Parse all rows
    const allWeeks = rows.slice(1).map((row) => ({
      week_start: row[0] || '',
      week_end: row[1] || '',
      spend: parseNumber(row[5]),
      impressions: parseNumber(row[6]),
      clicks: parseNumber(row[7]),
      ctr: parseNumber(row[8]),
      avg_cpc: parseNumber(row[9]),
      conversions: parseNumber(row[10]),
      conv_rate: parseNumber(row[11]),
      cpa: parseNumber(row[12]),
      conv_value: parseNumber(row[13]),
    })).filter(w => w.week_start)

    // Get last 6 complete weeks
    // A week is complete if its end date is before today
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const completeWeeks = allWeeks.filter(w => {
      const [year, month, day] = w.week_end.split('-').map(Number)
      const weekEnd = new Date(year, month - 1, day)
      return weekEnd < today
    })
    
    const last6Complete = completeWeeks.slice(-6)

    const weeklyData = last6Complete.map(w => ({
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

    return NextResponse.json({
      data: weeklyData,
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
