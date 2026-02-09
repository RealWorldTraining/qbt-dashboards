import { google } from 'googleapis'
import { NextResponse } from 'next/server'

const SHEET_ID = '1T8PZjlf2vBz7YTlz1GCXe68UczWGL8_ERYuBLd_r6H0'
const RANGE = 'Bing Max CPC Recommendations!A:Z'

interface BingCPCRecommendation {
  analysisDate: string
  campaign: string
  keyword: string
  action: string
  impressions: number
  clicks: number
  cost: number
  conversions: number
  costPerConv: number
  currentMaxCPC: number
  suggestedMaxCPC: number
  changeAmount: number
  urgency: string
  searchImprShare: number
  searchImprClass: string
  imprTopPct: number
  imprTopClass: string
  imprAbsTopPct: number
  imprAbsTopClass: string
  headroomPct: number
  headroomClass: string
  avgCPC: number
  trendSummary: string
  primarySignal: string
}

function parseNumber(val: string): number {
  if (!val) return 0
  const cleaned = val.replace(/[$,%]/g, '')
  return parseFloat(cleaned) || 0
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

    const recommendations: BingCPCRecommendation[] = rows.slice(1).map(row => ({
      analysisDate: row[0] || '',
      campaign: row[1] || '',
      keyword: row[2] || '',
      action: row[3] || '',
      impressions: parseNumber(row[4]),
      clicks: parseNumber(row[5]),
      cost: parseNumber(row[6]),
      conversions: parseNumber(row[7]),
      costPerConv: parseNumber(row[8]),
      currentMaxCPC: parseNumber(row[9]),
      suggestedMaxCPC: parseNumber(row[10]),
      changeAmount: parseNumber(row[11]),
      urgency: row[12] || '',
      searchImprShare: parseNumber(row[13]),
      searchImprClass: row[14] || '',
      imprTopPct: parseNumber(row[15]),
      imprTopClass: row[16] || '',
      imprAbsTopPct: parseNumber(row[17]),
      imprAbsTopClass: row[18] || '',
      headroomPct: parseNumber(row[19]),
      headroomClass: row[20] || '',
      avgCPC: parseNumber(row[21]),
      trendSummary: row[22] || '',
      primarySignal: row[23] || ''
    }))

    // Calculate summary stats
    const actionCounts = recommendations.reduce((acc, rec) => {
      acc[rec.action] = (acc[rec.action] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const totalBidIncrease = recommendations
      .filter(r => r.action === 'RAISE' || r.action === 'RAISE_WITH_CPA_CONCERN')
      .reduce((sum, r) => sum + r.changeAmount, 0)

    const totalBidDecrease = recommendations
      .filter(r => r.action === 'LOWER')
      .reduce((sum, r) => sum + Math.abs(r.changeAmount), 0)

    return NextResponse.json({
      recommendations,
      summary: {
        total: recommendations.length,
        actions: actionCounts,
        totalBidIncrease,
        totalBidDecrease,
        lastUpdated: recommendations[0]?.analysisDate || new Date().toISOString().split('T')[0]
      }
    })
  } catch (error: any) {
    console.error('Error fetching Bing CPC recommendations:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
