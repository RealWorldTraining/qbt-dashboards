import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';

// Historical archive spreadsheet
const SPREADSHEET_ID = '1Rf9sf4xEIBhOJZGfA2wvLEmDUNd0onuHBZfCBFXx7y4';
const SHEETS_TO_FETCH = ['Log', 'FY2025 Log', 'FY2024 Log'];

interface TrainerStats {
  name: string;
  sessions: number;
  totalDuration: number;
  durations: number[];
  quick: number;
  long: number;
}

interface RawRow {
  room: string;
  date: Date | null;
  attendee: string;
  trainer: string;
  duration: number | null;
  topic: string;
}

interface FetchResult {
  rows: RawRow[];
  errors: string[];
  sheetCounts: Record<string, number>;
}

async function getGoogleSheetsClient() {
  let privateKey = process.env.GOOGLE_PRIVATE_KEY || '';
  
  privateKey = privateKey.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  
  if (privateKey.includes('\\n')) {
    privateKey = privateKey.replace(/\\n/g, '\n');
  }
  
  if (!privateKey.includes('-----BEGIN PRIVATE KEY-----')) {
    privateKey = `-----BEGIN PRIVATE KEY-----\n${privateKey}\n-----END PRIVATE KEY-----\n`;
  }
  
  const credentials = {
    type: 'service_account',
    project_id: process.env.GOOGLE_PROJECT_ID,
    private_key_id: process.env.GOOGLE_PRIVATE_KEY_ID,
    private_key: privateKey,
    client_email: process.env.GOOGLE_CLIENT_EMAIL,
    client_id: process.env.GOOGLE_CLIENT_ID,
    auth_uri: 'https://accounts.google.com/o/oauth2/auth',
    token_uri: 'https://oauth2.googleapis.com/token',
  };

  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  });

  return google.sheets({ version: 'v4', auth });
}

function parseDate(dateStr: string): Date | null {
  if (!dateStr) return null;
  
  const parts = dateStr.split('/');
  if (parts.length === 3) {
    const month = parseInt(parts[0], 10) - 1;
    const day = parseInt(parts[1], 10);
    let year = parseInt(parts[2], 10);
    
    if (year < 100) {
      year += year < 50 ? 2000 : 1900;
    }
    
    if (year < 2020 || year > 2030) return null;
    
    const date = new Date(year, month, day);
    if (isNaN(date.getTime())) return null;
    return date;
  }
  
  return null;
}

function parseDuration(durationStr: string): number | null {
  if (!durationStr) return null;
  const num = parseFloat(durationStr);
  if (isNaN(num) || num < 0 || num > 480) return null;
  return num;
}

async function fetchAllData(sheets: ReturnType<typeof google.sheets>): Promise<FetchResult> {
  const allRows: RawRow[] = [];
  const errors: string[] = [];
  const sheetCounts: Record<string, number> = {};
  
  for (const sheetName of SHEETS_TO_FETCH) {
    try {
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: `'${sheetName}'!A:G`,
      });
      
      const rows = response.data.values || [];
      let count = 0;
      
      for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        if (!row || row.length < 5) continue;
        
        const trainer = row[3]?.toString().trim();
        if (!trainer || trainer === '' || trainer.toLowerCase() === 'trainer name') continue;
        
        const rawRow: RawRow = {
          room: row[0]?.toString().trim() || '',
          date: parseDate(row[1]?.toString().trim() || ''),
          attendee: row[2]?.toString().trim() || '',
          trainer: trainer,
          duration: parseDuration(row[4]?.toString().trim() || ''),
          topic: row[6]?.toString().trim() || '',
        };
        
        allRows.push(rawRow);
        count++;
      }
      
      sheetCounts[sheetName] = count;
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
      errors.push(`${sheetName}: ${errMsg}`);
    }
  }
  
  return { rows: allRows, errors, sheetCounts };
}

