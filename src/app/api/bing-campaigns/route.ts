import { google } from 'googleapis'
import { NextResponse } from 'next/server'

// Adveronix: Paid Search sheet
const SHEET_ID = '1T8PZjlf2vBz7YTlz1GCXe68UczWGL8_ERYuBLd_r6H0'
const RANGE = 'Bing: Campaign Weekly!A:Q'

interface CampaignRow {
  week: string
  campaign: string
  clicks: number
  impressions: number
  ctr: number
  avg_cpc: number
  cost: number
  conversions: number
  conv_rate: number
  search_impression_share: number
  search_top_impression_share: number
  search_abs_top_impression_share: number
  click_share: number
}

function parseNumber(val: string): number {
  if (!val) return 0
  const cleaned = val.replace(/[$,]/g, '').replace(/%/g, '')
  return parseFloat(cleaned) || 0
}

function formatDateRange(weekStart: string): string {
  const start = new Date(weekStart)
  const end = new Date(start)
  end.setDate(start.getDate() + 6)
  const opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' }
  return `${start.toLocaleDateString('en-US', opts)} - ${end.toLocaleDateString('en-US', opts)}`
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

    // Adveronix structure: Week | Account | Campaign | Ad dist | Quality | Impressions | Clicks | CTR | Avg.CPC | Spend | Avg.pos | Conv | Conv.Rate | CPA | Abs.Top% | Impr.Share | Click.Share
    const allData: CampaignRow[] = rows.slice(1)
      .filter(row => row[0] && row[2]) // Filter by week and campaign
      .map(row => ({
        week: row[0],
        campaign: row[2],
        clicks: parseNumber(row[6]),
        impressions: parseNumber(row[5]),
        ctr: parseNumber(row[7]),
        avg_cpc: parseNumber(row[8]),
        cost: parseNumber(row[9]),
        conversions: parseNumber(row[11]),
        conv_rate: parseNumber(row[12]),
        search_impression_share: parseNumber(row[15]),
        search_top_impression_share: 0, // Not available
        search_abs_top_impression_share: parseNumber(row[14]),
        click_share: parseNumber(row[16]),
      }))

    // Get unique weeks and campaigns
    const weeks = [...new Set(allData.map(r => r.week))].sort().reverse()
    const campaigns = [...new Set(allData.map(r => r.campaign))]

    // Get last 4 weeks
    const recentWeeks = weeks.slice(0, 4)
    
    // Group by campaign, then by week
    const campaignData: Record<string, Record<string, CampaignRow>> = {}
    
    for (const campaign of campaigns) {
      campaignData[campaign] = {}
      for (const week of recentWeeks) {
        const row = allData.find(r => r.campaign === campaign && r.week === week)
        if (row) {
          campaignData[campaign][week] = row
        }
      }
    }

    // Filter out campaigns with no activity (all zeros or nulls)
    const activeCampaigns = campaigns.filter(name => {
      const campaignWeeks = recentWeeks.map(week => campaignData[name]?.[week])
      
      // Check if campaign has any meaningful data in any week
      const hasActivity = campaignWeeks.some(weekData => {
        if (!weekData) return false
        // Consider active if has clicks, impressions, or spend > 0
        return weekData.clicks > 0 || weekData.impressions > 0 || weekData.cost > 0
      })
      
      return hasActivity
    })

    // Format response
    const result = {
      weeks: recentWeeks.map((w, i) => ({
        week: w,
        label: i === 0 ? 'Last Week' : i === 1 ? '2 Weeks Ago' : i === 2 ? '3 Weeks Ago' : '4 Weeks Ago',
        date_range: formatDateRange(w)
      })),
      campaigns: activeCampaigns.map(name => ({
        name,
        data: recentWeeks.map(week => campaignData[name]?.[week] || null)
      })),
      last_updated: new Date().toISOString()
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error fetching Bing campaign data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch data', details: String(error) },
      { status: 500 }
    )
  }
}
