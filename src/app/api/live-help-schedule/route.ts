import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';

// Calendar IDs
const CALENDARS = {
  downhill: 'c_rvpnpf7a91sfes7rgupuspse44@group.calendar.google.com',
  orchard: 'c_rfbutid4abd27f3tdva5ndiudo@group.calendar.google.com',
  backup: 'c_90loedigj7uv56occ9uf0ei1cc@group.calendar.google.com'
};

interface CalendarEvent {
  summary: string;
  start: string;
  end: string;
  trainer?: string;
}

interface HourSchedule {
  hour: string; // "2:00 PM - 3:00 PM"
  hourStart: Date;
  downhill: CalendarEvent[];
  orchard: CalendarEvent[];
  backup: CalendarEvent[];
}

async function getGoogleCalendarClient() {
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
    scopes: ['https://www.googleapis.com/auth/calendar.readonly'],
  });

  return google.calendar({ version: 'v3', auth });
}

async function getCalendarEvents(calendar: any, calendarId: string, timeMin: Date, timeMax: Date): Promise<CalendarEvent[]> {
  try {
    const response = await calendar.events.list({
      calendarId,
      timeMin: timeMin.toISOString(),
      timeMax: timeMax.toISOString(),
      singleEvents: true,
      orderBy: 'startTime',
    });

    const events = response.data.items || [];
    
    return events.map((event: any) => ({
      summary: event.summary || 'Untitled',
      start: event.start.dateTime || event.start.date,
      end: event.end.dateTime || event.end.date,
      trainer: event.summary || 'Untitled'
    }));
  } catch (error) {
    console.error(`Error fetching calendar ${calendarId}:`, error);
    return [];
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const debug = searchParams.get('debug') === 'true';
    
    const calendar = await getGoogleCalendarClient();
    
    // Get current time in CST
    const nowUTC = new Date();
    const nowCSTString = nowUTC.toLocaleString('en-US', { timeZone: 'America/Chicago' });
    const nowCST = new Date(nowCSTString);
    
    const currentHour = nowCST.getHours();
    
    // Debug mode: return raw calendar data
    if (debug) {
      const endTimeUTC = new Date(nowUTC.getTime() + 12 * 60 * 60 * 1000);
      const [downhillEvents, orchardEvents, backupEvents] = await Promise.all([
        getCalendarEvents(calendar, CALENDARS.downhill, nowUTC, endTimeUTC),
        getCalendarEvents(calendar, CALENDARS.orchard, nowUTC, endTimeUTC),
        getCalendarEvents(calendar, CALENDARS.backup, nowUTC, endTimeUTC)
      ]);
      
      return NextResponse.json({
        serverTime: {
          utc: nowUTC.toISOString(),
          cstString: nowCSTString,
          cstParsed: nowCST.toISOString(),
          currentHourCST: currentHour
        },
        calendars: {
          downhill: { id: CALENDARS.downhill, count: downhillEvents.length, events: downhillEvents },
          orchard: { id: CALENDARS.orchard, count: orchardEvents.length, events: orchardEvents },
          backup: { id: CALENDARS.backup, count: backupEvents.length, events: backupEvents }
        }
      });
    }
    
    // Business hours: 7:30 AM - 5:30 PM CST with half-hour blocks
    // Blocks: 7:30-8:30, 8:30-9:30, ..., 4:30-5:30
    const currentMinute = nowCST.getMinutes();
    
    // Check if we're outside business hours
    if (currentHour < 7 || (currentHour === 7 && currentMinute < 30)) {
      return NextResponse.json({ schedules: [], lastUpdated: new Date().toISOString() });
    }
    if (currentHour >= 17 && currentMinute >= 30) {
      return NextResponse.json({ schedules: [], lastUpdated: new Date().toISOString() });
    }
    
    // Calculate which half-hour block we're currently in
    let currentBlockStart = 7; // Start at 7 AM
    if (currentHour > 7 || (currentHour === 7 && currentMinute >= 30)) {
      currentBlockStart = currentHour;
      if (currentMinute < 30) {
        currentBlockStart -= 1; // If before :30, we're in the previous block
      }
      // Adjust to start at :30
      if (currentBlockStart < 7) currentBlockStart = 7;
    }
    
    // Total blocks from 7:30 to 5:30 = 10 blocks
    // 7:30-8:30, 8:30-9:30, 9:30-10:30, 10:30-11:30, 11:30-12:30, 12:30-1:30, 1:30-2:30, 2:30-3:30, 3:30-4:30, 4:30-5:30
    const totalBlocks = 10;
    const firstBlockHour = 7; // 7:30 AM start
    const currentBlockIndex = currentBlockStart - firstBlockHour;
    const blocksToShow = totalBlocks - currentBlockIndex;
    
    // Fetch events from all three calendars (API expects UTC)
    const endTimeUTC = new Date(nowUTC.getTime() + blocksToShow * 60 * 60 * 1000);
    const [downhillEvents, orchardEvents, backupEvents] = await Promise.all([
      getCalendarEvents(calendar, CALENDARS.downhill, nowUTC, endTimeUTC),
      getCalendarEvents(calendar, CALENDARS.orchard, nowUTC, endTimeUTC),
      getCalendarEvents(calendar, CALENDARS.backup, nowUTC, endTimeUTC)
    ]);
    
    // Group events by half-hour blocks (in CST)
    const hourSchedules: HourSchedule[] = [];
    
    for (let i = 0; i < blocksToShow; i++) {
      // Create half-hour block boundaries: X:30 to X+1:30
      const blockHour = firstBlockHour + currentBlockIndex + i;
      const hourStart = new Date(nowCST.getFullYear(), nowCST.getMonth(), nowCST.getDate(), blockHour, 30, 0);
      const hourEnd = new Date(hourStart.getTime() + 60 * 60 * 1000); // +1 hour
      
      const formatHalfHour = (date: Date) => {
        const hours = date.getHours();
        const minutes = date.getMinutes();
        const hours12 = hours % 12 || 12;
        const ampm = hours >= 12 ? 'PM' : 'AM';
        return `${hours12}:${minutes.toString().padStart(2, '0')} ${ampm}`;
      };
      
      const hourLabel = `${formatHalfHour(hourStart)} - ${formatHalfHour(hourEnd)}`;
      
      // Filter events that are ACTIVE during this hour (overlapping)
      const isInHour = (event: CalendarEvent) => {
        const eventStartUTC = new Date(event.start);
        const eventEndUTC = new Date(event.end);
        const eventStartCSTString = eventStartUTC.toLocaleString('en-US', { timeZone: 'America/Chicago' });
        const eventEndCSTString = eventEndUTC.toLocaleString('en-US', { timeZone: 'America/Chicago' });
        const eventStartCST = new Date(eventStartCSTString);
        const eventEndCST = new Date(eventEndCSTString);
        
        // Event overlaps hour if: event_start < hour_end AND event_end > hour_start
        return eventStartCST < hourEnd && eventEndCST > hourStart;
      };
      
      const downhillFiltered = downhillEvents.filter(isInHour);
      const orchardFiltered = orchardEvents.filter(isInHour);
      const backupFiltered = backupEvents.filter(isInHour);
      
      hourSchedules.push({
        hour: hourLabel,
        hourStart: hourStart,
        downhill: downhillFiltered,
        orchard: orchardFiltered,
        backup: backupFiltered
      });
    }
    
    return NextResponse.json({
      schedules: hourSchedules,
      lastUpdated: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Calendar API Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch calendar data', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
