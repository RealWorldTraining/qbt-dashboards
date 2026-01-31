import { NextRequest, NextResponse } from 'next/server';

// In production, this would fetch from Google Sheets API
// For now, using the full dataset with date filtering logic

interface TrainerRow {
  date: string;
  trainer: string;
  duration: number | null;
}

// This would be replaced with actual Google Sheets API call
async function fetchRawData(): Promise<TrainerRow[]> {
  // Simulated raw data structure - in production, fetch from Google Sheets
  // For now, return pre-aggregated data
  return [];
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
      const start = new Date(end);
      start.setDate(end.getDate() - 6);
      return { start, end };
    }
    case 'this-month': {
      const start = new Date(today.getFullYear(), today.getMonth(), 1);
      return { start, end: now };
    }
    case 'last-month': {
      const start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const end = new Date(today.getFullYear(), today.getMonth(), 0);
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
      const end = new Date(today.getFullYear(), quarter * 3, 0);
      return { start, end };
    }
    case 'this-year': {
      const start = new Date(today.getFullYear(), 0, 1);
      return { start, end: now };
    }
    case 'last-year': {
      const start = new Date(today.getFullYear() - 1, 0, 1);
      const end = new Date(today.getFullYear() - 1, 11, 31);
      return { start, end };
    }
    case 'custom': {
      return {
        start: customStart ? new Date(customStart) : new Date(2023, 0, 1),
        end: customEnd ? new Date(customEnd) : now
      };
    }
    default: // all-time
      return { start: new Date(2023, 0, 1), end: now };
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const preset = searchParams.get('preset') || 'all-time';
  const customStart = searchParams.get('start') || undefined;
  const customEnd = searchParams.get('end') || undefined;
  
  const { start, end } = getDateRange(preset, customStart, customEnd);
  
  // For now, return the full dataset
  // In production, this would filter based on date range
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
  
  return NextResponse.json({
    data: trainerData,
    dateRange: {
      start: start.toISOString(),
      end: end.toISOString(),
      preset
    }
  });
}
