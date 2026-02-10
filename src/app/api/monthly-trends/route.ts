import { google } from 'googleapis'
import { NextResponse } from 'next/server'

const SHEET_ID = '1hMprZQev8sFG1E7Y2xJy3ucg0BgIE_BxYHXyaGGf7NA'
const RANGE = 'Summary: Day!A:J'

function parseNumber(val: string | undefined): number | null {
  if (!val || val.trim() === '') return null
  const cleaned = val.replace(/[$,]/g, '')
  const num = parseFloat(cleaned)
  return isNaN(num) ? null : num
}

function parseDate(dateStr: string): Date | null {
  try {
    if (dateStr.includes('/')) {
      const [month, day, year] = dateStr.split('/').map(Number)
      return new Date(year, month - 1, day)
    } else {
      // ISO format: 2026-01-28
      const [year, month, day] = dateStr.split('-').map(Number)
      return new Date(year, month - 1, day)
    }
  } catch {
    return null
  }
}

// Week number within a month: day 1-7 = Wk 1, 8-14 = Wk 2, etc.
function getWeekOfMonth(day: number): number {
  return Math.ceil(day / 7)
}

interface DayRow {
  date: Date
  month_key: string // "2026-02"
  day_of_month: number
  week_of_month: number
  direct_qty: number
  direct_revenue: number
  renewal_qty: number
  renewal_revenue: number
  total_gross_revenue: number
  cert: number
  duo: number
  team: number
  learner: number
}

interface MonthAggregated {
  month_key: string
  month_label: string // "Feb 26"
  // Cumulative by week: { "Wk 1": value, "Wk 2": value, ... }
  direct_qty: Record<string, number | null>
  direct_revenue: Record<string, number | null>
  renewal_qty: Record<string, number | null>
  renewal_revenue: Record<string, number | null>
  total_gross_revenue: Record<string, number | null>
  // Product mix (month total)
  total_direct_qty: number
  cert_total: number
  team_total: number
  learner_total: number
}

