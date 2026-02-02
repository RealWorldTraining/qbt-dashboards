'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import Script from 'next/script';

interface PersonStatus {
  name: string;
  trainer?: string;
  entered?: string;
  help_started?: string;
  help_duration_minutes?: number;
  wait_duration_minutes?: number;
}

interface RoomStatus {
  being_helped: PersonStatus[];
  waiting: PersonStatus[];
  total_current: number;
}

interface TodayStats {
  total_visits: number;
  completed_visits: number;
  average_help_duration_minutes: number;
  hourly_logins: { hour: number; logins: number }[];
  help_sessions: number;
}

interface TrainerPerformance {
  [trainerName: string]: {
    sessions: number;
    total_duration: number;
    avg_duration: number;
  };
}

interface CalendarEvent {
  summary: string;
  start: string;
  end: string;
  trainer?: string;
}

interface HourSchedule {
  hour: string;
  hourStart: string;
  downhill: CalendarEvent[];
  orchard: CalendarEvent[];
  backup: CalendarEvent[];
}

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Chart: any;
  }
}

export default function LiveHelpDashboard() {
  const chartsInitialized = useRef(false);
  const chartInstances = useRef<Record<string, any>>({});
  const intervalRef = useRef<NodeJS.Timeout | undefined>(undefined);
  
  const [currentStatus, setCurrentStatus] = useState<Record<string, RoomStatus>>({});
  const [todayStats, setTodayStats] = useState<TodayStats>({
    total_visits: 0,
    completed_visits: 0,
    average_help_duration_minutes: 0,
    hourly_logins: [],
    help_sessions: 0
  });
  const [trainerPerformance, setTrainerPerformance] = useState<TrainerPerformance>({});
  const [schedules, setSchedules] = useState<HourSchedule[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchCurrentStatus = useCallback(async () => {
    try {
      const response = await fetch('/api/live-help-current?action=current-status');
      if (!response.ok) throw new Error('Failed to fetch current status');
      const data = await response.json();
      setCurrentStatus(data);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Failed to fetch current status:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch current status');
    }
  }, []);

  const fetchTodayStats = useCallback(async () => {
    try {
      const response = await fetch('/api/live-help-current?action=today-stats');
      if (!response.ok) throw new Error('Failed to fetch today stats');
      const data = await response.json();
      setTodayStats(data);
      
      // Update hourly chart
      setTimeout(() => updateHourlyChart(data), 100);
    } catch (err) {
      console.error('Failed to fetch today stats:', err);
    }
  }, []);

  const fetchTrainerPerformance = useCallback(async () => {
    try {
      const response = await fetch('/api/live-help-current?action=trainer-performance');
      if (!response.ok) throw new Error('Failed to fetch trainer performance');
      const data = await response.json();
      setTrainerPerformance(data);
    } catch (err) {
      console.error('Failed to fetch trainer performance:', err);
    }
  }, []);

  const fetchSchedules = useCallback(async () => {
    try {
      const response = await fetch('/api/live-help-schedule');
      if (!response.ok) throw new Error('Failed to fetch schedules');
      const data = await response.json();
      setSchedules(data.schedules || []);
    } catch (err) {
      console.error('Failed to fetch schedules:', err);
    }
  }, []);

  const fetchAllData = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      await Promise.all([
        fetchCurrentStatus(),
        fetchTodayStats(),
        fetchTrainerPerformance(),
        fetchSchedules()
      ]);
    } catch (err) {
      console.error('Failed to fetch data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  }, [fetchCurrentStatus, fetchTodayStats, fetchTrainerPerformance, fetchSchedules]);

  // Initial fetch
  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  // Set up auto-refresh
  useEffect(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    
    // Refresh every 60 seconds
    intervalRef.current = setInterval(() => {
      fetchAllData();
    }, 60000);
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [fetchAllData]);

  const updateHourlyChart = (data: TodayStats) => {
    if (typeof window === 'undefined' || !window.Chart) return;
    
    const Chart = window.Chart;
    
    // Destroy existing chart
    if (chartInstances.current.hourly) {
      chartInstances.current.hourly.destroy();
    }
    
    const ctx = document.getElementById('hourlyChart') as HTMLCanvasElement;
    if (ctx) {
      // Get current hour for highlighting
      const currentHour = new Date().getHours();
      
      chartInstances.current.hourly = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: data.hourly_logins.map(h => {
            const hour12 = h.hour === 0 ? 12 : h.hour > 12 ? h.hour - 12 : h.hour;
            const ampm = h.hour < 12 ? 'AM' : 'PM';
            return `${hour12}${ampm}`;
          }),
          datasets: [{
            label: 'Logins',
            data: data.hourly_logins.map(h => h.logins),
            backgroundColor: data.hourly_logins.map(h => 
              h.hour === currentHour ? '#00ff88' : '#00d9ff'
            ),
            borderRadius: 4
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false }
          },
          scales: {
            y: { 
              beginAtZero: true, 
              grid: { color: 'rgba(255,255,255,0.05)' },
              title: { display: true, text: 'Number of People', color: '#888' }
            },
            x: { 
              grid: { display: false },
              title: { display: true, text: 'Hour of Day', color: '#888' }
            }
          }
        }
      });
    }
  };

  // Calculate totals across all rooms
  const totalWaiting = Object.values(currentStatus).reduce((sum, room) => sum + room.waiting.length, 0);
  const totalBeingHelped = Object.values(currentStatus).reduce((sum, room) => sum + room.being_helped.length, 0);
  const totalCurrent = totalWaiting + totalBeingHelped;

  // Get longest wait time
  const allWaiting = Object.values(currentStatus).flatMap(room => room.waiting);
  const longestWait = allWaiting.length > 0 
    ? Math.max(...allWaiting.map(p => p.wait_duration_minutes || 0))
    : 0;

  return (
    <>
      <Script src="https://cdn.jsdelivr.net/npm/chart.js" onLoad={() => {
        chartsInitialized.current = true;
        if (todayStats.hourly_logins.length > 0) {
          updateHourlyChart(todayStats);
        }
      }} />
      <div className="min-h-screen bg-gradient-to-br from-[#0f0f23] to-[#1a1a2e] text-white">
        <div className="max-w-[1800px] mx-auto p-5">
          <header className="text-center py-6 border-b border-green-500/30 mb-8">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-green-400 to-cyan-400 bg-clip-text text-transparent mb-2 flex items-center justify-center gap-3">
              <img src="/qb-logo.png" alt="QuickBooks" className="h-10" />
              🔴 Live Help Dashboard
            </h1>
            <p className="text-gray-400 text-sm">
              Real-time status • Updates every 60 seconds • Live Now
              {lastUpdated && (
                <span className="ml-3">
                  Last updated: {lastUpdated.toLocaleTimeString()}
                </span>
              )}
            </p>
          </header>

          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin inline-block w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full mb-4"></div>
              <p className="text-gray-400">Loading live data...</p>
            </div>
          ) : error ? (
            <div className="text-center py-12 text-red-400">
              <p>Error: {error}</p>
              <button 
                onClick={() => fetchAllData()}
                className="mt-4 bg-green-500 hover:bg-green-600 px-4 py-2 rounded-lg"
              >
                Retry
              </button>
            </div>
          ) : (
            <>
              {/* Top Grid: Schedule and Room Status */}
              <div className="grid lg:grid-cols-3 gap-5 mb-8">
                {/* Schedule Section - Takes 2 columns */}
                <div className="lg:col-span-2 space-y-4">
                  <h2 className="text-xl font-semibold mb-3 flex items-center gap-2">
                    📅 Trainer Schedule <span className="text-sm text-green-400 font-normal">● LIVE</span>
                  </h2>
                  {schedules.map((schedule, idx) => (
                    <ScheduleHourCard key={idx} schedule={schedule} isCurrent={idx === 0} />
                  ))}
                </div>

                {/* Room Status - Takes 1 column (narrower) */}
                <div className="space-y-4">
                  <h2 className="text-xl font-semibold mb-3 flex items-center gap-2">
                    🏠 Room Status <span className="text-sm text-green-400 font-normal">● LIVE</span>
                  </h2>
                  {Object.entries(currentStatus)
                    .filter(([roomName]) => roomName === 'Downhill' || roomName === 'Orchard')
                    .map(([roomName, room]) => (
                      <RoomCard key={roomName} roomName={roomName} room={room} compact />
                    ))}
                  
                  {/* Stats below rooms */}
                  <div className="space-y-3 mt-4">
                    <StatusCard 
                      label="Longest Wait" 
                      value={`${Math.round(longestWait)} min`} 
                      subtext="Max wait time"
                      color={longestWait > 15 ? "red" : longestWait > 5 ? "yellow" : "green"}
                    />
                    <StatusCard 
                      label="Today's Visits" 
                      value={todayStats.total_visits} 
                      subtext={`${todayStats.help_sessions} helped`}
                      color="blue"
                    />
                  </div>
                </div>
              </div>

              {/* Today's Activity */}
              <div className="grid md:grid-cols-2 gap-8 mb-8">
                <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
                  <h3 className="text-xl font-semibold mb-5 flex items-center gap-2">
                    📊 Today's Activity
                    <span className="text-sm text-gray-400">({todayStats.total_visits} total visits)</span>
                  </h3>
                  <div style={{ height: '300px' }} className="relative">
                    <canvas id="hourlyChart"></canvas>
                  </div>
                </div>

                <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
                  <h3 className="text-xl font-semibold mb-5">⚡ Today's Trainer Performance</h3>
                  <div className="space-y-3 max-h-80 overflow-y-auto">
                    {Object.entries(trainerPerformance)
                      .sort(([,a], [,b]) => b.sessions - a.sessions)
                      .map(([name, stats]) => (
                        <TrainerRow key={name} name={name} stats={stats} />
                      ))}
                    {Object.keys(trainerPerformance).length === 0 && (
                      <p className="text-gray-400 text-center py-8">No trainer sessions yet today</p>
                    )}
                  </div>
                </div>
              </div>

              <footer className="text-center text-gray-500 text-sm mt-12 pb-8">
                🔴 Live data from Google Sheets • Real-time room status • Auto-refreshes every 60 seconds
              </footer>
            </>
          )}
        </div>
      </div>
    </>
  );
}

