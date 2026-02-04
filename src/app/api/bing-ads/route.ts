import { google } from 'googleapis'
import { NextResponse } from 'next/server'

// Use Adveronix sheet (same as bing-ads-weekly)
const SHEET_ID = '1T8PZjlf2vBz7YTlz1GCXe68UczWGL8_ERYuBLd_r6H0'
const RANGE = 'BING: Account Summary Weekly!A:J'

function parseNumber(val: string): number {
  if (!val) return 0
  const cleaned = val.replace(/[$,]/g, '').replace(/%/g, '')
  return parseFloat(cleaned) || 0
}

function formatDateRange(weekStart: string): string {
  const [year, month, day] = weekStart.split('-').map(Number)
  const start = new Date(year, month - 1, day)
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
        avg_cpc: parseNumber(row[5]),
        spend: parseNumber(row[6]),
        conversions: parseNumber(row[7]),
        conv_rate: parseNumber(row[8]),
        cpa: parseNumber(row[9]),
      }))
      .sort((a, b) => a.week_start.localeCompare(b.week_start))

    // Filter to only COMPLETE weeks (where week_end < today in CST)
    const nowCST = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Chicago' }))
    const todayCST = new Date(nowCST.getFullYear(), nowCST.getMonth(), nowCST.getDate())
    
    const completeWeeks = allWeeks.filter(w => {
      if (!w.week_start) return false
      const [year, month, day] = w.week_start.split('-').map(Number)
      const weekStart = new Date(year, month - 1, day)
      const weekEnd = new Date(weekStart)
      weekEnd.setDate(weekStart.getDate() + 6)
      return weekEnd < todayCST
    })

    // Get last 4 complete weeks (most recent first)
    const last4 = completeWeeks.slice(-4).reverse()

    const formatWeek = (w: typeof allWeeks[0] | undefined, label: string) => {
      if (!w) {
        return {
          week_label: label,
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
      }
      
      // Calculate CPA if not provided or zero
      const calculatedCPA = w.conversions > 0 ? w.spend / w.conversions : 0
      const cpa = w.cpa > 0 ? w.cpa : calculatedCPA
      
      return {
        week_label: label,
        date_range: formatDateRange(w.week_start),
        spend: Math.round(w.spend),
        impressions: Math.round(w.impressions),
        clicks: Math.round(w.clicks),
        ctr: Math.round(w.ctr * 100) / 100,
        conversions: Math.round(w.conversions),
        conversion_rate: Math.round(w.conv_rate * 100) / 100,
        cpa: Math.round(cpa),
        roas: w.spend > 0 && w.conversions > 0 ? Math.round((w.conversions * 100) / w.spend * 100) / 100 : 0,
      }
    }

    const data = {
      this_week: formatWeek(last4[0], 'Last Week'),
      last_week: formatWeek(last4[1], '2 Weeks Ago'),
      two_weeks_ago: formatWeek(last4[2], '3 Weeks Ago'),
      three_weeks_ago: formatWeek(last4[3], '4 Weeks Ago'),
      last_updated: new Date().toISOString(),
    }

    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=60',
      },
    })
  } catch (error) {
    console.error('Error fetching Bing Ads data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch data', details: String(error) },
      { status: 500 }
    )
  }
}
