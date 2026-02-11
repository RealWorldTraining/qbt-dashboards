'use client';

import { useEffect, useState } from 'react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts';

interface KeywordData {
  'Week (Monday)': string;
  'Search keyword': string;
  'Campaign Name': string;
  'Search keyword match type': string;
  'Keyword max CPC': string;
  'Clicks': string;
  'Impressions': string;
  'CTR': string;
  'Avg. CPC': string;
  'Cost (Spend)': string;
  'Conversions': string;
  'Cost / conv.': string;
  'Conv. rate': string;
  'Search Impr. share': string;
  'Search Lost IS (rank)': string;
}

export default function VisionDashboard() {
  const [keywordData, setKeywordData] = useState<KeywordData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchKeywordData();
  }, []);

  const fetchKeywordData = async () => {
    try {
      const response = await fetch('/api/vision-keywords');
      const result = await response.json();
      
      // Calculate most recent complete week and the week before
      // Week starts Monday, so find the most recent Monday that's in the past
      const now = new Date();
      const dayOfWeek = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
      const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Days since last Monday
      
      // Most recent complete week: Monday of last week to Sunday
      const lastMonday = new Date(now);
      lastMonday.setDate(now.getDate() - daysToMonday - 7); // Go back to last Monday
      lastMonday.setHours(0, 0, 0, 0);
      
      const lastSunday = new Date(lastMonday);
      lastSunday.setDate(lastMonday.getDate() + 6); // Sunday of that week
      lastSunday.setHours(23, 59, 59, 999);
      
      // Week before: Monday of 2 weeks ago to Sunday
      const twoWeeksAgoMonday = new Date(lastMonday);
      twoWeeksAgoMonday.setDate(lastMonday.getDate() - 7);
      
      const twoWeeksAgoSunday = new Date(twoWeeksAgoMonday);
      twoWeeksAgoSunday.setDate(twoWeeksAgoMonday.getDate() + 6);
      
      const filtered = (result.data || []).filter((row: KeywordData) => {
        const weekDate = new Date(row['Week (Monday)']);
        const clicks = parseInt(row['Clicks']) || 0;
        const conversions = parseFloat(row['Conversions']) || 0;
        
        // Keep only data from the two complete weeks with some activity
        const isInPriorWeek = weekDate >= lastMonday && weekDate <= lastSunday;
        const isInTwoWeeksAgo = weekDate >= twoWeeksAgoMonday && weekDate <= twoWeeksAgoSunday;
        
        return (isInPriorWeek || isInTwoWeeksAgo) && (clicks > 0 || conversions > 0);
      });
      
      setKeywordData(filtered);
    } catch (error) {
      console.error('Error fetching keyword data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Helper to parse currency strings
  const parseCurrency = (val: string) => {
    if (!val) return 0;
    return parseFloat(val.replace(/[$,]/g, '')) || 0;
  };

  // Helper to parse percentage strings
  const parsePercent = (val: string) => {
    if (!val) return 0;
    return parseFloat(val.replace(/%/g, '')) || 0;
  };

  // Helper to shorten campaign names for better display
  const shortenCampaignName = (name: string) => {
    // Remove "Campaign" redundancy and shorten common patterns
    return name
      .replace(/Campaign/gi, '')
      .replace(/Training - /gi, '')
      .replace(/Classes - /gi, '')
      .replace(/Courses - /gi, '')
      .replace(/Certification - /gi, '')
      .trim();
  };

  // Get date range for display
  const getDateRange = () => {
    if (keywordData.length === 0) return '';
    const weeks = [...new Set(keywordData.map(r => r['Week (Monday)']))].sort();
    if (weeks.length === 0) return '';
    
    // Should have exactly 2 weeks: prior week and 2 weeks ago
    if (weeks.length >= 2) {
      const week1 = new Date(weeks[0]);
      const week1End = new Date(week1);
      week1End.setDate(week1.getDate() + 6);
      
      const week2 = new Date(weeks[1]);
      const week2End = new Date(week2);
      week2End.setDate(week2.getDate() + 6);
      
      const opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
      return `Prior week: ${week2.toLocaleDateString('en-US', opts)} - ${week2End.toLocaleDateString('en-US', opts)} vs 2 weeks ago: ${week1.toLocaleDateString('en-US', opts)} - ${week1End.toLocaleDateString('en-US', opts)}`;
    }
    
    const first = new Date(weeks[0]);
    const last = new Date(weeks[weeks.length - 1]);
    return `${first.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} - ${last.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
  };

  // Section 1: Bid vs Actual CPC Efficiency
  const getBidEfficiencyData = () => {
    const latestWeek = keywordData.reduce((latest, row) => {
      return row['Week (Monday)'] > latest ? row['Week (Monday)'] : latest;
    }, '');

    const latestData = keywordData.filter(row => row['Week (Monday)'] === latestWeek);

    return latestData
      .map(row => {
        const maxCPC = parseCurrency(row['Keyword max CPC']);
        const avgCPC = parseCurrency(row['Avg. CPC']);
        const spread = maxCPC - avgCPC;
        const utilization = maxCPC > 0 ? (avgCPC / maxCPC) * 100 : 0;
        const isConstrained = utilization > 90;

        return {
          keyword: row['Search keyword'],
          campaign: shortenCampaignName(row['Campaign Name']),
          maxCPC,
          avgCPC,
          spread,
          utilization,
          isConstrained,
        };
      })
      .filter(row => row.maxCPC > 0)
      .sort((a, b) => b.utilization - a.utilization)
      .slice(0, 20); // Top 20 for visualization
  };

  // Section 2: Campaign/Device Performance
  const getCampaignDeviceData = () => {
    const grouped: any = {};

    keywordData.forEach(row => {
      const campaign = row['Campaign Name'];
      const shortName = shortenCampaignName(campaign);
      // Extract device from campaign name (assuming format like "Training - Desktop")
      const device = campaign.includes('Desktop') ? 'Desktop' :
                     campaign.includes('Mobile') ? 'Mobile' : 'Unknown';
      const key = `${shortName} - ${device}`;

      if (!grouped[key]) {
        grouped[key] = {
          campaign: shortName,
          device,
          spend: 0,
          clicks: 0,
          conversions: 0,
          impressions: 0,
        };
      }

      grouped[key].spend += parseCurrency(row['Cost (Spend)']);
      grouped[key].clicks += parseInt(row['Clicks']) || 0;
      grouped[key].conversions += parseFloat(row['Conversions']) || 0;
      grouped[key].impressions += parseInt(row['Impressions']) || 0;
    });

    return Object.values(grouped)
      .map((g: any) => ({
        ...g,
        cpa: g.conversions > 0 ? g.spend / g.conversions : 0,
        ctr: g.impressions > 0 ? (g.clicks / g.impressions) * 100 : 0,
      }))
      .filter((g: any) => g.clicks > 0 || g.conversions > 0) // Filter out zero-activity campaigns
      .sort((a: any, b: any) => b.spend - a.spend); // Sort by spend descending
  };

  // Section 3: Keyword-Level CPA Trends
  const getKeywordCPATrends = () => {
    const keywordTrends: any = {};

    keywordData.forEach(row => {
      const keyword = row['Search keyword'];
      const week = row['Week (Monday)'];
      const cpa = parseCurrency(row['Cost / conv.']);
      const conversions = parseFloat(row['Conversions']) || 0;

      if (conversions === 0) return; // Skip keywords with no conversions

      if (!keywordTrends[keyword]) {
        keywordTrends[keyword] = [];
      }

      keywordTrends[keyword].push({ week, cpa });
    });

    // Calculate trend direction for each keyword
    const trendsWithDirection = Object.entries(keywordTrends)
      .map(([keyword, trends]: [string, any]) => {
        const sorted = trends.sort((a: any, b: any) => a.week.localeCompare(b.week));
        const firstCPA = sorted[0].cpa;
        const lastCPA = sorted[sorted.length - 1].cpa;
        const change = lastCPA - firstCPA;
        const direction = change < 0 ? 'improving' : change > 0 ? 'deteriorating' : 'stable';

        return {
          keyword,
          trends: sorted,
          firstCPA,
          lastCPA,
          change,
          changePercent: firstCPA > 0 ? (change / firstCPA) * 100 : 0,
          direction,
        };
      })
      .filter(k => k.trends.length >= 2) // At least 2 weeks of data
      .sort((a, b) => Math.abs(b.changePercent) - Math.abs(a.changePercent))
      .slice(0, 15); // Top 15 for visualization

    return trendsWithDirection;
  };

  // Section 4: Bid Adjustment Recommendations
  const getBidRecommendations = () => {
    const latestWeek = keywordData.reduce((latest, row) => {
      return row['Week (Monday)'] > latest ? row['Week (Monday)'] : latest;
    }, '');

    const latestData = keywordData.filter(row => row['Week (Monday)'] === latestWeek);

    const recommendations = latestData.map(row => {
      const maxCPC = parseCurrency(row['Keyword max CPC']);
      const avgCPC = parseCurrency(row['Avg. CPC']);
      const convRate = parsePercent(row['Conv. rate']);
      const conversions = parseFloat(row['Conversions']) || 0;
      const spend = parseCurrency(row['Cost (Spend)']);
      const cpa = parseCurrency(row['Cost / conv.']);
      const lostIS = parsePercent(row['Search Lost IS (rank)']);
      const utilization = maxCPC > 0 ? (avgCPC / maxCPC) * 100 : 0;

      let action = 'none';
      let reason = '';

      // Raise bid: High conv rate + near max CPC + losing impression share
      if (convRate > 3 && utilization > 85 && lostIS > 10) {
        action = 'raise';
        reason = `High conv rate (${convRate.toFixed(1)}%), bid-constrained (${utilization.toFixed(0)}% util), losing ${lostIS.toFixed(0)}% IS`;
      }
      // Lower bid: Low/zero conversions + high spend
      else if (conversions === 0 && spend > 50) {
        action = 'lower';
        reason = `No conversions, $${spend.toFixed(2)} spent`;
      }
      else if (conversions < 1 && spend > 100) {
        action = 'lower';
        reason = `Low conversions (${conversions.toFixed(1)}), high spend ($${spend.toFixed(2)})`;
      }
      // Watch: High CPA but decent volume
      else if (cpa > 180 && conversions >= 5) {
        action = 'watch';
        reason = `High CPA ($${cpa.toFixed(2)}), but ${conversions.toFixed(0)} conversions`;
      }

      return {
        keyword: row['Search keyword'],
        campaign: shortenCampaignName(row['Campaign Name']),
        action,
        reason,
        maxCPC,
        avgCPC,
        spend,
        conversions,
        cpa,
        convRate,
        lostIS,
      };
    }).filter(r => r.action !== 'none');

    return {
      raise: recommendations.filter(r => r.action === 'raise'),
      lower: recommendations.filter(r => r.action === 'lower'),
      watch: recommendations.filter(r => r.action === 'watch'),
    };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl text-gray-600">Loading Vision Dashboard...</div>
      </div>
    );
  }

  const bidEfficiency = getBidEfficiencyData();
  const campaignDevice = getCampaignDeviceData();
  const cpaTrends = getKeywordCPATrends();
  const recommendations = getBidRecommendations();
  const dateRange = getDateRange();

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-[1920px] mx-auto">
        <h1 className="text-4xl font-bold mb-2">Vision Analytics Dashboard</h1>
        <p className="text-gray-600 mb-2">Keyword-level insights and bid optimization</p>
        {dateRange && (
          <p className="text-sm text-gray-500 mb-6">📅 {dateRange} (Complete weeks, active campaigns only)</p>
        )}

        {/* Section 1: Bid vs Actual CPC Efficiency */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-2xl font-bold mb-4">1. Bid vs Actual CPC Efficiency</h2>
          <p className="text-sm text-gray-600 mb-4">
            Top 20 keywords by bid utilization. Red = bid-constrained (&gt;90% utilization)
          </p>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={bidEfficiency}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="keyword" angle={-45} textAnchor="end" height={150} fontSize={11} />
              <YAxis label={{ value: 'CPC ($)', angle: -90, position: 'insideLeft' }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="maxCPC" fill="#94a3b8" name="Max CPC" />
              <Bar dataKey="avgCPC" name="Avg CPC">
                {bidEfficiency.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.isConstrained ? '#ef4444' : '#3b82f6'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>

          <div className="mt-4">
            <h3 className="font-semibold mb-2">Bid-Constrained Keywords ({bidEfficiency.filter(k => k.isConstrained).length})</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-4 py-2 text-left">Keyword</th>
                    <th className="px-4 py-2 text-left">Campaign</th>
                    <th className="px-4 py-2 text-right">Max CPC</th>
                    <th className="px-4 py-2 text-right">Avg CPC</th>
                    <th className="px-4 py-2 text-right">Utilization</th>
                    <th className="px-4 py-2 text-right">Headroom</th>
                  </tr>
                </thead>
                <tbody>
                  {bidEfficiency.filter(k => k.isConstrained).map((row, i) => (
                    <tr key={i} className="border-t">
                      <td className="px-4 py-2">{row.keyword}</td>
                      <td className="px-4 py-2 text-gray-600">{row.campaign}</td>
                      <td className="px-4 py-2 text-right">${row.maxCPC.toFixed(2)}</td>
                      <td className="px-4 py-2 text-right">${row.avgCPC.toFixed(2)}</td>
                      <td className="px-4 py-2 text-right text-red-600 font-semibold">{row.utilization.toFixed(0)}%</td>
                      <td className="px-4 py-2 text-right">${row.spread.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Section 2: Campaign/Device Performance */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-2xl font-bold mb-4">2. Campaign/Device Performance</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold mb-2">Spend by Campaign & Device</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={campaignDevice}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="campaign" angle={-45} textAnchor="end" height={80} fontSize={11} />
                  <YAxis />
                  <Tooltip formatter={(value: any) => `$${value.toFixed(2)}`} />
                  <Legend />
                  <Bar dataKey="spend" fill="#3b82f6" name="Spend" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div>
              <h3 className="font-semibold mb-2">CPA by Campaign & Device</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={campaignDevice}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="campaign" angle={-45} textAnchor="end" height={80} fontSize={11} />
                  <YAxis />
                  <Tooltip formatter={(value: any) => `$${value.toFixed(2)}`} />
                  <Legend />
                  <Bar dataKey="cpa" name="CPA">
                    {campaignDevice.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.cpa > 180 ? '#ef4444' : '#10b981'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-2 text-left">Campaign</th>
                  <th className="px-4 py-2 text-left">Device</th>
                  <th className="px-4 py-2 text-right">Spend</th>
                  <th className="px-4 py-2 text-right">Clicks</th>
                  <th className="px-4 py-2 text-right">Conversions</th>
                  <th className="px-4 py-2 text-right">CPA</th>
                  <th className="px-4 py-2 text-right">CTR</th>
                </tr>
              </thead>
              <tbody>
                {campaignDevice.map((row, i) => (
                  <tr key={i} className="border-t">
                    <td className="px-4 py-2">{row.campaign}</td>
                    <td className="px-4 py-2 text-gray-600">{row.device}</td>
                    <td className="px-4 py-2 text-right">${row.spend.toFixed(2)}</td>
                    <td className="px-4 py-2 text-right">{row.clicks}</td>
                    <td className="px-4 py-2 text-right">{row.conversions.toFixed(1)}</td>
                    <td className={`px-4 py-2 text-right font-semibold ${row.cpa > 180 ? 'text-red-600' : 'text-green-600'}`}>
                      ${row.cpa.toFixed(2)}
                    </td>
                    <td className="px-4 py-2 text-right">{row.ctr.toFixed(2)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Section 3: Keyword-Level CPA Trends */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-2xl font-bold mb-4">3. Keyword-Level CPA Trends</h2>
          <p className="text-sm text-gray-600 mb-4">
            Top 15 keywords by CPA change. Green = improving, Red = deteriorating
          </p>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-2 text-left">Keyword</th>
                  <th className="px-4 py-2 text-right">First CPA</th>
                  <th className="px-4 py-2 text-right">Latest CPA</th>
                  <th className="px-4 py-2 text-right">Change</th>
                  <th className="px-4 py-2 text-right">% Change</th>
                  <th className="px-4 py-2 text-center">Trend</th>
                </tr>
              </thead>
              <tbody>
                {cpaTrends.map((row, i) => (
                  <tr key={i} className="border-t">
                    <td className="px-4 py-2">{row.keyword}</td>
                    <td className="px-4 py-2 text-right">${row.firstCPA.toFixed(2)}</td>
                    <td className="px-4 py-2 text-right">${row.lastCPA.toFixed(2)}</td>
                    <td className={`px-4 py-2 text-right font-semibold ${row.change < 0 ? 'text-green-600' : 'text-red-600'}`}>
                      ${row.change.toFixed(2)}
                    </td>
                    <td className={`px-4 py-2 text-right font-semibold ${row.change < 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {row.changePercent.toFixed(1)}%
                    </td>
                    <td className="px-4 py-2 text-center">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${
                        row.direction === 'improving' ? 'bg-green-100 text-green-800' :
                        row.direction === 'deteriorating' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {row.direction}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Section 4: Bid Adjustment Recommendations */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-2xl font-bold mb-4">4. Bid Adjustment Recommendations</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="bg-green-50 border border-green-200 rounded p-4">
              <h3 className="font-semibold text-green-800 mb-2">🟢 Raise Bid ({recommendations.raise.length})</h3>
              <p className="text-xs text-green-700">High conversion rate, bid-constrained, losing impression share</p>
            </div>
            <div className="bg-red-50 border border-red-200 rounded p-4">
              <h3 className="font-semibold text-red-800 mb-2">🔴 Lower Bid ({recommendations.lower.length})</h3>
              <p className="text-xs text-red-700">Low/no conversions, high spend</p>
            </div>
            <div className="bg-yellow-50 border border-yellow-200 rounded p-4">
              <h3 className="font-semibold text-yellow-800 mb-2">🟡 Watch ({recommendations.watch.length})</h3>
              <p className="text-xs text-yellow-700">High CPA but decent volume</p>
            </div>
          </div>

          {/* Raise Bid Table */}
          {recommendations.raise.length > 0 && (
            <div className="mb-6">
              <h3 className="font-semibold text-green-800 mb-2">🟢 Raise Bid Recommendations</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-green-100">
                    <tr>
                      <th className="px-4 py-2 text-left">Keyword</th>
                      <th className="px-4 py-2 text-left">Campaign</th>
                      <th className="px-4 py-2 text-right">Conv Rate</th>
                      <th className="px-4 py-2 text-right">Max CPC</th>
                      <th className="px-4 py-2 text-right">Avg CPC</th>
                      <th className="px-4 py-2 text-right">Lost IS</th>
                      <th className="px-4 py-2 text-left">Reason</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recommendations.raise.map((row, i) => (
                      <tr key={i} className="border-t">
                        <td className="px-4 py-2 font-semibold">{row.keyword}</td>
                        <td className="px-4 py-2 text-gray-600 text-xs">{row.campaign}</td>
                        <td className="px-4 py-2 text-right">{row.convRate.toFixed(1)}%</td>
                        <td className="px-4 py-2 text-right">${row.maxCPC.toFixed(2)}</td>
                        <td className="px-4 py-2 text-right">${row.avgCPC.toFixed(2)}</td>
                        <td className="px-4 py-2 text-right">{row.lostIS.toFixed(0)}%</td>
                        <td className="px-4 py-2 text-xs text-gray-700">{row.reason}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Lower Bid Table */}
          {recommendations.lower.length > 0 && (
            <div className="mb-6">
              <h3 className="font-semibold text-red-800 mb-2">🔴 Lower Bid Recommendations</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-red-100">
                    <tr>
                      <th className="px-4 py-2 text-left">Keyword</th>
                      <th className="px-4 py-2 text-left">Campaign</th>
                      <th className="px-4 py-2 text-right">Spend</th>
                      <th className="px-4 py-2 text-right">Conversions</th>
                      <th className="px-4 py-2 text-right">Max CPC</th>
                      <th className="px-4 py-2 text-left">Reason</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recommendations.lower.map((row, i) => (
                      <tr key={i} className="border-t">
                        <td className="px-4 py-2 font-semibold">{row.keyword}</td>
                        <td className="px-4 py-2 text-gray-600 text-xs">{row.campaign}</td>
                        <td className="px-4 py-2 text-right">${row.spend.toFixed(2)}</td>
                        <td className="px-4 py-2 text-right">{row.conversions.toFixed(1)}</td>
                        <td className="px-4 py-2 text-right">${row.maxCPC.toFixed(2)}</td>
                        <td className="px-4 py-2 text-xs text-gray-700">{row.reason}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Watch Table */}
          {recommendations.watch.length > 0 && (
            <div>
              <h3 className="font-semibold text-yellow-800 mb-2">🟡 Watch List</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-yellow-100">
                    <tr>
                      <th className="px-4 py-2 text-left">Keyword</th>
                      <th className="px-4 py-2 text-left">Campaign</th>
                      <th className="px-4 py-2 text-right">CPA</th>
                      <th className="px-4 py-2 text-right">Conversions</th>
                      <th className="px-4 py-2 text-right">Spend</th>
                      <th className="px-4 py-2 text-left">Reason</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recommendations.watch.map((row, i) => (
                      <tr key={i} className="border-t">
                        <td className="px-4 py-2 font-semibold">{row.keyword}</td>
                        <td className="px-4 py-2 text-gray-600 text-xs">{row.campaign}</td>
                        <td className="px-4 py-2 text-right">${row.cpa.toFixed(2)}</td>
                        <td className="px-4 py-2 text-right">{row.conversions.toFixed(0)}</td>
                        <td className="px-4 py-2 text-right">${row.spend.toFixed(2)}</td>
                        <td className="px-4 py-2 text-xs text-gray-700">{row.reason}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
