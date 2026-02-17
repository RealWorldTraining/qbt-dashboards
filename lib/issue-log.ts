/**
 * Issue Log
 * 
 * Tracks data quality issues, resolutions, and actions taken.
 * Stored in JSON file for persistence.
 */

export interface Issue {
  id: string;
  timestamp: string;
  chartId: string;
  chartName: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  status: 'open' | 'investigating' | 'resolved' | 'monitoring';
  issue: string;
  expectedValue: string;
  actualValue: string;
  dataSource: string;
  detectedBy: 'automated' | 'manual' | 'user-report';
  assignedTo?: string[];
  resolution?: {
    timestamp: string;
    action: string;
    performedBy: string;
    notes: string;
  };
  rootCause?: string;
  preventionSteps?: string[];
}

// Example issues for reference
export const ISSUE_LOG: Issue[] = [
  {
    id: 'issue-001',
    timestamp: '2026-02-17T06:15:00Z',
    chartId: 'google-ads-summary',
    chartName: 'Google Ads Summary',
    severity: 'critical',
    status: 'resolved',
    issue: 'Google Ads impressions showing 1,560 instead of expected 17,000+',
    expectedValue: '15,000-25,000 impressions/week',
    actualValue: '1,560 impressions',
    dataSource: 'GADS: Account: Weekly (Devices)',
    detectedBy: 'manual',
    assignedTo: ['Professor'],
    resolution: {
      timestamp: '2026-02-17T13:30:00Z',
      action: 'Fixed deduplication logic in /api/combined-weekly/route.ts',
      performedBy: 'Professor',
      notes: 'Bug was in summing logic - assumed weekly rolling windows but sheet has daily rows (one per device per day). Fixed to properly sum all daily rows across devices within each week bucket. Impressions now correctly show ~18k/week.'
    },
    rootCause: 'Deduplication logic assumed weekly rolling windows in Adveronix sheet, but sheet actually contains daily rows (one row per day per device). When 7 days fell in same week, it only kept one day\'s data instead of summing all 7.',
    preventionSteps: [
      'Added automated validation test checking impressions > 10,000',
      'Added deduplication validation test',
      'Daily monitoring at 12:30 AM CST will catch this if it reoccurs'
    ]
  },
  {
    id: 'issue-002',
    timestamp: '2026-02-17T14:30:00Z',
    chartId: 'google-ads-summary',
    chartName: 'Google Ads Summary',
    severity: 'high',
    status: 'open',
    issue: 'API endpoint /api/google-ads-summary returning 404',
    expectedValue: '200 OK with data',
    actualValue: '404 Not Found',
    dataSource: 'API endpoint',
    detectedBy: 'automated',
    assignedTo: ['Professor', 'Vision'],
    rootCause: 'Endpoint not yet created - monitoring system built before endpoint',
    preventionSteps: [
      'Create /api/google-ads-summary endpoint',
      'Add to deployment checklist'
    ]
  },
  {
    id: 'issue-003',
    timestamp: '2026-02-17T14:30:00Z',
    chartId: 'bing-ads-summary',
    chartName: 'Bing Ads Summary',
    severity: 'high',
    status: 'open',
    issue: 'API endpoint /api/bing-ads-summary returning 404',
    expectedValue: '200 OK with data',
    actualValue: '404 Not Found',
    dataSource: 'API endpoint',
    detectedBy: 'automated',
    assignedTo: ['Professor', 'Vision']
  },
  {
    id: 'issue-004',
    timestamp: '2026-02-17T14:30:00Z',
    chartId: 'ga4-traffic',
    chartName: 'GA4 Traffic Overview',
    severity: 'high',
    status: 'open',
    issue: 'API endpoint /api/ga4-traffic returning 404',
    expectedValue: '200 OK with data',
    actualValue: '404 Not Found',
    dataSource: 'API endpoint',
    detectedBy: 'automated',
    assignedTo: ['Professor', 'Vision']
  }
];

export function getOpenIssues() {
  return ISSUE_LOG.filter(issue => issue.status === 'open' || issue.status === 'investigating');
}

export function getResolvedIssues() {
  return ISSUE_LOG.filter(issue => issue.status === 'resolved');
}

export function getIssuesByChart(chartId: string) {
  return ISSUE_LOG.filter(issue => issue.chartId === chartId);
}

export function getIssuesBySeverity(severity: string) {
  return ISSUE_LOG.filter(issue => issue.severity === severity);
}

export function addIssue(issue: Omit<Issue, 'id' | 'timestamp'>) {
  const newIssue: Issue = {
    ...issue,
    id: `issue-${Date.now()}`,
    timestamp: new Date().toISOString()
  };
  ISSUE_LOG.push(newIssue);
  return newIssue;
}

export function resolveIssue(issueId: string, resolution: Issue['resolution']) {
  const issue = ISSUE_LOG.find(i => i.id === issueId);
  if (issue) {
    issue.status = 'resolved';
    issue.resolution = resolution;
  }
  return issue;
}
