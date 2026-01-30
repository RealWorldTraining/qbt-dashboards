import { google } from 'googleapis'
import { NextResponse } from 'next/server'

const SHEET_ID = '1SvvnNc32S7jSW1GP1bonJAoW0bTuNgHh9ERQo6RgcEY'
const RANGE = 'First User Source Medium!A:N'

interface WeeklyRow {
  week_code: string // e.g., "202601"
  google_organic_users: number
  google_organic_purchases: number
  direct_users: number
  direct_purchases: number
  qb_intuit_users: number
  qb_intuit_purchases: number
  bing_organic_users: number
  bing_organic_purchases: number
  bing_cpc_users: number
  bing_cpc_purchases: number
}

function parseNumber(val: string): number {
  if (!val) return 0
  const cleaned = val.replace(/,/g, '').replace(/%/g, '')
  return parseFloat(cleaned) || 0
}

function weekCodeToDateRange(weekCode: string): string {
  // Convert "202604" to date range like "Jan 19 - Jan 25"
  const year = parseInt(weekCode.substring(0, 4))
  const week = parseInt(weekCode.substring(4))
  
  // Calculate the first day of the ISO week
  const jan4 = new Date(year, 0, 4)
  const dayOfWeek = jan4.getDay() || 7
  const firstMonday = new Date(jan4)
  firstMonday.setDate(jan4.getDate() - dayOfWeek + 1)
  
  const weekStart = new Date(firstMonday)
  weekStart.setDate(firstMonday.getDate() + (week - 1) * 7)
  
  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekStart.getDate() + 6)
  
  const opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' }
  return `${weekStart.toLocaleDateString('en-US', opts)} - ${weekEnd.toLocaleDateString('en-US', opts)}`
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

    // Skip header row, parse data
    // Columns: A=week, B/C=?, D=?, E=Direct Users, F=Direct Purchases, 
    // G=Google Organic Users, H=Google Organic Purchases,
    // I=QB Intuit Users, J=QB Intuit Purchases,
    // K=Bing Organic Users, L=Bing Organic Purchases,
    // M=Bing CPC Users, N=Bing CPC Purchases
    const dataRows = rows.slice(1)
    
    const allWeeks: WeeklyRow[] = dataRows
      .filter(row => row[0] && /^\d{6}$/.test(row[0])) // Filter valid week codes
      .map(row => ({
        week_code: row[0],
        direct_users: parseNumber(row[4]),
        direct_purchases: parseNumber(row[5]),
        google_organic_users: parseNumber(row[6]),
        google_organic_purchases: parseNumber(row[7]),
        qb_intuit_users: parseNumber(row[8]),
        qb_intuit_purchases: parseNumber(row[9]),
        bing_organic_users: parseNumber(row[10]),
        bing_organic_purchases: parseNumber(row[11]),
        bing_cpc_users: parseNumber(row[12]),
        bing_cpc_purchases: parseNumber(row[13]),
      }))
      .sort((a, b) => a.week_code.localeCompare(b.week_code))

    // Get last 5 weeks (skip current incomplete week)
    const last5 = allWeeks.slice(-5).reverse()

    const formatWeek = (w: WeeklyRow, label: string) => ({
      week_label: label,
      date_range: weekCodeToDateRange(w.week_code),
      google_organic: {
        users: w.google_organic_users,
        purchases: w.google_organic_purchases,
        conv_rate: w.google_organic_users > 0 
          ? (w.google_organic_purchases / w.google_organic_users * 100) 
          : 0
      },
      direct: {
        users: w.direct_users,
        purchases: w.direct_purchases,
        conv_rate: w.direct_users > 0 
          ? (w.direct_purchases / w.direct_users * 100) 
          : 0
      },
      bing_organic: {
        users: w.bing_organic_users,
        purchases: w.bing_organic_purchases,
        conv_rate: w.bing_organic_users > 0 
          ? (w.bing_organic_purchases / w.bing_organic_users * 100) 
          : 0
      },
      qb_intuit: {
        users: w.qb_intuit_users,
        purchases: w.qb_intuit_purchases,
        conv_rate: w.qb_intuit_users > 0 
          ? (w.qb_intuit_purchases / w.qb_intuit_users * 100) 
          : 0
      }
    })

    // Shift: last_week becomes primary (this_week is incomplete)
    const data = {
      this_week: formatWeek(last5[1], 'Last Week'),
      last_week: formatWeek(last5[2], '2 Weeks Ago'),
      two_weeks_ago: formatWeek(last5[3], '3 Weeks Ago'),
      three_weeks_ago: formatWeek(last5[4], '4 Weeks Ago'),
      last_updated: new Date().toISOString(),
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error fetching organic data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch data', details: String(error) },
      { status: 500 }
    )
  }
}
