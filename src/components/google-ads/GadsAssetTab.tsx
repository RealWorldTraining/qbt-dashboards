"use client"

import React, { useState, useEffect, useMemo } from "react"

// ─── Types ───────────────────────────────────────────────────────────────────

interface AssetRow {
  assetText: string
  assetType: string
  fieldType: string
  performanceLabel: string
  campaign: string
  adGroup: string
  impressions: number
  clicks: number
  ctr: number
  conversions: number
  cost: number
}

interface AssetData {
  assets: AssetRow[]
  summary: {
    totalAssets: number
    byType: Record<string, number>
    byPerformanceLabel: Record<string, number>
  }
  lastUpdated: string
}

interface AqsResult {
  grade: 'A' | 'B' | 'C' | 'D' | 'F' | '--'
  score: number
  ctrRatio: number
  convRatio: number
  confidence: number
  action: 'Keep' | 'Monitor' | 'Replace' | 'Too Early'
  engagementPct: number  // CTR as % of type avg (e.g. 110 = 10% above avg)
  conversionPct: number  // Conv rate as % of type avg
}

interface ScoredAsset extends AssetRow {
  aqs: AqsResult
  convRate: number
}

type SortKey = keyof Pick<AssetRow, 'impressions' | 'clicks' | 'ctr' | 'conversions' | 'cost'> | 'convRate' | 'aqs'

// ─── AQS Scoring Engine ─────────────────────────────────────────────────────

// Type-specific weights: headlines/callouts attract clicks, descriptions qualify them
const TYPE_WEIGHTS: Record<string, { ctr: number; conv: number }> = {
  HEADLINE:           { ctr: 0.65, conv: 0.35 },
  DESCRIPTION:        { ctr: 0.35, conv: 0.65 },
  SITELINK:           { ctr: 0.60, conv: 0.40 },
  CALLOUT:            { ctr: 0.60, conv: 0.40 },
  'STRUCTURED SNIPPET': { ctr: 0.55, conv: 0.45 },
}

function getConfidence(impressions: number): number {
  if (impressions < 50)  return 0
  if (impressions < 200) return 0.5
  if (impressions < 500) return 0.75
  return 1.0
}

const CONFIDENCE_LABELS: Record<number, string> = {
  0: 'Too Early (<50 impr)',
  0.5: 'Low (50-199 impr)',
  0.75: 'Medium (200-499 impr)',
  1: 'High (500+ impr)',
}

function calcTypeAverages(assets: AssetRow[]) {
  const byType: Record<string, { totalImpr: number; totalClicks: number; totalConv: number; totalCost: number }> = {}
  for (const a of assets) {
    if (!byType[a.fieldType]) {
      byType[a.fieldType] = { totalImpr: 0, totalClicks: 0, totalConv: 0, totalCost: 0 }
    }
    const t = byType[a.fieldType]
    t.totalImpr += a.impressions
    t.totalClicks += a.clicks
    t.totalConv += a.conversions
    t.totalCost += a.cost
  }
  const result: Record<string, { avgCtr: number; avgConvRate: number }> = {}
  for (const [type, t] of Object.entries(byType)) {
    result[type] = {
      avgCtr: t.totalImpr > 0 ? (t.totalClicks / t.totalImpr) * 100 : 0,
      avgConvRate: t.totalClicks > 0 ? (t.totalConv / t.totalClicks) * 100 : 0,
    }
  }
  return result
}

