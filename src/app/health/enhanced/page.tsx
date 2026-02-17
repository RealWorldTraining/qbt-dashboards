/**
 * Enhanced Health Dashboard
 * 
 * Shows complete inventory of charts, reports, data sources,
 * validation status, and issue history.
 * 
 * Route: /health/enhanced
 */

import { Metadata } from 'next';
import { DASHBOARD_INVENTORY, DATA_SOURCE_CATALOG } from '@/lib/dashboard-inventory';
import { ISSUE_LOG, getOpenIssues, getResolvedIssues } from '@/lib/issue-log';

export const metadata: Metadata = {
  title: 'Enhanced Health Dashboard | QBT Dashboards',
  description: 'Complete dashboard inventory with validation status and issue tracking'
};

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface HealthCheck {
  endpoint: string;
  name: string;
  ok: boolean;
  statusCode?: number;
  hasData?: boolean;
  error?: string;
}

interface HealthResponse {
  status: 'healthy' | 'degraded' | 'critical';
  checks: HealthCheck[];
  summary: {
    total: number;
    healthy: number;
    failed: number;
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
      summary: { total: 0, healthy: 0, failed: 0 },
      timestamp: new Date().toISOString()
    };
  }
}

function StatusBadge({ status }: { status: string }) {
  const styles = {
    healthy: 'bg-green-100 text-green-800',
    degraded: 'bg-yellow-100 text-yellow-800',
    critical: 'bg-red-100 text-red-800',
    open: 'bg-red-100 text-red-800',
    investigating: 'bg-yellow-100 text-yellow-800',
    resolved: 'bg-green-100 text-green-800',
    monitoring: 'bg-blue-100 text-blue-800'
  };
  
  const icons = {
    healthy: '🟢',
    degraded: '🟡',
    critical: '🔴',
    open: '❌',
    investigating: '🔍',
    resolved: '✅',
    monitoring: '👁️'
  };
  
  return (
    <span className={`px-2 py-1 rounded text-xs font-medium ${styles[status as keyof typeof styles] || styles.critical}`}>
      {icons[status as keyof typeof icons]} {status.toUpperCase()}
    </span>
  );
}

function SeverityBadge({ severity }: { severity: string }) {
  const styles = {
    critical: 'bg-red-600 text-white',
    high: 'bg-orange-500 text-white',
    medium: 'bg-yellow-500 text-white',
    low: 'bg-blue-500 text-white'
  };
  
  return (
    <span className={`px-2 py-1 rounded text-xs font-bold ${styles[severity as keyof typeof styles]}`}>
      {severity.toUpperCase()}
    </span>
  );
}

