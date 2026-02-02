import { google } from 'googleapis'
import { NextResponse } from 'next/server'

const SHEET_ID = '1WeRmk0bZ-OU6jnbk0pfC1s3xK32WCwAIlTUa0-jYcuM'
const RANGE = 'GSC Keyword Tracker!A:K'

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
    // Columns: A=Query, B=Relevancy, C=Mega-Cluster, D=Keyword Cluster, E=Keyword Type,
    // F=Position, G=Clicks, H=Impressions, I=CTR, J=Week, K=Last Updated
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

    // Calculate Demand Index (sum of all impressions)
    const demandIndex = keywords.reduce((sum, kw) => sum + kw.impressions, 0)
    
    // Calculate totals
    const totalClicks = keywords.reduce((sum, kw) => sum + kw.clicks, 0)
    const totalImpressions = demandIndex
    const avgPosition = keywords.length > 0 
      ? keywords.reduce((sum, kw) => sum + kw.position, 0) / keywords.length 
      : 0
    const overallCTR = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0

    // Group by cluster for summary
    const clusterSummary: Record<string, { 
      keywords: number
      clicks: number
      impressions: number
      avgPosition: number
    }> = {}
    
    keywords.forEach(kw => {
      const cluster = kw.megaCluster || 'Uncategorized'
      if (!clusterSummary[cluster]) {
        clusterSummary[cluster] = { keywords: 0, clicks: 0, impressions: 0, avgPosition: 0 }
      }
      clusterSummary[cluster].keywords++
      clusterSummary[cluster].clicks += kw.clicks
      clusterSummary[cluster].impressions += kw.impressions
      clusterSummary[cluster].avgPosition += kw.position
    })
    
    // Calculate average position per cluster
    Object.keys(clusterSummary).forEach(cluster => {
      if (clusterSummary[cluster].keywords > 0) {
        clusterSummary[cluster].avgPosition /= clusterSummary[cluster].keywords
      }
    })

    // Top performing keywords (by clicks)
    const topByClicks = [...keywords]
      .sort((a, b) => b.clicks - a.clicks)
      .slice(0, 20)

    // Best ranking keywords (lowest position = best)
    const topByPosition = [...keywords]
      .filter(kw => kw.position > 0)
      .sort((a, b) => a.position - b.position)
      .slice(0, 20)

    return NextResponse.json({
      summary: {
        totalKeywords: keywords.length,
        demandIndex,
        totalClicks,
        totalImpressions,
        avgPosition: Math.round(avgPosition * 10) / 10,
        overallCTR: Math.round(overallCTR * 100) / 100,
        week: keywords[0]?.week || '',
        lastUpdated: keywords[0]?.lastUpdated || '',
      },
      clusterSummary,
      topByClicks,
      topByPosition,
      allKeywords: keywords,
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=60',
      },
    })
  } catch (error) {
    console.error('Error fetching GSC tracker data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch data', details: String(error) },
      { status: 500 }
    )
  }
}
