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