function StatusCard({ 
  label, 
  value, 
  subtext, 
  color = "blue", 
  pulse = false 
}: { 
  label: string; 
  value: string | number; 
  subtext?: string; 
  color?: "green" | "yellow" | "red" | "blue";
  pulse?: boolean;
}) {
  const colorClasses = {
    green: 'border-green-500/50 from-green-400 to-cyan-400',
    yellow: 'border-yellow-500/50 from-yellow-400 to-orange-400',
    red: 'border-red-500/50 from-red-400 to-pink-400',
    blue: 'border-blue-500/50 from-blue-400 to-cyan-400'
  };

  return (
    <div className={`bg-white/5 rounded-2xl p-6 border ${colorClasses[color].split(' ')[0]} hover:transform hover:-translate-y-1 hover:shadow-lg transition-all ${pulse ? 'animate-pulse' : ''}`}>
      <div className="text-xs text-gray-400 uppercase tracking-wider mb-2">{label}</div>
      <div className={`text-3xl font-bold bg-gradient-to-r ${colorClasses[color].substring(colorClasses[color].indexOf('from-'))} bg-clip-text text-transparent`}>
        {value}
      </div>
      {subtext && <div className="text-xs text-gray-500 mt-1">{subtext}</div>}
    </div>
  );
}

