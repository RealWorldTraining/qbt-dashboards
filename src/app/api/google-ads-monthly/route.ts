import { google } from 'googleapis'
import { NextResponse } from 'next/server'

// Use Adveronix sheet (same as google-ads-weekly)
const SHEET_ID = '1T8PZjlf2vBz7YTlz1GCXe68UczWGL8_ERYuBLd_r6H0'
const RANGE = 'GADS: Account: Weekly (Devices)!A:L'

interface WeeklyRow {
  week_start: string
  week_end: string
  spend: number
  impressions: number
  clicks: number
  conversions: number
  conv_value: number
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

    // Aggregate by week first (sum across device types)
    // Columns: A=week_start, B=week_end, C=device, D=spend, E=impressions, F=clicks, G=ctr, H=avg_cpc, I=conversions, J=conv_rate, K=cost_per_conv, L=conv_value
    const weeklyAgg = new Map<string, WeeklyRow>()
    
    rows.slice(1).forEach(row => {
      const weekStart = row[0]
      const weekEnd = row[1]
      if (!weekStart || !weekEnd) return
      
      const key = weekStart
      const existing = weeklyAgg.get(key) || {
        week_start: weekStart,
        week_end: weekEnd,
        spend: 0,
        impressions: 0,
        clicks: 0,
        conversions: 0,
        conv_value: 0,
      }
      
      existing.spend += parseNumber(row[3])
      existing.impressions += parseNumber(row[4])
      existing.clicks += parseNumber(row[5])
      existing.conversions += parseNumber(row[8])
      existing.conv_value += parseNumber(row[11])
      
      weeklyAgg.set(key, existing)
    })

    // Filter to only COMPLETE weeks (where week_end < today in CST)
    const nowCST = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Chicago' }))
    const todayCST = new Date(nowCST.getFullYear(), nowCST.getMonth(), nowCST.getDate())
    
    const completeWeeks = Array.from(weeklyAgg.values()).filter(w => {
      if (!w.week_end) return false
      const [year, month, day] = w.week_end.split('-').map(Number)
      const weekEnd = new Date(year, month - 1, day)
      return weekEnd < todayCST
    })

    // Aggregate by month
    const monthlyData = new Map<string, { spend: number; impressions: number; clicks: number; conversions: number; conv_value: number }>()
    
    completeWeeks.forEach(week => {
      const monthKey = getMonthKey(week.week_start)
      const existing = monthlyData.get(monthKey) || { spend: 0, impressions: 0, clicks: 0, conversions: 0, conv_value: 0 }
      existing.spend += week.spend
      existing.impressions += week.impressions
      existing.clicks += week.clicks
      existing.conversions += week.conversions
      existing.conv_value += week.conv_value
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
        roas: data.spend > 0 ? Math.round((data.conv_value / data.spend) * 100) / 100 : 0,
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
    console.error('Error fetching Google Ads monthly data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch data', details: String(error) },
      { status: 500 }
    )
  }
}
