import { google } from 'googleapis'
import { NextResponse } from 'next/server'

// Adveronix: Paid Search sheet
const SHEET_ID = '1T8PZjlf2vBz7YTlz1GCXe68UczWGL8_ERYuBLd_r6H0'
const SESSION_SOURCE_RANGE = 'GA4: Traffic Weekly Session Source!A:E'
const CHANNEL_GROUP_RANGE = 'GA4: Traffic Weekly Channel!A:E'

function parseNumber(val: string): number {
  if (!val) return 0
  const cleaned = val.replace(/[,$%]/g, '')
  return parseFloat(cleaned) || 0
}

function parseWeekDate(weekStr: string): Date {
  // Handle both formats: "2025-12-28" and "M/D/YYYY"
  if (weekStr.includes('/')) {
    const [month, day, year] = weekStr.split('/').map(Number)
    return new Date(year, month - 1, day)
  } else {
    const [year, month, day] = weekStr.split('-').map(Number)
    return new Date(year, month - 1, day)
  }
}

function formatWeekLabel(weekDate: Date): string {
  const endDate = new Date(weekDate)
  endDate.setDate(weekDate.getDate() + 6)
  const opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' }
  return `${weekDate.toLocaleDateString('en-US', opts)} - ${endDate.toLocaleDateString('en-US', opts)}`
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
    
    // Fetch both tabs
    const [sessionSourceRes, channelGroupRes] = await Promise.all([
      sheets.spreadsheets.values.get({
        spreadsheetId: SHEET_ID,
        range: SESSION_SOURCE_RANGE,
      }),
      sheets.spreadsheets.values.get({
        spreadsheetId: SHEET_ID,
        range: CHANNEL_GROUP_RANGE,
      })
    ])

    const sessionSourceRows = sessionSourceRes.data.values
    const channelGroupRows = channelGroupRes.data.values
    
    if (!sessionSourceRows || sessionSourceRows.length < 2) {
      return NextResponse.json({ error: 'No session source data found' }, { status: 404 })
    }

    // Group session source data by week
    // Structure: Week | Session source/medium | New users | Total users | Purchases
    const weeklySourceData = new Map<string, Map<string, { users: number; purchases: number }>>()
    
    sessionSourceRows.slice(1).forEach(row => {
      const weekStr = row[0]
      const sourceMedium = row[1]?.toLowerCase() || ''
      if (!weekStr) return
      
      const weekDate = parseWeekDate(weekStr)
      const weekKey = weekDate.toISOString().split('T')[0]
      
      if (!weeklySourceData.has(weekKey)) {
        weeklySourceData.set(weekKey, new Map())
      }
      
      const weekData = weeklySourceData.get(weekKey)!
      const users = parseNumber(row[3]) // Total users column
      const purchases = parseNumber(row[4]) // Ecommerce purchases column
      
      // Categorize sources
      let category = 'other'
      if (sourceMedium.includes('google') && sourceMedium.includes('organic')) {
        category = 'google_organic'
      } else if (sourceMedium.includes('bing') && sourceMedium.includes('organic')) {
        category = 'bing_organic'
      } else if (sourceMedium.includes('bing') && sourceMedium.includes('cpc')) {
        category = 'bing_cpc'
      } else if (sourceMedium.includes('(direct)') || sourceMedium.includes('(none)')) {
        category = 'direct'
      } else if (sourceMedium.includes('quickbooks.intuit.com')) {
        category = 'qb_intuit'
      }
      
      const existing = weekData.get(category) || { users: 0, purchases: 0 }
      existing.users += users
      existing.purchases += purchases
      weekData.set(category, existing)
    })

    // Group channel data by week for totals
    const weeklyChannelData = new Map<string, { total_users: number; total_purchases: number; paid_users: number; paid_purchases: number }>()
    
    if (channelGroupRows && channelGroupRows.length > 1) {
      // First, aggregate by week (sum all channels)
      const weekTotals = new Map<string, Map<string, { users: number; purchases: number }>>()
      
      channelGroupRows.slice(1).forEach(row => {
        const weekStr = row[0]
        const channelGroup = row[1]?.toLowerCase() || ''
        if (!weekStr) return
        
        const weekDate = parseWeekDate(weekStr)
        const weekKey = weekDate.toISOString().split('T')[0]
        
        if (!weekTotals.has(weekKey)) {
          weekTotals.set(weekKey, new Map())
        }
        
        const weekData = weekTotals.get(weekKey)!
        const users = parseNumber(row[3])
        const purchases = parseNumber(row[4])
        
        const existing = weekData.get(channelGroup) || { users: 0, purchases: 0 }
        existing.users += users
        existing.purchases += purchases
        weekData.set(channelGroup, existing)
      })
      
      // Calculate totals and paid totals per week
      weekTotals.forEach((channelMap, weekKey) => {
        let total_users = 0
        let total_purchases = 0
        let paid_users = 0
        let paid_purchases = 0
        
        channelMap.forEach((data, channel) => {
          total_users += data.users
          total_purchases += data.purchases
          
          if (channel.includes('paid')) {
            paid_users += data.users
            paid_purchases += data.purchases
          }
        })
        
        weeklyChannelData.set(weekKey, { total_users, total_purchases, paid_users, paid_purchases })
      })
    }

    // Get last 5 weeks
    const sortedWeeks = Array.from(weeklySourceData.keys()).sort().reverse()
    const last5Weeks = sortedWeeks.slice(0, 5)

    const formatWeek = (weekKey: string, label: string) => {
      const sourceData = weeklySourceData.get(weekKey)
      const channelData = weeklyChannelData.get(weekKey)
      
      const googleOrganic = sourceData?.get('google_organic') || { users: 0, purchases: 0 }
      const bingOrganic = sourceData?.get('bing_organic') || { users: 0, purchases: 0 }
      const direct = sourceData?.get('direct') || { users: 0, purchases: 0 }
      const qbIntuit = sourceData?.get('qb_intuit') || { users: 0, purchases: 0 }
      const bingCpc = sourceData?.get('bing_cpc') || { users: 0, purchases: 0 }
      
      const totalUsers = channelData?.total_users || 1
      const totalPurchases = channelData?.total_purchases || 1
      const paidUsers = channelData?.paid_users || 0
      const paidPurchases = channelData?.paid_purchases || 0
      
      // Calculate "Other" as residual
      const knownUsers = paidUsers + googleOrganic.users + direct.users + bingOrganic.users + qbIntuit.users
      const knownPurchases = paidPurchases + googleOrganic.purchases + direct.purchases + bingOrganic.purchases + qbIntuit.purchases
      const otherUsers = Math.max(0, totalUsers - knownUsers)
      const otherPurchases = Math.max(0, totalPurchases - knownPurchases)
      
      const weekDate = parseWeekDate(weekKey)
      
      return {
        week: formatWeekLabel(weekDate),
        label,
        google_organic: {
          users: googleOrganic.users,
          purchases: googleOrganic.purchases,
          percent_users: (googleOrganic.users / totalUsers) * 100,
          percent_purchases: (googleOrganic.purchases / totalPurchases) * 100
        },
        direct: {
          users: direct.users,
          purchases: direct.purchases,
          percent_users: (direct.users / totalUsers) * 100,
          percent_purchases: (direct.purchases / totalPurchases) * 100
        },
        bing_organic: {
          users: bingOrganic.users,
          purchases: bingOrganic.purchases,
          percent_users: (bingOrganic.users / totalUsers) * 100,
          percent_purchases: (bingOrganic.purchases / totalPurchases) * 100
        },
        qb_intuit: {
          users: qbIntuit.users,
          purchases: qbIntuit.purchases,
          percent_users: (qbIntuit.users / totalUsers) * 100,
          percent_purchases: (qbIntuit.purchases / totalPurchases) * 100
        },
        paid: {
          users: paidUsers,
          purchases: paidPurchases,
          percent_users: (paidUsers / totalUsers) * 100,
          percent_purchases: (paidPurchases / totalPurchases) * 100
        },
        other: {
          users: otherUsers,
          purchases: otherPurchases,
          percent_users: (otherUsers / totalUsers) * 100,
          percent_purchases: (otherPurchases / totalPurchases) * 100
        },
        total: {
          users: totalUsers,
          purchases: totalPurchases
        }
      }
    }

    const weekLabels = ['Last Week', '2 Weeks Ago', '3 Weeks Ago', '4 Weeks Ago', '5 Weeks Ago']
    const formattedWeeks = last5Weeks.map((weekKey, idx) => formatWeek(weekKey, weekLabels[idx]))

    // Build response in expected format for /ads page
    const buildWeekResponse = (weekData: ReturnType<typeof formatWeek> | undefined) => {
      if (!weekData) {
        return {
          week_label: 'N/A',
          date_range: 'No data',
          totals: { users: 0, purchases: 0 },
          google_ads: { users: 0, purchases: 0, conv_rate: 0, pct_of_users: 0, pct_of_purchases: 0 },
          google_organic: { users: 0, purchases: 0, conv_rate: 0, pct_of_users: 0, pct_of_purchases: 0 },
          direct: { users: 0, purchases: 0, conv_rate: 0, pct_of_users: 0, pct_of_purchases: 0 },
          bing_organic: { users: 0, purchases: 0, conv_rate: 0, pct_of_users: 0, pct_of_purchases: 0 },
          qb_intuit: { users: 0, purchases: 0, conv_rate: 0, pct_of_users: 0, pct_of_purchases: 0 },
          other: { users: 0, purchases: 0, conv_rate: 0, pct_of_users: 0, pct_of_purchases: 0 },
        }
      }
      
      const formatChannel = (ch: { users: number; purchases: number; percent_users: number; percent_purchases: number }) => ({
        users: ch.users,
        purchases: ch.purchases,
        conv_rate: ch.users > 0 ? (ch.purchases / ch.users) * 100 : 0,
        pct_of_users: ch.percent_users,
        pct_of_purchases: ch.percent_purchases,
      })
      
      return {
        week_label: weekData.label,
        date_range: weekData.week,
        totals: weekData.total,
        google_ads: formatChannel(weekData.paid),
        google_organic: formatChannel(weekData.google_organic),
        direct: formatChannel(weekData.direct),
        bing_organic: formatChannel(weekData.bing_organic),
        qb_intuit: formatChannel(weekData.qb_intuit),
        other: formatChannel(weekData.other),
      }
    }

    return NextResponse.json({
      this_week: buildWeekResponse(formattedWeeks[0]),
      last_week: buildWeekResponse(formattedWeeks[1]),
      two_weeks_ago: buildWeekResponse(formattedWeeks[2]),
      three_weeks_ago: buildWeekResponse(formattedWeeks[3]),
      data: formattedWeeks,
      last_updated: new Date().toISOString()
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=60',
      },
    })
  } catch (error) {
    console.error('Error fetching organic traffic data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch data', details: String(error) },
      { status: 500 }
    )
  }
}
