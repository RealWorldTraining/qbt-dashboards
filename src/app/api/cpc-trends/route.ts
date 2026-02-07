import { google } from 'googleapis'
import { NextResponse } from 'next/server'

const SHEET_ID = '1T8PZjlf2vBz7YTlz1GCXe68UczWGL8_ERYuBLd_r6H0'
const RANGE = 'GADS: Search Keyword: Weekly with analytics!A:T'

interface KeywordWeek {
  date: string
  keyword: string
  campaign: string
  clicks: number
  impressions: number
  ctr: number
  avgCpc: number
  cost: number
  conversions: number
  cpa: number
  convRate: number
  searchImprShare: number
  imprTopPct: number
  imprAbsTopPct: number
  searchLostIsRank: number
  clickShare: number
}

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
    const weeklyData: KeywordWeek[] = rows.slice(1).map(row => ({
      date: row[0] || '',
      keyword: row[1] || '',
      campaign: row[2] || '',
      clicks: parseNumber(row[5]),
      impressions: parseNumber(row[6]),
      ctr: parseNumber(row[7]) * 100, // Convert to percentage
      avgCpc: parseNumber(row[8]),
      cost: parseNumber(row[9]),
      conversions: parseNumber(row[10]),
      cpa: parseNumber(row[12]),
      convRate: parseNumber(row[13]) * 100, // Convert to percentage
      searchImprShare: parseNumber(row[15]) * 100, // Convert to percentage
      imprTopPct: parseNumber(row[16]) * 100, // Convert to percentage
      imprAbsTopPct: parseNumber(row[17]) * 100, // Convert to percentage
      searchLostIsRank: parseNumber(row[18]) * 100, // Convert to percentage
      clickShare: parseNumber(row[19]) * 100 // Convert to percentage
    }))

    // Sort by date descending to get most recent weeks first
    weeklyData.sort((a, b) => parseDate(b.date).getTime() - parseDate(a.date).getTime())

    // Group by keyword and campaign, take last 8 weeks
    const keywordTrends: Record<string, Record<string, KeywordWeek[]>> = {}
    
    weeklyData.forEach(week => {
      if (!week.campaign || !week.keyword) return
      
      if (!keywordTrends[week.campaign]) {
        keywordTrends[week.campaign] = {}
      }
      
      if (!keywordTrends[week.campaign][week.keyword]) {
        keywordTrends[week.campaign][week.keyword] = []
      }
      
      // Only keep first 8 weeks (most recent)
      if (keywordTrends[week.campaign][week.keyword].length < 8) {
        keywordTrends[week.campaign][week.keyword].push(week)
      }
    })

    // Reverse each keyword's weeks to show oldest first (for chart display)
    Object.keys(keywordTrends).forEach(campaign => {
      Object.keys(keywordTrends[campaign]).forEach(keyword => {
        keywordTrends[campaign][keyword].reverse()
      })
    })

    return NextResponse.json({
      trends: keywordTrends,
      lastUpdated: weeklyData[0]?.date || new Date().toISOString().split('T')[0]
    })
  } catch (error: any) {
    console.error('Error fetching CPC trends:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