function getDateRange(preset: string, customStart?: string, customEnd?: string): { start: Date; end: Date } {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  switch (preset) {
    case 'this-week': {
      const dayOfWeek = today.getDay();
      const start = new Date(today);
      start.setDate(today.getDate() - dayOfWeek);
      return { start, end: now };
    }
    case 'last-week': {
      const dayOfWeek = today.getDay();
      const end = new Date(today);
      end.setDate(today.getDate() - dayOfWeek - 1);
      end.setHours(23, 59, 59, 999);
      const start = new Date(end);
      start.setDate(end.getDate() - 6);
      start.setHours(0, 0, 0, 0);
      return { start, end };
    }
    case 'this-month': {
      const start = new Date(today.getFullYear(), today.getMonth(), 1);
      return { start, end: now };
    }
    case 'last-month': {
      const start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const end = new Date(today.getFullYear(), today.getMonth(), 0, 23, 59, 59, 999);
      return { start, end };
    }
    case 'this-quarter': {
      const quarter = Math.floor(today.getMonth() / 3);
      const start = new Date(today.getFullYear(), quarter * 3, 1);
      return { start, end: now };
    }
    case 'last-quarter': {
      const quarter = Math.floor(today.getMonth() / 3);
      const start = new Date(today.getFullYear(), (quarter - 1) * 3, 1);
      const end = new Date(today.getFullYear(), quarter * 3, 0, 23, 59, 59, 999);
      return { start, end };
    }
    case 'this-year': {
      const start = new Date(today.getFullYear(), 0, 1);
      return { start, end: now };
    }
    case 'last-year': {
      const start = new Date(today.getFullYear() - 1, 0, 1);
      const end = new Date(today.getFullYear() - 1, 11, 31, 23, 59, 59, 999);
      return { start, end };
    }
    case 'custom': {
      return {
        start: customStart ? new Date(customStart) : new Date(2020, 0, 1),
        end: customEnd ? new Date(customEnd + 'T23:59:59') : now
      };
    }
    default: // all-time
      return { start: new Date(2020, 0, 1), end: now };
  }
}

function filterByDateRange(rows: RawRow[], start: Date, end: Date): RawRow[] {
  return rows.filter(row => {
    if (!row.date) return false;
    return row.date >= start && row.date <= end;
  });
}

function aggregateByTrainer(rows: RawRow[]): TrainerStats[] {
  const trainerMap = new Map<string, TrainerStats>();
  
  for (const row of rows) {
    // Normalize trainer name: capitalize first letter (sue -> Sue)
    const name = row.trainer.charAt(0).toUpperCase() + row.trainer.slice(1);
    
    if (!trainerMap.has(name)) {
      trainerMap.set(name, {
        name,
        sessions: 0,
        totalDuration: 0,
        durations: [],
        quick: 0,
        long: 0,
      });
    }
    
    const stats = trainerMap.get(name)!;
    stats.sessions++;
    
    if (row.duration !== null) {
      stats.totalDuration += row.duration;
      stats.durations.push(row.duration);
      if (row.duration < 5) stats.quick++;
      if (row.duration > 20) stats.long++;
    }
  }
  
  return Array.from(trainerMap.values());
}

function calculateMedian(arr: number[]): number {
  if (arr.length === 0) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

function getDayOfWeekStats(rows: RawRow[]): number[] {
  const counts = [0, 0, 0, 0, 0, 0, 0]; // Sun-Sat
  for (const row of rows) {
    if (row.date) {
      counts[row.date.getDay()]++;
    }
  }
  // Reorder to Mon-Sun
  return [counts[1], counts[2], counts[3], counts[4], counts[5], counts[6], counts[0]];
}

function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

function getDayOfWeekByYear(rows: RawRow[]): Record<string, number[]> {
  // Get current week number
  const now = new Date();
  const currentWeek = getWeekNumber(now);
  
  const yearData: Record<string, number[]> = {
    '2024': [0, 0, 0, 0, 0, 0, 0], // Mon-Sun
    '2025': [0, 0, 0, 0, 0, 0, 0],
    '2026': [0, 0, 0, 0, 0, 0, 0],
  };
  
  for (const row of rows) {
    if (row.date) {
      const year = row.date.getFullYear().toString();
      const weekNum = getWeekNumber(row.date);
      
      // Only include data from the same week number as current week
      if (weekNum === currentWeek && yearData[year]) {
        const dayOfWeek = row.date.getDay();
        // Convert Sun(0) to index 6, Mon(1) to index 0, etc.
        const dayIndex = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
        yearData[year][dayIndex]++;
      }
    }
  }
  
  return yearData;
}

function getTopicStats(rows: RawRow[]): { label: string; count: number }[] {
  const topicMap = new Map<string, number>();
  
  for (const row of rows) {
    if (row.topic && row.topic !== '') {
      topicMap.set(row.topic, (topicMap.get(row.topic) || 0) + 1);
    }
  }
  
  return Array.from(topicMap.entries())
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 15);
}

