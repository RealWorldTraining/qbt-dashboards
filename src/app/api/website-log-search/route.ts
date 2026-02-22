/**
 * AI-powered search for the Website Development Log
 *
 * POST /api/website-log-search
 * Body: { query: string, events: LogEvent[] }
 * Returns: { answer: string, relevantIds: string[] }
 *
 * Uses Claude Haiku (fast + cheap) to do semantic/natural-language matching.
 * Falls back to empty relevantIds (caller handles gracefully).
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
      `ID: ${e.id} | ${e.date} | [${e.category}] ${e.title} - ${e.description}`
    ).join('\n')

    const prompt = `You are a search assistant for a website development log. A user wants to find relevant events from this log.

Given the events below and the user's query, return a JSON object with:
- "answer": A 1-2 sentence plain English response to the query (what you found, when it happened, etc.)
- "relevantIds": An array of event IDs most relevant to the query, ordered by relevance (most relevant first). Only include genuinely relevant events. Return an empty array if nothing matches.

EVENTS:
${eventSummary}

USER QUERY: ${query}

Respond with ONLY valid JSON, no markdown, no explanation outside the JSON.`

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
    const rawText = anthropicData.content?.[0]?.text ?? '{}'

    // Parse Claude's JSON response
    let parsed: AnthropicResponse
    try {
      parsed = JSON.parse(rawText)
    } catch {
      // If Claude returned non-JSON, wrap it
      parsed = { answer: rawText, relevantIds: [] }
    }

    return NextResponse.json({
      answer: parsed.answer ?? '',
      relevantIds: parsed.relevantIds ?? [],
    })

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('[/api/website-log-search]', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
