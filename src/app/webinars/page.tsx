'use client';

import { useEffect, useState, useCallback, useRef } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface LiveParticipant {
  name: string;
  joinTime: string;
  location: string;
  connection?: string;
}

interface LiveWebinar {
  webinarId: string;
  topic: string;
  startTime: string;
  host?: string;
  participantCount: number;
  registrantsCount?: number | null;
  participants: LiveParticipant[];
  source: string;
}

interface LiveResponse {
  live: boolean;
  count: number;
  webinars: LiveWebinar[];
  fetchedAt: string;
  error?: string;
}

interface HistoricalWebinar {
  webinarId: string;
  topic: string;
  date: string;
  startTime: string;
  hostEmail: string;
  attendeeCount: number;
  avgDurationMin: number | null;
  registrantsCount?: number | null;
  attendanceRate?: number | null;
}

interface HistorySummary {
  totalWebinars: number;
  totalAttendees: number;
  uniqueAttendees: number;
  hosts: string[];
}

interface HistoryResponse {
  summary: HistorySummary;
  webinars: HistoricalWebinar[];
  topTopics: { topic: string; attendees: number }[];
}

interface DrilldownAttendee {
  name: string;
  joinTime: string;
  leaveTime: string;
  durationMin: number | null;
}

interface DrilldownResponse {
  webinarId: string;
  topic: string;
  date: string;
  startTime: string;
  hostEmail: string;
  registrantsCount?: number | null;
  total: number;
  attendees: DrilldownAttendee[];
}

interface UpcomingWebinar {
  webinarId: string | number;
  occurrenceId: string | null;
  topic: string;
  startTime: string;
  duration: number;
  hostEmail: string;
  timezone: string;
  registrantsCount: number | null;
  isRecurring: boolean;
}

interface Registrant {
  name: string;
  email: string;
  registrationTime: string;
  city: string;
  state: string;
  country: string;
}

interface RegistrantModal {
  webinarId: string | number;
  occurrenceId: string | null;
  topic: string;
  startTime: string;
}

