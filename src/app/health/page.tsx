/**
 * Health Check Dashboard Page
 * 
 * Real-time status of all dashboard APIs.
 * Automatically refreshes every 30 seconds.
 * 
 * Route: /health
 */

import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Health Status | QBT Dashboards',
  description: 'Real-time health status of all dashboard APIs'
};

// Force dynamic rendering (no static generation)
export const dynamic = 'force-dynamic';
export const revalidate = 0;

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

interface HealthResponse {
  status: 'healthy' | 'degraded' | 'critical';
  checks: HealthCheck[];
  summary: {
    total: number;
    healthy: number;
    failed: number;
    totalResponseTime: number;
  };
  timestamp: string;
}

async function getHealthStatus(): Promise<HealthResponse> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://qbtraining.ai';
  
  try {
    const res = await fetch(`${baseUrl}/api/health`, {
      cache: 'no-store'
    });
    
    return await res.json();
  } catch (error) {
    return {
      status: 'critical',
      checks: [],
      summary: { total: 0, healthy: 0, failed: 0, totalResponseTime: 0 },
      timestamp: new Date().toISOString()
    };
  }
}

function StatusBadge({ status }: { status: string }) {
  const styles = {
    healthy: 'bg-green-100 text-green-800',
    degraded: 'bg-yellow-100 text-yellow-800',
    critical: 'bg-red-100 text-red-800'
  };
  
  const icons = {
    healthy: '🟢',
    degraded: '🟡',
    critical: '🔴'
  };
  
  return (
    <span className={`px-3 py-1 rounded-full text-sm font-medium ${styles[status as keyof typeof styles] || styles.critical}`}>
      {icons[status as keyof typeof icons]} {status.toUpperCase()}
    </span>
  );
}

function CheckRow({ check }: { check: HealthCheck }) {
  return (
    <tr className={check.ok ? 'bg-white' : 'bg-red-50'}>
      <td className="px-6 py-4 whitespace-nowrap">
        <span className={`text-2xl ${check.ok ? 'text-green-500' : 'text-red-500'}`}>
          {check.ok ? '✅' : '❌'}
        </span>
      </td>
      <td className="px-6 py-4">
        <div className="text-sm font-medium text-gray-900">{check.name}</div>
        <div className="text-sm text-gray-500">{check.endpoint}</div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        {check.statusCode ? (
          <span className={`px-2 py-1 text-xs font-semibold rounded ${
            check.statusCode === 200 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>
            {check.statusCode}
          </span>
        ) : (
          <span className="text-gray-400">—</span>
        )}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        {check.hasData !== undefined ? (
          check.hasData ? (
            <span className="text-green-600">✓ {check.dataKeys} keys</span>
          ) : (
            <span className="text-red-600">✗ No data</span>
          )
        ) : (
          <span className="text-gray-400">—</span>
        )}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        {check.responseTime ? `${check.responseTime}ms` : '—'}
      </td>
      <td className="px-6 py-4 text-sm text-red-600">
        {check.error || '—'}
      </td>
    </tr>
  );
}

export default async function HealthPage() {
  const health = await getHealthStatus();
  
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Dashboard Health Status
          </h1>
          <p className="text-gray-600">
            Real-time monitoring of all dashboard APIs
          </p>
        </div>

        {/* Status Card */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Overall Status
              </h2>
              <StatusBadge status={health.status} />
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-500">Last checked</div>
              <div className="text-lg font-mono text-gray-900">
                {new Date(health.timestamp).toLocaleTimeString('en-US', {
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit'
                })}
              </div>
            </div>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-gray-50 rounded p-4">
              <div className="text-sm text-gray-600">Total Endpoints</div>
              <div className="text-2xl font-bold text-gray-900">
                {health.summary.total}
              </div>
            </div>
            <div className="bg-green-50 rounded p-4">
              <div className="text-sm text-green-600">Healthy</div>
              <div className="text-2xl font-bold text-green-900">
                {health.summary.healthy}
              </div>
            </div>
            <div className="bg-red-50 rounded p-4">
              <div className="text-sm text-red-600">Failed</div>
              <div className="text-2xl font-bold text-red-900">
                {health.summary.failed}
              </div>
            </div>
            <div className="bg-blue-50 rounded p-4">
              <div className="text-sm text-blue-600">Total Response Time</div>
              <div className="text-2xl font-bold text-blue-900">
                {health.summary.totalResponseTime}ms
              </div>
            </div>
          </div>
        </div>

        {/* Checks Table */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Endpoint
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  HTTP
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Data
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Response Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Error
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {health.checks.map((check) => (
                <CheckRow key={check.endpoint} check={check} />
              ))}
            </tbody>
          </table>
        </div>

        {/* Enhanced Dashboard Link */}
        <div className="mt-6 text-center">
          <a 
            href="/health/enhanced" 
            className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            📊 View Enhanced Dashboard
            <span className="ml-2 text-sm">
              (Full inventory + issue tracking)
            </span>
          </a>
        </div>

        {/* Auto-refresh notice */}
        <div className="mt-4 text-center text-sm text-gray-500">
          <p>Page auto-refreshes every 30 seconds</p>
          <p className="mt-1">
            <a href="/health" className="text-blue-600 hover:text-blue-800">
              Click here to refresh now
            </a>
          </p>
        </div>
      </div>

      {/* Auto-refresh script */}
      <script
        dangerouslySetInnerHTML={{
          __html: `setTimeout(() => window.location.reload(), 30000);`
        }}
      />
    </div>
  );
}
