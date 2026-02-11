import { NextResponse } from 'next/server'
import rankingsData from '@/data/awr/rankings.json'

export async function GET() {
  return NextResponse.json(rankingsData, {
    headers: {
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=300',
    },
  })
}
