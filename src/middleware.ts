import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Master account - access to EVERYTHING
const MASTER_USER = 'Belize'
const MASTER_PASSWORD = 'HKTS'

// Recap-only account - access to /recap ONLY
const RECAP_USER = 'ADMIN'
const RECAP_PASSWORD = 'qbtraining2026'

// Routes accessible by recap-only account
const RECAP_ROUTES = ['/recap']

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const authHeader = request.headers.get('authorization')

  const isRecapRoute = RECAP_ROUTES.some(route => 
    pathname === route || pathname.startsWith(route + '/')
  )

  if (authHeader) {
    try {
      const authValue = authHeader.split(' ')[1]
      const [user, pwd] = atob(authValue).split(':')

      // Master account can access everything (username case-insensitive)
      if (user.toLowerCase() === MASTER_USER.toLowerCase() && pwd === MASTER_PASSWORD) {
        return NextResponse.next()
      }

      // Recap-only account can only access recap routes (username case-insensitive)
      if (user.toLowerCase() === RECAP_USER.toLowerCase() && pwd === RECAP_PASSWORD && isRecapRoute) {
        return NextResponse.next()
      }
    } catch {
      // Invalid auth header format
    }
  }

  // Return 401 with basic auth challenge
  return new NextResponse('Authentication required', {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="Dashboard Access"',
    },
  })
}

export const config = {
  matcher: [
    // Homepage
    '/',
    // Recap
    '/recap/:path*',
    '/recap',
    // Other dashboards
    '/data/:path*',
    '/data',
    '/sales/:path*',
    '/sales',
    '/team/:path*',
    '/team',
    // Note: /api routes excluded - they have their own auth
  ],
}