interface UpcomingResponse {
  days: number;
  count: number;
  webinars: UpcomingWebinar[];
  fetchedAt: string;
  error?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function timeAgo(isoString: string): string {
  if (!isoString) return '';
  const diff = Date.now() - new Date(isoString).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  return `${hrs}h ${mins % 60}m ago`;
}

function hostLabel(email: string): string {
  if (!email) return 'Unknown';
  if (email.includes('dtclass'))         return 'DT Classes';
  if (email.includes('qboclass'))        return 'QBO Classes';
  if (email.includes('intuitwebinar'))   return 'Intuit Webinars';
  if (email.includes('classes'))         return 'General Classes';
  return email.split('@')[0];
}

function hostColor(email: string): string {
  if (email.includes('dtclass'))       return '#ffd700';
  if (email.includes('qboclass'))      return '#00ff88';
  if (email.includes('intuitwebinar')) return '#ff6b6b';
  return '#00d9ff';
}

// ─── Upcoming Section ─────────────────────────────────────────────────────────

function UpcomingSection() {
  const [data, setData]           = useState<UpcomingResponse | null>(null);
  const [loading, setLoading]     = useState(true);
  const [collapsed, setCollapsed] = useState(false);
  const [regModal, setRegModal]   = useState<RegistrantModal | null>(null);
  const [regList, setRegList]     = useState<Registrant[]>([]);
  const [regLoading, setRegLoading] = useState(false);
  const [regError, setRegError]   = useState('');

  useEffect(() => {
    const fetchUpcoming = async () => {
      try {
        const resp = await fetch('/api/webinars-upcoming');
        const json: UpcomingResponse = await resp.json();
        setData(json);
      } catch (e) {
        console.error('Upcoming fetch error:', e);
      } finally {
        setLoading(false);
      }
    };
    fetchUpcoming();
    const interval = setInterval(fetchUpcoming, 10 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const openRegistrants = async (w: UpcomingWebinar) => {
    setRegModal({ webinarId: w.webinarId, occurrenceId: w.occurrenceId, topic: w.topic, startTime: w.startTime });
    setRegList([]);
    setRegError('');
    setRegLoading(true);
    try {
      const params = new URLSearchParams({ webinarId: String(w.webinarId) });
      if (w.occurrenceId) params.set('occurrence_id', w.occurrenceId);
      const resp = await fetch(`/api/webinars-registrants?${params}`);
      const json = await resp.json();
      if (json.error) setRegError(json.error);
      else setRegList(json.registrants || []);
    } catch (e) {
      setRegError(String(e));
    } finally {
      setRegLoading(false);
    }
  };

  // Group webinars by calendar date (CST)
  const grouped = (data?.webinars || []).reduce<Record<string, UpcomingWebinar[]>>((acc, w) => {
    const day = new Date(w.startTime).toLocaleDateString('en-US', {
      timeZone: 'America/Chicago',
      weekday: 'long', month: 'long', day: 'numeric',
    });
    (acc[day] = acc[day] || []).push(w);
    return acc;
  }, {});

  const hasWebinars = data && data.count > 0;

  return (
    <section className="mb-10">
      {/* Header row */}
      <div
        className="flex items-center justify-between mb-5 cursor-pointer select-none"
        onClick={() => setCollapsed(c => !c)}
      >
        <h2 className="text-2xl font-bold flex items-center gap-3">
          <span className="text-xl">📅</span>
          Upcoming Classes
          {!loading && data && (
            <span className="text-sm font-normal text-gray-400 ml-1">
              — next {data.days} days
            </span>
          )}
        </h2>
        <div className="flex items-center gap-3">
          {!loading && (
            <span className="text-sm text-gray-400">{data?.count ?? 0} scheduled</span>
          )}
          <span className="text-gray-400 text-lg">{collapsed ? '▼' : '▲'}</span>
        </div>
      </div>

      {!collapsed && (
        loading ? (
          <div className="text-center py-8 text-gray-400">Loading upcoming classes...</div>
        ) : !hasWebinars ? (
          <div className="bg-white/5 rounded-2xl p-8 border border-white/10 text-center text-gray-400">
            <div className="text-4xl mb-3">📭</div>
            <div className="text-lg font-semibold">No classes scheduled in the next {data?.days ?? 10} days</div>
            {data?.error && <div className="text-red-400 text-sm mt-2">{data.error}</div>}
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(grouped).map(([day, webinars]) => (
              <div key={day}>
                <div className="text-xs font-semibold uppercase tracking-widest text-cyan-400 mb-2 px-1">
                  {day}
                </div>
                <div className="bg-white/5 rounded-2xl border border-white/10 overflow-hidden">
                  {webinars.map((w, i) => {
                    const timeStr = new Date(w.startTime).toLocaleTimeString('en-US', {
                      timeZone: 'America/Chicago',
                      hour: 'numeric', minute: '2-digit', hour12: true,
                    });
                    const color = hostColor(w.hostEmail);
                    return (
                      <div
                        key={`${w.webinarId}-${w.startTime}-${i}`}
                        className="flex items-center gap-4 px-5 py-3 border-t border-white/5 first:border-t-0 hover:bg-white/5 transition-colors"
                        style={{ borderLeft: `3px solid ${color}` }}
                      >
                        {/* Time */}
                        <div className="w-20 shrink-0 text-sm font-mono text-gray-300">{timeStr}</div>

                        {/* Topic */}
                        <div className="flex-1 font-medium text-sm">{w.topic || 'Untitled'}</div>

                        {/* Host badge */}
                        <span
                          className="text-xs font-semibold px-2 py-1 rounded-full shrink-0"
                          style={{ backgroundColor: `${color}22`, color }}
                        >
                          {hostLabel(w.hostEmail)}
                        </span>

                        {/* Duration */}
                        {w.duration > 0 && (
                          <div className="text-xs text-gray-400 shrink-0 w-16 text-right">
                            {w.duration} min
                          </div>
                        )}

                        {/* Registered count + button */}
                        <div className="flex items-center gap-2 shrink-0">
                          {w.registrantsCount != null ? (
                            <span className="text-xs text-cyan-400 font-semibold w-24 text-right">
                              {w.registrantsCount.toLocaleString()} registered
                            </span>
                          ) : (
                            <span className="text-xs text-gray-500 w-24 text-right">—</span>
                          )}
                          <button
                            onClick={() => openRegistrants(w)}
                            className="text-xs bg-cyan-500/20 hover:bg-cyan-500/40 text-cyan-400 px-2 py-1 rounded-lg transition-colors shrink-0"
                          >
                            View
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {/* Registrant Modal */}
      {regModal && (
        <div
          className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
          onClick={() => setRegModal(null)}
        >
          <div
            className="bg-[#1a1a2e] rounded-2xl border border-white/20 w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col"
            onClick={e => e.stopPropagation()}
          >
            <div className="p-6 border-b border-white/10 flex justify-between items-start">
              <div>
                <h3 className="text-xl font-bold">{regModal.topic}</h3>
                <p className="text-gray-400 text-sm mt-1">
                  {new Date(regModal.startTime).toLocaleDateString('en-US', {
                    timeZone: 'America/Chicago', weekday: 'long', month: 'long', day: 'numeric',
                  })}
                  {' · '}
                  {new Date(regModal.startTime).toLocaleTimeString('en-US', {
                    timeZone: 'America/Chicago', hour: 'numeric', minute: '2-digit', hour12: true,
                  })}
                </p>
              </div>
              <button onClick={() => setRegModal(null)} className="text-gray-400 hover:text-white text-2xl">✕</button>
            </div>
            <div className="overflow-y-auto flex-1 p-6">
              {regLoading ? (
                <div className="text-center py-8 text-gray-400">Loading registrants...</div>
              ) : regError ? (
                <div className="text-red-400 text-sm">{regError}</div>
              ) : regList.length === 0 ? (
                <div className="text-center py-8 text-gray-400">No approved registrants found.</div>
              ) : (
                <>
                  <p className="text-sm text-gray-400 mb-4">{regList.length} registered</p>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-cyan-400 text-xs uppercase tracking-wider">
                        <th className="pb-3 pr-4">Name</th>
                        <th className="pb-3">Registered</th>
                      </tr>
                    </thead>
                    <tbody>
                      {regList.map((r, i) => (
                        <tr key={i} className="border-t border-white/5 hover:bg-white/5">
                          <td className="py-2 pr-4 font-medium">{r.name || '—'}</td>
                          <td className="py-2 text-gray-400 text-xs">
                            {r.registrationTime
                              ? new Date(r.registrationTime).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                              : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

// ─── Live Section ─────────────────────────────────────────────────────────────

function LiveSection() {
  const [data, setData]         = useState<LiveResponse | null>(null);
  const [loading, setLoading]   = useState(true);
  const [lastFetch, setLastFetch] = useState('');
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const intervalRef = useRef<NodeJS.Timeout | undefined>(undefined);

  const fetchLive = useCallback(async () => {
    try {
      const resp = await fetch('/api/webinars-live');
      const json: LiveResponse = await resp.json();
      setData(json);
      setLastFetch(new Date().toLocaleTimeString());
    } catch (e) {
      console.error('Live fetch error:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLive();
    intervalRef.current = setInterval(fetchLive, 30_000);
    return () => clearInterval(intervalRef.current);
  }, [fetchLive]);

  const toggleExpand = (id: string) => {
    setExpanded(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  return (
    <section className="mb-10">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-2xl font-bold flex items-center gap-3">
          <span className="inline-block w-3 h-3 rounded-full bg-red-500 animate-pulse" />
          Live Now
        </h2>
        <div className="flex items-center gap-3 text-sm text-gray-400">
          {lastFetch && <span>Updated {lastFetch}</span>}
          <button
            onClick={fetchLive}
            className="bg-white/10 hover:bg-white/20 px-3 py-1 rounded-lg transition-colors"
          >
            ↻ Refresh
          </button>
          <span className="text-gray-500 text-xs">Auto-refreshes every 30s</span>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8 text-gray-400">Loading live data...</div>
      ) : !data?.live || data.webinars.length === 0 ? (
        <div className="bg-white/5 rounded-2xl p-8 border border-white/10 text-center text-gray-400">
          <div className="text-4xl mb-3">📭</div>
          <div className="text-lg font-semibold">No webinars running right now</div>
          {data?.error && <div className="text-red-400 text-sm mt-2">{data.error}</div>}
        </div>
      ) : (
        <div className="grid gap-4">
          {data.webinars.map((w) => {
            const isOpen = expanded.has(w.webinarId);
            const color = hostColor(w.topic || '');
            return (
              <div
                key={w.webinarId}
                className="bg-white/5 rounded-2xl border border-white/10 overflow-hidden"
                style={{ borderLeft: `3px solid ${color}` }}
              >
                {/* Header row */}
                <div
                  className="flex items-center justify-between p-5 cursor-pointer hover:bg-white/5 transition-colors"
                  onClick={() => toggleExpand(w.webinarId)}
                >
                  <div>
                    <div className="font-bold text-lg">{w.topic || 'Untitled Webinar'}</div>
                    <div className="text-sm text-gray-400 mt-1">
                      Started {timeAgo(w.startTime)}
                      {w.host && <span className="ml-3 text-gray-500">• {w.host}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-6 text-right">
                    <div>
                      <div className="text-3xl font-bold text-cyan-400">{w.participantCount}</div>
                      <div className="text-xs text-gray-500">
                        attending{w.registrantsCount ? ` / ${w.registrantsCount} registered` : ''}
                      </div>
                      {w.registrantsCount && w.registrantsCount > 0 && w.participantCount <= w.registrantsCount && (
                        <div className="text-xs text-green-400 font-semibold">
                          {Math.round((w.participantCount / w.registrantsCount) * 100)}% show rate
                        </div>
                      )}
                    </div>
                    <div className="text-gray-400 text-xl">{isOpen ? '▲' : '▼'}</div>
                  </div>
                </div>

                {/* Attendee list */}
                {isOpen && (
                  <div className="border-t border-white/10 p-5">
                    {w.participants.length === 0 ? (
                      <p className="text-gray-400 text-sm">No participant details available.</p>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="text-left text-cyan-400 text-xs uppercase tracking-wider">
                              <th className="pb-3 pr-6">Name</th>
                              <th className="pb-3 pr-6">Joined</th>
                              <th className="pb-3 pr-6">Duration</th>
                              <th className="pb-3">Location</th>
                            </tr>
                          </thead>
                          <tbody>
                            {w.participants.map((p, i) => {
                              const joinedMs = p.joinTime ? Date.now() - new Date(p.joinTime).getTime() : null;
                              const durationMins = joinedMs != null ? Math.floor(joinedMs / 60000) : null;
                              return (
                                <tr key={i} className="border-t border-white/5 hover:bg-white/5">
                                  <td className="py-2 pr-6 font-medium">{p.name || '—'}</td>
                                  <td className="py-2 pr-6 text-gray-400">{p.joinTime ? new Date(p.joinTime).toLocaleTimeString() : '—'}</td>
                                  <td className="py-2 pr-6 text-gray-400">{durationMins != null ? `${durationMins} min` : '—'}</td>
                                  <td className="py-2 text-gray-400">{p.location || '—'}</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

// ─── Historical Section ───────────────────────────────────────────────────────

function HistoricalSection() {
  const [data, setData]                         = useState<HistoryResponse | null>(null);
  const [loading, setLoading]                   = useState(true);
  const [hostFilter, setHostFilter]             = useState('');
  const [topicFilter, setTopicFilter]           = useState('');
  const [fromFilter, setFromFilter]             = useState('');
  const [toFilter, setToFilter]                 = useState('');
  const [showZeroAttendance, setShowZeroAttendance] = useState(false);
  const [drilldown, setDrilldown]               = useState<DrilldownResponse | null>(null);
  const [drillLoading, setDrillLoad]            = useState(false);
  const [page, setPage]                         = useState(1);
  const PAGE_SIZE = 25;

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (hostFilter)  params.set('host', hostFilter);
      if (topicFilter) params.set('topic', topicFilter);
      if (fromFilter)  params.set('from', fromFilter);
      if (toFilter)    params.set('to', toFilter);
      const resp = await fetch(`/api/webinars-history?${params}`);
      const json: HistoryResponse = await resp.json();
      setData(json);
      setPage(1);
    } catch (e) {
      console.error('History fetch error:', e);
    } finally {
      setLoading(false);
    }
  }, [hostFilter, topicFilter, fromFilter, toFilter]);

  useEffect(() => { fetchHistory(); }, [fetchHistory]);

  const openDrilldown = async (webinarId: string) => {
    setDrillLoad(true);
    try {
      const params = new URLSearchParams();
      if (hostFilter)  params.set('host', hostFilter);
      if (fromFilter)  params.set('from', fromFilter);
      if (toFilter)    params.set('to', toFilter);
      params.set('webinarId', webinarId);
      const resp = await fetch(`/api/webinars-history?${params}`);
      const json: DrilldownResponse = await resp.json();
      setDrilldown(json);
    } finally {
      setDrillLoad(false);
    }
  };

  const visibleWebinars = (data?.webinars || []).filter(w => showZeroAttendance || w.attendeeCount > 0);
  const paged = visibleWebinars.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const totalPages = Math.ceil(visibleWebinars.length / PAGE_SIZE);

  return (
    <section>
      <h2 className="text-2xl font-bold mb-5">📊 Historical Attendance</h2>

      {/* Filters */}
      <div className="bg-white/5 rounded-2xl p-4 border border-white/10 mb-6 flex flex-wrap gap-3 items-center">
        <select
          value={hostFilter}
          onChange={e => setHostFilter(e.target.value)}
          className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-cyan-500 text-white"
        >
          <option value="" style={{ color: 'black' }}>All Hosts</option>
          <option value="classes@" style={{ color: 'black' }}>General Classes</option>
          <option value="dtclass" style={{ color: 'black' }}>DT Classes</option>
          <option value="qboclass" style={{ color: 'black' }}>QBO Classes</option>
          <option value="intuitwebinar" style={{ color: 'black' }}>Intuit Webinars</option>
        </select>
        <input
          type="text"
          placeholder="Filter by topic..."
          value={topicFilter}
          onChange={e => setTopicFilter(e.target.value)}
          className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-cyan-500 text-white placeholder-gray-500"
        />
        <input
          type="date"
          value={fromFilter}
          onChange={e => setFromFilter(e.target.value)}
          className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-cyan-500 text-white"
        />
        <span className="text-gray-400 text-sm">to</span>
        <input
          type="date"
          value={toFilter}
          onChange={e => setToFilter(e.target.value)}
          className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-cyan-500 text-white"
        />
        <button
          onClick={() => { setHostFilter(''); setTopicFilter(''); setFromFilter(''); setToFilter(''); setPage(1); }}
          className="bg-white/10 hover:bg-white/20 px-3 py-2 rounded-lg text-sm transition-colors text-gray-300"
        >
          Clear
        </button>
        <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer ml-2">
          <input
            type="checkbox"
            checked={showZeroAttendance}
            onChange={e => { setShowZeroAttendance(e.target.checked); setPage(1); }}
            className="w-4 h-4 accent-cyan-400 cursor-pointer"
          />
          Show classes with zero attendance
        </label>
      </div>

      {/* Summary Cards */}
      {data && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Webinar Sessions', value: data.summary.totalWebinars.toLocaleString() },
            { label: 'Total Attendances', value: data.summary.totalAttendees.toLocaleString() },
            { label: 'Unique Attendees', value: data.summary.uniqueAttendees.toLocaleString() },
            { label: 'Avg per Session', value: data.summary.totalWebinars > 0 ? Math.round(data.summary.totalAttendees / data.summary.totalWebinars) : 0 },
          ].map(card => (
            <div key={card.label} className="bg-white/5 rounded-2xl p-5 border border-white/10">
              <div className="text-xs text-gray-400 uppercase tracking-wider mb-1">{card.label}</div>
              <div className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-green-400 bg-clip-text text-transparent">
                {card.value}
              </div>
            </div>
          ))}
        </div>
      )}

      {loading ? (
        <div className="text-center py-12 text-gray-400">Loading attendance data...</div>
      ) : (
        <>
          {/* Webinar Table */}
          <div className="bg-white/5 rounded-2xl border border-white/10 overflow-hidden mb-4">
            <table className="w-full">
              <thead>
                <tr className="text-left text-cyan-400 text-xs uppercase tracking-wider border-b border-white/10">
                  <th className="p-4">Date</th>
                  <th className="p-4">Topic</th>
                  <th className="p-4">Host</th>
                  <th className="p-4 text-center">Registered</th>
                  <th className="p-4 text-center">Attended</th>
                  <th className="p-4 text-center">Show %</th>
                  <th className="p-4 text-center">Avg Duration</th>
                  <th className="p-4"></th>
                </tr>
              </thead>
              <tbody>
                {paged.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-gray-400">No webinars found</td>
                  </tr>
                ) : (
                  paged.map(w => (
                    <tr key={w.webinarId} className="border-t border-white/5 hover:bg-white/5">
                      <td className="p-4 text-gray-300 whitespace-nowrap">{w.date}</td>
                      <td className="p-4 font-medium">{w.topic || '—'}</td>
                      <td className="p-4">
                        <span
                          className="text-xs font-semibold px-2 py-1 rounded-full"
                          style={{ backgroundColor: `${hostColor(w.hostEmail)}22`, color: hostColor(w.hostEmail) }}
                        >
                          {hostLabel(w.hostEmail)}
                        </span>
                      </td>
                      <td className="p-4 text-center text-gray-400">
                        {w.registrantsCount != null ? w.registrantsCount.toLocaleString() : '—'}
                      </td>
                      <td className="p-4 text-center font-bold text-cyan-400">{w.attendeeCount}</td>
                      <td className="p-4 text-center">
                        {w.attendanceRate != null ? (
                          <span className={`font-semibold ${w.attendanceRate >= 50 ? 'text-green-400' : w.attendanceRate >= 25 ? 'text-yellow-400' : 'text-red-400'}`}>
                            {w.attendanceRate}%
                          </span>
                        ) : '—'}
                      </td>
                      <td className="p-4 text-center text-gray-400">
                        {w.avgDurationMin != null ? `${w.avgDurationMin} min` : '—'}
                      </td>
                      <td className="p-4">
                        <button
                          onClick={() => openDrilldown(w.webinarId)}
                          className="text-xs bg-cyan-500/20 hover:bg-cyan-500/40 text-cyan-400 px-3 py-1 rounded-lg transition-colors"
                        >
                          View attendees
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-3 text-sm">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="bg-white/10 hover:bg-white/20 disabled:opacity-30 px-4 py-2 rounded-lg transition-colors"
              >
                ← Prev
              </button>
              <span className="text-gray-400">Page {page} of {totalPages}</span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="bg-white/10 hover:bg-white/20 disabled:opacity-30 px-4 py-2 rounded-lg transition-colors"
              >
                Next →
              </button>
            </div>
          )}
        </>
      )}

      {/* Drilldown Modal */}
      {(drilldown || drillLoading) && (
        <div
          className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
          onClick={() => setDrilldown(null)}
        >
          <div
            className="bg-[#1a1a2e] rounded-2xl border border-white/20 w-full max-w-4xl max-h-[85vh] overflow-hidden flex flex-col"
            onClick={e => e.stopPropagation()}
          >
            {drillLoading ? (
              <div className="p-12 text-center text-gray-400">Loading attendees...</div>
            ) : drilldown ? (
              <>
                <div className="p-6 border-b border-white/10">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-xl font-bold">{drilldown.topic}</h3>
                      <p className="text-gray-400 text-sm mt-1">
                        {drilldown.date} at {drilldown.startTime} · {hostLabel(drilldown.hostEmail)}
                      </p>
                      <div className="flex items-center gap-4 mt-2">
                        <span className="text-sm font-bold text-cyan-400">{drilldown.total} attended</span>
                        {drilldown.registrantsCount != null && (
                          <>
                            <span className="text-gray-500">·</span>
                            <span className="text-sm text-gray-400">{drilldown.registrantsCount} registered</span>
                            {drilldown.registrantsCount > 0 && drilldown.total <= drilldown.registrantsCount && (
                              <>
                                <span className="text-gray-500">·</span>
                                <span className={`text-sm font-semibold ${
                                  Math.round(drilldown.total / drilldown.registrantsCount * 100) >= 50
                                    ? 'text-green-400'
                                    : Math.round(drilldown.total / drilldown.registrantsCount * 100) >= 25
                                      ? 'text-yellow-400'
                                      : 'text-red-400'
                                }`}>
                                  {Math.round(drilldown.total / drilldown.registrantsCount * 100)}% show rate
                                </span>
                              </>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                    <button onClick={() => setDrilldown(null)} className="text-gray-400 hover:text-white text-2xl">✕</button>
                  </div>
                </div>
                <div className="overflow-y-auto flex-1 p-6">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-cyan-400 text-xs uppercase tracking-wider">
                        <th className="pb-3 pr-4">Name</th>
                        <th className="pb-3 pr-4">Join Time</th>
                        <th className="pb-3 pr-4">Leave Time</th>
                        <th className="pb-3">Duration</th>
                      </tr>
                    </thead>
                    <tbody>
                      {drilldown.attendees.map((a, i) => (
                        <tr key={i} className="border-t border-white/5 hover:bg-white/5">
                          <td className="py-2 pr-4 font-medium">{a.name || '—'}</td>
                          <td className="py-2 pr-4 text-gray-400">{a.joinTime || '—'}</td>
                          <td className="py-2 pr-4 text-gray-400">{a.leaveTime || '—'}</td>
                          <td className="py-2 text-gray-400">{a.durationMin != null ? `${a.durationMin} min` : '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            ) : null}
          </div>
        </div>
      )}
    </section>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function WebinarsDashboard() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a1a2e] to-[#16213e] text-white">
      <div className="max-w-[1400px] mx-auto p-5">
        <header className="text-center py-8 border-b border-white/10 mb-10">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-400 to-green-400 bg-clip-text text-transparent mb-2">
            📡 Webinar Dashboard
          </h1>
          <p className="text-gray-400 text-sm">
            Live attendee feed + historical attendance · All accounts · Auto-updates every 30s
          </p>
        </header>

        <LiveSection />
        <UpcomingSection />
        <HistoricalSection />

        <footer className="text-center text-gray-500 text-sm mt-12 pb-8">
          Data sourced from Zoom Dashboard API · Logged via Webinar Machine · Google Sheets backend
        </footer>
      </div>
    </div>
  );
}
