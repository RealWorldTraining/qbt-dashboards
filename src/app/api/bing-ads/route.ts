import { google } from 'googleapis'
import { NextResponse } from 'next/server'

const SHEET_ID = '1INXxnW3WVkENN7Brvo3sgPcs96C06r3O6mEkgEABxk8'
const RANGE = 'Bing Paid: Weekly Account Summary!A:I'

interface WeeklyRow {
  week: string
  impressions: number
  clicks: number
  ctr: number
  avg_cpc: number
  spend: number
  conversions: number
  conv_rate: number
  cpa: number
}

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

    // Parse all rows (skip header)
    // Columns: A=Week, B=Impressions, C=Clicks, D=CTR, E=Avg CPC, F=Spend, G=Conversions, H=Conv Rate, I=CPA
    const allWeeks: WeeklyRow[] = rows.slice(1)
      .filter(row => row[0])
      .map(row => ({
        week: row[0],
        impressions: parseNumber(row[1]),
        clicks: parseNumber(row[2]),
        ctr: parseNumber(row[3]),
        avg_cpc: parseNumber(row[4]),
        spend: parseNumber(row[5]),
        conversions: parseNumber(row[6]),
        conv_rate: parseNumber(row[7]),
        cpa: parseNumber(row[8]),
      }))
      .sort((a, b) => a.week.localeCompare(b.week))

    // Filter to only COMPLETE weeks (where week_end < today in CST)
    const nowCST = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Chicago' }))
    const todayCST = new Date(nowCST.getFullYear(), nowCST.getMonth(), nowCST.getDate())
    
    const completeWeeks = allWeeks.filter(w => {
      if (!w.week) return false
      const weekStart = new Date(w.week)
      const weekEnd = new Date(weekStart)
      weekEnd.setDate(weekStart.getDate() + 6)
      return weekEnd < todayCST
    })
    
    // Get last 4 complete weeks
    const last4 = completeWeeks.slice(-4).reverse()

    const formatWeek = (w: WeeklyRow, label: string) => ({
      week_label: label,
      date_range: formatDateRange(w.week),
      spend: Math.round(w.spend),
      impressions: w.impressions,
      clicks: w.clicks,
      ctr: w.ctr,
      conversions: Math.round(w.conversions),
      conversion_rate: w.conv_rate,
      cpa: Math.round(w.cpa),
      roas: w.spend > 0 ? (w.conversions * 100 / w.spend) : 0, // Placeholder ROAS calc
    })

    const data = {
      this_week: formatWeek(last4[0], 'Last Week'),
      last_week: formatWeek(last4[1], '2 Weeks Ago'),
      two_weeks_ago: formatWeek(last4[2], '3 Weeks Ago'),
      three_weeks_ago: formatWeek(last4[3], '4 Weeks Ago'),
      last_updated: new Date().toISOString(),
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error fetching Bing Ads data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch data', details: String(error) },
      { status: 500 }
    )
  }
}