export default async function EnhancedHealthPage() {
  const health = await getHealthStatus();
  const openIssues = getOpenIssues();
  const recentResolved = getResolvedIssues().slice(-5).reverse();
  
  // Map health checks to charts
  const chartStatus = DASHBOARD_INVENTORY.map(chart => {
    const apiCheck = health.checks.find(check => 
      check.endpoint === chart.route || 
      chart.dataSources.some(ds => ds.endpoint === check.endpoint)
    );
    
    const chartIssues = ISSUE_LOG.filter(issue => issue.chartId === chart.id);
    const openChartIssues = chartIssues.filter(i => i.status === 'open' || i.status === 'investigating');
    
    // Determine degraded reason from health check or issue log
    let degradedReason: string | undefined;
    if (apiCheck && !apiCheck.ok) {
      degradedReason = apiCheck.error || `HTTP ${apiCheck.statusCode}`;
    } else if (openChartIssues.length > 0) {
      degradedReason = openChartIssues[0].issue; // Show first open issue
    }
    
    return {
      ...chart,
      status: apiCheck?.ok ? 'healthy' : 'degraded',
      lastCheck: health.timestamp,
      issues: chartIssues,
      openIssues: openChartIssues.length,
      healthCheck: apiCheck,
      degradedReason
    };
  });
  
  const categories = {
    'paid-ads': 'Paid Advertising',
    'organic': 'Organic Growth',
    'sales': 'Sales & Revenue',
    'content': 'Content',
    'ai-tools': 'AI Tools'
  };
  
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Enhanced Health Dashboard
          </h1>
          <p className="text-gray-600">
            Complete inventory of charts, reports, data sources, and issue tracking
          </p>
        </div>

        {/* Overall Status */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Overall System Status
              </h2>
              <StatusBadge status={health.status} />
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-500">Last updated</div>
              <div className="text-lg font-mono text-gray-900">
                {new Date(health.timestamp).toLocaleTimeString('en-US')}
              </div>
            </div>
          </div>
          
          {/* Quick Stats */}
          <div className="grid grid-cols-4 gap-4 mt-6">
            <div className="bg-gray-50 rounded p-4">
              <div className="text-sm text-gray-600">Total Charts</div>
              <div className="text-2xl font-bold text-gray-900">
                {DASHBOARD_INVENTORY.length}
              </div>
            </div>
            <div className="bg-green-50 rounded p-4">
              <div className="text-sm text-green-600">Healthy</div>
              <div className="text-2xl font-bold text-green-900">
                {chartStatus.filter(c => c.status === 'healthy').length}
              </div>
            </div>
            <div className="bg-red-50 rounded p-4">
              <div className="text-sm text-red-600">Open Issues</div>
              <div className="text-2xl font-bold text-red-900">
                {openIssues.length}
              </div>
            </div>
            <div className="bg-blue-50 rounded p-4">
              <div className="text-sm text-blue-600">Data Sources</div>
              <div className="text-2xl font-bold text-blue-900">
                {DATA_SOURCE_CATALOG.adveronix.tabs.length + DATA_SOURCE_CATALOG.apis.length}
              </div>
            </div>
          </div>
        </div>

        {/* Open Issues */}
        {openIssues.length > 0 && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              🚨 Open Issues ({openIssues.length})
            </h2>
            <div className="space-y-4">
              {openIssues.map(issue => (
                <div key={issue.id} className="border-l-4 border-red-500 bg-red-50 p-4 rounded">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <SeverityBadge severity={issue.severity} />
                      <StatusBadge status={issue.status} />
                      <span className="font-semibold text-gray-900">{issue.chartName}</span>
                    </div>
                    <span className="text-sm text-gray-500">
                      {new Date(issue.timestamp).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-gray-900 mb-2">{issue.issue}</p>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Expected:</span>
                      <span className="ml-2 text-gray-900">{issue.expectedValue}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Actual:</span>
                      <span className="ml-2 text-red-600 font-semibold">{issue.actualValue}</span>
                    </div>
                  </div>
                  {issue.assignedTo && issue.assignedTo.length > 0 && (
                    <div className="mt-2 text-sm text-gray-600">
                      Assigned to: {issue.assignedTo.join(', ')}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Charts by Category */}
        {Object.entries(categories).map(([key, label]) => {
          const charts = chartStatus.filter(c => c.category === key);
          if (charts.length === 0) return null;
          
          return (
            <div key={key} className="bg-white rounded-lg shadow-lg p-6 mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                {label} ({charts.length})
              </h2>
              <div className="space-y-4">
                {charts.map(chart => (
                  <div key={chart.id} className="border rounded-lg p-4 hover:bg-gray-50">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <StatusBadge status={chart.status} />
                          <h3 className="font-semibold text-gray-900">{chart.name}</h3>
                          {chart.openIssues > 0 && (
                            <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded">
                              {chart.openIssues} open issue{chart.openIssues > 1 ? 's' : ''}
                            </span>
                          )}
                        </div>
                        <a href={chart.route} className="text-sm text-blue-600 hover:underline">
                          {chart.route}
                        </a>
                        
                        {/* Show WHY it's degraded */}
                        {chart.status === 'degraded' && chart.degradedReason && (
                          <div className="mt-2 p-2 bg-yellow-50 border-l-4 border-yellow-400 rounded">
                            <div className="text-sm font-medium text-yellow-800 mb-1">⚠️ Why degraded:</div>
                            <div className="text-sm text-yellow-900">
                              {chart.degradedReason}
                            </div>
                            {chart.healthCheck && !chart.healthCheck.ok && (
                              <div className="text-xs text-yellow-700 mt-1">
                                Health check failed: {chart.healthCheck.endpoint || 'Unknown endpoint'}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Data Sources */}
                    <div className="mb-3">
                      <div className="text-sm font-medium text-gray-700 mb-1">Data Sources:</div>
                      <div className="space-y-1">
                        {chart.dataSources.map((source, idx) => (
                          <div key={idx} className="text-sm text-gray-600 pl-4">
                            • {source.name}
                            {source.tab && <span className="text-gray-400 ml-2">({source.tab})</span>}
                            {source.endpoint && <span className="text-gray-400 ml-2">({source.endpoint})</span>}
                            <span className="text-gray-400 ml-2">— {source.updateFrequency}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    {/* Critical Metrics */}
                    <div className="mb-3">
                      <div className="text-sm font-medium text-gray-700 mb-1">Critical Metrics:</div>
                      <div className="flex flex-wrap gap-2">
                        {chart.criticalMetrics.map(metric => (
                          <span key={metric} className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded">
                            {metric}
                          </span>
                        ))}
                      </div>
                    </div>
                    
                    {/* Validations */}
                    <div>
                      <div className="text-sm font-medium text-gray-700 mb-1">Automated Checks:</div>
                      <div className="space-y-1">
                        {chart.validations.map((validation, idx) => (
                          <div key={idx} className="text-sm text-gray-600 pl-4">
                            ✓ {validation.check}
                            {validation.expectedRange && (
                              <span className="text-gray-400 ml-2">({validation.expectedRange})</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}

        {/* Recently Resolved Issues */}
        {recentResolved.length > 0 && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              ✅ Recently Resolved Issues
            </h2>
            <div className="space-y-4">
              {recentResolved.map(issue => (
                <div key={issue.id} className="border-l-4 border-green-500 bg-green-50 p-4 rounded">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <SeverityBadge severity={issue.severity} />
                      <StatusBadge status={issue.status} />
                      <span className="font-semibold text-gray-900">{issue.chartName}</span>
                    </div>
                    <span className="text-sm text-gray-500">
                      Resolved: {issue.resolution && new Date(issue.resolution.timestamp).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-gray-900 mb-2">{issue.issue}</p>
                  {issue.resolution && (
                    <div className="mt-3 pt-3 border-t border-green-200">
                      <div className="text-sm font-medium text-green-900 mb-1">Resolution:</div>
                      <p className="text-sm text-gray-700 mb-2">{issue.resolution.action}</p>
                      {issue.resolution.notes && (
                        <p className="text-sm text-gray-600 italic">{issue.resolution.notes}</p>
                      )}
                      {issue.rootCause && (
                        <div className="mt-2">
                          <div className="text-sm font-medium text-gray-700">Root Cause:</div>
                          <p className="text-sm text-gray-600">{issue.rootCause}</p>
                        </div>
                      )}
                      {issue.preventionSteps && issue.preventionSteps.length > 0 && (
                        <div className="mt-2">
                          <div className="text-sm font-medium text-gray-700">Prevention:</div>
                          <ul className="text-sm text-gray-600 list-disc list-inside">
                            {issue.preventionSteps.map((step, idx) => (
                              <li key={idx}>{step}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Data Source Catalog */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            📂 Data Source Catalog
          </h2>
          
          {/* Adveronix */}
          <div className="mb-6">
            <h3 className="font-semibold text-gray-900 mb-2">Adveronix Sheet</h3>
            <div className="text-sm text-gray-600 mb-2">
              Sheet ID: {DATA_SOURCE_CATALOG.adveronix.sheetId}
            </div>
            <div className="text-sm text-gray-600 mb-3">
              Update Schedule: {DATA_SOURCE_CATALOG.adveronix.updateSchedule}
            </div>
            <div className="grid grid-cols-2 gap-2">
              {DATA_SOURCE_CATALOG.adveronix.tabs.map(tab => (
                <div key={tab} className="text-sm text-gray-700 bg-gray-50 px-3 py-2 rounded">
                  {tab}
                </div>
              ))}
            </div>
          </div>
          
          {/* APIs */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">API Endpoints</h3>
            <div className="space-y-2">
              {DATA_SOURCE_CATALOG.apis.map(api => (
                <div key={api.endpoint} className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded">
                  <code className="text-sm font-mono text-gray-900">{api.endpoint}</code>
                  <span className="text-sm text-gray-600">{api.description}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        {/* Auto-refresh notice */}
        <div className="mt-6 text-center text-sm text-gray-500">
          <p>Page auto-refreshes every 60 seconds</p>
          <p className="mt-1">
            <a href="/health/enhanced" className="text-blue-600 hover:text-blue-800">
              Click here to refresh now
            </a>
          </p>
        </div>
      </div>

      {/* Auto-refresh script */}
      <script
        dangerouslySetInnerHTML={{
          __html: `setTimeout(() => window.location.reload(), 60000);`
        }}
      />
    </div>
  );
}
