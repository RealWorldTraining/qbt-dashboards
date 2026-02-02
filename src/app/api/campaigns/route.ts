import { google } from 'googleapis'
import { NextResponse } from 'next/server'

// Same sheet as ads data
const SHEET_ID = '1WeRmk0bZ-OU6jnbk0pfC1s3xK32WCwAIlTUa0-jYcuM'
const RANGE = 'Campaign Performance!A:N'

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

    // Parse all rows (skip header)
    // Columns: A=Week, B=Campaign, C=Clicks, D=Impressions, E=CTR, F=Avg CPC,
    // G=Cost, H=Conversions, I=Conv Rate, J=(old), K=Impr Share, L=Top %, M=Abs Top %
    const allData: CampaignRow[] = rows.slice(1)
      .filter(row => row[0] && row[1])
      .map(row => ({
        week: row[0],
        campaign: row[1],
        clicks: parseNumber(row[2]),
        impressions: parseNumber(row[3]),
        ctr: parseNumber(row[4]),
        avg_cpc: parseNumber(row[5]),
        cost: parseNumber(row[6]),
        conversions: parseNumber(row[7]),
        conv_rate: parseNumber(row[8]),
        search_impression_share: parseNumber(row[10]),  // Column K
        search_top_impression_share: parseNumber(row[11]),  // Column L
        search_abs_top_impression_share: parseNumber(row[12]),  // Column M
        click_share: parseNumber(row[13]),  // Column N
      }))

    // Get unique weeks and campaigns
    const weeks = [...new Set(allData.map(r => r.week))].sort().reverse()
    const campaigns = [...new Set(allData.map(r => r.campaign))]

    // Get last 4 weeks (skip current incomplete week if needed)
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
    console.error('Error fetching campaign data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch data', details: String(error) },
      { status: 500 }
    )
  }
}