function getMonthlyByYear(rows: RawRow[]): Record<string, number[]> {
  const yearData: Record<string, number[]> = {
    '2024': new Array(12).fill(0),
    '2025': new Array(12).fill(0),
    '2026': new Array(12).fill(0),
  };
  
  for (const row of rows) {
    if (row.date) {
      const year = row.date.getFullYear().toString();
      const month = row.date.getMonth();
      if (yearData[year]) {
        yearData[year][month]++;
      }
    }
  }
  
  return yearData;
}

function getLastThreeWeeksByDay(rows: RawRow[]): Record<string, number[]> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // Get Monday of current week
  const todayDayOfWeek = today.getDay();
  const mondayOfThisWeek = new Date(today);
  mondayOfThisWeek.setDate(today.getDate() - (todayDayOfWeek === 0 ? 6 : todayDayOfWeek - 1));
  
  // Get Mondays for the 3 weeks
  const week1Start = new Date(mondayOfThisWeek); // This week
  const week2Start = new Date(mondayOfThisWeek);
  week2Start.setDate(week2Start.getDate() - 7); // Last week
  const week3Start = new Date(mondayOfThisWeek);
  week3Start.setDate(week3Start.getDate() - 14); // 2 weeks ago
  
  const weekData: Record<string, number[]> = {
    'This Week': [0, 0, 0, 0, 0], // Mon-Fri
    'Last Week': [0, 0, 0, 0, 0],
    'Two Weeks Ago': [0, 0, 0, 0, 0],
  };
  
  // Map for easy lookup
  const weekMap = {
    'This Week': week1Start,
    'Last Week': week2Start,
    'Two Weeks Ago': week3Start,
  };
  
  for (const row of rows) {
    if (!row.date) continue;
    
    // Check which week this date belongs to
    for (const [weekLabel, weekStart] of Object.entries(weekMap)) {
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 4); // Friday (Mon + 4 days)
      
      if (row.date >= weekStart && row.date <= weekEnd) {
        // Get day of week index (0 = Mon, 4 = Fri)
        const dayOfWeek = row.date.getDay();
        if (dayOfWeek === 0) continue; // Skip Sunday
        const dayIndex = dayOfWeek === 6 ? 4 : dayOfWeek - 1; // Sat shouldn't happen, Fri is index 4
        
        if (dayIndex >= 0 && dayIndex < 5) {
          weekData[weekLabel][dayIndex]++;
        }
        break;
      }
    }
  }
  
  return weekData;
}

