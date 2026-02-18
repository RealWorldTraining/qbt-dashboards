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

function renderMarkdown(text: string, accentColor: string): string {
  return text
    .replace(/^### (.+)$/gm, `<h3 style="color: ${accentColor}; font-size: 1.1rem; font-weight: 700; margin-top: 1.25rem; margin-bottom: 0.5rem;">$1</h3>`)
    .replace(/^## (.+)$/gm, `<h2 style="color: ${accentColor}; font-size: 1.3rem; font-weight: 700; margin-top: 1.5rem; margin-bottom: 0.75rem;">$1</h2>`)
    .replace(/\*\*Verdict: (REJECT|WEAK JUSTIFICATION)[^*]*\*\*/g, '<strong style="color: #EF4444;">$&</strong>')
    .replace(/\*\*Verdict: QUESTIONABLE[^*]*\*\*/g, '<strong style="color: #F59E0B;">$&</strong>')
    .replace(/\*\*Verdict: (APPROVE|JUSTIFIED|STRONG)[^*]*\*\*/g, '<strong style="color: #10B981;">$&</strong>')
    .replace(/\*\*Summary:?\*\*/g, `<strong style="color: ${accentColor};">Summary:</strong>`)
    .replace(/\*\*(.+?)\*\*/g, '<strong style="color: #e2e8f0;">$1</strong>')
    .replace(/^- (.+)$/gm, '<li style="margin-bottom: 0.35rem;">$1</li>')
    .replace(/(<li[\s\S]*?<\/li>)/g, '<ul style="list-style-type: disc; padding-left: 1.25rem; margin: 0.5rem 0;">$1</ul>')
    .replace(/(<\/ul>\s*<ul[^>]*>)/g, '')
    .replace(/\n\n/g, '<div style="margin-top: 0.75rem;"></div>')
    .replace(/\n/g, '<br/>')
}

const sections = [
  { key: 'adversarial' as const, icon: '\u2694\uFE0F', title: 'Adversarial Interrogation', color: '#F87171', borderColor: 'border-red-800' },
  { key: 'uncertainty' as const, icon: '\uD83D\uDCCA', title: 'Uncertainty Quantification', color: '#60A5FA', borderColor: 'border-blue-800' },
  { key: 'edgeCases' as const, icon: '\uD83D\uDD0D', title: 'Edge Case Hunter', color: '#FBBF24', borderColor: 'border-yellow-800' },
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
          <h3 className="text-white text-xl font-bold tracking-wide flex items-center gap-2">
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
            {sections.map(({ key, icon, title, color, borderColor }) => (
              <div key={key} className={`border ${borderColor} rounded-lg overflow-hidden`}>
                <button
                  onClick={() => toggleSection(key)}
                  className="w-full flex items-center justify-between px-4 py-3 bg-black/40 hover:bg-black/60 transition-colors"
                >
                  <span className="text-lg font-semibold" style={{ color }}>
                    {icon} {title}
                  </span>
                  <span className="text-gray-500">
                    {openSections[key] ? '\u25BC' : '\u25B6'}
                  </span>
                </button>
                {openSections[key] && (
                  <div
                    className="px-5 py-4 text-gray-300 text-sm leading-relaxed"
                    style={{ borderTop: `1px solid ${color}33` }}
                    dangerouslySetInnerHTML={{ __html: renderMarkdown(result[key], color) }}
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
