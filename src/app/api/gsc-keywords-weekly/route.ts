import { NextResponse } from 'next/server'

// CORRECTED 4-week keyword data from GSC API
// Source: Vision's direct GSC API pull on 2026-02-01
// Filter: Query NOT contains "login" (query filter only, matches Aaron's GSC)
// Country: United States only
// Weeks: 4wk ago (Jan 4-10), 3wk ago (Jan 11-17), 2wk ago (Jan 18-24), Last wk (Jan 25-31)
const KEYWORD_WEEKLY_DATA = [
  {
    query: 'quickbooks training',
    weeks: [
      { week: 'Jan 4-10', clicks: 119, impressions: 2442 },
      { week: 'Jan 11-17', clicks: 158, impressions: 2451 },
      { week: 'Jan 18-24', clicks: 128, impressions: 2443 },
      { week: 'Jan 25-31', clicks: 111, impressions: 2072 },
    ],
  },
  {
    query: 'quickbooks certification',
    weeks: [
      { week: 'Jan 4-10', clicks: 66, impressions: 2823 },
      { week: 'Jan 11-17', clicks: 40, impressions: 2611 },
      { week: 'Jan 18-24', clicks: 52, impressions: 2670 },
      { week: 'Jan 25-31', clicks: 57, impressions: 2325 },
    ],
  },
  {
    query: 'quickbooks bookkeeping course',
    weeks: [
      { week: 'Jan 4-10', clicks: 44, impressions: 327 },
      { week: 'Jan 11-17', clicks: 39, impressions: 268 },
      { week: 'Jan 18-24', clicks: 51, impressions: 332 },
      { week: 'Jan 25-31', clicks: 40, impressions: 219 },
    ],
  },
  {
    query: 'quickbooks classes',
    weeks: [
      { week: 'Jan 4-10', clicks: 33, impressions: 639 },
      { week: 'Jan 11-17', clicks: 36, impressions: 576 },
      { week: 'Jan 18-24', clicks: 30, impressions: 588 },
      { week: 'Jan 25-31', clicks: 32, impressions: 455 },
    ],
  },
  {
    query: 'quickbooks classes near me',
    weeks: [
      { week: 'Jan 4-10', clicks: 37, impressions: 429 },
      { week: 'Jan 11-17', clicks: 29, impressions: 368 },
      { week: 'Jan 18-24', clicks: 16, impressions: 343 },
      { week: 'Jan 25-31', clicks: 30, impressions: 310 },
    ],
  },
  {
    query: 'bookkeeping certification',
    weeks: [
      { week: 'Jan 4-10', clicks: 20, impressions: 589 },
      { week: 'Jan 11-17', clicks: 17, impressions: 931 },
      { week: 'Jan 18-24', clicks: 26, impressions: 1257 },
      { week: 'Jan 25-31', clicks: 20, impressions: 1055 },
    ],
  },
  {
    query: 'quickbooks training courses',
    weeks: [
      { week: 'Jan 4-10', clicks: 27, impressions: 265 },
      { week: 'Jan 11-17', clicks: 22, impressions: 247 },
      { week: 'Jan 18-24', clicks: 28, impressions: 306 },
      { week: 'Jan 25-31', clicks: 20, impressions: 214 },
    ],
  },
  {
    query: 'quickbooks training online',
    weeks: [
      { week: 'Jan 4-10', clicks: 11, impressions: 419 },
      { week: 'Jan 11-17', clicks: 9, impressions: 369 },
      { week: 'Jan 18-24', clicks: 19, impressions: 452 },
      { week: 'Jan 25-31', clicks: 16, impressions: 374 },
    ],
  },
  {
    query: 'quickbooks class',
    weeks: [
      { week: 'Jan 4-10', clicks: 18, impressions: 298 },
      { week: 'Jan 11-17', clicks: 11, impressions: 216 },
      { week: 'Jan 18-24', clicks: 6, impressions: 246 },
      { week: 'Jan 25-31', clicks: 13, impressions: 203 },
    ],
  },
  {
    query: 'quickbooks online training',
    weeks: [
      { week: 'Jan 4-10', clicks: 6, impressions: 817 },
      { week: 'Jan 11-17', clicks: 16, impressions: 840 },
      { week: 'Jan 18-24', clicks: 20, impressions: 885 },
      { week: 'Jan 25-31', clicks: 13, impressions: 635 },
    ],
  },
]

export async function GET() {
  try {
    // Calculate totals for each keyword
    const keywordsWithTotals = KEYWORD_WEEKLY_DATA.map(kw => {
      const totals = kw.weeks.reduce(
        (acc, w) => ({
          clicks: acc.clicks + w.clicks,
          impressions: acc.impressions + w.impressions,
        }),
        { clicks: 0, impressions: 0 }
      )
      return {
        ...kw,
        totals,
        ctr: totals.impressions > 0 ? (totals.clicks / totals.impressions) * 100 : 0,
      }
    })

    // Sort by total clicks descending
    keywordsWithTotals.sort((a, b) => b.totals.clicks - a.totals.clicks)

    return NextResponse.json({
      keywords: keywordsWithTotals,
      weekLabels: ['Jan 4-10', 'Jan 11-17', 'Jan 18-24', 'Jan 25-31'],
      filter: 'Query NOT contains "login" (US only)',
      lastUpdated: '2026-02-01T13:59:00-06:00',
    }, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    })
  } catch (error) {
    console.error('Error fetching GSC keyword weekly data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch data', details: String(error) },
      { status: 500 }
    )
  }
}
