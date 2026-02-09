import { google } from 'googleapis'
import { NextResponse } from 'next/server'

const SHEET_ID = '1T8PZjlf2vBz7YTlz1GCXe68UczWGL8_ERYuBLd_r6H0'
const CHANNEL_RANGE = 'GA4: Traffic Weekly Channel!A:E'

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

function getWeekStart(date: Date): string {
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
      range: CHANNEL_RANGE,
    })

    const rows = response.data.values
    if (!rows || rows.length < 2) {
      return NextResponse.json({ error: 'No data found' }, { status: 404 })
    }

    // Structure: Date | First user default channel group | New users | Total users | Ecommerce purchases
    // Aggregate daily rows into weekly buckets by channel
    const weeklyData = new Map<string, Map<string, { users: number; purchases: number }>>()

    rows.slice(1).forEach(row => {
      const dateStr = row[0]
      const channel = row[1]
      if (!dateStr || !channel) return

      const date = parseDate(dateStr)
      const weekKey = getWeekStart(date)

      const users = parseNumber(row[2])     // New users (column C)
      const purchases = parseNumber(row[4]) // Ecommerce purchases (column E)

      if (!weeklyData.has(weekKey)) {
        weeklyData.set(weekKey, new Map())
      }

      const weekMap = weeklyData.get(weekKey)!
      const existing = weekMap.get(channel) || { users: 0, purchases: 0 }
      existing.users += users
      existing.purchases += purchases
      weekMap.set(channel, existing)
    })

    // Get last 5 weeks starting from current week
    const now = new Date()
    const currentWeekStart = getWeekStart(now)

    const sortedWeeks = Array.from(weeklyData.keys()).sort().reverse()
    const currentWeekIndex = sortedWeeks.indexOf(currentWeekStart)
    const last5Weeks = currentWeekIndex >= 0
      ? sortedWeeks.slice(currentWeekIndex, currentWeekIndex + 5)
      : sortedWeeks.slice(0, 5)

    // Collect all channel names across all 5 weeks
    const allChannels = new Set<string>()
    last5Weeks.forEach(weekKey => {
      const weekMap = weeklyData.get(weekKey)!
      weekMap.forEach((_, channel) => allChannels.add(channel))
    })

    // Sort channels by total users across all 5 weeks (descending)
    const channelTotals = Array.from(allChannels).map(channel => {
      let totalUsers = 0
      last5Weeks.forEach(weekKey => {
        const weekMap = weeklyData.get(weekKey)!
        const data = weekMap.get(channel)
        if (data) totalUsers += data.users
      })
      return { channel, totalUsers }
    })
    channelTotals.sort((a, b) => b.totalUsers - a.totalUsers)

    const labels = ['This Week', 'Last Week', '2 Weeks Ago', '3 Weeks Ago', '4 Weeks Ago']

    // Build week headers
    const weekHeaders = last5Weeks.map((weekKey, idx) => ({
      label: labels[idx],
      date_range: formatDateRange(weekKey),
    }))

    // Build channel data
    const channels = channelTotals.map(({ channel }) => ({
      channel,
      weeks: last5Weeks.map((weekKey, idx) => {
        const weekMap = weeklyData.get(weekKey)!
        const data = weekMap.get(channel) || { users: 0, purchases: 0 }
        return {
          label: labels[idx],
          date_range: formatDateRange(weekKey),
          users: data.users,
          purchases: data.purchases,
        }
      }),
    }))

    return NextResponse.json({
      channels,
      week_headers: weekHeaders,
      last_updated: new Date().toISOString(),
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=60',
      },
    })
  } catch (error) {
    console.error('Error fetching traffic channel data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch data', details: String(error) },
      { status: 500 }
    )
  }
}
