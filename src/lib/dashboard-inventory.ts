/**
 * Dashboard Inventory
 * 
 * Complete list of all charts, reports, and their data sources.
 * Used by health monitoring to track validation status.
 */

export interface DataSource {
  type: 'adveronix' | 'api' | 'ga4' | 'gsc';
  name: string;
  tab?: string; // For Adveronix sheets
  endpoint?: string; // For APIs
  updateFrequency: string;
}

export interface Chart {
  id: string;
  name: string;
  route: string;
  category: 'paid-ads' | 'organic' | 'sales' | 'content' | 'ai-tools';
  dataSources: DataSource[];
  criticalMetrics: string[];
  validations: {
    check: string;
    expectedRange?: string;
  }[];
}

export const DASHBOARD_INVENTORY: Chart[] = [
  // ===== PAID ADVERTISING =====
  {
    id: 'combined-weekly',
    name: 'Combined Weekly Ads',
    route: '/ads',
    category: 'paid-ads',
    dataSources: [
      {
        type: 'api',
        name: 'Combined Weekly API',
        endpoint: '/api/combined-weekly',
        updateFrequency: 'Real-time'
      },
      {
        type: 'adveronix',
        name: 'Google Ads Account Weekly',
        tab: 'GADS: Account: Weekly (Devices)',
        updateFrequency: 'Daily at 4:00 AM CST'
      },
      {
        type: 'adveronix',
        name: 'Google Ads Campaign Weekly',
        tab: 'GADS: Campaign: Weekly (Devices)',
        updateFrequency: 'Daily at 4:00 AM CST'
      },
      {
        type: 'adveronix',
        name: 'Bing Account Summary',
        tab: 'BING: Account Summary Weekly',
        updateFrequency: 'Daily at 4:00 AM CST'
      },
      {
        type: 'adveronix',
        name: 'Bing Campaign Weekly',
        tab: 'Bing: Campaign Weekly',
        updateFrequency: 'Daily at 4:00 AM CST'
      }
    ],
    criticalMetrics: ['impressions', 'clicks', 'cost', 'conversions', 'CPA', 'ROAS'],
    validations: [
      { check: 'Google Ads impressions', expectedRange: '15,000-25,000/week' },
      { check: 'Bing Ads impressions', expectedRange: '3,000-10,000/week' },
      { check: 'Google Ads 70-85% of total spend' },
      { check: 'Weekly deduplication working' }
    ]
  },
  {
    id: 'google-ads-summary',
    name: 'Google Ads Summary',
    route: '/google-ads-summary',
    category: 'paid-ads',
    dataSources: [
      {
        type: 'adveronix',
        name: 'Google Ads Account Weekly',
        tab: 'GADS: Account: Weekly (Devices)',
        updateFrequency: 'Daily at 4:00 AM CST'
      },
      {
        type: 'adveronix',
        name: 'Google Ads Campaign Weekly',
        tab: 'GADS: Campaign: Weekly (Devices)',
        updateFrequency: 'Daily at 4:00 AM CST'
      }
    ],
    criticalMetrics: ['impressions', 'clicks', 'cost', 'conversions', 'CTR', 'CPA'],
    validations: [
      { check: 'Impressions in range', expectedRange: '15,000-25,000/week' },
      { check: 'CTR reasonable', expectedRange: '2-10%' },
      { check: 'Cost in range', expectedRange: '$1,000-$5,000/week' },
      { check: 'Device breakdown present' }
    ]
  },
  {
    id: 'bing-ads-summary',
    name: 'Bing Ads Summary',
    route: '/bing-ads-summary',
    category: 'paid-ads',
    dataSources: [
      {
        type: 'adveronix',
        name: 'Bing Account Summary',
        tab: 'BING: Account Summary Weekly',
        updateFrequency: 'Daily at 4:00 AM CST'
      },
      {
        type: 'adveronix',
        name: 'Bing Campaign Weekly',
        tab: 'Bing: Campaign Weekly',
        updateFrequency: 'Daily at 4:00 AM CST'
      }
    ],
    criticalMetrics: ['impressions', 'clicks', 'cost', 'conversions', 'CPA'],
    validations: [
      { check: 'Impressions in range', expectedRange: '3,000-10,000/week' },
      { check: 'Cost in range', expectedRange: '$200-$2,000/week' }
    ]
  },
  
  // ===== ORGANIC GROWTH =====
  {
    id: 'ga4-traffic',
    name: 'GA4 Traffic Overview',
    route: '/ga4-traffic',
    category: 'organic',
    dataSources: [
      {
        type: 'adveronix',
        name: 'GA4 Traffic by Source',
        tab: 'GA4: Traffic Weekly Session Source',
        updateFrequency: 'Daily at 4:00 AM CST'
      },
      {
        type: 'adveronix',
        name: 'GA4 Traffic by Channel',
        tab: 'GA4: Traffic Weekly Channel',
        updateFrequency: 'Daily at 4:00 AM CST'
      }
    ],
    criticalMetrics: ['sessions', 'users', 'pageviews', 'bounce_rate'],
    validations: [
      { check: 'Sessions correlate with ad clicks', expectedRange: '60-250% of ad clicks' },
      { check: 'Organic traffic present' }
    ]
  },
  {
    id: 'gsc-rankings',
    name: 'Search Console Rankings',
    route: '/gsc-rankings',
    category: 'organic',
    dataSources: [
      {
        type: 'adveronix',
        name: 'GSC Account Daily',
        tab: 'GSC: Account Daily',
        updateFrequency: 'Daily at 4:00 AM CST'
      },
      {
        type: 'adveronix',
        name: 'GSC Query Daily',
        tab: 'GSC: Query Daily',
        updateFrequency: 'Daily at 4:00 AM CST'
      }
    ],
    criticalMetrics: ['impressions', 'clicks', 'ctr', 'position'],
    validations: [
      { check: 'Top 20 queries tracked' },
      { check: 'Position changes logged' }
    ]
  },
  
  // ===== SALES & REVENUE =====
  {
    id: 'revenue-overview',
    name: 'Revenue Overview',
    route: '/revenue',
    category: 'sales',
    dataSources: [
      {
        type: 'api',
        name: 'Revenue API',
        endpoint: '/api/revenue',
        updateFrequency: 'Real-time'
      }
    ],
    criticalMetrics: ['revenue', 'transactions', 'avg_order_value'],
    validations: [
      { check: 'Revenue data present' },
      { check: 'Matches GA4 transaction data' }
    ]
  },
  
  // ===== CONTENT =====
  {
    id: 'content-performance',
    name: 'Content Performance',
    route: '/content',
    category: 'content',
    dataSources: [
      {
        type: 'ga4',
        name: 'GA4 Landing Pages',
        tab: 'GA4: Landing Pages',
        updateFrequency: 'Daily at 4:00 AM CST'
      }
    ],
    criticalMetrics: ['pageviews', 'avg_time', 'bounce_rate'],
    validations: [
      { check: 'Top pages tracked' }
    ]
  },
  
  // ===== AI TOOLS =====
  {
    id: 'vision-analysis',
    name: 'Vision Analysis Dashboard',
    route: '/vision',
    category: 'ai-tools',
    dataSources: [
      {
        type: 'api',
        name: 'Vision API',
        endpoint: '/api/vision',
        updateFrequency: 'On-demand'
      }
    ],
    criticalMetrics: ['analysis_count', 'insights_generated'],
    validations: [
      { check: 'API responding' }
    ]
  }
];

