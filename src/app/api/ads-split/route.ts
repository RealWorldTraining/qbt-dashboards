import { google } from 'googleapis'
import { NextResponse } from 'next/server'

// Use Adveronix sheet (same as google-ads-weekly)
const SHEET_ID = '1T8PZjlf2vBz7YTlz1GCXe68UczWGL8_ERYuBLd_r6H0'
const RANGE = 'GADS: Account: Weekly (Devices)!A:L'

interface WeeklyRow {
  week_start: string
  week_end: string
  spend: number
  impressions: number
  clicks: number
  ctr: number
  avg_cpc: number
  conversions: number
  conv_rate: number
  conv_value: number
}

function parseNumber(val: string): number {
  if (!val) return 0
  const cleaned = val.replace(/[$,]/g, '').replace(/%/g, '')
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

function getWeekStart(date: Date): string {
  // Get Monday of the week containing this date
  const dayOfWeek = date.getDay()
  const daysToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
  const monday = new Date(date)
  monday.setDate(date.getDate() + daysToMonday)
  const year = monday.getFullYear()
  const month = String(monday.getMonth() + 1).padStart(2, '0')
  const day = String(monday.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function formatDateRange(weekStart: string): string {
  const start = parseDate(weekStart)
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

    // Aggregate by week AND device type (Desktop vs Mobile)
    // Columns: A=Date, B=Account, C=Device, D=Clicks, E=Impressions, F=CTR, G=Avg.CPC, H=Cost, I=Avg.CPM, J=Conversions, K=Cross-device, L=Cost/conv
    const weeklyDesktopAgg = new Map<string, WeeklyRow>()
    const weeklyMobileAgg = new Map<string, WeeklyRow>()
    
    rows.slice(1).forEach(row => {
      const dateStr = row[0]
      const device = (row[2] || '').toLowerCase()
      if (!dateStr) return
      
      // Determine which week this date belongs to
      const date = parseDate(dateStr)
      const weekStart = getWeekStart(date)
      
      // Calculate week_end as week_start + 6 days
      const startDate = parseDate(weekStart)
      const endDate = new Date(startDate)
      endDate.setDate(startDate.getDate() + 6)
      const weekEnd = `${endDate.getFullYear()}-${String(endDate.getMonth() + 1).padStart(2, '0')}-${String(endDate.getDate()).padStart(2, '0')}`
      
      // Determine which map to use based on device type
      let targetMap: Map<string, WeeklyRow>
      if (device.includes('mobile') || device.includes('tablet')) {
        targetMap = weeklyMobileAgg
      } else {
        targetMap = weeklyDesktopAgg
      }
      
      const key = weekStart
      const existing = targetMap.get(key) || {
        week_start: weekStart,
        week_end: weekEnd,
        spend: 0,
        impressions: 0,
        clicks: 0,
        ctr: 0,
        avg_cpc: 0,
        conversions: 0,
        conv_rate: 0,
        conv_value: 0,
      }
      
      existing.clicks += parseNumber(row[3])
      existing.impressions += parseNumber(row[4])
      existing.spend += parseNumber(row[7])
      existing.conversions += parseNumber(row[9])
      
      targetMap.set(key, existing)
    })

    // Convert to arrays and sort by week_start descending
    const allDesktopWeeks = Array.from(weeklyDesktopAgg.values())
      .sort((a, b) => b.week_start.localeCompare(a.week_start))
    const allMobileWeeks = Array.from(weeklyMobileAgg.values())
      .sort((a, b) => b.week_start.localeCompare(a.week_start))
    
    // Determine current week's Monday to filter out incomplete weeks
    const now = new Date()
    const currentWeekStart = getWeekStart(now)
    
    // Filter out the current week (incomplete) - only show complete weeks
    const completeDesktopWeeks = allDesktopWeeks.filter(w => w.week_start < currentWeekStart)
    const completeMobileWeeks = allMobileWeeks.filter(w => w.week_start < currentWeekStart)

    const formatWeek = (w: WeeklyRow | undefined, label: string) => {
      if (!w) {
        return {
          week_label: label,
          date_range: 'No data',
          spend: 0,
          impressions: 0,
          clicks: 0,
          ctr: 0,
          conversions: 0,
          conversion_rate: 0,
          cpa: 0,
          roas: 0,
        }
      }
      
      const ctr = w.impressions > 0 ? (w.clicks / w.impressions) * 100 : 0
      const convRate = w.clicks > 0 ? (w.conversions / w.clicks) * 100 : 0
      const cpa = w.conversions > 0 ? w.spend / w.conversions : 0
      const roas = w.spend > 0 ? w.conv_value / w.spend : 0
      
      return {
        week_label: label,
        date_range: formatDateRange(w.week_start),
        spend: Math.round(w.spend),
        impressions: Math.round(w.impressions),
        clicks: Math.round(w.clicks),
        ctr: Math.round(ctr * 100) / 100,
        conversions: Math.round(w.conversions),
        conversion_rate: Math.round(convRate * 100) / 100,
        cpa: Math.round(cpa),
        roas: Math.round(roas * 100) / 100,
      }
    }

    const data = {
      desktop: {
        this_week: formatWeek(completeDesktopWeeks[0], 'Prior Week'),
        last_week: formatWeek(completeDesktopWeeks[1], '2 Weeks Ago'),
        two_weeks_ago: formatWeek(completeDesktopWeeks[2], '3 Weeks Ago'),
        three_weeks_ago: formatWeek(completeDesktopWeeks[3], '4 Weeks Ago'),
      },
      mobile: {
        this_week: formatWeek(completeMobileWeeks[0], 'Prior Week'),
        last_week: formatWeek(completeMobileWeeks[1], '2 Weeks Ago'),
        two_weeks_ago: formatWeek(completeMobileWeeks[2], '3 Weeks Ago'),
        three_weeks_ago: formatWeek(completeMobileWeeks[3], '4 Weeks Ago'),
      },
      last_updated: new Date().toISOString(),
    }

    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=60',
      },
    })
  } catch (error) {
    console.error('Error fetching ads data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch data', details: String(error) },
      { status: 500 }
    )
  }
}
