import { google } from 'googleapis'
import { NextResponse } from 'next/server'

const SHEET_ID = '1SvvnNc32S7jSW1GP1bonJAoW0bTuNgHh9ERQo6RgcEY'
const SOURCE_MEDIUM_RANGE = 'First User Source Medium!A:N'
const CHANNEL_GROUP_RANGE = 'First User Default Channel Group!A:N'

function parseNumber(val: string): number {
  if (!val) return 0
  const cleaned = val.replace(/,/g, '').replace(/%/g, '')
  return parseFloat(cleaned) || 0
}

function weekCodeToDateRange(weekCode: string): string {
  const year = parseInt(weekCode.substring(0, 4))
  const week = parseInt(weekCode.substring(4))
  
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
    
    // Fetch both tabs
    const [sourceMediumRes, channelGroupRes] = await Promise.all([
      sheets.spreadsheets.values.get({
        spreadsheetId: SHEET_ID,
        range: SOURCE_MEDIUM_RANGE,
      }),
      sheets.spreadsheets.values.get({
        spreadsheetId: SHEET_ID,
        range: CHANNEL_GROUP_RANGE,
      })
    ])

    const sourceMediumRows = sourceMediumRes.data.values
    const channelGroupRows = channelGroupRes.data.values
    
    if (!sourceMediumRows || sourceMediumRows.length < 2) {
      return NextResponse.json({ error: 'No source medium data found' }, { status: 404 })
    }

    // Parse Source Medium data (granular sources)
    // Columns: A=week, E=Direct Users, F=Direct Purchases, 
    // G=Google Organic Users, H=Google Organic Purchases,
    // I=QB Intuit Users, J=QB Intuit Purchases,
    // K=Bing Organic Users, L=Bing Organic Purchases,
    // M=Bing CPC Users, N=Bing CPC Purchases
    const sourceData = sourceMediumRows.slice(1)
      .filter(row => row[0] && /^\d{6}$/.test(row[0]))
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
      }))
      .sort((a, b) => a.week_code.localeCompare(b.week_code))

    // Parse Channel Group data (totals + paid)
    // Columns: A=week, B=week_start, C=Organic users, D=Organic purchases,
    // E=Direct users, F=Direct purchases, G=Referral users, H=Referral purchases,
    // I=Paid users, J=Paid purchases, K=Total Users, L=Total Purchases
    const channelData = channelGroupRows ? channelGroupRows.slice(1)
      .filter(row => row[0] && /^\d{6}$/.test(row[0]))
      .map(row => ({
        week_code: row[0],
        total_users: parseNumber(row[10]),      // Column K
        total_purchases: parseNumber(row[11]),  // Column L
        paid_users: parseNumber(row[8]),        // Column I
        paid_purchases: parseNumber(row[9]),    // Column J
      }))
      .sort((a, b) => a.week_code.localeCompare(b.week_code)) : []

    // Get last 5 weeks
    const last5Source = sourceData.slice(-5).reverse()
    const last5Channel = channelData.slice(-5).reverse()

    const formatWeek = (sourceRow: typeof sourceData[0], channelRow: typeof channelData[0] | undefined, label: string) => {
      const totalUsers = channelRow?.total_users || 1
      const totalPurchases = channelRow?.total_purchases || 1
      const paidUsers = channelRow?.paid_users || 0
      const paidPurchases = channelRow?.paid_purchases || 0

      // Calculate "Other" as the difference
      const knownUsers = paidUsers + sourceRow.google_organic_users + sourceRow.direct_users + 
                         sourceRow.bing_organic_users + sourceRow.qb_intuit_users
      const knownPurchases = paidPurchases + sourceRow.google_organic_purchases + sourceRow.direct_purchases + 
                             sourceRow.bing_organic_purchases + sourceRow.qb_intuit_purchases
      const otherUsers = Math.max(0, totalUsers - knownUsers)
      const otherPurchases = Math.max(0, totalPurchases - knownPurchases)

      return {
        week_label: label,
        date_range: weekCodeToDateRange(sourceRow.week_code),
        totals: {
          users: totalUsers,
          purchases: totalPurchases
        },
        google_ads: {
          users: paidUsers,
          purchases: paidPurchases,
          conv_rate: paidUsers > 0 ? (paidPurchases / paidUsers * 100) : 0,
          pct_of_users: (paidUsers / totalUsers * 100),
          pct_of_purchases: (paidPurchases / totalPurchases * 100)
        },
        google_organic: {
          users: sourceRow.google_organic_users,
          purchases: sourceRow.google_organic_purchases,
          conv_rate: sourceRow.google_organic_users > 0 
            ? (sourceRow.google_organic_purchases / sourceRow.google_organic_users * 100) : 0,
          pct_of_users: (sourceRow.google_organic_users / totalUsers * 100),
          pct_of_purchases: (sourceRow.google_organic_purchases / totalPurchases * 100)
        },
        direct: {
          users: sourceRow.direct_users,
          purchases: sourceRow.direct_purchases,
          conv_rate: sourceRow.direct_users > 0 
            ? (sourceRow.direct_purchases / sourceRow.direct_users * 100) : 0,
          pct_of_users: (sourceRow.direct_users / totalUsers * 100),
          pct_of_purchases: (sourceRow.direct_purchases / totalPurchases * 100)
        },
        bing_organic: {
          users: sourceRow.bing_organic_users,
          purchases: sourceRow.bing_organic_purchases,
          conv_rate: sourceRow.bing_organic_users > 0 
            ? (sourceRow.bing_organic_purchases / sourceRow.bing_organic_users * 100) : 0,
          pct_of_users: (sourceRow.bing_organic_users / totalUsers * 100),
          pct_of_purchases: (sourceRow.bing_organic_purchases / totalPurchases * 100)
        },
        qb_intuit: {
          users: sourceRow.qb_intuit_users,
          purchases: sourceRow.qb_intuit_purchases,
          conv_rate: sourceRow.qb_intuit_users > 0 
            ? (sourceRow.qb_intuit_purchases / sourceRow.qb_intuit_users * 100) : 0,
          pct_of_users: (sourceRow.qb_intuit_users / totalUsers * 100),
          pct_of_purchases: (sourceRow.qb_intuit_purchases / totalPurchases * 100)
        },
        other: {
          users: otherUsers,
          purchases: otherPurchases,
          conv_rate: otherUsers > 0 ? (otherPurchases / otherUsers * 100) : 0,
          pct_of_users: (otherUsers / totalUsers * 100),
          pct_of_purchases: (otherPurchases / totalPurchases * 100)
        }
      }
    }

    // Match source and channel data by week code, shift to skip incomplete week
    const findChannel = (weekCode: string) => last5Channel.find(c => c.week_code === weekCode)

    const data = {
      this_week: formatWeek(last5Source[1], findChannel(last5Source[1].week_code), 'Last Week'),
      last_week: formatWeek(last5Source[2], findChannel(last5Source[2].week_code), '2 Weeks Ago'),
      two_weeks_ago: formatWeek(last5Source[3], findChannel(last5Source[3].week_code), '3 Weeks Ago'),
      three_weeks_ago: formatWeek(last5Source[4], findChannel(last5Source[4].week_code), '4 Weeks Ago'),
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
