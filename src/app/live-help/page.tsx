'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import Script from 'next/script';

interface TrainerData {
  name: string;
  sessions: number;
  avg: number;
  median: number;
  quick: number;
  long: number;
  quickPct: number;
}

interface ApiResponse {
  data: TrainerData[];
  summary: {
    totalSessions: number;
    avgDuration: number;
    trainerCount: number;
  };
  dateRange: {
    start: string;
    end: string;
    preset: string;
  };
  error?: string;
}

// Static data for charts (these don't change with date filters for now)
const monthlyData = {
  labels: ["Feb 24", "Mar 24", "Apr 24", "May 24", "Jun 24", "Jul 24", "Aug 24", "Sep 24", "Oct 24", "Nov 24", "Dec 24", "Jan 25", "Feb 25", "Mar 25", "Apr 25", "May 25", "Jun 25", "Jul 25", "Aug 25", "Sep 25", "Oct 25", "Nov 25", "Dec 25", "Jan 26"],
  values: [2852, 2519, 2223, 2246, 2014, 2331, 2375, 2162, 2088, 2019, 2187, 3253, 2603, 2547, 2337, 2078, 2098, 2368, 2130, 2145, 1954, 1713, 2000, 2733]
};

const dowData = {
  labels: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
  values: [12388, 13644, 13444, 12842, 11254, 0, 0]
};

const roomData = {
  labels: ['Downhill', 'Orchard', 'Llamas'],
  values: [28254, 21564, 368]
};

const topicsData = {
  labels: ["Reconciliation", "Banking (Bank Feeds)", "Edit/Void Txns", "Bookkeeping", "Lists Org", "Open A/R", "Payroll Taxes/Liabilities", "Uncategorized", "Loans/Assets", "Open A/P", "QBPayments", "Lost & Found", "Undeposited Funds", "1099/Contractors", "Training Recommendations"],
  values: [6589, 3656, 2707, 2187, 2139, 1694, 1680, 1671, 1346, 1065, 1062, 1053, 1042, 1025, 1019]
};

const yearlyData = {
  labels: ["2023", "2024", "2025", "2026"],
  values: [5409, 28204, 27226, 2733]
};

// Static metrics (all-time)
const helpedSessions = 53804;
const noHelpRate = 15.4;
const busiestDay = "Tuesday";
const peakMonth = "Jan 2025";
const peakMonthCount = 3253;

type SortKey = 'name' | 'sessions' | 'avg' | 'median' | 'quick' | 'long' | 'quickPct';
type SortDir = 'asc' | 'desc';

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Chart: any;
  }
}