export const DATA_SOURCE_CATALOG = {
  adveronix: {
    name: 'Adveronix Sheet',
    sheetId: '1T8PZjlf2vBz7YTlz1GCXe68UczWGL8_ERYuBLd_r6H0',
    updateSchedule: 'Daily at 4:00 AM CST',
    tabs: [
      'GADS: Account: Weekly (Devices)',
      'GADS: Campaign: Weekly (Devices)',
      'GADS: Search Keyword: Weekly with analytics',
      'BING: Account Summary Weekly',
      'Bing: Campaign Weekly',
      'GSC: Account Daily',
      'GSC: Query Daily',
      'GA4: Traffic Weekly Session Source',
      'GA4: Traffic Weekly Channel',
      'GA4: Landing Pages'
    ]
  },
  apis: [
    { endpoint: '/api/combined-weekly', description: 'Combined Google + Bing weekly data' },
    { endpoint: '/api/google-ads-summary', description: 'Google Ads weekly summary' },
    { endpoint: '/api/bing-ads-summary', description: 'Bing Ads weekly summary' },
    { endpoint: '/api/ga4-traffic', description: 'GA4 traffic overview' },
    { endpoint: '/api/revenue', description: 'Revenue and transactions' },
    { endpoint: '/api/vision', description: 'Vision AI analysis' }
  ]
};

export function getChartsByCategory(category: string) {
  return DASHBOARD_INVENTORY.filter(chart => chart.category === category);
}

export function getChartById(id: string) {
  return DASHBOARD_INVENTORY.find(chart => chart.id === id);
}

export function getAllDataSources() {
  const sources = new Set<string>();
  DASHBOARD_INVENTORY.forEach(chart => {
    chart.dataSources.forEach(source => {
      if (source.type === 'adveronix' && source.tab) {
        sources.add(source.tab);
      } else if (source.endpoint) {
        sources.add(source.endpoint);
      }
    });
  });
  return Array.from(sources);
}
