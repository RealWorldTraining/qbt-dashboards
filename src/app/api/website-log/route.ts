/**
 * Website Development Log API
 *
 * Fetches website-changelog.json from the qbtraining-site GitHub repo
 * and returns the parsed event log.
 *
 * GET /api/website-log
 * Returns: { project, description, lastUpdated, events[] }
 */

import { NextResponse } from 'next/server'

const GITHUB_CONTENTS_URL =
  'https://api.github.com/repos/RealWorldTraining/qbtraining-site/contents/website-changelog.json'

export const revalidate = 300 // re-fetch every 5 minutes

export async function GET() {
  try {
    const token = process.env.GITHUB_CHANGELOG_TOKEN
    const headers: Record<string, string> = {
      Accept: 'application/vnd.github.v3+json',
      ...(token ? { Authorization: `token ${token}` } : {}),
    }

    const res = await fetch(GITHUB_CONTENTS_URL, {
      headers,
      next: { revalidate: 300 },
    })

    if (!res.ok) {
      throw new Error(`GitHub API responded ${res.status}: ${res.statusText}`)
    }

    const json = await res.json()

    // GitHub returns file content as base64
    const decoded = Buffer.from(json.content, 'base64').toString('utf-8')
    const data = JSON.parse(decoded)

    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=60',
      },
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('[/api/website-log]', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
