import { google } from 'googleapis'
import { NextResponse } from 'next/server'

const SHEET_ID = '1T8PZjlf2vBz7YTlz1GCXe68UczWGL8_ERYuBLd_r6H0'
const RANGE = 'Max CPC Recommendations!A:Z'

interface CPCRecommendation {
  analysisDate: string
  campaign: string
  keyword: string
  device: string
  action: string
  currentMaxCPC: number
  suggestedMaxCPC: number
  changeAmount: number
  confidence: string
  imprTopPct: number
  imprTopClass: string
  imprAbsTopPct: number
  imprAbsTopClass: string
  searchImprShare: number
  searchImprClass: string
  clickShare: number
  clickShareClass: string
  searchLostIsRank: number
  searchLostClass: string
  headroomPct: number
  headroomClass: string
  avgCPC: number
  trendSummary: string
  primarySignal: string
  reason: string
  competitionContext: string
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

    const recommendations: CPCRecommendation[] = rows.slice(1).map(row => ({
      analysisDate: row[0] || '',
      campaign: row[1] || '',
      keyword: row[2] || '',
      device: row[3] || '',
      action: row[4] || '',
      currentMaxCPC: parseNumber(row[5]),
      suggestedMaxCPC: parseNumber(row[6]),
      changeAmount: parseNumber(row[7]),
      confidence: row[8] || '',
      imprTopPct: parseNumber(row[9]),
      imprTopClass: row[10] || '',
      imprAbsTopPct: parseNumber(row[11]),
      imprAbsTopClass: row[12] || '',
      searchImprShare: parseNumber(row[13]),
      searchImprClass: row[14] || '',
      clickShare: parseNumber(row[15]),
      clickShareClass: row[16] || '',
      searchLostIsRank: parseNumber(row[17]),
      searchLostClass: row[18] || '',
      headroomPct: parseNumber(row[19]),
      headroomClass: row[20] || '',
      avgCPC: parseNumber(row[21]),
      trendSummary: row[22] || '',
      primarySignal: row[23] || '',
      reason: row[24] || '',
      competitionContext: row[25] || ''
    }))

    // Calculate summary stats
    const actionCounts = recommendations.reduce((acc, rec) => {
      acc[rec.action] = (acc[rec.action] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const confidenceCounts = recommendations.reduce((acc, rec) => {
      acc[rec.confidence] = (acc[rec.confidence] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const totalBidIncrease = recommendations
      .filter(r => r.action === 'RAISE')
      .reduce((sum, r) => sum + r.changeAmount, 0)

    const totalBidDecrease = recommendations
      .filter(r => r.action === 'LOWER')
      .reduce((sum, r) => sum + Math.abs(r.changeAmount), 0)

    return NextResponse.json({
      recommendations,
      summary: {
        total: recommendations.length,
        actions: actionCounts,
        confidence: confidenceCounts,
        totalBidIncrease,
        totalBidDecrease,
        lastUpdated: recommendations[0]?.analysisDate || new Date().toISOString().split('T')[0]
      }
    })
  } catch (error: any) {
    console.error('Error fetching CPC recommendations:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
