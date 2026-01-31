import { google } from 'googleapis'
import { NextResponse } from 'next/server'

const SHEET_ID = '1INXxnW3WVkENN7Brvo3sgPcs96C06r3O6mEkgEABxk8'
const RANGE = 'Bing Paid: Weekly Campaign Summary!A:M'

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

    // Parse all rows (skip header)
    // Columns: A=Week, B=Account, C=Campaign, D=Ad dist, E=Quality score,
    // F=Impressions, G=Clicks, H=CTR, I=Avg CPC, J=Spend, K=Avg pos, L=Conversions, M=Conv Rate, N=CPA
    const allData: CampaignRow[] = rows.slice(1)
      .filter(row => row[0] && row[2]) // Filter by week and campaign
      .map(row => ({
        week: row[0],
        campaign: row[2], // Column C
        clicks: parseNumber(row[6]), // Column G
        impressions: parseNumber(row[5]), // Column F
        ctr: parseNumber(row[7]), // Column H
        avg_cpc: parseNumber(row[8]), // Column I
        cost: parseNumber(row[9]), // Column J
        conversions: parseNumber(row[11]), // Column L
        conv_rate: parseNumber(row[12]), // Column M
        search_impression_share: 0, // Not in this sheet
        search_top_impression_share: 0,
        search_abs_top_impression_share: 0,
        click_share: 0,
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

    // Format response
    const result = {
      weeks: recentWeeks.map((w, i) => ({
        week: w,
        label: i === 0 ? 'Last Week' : i === 1 ? '2 Weeks Ago' : i === 2 ? '3 Weeks Ago' : '4 Weeks Ago',
        date_range: formatDateRange(w)
      })),
      campaigns: campaigns.map(name => ({
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
