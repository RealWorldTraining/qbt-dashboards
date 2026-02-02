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
    
    const currentHour = nowCST.getHours();
    
    // Determine how many hours to show based on current time
    // Open 7:30 AM - 5:30 PM CST
    // Show up to 5:30 PM (17:30), but display 5:00-5:30 for the last slot
    let hoursToShow = 0;
    if (currentHour >= 7 && currentHour < 17) {
      // Between 7 AM and 5 PM, show remaining hours up to 5 PM
      hoursToShow = 17 - currentHour + 1; // +1 to include current hour
    } else if (currentHour >= 17) {
      // After 5 PM, show just current hour if still in 5-6 range, otherwise show nothing
      hoursToShow = currentHour < 18 ? 1 : 0;
    }
    
    // Fetch events from all three calendars (API expects UTC)
    const endTimeUTC = new Date(nowUTC.getTime() + hoursToShow * 60 * 60 * 1000);
    const [downhillEvents, orchardEvents, backupEvents] = await Promise.all([
      getCalendarEvents(calendar, CALENDARS.downhill, nowUTC, endTimeUTC),
      getCalendarEvents(calendar, CALENDARS.orchard, nowUTC, endTimeUTC),
      getCalendarEvents(calendar, CALENDARS.backup, nowUTC, endTimeUTC)
    ]);
    
    console.log(`[Schedule API] Current time CST: ${nowCSTString}, Hour: ${currentHour}`);
    console.log(`[Schedule API] Total events - Downhill: ${downhillEvents.length}, Orchard: ${orchardEvents.length}, Backup: ${backupEvents.length}`);
    
    // Group events by hour (in CST)
    const hourSchedules: HourSchedule[] = [];
    
    for (let i = 0; i < hoursToShow; i++) {
      // Create hour boundaries in CST
      const hourStart = new Date(nowCST.getFullYear(), nowCST.getMonth(), nowCST.getDate(), nowCST.getHours() + i, 0, 0);
      const hourEnd = new Date(hourStart.getTime() + 60 * 60 * 1000);
      
      // Special case for 5 PM hour - show as 5:00 - 5:30 PM
      const isClosingHour = hourStart.getHours() === 17;
      
      const formatHour = (date: Date) => {
        const hours = date.getHours();
        const hours12 = hours % 12 || 12;
        const ampm = hours >= 12 ? 'PM' : 'AM';
        return `${hours12}:00 ${ampm}`;
      };
      
      let hourLabel: string;
      if (isClosingHour) {
        hourLabel = '5:00 PM - 5:30 PM';
      } else {
        hourLabel = `${formatHour(hourStart)} - ${formatHour(hourEnd)}`;
      }
      
      // Filter events that fall within this hour
      const isInHour = (event: CalendarEvent) => {
        const eventStartUTC = new Date(event.start);
        const eventStartCSTString = eventStartUTC.toLocaleString('en-US', { timeZone: 'America/Chicago' });
        const eventStartCST = new Date(eventStartCSTString);
        
        // For debugging
        if (i === 0) {
          console.log(`[Event Check] Event: ${event.summary}, Start UTC: ${eventStartUTC.toISOString()}, Start CST: ${eventStartCSTString}, Hour start: ${hourStart.toISOString()}, Hour end: ${hourEnd.toISOString()}`);
        }
        
        return eventStartCST >= hourStart && eventStartCST < hourEnd;
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
      
      // Stop at 5:30 PM
      if (isClosingHour) break;
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