const WEEK_COLUMNS = ['Wk 1', 'Wk 2', 'Wk 3', 'Wk 4', 'Wk 5']
const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export async function GET() {
  try {
    const credsJson = process.env.SHEETS_READER_CREDENTIALS || process.env.GOOGLE_SHEETS_CREDENTIALS
    if (!credsJson) {
      return NextResponse.json({ error: 'Missing credentials' }, { status: 500 })
    }

    const credentials = JSON.parse(Buffer.from(credsJson, 'base64').toString('utf-8'))
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

    // Parse daily rows
    const dailyData: DayRow[] = []
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i]
      if (!row[0]) continue
      const date = parseDate(row[0])
      if (!date) continue

      const day = date.getDate()
      dailyData.push({
        date,
        month_key: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`,
        day_of_month: day,
        week_of_month: getWeekOfMonth(day),
        direct_qty: parseNumber(row[1]) ?? 0,
        direct_revenue: parseNumber(row[6]) ?? 0,
        renewal_qty: parseNumber(row[7]) ?? 0,
        renewal_revenue: parseNumber(row[8]) ?? 0,
        total_gross_revenue: parseNumber(row[9]) ?? 0,
        cert: parseNumber(row[2]) ?? 0,
        duo: parseNumber(row[3]) ?? 0,
        team: parseNumber(row[4]) ?? 0,
        learner: parseNumber(row[5]) ?? 0,
      })
    }

    // Group by month and build cumulative weekly buckets
    const monthMap = new Map<string, DayRow[]>()
    for (const day of dailyData) {
      const existing = monthMap.get(day.month_key) || []
      existing.push(day)
      monthMap.set(day.month_key, existing)
    }

    // Find which week the current month is in (to know which weeks have data)
    const today = new Date()
    const currentMonthKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`
    const currentWeekOfMonth = getWeekOfMonth(today.getDate())

    const allMonths: MonthAggregated[] = []
    for (const [monthKey, days] of monthMap) {
      const [yearStr, monthStr] = monthKey.split('-')
      const monthLabel = `${MONTH_NAMES[parseInt(monthStr) - 1]} ${yearStr.slice(2)}`
      const isCurrentMonth = monthKey === currentMonthKey

      // Sort days by date
      days.sort((a, b) => a.day_of_month - b.day_of_month)

      // Build cumulative totals by week
      const cumDirectQty: Record<string, number | null> = {}
      const cumDirectRevenue: Record<string, number | null> = {}
      const cumRenewalQty: Record<string, number | null> = {}
      const cumRenewalRevenue: Record<string, number | null> = {}
      const cumTotalGross: Record<string, number | null> = {}

      let runningDirectQty = 0
      let runningDirectRevenue = 0
      let runningRenewalQty = 0
      let runningRenewalRevenue = 0
      let runningTotalGross = 0
      let certTotal = 0
      let teamTotal = 0
      let learnerTotal = 0

      // Group days by week, accumulate
      for (const wk of WEEK_COLUMNS) {
        const wkNum = parseInt(wk.split(' ')[1])
        const weekDays = days.filter(d => d.week_of_month === wkNum)

        if (weekDays.length === 0) {
          // For current month, future weeks are null. For past months, weeks with no data are null.
          if (isCurrentMonth && wkNum > currentWeekOfMonth) {
            cumDirectQty[wk] = null
            cumDirectRevenue[wk] = null
            cumRenewalQty[wk] = null
            cumRenewalRevenue[wk] = null
            cumTotalGross[wk] = null
          } else {
            // Past month but no data for this week (e.g., months with <29 days have no Wk 5)
            cumDirectQty[wk] = null
            cumDirectRevenue[wk] = null
            cumRenewalQty[wk] = null
            cumRenewalRevenue[wk] = null
            cumTotalGross[wk] = null
          }
          continue
        }

        for (const d of weekDays) {
          runningDirectQty += d.direct_qty
          runningDirectRevenue += d.direct_revenue
          runningRenewalQty += d.renewal_qty
          runningRenewalRevenue += d.renewal_revenue
          runningTotalGross += d.total_gross_revenue
          certTotal += d.cert
          teamTotal += d.team
          learnerTotal += d.learner
        }

        cumDirectQty[wk] = runningDirectQty
        cumDirectRevenue[wk] = Math.round(runningDirectRevenue)
        cumRenewalQty[wk] = runningRenewalQty
        cumRenewalRevenue[wk] = Math.round(runningRenewalRevenue)
        cumTotalGross[wk] = Math.round(runningTotalGross)
      }

      allMonths.push({
        month_key: monthKey,
        month_label: monthLabel,
        direct_qty: cumDirectQty,
        direct_revenue: cumDirectRevenue,
        renewal_qty: cumRenewalQty,
        renewal_revenue: cumRenewalRevenue,
        total_gross_revenue: cumTotalGross,
        total_direct_qty: runningDirectQty,
        cert_total: certTotal,
        team_total: teamTotal,
        learner_total: learnerTotal,
      })
    }

    // Sort by month_key
    allMonths.sort((a, b) => a.month_key.localeCompare(b.month_key))

    // Find current month index
    const currentIdx = allMonths.findIndex(m => m.month_key === currentMonthKey)
    if (currentIdx < 0) {
      return NextResponse.json({ error: 'No current month data found' }, { status: 404 })
    }

    // Build result: Current Month, Last Month, 2-5 Months Ago, Same Month PY
    const labels = ['Current Month', 'Last Month', '2 Months Ago', '3 Months Ago', '4 Months Ago', '5 Months Ago']
    const result = []

    for (let i = 0; i < 6; i++) {
      const idx = currentIdx - i
      if (idx >= 0) {
        result.push({ ...allMonths[idx], row_label: labels[i] })
      }
    }

    // Same Month Prior Year
    const pyIdx = currentIdx - 12
    if (pyIdx >= 0) {
      result.push({ ...allMonths[pyIdx], row_label: 'Same Month PY' })
    }

    return NextResponse.json({
      months: result,
      weeks: WEEK_COLUMNS,
    }, {
      headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' },
    })
  } catch (error) {
    console.error('Monthly trends error:', error)
    return NextResponse.json({ error: 'Failed to fetch monthly trends' }, { status: 500 })
  }
}
