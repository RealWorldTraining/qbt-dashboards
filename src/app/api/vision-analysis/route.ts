import { NextResponse } from 'next/server'

// Vision's Analysis - Updated 2026-02-01 21:49 CST (with GSC deep-dive)
const ANALYSIS = {
  generated: '2026-02-01 21:49 CST',
  status: 'action_required',
  statusLabel: '🔴 Action Required',
  dataSources: 'Google Ads API (Jan 11 - Jan 31), Search Console API (raw data)',
  
  sections: [
    {
      id: 'critical',
      title: '🚨 Critical Findings',
      items: [
        {
          title: 'Google Ads Performance Declining',
          severity: 'critical',
          metrics: [
            { label: 'CPA climbing', value: '$115 → $156 → $168', change: '+46% over 3 weeks' },
            { label: 'Conversions dropping', value: '48 → 37 → 30', change: '-37.5% over 3 weeks' },
          ],
          analysis: 'Spending the same, getting less. Efficiency crisis.',
          rootCauses: [
            'Ad fatigue likely (same creative to same audience)',
            'Possible audience saturation',
            'Competition may have intensified (pushing up CPCs)',
            'Quality Score may be declining',
          ],
          actions: [
            'Refresh ad creative — new headlines, descriptions, CTAs',
            'Review Search Terms Report — add negative keywords',
            'Check Quality Scores — identify underperforming ads/keywords',
            'Test audience exclusions — remove converted users',
            'Consider bid strategy change',
          ],
        },
        {
          title: 'Search Console: Traffic Drop CONFIRMED',
          severity: 'warning',
          metrics: [
            { label: 'Impressions', value: '535,098', change: '-8.5% WoW' },
            { label: 'CTR', value: '0.50-0.52%', change: 'stable (dashboard bug fixed)' },
            { label: 'Avg Position', value: '14.4', change: 'from 15.3' },
          ],
          analysis: 'Lost low-intent traffic (login pages, broad "quickbooks online" searches). Core money terms held steady. This is actually... fine.',
          rootCauses: [
            '"quickbooks online" — lost 4,831 impressions (-20%)',
            '"qbo login" — lost 1,682 impressions (-6.5%)',
            '"quickbooks login" — lost 1,492 impressions (-1.8%)',
            '"quickbook" (misspelling) — lost 646 impressions (-20%)',
            '"quickbooks training" — lost 513 impressions (-15.8%)',
          ],
          actions: [
            "Don't panic — you lost low-intent traffic, not money terms",
            'Focus on conversion terms — certification, training courses',
            'Check for Google algorithm updates in late January',
            'Review site speed/Core Web Vitals',
            'Internal linking audit — boost authority to dropped pages',
          ],
        },
        {
          title: 'Ranking Drops (Specific Terms)',
          severity: 'info',
          metrics: [
            { label: 'quickbooks classes online', value: 'Position 23.5', change: 'dropped 7.4 positions' },
            { label: 'quickbooks online training courses', value: 'Position 24.0', change: 'dropped 6.5 positions' },
            { label: 'quickbooks training online', value: 'Position 15.3', change: 'dropped 4.5 positions' },
          ],
          analysis: 'Broad match, high-volume terms took the hit. These are low-intent queries — losing them may not hurt conversions.',
        },
      ],
    },
    {
      id: 'keywords',
      title: '📊 Keyword Performance',
      items: [
        {
          title: 'Top Performers (Last Week)',
          severity: 'info',
          metrics: [
            { label: 'quickbooks training', value: '111 clicks', change: 'anchor term' },
            { label: 'quickbooks certification', value: '57 clicks', change: 'high intent' },
            { label: 'quickbooks bookkeeping course', value: '40 clicks', change: '' },
          ],
          analysis: 'Heavy brand + category mix (good). Certification terms drive higher intent.',
          actions: [
            'Consolidate training/course pages if they target same intent',
            'Boost certification content — high-value, underutilized',
            'Create comparison content (training vs certification vs courses)',
          ],
        },
      ],
    },
    {
      id: 'recommendations',
      title: '🎯 Strategic Recommendations',
      items: [
        {
          title: 'Short-term (This Week)',
          severity: 'urgent',
          actions: [
            'Pause/refresh underperforming ad groups with CPA > $200',
            'Add 20+ negative keywords from Search Terms Report',
            'Launch 3 new ad variations with different angles/offers',
            'Pull raw Search Console data and investigate ranking drops',
          ],
        },
        {
          title: 'Medium-term (This Month)',
          severity: 'important',
          actions: [
            'Diversify traffic sources — reliance on Google Ads is risky at $168 CPA',
            'SEO content sprint — target certification + advanced training keywords',
            'Email nurture campaign for low-intent clicks',
            'Retargeting setup — bring back bounced paid traffic',
          ],
        },
        {
          title: 'Long-term (Next Quarter)',
          severity: 'strategic',
          actions: [
            'Build organic moat — reduce dependency on paid search',
            'YouTube/video strategy — training content is perfect for video SEO',
            'Partnership/affiliate program — leverage accounting firms, bookkeepers',
            'Pricing optimization — test if higher price + lower CPA = better ROI',
          ],
        },
      ],
    },
    {
      id: 'targets',
      title: '🎯 30-Day Success Metrics',
      items: [
        {
          title: 'What Success Looks Like',
          severity: 'info',
          metrics: [
            { label: 'CPA', value: '$120-$140', change: 'target range' },
            { label: 'Conversions', value: '40+/week', change: 'stabilized' },
            { label: 'Organic clicks', value: '+15%', change: 'growth' },
            { label: 'CTR', value: 'maintained', change: 'or improved' },
          ],
        },
      ],
    },
  ],
  
  summary: {
    title: "🔮 Vision's Take — The Verdict",
    content: "Not as bad as it looked on the dashboard. **Paid Ads:** Real problem. CPA climbing, conversions falling — needs immediate action. **Organic:** Lost low-intent traffic (login pages, broad searches). Core money terms held steady. You're losing tire-kickers, not buyers. **Dashboard YoY CTR anomaly:** Confirmed bug — real CTR is stable at 0.50-0.52%.",
    priority: 'Ads creative → Negative keywords → Conversion rate optimization → Organic ranking audit (if you have time)',
    warning: "Don't let CPA creep past $180 — that's where profitability dies. The organic drop is Google cleaning up low-quality impressions. Let it happen.",
  },
}

export async function GET() {
  return NextResponse.json(ANALYSIS, {
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    },
  })
}
