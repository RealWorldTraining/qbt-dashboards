import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';

// Calendar IDs
const CALENDARS = {
  downhill: 'c_rvpnpf7a91sfes7rgupusps44@group.calendar.google.com',
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
    const calendar = await getGoogleCalendarClient();
    
    // Get current time in CST
    const nowUTC = new Date();
    const nowCSTString = nowUTC.toLocaleString('en-US', { timeZone: 'America/Chicago' });
    const nowCST = new Date(nowCSTString);
    
    // Get events for the next 8 hours in CST
    const endTimeCST = new Date(nowCST.getTime() + 8 * 60 * 60 * 1000);
    
    // Fetch events from all three calendars (API expects UTC)
    const [downhillEvents, orchardEvents, backupEvents] = await Promise.all([
      getCalendarEvents(calendar, CALENDARS.downhill, nowUTC, new Date(nowUTC.getTime() + 8 * 60 * 60 * 1000)),
      getCalendarEvents(calendar, CALENDARS.orchard, nowUTC, new Date(nowUTC.getTime() + 8 * 60 * 60 * 1000)),
      getCalendarEvents(calendar, CALENDARS.backup, nowUTC, new Date(nowUTC.getTime() + 8 * 60 * 60 * 1000))
    ]);
    
    // Group events by hour (in CST)
    const hourSchedules: HourSchedule[] = [];
    
    for (let i = 0; i < 8; i++) {
      // Create hour boundaries in CST
      const hourStart = new Date(nowCST.getFullYear(), nowCST.getMonth(), nowCST.getDate(), nowCST.getHours() + i, 0, 0);
      const hourEnd = new Date(hourStart.getTime() + 60 * 60 * 1000);
      
      const formatHour = (date: Date) => {
        const hours = date.getHours();
        const hours12 = hours % 12 || 12;
        const ampm = hours >= 12 ? 'PM' : 'AM';
        return `${hours12}:00 ${ampm}`;
      };
      
      const hourLabel = `${formatHour(hourStart)} - ${formatHour(hourEnd)}`;
      
      // Filter events that fall within this hour (convert event times to CST for comparison)
      const isInHour = (event: CalendarEvent) => {
        const eventStartUTC = new Date(event.start);
        const eventStartCSTString = eventStartUTC.toLocaleString('en-US', { timeZone: 'America/Chicago' });
        const eventStartCST = new Date(eventStartCSTString);
        return eventStartCST >= hourStart && eventStartCST < hourEnd;
      };
      
      const downhillFiltered = downhillEvents.filter(isInHour);
      const orchardFiltered = orchardEvents.filter(isInHour);
      const backupFiltered = backupEvents.filter(isInHour);
      
      if (i === 0) {
        console.log(`Current hour: ${hourLabel}`);
        console.log(`Downhill events:`, downhillEvents.length, 'filtered:', downhillFiltered.length);
        console.log(`Orchard events:`, orchardEvents.length, 'filtered:', orchardFiltered.length);
        console.log(`Backup events:`, backupEvents.length, 'filtered:', backupFiltered.length);
        if (downhillEvents.length > 0) {
          console.log('Sample Downhill event:', downhillEvents[0]);
        }
      }
      
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