function scoreAsset(asset: AssetRow, typeAvgs: Record<string, { avgCtr: number; avgConvRate: number }>): AqsResult {
  const avg = typeAvgs[asset.fieldType]
  const noScore: AqsResult = { grade: '--', score: 0, ctrRatio: 0, convRatio: 0, confidence: 0, action: 'Too Early', engagementPct: 0, conversionPct: 0 }
  if (!avg) return noScore

  const confidence = getConfidence(asset.impressions)
  if (confidence === 0) return noScore

  const assetConvRate = asset.clicks > 0 ? (asset.conversions / asset.clicks) * 100 : 0

  const ctrRatio = avg.avgCtr > 0 ? asset.ctr / avg.avgCtr : (asset.ctr > 0 ? 1.5 : 0.5)
  const convRatio = avg.avgConvRate > 0 ? assetConvRate / avg.avgConvRate : (assetConvRate > 0 ? 1.5 : 0.5)

  const weights = TYPE_WEIGHTS[asset.fieldType] || { ctr: 0.5, conv: 0.5 }
  const rawScore = weights.ctr * ctrRatio + weights.conv * convRatio
  const score = rawScore * confidence

  let grade: AqsResult['grade']
  if (score >= 1.3)      grade = 'A'
  else if (score >= 1.0) grade = 'B'
  else if (score >= 0.7) grade = 'C'
  else if (score >= 0.4) grade = 'D'
  else                   grade = 'F'

  let action: AqsResult['action']
  if (grade === 'A' || grade === 'B') action = 'Keep'
  else if (grade === 'C')             action = 'Monitor'
  else                                action = 'Replace'

  return {
    grade, score, ctrRatio, convRatio, confidence, action,
    engagementPct: Math.round(ctrRatio * 100),
    conversionPct: Math.round(convRatio * 100),
  }
}

// ─── Grade UI Config ─────────────────────────────────────────────────────────

const GRADE_COLORS: Record<string, { bg: string; text: string; ring: string }> = {
  A:    { bg: 'bg-green-900',  text: 'text-green-300',  ring: 'ring-green-500' },
  B:    { bg: 'bg-blue-900',   text: 'text-blue-300',   ring: 'ring-blue-500' },
  C:    { bg: 'bg-yellow-900', text: 'text-yellow-300', ring: 'ring-yellow-500' },
  D:    { bg: 'bg-orange-900', text: 'text-orange-300', ring: 'ring-orange-500' },
  F:    { bg: 'bg-red-900',    text: 'text-red-300',    ring: 'ring-red-500' },
  '--': { bg: 'bg-gray-800',   text: 'text-gray-500',   ring: 'ring-gray-600' },
}

// ─── Constants ───────────────────────────────────────────────────────────────

const PERF_COLORS: Record<string, { bg: string; text: string }> = {
  BEST:     { bg: 'bg-green-900', text: 'text-green-300' },
  GOOD:     { bg: 'bg-blue-900',  text: 'text-blue-300' },
  LOW:      { bg: 'bg-red-900',   text: 'text-red-300' },
  LEARNING: { bg: 'bg-amber-900', text: 'text-amber-300' },
  'N/A':    { bg: 'bg-gray-800',  text: 'text-gray-400' },
}

const PERF_CARD_COLORS: Record<string, string> = {
  BEST: 'text-green-500',
  GOOD: 'text-blue-500',
  LOW: 'text-red-500',
  LEARNING: 'text-amber-500',
}

const TYPE_FILTERS = ['All', 'HEADLINE', 'DESCRIPTION', 'SITELINK', 'CALLOUT', 'STRUCTURED SNIPPET'] as const

// ─── AQS Tooltip Component ──────────────────────────────────────────────────

