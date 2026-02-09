import { google } from 'googleapis'
import { NextResponse } from 'next/server'

// Adveronix: Paid Search sheet
const SHEET_ID = '1T8PZjlf2vBz7YTlz1GCXe68UczWGL8_ERYuBLd_r6H0'
const RANGE = 'GADS: Campaign: Weekly (Devices)!A:P'

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
  // Parse dates without timezone shift (YYYY-MM-DD format)
  const [year, month, day] = weekStart.split('-').map(Number)
  const start = new Date(year, month - 1, day)
  const end = new Date(year, month - 1, day + 6)
  
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

    // Adveronix structure: Week | Campaign | Device | Clicks | Impressions | CTR | Avg.CPC | Cost | CPM | Conv | Cross-dev | CPA | Abs.Top% | Top% | Impr.Share | Content.Share
    // Group by week + campaign (aggregate across devices)
    const aggMap = new Map<string, any>()
    
    rows.slice(1).forEach(row => {
      const week = row[0]
      const campaign = row[1]
      if (!week || !campaign) return
      
      const key = `${week}::${campaign}`
      const existing = aggMap.get(key) || {
        week,
        campaign,
        clicks: 0,
        impressions: 0,
        cost: 0,
        conversions: 0,
        abs_top_sum: 0,
        top_sum: 0,
        impr_share_sum: 0,
        count: 0
      }
      
      existing.clicks += parseNumber(row[3])
      existing.impressions += parseNumber(row[4])
      existing.cost += parseNumber(row[7])
      existing.conversions += parseNumber(row[9])
      existing.abs_top_sum += parseNumber(row[12]) * parseNumber(row[4])  // Weight by impressions
      existing.top_sum += parseNumber(row[13]) * parseNumber(row[4])
      existing.impr_share_sum += parseNumber(row[14]) * parseNumber(row[4])
      existing.count += 1
      
      aggMap.set(key, existing)
    })
    
    const allData: CampaignRow[] = Array.from(aggMap.values()).map(agg => ({
      week: agg.week,
      campaign: agg.campaign,
      clicks: agg.clicks,
      impressions: agg.impressions,
      ctr: agg.impressions > 0 ? (agg.clicks / agg.impressions) * 100 : 0,
      avg_cpc: agg.clicks > 0 ? agg.cost / agg.clicks : 0,
      cost: agg.cost,
      conversions: agg.conversions,
      conv_rate: agg.clicks > 0 ? (agg.conversions / agg.clicks) * 100 : 0,
      search_impression_share: agg.impressions > 0 ? (agg.impr_share_sum / agg.impressions) * 100 : 0,
      search_top_impression_share: agg.impressions > 0 ? (agg.top_sum / agg.impressions) * 100 : 0,
      search_abs_top_impression_share: agg.impressions > 0 ? (agg.abs_top_sum / agg.impressions) * 100 : 0,
      click_share: 0,  // Not available in Adveronix
    }))

    // Get unique weeks and campaigns
    const allWeeks = [...new Set(allData.map(r => r.week))].sort().reverse()
    const campaigns = [...new Set(allData.map(r => r.campaign))]

    // Filter to only complete weeks (week_end < today)
    // Week starts are in YYYY-MM-DD format, add 6 days to get week_end
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const completeWeeks = allWeeks.filter(weekStart => {
      const [year, month, day] = weekStart.split('-').map(Number)
      const weekEnd = new Date(year, month - 1, day + 6)
      return weekEnd < today
    })
    
    // Get last 4 complete weeks
    const recentWeeks = completeWeeks.slice(0, 4)
    
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
        label: i === 0 ? 'Prior Week' : i === 1 ? '2 Weeks Ago' : i === 2 ? '3 Weeks Ago' : '4 Weeks Ago',
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
    console.error('Error fetching campaign data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch data', details: String(error) },
      { status: 500 }
    )
  }
}
