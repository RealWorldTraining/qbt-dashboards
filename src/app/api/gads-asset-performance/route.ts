import { google } from 'googleapis'
import { NextResponse } from 'next/server'

const SHEET_ID = '1T8PZjlf2vBz7YTlz1GCXe68UczWGL8_ERYuBLd_r6H0'
const RANGE = "'GADS: Asset Performance'!A:K"

interface AssetRow {
  assetText: string
  assetType: string
  fieldType: string
  performanceLabel: string
  campaign: string
  adGroup: string
  impressions: number
  clicks: number
  ctr: number
  conversions: number
  cost: number
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
      return NextResponse.json({
        assets: [],
        summary: { totalAssets: 0, byType: {}, byPerformanceLabel: {} },
        lastUpdated: new Date().toISOString(),
      })
    }

    const assets: AssetRow[] = rows.slice(1).map(row => ({
      assetText: row[0] || '',
      assetType: row[1] || '',
      fieldType: row[2] || '',
      performanceLabel: row[3] || '',
      campaign: row[4] || '',
      adGroup: row[5] || '',
      impressions: parseNumber(row[6]),
      clicks: parseNumber(row[7]),
      ctr: parseNumber(row[8]),
      conversions: parseNumber(row[9]),
      cost: parseNumber(row[10]),
    }))

    // Build summary
    const byType: Record<string, number> = {}
    const byPerformanceLabel: Record<string, number> = {}
    for (const a of assets) {
      byType[a.fieldType] = (byType[a.fieldType] || 0) + 1
      byPerformanceLabel[a.performanceLabel] = (byPerformanceLabel[a.performanceLabel] || 0) + 1
    }

    return NextResponse.json({
      assets,
      summary: {
        totalAssets: assets.length,
        byType,
        byPerformanceLabel,
      },
      lastUpdated: new Date().toISOString(),
    }, {
      headers: {
        'Cache-Control': 's-maxage=300, stale-while-revalidate=60',
      },
    })
  } catch (error: any) {
    console.error('gads-asset-performance error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch asset performance' },
      { status: 500 }
    )
  }
}
