import { google } from 'googleapis'
import { NextResponse } from 'next/server'

const SHEET_ID = '1hMprZQev8sFG1E7Y2xJy3ucg0BgIE_BxYHXyaGGf7NA'
// Columns A (date) and BI:BL (Organic, Direct, Referral, Paid traffic)
const RANGE = 'Summary: Day!A:BL'

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
      const [year, month, day] = dateStr.split('-').map(Number)
      return new Date(year, month - 1, day)
    }
  } catch {
    return null
  }
}

function getWeekOfMonth(day: number): number {
  return Math.ceil(day / 7)
}

// ISO week number (1-52/53) for YoY charts
function getISOWeekNumber(d: Date): number {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()))
  date.setUTCDate(date.getUTCDate() + 4 - (date.getUTCDay() || 7))
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1))
  return Math.ceil((((date.getTime() - yearStart.getTime()) / 86400000) + 1) / 7)
}

interface DayRow {
  date: Date
  year: number
  month_key: string
  day_of_month: number
  week_of_month: number
  iso_week: number
  organic: number
  direct: number
  referral: number
  paid: number
  total: number
}

interface MonthAggregated {
  month_key: string
  month_label: string
  organic: Record<string, number | null>
  direct: Record<string, number | null>
  referral: Record<string, number | null>
  paid: Record<string, number | null>
  total: Record<string, number | null>
  // Month totals for source mix
  organic_total: number
  direct_total: number
  referral_total: number
  paid_total: number
  grand_total: number
}

const WEEK_COLUMNS = ['Wk 1', 'Wk 2', 'Wk 3', 'Wk 4', 'Wk 5']
const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

