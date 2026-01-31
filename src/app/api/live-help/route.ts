import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';

const SPREADSHEET_ID = '1Rf9sf4xEIBhOJZGfA2wvLEmDUNd0onuHBZfCBFXx7y4';
const SHEETS_TO_FETCH = ['Log', 'FY2025 Log', 'FY2024 Log'];

interface TrainerStats {
  name: string;
  sessions: number;
  totalDuration: number;
  durations: number[];
  quick: number;  // <5 min
  long: number;   // >20 min
}

interface RawRow {
  room: string;
  date: Date | null;
  attendee: string;
  trainer: string;
  duration: number | null;
}

async function getGoogleSheetsClient() {
  // Use service account credentials from environment variables
  const credentials = {
    type: 'service_account',
    project_id: process.env.GOOGLE_PROJECT_ID,
    private_key_id: process.env.GOOGLE_PRIVATE_KEY_ID,
    private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
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
  
  // Handle various date formats
  // M/D/YYYY or MM/DD/YYYY
  const parts = dateStr.split('/');
  if (parts.length === 3) {
    const month = parseInt(parts[0], 10) - 1;
    const day = parseInt(parts[1], 10);
    let year = parseInt(parts[2], 10);
    
    // Handle 2-digit years
    if (year < 100) {
      year += year < 50 ? 2000 : 1900;
    }
    
    // Validate the date is reasonable (between 2020 and 2030)
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
  if (isNaN(num) || num < 0 || num > 480) return null; // Max 8 hours
  return num;
}

async function fetchAllData(sheets: any): Promise<RawRow[]> {
  const allRows: RawRow[] = [];
  
  for (const sheetName of SHEETS_TO_FETCH) {
    try {
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: `'${sheetName}'!A:F`,
      });
      
      const rows = response.data.values || [];
      
      // Skip header row
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
        };
        
        allRows.push(rawRow);
      }
    } catch (error) {
      console.error(`Error fetching sheet ${sheetName}:`, error);
    }
  }
  
  return allRows;
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

function aggregateByTrainer(rows: RawRow[], start: Date, end: Date): TrainerStats[] {
  const trainerMap = new Map<string, TrainerStats>();
  
  for (const row of rows) {
    // Filter by date
    if (row.date) {
      if (row.date < start || row.date > end) continue;
    }
    
    const name = row.trainer;
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

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const preset = searchParams.get('preset') || 'all-time';
    const customStart = searchParams.get('start') || undefined;
    const customEnd = searchParams.get('end') || undefined;
    
    const { start, end } = getDateRange(preset, customStart, customEnd);
    
    const sheets = await getGoogleSheetsClient();
    const rawData = await fetchAllData(sheets);
    const trainerStats = aggregateByTrainer(rawData, start, end);
    
    // Format output
    const trainerData = trainerStats
      .map(stats => ({
        name: stats.name,
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
      .filter(t => t.sessions > 0)
      .sort((a, b) => b.sessions - a.sessions);
    
    // Calculate totals
    const totalSessions = trainerData.reduce((sum, t) => sum + t.sessions, 0);
    const totalWithDuration = trainerStats.reduce((sum, t) => sum + t.durations.length, 0);
    const totalDuration = trainerStats.reduce((sum, t) => sum + t.totalDuration, 0);
    const avgDuration = totalWithDuration > 0 
      ? Math.round((totalDuration / totalWithDuration) * 10) / 10 
      : 0;
    
    return NextResponse.json({
      data: trainerData,
      summary: {
        totalSessions,
        avgDuration,
        trainerCount: trainerData.length,
      },
      dateRange: {
        start: start.toISOString(),
        end: end.toISOString(),
        preset
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
