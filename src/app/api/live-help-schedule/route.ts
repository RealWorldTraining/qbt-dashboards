import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';

// Calendar IDs
const CALENDARS = {
  downhill: 'c_rvpnpf7a91sfes7rgupusps44@group.calendar.google.com',
  orchard: 'c_rfbutid4abd27f3tdva5ndiudo@group.calendar.google.com',
  backup: 'c_rvpnpf7a91sfes7rgupusps44@group.calendar.google.com'
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
    
    // Get events for the next 8 hours, grouped by hour
    const now = new Date();
    const endTime = new Date(now.getTime() + 8 * 60 * 60 * 1000);
    
    // Fetch events from all three calendars
    const [downhillEvents, orchardEvents, backupEvents] = await Promise.all([
      getCalendarEvents(calendar, CALENDARS.downhill, now, endTime),
      getCalendarEvents(calendar, CALENDARS.orchard, now, endTime),
      getCalendarEvents(calendar, CALENDARS.backup, now, endTime)
    ]);
    
    // Group events by hour
    const hourSchedules: HourSchedule[] = [];
    
    for (let i = 0; i < 8; i++) {
      const hourStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours() + i, 0, 0);
      const hourEnd = new Date(hourStart.getTime() + 60 * 60 * 1000);
      
      const formatHour = (date: Date) => {
        const hours = date.getHours();
        const hours12 = hours % 12 || 12;
        const ampm = hours >= 12 ? 'PM' : 'AM';
        return `${hours12}:00 ${ampm}`;
      };
      
      const hourLabel = `${formatHour(hourStart)} - ${formatHour(hourEnd)}`;
      
      // Filter events that fall within this hour
      const isInHour = (event: CalendarEvent) => {
        const eventStart = new Date(event.start);
        return eventStart >= hourStart && eventStart < hourEnd;
      };
      
      hourSchedules.push({
        hour: hourLabel,
        hourStart: hourStart,
        downhill: downhillEvents.filter(isInHour),
        orchard: orchardEvents.filter(isInHour),
        backup: backupEvents.filter(isInHour)
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
