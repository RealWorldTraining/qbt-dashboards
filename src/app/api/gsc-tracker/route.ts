import { NextResponse } from 'next/server'

// NOTE: GSC Keyword Tracker not yet available in Adveronix
// Returning stub data until tracker tab is added
// TODO: Add "GSC: Keyword Tracker" tab to Adveronix sheet with columns:
// Query | Relevancy | Mega-Cluster | Keyword Cluster | Keyword Type | Position | Clicks | Impressions | CTR | Week | Last Updated

export async function GET() {
  try {
    // Return empty/stub response for now
    // This allows the trend analysis page to load without errors
    return NextResponse.json({
      summary: {
        week: 'N/A',
        lastUpdated: new Date().toISOString(),
        demandIndex: 0,
        totalKeywords: 0,
        totalClicks: 0,
        totalImpressions: 0,
        avgPosition: 0,
        overallCTR: 0
      },
      clusterSummary: {},
      topByClicks: [],
      topByPosition: [],
      allKeywords: [],
      note: 'GSC Keyword Tracker tab not yet available in Adveronix sheet',
      last_updated: new Date().toISOString()
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=60',
      },
    })
  } catch (error) {
    console.error('Error in GSC tracker stub:', error)
    return NextResponse.json(
      { error: 'Failed to fetch data', details: String(error) },
      { status: 500 }
    )
  }
}

/*
// Original implementation - restore when tracker tab is added to Adveronix
import { google } from 'googleapis'

const SHEET_ID = '1T8PZjlf2vBz7YTlz1GCXe68UczWGL8_ERYuBLd_r6H0'
const RANGE = 'GSC: Keyword Tracker!A:K'

interface KeywordRow {
  query: string
  relevancy: string
  megaCluster: string
  keywordCluster: string
  keywordType: string
  position: number
  clicks: number
  impressions: number
  ctr: number
  week: string
  lastUpdated: string
}

function parseNumber(val: string): number {
  if (!val) return 0
  const cleaned = val.replace(/[,$%]/g, '')
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

    // Parse all rows (skip header)
    const keywords: KeywordRow[] = rows.slice(1)
      .filter(row => row[0])
      .map(row => ({
        query: row[0] || '',
        relevancy: row[1] || '',
        megaCluster: row[2] || '',
        keywordCluster: row[3] || '',
        keywordType: row[4] || '',
        position: parseNumber(row[5]),
        clicks: parseNumber(row[6]),
        impressions: parseNumber(row[7]),
        ctr: parseNumber(row[8]),
        week: row[9] || '',
        lastUpdated: row[10] || '',
      }))

    // Calculate metrics and return full response
    // ... rest of implementation
  } catch (error) {
    console.error('Error fetching GSC tracker data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch data', details: String(error) },
      { status: 500 }
    )
  }
}
*/
