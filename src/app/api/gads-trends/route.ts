import { google } from 'googleapis'
import { NextResponse } from 'next/server'

const SHEET_ID = '1hMprZQev8sFG1E7Y2xJy3ucg0BgIE_BxYHXyaGGf7NA'
const RANGE = 'Summary: Day!A:AU'

function parseNumber(val: string | undefined): number | null {
  if (!val || val.trim() === '') return null
  const cleaned = val.replace(/[$,%]/g, '')
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
  conversions: number
  impressions: number
  clicks: number
  spend: number
  // Derived metrics computed from aggregated sums
  avg_cpc: number
  cost_per_conv: number
}

type MetricKey = 'conversions' | 'impressions' | 'clicks' | 'avg_cpc' | 'spend' | 'cost_per_conv'
type RawKey = 'conversions' | 'impressions' | 'clicks' | 'spend'

const WEEK_COLUMNS = ['Wk 1', 'Wk 2', 'Wk 3', 'Wk 4', 'Wk 5']
const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

// GADS columns: AP=41 Clicks, AQ=42 Impressions, AS=44 Avg CPC, AT=45 Cost/Spend, AU=46 Conversions
const COL_CLICKS = 41
const COL_IMPRESSIONS = 42
const COL_AVG_CPC = 44
const COL_SPEND = 45
const COL_CONVERSIONS = 46

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

    const dailyData: DayRow[] = []
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i]
      if (!row[0]) continue
      const date = parseDate(row[0])
      if (!date) continue

      const clicks = parseNumber(row[COL_CLICKS]) ?? 0
      const impressions = parseNumber(row[COL_IMPRESSIONS]) ?? 0
      const spend = parseNumber(row[COL_SPEND]) ?? 0
      const conversions = parseNumber(row[COL_CONVERSIONS]) ?? 0

      dailyData.push({
        date,
        year: date.getFullYear(),
        month_key: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`,
        day_of_month: date.getDate(),
        week_of_month: getWeekOfMonth(date.getDate()),
        iso_week: getISOWeekNumber(date),
        conversions,
        impressions,
        clicks,
        spend,
        avg_cpc: clicks > 0 ? spend / clicks : 0,
        cost_per_conv: conversions > 0 ? spend / conversions : 0,
      })
    }

    const today = new Date()
    const currentMonthKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`

    // Helper to compute ratio metrics from aggregated sums
    const computeRatio = (metric: MetricKey, sums: { clicks: number; impressions: number; spend: number; conversions: number }): number => {
      if (metric === 'avg_cpc') return sums.clicks > 0 ? sums.spend / sums.clicks : 0
      if (metric === 'cost_per_conv') return sums.conversions > 0 ? sums.spend / sums.conversions : 0
      return sums[metric as RawKey]
    }

    const isRatio = (m: MetricKey) => m === 'avg_cpc' || m === 'cost_per_conv'
    const metrics: MetricKey[] = ['conversions', 'impressions', 'clicks', 'avg_cpc', 'spend', 'cost_per_conv']
    const rawKeys: RawKey[] = ['conversions', 'impressions', 'clicks', 'spend']

    // === MONTHLY TRENDS ===
    const monthMap = new Map<string, DayRow[]>()
    for (const day of dailyData) {
      const existing = monthMap.get(day.month_key) || []
      existing.push(day)
      monthMap.set(day.month_key, existing)
    }

    interface MonthAggregated {
      month_key: string
      month_label: string
      [key: string]: string | number | Record<string, number | null> | null
    }

    const allMonths: MonthAggregated[] = []
    for (const [monthKey, days] of monthMap) {
      const [yearStr, monthStr] = monthKey.split('-')
      const monthLabel = `${MONTH_NAMES[parseInt(monthStr) - 1]} ${yearStr.slice(2)}`

      days.sort((a, b) => a.day_of_month - b.day_of_month)

      const monthData: MonthAggregated = { month_key: monthKey, month_label: monthLabel }

      // Running sums for each raw metric
      const runningSums: Record<string, number> = {}
      for (const k of rawKeys) runningSums[k] = 0

      for (const m of metrics) {
        const cumulative: Record<string, number | null> = {}
        // Reset running sums for this metric pass
        const runSums: Record<string, number> = {}
        for (const k of rawKeys) runSums[k] = 0

        for (const wk of WEEK_COLUMNS) {
          const wkNum = parseInt(wk.split(' ')[1])
          const weekDays = days.filter(d => d.week_of_month === wkNum)

          if (weekDays.length === 0) {
            cumulative[wk] = null
            continue
          }

          for (const d of weekDays) {
            for (const k of rawKeys) runSums[k] += d[k]
          }

          if (isRatio(m)) {
            cumulative[wk] = computeRatio(m, runSums as { clicks: number; impressions: number; spend: number; conversions: number })
          } else {
            cumulative[wk] = runSums[m as RawKey]
          }
        }

        monthData[m] = cumulative
        // Store totals
        if (isRatio(m)) {
          monthData[`${m}_total`] = computeRatio(m, runSums as { clicks: number; impressions: number; spend: number; conversions: number })
        } else {
          monthData[`${m}_total`] = runSums[m as RawKey]
        }
      }

      // Grand total = conversions total
      monthData['grand_total'] = monthData['conversions_total'] as number

      allMonths.push(monthData)
    }

    allMonths.sort((a, b) => (a.month_key as string).localeCompare(b.month_key as string))

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

    // === YoY by ISO Week ===
    // Store raw sums per week, then compute ratios
    const weeklyRaw = new Map<string, Map<number, { clicks: number; impressions: number; spend: number; conversions: number }>>()
    for (const k of rawKeys) weeklyRaw.set(k, new Map())

    for (const d of dailyData) {
      const yr = d.year
      if (yr < 2024) continue
      const wk = d.iso_week
      const key = yr * 100 + wk

      // Accumulate into a combined map
      for (const k of rawKeys) {
        const m = weeklyRaw.get(k)!
        const prev = m.get(key) ?? { clicks: 0, impressions: 0, spend: 0, conversions: 0 }
        prev[k] += d[k]
        m.set(key, prev)
      }
    }

    // Build a combined weekly map: key -> { clicks, impressions, spend, conversions }
    const weeklyCombined = new Map<number, { clicks: number; impressions: number; spend: number; conversions: number }>()
    for (const d of dailyData) {
      const yr = d.year
      if (yr < 2024) continue
      const key = yr * 100 + d.iso_week
      const prev = weeklyCombined.get(key) ?? { clicks: 0, impressions: 0, spend: 0, conversions: 0 }
      prev.clicks += d.clicks
      prev.impressions += d.impressions
      prev.spend += d.spend
      prev.conversions += d.conversions
      weeklyCombined.set(key, prev)
    }

    const weeklyYoY: Record<string, { week_num: number; week_label: string; y2024: number | null; y2025: number | null; y2026: number | null }[]> = {}
    const currentISOWeek = getISOWeekNumber(today)

    for (const m of metrics) {
      const weeks = []
      for (let w = 1; w <= 52; w++) {
        const getVal = (yr: number): number | null => {
          const data = weeklyCombined.get(yr * 100 + w)
          if (!data) return null
          return computeRatio(m, data)
        }
        weeks.push({
          week_num: w,
          week_label: `W${w}`,
          y2024: getVal(2024),
          y2025: getVal(2025),
          y2026: getVal(2026),
        })
      }
      weeklyYoY[m] = weeks
    }

    // === YoY by Month ===
    const monthlyCombined = new Map<string, { clicks: number; impressions: number; spend: number; conversions: number }>()
    for (const d of dailyData) {
      if (d.year < 2024) continue
      const key = `${d.year}-${d.date.getMonth() + 1}`
      const prev = monthlyCombined.get(key) ?? { clicks: 0, impressions: 0, spend: 0, conversions: 0 }
      prev.clicks += d.clicks
      prev.impressions += d.impressions
      prev.spend += d.spend
      prev.conversions += d.conversions
      monthlyCombined.set(key, prev)
    }

    const monthlyYoY: Record<string, { month_num: number; month_label: string; y2024: number | null; y2025: number | null; y2026: number | null }[]> = {}
    const currentMonth = today.getMonth() + 1

    for (const m of metrics) {
      const months = []
      for (let mo = 1; mo <= 12; mo++) {
        const getVal = (yr: number): number | null => {
          const data = monthlyCombined.get(`${yr}-${mo}`)
          if (!data) return null
          return computeRatio(m, data)
        }
        months.push({
          month_num: mo,
          month_label: MONTH_NAMES[mo - 1],
          y2024: getVal(2024),
          y2025: getVal(2025),
          y2026: getVal(2026),
        })
      }
      monthlyYoY[m] = months
    }

    // === Weekly Trends with daily cumulative ===
    const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

    const todayDow = today.getDay()
    const currentWeekSunday = new Date(today)
    currentWeekSunday.setDate(currentWeekSunday.getDate() - todayDow)
    currentWeekSunday.setHours(0, 0, 0, 0)

    const buildWeeklyTrends = (metric: MetricKey) => {
      const weekRows = []
      const weekLabels = ['Current Week', 'Last Week', '2 Weeks Ago', '3 Weeks Ago', '4 Weeks Ago', '5 Weeks Ago']

      for (let w = 0; w < 6; w++) {
        const weekSunday = new Date(currentWeekSunday)
        weekSunday.setDate(weekSunday.getDate() - (w * 7))
        const weekStart = `${MONTH_NAMES[weekSunday.getMonth()]} ${String(weekSunday.getDate()).padStart(2, '0')}`

        const dailyCumulative: Record<string, number | null> = {}
        const runSums = { clicks: 0, impressions: 0, spend: 0, conversions: 0 }

        for (let dayIdx = 0; dayIdx < 7; dayIdx++) {
          const dayDate = new Date(weekSunday)
          dayDate.setDate(dayDate.getDate() + dayIdx)
          dayDate.setHours(0, 0, 0, 0)

          if (dayDate > today) {
            dailyCumulative[DAY_NAMES[dayIdx]] = null
            continue
          }

          const match = dailyData.find(d =>
            d.date.getFullYear() === dayDate.getFullYear() &&
            d.date.getMonth() === dayDate.getMonth() &&
            d.date.getDate() === dayDate.getDate()
          )

          if (match) {
            for (const k of rawKeys) runSums[k] += match[k]
            dailyCumulative[DAY_NAMES[dayIdx]] = computeRatio(metric, runSums)
          } else {
            const hasData = runSums.clicks > 0 || runSums.impressions > 0 || runSums.spend > 0 || runSums.conversions > 0
            dailyCumulative[DAY_NAMES[dayIdx]] = hasData ? computeRatio(metric, runSums) : null
          }
        }

        const hasData = runSums.clicks > 0 || runSums.impressions > 0 || runSums.spend > 0 || runSums.conversions > 0
        weekRows.push({
          week_label: weekLabels[w],
          week_start: weekStart,
          daily_cumulative: dailyCumulative,
          week_total: hasData ? computeRatio(metric, runSums) : null,
        })
      }

      // Same Week Last Year
      const sameWeekLYSunday = new Date(currentWeekSunday)
      sameWeekLYSunday.setFullYear(sameWeekLYSunday.getFullYear() - 1)
      const lyDow = sameWeekLYSunday.getDay()
      sameWeekLYSunday.setDate(sameWeekLYSunday.getDate() - lyDow)
      const lyWeekStart = `${MONTH_NAMES[sameWeekLYSunday.getMonth()]} ${String(sameWeekLYSunday.getDate()).padStart(2, '0')}`

      const lyDailyCumulative: Record<string, number | null> = {}
      const lyRunSums = { clicks: 0, impressions: 0, spend: 0, conversions: 0 }
      for (let dayIdx = 0; dayIdx < 7; dayIdx++) {
        const dayDate = new Date(sameWeekLYSunday)
        dayDate.setDate(dayDate.getDate() + dayIdx)
        const match = dailyData.find(d =>
          d.date.getFullYear() === dayDate.getFullYear() &&
          d.date.getMonth() === dayDate.getMonth() &&
          d.date.getDate() === dayDate.getDate()
        )
        if (match) {
          for (const k of rawKeys) lyRunSums[k] += match[k]
          lyDailyCumulative[DAY_NAMES[dayIdx]] = computeRatio(metric, lyRunSums)
        } else {
          const hasData = lyRunSums.clicks > 0 || lyRunSums.impressions > 0 || lyRunSums.spend > 0 || lyRunSums.conversions > 0
          lyDailyCumulative[DAY_NAMES[dayIdx]] = hasData ? computeRatio(metric, lyRunSums) : null
        }
      }
      const lyHasData = lyRunSums.clicks > 0 || lyRunSums.impressions > 0 || lyRunSums.spend > 0 || lyRunSums.conversions > 0
      weekRows.push({
        week_label: 'Same Week LY',
        week_start: lyWeekStart,
        daily_cumulative: lyDailyCumulative,
        week_total: lyHasData ? computeRatio(metric, lyRunSums) : null,
      })

      return weekRows
    }

    const weeklyTrends: Record<string, ReturnType<typeof buildWeeklyTrends>> = {}
    for (const m of metrics) {
      weeklyTrends[m] = buildWeeklyTrends(m)
    }

    // === KPI data with PY comparisons ===
    const findDay = (targetDate: Date) => dailyData.find(d =>
      d.date.getFullYear() === targetDate.getFullYear() &&
      d.date.getMonth() === targetDate.getMonth() &&
      d.date.getDate() === targetDate.getDate()
    )

    const sumRange = (startDate: Date, endDate: Date): { clicks: number; impressions: number; spend: number; conversions: number } => {
      const sums = { clicks: 0, impressions: 0, spend: 0, conversions: 0 }
      for (const d of dailyData) {
        if (d.date >= startDate && d.date <= endDate) {
          for (const k of rawKeys) sums[k] += d[k]
        }
      }
      return sums
    }

    const getSameWeekdayPY = (date: Date): Date => {
      const pyDate = new Date(date)
      pyDate.setFullYear(pyDate.getFullYear() - 1)
      const targetDow = date.getDay()
      const pyDow = pyDate.getDay()
      let diff = targetDow - pyDow
      if (diff > 3) diff -= 7
      if (diff < -3) diff += 7
      pyDate.setDate(pyDate.getDate() + diff)
      pyDate.setHours(0, 0, 0, 0)
      return pyDate
    }

    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    yesterday.setHours(0, 0, 0, 0)
    const yesterdayPY = getSameWeekdayPY(yesterday)

    const thisWeekStart = new Date(currentWeekSunday)
    thisWeekStart.setHours(0, 0, 0, 0)
    const pyWeekStart = getSameWeekdayPY(thisWeekStart)
    const pyWeekEnd = new Date(pyWeekStart)
    pyWeekEnd.setDate(pyWeekEnd.getDate() + todayDow)

    const mtdStart = new Date(today.getFullYear(), today.getMonth(), 1)
    const pyMtdStart = new Date(today.getFullYear() - 1, today.getMonth(), 1)
    const pyMtdEnd = new Date(today.getFullYear() - 1, today.getMonth(), today.getDate())

    // YTD: Jan 1 to today vs Jan 1 to same date PY
    const ytdStart = new Date(today.getFullYear(), 0, 1)
    const pyYtdStart = new Date(today.getFullYear() - 1, 0, 1)
    const pyYtdEnd = new Date(today.getFullYear() - 1, today.getMonth(), today.getDate())

    const buildKpi = (metric: MetricKey) => {
      const todayMatch = findDay(today)
      const todayVal = todayMatch ? computeRatio(metric, todayMatch) : 0

      const yesterdayMatch = findDay(yesterday)
      const yesterdayVal = yesterdayMatch ? computeRatio(metric, yesterdayMatch) : 0
      const yesterdayPYMatch = findDay(yesterdayPY)
      const yesterdayPYVal = yesterdayPYMatch ? computeRatio(metric, yesterdayPYMatch) : 0

      const yesterdaySums = sumRange(yesterday, yesterday)
      const yesterdayCalc = computeRatio(metric, yesterdaySums)
      const yesterdayPYSums = sumRange(yesterdayPY, yesterdayPY)
      const yesterdayPYCalc = computeRatio(metric, yesterdayPYSums)
      const yesterdayPct = yesterdayPYCalc > 0 ? Math.round(((yesterdayCalc - yesterdayPYCalc) / yesterdayPYCalc) * 1000) / 10 : 0

      const thisWeekSums = sumRange(thisWeekStart, today)
      const thisWeekVal = computeRatio(metric, thisWeekSums)
      const pyWeekSums = sumRange(pyWeekStart, pyWeekEnd)
      const pyThisWeekVal = computeRatio(metric, pyWeekSums)
      const thisWeekPct = pyThisWeekVal > 0 ? Math.round(((thisWeekVal - pyThisWeekVal) / pyThisWeekVal) * 1000) / 10 : 0

      const mtdSums = sumRange(mtdStart, today)
      const mtdVal = computeRatio(metric, mtdSums)
      const pyMtdSums = sumRange(pyMtdStart, pyMtdEnd)
      const pyMtdVal = computeRatio(metric, pyMtdSums)
      const mtdPct = pyMtdVal > 0 ? Math.round(((mtdVal - pyMtdVal) / pyMtdVal) * 1000) / 10 : 0

      const ytdSums = sumRange(ytdStart, today)
      const ytdVal = computeRatio(metric, ytdSums)
      const pyYtdSums = sumRange(pyYtdStart, pyYtdEnd)
      const pyYtdVal = computeRatio(metric, pyYtdSums)
      const ytdPct = pyYtdVal > 0 ? Math.round(((ytdVal - pyYtdVal) / pyYtdVal) * 1000) / 10 : 0

      return {
        today: todayVal,
        yesterday: { value: yesterdayCalc, py: yesterdayPYCalc, change_pct: yesterdayPct, diff: yesterdayCalc - yesterdayPYCalc },
        this_week: { value: thisWeekVal, py: pyThisWeekVal, change_pct: thisWeekPct, diff: thisWeekVal - pyThisWeekVal },
        mtd: { value: mtdVal, py: pyMtdVal, change_pct: mtdPct, diff: mtdVal - pyMtdVal },
        ytd: { value: ytdVal, py: pyYtdVal, change_pct: ytdPct, diff: ytdVal - pyYtdVal },
      }
    }

    const kpi: Record<string, ReturnType<typeof buildKpi>> = {}
    for (const m of metrics) {
      kpi[m] = buildKpi(m)
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
    console.error('GADS trends error:', error)
    return NextResponse.json({ error: 'Failed to fetch GADS trends' }, { status: 500 })
  }
}
