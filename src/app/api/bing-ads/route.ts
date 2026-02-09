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
  // Get Monday of the week containing this date
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
      range: RANGE,
    })

    const rows = response.data.values
    if (!rows || rows.length < 2) {
      return NextResponse.json({ error: 'No data found' }, { status: 404 })
    }

    // Adveronix structure (daily): Date | Ad distribution | Impressions | Clicks | CTR | Avg.CPC | Spend | Conversions | Conv.Rate | CPA
    // Aggregate daily data into weeks
    const weeklyAgg = new Map<string, {
      week_start: string
      impressions: number
      clicks: number
      spend: number
      conversions: number
      conv_value: number
    }>()
    
    rows.slice(1).forEach(row => {
      const dateStr = row[0]
      if (!dateStr) return
      
      const date = parseDate(dateStr)
      const weekStart = getWeekStart(date)
      
      const existing = weeklyAgg.get(weekStart) || {
        week_start: weekStart,
        impressions: 0,
        clicks: 0,
        spend: 0,
        conversions: 0,
        conv_value: 0,
      }
      
      existing.impressions += parseNumber(row[2])
      existing.clicks += parseNumber(row[3])
      existing.spend += parseNumber(row[6])
      existing.conversions += parseNumber(row[7])
      // Bing sheet doesn't have conv_value, use 0
      
      weeklyAgg.set(weekStart, existing)
    })
    
    const allWeeks = Array.from(weeklyAgg.values())
      .map(w => ({
        week_start: w.week_start,
        impressions: w.impressions,
        clicks: w.clicks,
        ctr: w.impressions > 0 ? (w.clicks / w.impressions) * 100 : 0,
        avg_cpc: w.clicks > 0 ? w.spend / w.clicks : 0,
        spend: w.spend,
        conversions: w.conversions,
        conv_rate: w.clicks > 0 ? (w.conversions / w.clicks) * 100 : 0,
        cpa: w.conversions > 0 ? w.spend / w.conversions : 0,
      }))
      .sort((a, b) => a.week_start.localeCompare(b.week_start))

    // Filter out current week (incomplete)
    const now = new Date()
    const currentWeekStart = getWeekStart(now)
    const completeWeeks = allWeeks.filter(w => w.week_start < currentWeekStart)

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
      this_week: formatWeek(last4[0], 'Prior Week'),
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
