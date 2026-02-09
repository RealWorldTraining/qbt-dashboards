import { google } from 'googleapis'
import { NextResponse } from 'next/server'

const SHEET_ID = '1T8PZjlf2vBz7YTlz1GCXe68UczWGL8_ERYuBLd_r6H0'
const RANGE = 'GADS: Search Keyword: Weekly with Campaigns!A:T'

function parseNumber(val: string): number {
  if (!val) return 0
  const cleaned = val.replace(/[$,%]/g, '')
  return parseFloat(cleaned) || 0
}

function parseDate(dateStr: string): Date {
  if (dateStr.includes('/')) {
    const [month, day, year] = dateStr.split('/').map(Number)
    return new Date(year, month - 1, day)
  } else {
    return new Date(dateStr)
  }
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
    const weeklyData = rows.slice(1).map(row => ({
      date: row[0] || '',
      keyword: row[1] || '',
      campaign: row[2] || '',
      impressions: parseNumber(row[6]),
      clicks: parseNumber(row[7]),
      cost: parseNumber(row[10]),
      conversions: parseNumber(row[11])
    }))

    // Sort by date descending
    weeklyData.sort((a, b) => parseDate(b.date).getTime() - parseDate(a.date).getTime())

    // Get unique dates (weeks) and take the 4 most recent
    const uniqueWeeks = [...new Set(weeklyData.map(d => d.date))].slice(0, 4)
    
    // Calculate totals for each week
    const weeklyTotals = uniqueWeeks.map(week => {
      const weekData = weeklyData.filter(d => d.date === week)
      return {
        date: week,
        impressions: weekData.reduce((sum, d) => sum + d.impressions, 0),
        clicks: weekData.reduce((sum, d) => sum + d.clicks, 0),
        cost: weekData.reduce((sum, d) => sum + d.cost, 0),
        conversions: weekData.reduce((sum, d) => sum + d.conversions, 0)
      }
    })

    return NextResponse.json({ weeks: weeklyTotals })
  } catch (error: any) {
    console.error('Error fetching 4-week Google Ads data:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
