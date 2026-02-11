import { NextResponse } from 'next/server'
import competitorsData from '@/data/awr/competitors.json'

export async function GET() {
  return NextResponse.json(competitorsData, {
    headers: {
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=300',
    },
  })
}