export default function LiveHelpDashboard() {
  const chartsInitialized = useRef(false);
  const [trainerData, setTrainerData] = useState<TrainerData[]>([]);
  const [sortKey, setSortKey] = useState<SortKey>('sessions');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [datePreset, setDatePreset] = useState('all-time');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState({ totalSessions: 63572, avgDuration: 8.4, trainerCount: 12 });
  const [dateRangeDisplay, setDateRangeDisplay] = useState('');

  const fetchData = useCallback(async (preset: string, start?: string, end?: string) => {
    setLoading(true);
    setError(null);
    
    try {
      let url = `/api/live-help?preset=${preset}`;
      if (preset === 'custom' && start && end) {
        url += `&start=${start}&end=${end}`;
      }
      
      const response = await fetch(url);
      const result: ApiResponse = await response.json();
      
      if (result.error) {
        throw new Error(result.error);
      }
      
      setTrainerData(result.data);
      setSummary(result.summary);
      
      // Format date range display
      const startDate = new Date(result.dateRange.start);
      const endDate = new Date(result.dateRange.end);
      setDateRangeDisplay(
        `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`
      );
    } catch (err) {
      console.error('Failed to fetch data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchData('all-time');
  }, [fetchData]);

  // Fetch when preset changes (except for custom - wait for Apply button)
  useEffect(() => {
    if (datePreset !== 'custom') {
      fetchData(datePreset);
    }
  }, [datePreset, fetchData]);

  const handleApplyCustomRange = () => {
    if (customStart && customEnd) {
      fetchData('custom', customStart, customEnd);
    }
  };

  useEffect(() => {
    if (chartsInitialized.current) return;
    if (typeof window !== 'undefined' && window.Chart) {
      initCharts();
      chartsInitialized.current = true;
    }
  }, []);

  // Sort data when sort key/direction changes
  const sortedData = [...trainerData].sort((a, b) => {
    const aVal = a[sortKey];
    const bVal = b[sortKey];
    if (typeof aVal === 'string' && typeof bVal === 'string') {
      return sortDir === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
    }
    return sortDir === 'asc' ? (aVal as number) - (bVal as number) : (bVal as number) - (aVal as number);
  });

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
  };

  const SortIcon = ({ columnKey }: { columnKey: SortKey }) => {
    if (sortKey !== columnKey) return <span className="ml-1 text-gray-600">↕</span>;
    return <span className="ml-1">{sortDir === 'asc' ? '↑' : '↓'}</span>;
  };

  const initCharts = () => {
    const Chart = window.Chart;
    Chart.defaults.color = '#888';
    Chart.defaults.borderColor = 'rgba(255,255,255,0.1)';

    const monthlyCtx = document.getElementById('monthlyChart') as HTMLCanvasElement;
    if (monthlyCtx) {
      new Chart(monthlyCtx, {
        type: 'line',
        data: { labels: monthlyData.labels, datasets: [{ label: 'Sessions', data: monthlyData.values, borderColor: '#00d9ff', backgroundColor: 'rgba(0,217,255,0.1)', fill: true, tension: 0.4 }] },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, grid: { color: 'rgba(255,255,255,0.05)' } }, x: { grid: { display: false } } } }
      });
    }

    const dowCtx = document.getElementById('dowChart') as HTMLCanvasElement;
    if (dowCtx) {
      new Chart(dowCtx, {
        type: 'bar',
        data: { labels: dowData.labels, datasets: [{ data: dowData.values, backgroundColor: dowData.values.map((_, i) => i === 1 ? '#00ff88' : '#00d9ff'), borderRadius: 8 }] },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, grid: { color: 'rgba(255,255,255,0.05)' } }, x: { grid: { display: false } } } }
      });
    }

    const roomCtx = document.getElementById('roomChart') as HTMLCanvasElement;
    if (roomCtx) {
      new Chart(roomCtx, {
        type: 'doughnut',
        data: { labels: roomData.labels, datasets: [{ data: roomData.values, backgroundColor: ['#00d9ff', '#00ff88', '#ffd700'], borderWidth: 0 }] },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { padding: 20 } } } }
      });
    }

    const trainerCtx = document.getElementById('trainerChart') as HTMLCanvasElement;
    if (trainerCtx) {
      new Chart(trainerCtx, {
        type: 'bar',
        data: { labels: trainerData.slice(0, 10).map(t => t.name), datasets: [{ data: trainerData.slice(0, 10).map(t => t.sessions), backgroundColor: '#00d9ff', borderRadius: 8 }] },
        options: { indexAxis: 'y', responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { beginAtZero: true, grid: { color: 'rgba(255,255,255,0.05)' } }, y: { grid: { display: false } } } }
      });
    }

    const topicsCtx = document.getElementById('topicsChart') as HTMLCanvasElement;
    if (topicsCtx) {
      new Chart(topicsCtx, {
        type: 'bar',
        data: { labels: topicsData.labels, datasets: [{ data: topicsData.values, backgroundColor: '#00ff88', borderRadius: 8 }] },
        options: { indexAxis: 'y', responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { beginAtZero: true, grid: { color: 'rgba(255,255,255,0.05)' } }, y: { grid: { display: false } } } }
      });
    }

    const yearlyCtx = document.getElementById('yearlyChart') as HTMLCanvasElement;
    if (yearlyCtx) {
      new Chart(yearlyCtx, {
        type: 'bar',
        data: { labels: yearlyData.labels, datasets: [{ data: yearlyData.values, backgroundColor: ['#ff6b6b', '#00d9ff', '#00ff88', '#ffd700'], borderRadius: 8 }] },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, grid: { color: 'rgba(255,255,255,0.05)' } }, x: { grid: { display: false } } } }
      });
    }
  };

  return (
    <>
      <Script src="https://cdn.jsdelivr.net/npm/chart.js" onLoad={() => initCharts()} />
      <div className="min-h-screen bg-gradient-to-br from-[#1a1a2e] to-[#16213e] text-white">
        <div className="max-w-[1600px] mx-auto p-5">
          <header className="text-center py-8 border-b border-white/10 mb-8">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-400 to-green-400 bg-clip-text text-transparent mb-2">
              📊 Live Help Dashboard
            </h1>
            <p className="text-gray-400 text-sm">
              QuickBooksTraining.com | Data: 2023-2026 | {summary.totalSessions.toLocaleString()} Total Sessions | Live Data
            </p>
          </header>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-5 mb-8">
            <MetricCard label="Total Sessions" value={summary.totalSessions.toLocaleString()} subtext="All attendees" />
            <MetricCard label="Helped Sessions" value={helpedSessions.toLocaleString()} subtext="With trainer" />
            <MetricCard label="No-Help Rate" value={`${noHelpRate}%`} subtext="Left without help" />
            <MetricCard label="Avg Duration" value={`${summary.avgDuration} min`} subtext="Per session" />
            <MetricCard label="Busiest Day" value={busiestDay} subtext="Highest volume" />
            <MetricCard label="Peak Month" value={peakMonth} subtext={`${peakMonthCount.toLocaleString()} sessions`} />
          </div>

          <div className="grid md:grid-cols-2 gap-5 mb-8">
            <ChartCard title="📈 Monthly Session Volume (Last 24 Months)"><canvas id="monthlyChart"></canvas></ChartCard>
            <ChartCard title="📆 Sessions by Day of Week"><canvas id="dowChart"></canvas></ChartCard>
            <ChartCard title="🏠 Sessions by Room"><canvas id="roomChart"></canvas></ChartCard>
            <ChartCard title="👥 Top Trainers by Volume"><canvas id="trainerChart"></canvas></ChartCard>
          </div>

          {/* Trainer Rankings Section */}
          <h2 className="text-2xl font-semibold mt-10 mb-5 pb-2 border-b-2 border-cyan-500/30">
            👥 Trainer Performance Rankings
          </h2>
          
          {/* Date Filter */}
          <div className="bg-white/5 rounded-2xl p-4 border border-white/10 mb-4">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-400">Time Period:</label>
                <select 
                  value={datePreset}
                  onChange={(e) => setDatePreset(e.target.value)}
                  className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-cyan-500"
                >
                  <option value="all-time">All Time</option>
                  <option value="this-week">This Week</option>
                  <option value="last-week">Last Week</option>
                  <option value="this-month">This Month</option>
                  <option value="last-month">Last Month</option>
                  <option value="this-quarter">This Quarter</option>
                  <option value="last-quarter">Last Quarter</option>
                  <option value="this-year">This Year</option>
                  <option value="last-year">Last Year</option>
                  <option value="custom">Custom Range</option>
                </select>
              </div>
              
              {datePreset === 'custom' && (
                <div className="flex items-center gap-2">
                  <input
                    type="date"
                    value={customStart}
                    onChange={(e) => setCustomStart(e.target.value)}
                    className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-cyan-500"
                  />
                  <span className="text-gray-400">to</span>
                  <input
                    type="date"
                    value={customEnd}
                    onChange={(e) => setCustomEnd(e.target.value)}
                    className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-cyan-500"
                  />
                  <button 
                    onClick={handleApplyCustomRange}
                    disabled={!customStart || !customEnd}
                    className="bg-cyan-500 hover:bg-cyan-600 disabled:bg-gray-600 disabled:cursor-not-allowed px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
                  >
                    Apply
                  </button>
                </div>
              )}
              
              <div className="ml-auto text-sm text-gray-400">
                {loading ? (
                  <span className="animate-pulse">Loading...</span>
                ) : error ? (
                  <span className="text-red-400">Error: {error}</span>
                ) : (
                  dateRangeDisplay || 'Showing all data'
                )}
              </div>
            </div>
          </div>

          {/* Trainer Table */}
          <div className="bg-white/5 rounded-2xl p-6 border border-white/10 overflow-x-auto">
            {loading ? (
              <div className="text-center py-8 text-gray-400">
                <div className="animate-spin inline-block w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full mb-4"></div>
                <p>Loading trainer data...</p>
              </div>
            ) : error ? (
              <div className="text-center py-8 text-red-400">
                <p>Failed to load data: {error}</p>
                <button 
                  onClick={() => fetchData(datePreset, customStart, customEnd)}
                  className="mt-4 bg-cyan-500 hover:bg-cyan-600 px-4 py-2 rounded-lg text-sm font-semibold"
                >
                  Retry
                </button>
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="text-left text-cyan-400 text-sm uppercase tracking-wider">
                    <th className="p-3 bg-cyan-500/10 rounded-l-lg">Rank</th>
                    <th className="p-3 bg-cyan-500/10 cursor-pointer hover:bg-cyan-500/20 transition-colors" onClick={() => handleSort('name')}>
                      Trainer <SortIcon columnKey="name" />
                    </th>
                    <th className="p-3 bg-cyan-500/10 cursor-pointer hover:bg-cyan-500/20 transition-colors" onClick={() => handleSort('sessions')}>
                      Sessions <SortIcon columnKey="sessions" />
                    </th>
                    <th className="p-3 bg-cyan-500/10 cursor-pointer hover:bg-cyan-500/20 transition-colors" onClick={() => handleSort('avg')}>
                      Avg Duration <SortIcon columnKey="avg" />
                    </th>
                    <th className="p-3 bg-cyan-500/10 cursor-pointer hover:bg-cyan-500/20 transition-colors" onClick={() => handleSort('median')}>
                      Median <SortIcon columnKey="median" />
                    </th>
                    <th className="p-3 bg-cyan-500/10 cursor-pointer hover:bg-cyan-500/20 transition-colors" onClick={() => handleSort('quick')}>
                      Quick (&lt;5m) <SortIcon columnKey="quick" />
                    </th>
                    <th className="p-3 bg-cyan-500/10 cursor-pointer hover:bg-cyan-500/20 transition-colors rounded-r-lg" onClick={() => handleSort('long')}>
                      Long (&gt;20m) <SortIcon columnKey="long" />
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sortedData.map((t, i) => (
                    <tr key={t.name} className="border-b border-white/5 hover:bg-white/5">
                      <td className={`p-3 ${i === 0 ? 'text-yellow-400' : i === 1 ? 'text-gray-300' : i === 2 ? 'text-orange-400' : ''}`}>
                        {i + 1}
                      </td>
                      <td className="p-3 font-semibold">{t.name}</td>
                      <td className="p-3">{t.sessions.toLocaleString()}</td>
                      <td className="p-3">{t.avg} min</td>
                      <td className="p-3">{t.median} min</td>
                      <td className="p-3">{t.quick.toLocaleString()} ({t.quickPct}%)</td>
                      <td className="p-3">{t.long.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <h2 className="text-2xl font-semibold mt-10 mb-5 pb-2 border-b-2 border-cyan-500/30">
            🏷️ Top Question Topics
          </h2>
          <div className="grid md:grid-cols-2 gap-5">
            <ChartCard title="Most Common Topics" height="400px"><canvas id="topicsChart"></canvas></ChartCard>
            <ChartCard title="📅 Yearly Comparison"><canvas id="yearlyChart"></canvas></ChartCard>
          </div>

          <footer className="text-center text-gray-500 text-sm mt-12 pb-8">
            Data sourced from Live Help attendance logs | Connected to Google Sheets
          </footer>
        </div>
      </div>
    </>
  );
}

function MetricCard({ label, value, subtext }: { label: string; value: string; subtext: string }) {
  return (
    <div className="bg-white/5 rounded-2xl p-6 border border-white/10 hover:transform hover:-translate-y-1 hover:shadow-lg hover:shadow-cyan-500/20 transition-all">
      <div className="text-xs text-gray-400 uppercase tracking-wider mb-2">{label}</div>
      <div className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-green-400 bg-clip-text text-transparent">{value}</div>
      <div className="text-xs text-gray-500 mt-1">{subtext}</div>
    </div>
  );
}

function ChartCard({ title, children, height = '300px' }: { title: string; children: React.ReactNode; height?: string }) {
  return (
    <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
      <h3 className="text-lg font-semibold mb-5">{title}</h3>
      <div style={{ height }} className="relative">{children}</div>
    </div>
  );
}