// BI=60, BJ=61, BK=62, BL=63
const COL_ORGANIC = 60
const COL_DIRECT = 61
const COL_REFERRAL = 62
const COL_PAID = 63

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

      const organic = parseNumber(row[COL_ORGANIC]) ?? 0
      const direct = parseNumber(row[COL_DIRECT]) ?? 0
      const referral = parseNumber(row[COL_REFERRAL]) ?? 0
      const paid = parseNumber(row[COL_PAID]) ?? 0

      dailyData.push({
        date,
        year: date.getFullYear(),
        month_key: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`,
        day_of_month: date.getDate(),
        week_of_month: getWeekOfMonth(date.getDate()),
        iso_week: getISOWeekNumber(date),
        organic,
        direct,
        referral,
        paid,
        total: organic + direct + referral + paid,
      })
    }

    // === MONTHLY TRENDS (cumulative weekly buckets) ===
    const monthMap = new Map<string, DayRow[]>()
    for (const day of dailyData) {
      const existing = monthMap.get(day.month_key) || []
      existing.push(day)
      monthMap.set(day.month_key, existing)
    }

    const today = new Date()
    const currentMonthKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`
    const currentWeekOfMonth = getWeekOfMonth(today.getDate())

    const allMonths: MonthAggregated[] = []
    for (const [monthKey, days] of monthMap) {
      const [yearStr, monthStr] = monthKey.split('-')
      const monthLabel = `${MONTH_NAMES[parseInt(monthStr) - 1]} ${yearStr.slice(2)}`
      const isCurrentMonth = monthKey === currentMonthKey

      days.sort((a, b) => a.day_of_month - b.day_of_month)

      const cumOrganic: Record<string, number | null> = {}
      const cumDirect: Record<string, number | null> = {}
      const cumReferral: Record<string, number | null> = {}
      const cumPaid: Record<string, number | null> = {}
      const cumTotal: Record<string, number | null> = {}

      let runOrganic = 0, runDirect = 0, runReferral = 0, runPaid = 0, runTotal = 0

      for (const wk of WEEK_COLUMNS) {
        const wkNum = parseInt(wk.split(' ')[1])
        const weekDays = days.filter(d => d.week_of_month === wkNum)

        if (weekDays.length === 0) {
          cumOrganic[wk] = null
          cumDirect[wk] = null
          cumReferral[wk] = null
          cumPaid[wk] = null
          cumTotal[wk] = null
          continue
        }

        for (const d of weekDays) {
          runOrganic += d.organic
          runDirect += d.direct
          runReferral += d.referral
          runPaid += d.paid
          runTotal += d.total
        }

        cumOrganic[wk] = runOrganic
        cumDirect[wk] = runDirect
        cumReferral[wk] = runReferral
        cumPaid[wk] = runPaid
        cumTotal[wk] = runTotal
      }

      allMonths.push({
        month_key: monthKey,
        month_label: monthLabel,
        organic: cumOrganic,
        direct: cumDirect,
        referral: cumReferral,
        paid: cumPaid,
        total: cumTotal,
        organic_total: runOrganic,
        direct_total: runDirect,
        referral_total: runReferral,
        paid_total: runPaid,
        grand_total: runTotal,
      })
    }

    allMonths.sort((a, b) => a.month_key.localeCompare(b.month_key))

    const currentIdx = allMonths.findIndex(m => m.month_key === currentMonthKey)
    if (currentIdx < 0) {
      return NextResponse.json({ error: 'No current month data found' }, { status: 404 })
    }

    const labels = ['Current Month', 'Last Month', '2 Months Ago', '3 Months Ago', '4 Months Ago', '5 Months Ago']
    const monthlyResult = []
    for (let i = 0; i < 6; i++) {
      const idx = currentIdx - i
      if (idx >= 0) {
        monthlyResult.push({ ...allMonths[idx], row_label: labels[i] })
      }
    }
    const pyIdx = currentIdx - 12
    if (pyIdx >= 0) {
      monthlyResult.push({ ...allMonths[pyIdx], row_label: 'Same Month PY' })
    }

    // === YoY by ISO Week (like weeklyQtyYoY) ===
    const weeklyByYear = new Map<string, Map<number, number>>()
    const sources = ['organic', 'direct', 'referral', 'paid', 'total'] as const
    for (const src of sources) {
      weeklyByYear.set(src, new Map())
    }

    for (const d of dailyData) {
      const yr = d.year
      if (yr < 2024) continue
      for (const src of sources) {
        const srcMap = weeklyByYear.get(src)!
        const wk = d.iso_week
        const key = yr * 100 + wk // e.g. 202406
        const srcVal: number = d[src]
        srcMap.set(key, (srcMap.get(key) ?? 0) + srcVal)
      }
    }

    // Build weekly YoY arrays per source
    const weeklyYoY: Record<string, { week_num: number; week_label: string; y2024: number | null; y2025: number | null; y2026: number | null }[]> = {}
    const currentISOWeek = getISOWeekNumber(today)

    for (const src of sources) {
      const srcMap = weeklyByYear.get(src)!
      const weeks = []
      for (let w = 1; w <= 52; w++) {
        const v2024 = srcMap.get(2024 * 100 + w) ?? null
        const v2025 = srcMap.get(2025 * 100 + w) ?? null
        const v2026 = srcMap.get(2026 * 100 + w) ?? null
        weeks.push({
          week_num: w,
          week_label: `W${w}`,
          y2024: v2024,
          y2025: v2025,
          y2026: v2026,
        })
      }
      weeklyYoY[src] = weeks
    }

    // === YoY by Month (like monthlyQtyYoY) ===
    const monthlyByYear = new Map<string, Map<string, number>>()
    for (const src of sources) {
      monthlyByYear.set(src, new Map())
    }

    for (const d of dailyData) {
      const yr = d.year
      if (yr < 2024) continue
      const mon = d.date.getMonth() + 1
      for (const src of sources) {
        const srcMap = monthlyByYear.get(src)!
        const key = `${yr}-${mon}`
        const srcVal: number = d[src]
        srcMap.set(key, (srcMap.get(key) ?? 0) + srcVal)
      }
    }

    const monthlyYoY: Record<string, { month_num: number; month_label: string; y2024: number | null; y2025: number | null; y2026: number | null }[]> = {}
    const currentMonth = today.getMonth() + 1

    for (const src of sources) {
      const srcMap = monthlyByYear.get(src)!
      const months = []
      for (let m = 1; m <= 12; m++) {
        const v2024 = srcMap.get(`2024-${m}`) ?? null
        const v2025 = srcMap.get(`2025-${m}`) ?? null
        const v2026 = srcMap.get(`2026-${m}`) ?? null
        months.push({
          month_num: m,
          month_label: MONTH_NAMES[m - 1],
          y2024: v2024,
          y2025: v2025,
          y2026: v2026,
        })
      }
      monthlyYoY[src] = months
    }

    // === Weekly Trends with daily cumulative (like Sales heatmap) ===
    const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

    // Group daily data by ISO week for current year
    const getWeekStart = (d: Date): string => {
      const day = d.getDay() // 0=Sun
      const start = new Date(d)
      start.setDate(start.getDate() - day)
      return `${MONTH_NAMES[start.getMonth()]} ${String(start.getDate()).padStart(2, '0')}`
    }

    // Get the current ISO week's Sunday
    const todayDow = today.getDay()
    const currentWeekSunday = new Date(today)
    currentWeekSunday.setDate(currentWeekSunday.getDate() - todayDow)
    currentWeekSunday.setHours(0, 0, 0, 0)

    // Build weeks: Current Week, Last Week, 2-5 Weeks Ago, Same Week LY
    const buildWeeklyTrends = (sourceKey: 'organic' | 'direct' | 'referral' | 'paid' | 'total') => {
      const weekRows = []
      const weekLabels = ['Current Week', 'Last Week', '2 Weeks Ago', '3 Weeks Ago', '4 Weeks Ago', '5 Weeks Ago']

      for (let w = 0; w < 6; w++) {
        const weekSunday = new Date(currentWeekSunday)
        weekSunday.setDate(weekSunday.getDate() - (w * 7))
        const weekStart = `${MONTH_NAMES[weekSunday.getMonth()]} ${String(weekSunday.getDate()).padStart(2, '0')}`

        const dailyCumulative: Record<string, number | null> = {}
        let runningTotal = 0

        for (let dayIdx = 0; dayIdx < 7; dayIdx++) {
          const dayDate = new Date(weekSunday)
          dayDate.setDate(dayDate.getDate() + dayIdx)
          dayDate.setHours(0, 0, 0, 0)

          // Check if this day is in the future
          if (dayDate > today) {
            dailyCumulative[DAY_NAMES[dayIdx]] = null
            continue
          }

          // Find matching daily data
          const match = dailyData.find(d =>
            d.date.getFullYear() === dayDate.getFullYear() &&
            d.date.getMonth() === dayDate.getMonth() &&
            d.date.getDate() === dayDate.getDate()
          )

          if (match) {
            runningTotal += match[sourceKey]
            dailyCumulative[DAY_NAMES[dayIdx]] = runningTotal
          } else {
            dailyCumulative[DAY_NAMES[dayIdx]] = runningTotal > 0 ? runningTotal : null
          }
        }

        weekRows.push({
          week_label: weekLabels[w],
          week_start: weekStart,
          daily_cumulative: dailyCumulative,
          week_total: runningTotal > 0 ? runningTotal : null,
        })
      }

      // Same Week Last Year
      const sameWeekLYSunday = new Date(currentWeekSunday)
      sameWeekLYSunday.setFullYear(sameWeekLYSunday.getFullYear() - 1)
      // Adjust to the nearest Sunday
      const lyDow = sameWeekLYSunday.getDay()
      sameWeekLYSunday.setDate(sameWeekLYSunday.getDate() - lyDow)
      const lyWeekStart = `${MONTH_NAMES[sameWeekLYSunday.getMonth()]} ${String(sameWeekLYSunday.getDate()).padStart(2, '0')}`

      const lyDailyCumulative: Record<string, number | null> = {}
      let lyRunning = 0
      for (let dayIdx = 0; dayIdx < 7; dayIdx++) {
        const dayDate = new Date(sameWeekLYSunday)
        dayDate.setDate(dayDate.getDate() + dayIdx)
        const match = dailyData.find(d =>
          d.date.getFullYear() === dayDate.getFullYear() &&
          d.date.getMonth() === dayDate.getMonth() &&
          d.date.getDate() === dayDate.getDate()
        )
        if (match) {
          lyRunning += match[sourceKey]
          lyDailyCumulative[DAY_NAMES[dayIdx]] = lyRunning
        } else {
          lyDailyCumulative[DAY_NAMES[dayIdx]] = lyRunning > 0 ? lyRunning : null
        }
      }
      weekRows.push({
        week_label: 'Same Week LY',
        week_start: lyWeekStart,
        daily_cumulative: lyDailyCumulative,
        week_total: lyRunning > 0 ? lyRunning : null,
      })

      return weekRows
    }

    const weeklyTrends: Record<string, ReturnType<typeof buildWeeklyTrends>> = {}
    for (const src of sources) {
      weeklyTrends[src] = buildWeeklyTrends(src)
    }

    // === KPI data with PY comparisons ===
    const findDay = (targetDate: Date) => dailyData.find(d =>
      d.date.getFullYear() === targetDate.getFullYear() &&
      d.date.getMonth() === targetDate.getMonth() &&
      d.date.getDate() === targetDate.getDate()
    )

    const sumRange = (startDate: Date, endDate: Date, key: 'organic' | 'direct' | 'referral' | 'paid' | 'total') => {
      let sum = 0
      for (const d of dailyData) {
        if (d.date >= startDate && d.date <= endDate) sum += d[key]
      }
      return sum
    }

    // Helper: find the same day-of-week in PY closest to the calendar date
    // e.g., Mon Feb 9, 2026 → find the closest Monday to Feb 9, 2025 → Mon Feb 10, 2025
    const getSameWeekdayPY = (date: Date): Date => {
      const pyDate = new Date(date)
      pyDate.setFullYear(pyDate.getFullYear() - 1)
      const targetDow = date.getDay()
      const pyDow = pyDate.getDay()
      let diff = targetDow - pyDow
      // Pick the closest matching weekday (within ±3 days)
      if (diff > 3) diff -= 7
      if (diff < -3) diff += 7
      pyDate.setDate(pyDate.getDate() + diff)
      pyDate.setHours(0, 0, 0, 0)
      return pyDate
    }

    // Yesterday — compare to same weekday PY
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    yesterday.setHours(0, 0, 0, 0)
    const yesterdayPY = getSameWeekdayPY(yesterday)

    // This Week (Sunday to today) — compare to same week PY (matching Sunday)
    const thisWeekStart = new Date(currentWeekSunday)
    thisWeekStart.setHours(0, 0, 0, 0)
    const pyWeekStart = getSameWeekdayPY(thisWeekStart) // finds closest Sunday in PY
    const pyWeekEnd = new Date(pyWeekStart)
    pyWeekEnd.setDate(pyWeekEnd.getDate() + todayDow) // same number of days elapsed in the week

    // MTD (1st of month to today) — calendar-based
    const mtdStart = new Date(today.getFullYear(), today.getMonth(), 1)
    const pyMtdStart = new Date(today.getFullYear() - 1, today.getMonth(), 1)
    const pyMtdEnd = new Date(today.getFullYear() - 1, today.getMonth(), today.getDate())

    // YTD: Jan 1 to today vs Jan 1 to same date PY
    const ytdStart = new Date(today.getFullYear(), 0, 1)
    const pyYtdStart = new Date(today.getFullYear() - 1, 0, 1)
    const pyYtdEnd = new Date(today.getFullYear() - 1, today.getMonth(), today.getDate())

    const buildKpi = (src: 'organic' | 'direct' | 'referral' | 'paid' | 'total') => {
      const todayMatch = findDay(today)
      const todayVal = todayMatch ? todayMatch[src] : 0

      const yesterdayMatch = findDay(yesterday)
      const yesterdayVal = yesterdayMatch ? yesterdayMatch[src] : 0
      const yesterdayPYMatch = findDay(yesterdayPY)
      const yesterdayPYVal = yesterdayPYMatch ? yesterdayPYMatch[src] : 0
      const yesterdayPct = yesterdayPYVal > 0 ? Math.round(((yesterdayVal - yesterdayPYVal) / yesterdayPYVal) * 1000) / 10 : 0

      const thisWeekVal = sumRange(thisWeekStart, today, src)
      const pyThisWeekVal = sumRange(pyWeekStart, pyWeekEnd, src)
      const thisWeekPct = pyThisWeekVal > 0 ? Math.round(((thisWeekVal - pyThisWeekVal) / pyThisWeekVal) * 1000) / 10 : 0

      const mtdVal = sumRange(mtdStart, today, src)
      const pyMtdVal = sumRange(pyMtdStart, pyMtdEnd, src)
      const mtdPct = pyMtdVal > 0 ? Math.round(((mtdVal - pyMtdVal) / pyMtdVal) * 1000) / 10 : 0

      const ytdVal = sumRange(ytdStart, today, src)
      const pyYtdVal = sumRange(pyYtdStart, pyYtdEnd, src)
      const ytdPct = pyYtdVal > 0 ? Math.round(((ytdVal - pyYtdVal) / pyYtdVal) * 1000) / 10 : 0

      return {
        today: todayVal,
        yesterday: { value: yesterdayVal, py: yesterdayPYVal, change_pct: yesterdayPct, diff: yesterdayVal - yesterdayPYVal },
        this_week: { value: thisWeekVal, py: pyThisWeekVal, change_pct: thisWeekPct, diff: thisWeekVal - pyThisWeekVal },
        mtd: { value: mtdVal, py: pyMtdVal, change_pct: mtdPct, diff: mtdVal - pyMtdVal },
        ytd: { value: ytdVal, py: pyYtdVal, change_pct: ytdPct, diff: ytdVal - pyYtdVal },
      }
    }

    const kpi: Record<string, ReturnType<typeof buildKpi>> = {}
    for (const src of sources) {
      kpi[src] = buildKpi(src)
    }

    return NextResponse.json({
      monthly_trends: { months: monthlyResult, weeks: WEEK_COLUMNS },
      weekly_trends: { data: weeklyTrends, days: DAY_NAMES },
      weekly_yoy: weeklyYoY,
      monthly_yoy: monthlyYoY,
      kpi,
      current_week: currentISOWeek,
      current_month: currentMonth,
    }, {
      headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' },
    })
  } catch (error) {
    console.error('Traffic trends error:', error)
    return NextResponse.json({ error: 'Failed to fetch traffic trends' }, { status: 500 })
  }
}
