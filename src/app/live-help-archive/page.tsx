'use client';

// Force rebuild - Last 3 Weeks chart update
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

interface TopicData {
  label: string;
  count: number;
}

interface TrainerComparison {
  name: string;
  avg: number;
  sessions: number;
  diff: number;
}

interface ApiResponse {
  trainerData: TrainerData[];
  summary: {
    totalSessions: number;
    helpedSessions: number;
    noHelpRate: number;
    avgDuration: number;
    busiestDay: string;
    trainerCount: number;
    topTrainer: { name: string; avg: number } | null;
  };
  charts: {
    dayOfWeek: number[];
    dayOfWeekByYear: Record<string, number[]>;
    topics: TopicData[];
    monthlyByYear: Record<string, number[]>;
    lastThreeWeeksByDay: Record<string, number[]>;
    trainerComparison: TrainerComparison[];
  };
  dateRange: {
    start: string;
    end: string;
    preset: string;
  };
  error?: string;
}

type SortKey = 'name' | 'sessions' | 'avg' | 'median' | 'quick' | 'long' | 'quickPct';
type SortDir = 'asc' | 'desc';

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Chart: any;
  }
}

const PRESET_OPTIONS = [
  { value: 'this-week', label: 'This Week' },
  { value: 'last-week', label: 'Last Week' },
  { value: 'this-month', label: 'This Month' },
  { value: 'last-month', label: 'Last Month' },
  { value: 'this-quarter', label: 'This Quarter' },
  { value: 'last-quarter', label: 'Last Quarter' },
  { value: 'this-year', label: 'This Year' },
  { value: 'last-year', label: 'Last Year' },
  { value: 'all-time', label: 'All Time' },
  { value: 'custom', label: 'Custom Range' },
];

// Get display label for current preset
const getPresetLabel = (preset: string): string => {
  const option = PRESET_OPTIONS.find(o => o.value === preset);
  return option?.label || 'This Week';
};

