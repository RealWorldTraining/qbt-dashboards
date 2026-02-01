import { google } from 'googleapis'
import { NextResponse } from 'next/server'

const SHEET_ID = '1WeRmk0bZ-OU6jnbk0pfC1s3xK32WCwAIlTUa0-jYcuM'
const RANGE = 'Weekly_Summary!A:N'

interface WeeklyRow {
  week_start: string
  spend: number
  impressions: number
  clicks: number
  conversions: number
  conv_value: number
}

function parseNumber(val: string): number {
  if (!val) return 0
  const cleaned = val.replace(/,/g, '').replace(/%/g, '')
  return parseFloat(cleaned) || 0
}

function getMonthKey(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
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
    const allWeeks: WeeklyRow[] = rows.slice(1).map((row) => ({
      week_start: row[0] || '',
      spend: parseNumber(row[5]),
      impressions: parseNumber(row[6]),
      clicks: parseNumber(row[7]),
      conversions: parseNumber(row[10]),
      conv_value: parseNumber(row[13]),
    })).filter(w => w.week_start)

    // Aggregate by month
    const monthlyMap = new Map<string, {
      spend: number
      impressions: number
      clicks: number
      conversions: number
      conv_value: number
    }>()

    allWeeks.forEach(week => {
      const monthKey = getMonthKey(week.week_start)
      const existing = monthlyMap.get(monthKey) || {
        spend: 0,
        impressions: 0,
        clicks: 0,
        conversions: 0,
        conv_value: 0,
      }
      monthlyMap.set(monthKey, {
        spend: existing.spend + week.spend,
        impressions: existing.impressions + week.impressions,
        clicks: existing.clicks + week.clicks,
        conversions: existing.conversions + week.conversions,
        conv_value: existing.conv_value + week.conv_value,
      })
    })

    // Convert to array and sort by date
    const monthlyData = Array.from(monthlyMap.entries())
      .map(([month, data]) => ({
        month,
        spend: Math.round(data.spend),
        impressions: data.impressions,
        clicks: data.clicks,
        conversions: Math.round(data.conversions),
        ctr: data.impressions > 0 ? (data.clicks / data.impressions) * 100 : 0,
        conv_rate: data.clicks > 0 ? (data.conversions / data.clicks) * 100 : 0,
        cpa: data.conversions > 0 ? data.spend / data.conversions : 0,
        roas: data.spend > 0 ? data.conv_value / data.spend : 0,
      }))
      .sort((a, b) => {
        const dateA = new Date(a.month)
        const dateB = new Date(b.month)
        return dateA.getTime() - dateB.getTime()
      })
      .slice(-13) // Last 13 months

    return NextResponse.json({
      data: monthlyData,
      last_updated: new Date().toISOString()
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=60',
      },
    })
  } catch (error) {
    console.error('Error fetching Google Ads monthly data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch data' },
      { status: 500 }
    )
  }
}