function ScheduleHourCard({ schedule, isCurrent }: { schedule: HourSchedule; isCurrent: boolean }) {
  return (
    <div className={`bg-white/5 rounded-xl p-4 border ${isCurrent ? 'border-green-500/50 bg-green-900/10' : 'border-white/10'}`}>
      <h3 className={`text-sm font-semibold mb-3 ${isCurrent ? 'text-green-400' : 'text-gray-300'}`}>
        {schedule.hour} {isCurrent && '(Current)'}
      </h3>
      <div className="grid grid-cols-3 gap-3">
        <div>
          <div className="text-xs text-gray-400 mb-1">🌋 Downhill</div>
          {schedule.downhill.length === 0 ? (
            <div className="text-xs text-gray-500 italic">No coverage</div>
          ) : (
            schedule.downhill.map((event, idx) => (
              <div key={idx} className="text-sm text-white">{event.trainer}</div>
            ))
          )}
        </div>
        <div>
          <div className="text-xs text-gray-400 mb-1">🌳 Orchard</div>
          {schedule.orchard.length === 0 ? (
            <div className="text-xs text-gray-500 italic">No coverage</div>
          ) : (
            schedule.orchard.map((event, idx) => (
              <div key={idx} className="text-sm text-white">{event.trainer}</div>
            ))
          )}
        </div>
        <div>
          <div className="text-xs text-gray-400 mb-1">🔄 Backup</div>
          {schedule.backup.length === 0 ? (
            <div className="text-xs text-gray-500 italic">No coverage</div>
          ) : (
            schedule.backup.map((event, idx) => (
              <div key={idx} className="text-sm text-white">{event.trainer}</div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function RoomCard({ roomName, room, compact = false }: { roomName: string; room: RoomStatus; compact?: boolean }) {
  const isEmpty = room.total_current === 0;
  const roomEmojis: Record<string, string> = {
    'Downhill': '🌋',
    'Orchard': '🌳', 
    'Llamas': '🦙'
  };

  return (
    <div className={`bg-white/5 rounded-2xl ${compact ? 'p-4' : 'p-6'} border border-white/10 ${isEmpty ? 'opacity-60' : ''}`}>
      <h4 className={`${compact ? 'text-base' : 'text-lg'} font-semibold mb-3 flex items-center justify-between`}>
        <span>{roomEmojis[roomName]} {roomName}</span>
        <span className={`text-xs px-2 py-1 rounded-full ${
          isEmpty ? 'bg-gray-700 text-gray-400' : 'bg-green-900 text-green-300'
        }`}>
          {room.total_current}
        </span>
      </h4>

      {isEmpty ? (
        <p className="text-gray-400 text-center py-4 text-sm">Empty</p>
      ) : (
        <div className="space-y-3">
          {/* Being Helped */}
          {room.being_helped.length > 0 && (
            <div>
              <h5 className="text-xs font-medium text-green-400 mb-1">
                💬 Being Helped ({room.being_helped.length})
              </h5>
              <div className="space-y-1">
                {room.being_helped.map((person, idx) => (
                  <div key={idx} className="text-xs bg-green-900/20 rounded p-2 border border-green-500/30">
                    <div className="font-medium">{person.name}</div>
                    <div className="text-[10px] text-gray-400">
                      {person.trainer} • {Math.round(person.help_duration_minutes || 0)}m
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Waiting */}
          {room.waiting.length > 0 && (
            <div>
              <h5 className="text-xs font-medium text-yellow-400 mb-1">
                ⏳ Waiting ({room.waiting.length})
              </h5>
              <div className="space-y-1">
                {room.waiting.map((person, idx) => (
                  <div key={idx} className="text-xs bg-yellow-900/20 rounded p-2 border border-yellow-500/30">
                    <div className="font-medium">{person.name}</div>
                    <div className="text-[10px] text-gray-400">
                      {Math.round(person.wait_duration_minutes || 0)}m
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function TrainerRow({ name, stats }: { name: string; stats: { sessions: number; total_duration: number; avg_duration: number } }) {
  return (
    <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg border border-white/10">
      <div>
        <div className="font-medium">{name}</div>
        <div className="text-xs text-gray-400">{stats.sessions} sessions today</div>
      </div>
      <div className="text-right">
        <div className="text-lg font-semibold text-cyan-400">{stats.avg_duration} min</div>
        <div className="text-xs text-gray-400">avg duration</div>
      </div>
    </div>
  );
}