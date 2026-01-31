'use client';

import { useEffect, useRef } from 'react';
import Script from 'next/script';

// ALL ACTUAL DATA from spreadsheet analysis - January 2026
const trainerData = [
  { name: 'Sue', sessions: 8840, avg: 8.2, median: 6, quick: 3951, long: 608, quickPct: 44.7 },
  { name: 'Austin', sessions: 8258, avg: 5.9, median: 5, quick: 4746, long: 125, quickPct: 57.5 },
  { name: 'Brandon', sessions: 7272, avg: 6.0, median: 5, quick: 4332, long: 198, quickPct: 59.6 },
  { name: 'Whitney', sessions: 6420, avg: 9.7, median: 8, quick: 2138, long: 651, quickPct: 33.3 },
  { name: 'Alyssa', sessions: 6125, avg: 11.0, median: 9, quick: 1812, long: 863, quickPct: 29.6 },
  { name: 'Amy', sessions: 5811, avg: 7.6, median: 6, quick: 2624, long: 253, quickPct: 45.2 },
  { name: 'Shauna', sessions: 4654, avg: 10.6, median: 8, quick: 1526, long: 589, quickPct: 32.8 },
  { name: 'Alanna', sessions: 3698, avg: 8.4, median: 6, quick: 1589, long: 279, quickPct: 43.0 },
  { name: 'Ericka', sessions: 2331, avg: 12.0, median: 9, quick: 671, long: 406, quickPct: 28.8 },
  { name: 'Jason', sessions: 365, avg: 7.9, median: 6, quick: 169, long: 18, quickPct: 46.3 },
  { name: 'Kat', sessions: 20, avg: 7.5, median: 6, quick: 8, long: 0, quickPct: 40.0 },
  { name: 'Cassie', sessions: 7, avg: 15.0, median: 12, quick: 1, long: 1, quickPct: 14.3 },
];

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

// Summary stats
const totalSessions = 63572;
const helpedSessions = 53804;
const noHelpRate = 15.4;
const avgDuration = 8.4;
const busiestDay = "Tuesday";
const peakMonth = "Jan 2025";
const peakMonthCount = 3253;
const activeTrainers = 12;

declare global {
  interface Window {
    Chart: any;
  }
}