export default function LiveHelpDashboard() {
  const chartsInitialized = useRef(false);
  const chartInstances = useRef<Record<string, any>>({});
  
  const [trainerData, setTrainerData] = useState<TrainerData[]>([]);
  const [summary, setSummary] = useState({
    totalSessions: 0,
    helpedSessions: 0,
    noHelpRate: 0,
    avgDuration: 0,
    busiestDay: '-',
    trainerCount: 0,
    topTrainer: null as { name: string; avg: number } | null,
  });
  const [charts, setCharts] = useState({
    dayOfWeek: [0, 0, 0, 0, 0, 0, 0],
    dayOfWeekByYear: {} as Record<string, number[]>,
    topics: [] as TopicData[],
    monthlyByYear: {} as Record<string, number[]>,
    lastThreeWeeksByDay: {} as Record<string, number[]>,
    trainerComparison: [] as TrainerComparison[],
  });
  
  const [sortKey, setSortKey] = useState<SortKey>('avg');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  
  // Main filter (for trainer table)
  const [datePreset, setDatePreset] = useState('this-week');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  
  // Chart filter (for charts section)
  const [chartPreset, setChartPreset] = useState('this-week');
  const [chartCustomStart, setChartCustomStart] = useState('');
  const [chartCustomEnd, setChartCustomEnd] = useState('');
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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
      
      setTrainerData(result.trainerData);
      setSummary(result.summary);
      setCharts(result.charts);
      
      const startDate = new Date(result.dateRange.start);
      const endDate = new Date(result.dateRange.end);
      setDateRangeDisplay(
        `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`
      );
      
      // Update charts after data loads
      setTimeout(() => updateCharts(result), 100);
    } catch (err) {
      console.error('Failed to fetch data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchData('this-week');
  }, [fetchData]);

  // Fetch when preset changes
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

  const updateCharts = (data: ApiResponse) => {
    if (typeof window === 'undefined' || !window.Chart) return;
    
    const Chart = window.Chart;
    
    // Destroy existing charts
    Object.values(chartInstances.current).forEach((chart: any) => {
      if (chart) chart.destroy();
    });
    chartInstances.current = {};
    
    // Day of Week Chart - Grouped by Year (same week number comparison)
    const dowCtx = document.getElementById('dowChart') as HTMLCanvasElement;
    if (dowCtx) {
      const dowByYear = data.charts.dayOfWeekByYear || {};
      
      chartInstances.current.dow = new Chart(dowCtx, {
        type: 'bar',
        data: {
          labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
          datasets: [
            {
              label: '2026',
              data: dowByYear['2026'] || [0,0,0,0,0,0,0],
              backgroundColor: '#ffd700',
              borderRadius: 4,
              barPercentage: 1.0,
              categoryPercentage: 0.8,
            },
            {
              label: '2025',
              data: dowByYear['2025'] || [0,0,0,0,0,0,0],
              backgroundColor: '#00ff88',
              borderRadius: 4,
              barPercentage: 0.7,
              categoryPercentage: 0.8,
            },
            {
              label: '2024',
              data: dowByYear['2024'] || [0,0,0,0,0,0,0],
              backgroundColor: '#00d9ff',
              borderRadius: 4,
              barPercentage: 0.7,
              categoryPercentage: 0.8,
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { 
            legend: { position: 'top', labels: { color: '#fff' } }
          },
          scales: {
            y: { beginAtZero: true, grid: { color: 'rgba(255,255,255,0.05)' } },
            x: { grid: { display: false } }
          }
        }
      });
    }
    
    // Topics Chart
    const topicsCtx = document.getElementById('topicsChart') as HTMLCanvasElement;
    if (topicsCtx && data.charts.topics.length > 0) {
      chartInstances.current.topics = new Chart(topicsCtx, {
        type: 'bar',
        data: {
          labels: data.charts.topics.map(t => t.label),
          datasets: [{
            data: data.charts.topics.map(t => t.count),
            backgroundColor: '#00ff88',
            borderRadius: 8
          }]
        },
        options: {
          indexAxis: 'y',
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            x: { beginAtZero: true, grid: { color: 'rgba(255,255,255,0.05)' } },
            y: { grid: { display: false } }
          }
        }
      });
    }
    
    // Last Three Weeks by Day Chart
    const threeWeeksCtx = document.getElementById('threeWeeksChart') as HTMLCanvasElement;
    if (threeWeeksCtx && data.charts.lastThreeWeeksByDay) {
      const weekLabels = ['This Week', 'Last Week', 'Two Weeks Ago'];
      const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
      const datasets: any[] = [];
      
      const colors = ['#ffd700', '#00ff88', '#00d9ff'];
      const bgColors = ['rgba(255,215,0,0.1)', 'rgba(0,255,136,0.1)', 'rgba(0,217,255,0.1)'];
      
      weekLabels.forEach((week, idx) => {
        if (data.charts.lastThreeWeeksByDay[week]) {
          datasets.push({
            label: week,
            data: data.charts.lastThreeWeeksByDay[week],
            borderColor: colors[idx],
            backgroundColor: bgColors[idx],
            tension: 0.4,
            fill: false,
            pointRadius: 5,
            pointBackgroundColor: colors[idx],
          });
        }
      });
      
      chartInstances.current.threeWeeks = new Chart(threeWeeksCtx, {
        type: 'line',
        data: { labels: dayLabels, datasets },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { position: 'top', labels: { color: '#fff' } }
          },
          scales: {
            y: { beginAtZero: true, grid: { color: 'rgba(255,255,255,0.05)' } },
            x: { grid: { display: false } }
          }
        }
      });
    }
    
    // Trainer vs Average Chart
    const comparisonCtx = document.getElementById('comparisonChart') as HTMLCanvasElement;
    if (comparisonCtx && data.charts.trainerComparison.length > 0) {
      const avgLine = data.summary.avgDuration;
      const sessionCounts = data.charts.trainerComparison.map(t => t.sessions);
      
      chartInstances.current.comparison = new Chart(comparisonCtx, {
        type: 'bar',
        data: {
          labels: data.charts.trainerComparison.map(t => t.name),
          datasets: [
            {
              label: 'Avg Duration',
              data: data.charts.trainerComparison.map(t => t.avg),
              backgroundColor: data.charts.trainerComparison.map(t => 
                t.avg <= avgLine ? '#00ff88' : '#ff6b6b'
              ),
              borderRadius: 8,
            },
            {
              label: 'Team Average',
              data: data.charts.trainerComparison.map(() => avgLine),
              type: 'line',
              borderColor: '#ffd700',
              borderWidth: 3,
              borderDash: [5, 5],
              pointRadius: 0,
              fill: false,
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { position: 'top', labels: { color: '#fff' } }
          },
          scales: {
            y: { beginAtZero: true, grid: { color: 'rgba(255,255,255,0.05)' }, title: { display: true, text: 'Minutes', color: '#888' } },
            x: { grid: { display: false } }
          }
        },
        plugins: [{
          id: 'sessionLabels',
          afterDatasetsDraw(chart: any) {
            const ctx = chart.ctx;
            const meta = chart.getDatasetMeta(0);
            
            ctx.save();
            ctx.font = 'bold 11px Arial';
            ctx.fillStyle = 'black';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'bottom';
            
            meta.data.forEach((bar: any, index: number) => {
              const count = sessionCounts[index];
              const x = bar.x;
              const y = bar.y + (bar.height || (bar.base - bar.y)) - 5;
              ctx.fillText(count.toString(), x, bar.base - 5);
            });
            
            ctx.restore();
          }
        }]
      });
    }
  };

  useEffect(() => {
    if (chartsInitialized.current) return;
    if (typeof window !== 'undefined' && window.Chart) {
      chartsInitialized.current = true;
    }
  }, []);

  // Filter out excluded trainers and normalize names
  const EXCLUDED_TRAINERS = ['x', 'nancy mattar', 'jenna'];
  const filteredTrainerData = trainerData
    .map(t => ({
      ...t,
      // Normalize name: capitalize first letter (sue -> Sue)
      name: t.name.charAt(0).toUpperCase() + t.name.slice(1)
    }))
    .filter(t => !EXCLUDED_TRAINERS.includes(t.name.toLowerCase()));
  
  const sortedData = [...filteredTrainerData].sort((a, b) => {
    const aVal = a[sortKey];
    const bVal = b[sortKey];
    if (typeof aVal === 'string' && typeof bVal === 'string') {
      return sortDir === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
    }
    return sortDir === 'asc' ? (aVal as number) - (bVal as number) : (bVal as number) - (aVal as number);
  });
  
  // Get trainer with most sessions (excluding X)
  const mostSessionsTrainer = filteredTrainerData.length > 0
    ? filteredTrainerData.reduce((best, t) => t.sessions > best.sessions ? t : best)
    : null;

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

  const DateFilter = ({ 
    preset, setPreset, 
    customStart, setCustomStart, 
    customEnd, setCustomEnd, 
    onApply,
    showRange = true,
    rangeDisplay = dateRangeDisplay
  }: {
    preset: string;
    setPreset: (v: string) => void;
    customStart: string;
    setCustomStart: (v: string) => void;
    customEnd: string;
    setCustomEnd: (v: string) => void;
    onApply: () => void;
    showRange?: boolean;
    rangeDisplay?: string;
  }) => (
    <div className="flex flex-wrap items-center gap-3">
      <select 
        value={preset}
        onChange={(e) => setPreset(e.target.value)}
        style={{ color: 'white' }}
        className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-cyan-500"
      >
        {PRESET_OPTIONS.map(opt => (
          <option key={opt.value} value={opt.value} style={{ color: 'black', backgroundColor: 'white' }}>{opt.label}</option>
        ))}
      </select>
      
      {preset === 'custom' && (
        <>
          <input
            type="date"
            value={customStart}
            onChange={(e) => setCustomStart(e.target.value)}
            className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500"
          />
          <span className="text-white">to</span>
          <input
            type="date"
            value={customEnd}
            onChange={(e) => setCustomEnd(e.target.value)}
            className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500"
          />
          <button 
            onClick={onApply}
            disabled={!customStart || !customEnd}
            className="bg-cyan-500 hover:bg-cyan-600 disabled:bg-gray-600 disabled:cursor-not-allowed px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
          >
            Apply
          </button>
        </>
      )}
      
      {showRange && !loading && (
        <span className="text-sm text-white">{rangeDisplay}</span>
      )}
    </div>
  );

  return (
    <>
      <Script src="https://cdn.jsdelivr.net/npm/chart.js" onLoad={() => {
        chartsInitialized.current = true;
        if (summary.totalSessions > 0) {
          updateCharts({ trainerData, summary, charts, dateRange: { start: '', end: '', preset: datePreset } });
        }
      }} />
      <div className="min-h-screen bg-gradient-to-br from-[#1a1a2e] to-[#16213e] text-white">
        <div className="max-w-[1600px] mx-auto p-5">
          <header className="text-center py-8 border-b border-white/10 mb-8">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-400 to-green-400 bg-clip-text text-transparent mb-2 flex items-center justify-center gap-3">
              <img src="/qb-logo.png" alt="QuickBooks" className="h-10" /> Live Help Dashboard
            </h1>
            <p className="text-gray-400 text-sm">
              QuickBooksTraining.com | Live Data from Google Sheets
            </p>
          </header>

          {/* Date Filter for Metrics */}
          <div className="mb-6">
            <DateFilter
              preset={datePreset}
              setPreset={setDatePreset}
              customStart={customStart}
              setCustomStart={setCustomStart}
              customEnd={customEnd}
              setCustomEnd={setCustomEnd}
              onApply={handleApplyCustomRange}
            />
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin inline-block w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full mb-4"></div>
              <p className="text-gray-400">Loading dashboard data...</p>
            </div>
          ) : error ? (
            <div className="text-center py-12 text-red-400">
              <p>Error: {error}</p>
              <button 
                onClick={() => fetchData(datePreset)}
                className="mt-4 bg-cyan-500 hover:bg-cyan-600 px-4 py-2 rounded-lg"
              >
                Retry
              </button>
            </div>
          ) : (
            <>
              {/* Key Metrics */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-5 mb-8">
                <MetricCard label={`Total Sessions ${getPresetLabel(datePreset)}`} value={summary.totalSessions.toLocaleString()} />
                <MetricCard label={`Avg Duration ${getPresetLabel(datePreset)}`} value={`${summary.avgDuration} min`} subtext="Per session" />
                <MetricCard 
                  label={`Fastest Trainer ${getPresetLabel(datePreset)}`}
                  value={summary.topTrainer?.name || '-'} 
                  subtext={summary.topTrainer ? `${summary.topTrainer.avg} min avg` : 'Fastest response'} 
                  highlight
                />
                <MetricCard 
                  label={`Most Sessions ${getPresetLabel(datePreset)}`}
                  value={mostSessionsTrainer?.name || '-'} 
                  subtext={mostSessionsTrainer ? `${mostSessionsTrainer.sessions} sessions` : 'Highest volume'} 
                  highlight
                />
              </div>

              {/* Charts Section */}
              <div className="grid md:grid-cols-2 gap-5 mb-8">
                <ChartCard title="📈 Sessions by Day (Last 3 Weeks)">
                  <canvas id="threeWeeksChart"></canvas>
                </ChartCard>
                <ChartCard title="📆 Sessions by Day this Week">
                  <canvas id="dowChart"></canvas>
                </ChartCard>
              </div>
              
              <div className="grid md:grid-cols-2 gap-5 mb-8">
                <ChartCard title={`⏱️ Trainer Solution Time vs Team Average ${getPresetLabel(datePreset)}`} height="350px">
                  <canvas id="comparisonChart"></canvas>
                </ChartCard>
                <ChartCard title={`🏷️ Most Common Topics ${getPresetLabel(datePreset)}`} height="350px">
                  <canvas id="topicsChart"></canvas>
                </ChartCard>
              </div>

              {/* Trainer Stats Section */}
              <h2 className="text-2xl font-semibold mt-10 mb-5 pb-2 border-b-2 border-cyan-500/30">
                🏆 Trainer Stats
              </h2>
              
              {/* Date Filter for Trainer Rankings */}
              <div className="bg-white/5 rounded-2xl p-4 border border-white/10 mb-4">
                <DateFilter
                  preset={datePreset}
                  setPreset={setDatePreset}
                  customStart={customStart}
                  setCustomStart={setCustomStart}
                  customEnd={customEnd}
                  setCustomEnd={setCustomEnd}
                  onApply={handleApplyCustomRange}
                />
              </div>
              
              {/* Trainer Table */}
              <div className="bg-white/5 rounded-2xl p-6 border border-white/10 overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-cyan-400 text-sm uppercase tracking-wider">
                      <th className="p-3 bg-cyan-500/10 rounded-l-lg cursor-pointer hover:bg-cyan-500/20 transition-colors" onClick={() => handleSort('name')}>
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
                    {sortedData.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-gray-400">
                          No data for selected time period
                        </td>
                      </tr>
                    ) : (
                      sortedData.map((t) => (
                        <tr key={t.name} className="border-b border-white/5 hover:bg-white/5">
                          <td className="p-3 font-semibold">{t.name}</td>
                          <td className="p-3">{t.sessions.toLocaleString()}</td>
                          <td className="p-3">{t.avg} min</td>
                          <td className="p-3">{t.median} min</td>
                          <td className="p-3">{t.quick.toLocaleString()} ({t.quickPct}%)</td>
                          <td className="p-3">{t.long.toLocaleString()}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              <footer className="text-center text-gray-500 text-sm mt-12 pb-8">
                Data sourced from Live Help attendance logs | Connected to Google Sheets | Updates in real-time
              </footer>
            </>
          )}
        </div>
      </div>
    </>
  );
}

function MetricCard({ label, value, subtext, highlight = false }: { label: string; value: string; subtext?: string; highlight?: boolean }) {
  return (
    <div className={`bg-white/5 rounded-2xl p-6 border ${highlight ? 'border-green-500/50' : 'border-white/10'} hover:transform hover:-translate-y-1 hover:shadow-lg hover:shadow-cyan-500/20 transition-all`}>
      <div className="text-xs text-gray-400 uppercase tracking-wider mb-2">{label}</div>
      <div className={`text-3xl font-bold bg-gradient-to-r ${highlight ? 'from-green-400 to-cyan-400' : 'from-cyan-400 to-green-400'} bg-clip-text text-transparent`}>{value}</div>
      {subtext && <div className="text-xs text-gray-500 mt-1">{subtext}</div>}
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
