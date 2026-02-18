import { NextResponse } from 'next/server'

interface KeywordInput {
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

async function callAnthropic(systemPrompt: string, userMessage: string, model: string): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY not configured')

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model,
      max_tokens: 2048,
      system: systemPrompt,
      messages: [{ role: 'user', content: userMessage }]
    })
  })

  if (!response.ok) {
    throw new Error(`Anthropic API error: ${response.statusText}`)
  }

  const data = await response.json()
  return data.content[0].text
}

function buildKeywordTable(keywords: KeywordInput[], platform: string): string {
  const header = `| Keyword | Action | Conv | Impr | Clicks | CTR | Cost | CPA | Current CPC | Suggested CPC | Change | Impr Share | Top% | ${platform === 'google' ? 'Click Share | ' : ''}Abs Top% | ${platform === 'google' ? 'Lost IS |' : ''}`
  const separator = '|' + header.split('|').slice(1).map(() => '---').join('|') + '|'

  const rows = keywords.map(k => {
    const ctr = k.impressions > 0 ? ((k.clicks / k.impressions) * 100).toFixed(1) + '%' : '0.0%'
    const base = `| ${k.keyword} | ${k.action} | ${Math.round(k.conversions)} | ${k.impressions.toLocaleString()} | ${k.clicks.toLocaleString()} | ${ctr} | $${Math.round(k.cost)} | $${Math.round(k.costPerConv)} | $${k.currentMaxCPC.toFixed(2)} | $${k.suggestedMaxCPC.toFixed(2)} | ${k.changeAmount > 0 ? '+' : ''}$${k.changeAmount.toFixed(2)} | ${k.searchImprShare.toFixed(1)}% | ${k.imprTopPct.toFixed(1)}% | ${platform === 'google' ? (k.clickShare?.toFixed(1) ?? '0.0') + '% | ' : ''}${k.imprAbsTopPct.toFixed(1)}% | ${platform === 'google' ? (k.searchLostIsRank?.toFixed(1) ?? '0.0') + '% |' : ''}`
    return base
  })

  return [header, separator, ...rows].join('\n')
}

const ADVERSARIAL_SYSTEM = `You are an adversarial analyst stress-testing CPC bid recommendations for a paid search advertising account. Your job is to argue AGAINST each RAISE recommendation. Be specific — reference the actual metrics. Which raises don't survive scrutiny? Which ones are well-justified? Format your response with **bold** for key points and - bullets for each keyword analyzed. Keep it concise but thorough.`

const UNCERTAINTY_SYSTEM = `You are an uncertainty quantification analyst for paid search bid recommendations. For each RAISE recommendation, break it down into its underlying claims (e.g., "this keyword has room to grow impression share", "the CPA is sustainable at a higher bid"). Rate your confidence 0-100 on each claim based on the data provided. Flag any claims where data is insufficient. Format with **bold** headers per keyword and - bullets for each claim with [confidence: X/100].`

const EDGE_CASE_SYSTEM = `You are an edge case analyst for paid search bid recommendations. Find scenarios where these bid raises would backfire. Consider: seasonality, competitor behavior, diminishing returns at high impression share, CPA sensitivity, budget constraints, auction dynamics. Be specific to each keyword's metrics. Format with **bold** for scenario names and - bullets for details. Focus on actionable risks, not theoretical ones.`

export async function POST(request: Request) {
  try {
    const { keywords, platform } = await request.json()

    if (!keywords || !Array.isArray(keywords) || keywords.length === 0) {
      return NextResponse.json({ error: 'No keywords provided' }, { status: 400 })
    }

    const keywordTable = buildKeywordTable(keywords, platform || 'google')
    const userMessage = `Here are the current Max CPC bid recommendations for our ${platform === 'bing' ? 'Bing Ads' : 'Google Ads'} account. Focus your analysis on the RAISE recommendations:\n\n${keywordTable}`

    const model = 'claude-opus-4-20250514'

    const [adversarial, uncertainty, edgeCases] = await Promise.all([
      callAnthropic(ADVERSARIAL_SYSTEM, userMessage, model),
      callAnthropic(UNCERTAINTY_SYSTEM, userMessage, model),
      callAnthropic(EDGE_CASE_SYSTEM, userMessage, model)
    ])

    return NextResponse.json({
      adversarial,
      uncertainty,
      edgeCases,
      timestamp: new Date().toISOString(),
      dataHash: simpleHash(JSON.stringify(keywords.map((k: KeywordInput) => k.keyword + k.action + k.suggestedMaxCPC)))
    })
  } catch (error) {
    console.error('Forcing functions error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Analysis failed' },
      { status: 500 }
    )
  }
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
