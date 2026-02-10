import { google } from 'googleapis'
import { NextResponse } from 'next/server'

const SHEET_ID = '1T8PZjlf2vBz7YTlz1GCXe68UczWGL8_ERYuBLd_r6H0'
const RANGE = 'Age Analysis_Device!A:J'

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

function formatMonth(date: Date): string {
  return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
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

    // Structure: Month | Device | Age | Clicks | Impressions | CTR | Avg. CPC | Cost | Avg. CPM | Conversions
    // Group by month and age, aggregating across devices
    const monthlyData = new Map<string, Map<string, {
      clicks: number
      impressions: number
      ctr: number
      avg_cpc: number
      cost: number
      avg_cpm: number
      conversions: number
      device_counts: number
    }>>()
    
    rows.slice(1).forEach(row => {
      const monthStr = row[0]
      const device = row[1]
      const age = row[2]
      if (!monthStr || !age) return
      
      const monthDate = parseDate(monthStr)
      const monthKey = monthDate.toISOString().slice(0, 7) // YYYY-MM
      const monthLabel = formatMonth(monthDate)
      
      const clicks = parseNumber(row[3])
      const impressions = parseNumber(row[4])
      const ctr = parseNumber(row[5])
      const avg_cpc = parseNumber(row[6])
      const cost = parseNumber(row[7])
      const avg_cpm = parseNumber(row[8])
      const conversions = parseNumber(row[9])
      
      if (!monthlyData.has(monthKey)) {
        monthlyData.set(monthKey, new Map())
      }
      
      const monthMap = monthlyData.get(monthKey)!
      const existing = monthMap.get(age) || { 
        clicks: 0, 
        impressions: 0, 
        ctr: 0, 
        avg_cpc: 0, 
        cost: 0, 
        avg_cpm: 0, 
        conversions: 0,
        device_counts: 0
      }
      
      existing.clicks += clicks
      existing.impressions += impressions
      existing.ctr += ctr
      existing.avg_cpc += avg_cpc
      existing.cost += cost
      existing.avg_cpm += avg_cpm
      existing.conversions += conversions
      existing.device_counts += 1
      
      monthMap.set(age, existing)
    })

    // Sort months chronologically
    const sortedMonths = Array.from(monthlyData.keys()).sort()
    
    // Get all unique age groups (excluding Unknown for cleaner charts)
    const ageGroups = new Set<string>()
    monthlyData.forEach(monthMap => {
      monthMap.forEach((_, age) => {
        if (age !== 'Unknown') {
          ageGroups.add(age)
        }
      })
    })
    
    const sortedAges = Array.from(ageGroups).sort((a, b) => {
      // Sort age ranges properly
      const order = ['18-24', '25-34', '35-44', '45-54', '55-64', '>64']
      return order.indexOf(a) - order.indexOf(b)
    })

    // Build response data for each metric
    const chartData = {
      months: sortedMonths.map(monthKey => {
        const date = new Date(monthKey + '-01')
        return formatMonth(date)
      }),
      monthKeys: sortedMonths,
      ageGroups: sortedAges,
      clicks: sortedAges.map(age => ({
        age,
        data: sortedMonths.map(monthKey => {
          const monthMap = monthlyData.get(monthKey)!
          const ageData = monthMap.get(age)
          return ageData ? ageData.clicks : 0
        })
      })),
      impressions: sortedAges.map(age => ({
        age,
        data: sortedMonths.map(monthKey => {
          const monthMap = monthlyData.get(monthKey)!
          const ageData = monthMap.get(age)
          return ageData ? ageData.impressions : 0
        })
      })),
      ctr: sortedAges.map(age => ({
        age,
        data: sortedMonths.map(monthKey => {
          const monthMap = monthlyData.get(monthKey)!
          const ageData = monthMap.get(age)
          if (!ageData) return 0
          return ageData.device_counts > 0 ? ageData.ctr / ageData.device_counts : 0
        })
      })),
      avg_cpc: sortedAges.map(age => ({
        age,
        data: sortedMonths.map(monthKey => {
          const monthMap = monthlyData.get(monthKey)!
          const ageData = monthMap.get(age)
          if (!ageData) return 0
          return ageData.device_counts > 0 ? ageData.avg_cpc / ageData.device_counts : 0
        })
      })),
      cost: sortedAges.map(age => ({
        age,
        data: sortedMonths.map(monthKey => {
          const monthMap = monthlyData.get(monthKey)!
          const ageData = monthMap.get(age)
          return ageData ? ageData.cost : 0
        })
      })),
      conversions: sortedAges.map(age => ({
        age,
        data: sortedMonths.map(monthKey => {
          const monthMap = monthlyData.get(monthKey)!
          const ageData = monthMap.get(age)
          return ageData ? ageData.conversions : 0
        })
      })),
    }

    return NextResponse.json({
      chartData,
      last_updated: new Date().toISOString()
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=60',
      },
    })
  } catch (error) {
    console.error('Error fetching age analysis data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch data', details: String(error) },
      { status: 500 }
    )
  }
}
