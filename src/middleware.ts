import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Credentials for different sections
const HOMEPAGE_USER = process.env.HOMEPAGE_USER || 'admin'
const HOMEPAGE_PASSWORD = process.env.HOMEPAGE_PASSWORD || 'qbtraining2026'

const RECAP_USER = process.env.RECAP_USER || 'david'
const RECAP_PASSWORD = process.env.RECAP_PASSWORD || 'recap2026'

// Routes that use RECAP credentials
const RECAP_ROUTES = ['/recap']

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const authHeader = request.headers.get('authorization')

  // Determine which credentials to use based on route
  const isRecapRoute = RECAP_ROUTES.some(route => 
    pathname === route || pathname.startsWith(route + '/')
  )
  
  const expectedUser = isRecapRoute ? RECAP_USER : HOMEPAGE_USER
  const expectedPassword = isRecapRoute ? RECAP_PASSWORD : HOMEPAGE_PASSWORD
  const realm = isRecapRoute ? 'P&L Recap Access' : 'Dashboard Access'

  if (authHeader) {
    try {
      const authValue = authHeader.split(' ')[1]
      const [user, pwd] = atob(authValue).split(':')

      if (user === expectedUser && pwd === expectedPassword) {
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
      'WWW-Authenticate': `Basic realm="${realm}"`,
    },
  })
}

export const config = {
  matcher: [
    // Homepage
    '/',
    // Recap (separate credentials)
    '/recap/:path*',
    '/recap',
    // Other dashboards (use homepage credentials)
    '/data/:path*',
    '/data',
    '/sales/:path*',
    '/sales',
    '/team/:path*',
    '/team',
    // Note: /api routes excluded - they have their own auth
  ],
}
