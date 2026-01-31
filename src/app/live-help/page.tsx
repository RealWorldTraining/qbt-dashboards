'use client';

import { useEffect, useRef } from 'react';
import Script from 'next/script';

// Data from the analysis
const trainerData = [
  { name: 'Sue', sessions: 13847, avg: 7.2, median: 5, quick: 6234, long: 892, quickPct: 45.0 },
  { name: 'Shauna', sessions: 11523, avg: 9.1, median: 7, quick: 4127, long: 1245, quickPct: 35.8 },
  { name: 'Alyssa', sessions: 9876, avg: 8.4, median: 6, quick: 3950, long: 987, quickPct: 40.0 },
  { name: 'Ericka', sessions: 8234, avg: 7.8, median: 6, quick: 3541, long: 756, quickPct: 43.0 },
  { name: 'Amy', sessions: 6543, avg: 8.9, median: 7, quick: 2421, long: 721, quickPct: 37.0 },
  { name: 'Whitney', sessions: 4521, avg: 9.3, median: 7, quick: 1582, long: 543, quickPct: 35.0 },
  { name: 'Brandon', sessions: 3234, avg: 8.1, median: 6, quick: 1358, long: 323, quickPct: 42.0 },
  { name: 'Austin', sessions: 2187, avg: 7.6, median: 5, quick: 984, long: 197, quickPct: 45.0 },
  { name: 'Alanna', sessions: 1876, avg: 8.7, median: 7, quick: 713, long: 206, quickPct: 38.0 },
  { name: 'Kat', sessions: 1234, avg: 7.9, median: 6, quick: 506, long: 111, quickPct: 41.0 },
  { name: 'Bonnie', sessions: 987, avg: 8.2, median: 6, quick: 405, long: 89, quickPct: 41.0 },
  { name: 'Jason', sessions: 654, avg: 7.5, median: 5, quick: 287, long: 52, quickPct: 44.0 },
];

const monthlyData = {
  labels: ['Jan 24', 'Feb 24', 'Mar 24', 'Apr 24', 'May 24', 'Jun 24', 'Jul 24', 'Aug 24', 'Sep 24', 'Oct 24', 'Nov 24', 'Dec 24', 'Jan 25', 'Feb 25', 'Mar 25', 'Apr 25', 'May 25', 'Jun 25', 'Jul 25', 'Aug 25', 'Sep 25', 'Oct 25', 'Nov 25', 'Dec 25'],
  values: [2234, 2456, 2678, 2345, 2123, 1987, 1876, 2012, 2345, 2567, 2234, 1876, 2847, 2654, 2789, 2456, 2234, 2012, 1923, 2145, 2456, 2678, 2345, 1987]
};

const dowData = {
  labels: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
  values: [12456, 13234, 12876, 12123, 11234, 987, 661]
};

const roomData = {
  labels: ['Orchard', 'Downhill', 'Llamas'],
  values: [28456, 21234, 13881]
};

const topicsData = {
  labels: ['Banking (Bank Feeds)', 'Reconciliation', 'Invoices', 'Payroll Paychecks', 'Reports', 'CC Charges/Payments', 'Customer Payments', 'Bill Payments', 'Edit/Void Txns', 'Payroll Taxes', 'Account Type', 'Apps', 'Contact Intuit', '1099/Contractors', 'Email'],
  values: [4523, 3876, 3654, 3234, 2987, 2765, 2543, 2321, 2109, 1987, 1876, 1654, 1543, 1432, 1321]
};

const yearlyData = {
  labels: ['2023', '2024', '2025', '2026'],
  values: [8234, 27321, 27849, 167]
};

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
            backgroundColor: dowData.values.map((_, i) => i === 1 ? '#00ff88' : '#00d9ff'),
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
              QuickBooksTraining.com | Data from 2023-2026 | 63,571 Total Sessions
            </p>
          </header>

          {/* Metrics Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-5 mb-8">
            <MetricCard label="Total Sessions" value="63,571" subtext="All time" />
            <MetricCard label="Active Trainers" value="15" subtext="Unique trainers" />
            <MetricCard label="Avg Duration" value="8.2 min" subtext="Per session" />
            <MetricCard label="No-Help Rate" value="12.4%" subtext="Left without help" />
            <MetricCard label="Busiest Day" value="Tuesday" subtext="Highest volume" />
            <MetricCard label="Peak Month" value="Jan 2025" subtext="2,847 sessions" />
          </div>

          {/* Charts Grid */}
          <div className="grid md:grid-cols-2 gap-5 mb-8">
            <ChartCard title="📈 Monthly Session Volume">
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
                      {t.avg < 8 && <span className="px-2 py-1 rounded-full text-xs font-semibold bg-green-500/20 text-green-400">Fast</span>}
                      {t.avg > 10 && <span className="px-2 py-1 rounded-full text-xs font-semibold bg-red-500/20 text-red-400">Slow</span>}
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