function getBusiestDay(rows: RawRow[]): string {
  const dayCounts = getDayOfWeekStats(rows);
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  let maxIdx = 0;
  for (let i = 1; i < dayCounts.length; i++) {
    if (dayCounts[i] > dayCounts[maxIdx]) {
      maxIdx = i;
    }
  }
  return days[maxIdx];
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const preset = searchParams.get('preset') || 'this-week';
    const customStart = searchParams.get('start') || undefined;
    const customEnd = searchParams.get('end') || undefined;
    const debug = searchParams.get('debug') === 'true';
    
    const { start, end } = getDateRange(preset, customStart, customEnd);
    
    const envCheck = {
      hasProjectId: !!process.env.GOOGLE_PROJECT_ID,
      hasPrivateKey: !!process.env.GOOGLE_PRIVATE_KEY,
      hasClientEmail: !!process.env.GOOGLE_CLIENT_EMAIL,
      privateKeyLength: process.env.GOOGLE_PRIVATE_KEY?.length || 0,
      privateKeyStart: process.env.GOOGLE_PRIVATE_KEY?.substring(0, 30),
    };
    
    if (debug) {
      return NextResponse.json({ envCheck, message: 'Debug mode - env vars check' });
    }
    
    const sheets = await getGoogleSheetsClient();
    const fetchResult = await fetchAllData(sheets);
    
    // Filter data by date range
    const filteredRows = filterByDateRange(fetchResult.rows, start, end);
    const trainerStats = aggregateByTrainer(filteredRows);
    
    // Calculate metrics
    const totalSessions = filteredRows.length;
    const sessionsWithDuration = filteredRows.filter(r => r.duration !== null);
    const totalDuration = sessionsWithDuration.reduce((sum, r) => sum + (r.duration || 0), 0);
    const avgDuration = sessionsWithDuration.length > 0 
      ? Math.round((totalDuration / sessionsWithDuration.length) * 10) / 10 
      : 0;
    
    // No-help rate (sessions without trainer interaction - approximated as very short durations)
    const noHelpCount = filteredRows.filter(r => r.duration === null || r.duration === 0).length;
    const noHelpRate = totalSessions > 0 
      ? Math.round((noHelpCount / totalSessions) * 1000) / 10 
      : 0;
    
    const helpedSessions = totalSessions - noHelpCount;
    const busiestDay = getBusiestDay(filteredRows);
    
    // Excluded trainers (case-insensitive)
    const EXCLUDED_TRAINERS = ['x', 'nancy mattar', 'jenna'];
    
    // Helper to normalize name (capitalize first letter)
    const normalizeName = (name: string) => name.charAt(0).toUpperCase() + name.slice(1);
    
    // Helper to check if trainer should be excluded
    const isExcluded = (name: string) => EXCLUDED_TRAINERS.includes(name.toLowerCase());
    
    // Trainer data formatted (with exclusions and name normalization)
    const trainerData = trainerStats
      .map(stats => ({
        name: normalizeName(stats.name),
        sessions: stats.sessions,
        avg: stats.durations.length > 0 
          ? Math.round((stats.totalDuration / stats.durations.length) * 10) / 10 
          : 0,
        median: Math.round(calculateMedian(stats.durations)),
        quick: stats.quick,
        long: stats.long,
        quickPct: stats.sessions > 0 
          ? Math.round((stats.quick / stats.sessions) * 1000) / 10 
          : 0,
      }))
      .filter(t => t.sessions > 0 && !isExcluded(t.name))
      .sort((a, b) => b.sessions - a.sessions);
    
    // Top trainer (fastest average time with minimum 5 sessions)
    const qualifiedTrainers = trainerData.filter(t => t.sessions >= 5 && t.avg > 0);
    const topTrainer = qualifiedTrainers.length > 0
      ? qualifiedTrainers.reduce((best, t) => t.avg < best.avg ? t : best)
      : null;
    
    // Day of week stats
    const dayOfWeekStats = getDayOfWeekStats(filteredRows);
    
    // Day of week by year (for all data, not filtered)
    const dayOfWeekByYear = getDayOfWeekByYear(fetchResult.rows);
    
    // Topic stats
    const topicStats = getTopicStats(filteredRows);
    
    // Monthly by year (for all data, not filtered)
    const monthlyByYear = getMonthlyByYear(fetchResult.rows);
    
    // Last 3 weeks by day (Mon-Fri only)
    const lastThreeWeeksByDay = getLastThreeWeeksByDay(fetchResult.rows);
    
    // Trainer comparison to average
    const trainerComparison = trainerData
      .filter(t => t.sessions >= 3 && t.avg > 0)
      .map(t => ({
        name: t.name,
        avg: t.avg,
        sessions: t.sessions,
        diff: Math.round((t.avg - avgDuration) * 10) / 10,
      }))
      .sort((a, b) => a.avg - b.avg);
    
    return NextResponse.json({
      trainerData,
      summary: {
        totalSessions,
        helpedSessions,
        noHelpRate,
        avgDuration,
        busiestDay,
        trainerCount: trainerData.length,
        topTrainer: topTrainer ? { name: topTrainer.name, avg: topTrainer.avg } : null,
      },
      charts: {
        dayOfWeek: dayOfWeekStats,
        dayOfWeekByYear,
        topics: topicStats,
        monthlyByYear,
        lastThreeWeeksByDay,
        trainerComparison,
      },
      dateRange: {
        start: start.toISOString(),
        end: end.toISOString(),
        preset
      },
      _debug: {
        rawRowCount: fetchResult.rows.length,
        filteredRowCount: filteredRows.length,
        sheetCounts: fetchResult.sheetCounts,
        errors: fetchResult.errors,
      }
    });
    
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch data', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}