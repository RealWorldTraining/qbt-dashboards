"use client"

import { useState, useEffect, useCallback } from "react"

interface KeywordData {
  keyword: string
  action: string
  impressions: number
  clicks: number
  cost: number
  conversions: number
  costPerConv: number
  currentMaxCPC: number
  suggestedMaxCPC: number
  changeAmount: number
  searchImprShare: number
  imprTopPct: number
  clickShare?: number
  imprAbsTopPct: number
  searchLostIsRank?: number
}

interface ForcingFunctionsResult {
  adversarial: string
  uncertainty: string
  edgeCases: string
  timestamp: string
  dataHash: string
}

interface ForcingFunctionsProps {
  keywords: KeywordData[]
  platform: 'google' | 'bing'
}

function simpleHash(str: string): string {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash |= 0
  }
  return Math.abs(hash).toString(36)
}

function renderMarkdown(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    .replace(/(<li>[\s\S]*<\/li>)/g, '<ul class="list-disc pl-5 space-y-1">$1</ul>')
    .replace(/(<\/ul>\s*<ul[^>]*>)/g, '')
    .replace(/\n\n/g, '<br/><br/>')
    .replace(/\n/g, '<br/>')
}

const sections = [
  { key: 'adversarial' as const, icon: '\u2694\uFE0F', title: 'Adversarial Interrogation' },
  { key: 'uncertainty' as const, icon: '\uD83D\uDCCA', title: 'Uncertainty Quantification' },
  { key: 'edgeCases' as const, icon: '\uD83D\uDD0D', title: 'Edge Case Hunter' },
]

export function ForcingFunctions({ keywords, platform }: ForcingFunctionsProps) {
  const [result, setResult] = useState<ForcingFunctionsResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    adversarial: true, uncertainty: true, edgeCases: true
  })

  const dataHash = simpleHash(JSON.stringify(keywords.map(k => k.keyword + k.action + k.suggestedMaxCPC)))
  const cacheKey = `ff-${platform}-${dataHash}`

  const runAnalysis = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/forcing-functions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keywords, platform })
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Analysis failed')
      }
      const data: ForcingFunctionsResult = await res.json()
      setResult(data)
      setOpenSections({ adversarial: true, uncertainty: true, edgeCases: true })
      try { localStorage.setItem(cacheKey, JSON.stringify(data)) } catch {}
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Analysis failed')
    } finally {
      setLoading(false)
    }
  }, [keywords, platform, cacheKey])

  useEffect(() => {
    if (keywords.length === 0) return
    try {
      const cached = localStorage.getItem(cacheKey)
      if (cached) {
        setResult(JSON.parse(cached))
        return
      }
    } catch {}
    runAnalysis()
  }, [cacheKey, keywords.length, runAnalysis])

  if (keywords.length === 0) return null

  const toggleSection = (key: string) => {
    setOpenSections(prev => ({ ...prev, [key]: !prev[key] }))
  }

  return (
    <div className="mb-5">
      <div className="bg-[#1a1a1a] rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-gray-300 text-sm font-semibold uppercase tracking-wide flex items-center gap-2">
            <span>{'\uD83C\uDFAF'}</span> Forcing Functions Analysis
          </h3>
          <div className="flex items-center gap-3">
            {result && (
              <span className="text-gray-500 text-xs">
                Generated: {new Date(result.timestamp).toLocaleString('en-US', {
                  month: 'short', day: 'numeric', year: 'numeric',
                  hour: 'numeric', minute: '2-digit', hour12: true
                })}
              </span>
            )}
            <button
              onClick={runAnalysis}
              disabled={loading}
              className="px-3 py-1.5 rounded text-xs font-medium bg-cyan-700 hover:bg-cyan-600 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Analyzing...' : 'Re-run Analysis'}
            </button>
          </div>
        </div>

        {loading && (
          <div className="py-8 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-600 border-t-cyan-500 mb-4"></div>
            <div className="space-y-2 text-sm text-gray-400">
              <p>{'\u2694\uFE0F'} Running Adversarial Interrogation...</p>
              <p>{'\uD83D\uDCCA'} Running Uncertainty Quantification...</p>
              <p>{'\uD83D\uDD0D'} Running Edge Case Hunter...</p>
            </div>
          </div>
        )}

        {error && !loading && (
          <div className="py-4 text-center text-red-400 text-sm">{error}</div>
        )}

        {result && !loading && (
          <div className="space-y-3">
            {sections.map(({ key, icon, title }) => (
              <div key={key} className="border border-gray-800 rounded-lg overflow-hidden">
                <button
                  onClick={() => toggleSection(key)}
                  className="w-full flex items-center justify-between px-4 py-3 bg-black/30 hover:bg-black/50 transition-colors"
                >
                  <span className="text-gray-200 text-sm font-medium">
                    {icon} {title}
                  </span>
                  <span className="text-gray-500 text-xs">
                    {openSections[key] ? '\u25BC' : '\u25B6' /* these are in JS expressions already */}
                  </span>
                </button>
                {openSections[key] && (
                  <div
                    className="px-4 py-3 text-gray-300 text-sm leading-relaxed prose-invert"
                    dangerouslySetInnerHTML={{ __html: renderMarkdown(result[key]) }}
                  />
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
