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

    // Filter to only COMPLETE weeks (where week_end < today in CST)
    const nowCST = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Chicago' }))
    const todayCST = new Date(nowCST.getFullYear(), nowCST.getMonth(), nowCST.getDate())
    
    const completeWeeks = allWeeks.filter(w => {
      if (!w.week_end) return false
      const [year, month, day] = w.week_end.split('-').map(Number)
      const weekEnd = new Date(year, month - 1, day)
      return weekEnd < todayCST
    })
    
    // Get last 4 complete weeks (most recent first)
    const last4 = completeWeeks.slice(-4).reverse()

    const formatWeek = (w: WeeklyRow, label: string) => {
      // Calculate CPA ourselves since sheet may have 0
      const calculatedCPA = w.conversions > 0 ? w.spend / w.conversions : 0
      return {
        week_label: label,
        date_range: formatDateRange(w.week_start, w.week_end),
        spend: Math.round(w.spend),
        impressions: w.impressions,
        clicks: w.clicks,
        ctr: w.ctr,
        conversions: Math.round(w.conversions),
        conversion_rate: w.conv_rate,
        cpa: Math.round(calculatedCPA), // Calculate: spend / conversions
        roas: w.spend > 0 ? w.conv_value / w.spend : 0,
      }
    }

    const emptyWeek = {
      week_label: 'N/A',
      date_range: 'No data',
      spend: 0,
      impressions: 0,
      clicks: 0,
      ctr: 0,
      conversions: 0,
      conversion_rate: 0,
      cpa: 0,
      roas: 0,
    }

    const data = {
      this_week: last4[0] ? formatWeek(last4[0], 'Last Week') : emptyWeek,
      last_week: last4[1] ? formatWeek(last4[1], '2 Weeks Ago') : emptyWeek,
      two_weeks_ago: last4[2] ? formatWeek(last4[2], '3 Weeks Ago') : emptyWeek,
      three_weeks_ago: last4[3] ? formatWeek(last4[3], '4 Weeks Ago') : emptyWeek,
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
