import { NextResponse } from 'next/server'
import visibilityData from '@/data/awr/visibility.json'

export async function GET() {
  return NextResponse.json(visibilityData, {
    headers: {
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=300',
    },
  })
}