function AqsBadge({ aqs, fieldType }: { aqs: AqsResult; fieldType: string }) {
  const [showTip, setShowTip] = useState(false)
  const colors = GRADE_COLORS[aqs.grade] || GRADE_COLORS['--']
  const weights = TYPE_WEIGHTS[fieldType] || { ctr: 0.5, conv: 0.5 }

  return (
    <div className="relative inline-block">
      <span
        className={`px-2 py-0.5 rounded text-xs font-bold cursor-help ${colors.bg} ${colors.text}`}
        onMouseEnter={() => setShowTip(true)}
        onMouseLeave={() => setShowTip(false)}
      >
        {aqs.grade}
      </span>
      {showTip && aqs.grade !== '--' && (
        <div className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 bg-gray-900 border border-gray-700 rounded-lg p-3 shadow-xl text-xs">
          <div className="font-bold text-white mb-2">AQS Breakdown</div>
          <div className="space-y-1.5 text-gray-300">
            <div className="flex justify-between">
              <span>Engagement (CTR)</span>
              <span className={aqs.engagementPct >= 100 ? 'text-green-400' : 'text-red-400'}>
                {aqs.engagementPct}% of avg
              </span>
            </div>
            <div className="flex justify-between">
              <span>Conversion Rate</span>
              <span className={aqs.conversionPct >= 100 ? 'text-green-400' : 'text-red-400'}>
                {aqs.conversionPct}% of avg
              </span>
            </div>
            <div className="border-t border-gray-700 pt-1.5 flex justify-between">
              <span>Weights ({fieldType.toLowerCase()})</span>
              <span className="text-gray-400">{Math.round(weights.ctr * 100)}% CTR / {Math.round(weights.conv * 100)}% Conv</span>
            </div>
            <div className="flex justify-between">
              <span>Confidence</span>
              <span className="text-gray-400">{CONFIDENCE_LABELS[aqs.confidence]}</span>
            </div>
            <div className="flex justify-between">
              <span>Composite Score</span>
              <span className="text-white font-medium">{aqs.score.toFixed(2)}</span>
            </div>
          </div>
          <div className={`mt-2 pt-2 border-t border-gray-700 font-medium ${
            aqs.action === 'Keep' ? 'text-green-400' : aqs.action === 'Monitor' ? 'text-yellow-400' : 'text-red-400'
          }`}>
            Recommendation: {aqs.action}
          </div>
          <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-700" />
        </div>
      )}
      {showTip && aqs.grade === '--' && (
        <div className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 bg-gray-900 border border-gray-700 rounded-lg p-2 shadow-xl text-xs text-gray-400 text-center">
          Not enough data to score. Need 50+ impressions.
          <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-700" />
        </div>
      )}
    </div>
  )
}

// ─── Methodology Info Component ──────────────────────────────────────────────

