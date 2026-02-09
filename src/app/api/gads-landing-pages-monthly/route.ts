import { google } from 'googleapis'
import { NextResponse } from 'next/server'

const SHEET_ID = '1T8PZjlf2vBz7YTlz1GCXe68UczWGL8_ERYuBLd_r6H0'
const LANDING_PAGES_RANGE = 'GADS: Landing Page: Monthly (With Campaigns)!A:K'

function parseNumber(val: string): number {
  if (!val) return 0
  const cleaned = val.replace(/[,$%]/g, '')
  return parseFloat(cleaned) || 0
}

function parseDate(dateStr: string): Date {
  if (dateStr.includes('/')) {
    const [month, day, year] = dateStr.split('/').map(Number)
    return new Date(year, month - 1, day)
  } else {
    const [year, month, day] = dateStr.split('-').map(Number)
    return new Date(year, month - 1, day)
  }
}

function getMonthKey(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  return `${year}-${month}`
}

function formatMonthLabel(monthKey: string): string {
  const [year, month] = monthKey.split('-').map(Number)
  const date = new Date(year, month - 1, 1)
  return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
}

function simplifyUrl(url: string): string {
  try {
    const urlObj = new URL(url)
    return urlObj.pathname
  } catch {
    return url
  }
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
      range: LANDING_PAGES_RANGE,
    })

    const rows = response.data.values
    if (!rows || rows.length < 2) {
      return NextResponse.json({ error: 'No data found' }, { status: 404 })
    }

    // Structure: Month | Campaign | Landing page | Ad Group | ... | Clicks | Impressions | CTR | Avg. CPC | Cost | Conversions
    // Columns: A=Month, B=Campaign, C=Landing page, D=Ad Group, H=Clicks, I=Impressions, J=CTR, K=Avg.CPC, L=Cost, M=Conversions
    // Aggregate by month and landing page (ignoring campaign/ad group)
    const monthlyData = new Map<string, Map<string, { clicks: number; conversions: number }>>()
    
    rows.slice(1).forEach(row => {
      const monthStr = row[0]
      const landingPage = row[2]
      if (!monthStr || !landingPage) return
      
      const monthKey = getMonthKey(parseDate(monthStr))
      const clicks = parseNumber(row[7]) // Clicks column (H)
      const conversions = parseNumber(row[12]) // Conversions column (M)
      
      // Simplify URL to just the path
      const simplifiedPage = simplifyUrl(landingPage)
      
      if (!monthlyData.has(monthKey)) {
        monthlyData.set(monthKey, new Map())
      }
      
      const monthMap = monthlyData.get(monthKey)!
      const existing = monthMap.get(simplifiedPage) || { clicks: 0, conversions: 0 }
      existing.clicks += clicks
      existing.conversions += conversions
      monthMap.set(simplifiedPage, existing)
    })

    // Get last 5 complete months (excluding current incomplete month)
    const now = new Date()
    const currentMonthKey = getMonthKey(now)
    
    const sortedMonths = Array.from(monthlyData.keys()).sort().reverse()
    const completeMonths = sortedMonths.filter(m => m < currentMonthKey)
    const last5Months = completeMonths.slice(0, 5)

    // Get top landing pages by total clicks across all 5 months
    const landingPageTotals = new Map<string, { clicks: number; conversions: number }>()
    
    last5Months.forEach(month => {
      const monthMap = monthlyData.get(month)!
      monthMap.forEach((data, page) => {
        const existing = landingPageTotals.get(page) || { clicks: 0, conversions: 0 }
        existing.clicks += data.clicks
        existing.conversions += data.conversions
        landingPageTotals.set(page, existing)
      })
    })

    // Sort landing pages by total clicks and get top 10
    const topLandingPages = Array.from(landingPageTotals.entries())
      .sort((a, b) => b[1].clicks - a[1].clicks)
      .slice(0, 10)
      .map(([page]) => page)

    // Build response data for each landing page
    const labels = ['This Month', 'Last Month', '2 Months Ago', '3 Months Ago', '4 Months Ago']
    
    const landingPagesData = topLandingPages.map(page => {
      const months = last5Months.map((monthKey, idx) => {
        const monthMap = monthlyData.get(monthKey)!
        const data = monthMap.get(page) || { clicks: 0, conversions: 0 }
        const conversionRate = data.clicks > 0 ? (data.conversions / data.clicks) * 100 : 0
        
        return {
          label: labels[idx],
          month: formatMonthLabel(monthKey),
          clicks: data.clicks,
          conversions: data.conversions,
          conversion_rate: conversionRate
        }
      })
      
      return {
        landing_page: page,
        months
      }
    })

    return NextResponse.json({
      landing_pages: landingPagesData,
      last_updated: new Date().toISOString()
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=60',
      },
    })
  } catch (error) {
    console.error('Error fetching GADS landing pages data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch data', details: String(error) },
      { status: 500 }
    )
  }
}
