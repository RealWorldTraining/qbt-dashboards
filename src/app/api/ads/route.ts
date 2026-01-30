import { google } from 'googleapis'
import { NextResponse } from 'next/server'

const SHEET_ID = '1WeRmk0bZ-OU6jnbk0pfC1s3xK32WCwAIlTUa0-jYcuM'
const RANGE = 'Weekly_Summary!A:N'

interface WeeklyRow {
  week_start: string
  week_end: string
  week_num: number
  year: number
  platform: string
  spend: number
  impressions: number
  clicks: number
  ctr: number
  avg_cpc: number
  conversions: number
  conv_rate: number
  cpa: number
  conv_value: number
}

function parseNumber(val: string): number {
  if (!val) return 0
  // Remove commas and % signs
  const cleaned = val.replace(/,/g, '').replace(/%/g, '')
  return parseFloat(cleaned) || 0
}

function formatDateRange(start: string, end: string): string {
  const startDate = new Date(start)
  const endDate = new Date(end)
  const opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' }
  return `${startDate.toLocaleDateString('en-US', opts)} - ${endDate.toLocaleDateString('en-US', opts)}`
}

export async function GET() {
  try {
    // Get credentials from environment variable (base64 encoded JSON)
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

    // Skip header, parse all rows
    const allWeeks: WeeklyRow[] = rows.slice(1).map((row) => ({
      week_start: row[0] || '',
      week_end: row[1] || '',
      week_num: parseInt(row[2]) || 0,
      year: parseInt(row[3]) || 0,
      platform: row[4] || '',
      spend: parseNumber(row[5]),
      impressions: parseNumber(row[6]),
      clicks: parseNumber(row[7]),
      ctr: parseNumber(row[8]),
      avg_cpc: parseNumber(row[9]),
      conversions: parseNumber(row[10]),
      conv_rate: parseNumber(row[11]),
      cpa: parseNumber(row[12]),
      conv_value: parseNumber(row[13]),
    }))

    // Get last 4 weeks (most recent at the end)
    const last4 = allWeeks.slice(-4).reverse() // [this_week, last_week, 2_weeks, 3_weeks]

    const formatWeek = (w: WeeklyRow, label: string) => ({
      week_label: label,
      date_range: formatDateRange(w.week_start, w.week_end),
      spend: w.spend,
      impressions: w.impressions,
      clicks: w.clicks,
      ctr: w.ctr,
      conversions: Math.round(w.conversions), // Whole numbers per Aaron
      conversion_rate: w.conv_rate,
      cpa: Math.round(w.cpa), // Whole numbers per Aaron
      roas: w.conv_value / w.spend,
    })

    const data = {
      this_week: formatWeek(last4[0], 'This Week'),
      last_week: formatWeek(last4[1], 'Last Week'),
      two_weeks_ago: formatWeek(last4[2], '2 Weeks Ago'),
      three_weeks_ago: formatWeek(last4[3], '3 Weeks Ago'),
      last_updated: new Date().toISOString(),
    }

    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=60',
      },
    })
  } catch (error) {
    console.error('Error fetching ads data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch data' },
      { status: 500 }
    )
  }
}
