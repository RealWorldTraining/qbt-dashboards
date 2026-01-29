import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Simple basic auth for dashboard protection
const DASHBOARD_USER = process.env.DASHBOARD_USER || 'admin'
const DASHBOARD_PASSWORD = process.env.DASHBOARD_PASSWORD || 'qbtraining2026'

export function middleware(request: NextRequest) {
  const authHeader = request.headers.get('authorization')

  if (authHeader) {
    const authValue = authHeader.split(' ')[1]
    const [user, pwd] = atob(authValue).split(':')

    if (user === DASHBOARD_USER && pwd === DASHBOARD_PASSWORD) {
      return NextResponse.next()
    }
  }

  // Return 401 with basic auth challenge
  return new NextResponse('Authentication required', {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="Site Access"',
    },
  })
}

export const config = {
  matcher: [
    '/recap/:path*',
    '/recap',
    '/api/recap/:path*',
    '/api/recap',
  ],
}
