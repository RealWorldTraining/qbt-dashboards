/**
 * Health Check API Endpoint
 * 
 * Validates that all dashboard APIs are responding correctly.
 * Used by monitoring systems and GitHub Actions.
 * 
 * GET /api/health
 * Returns: { status, checks[], failedCount, timestamp }
 */

import { NextResponse } from 'next/server';

const ENDPOINTS_TO_CHECK = [
  { path: '/api/combined-weekly', name: 'Combined Weekly' },
  { path: '/api/google-ads-summary', name: 'Google Ads Summary' },
  { path: '/api/bing-ads-summary', name: 'Bing Ads Summary' },
  { path: '/api/ga4-traffic', name: 'GA4 Traffic' },
];

interface HealthCheck {
  endpoint: string;
  name: string;
  ok: boolean;
  statusCode?: number;
  hasData?: boolean;
  dataKeys?: number;
  error?: string;
  responseTime?: number;
}

async function checkEndpoint(baseUrl: string, endpoint: { path: string; name: string }): Promise<HealthCheck> {
  const startTime = Date.now();
  
  try {
    const res = await fetch(`${baseUrl}${endpoint.path}`, {
      headers: {
        'x-health-check': 'true', // Optional: skip rate limiting for health checks
      },
      next: { revalidate: 0 } // Don't cache health checks
    });
    
    const responseTime = Date.now() - startTime;
    
    if (!res.ok) {
      return {
        endpoint: endpoint.path,
        name: endpoint.name,
        ok: false,
        statusCode: res.status,
        responseTime,
        error: `HTTP ${res.status}: ${res.statusText}`
      };
    }
    
    const data = await res.json();
    const hasData = data && Object.keys(data).length > 0;
    
    return {
      endpoint: endpoint.path,
      name: endpoint.name,
      ok: true,
      statusCode: res.status,
      hasData,
      dataKeys: Object.keys(data).length,
      responseTime
    };
  } catch (error: any) {
    return {
      endpoint: endpoint.path,
      name: endpoint.name,
      ok: false,
      error: error.message,
      responseTime: Date.now() - startTime
    };
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const baseUrl = searchParams.get('baseUrl') || 
                  process.env.NEXT_PUBLIC_BASE_URL || 
                  'https://qbtraining.ai';
  
  const startTime = Date.now();
  
  // Run all health checks in parallel
  const checks = await Promise.all(
    ENDPOINTS_TO_CHECK.map(endpoint => checkEndpoint(baseUrl, endpoint))
  );
  
  const totalTime = Date.now() - startTime;
  const failedChecks = checks.filter(c => !c.ok);
  const status = failedChecks.length === 0 ? 'healthy' : 
                 failedChecks.length === checks.length ? 'critical' : 
                 'degraded';
  
  const response = {
    status,
    checks,
    summary: {
      total: checks.length,
      healthy: checks.filter(c => c.ok).length,
      failed: failedChecks.length,
      totalResponseTime: totalTime
    },
    timestamp: new Date().toISOString()
  };
  
  // Set appropriate HTTP status code
  const httpStatus = status === 'healthy' ? 200 : 
                     status === 'degraded' ? 207 : 
                     503;
  
  return NextResponse.json(response, { 
    status: httpStatus,
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate',
    }
  });
}