function AqsMethodologyInfo() {
  const [open, setOpen] = useState(false)

  return (
    <div className="relative inline-block">
      <button
        onClick={() => setOpen(!open)}
        className="text-gray-500 hover:text-gray-300 transition-colors text-sm"
        title="How AQS scoring works"
      >
        &#9432; How AQS Works
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute z-50 top-full right-0 mt-2 w-96 bg-gray-900 border border-gray-700 rounded-lg p-5 shadow-2xl text-sm">
            <div className="font-bold text-white text-base mb-3">Asset Quality Score (AQS)</div>
            <div className="space-y-3 text-gray-300">
              <div>
                <div className="font-medium text-white">Scored within type</div>
                <div className="text-xs text-gray-400">Headlines vs headlines, descriptions vs descriptions. Each type has different benchmarks.</div>
              </div>
              <div>
                <div className="font-medium text-white">Two dimensions</div>
                <div className="text-xs text-gray-400">
                  <span className="text-blue-400">Engagement</span> — CTR vs type average.{' '}
                  <span className="text-purple-400">Conversion</span> — Conv rate vs type average.
                </div>
              </div>
              <div>
                <div className="font-medium text-white">Type-specific weights</div>
                <div className="text-xs text-gray-400">
                  Headlines/Callouts/Sitelinks: 65% CTR, 35% Conv (job is to attract clicks).
                  Descriptions: 35% CTR, 65% Conv (job is to qualify clicks).
                </div>
              </div>
              <div>
                <div className="font-medium text-white">Confidence multiplier</div>
                <div className="text-xs text-gray-400">
                  &lt;50 impr: no score. 50-199: 50% confidence. 200-499: 75%. 500+: full confidence.
                </div>
              </div>
              <div className="border-t border-gray-700 pt-3">
                <div className="font-medium text-white mb-1.5">Grade Scale</div>
                <div className="grid grid-cols-5 gap-1 text-center text-xs">
                  {(['A', 'B', 'C', 'D', 'F'] as const).map(g => {
                    const c = GRADE_COLORS[g]
                    return (
                      <div key={g} className={`rounded py-1 ${c.bg} ${c.text} font-bold`}>
                        {g}
                      </div>
                    )
                  })}
                  <div className="text-gray-500 text-[10px]">&ge;1.30</div>
                  <div className="text-gray-500 text-[10px]">&ge;1.00</div>
                  <div className="text-gray-500 text-[10px]">&ge;0.70</div>
                  <div className="text-gray-500 text-[10px]">&ge;0.40</div>
                  <div className="text-gray-500 text-[10px]">&lt;0.40</div>
                  <div className="text-green-500 text-[10px]">Keep</div>
                  <div className="text-blue-500 text-[10px]">Keep</div>
                  <div className="text-yellow-500 text-[10px]">Monitor</div>
                  <div className="text-orange-500 text-[10px]">Replace</div>
                  <div className="text-red-500 text-[10px]">Replace</div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

// ─── Recommendations Panel ───────────────────────────────────────────────────

function RecommendationsPanel({ scored, campaignFilter, typeFilter }: {
  scored: ScoredAsset[]
  campaignFilter: string
  typeFilter: string
}) {
  const [expanded, setExpanded] = useState(true)

  const replaceAssets = scored.filter(a => a.aqs.action === 'Replace').sort((a, b) => a.aqs.score - b.aqs.score)
  const monitorAssets = scored.filter(a => a.aqs.action === 'Monitor').sort((a, b) => a.aqs.score - b.aqs.score)
  const keepAssets = scored.filter(a => a.aqs.action === 'Keep').sort((a, b) => b.aqs.score - a.aqs.score)
  const tooEarly = scored.filter(a => a.aqs.action === 'Too Early')

  // Group replace assets by campaign for actionability
  const replaceByCampaign: Record<string, ScoredAsset[]> = {}
  for (const a of replaceAssets) {
    if (!replaceByCampaign[a.campaign]) replaceByCampaign[a.campaign] = []
    replaceByCampaign[a.campaign].push(a)
  }

  // Find top performers per type (for replacement inspiration)
  const topByType: Record<string, ScoredAsset[]> = {}
  for (const a of keepAssets.filter(k => k.aqs.grade === 'A')) {
    if (!topByType[a.fieldType]) topByType[a.fieldType] = []
    if (topByType[a.fieldType].length < 3) topByType[a.fieldType].push(a)
  }

  const filterLabel = [
    campaignFilter !== 'All' ? campaignFilter : 'All Campaigns',
    typeFilter !== 'All' ? typeFilter.charAt(0) + typeFilter.slice(1).toLowerCase() + 's' : null,
  ].filter(Boolean).join(' / ')

  return (
    <div className="mt-6 bg-[#1a1a1a] rounded-lg overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-gray-900 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="text-white font-bold text-base">Recommendations</span>
          <span className="text-gray-500 text-xs">{filterLabel}</span>
          {replaceAssets.length > 0 && (
            <span className="bg-red-900 text-red-300 text-xs px-2 py-0.5 rounded-full font-medium">
              {replaceAssets.length} to replace
            </span>
          )}
        </div>
        <span className="text-gray-500">{expanded ? '\u25B2' : '\u25BC'}</span>
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-5">
          {/* Replace Section */}
          {replaceAssets.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 rounded-full bg-red-500" />
                <span className="text-red-400 font-medium text-sm">Replace ({replaceAssets.length})</span>
              </div>
              {Object.entries(replaceByCampaign).map(([campaign, assets]) => (
                <div key={campaign} className="mb-3">
                  <div className="text-gray-500 text-xs mb-1 uppercase tracking-wide">{campaign}</div>
                  <div className="space-y-1">
                    {assets.map((a, i) => (
                      <div key={i} className="flex items-center gap-3 bg-gray-900 rounded px-3 py-2 text-xs">
                        <AqsBadge aqs={a.aqs} fieldType={a.fieldType} />
                        <span className="text-gray-500 w-20">{a.fieldType}</span>
                        <span className="text-gray-300 flex-1 truncate" title={a.assetText}>&ldquo;{a.assetText}&rdquo;</span>
                        <span className="text-gray-500">CTR {a.ctr.toFixed(1)}%</span>
                        <span className="text-gray-500">Conv {a.convRate.toFixed(1)}%</span>
                        <span className="text-gray-500">${Math.round(a.cost)}</span>
                      </div>
                    ))}
                  </div>
                  {/* Show top performers of same type for inspiration */}
                  {assets.length > 0 && topByType[assets[0].fieldType]?.length > 0 && (
                    <div className="mt-1.5 ml-4 text-[11px] text-gray-600">
                      Top {assets[0].fieldType.toLowerCase()}s for inspiration:{' '}
                      {topByType[assets[0].fieldType].map((t, i) => (
                        <span key={i}>
                          {i > 0 && ' | '}
                          <span className="text-gray-400">&ldquo;{t.assetText.slice(0, 40)}{t.assetText.length > 40 ? '...' : ''}&rdquo;</span>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Monitor Section */}
          {monitorAssets.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 rounded-full bg-yellow-500" />
                <span className="text-yellow-400 font-medium text-sm">Monitor ({monitorAssets.length})</span>
                <span className="text-gray-600 text-xs">— average performers, watch for decline</span>
              </div>
              <div className="grid grid-cols-2 gap-1">
                {monitorAssets.slice(0, 10).map((a, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs text-gray-400 px-2 py-1">
                    <AqsBadge aqs={a.aqs} fieldType={a.fieldType} />
                    <span className="truncate" title={a.assetText}>{a.assetText}</span>
                  </div>
                ))}
                {monitorAssets.length > 10 && (
                  <div className="text-xs text-gray-600 px-2 py-1">+{monitorAssets.length - 10} more</div>
                )}
              </div>
            </div>
          )}

          {/* Top Performers */}
          {keepAssets.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 rounded-full bg-green-500" />
                <span className="text-green-400 font-medium text-sm">Top Performers ({keepAssets.length})</span>
                <span className="text-gray-600 text-xs">— keep these running</span>
              </div>
              <div className="grid grid-cols-2 gap-1">
                {keepAssets.slice(0, 10).map((a, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs text-gray-400 px-2 py-1">
                    <AqsBadge aqs={a.aqs} fieldType={a.fieldType} />
                    <span className="truncate" title={a.assetText}>{a.assetText}</span>
                    <span className="text-gray-600 ml-auto whitespace-nowrap">{a.ctr.toFixed(1)}% CTR</span>
                  </div>
                ))}
                {keepAssets.length > 10 && (
                  <div className="text-xs text-gray-600 px-2 py-1">+{keepAssets.length - 10} more</div>
                )}
              </div>
            </div>
          )}

          {/* Too Early */}
          {tooEarly.length > 0 && (
            <div className="text-xs text-gray-600">
              {tooEarly.length} asset{tooEarly.length !== 1 ? 's' : ''} with insufficient data (need 50+ impressions to score)
            </div>
          )}

          {/* Agent Handoff Block */}
          {replaceAssets.length > 0 && (
            <div className="border-t border-gray-800 pt-4 mt-4">
              <div className="flex items-center justify-between mb-2">
                <div className="text-gray-400 text-xs font-medium uppercase tracking-wide">Agent Rotation Queue</div>
                <button
                  onClick={() => {
                    const queue = replaceAssets.map(a => ({
                      campaign: a.campaign,
                      adGroup: a.adGroup,
                      type: a.fieldType,
                      currentText: a.assetText,
                      grade: a.aqs.grade,
                      score: a.aqs.score.toFixed(2),
                      ctr: a.ctr.toFixed(1) + '%',
                      convRate: a.convRate.toFixed(1) + '%',
                      cost: '$' + Math.round(a.cost),
                      action: 'REPLACE',
                    }))
                    navigator.clipboard.writeText(JSON.stringify(queue, null, 2))
                  }}
                  className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
                >
                  Copy as JSON
                </button>
              </div>
              <div className="bg-gray-900 rounded p-3 text-xs font-mono text-gray-500 max-h-32 overflow-y-auto">
                {replaceAssets.length} asset{replaceAssets.length !== 1 ? 's' : ''} queued for rotation across{' '}
                {Object.keys(replaceByCampaign).length} campaign{Object.keys(replaceByCampaign).length !== 1 ? 's' : ''}.
                <br />
                Workflow: Analysis Agent → Editor Agent (Google Ads API) → Human Approval → Launch
                <br />
                <span className="text-gray-600">Click &ldquo;Copy as JSON&rdquo; to export the rotation queue for agent processing.</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Main Component ──────────────────────────────────────────────────────────

export function GadsAssetTab() {
  const [data, setData] = useState<AssetData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [typeFilter, setTypeFilter] = useState<string>('All')
  const [campaignFilter, setCampaignFilter] = useState<string>('All')
  const [perfFilter, setPerfFilter] = useState<string | null>(null)
  const [sortKey, setSortKey] = useState<SortKey>('impressions')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')

  useEffect(() => {
    fetch('/api/gads-asset-performance')
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return res.json()
      })
      .then(d => {
        if (d.error) throw new Error(d.error)
        setData(d)
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  // Compute AQS scores for all assets
  const typeAvgs = useMemo(() => data ? calcTypeAverages(data.assets) : {}, [data])
  const scoredAssets: ScoredAsset[] = useMemo(() => {
    if (!data) return []
    return data.assets.map(a => ({
      ...a,
      aqs: scoreAsset(a, typeAvgs),
      convRate: a.clicks > 0 ? (a.conversions / a.clicks) * 100 : 0,
    }))
  }, [data, typeAvgs])

  if (loading) {
    return (
      <div className="text-center py-16">
        <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-gray-300 border-t-amber-500"></div>
        <p className="mt-4 text-gray-400">Loading asset performance...</p>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="text-center py-16">
        <p className="text-red-500">Error loading asset data{error ? `: ${error}` : ''}</p>
      </div>
    )
  }

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(d => d === 'desc' ? 'asc' : 'desc')
    } else {
      setSortKey(key)
      setSortDir('desc')
    }
  }

  const sortArrow = (key: SortKey) => {
    if (sortKey !== key) return ''
    return sortDir === 'desc' ? ' \u25BC' : ' \u25B2'
  }

  // Derive unique campaigns sorted by total impressions
  const campaigns = Array.from(new Set(data.assets.map(a => a.campaign))).filter(Boolean)
  const campaignImpressions: Record<string, number> = {}
  for (const a of data.assets) {
    campaignImpressions[a.campaign] = (campaignImpressions[a.campaign] || 0) + a.impressions
  }
  campaigns.sort((a, b) => (campaignImpressions[b] || 0) - (campaignImpressions[a] || 0))

  const filtered = scoredAssets
    .filter(a => typeFilter === 'All' || a.fieldType === typeFilter)
    .filter(a => campaignFilter === 'All' || a.campaign === campaignFilter)
    .filter(a => !perfFilter || a.performanceLabel === perfFilter)
    .sort((a, b) => {
      const mul = sortDir === 'desc' ? -1 : 1
      if (sortKey === 'aqs') {
        return (a.aqs.score - b.aqs.score) * mul
      }
      if (sortKey === 'convRate') {
        return (a.convRate - b.convRate) * mul
      }
      const aVal = a[sortKey as keyof AssetRow] as number
      const bVal = b[sortKey as keyof AssetRow] as number
      return (aVal - bVal) * mul
    })

  const { byPerformanceLabel } = data.summary

  // AQS distribution for summary cards
  const aqsDistribution = scoredAssets.reduce((acc, a) => {
    acc[a.aqs.grade] = (acc[a.aqs.grade] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          <h2 className="text-[#1D1D1F] text-xl font-bold">Asset Performance</h2>
          <AqsMethodologyInfo />
        </div>
        <span className="text-gray-500 text-sm">Last 30 days</span>
      </div>

      {/* AQS Summary Cards */}
      <div className="grid grid-cols-7 gap-2 mb-5">
        <div className="bg-[#1a1a1a] rounded-lg p-3 text-center">
          <div className="text-gray-400 text-[10px] uppercase tracking-wide mb-0.5">Total</div>
          <div className="text-white text-2xl font-bold">{data.summary.totalAssets}</div>
        </div>
        {(['A', 'B', 'C', 'D', 'F', '--'] as const).map(grade => {
          const colors = GRADE_COLORS[grade]
          return (
            <div key={grade} className="bg-[#1a1a1a] rounded-lg p-3 text-center">
              <div className="text-gray-400 text-[10px] uppercase tracking-wide mb-0.5">
                {grade === '--' ? 'No Data' : `Grade ${grade}`}
              </div>
              <div className={`text-2xl font-bold ${colors.text}`}>
                {aqsDistribution[grade] || 0}
              </div>
            </div>
          )
        })}
      </div>

      {/* Filter Pills */}
      <div className="mb-3 flex items-center gap-3">
        <div className="flex gap-1.5">
          {TYPE_FILTERS.map(t => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={`px-3 py-1.5 rounded text-xs font-medium ${
                typeFilter === t
                  ? 'bg-amber-600 text-white'
                  : 'bg-[#1a1a1a] text-gray-400 hover:bg-gray-800'
              }`}
            >
              {t === 'All' ? 'All' : t.charAt(0) + t.slice(1).toLowerCase() + 's'}
            </button>
          ))}
        </div>
        <div className="w-px h-5 bg-gray-700" />
        <div className="flex gap-1.5 flex-wrap">
          <button
            onClick={() => setCampaignFilter('All')}
            className={`px-3 py-1.5 rounded text-xs font-medium ${
              campaignFilter === 'All'
                ? 'bg-blue-600 text-white'
                : 'bg-[#1a1a1a] text-gray-400 hover:bg-gray-800'
            }`}
          >
            All Campaigns
          </button>
          {campaigns.map(c => (
            <button
              key={c}
              onClick={() => setCampaignFilter(campaignFilter === c ? 'All' : c)}
              className={`px-3 py-1.5 rounded text-xs font-medium ${
                campaignFilter === c
                  ? 'bg-blue-600 text-white'
                  : 'bg-[#1a1a1a] text-gray-400 hover:bg-gray-800'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
        <span className="text-gray-500 text-xs ml-auto whitespace-nowrap">{filtered.length} assets</span>
      </div>

      {/* Table */}
      <div className="bg-[#1a1a1a] rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-black">
              <tr className="text-gray-400 text-xs uppercase">
                <th className="text-center p-2.5 cursor-pointer hover:text-white" onClick={() => handleSort('aqs')}>
                  AQS{sortArrow('aqs')}
                </th>
                <th className="text-left p-2.5">Asset Text</th>
                <th className="text-left p-2.5">Type</th>
                <th className="text-left p-2.5">Campaign</th>
                <th className="text-right p-2.5 cursor-pointer hover:text-white" onClick={() => handleSort('impressions')}>
                  Impr{sortArrow('impressions')}
                </th>
                <th className="text-right p-2.5 cursor-pointer hover:text-white" onClick={() => handleSort('clicks')}>
                  Clicks{sortArrow('clicks')}
                </th>
                <th className="text-right p-2.5 cursor-pointer hover:text-white" onClick={() => handleSort('ctr')}>
                  CTR{sortArrow('ctr')}
                </th>
                <th className="text-right p-2.5 cursor-pointer hover:text-white" onClick={() => handleSort('conversions')}>
                  Conv{sortArrow('conversions')}
                </th>
                <th className="text-right p-2.5 cursor-pointer hover:text-white" onClick={() => handleSort('convRate')}>
                  Conv %{sortArrow('convRate')}
                </th>
                <th className="text-right p-2.5 cursor-pointer hover:text-white" onClick={() => handleSort('cost')}>
                  Cost{sortArrow('cost')}
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((a, i) => {
                const perf = PERF_COLORS[a.performanceLabel] || PERF_COLORS['N/A']
                return (
                  <tr key={i} className="border-t border-gray-800 hover:bg-gray-700">
                    <td className="p-2.5 text-center">
                      <AqsBadge aqs={a.aqs} fieldType={a.fieldType} />
                    </td>
                    <td className="p-2.5 text-gray-300 max-w-xs truncate" title={a.assetText}>{a.assetText}</td>
                    <td className="p-2.5 text-gray-500 text-xs whitespace-nowrap">{a.fieldType}</td>
                    <td className="p-2.5 text-gray-500 text-xs">{a.campaign}</td>
                    <td className="p-2.5 text-right text-gray-400">{a.impressions.toLocaleString()}</td>
                    <td className="p-2.5 text-right text-gray-400">{a.clicks.toLocaleString()}</td>
                    <td className="p-2.5 text-right text-gray-400">{a.ctr.toFixed(1)}%</td>
                    <td className="p-2.5 text-right text-gray-400">{a.conversions.toFixed(1)}</td>
                    <td className="p-2.5 text-right text-gray-400">{a.convRate.toFixed(1)}%</td>
                    <td className="p-2.5 text-right text-gray-400">${Math.round(a.cost).toLocaleString()}</td>
                  </tr>
                )
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={10} className="p-8 text-center text-gray-500">No assets match the current filters</td>
                </tr>
              )}
            </tbody>
            {filtered.length > 0 && (() => {
              const totImpr = filtered.reduce((s, a) => s + a.impressions, 0)
              const totClicks = filtered.reduce((s, a) => s + a.clicks, 0)
              const totConv = filtered.reduce((s, a) => s + a.conversions, 0)
              const totCost = filtered.reduce((s, a) => s + a.cost, 0)
              const avgCtr = totImpr > 0 ? (totClicks / totImpr) * 100 : 0
              const avgConvRate = totClicks > 0 ? (totConv / totClicks) * 100 : 0
              return (
                <tfoot className="bg-black border-t-2 border-gray-600">
                  <tr className="text-white font-semibold">
                    <td></td>
                    <td className="p-2.5" colSpan={2}>
                      Summary — {campaignFilter === 'All' ? 'All Campaigns' : campaignFilter}
                      {typeFilter !== 'All' && ` / ${typeFilter.charAt(0) + typeFilter.slice(1).toLowerCase()}s`}
                    </td>
                    <td className="p-2.5 text-right text-xs text-gray-400">{filtered.length} assets</td>
                    <td className="p-2.5 text-right">{totImpr.toLocaleString()}</td>
                    <td className="p-2.5 text-right">{totClicks.toLocaleString()}</td>
                    <td className="p-2.5 text-right">{avgCtr.toFixed(1)}%</td>
                    <td className="p-2.5 text-right">{totConv.toFixed(1)}</td>
                    <td className="p-2.5 text-right">{avgConvRate.toFixed(1)}%</td>
                    <td className="p-2.5 text-right">${Math.round(totCost).toLocaleString()}</td>
                  </tr>
                </tfoot>
              )
            })()}
          </table>
        </div>
      </div>

      {/* Recommendations Panel */}
      <RecommendationsPanel scored={filtered} campaignFilter={campaignFilter} typeFilter={typeFilter} />
    </>
  )
}
