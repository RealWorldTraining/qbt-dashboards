import { google } from 'googleapis'
import { NextResponse } from 'next/server'

// Use Adveronix sheet
const SHEET_ID = '1T8PZjlf2vBz7YTlz1GCXe68UczWGL8_ERYuBLd_r6H0'
const RANGE = 'BING: Account Summary Weekly!A:J'

interface WeeklyRow {
  week: string
  impressions: number
  clicks: number
  spend: number
  conversions: number
  cpa: number
}

function parseNumber(val: string): number {
  if (!val) return 0
  const cleaned = val.replace(/[$,]/g, '').replace(/%/g, '')
  return parseFloat(cleaned) || 0
}

function getMonthKey(dateStr: string): string {
  const [year, month] = dateStr.split('-').map(Number)
  const date = new Date(year, month - 1, 1)
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

    // Adveronix structure: Week | Ad distribution | Impressions | Clicks | CTR | Avg.CPC | Spend | Conversions | Conv.Rate | CPA
    const allWeeks: WeeklyRow[] = rows.slice(1)
      .filter(row => row[0])
      .map(row => ({
        week: row[0],
        impressions: parseNumber(row[2]),
        clicks: parseNumber(row[3]),
        spend: parseNumber(row[6]),
        conversions: parseNumber(row[7]),
        cpa: parseNumber(row[9]),
      }))

    // Filter to only complete weeks
    const nowCST = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Chicago' }))
    const todayCST = new Date(nowCST.getFullYear(), nowCST.getMonth(), nowCST.getDate())
    
    const completeWeeks = allWeeks.filter(w => {
      if (!w.week) return false
      const [year, month, day] = w.week.split('-').map(Number)
      const weekStart = new Date(year, month - 1, day)
      const weekEnd = new Date(weekStart)
      weekEnd.setDate(weekStart.getDate() + 6)
      return weekEnd < todayCST
    })

    // Aggregate by month
    const monthlyData = new Map<string, { spend: number; impressions: number; clicks: number; conversions: number }>()
    
    completeWeeks.forEach(week => {
      const monthKey = getMonthKey(week.week)
      const existing = monthlyData.get(monthKey) || { spend: 0, impressions: 0, clicks: 0, conversions: 0 }
      existing.spend += week.spend
      existing.impressions += week.impressions
      existing.clicks += week.clicks
      existing.conversions += week.conversions
      monthlyData.set(monthKey, existing)
    })

    // Convert to array and sort by date (most recent first)
    const months = Array.from(monthlyData.entries())
      .map(([month, data]) => ({
        month,
        spend: Math.round(data.spend),
        impressions: Math.round(data.impressions),
        clicks: Math.round(data.clicks),
        conversions: Math.round(data.conversions),
        cpa: data.conversions > 0 ? Math.round(data.spend / data.conversions) : 0,
        ctr: data.impressions > 0 ? Math.round((data.clicks / data.impressions) * 10000) / 100 : 0,
        conv_rate: data.clicks > 0 ? Math.round((data.conversions / data.clicks) * 10000) / 100 : 0,
      }))
      .sort((a, b) => {
        const dateA = new Date(a.month)
        const dateB = new Date(b.month)
        return dateB.getTime() - dateA.getTime()
      })
      .slice(0, 12) // Last 12 months

    return NextResponse.json({
      data: months,
      last_updated: new Date().toISOString()
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=60',
      },
    })
  } catch (error) {
    console.error('Error fetching Bing Ads monthly data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch data', details: String(error) },
      { status: 500 }
    )
  }
}
