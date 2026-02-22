/**
 * AI-powered search for the Website Development Log
 *
 * POST /api/website-log-search
 * Body: { query: string, events: LogEvent[] }
 * Returns: { answer: string, relevantIds: string[] }
 *
 * Uses Claude Haiku (fast + cheap) to do semantic/natural-language matching.
 * Falls back gracefully on parse errors.
 */

import { NextResponse } from 'next/server'

interface LogEvent {
  id: string
  date: string
  time: string
  timezone: string
  title: string
  description: string
  category: string
  impact: string
  author: string
}

interface SearchRequest {
  query: string
  events: LogEvent[]
}

interface AnthropicResponse {
  answer: string
  relevantIds: string[]
}

export async function POST(request: Request) {
  try {
    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: 'AI search not configured' }, { status: 503 })
    }

    const body: SearchRequest = await request.json()
    const { query, events } = body

    if (!query?.trim() || !events?.length) {
      return NextResponse.json({ error: 'query and events are required' }, { status: 400 })
    }

    // Build a compact event list for the prompt
    const eventSummary = events.map(e =>
      `ID: ${e.id} | Date: ${e.date} | Category: ${e.category} | Title: ${e.title} | Details: ${e.description}`
    ).join('\n')

    const prompt = `You are a helpful assistant for a website development log. A user is searching for information about when certain work was done on the QuickBooks Training website.

Answer the query in plain, friendly English - like you are explaining it to a business executive, not a developer. Be specific about dates. Do not use technical jargon. Keep the answer to 2-3 sentences maximum.

Also identify which event IDs from the log are most relevant to the query.

Return your response as a JSON object with exactly two fields:
- "answer": your plain English answer (2-3 sentences, readable for a non-technical executive, mention specific dates)
- "relevantIds": array of event IDs most relevant to the query, ordered by relevance, empty array if nothing matches

LOG EVENTS:
${eventSummary}

USER QUERY: ${query}

Important: Return raw JSON only. No markdown. No backticks. No code fences. Just the JSON object.`

    const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5',
        max_tokens: 512,
        messages: [{ role: 'user', content: prompt }],
      }),
    })

    if (!anthropicRes.ok) {
      const errText = await anthropicRes.text()
      throw new Error(`Anthropic API error ${anthropicRes.status}: ${errText}`)
    }

    const anthropicData = await anthropicRes.json()
    let rawText: string = anthropicData.content?.[0]?.text ?? '{}'

    // Strip markdown code fences Claude sometimes adds despite instructions
    rawText = rawText.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '').trim()

    // Parse Claude's JSON response
    let parsed: AnthropicResponse
    try {
      parsed = JSON.parse(rawText)
    } catch {
      // Last resort: if still not valid JSON, treat the text as a plain answer
      parsed = { answer: rawText, relevantIds: [] }
    }

    return NextResponse.json({
      answer: parsed.answer ?? '',
      relevantIds: Array.isArray(parsed.relevantIds) ? parsed.relevantIds : [],
    })

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('[/api/website-log-search]', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
