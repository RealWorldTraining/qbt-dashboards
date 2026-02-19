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

// Map Google Ads enum numeric codes to readable labels
// Based on AssetFieldTypeEnum: https://developers.google.com/google-ads/api/reference/rpc/latest/AssetFieldTypeEnum.AssetFieldType
const FIELD_TYPE_MAP: Record<string, string> = {
  '2': 'HEADLINE',
  '3': 'DESCRIPTION',
  '4': 'LONG_HEADLINE',
  '5': 'SITELINK',
  '6': 'CALLOUT',
  '7': 'STRUCTURED_SNIPPET',
}

// Based on AssetPerformanceLabelEnum
const PERFORMANCE_LABEL_MAP: Record<string, string> = {
  '1': 'LEARNING',
  '2': 'LOW',
  '3': 'GOOD',
  '4': 'BEST',
  '5': 'PENDING',
  '7': 'UNSPECIFIED',
}

function parseNumber(val: string): number {
  if (!val) return 0
  const cleaned = val.replace(/[$,%]/g, '')
  return parseFloat(cleaned) || 0
}

function getGoogleCredentials() {
  // Try base64-encoded JSON blobs first
  const credsJson = process.env.SHEETS_READER_CREDENTIALS || process.env.GOOGLE_SHEETS_CREDENTIALS
  if (credsJson) {
    return JSON.parse(Buffer.from(credsJson, 'base64').toString('utf-8'))
  }

  // Fall back to individual env vars
  const clientEmail = process.env.GOOGLE_CLIENT_EMAIL
  let privateKey = process.env.GOOGLE_PRIVATE_KEY || ''
  if (!clientEmail || !privateKey) return null

  privateKey = privateKey.replace(/\r\n/g, '\n').replace(/\r/g, '\n')
  if (privateKey.includes('\\n')) {
    privateKey = privateKey.replace(/\\n/g, '\n')
  }
  if (!privateKey.includes('-----BEGIN PRIVATE KEY-----')) {
    privateKey = `-----BEGIN PRIVATE KEY-----\n${privateKey}\n-----END PRIVATE KEY-----\n`
  }

  return {
    type: 'service_account',
    project_id: process.env.GOOGLE_PROJECT_ID,
    private_key_id: process.env.GOOGLE_PRIVATE_KEY_ID,
    private_key: privateKey,
    client_email: clientEmail,
    client_id: process.env.GOOGLE_CLIENT_ID,
    auth_uri: 'https://accounts.google.com/o/oauth2/auth',
    token_uri: 'https://oauth2.googleapis.com/token',
  }
}

export async function GET() {
  try {
    const credentials = getGoogleCredentials()
    if (!credentials) {
      return NextResponse.json({
        error: 'Missing Google credentials',
        debug: {
          hasSheetsReaderCreds: !!process.env.SHEETS_READER_CREDENTIALS,
          hasSheetsCreds: !!process.env.GOOGLE_SHEETS_CREDENTIALS,
          hasClientEmail: !!process.env.GOOGLE_CLIENT_EMAIL,
          hasPrivateKey: !!process.env.GOOGLE_PRIVATE_KEY,
          hasProjectId: !!process.env.GOOGLE_PROJECT_ID,
        }
      }, { status: 500 })
    }

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
      fieldType: FIELD_TYPE_MAP[row[2]] || row[2] || 'UNKNOWN',
      performanceLabel: PERFORMANCE_LABEL_MAP[row[3]] || row[3] || 'UNSPECIFIED',
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