export default function LiveHelpDashboard() {
  const chartsInitialized = useRef(false);

  useEffect(() => {
    if (chartsInitialized.current) return;
    if (typeof window !== 'undefined' && window.Chart) {
      initCharts();
      chartsInitialized.current = true;
    }
  }, []);

  const initCharts = () => {
    const Chart = window.Chart;
    
    Chart.defaults.color = '#888';
    Chart.defaults.borderColor = 'rgba(255,255,255,0.1)';

    // Monthly Chart
    const monthlyCtx = document.getElementById('monthlyChart') as HTMLCanvasElement;
    if (monthlyCtx) {
      new Chart(monthlyCtx, {
        type: 'line',
        data: {
          labels: monthlyData.labels,
          datasets: [{
            label: 'Sessions',
            data: monthlyData.values,
            borderColor: '#00d9ff',
            backgroundColor: 'rgba(0,217,255,0.1)',
            fill: true,
            tension: 0.4
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            y: { beginAtZero: true, grid: { color: 'rgba(255,255,255,0.05)' } },
            x: { grid: { display: false } }
          }
        }
      });
    }

    // Day of Week Chart
    const dowCtx = document.getElementById('dowChart') as HTMLCanvasElement;
    if (dowCtx) {
      new Chart(dowCtx, {
        type: 'bar',
        data: {
          labels: dowData.labels,
          datasets: [{
            data: dowData.values,
            backgroundColor: dowData.values.map((v, i) => i === 1 ? '#00ff88' : '#00d9ff'),
            borderRadius: 8
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            y: { beginAtZero: true, grid: { color: 'rgba(255,255,255,0.05)' } },
            x: { grid: { display: false } }
          }
        }
      });
    }

    // Room Chart
    const roomCtx = document.getElementById('roomChart') as HTMLCanvasElement;
    if (roomCtx) {
      new Chart(roomCtx, {
        type: 'doughnut',
        data: {
          labels: roomData.labels,
          datasets: [{
            data: roomData.values,
            backgroundColor: ['#00d9ff', '#00ff88', '#ffd700'],
            borderWidth: 0
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { position: 'bottom', labels: { padding: 20 } } }
        }
      });
    }

    // Trainer Chart
    const trainerCtx = document.getElementById('trainerChart') as HTMLCanvasElement;
    if (trainerCtx) {
      new Chart(trainerCtx, {
        type: 'bar',
        data: {
          labels: trainerData.slice(0, 10).map(t => t.name),
          datasets: [{
            data: trainerData.slice(0, 10).map(t => t.sessions),
            backgroundColor: '#00d9ff',
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

    // Topics Chart
    const topicsCtx = document.getElementById('topicsChart') as HTMLCanvasElement;
    if (topicsCtx) {
      new Chart(topicsCtx, {
        type: 'bar',
        data: {
          labels: topicsData.labels,
          datasets: [{
            data: topicsData.values,
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

    // Yearly Chart
    const yearlyCtx = document.getElementById('yearlyChart') as HTMLCanvasElement;
    if (yearlyCtx) {
      new Chart(yearlyCtx, {
        type: 'bar',
        data: {
          labels: yearlyData.labels,
          datasets: [{
            data: yearlyData.values,
            backgroundColor: ['#ff6b6b', '#00d9ff', '#00ff88', '#ffd700'],
            borderRadius: 8
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            y: { beginAtZero: true, grid: { color: 'rgba(255,255,255,0.05)' } },
            x: { grid: { display: false } }
          }
        }
      });
    }
  };

  return (
    <>
      <Script 
        src="https://cdn.jsdelivr.net/npm/chart.js" 
        onLoad={() => initCharts()}
      />
      <div className="min-h-screen bg-gradient-to-br from-[#1a1a2e] to-[#16213e] text-white">
        <div className="max-w-[1600px] mx-auto p-5">
          {/* Header */}
          <header className="text-center py-8 border-b border-white/10 mb-8">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-400 to-green-400 bg-clip-text text-transparent mb-2">
              📊 Live Help Dashboard
            </h1>
            <p className="text-gray-400 text-sm">
              QuickBooksTraining.com | Data: 2023-2026 | {totalSessions.toLocaleString()} Total Sessions | Updated Jan 30, 2026
            </p>
          </header>

          {/* Metrics Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-5 mb-8">
            <MetricCard label="Total Sessions" value={totalSessions.toLocaleString()} subtext="All attendees" />
            <MetricCard label="Helped Sessions" value={helpedSessions.toLocaleString()} subtext="With trainer" />
            <MetricCard label="No-Help Rate" value={`${noHelpRate}%`} subtext="Left without help" />
            <MetricCard label="Avg Duration" value={`${avgDuration} min`} subtext="Per session" />
            <MetricCard label="Busiest Day" value={busiestDay} subtext="Highest volume" />
            <MetricCard label="Peak Month" value={peakMonth} subtext={`${peakMonthCount.toLocaleString()} sessions`} />
          </div>

          {/* Charts Grid */}
          <div className="grid md:grid-cols-2 gap-5 mb-8">
            <ChartCard title="📈 Monthly Session Volume (Last 24 Months)">
              <canvas id="monthlyChart"></canvas>
            </ChartCard>
            <ChartCard title="📆 Sessions by Day of Week">
              <canvas id="dowChart"></canvas>
            </ChartCard>
            <ChartCard title="🏠 Sessions by Room">
              <canvas id="roomChart"></canvas>
            </ChartCard>
            <ChartCard title="👥 Top Trainers by Volume">
              <canvas id="trainerChart"></canvas>
            </ChartCard>
          </div>

          {/* Trainer Table */}
          <h2 className="text-2xl font-semibold mt-10 mb-5 pb-2 border-b-2 border-cyan-500/30">
            👥 Trainer Performance Rankings
          </h2>
          <div className="bg-white/5 rounded-2xl p-6 border border-white/10 overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-cyan-400 text-sm uppercase tracking-wider">
                  <th className="p-3 bg-cyan-500/10 rounded-l-lg">Rank</th>
                  <th className="p-3 bg-cyan-500/10">Trainer</th>
                  <th className="p-3 bg-cyan-500/10">Sessions</th>
                  <th className="p-3 bg-cyan-500/10">Avg Duration</th>
                  <th className="p-3 bg-cyan-500/10">Median</th>
                  <th className="p-3 bg-cyan-500/10">Quick (&lt;5m)</th>
                  <th className="p-3 bg-cyan-500/10">Long (&gt;20m)</th>
                  <th className="p-3 bg-cyan-500/10 rounded-r-lg">Efficiency</th>
                </tr>
              </thead>
              <tbody>
                {trainerData.map((t, i) => (
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
                    <td className="p-3">
                      {t.avg < 7 && <span className="px-2 py-1 rounded-full text-xs font-semibold bg-green-500/20 text-green-400">Fast</span>}
                      {t.avg >= 7 && t.avg <= 9 && <span className="px-2 py-1 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-400">Normal</span>}
                      {t.avg > 9 && <span className="px-2 py-1 rounded-full text-xs font-semibold bg-yellow-500/20 text-yellow-400">Thorough</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Topics Section */}
          <h2 className="text-2xl font-semibold mt-10 mb-5 pb-2 border-b-2 border-cyan-500/30">
            🏷️ Top Question Topics
          </h2>
          <div className="grid md:grid-cols-2 gap-5">
            <ChartCard title="Most Common Topics" height="400px">
              <canvas id="topicsChart"></canvas>
            </ChartCard>
            <ChartCard title="📅 Yearly Comparison">
              <canvas id="yearlyChart"></canvas>
            </ChartCard>
          </div>

          {/* Footer */}
          <footer className="text-center text-gray-500 text-sm mt-12 pb-8">
            Data sourced from Live Help attendance logs | All data is actual, not estimated
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
      <div className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-green-400 bg-clip-text text-transparent">
        {value}
      </div>
      <div className="text-xs text-gray-500 mt-1">{subtext}</div>
    </div>
  );
}

function ChartCard({ title, children, height = '300px' }: { title: string; children: React.ReactNode; height?: string }) {
  return (
    <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
      <h3 className="text-lg font-semibold mb-5">{title}</h3>
      <div style={{ height }} className="relative">
        {children}
      </div>
    </div>
  );
}
