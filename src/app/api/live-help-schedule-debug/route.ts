import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';

// Calendar IDs
const CALENDARS = {
  downhill: 'c_rvpnpf7a91sfes7rgupuspse44@group.calendar.google.com',
  orchard: 'c_rfbutid4abd27f3tdva5ndiudo@group.calendar.google.com',
  backup: 'c_90loedigj7uv56occ9uf0ei1cc@group.calendar.google.com'
};

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

async function getCalendarEvents(calendar: any, calendarId: string, timeMin: Date, timeMax: Date) {
  try {
    const response = await calendar.events.list({
      calendarId,
      timeMin: timeMin.toISOString(),
      timeMax: timeMax.toISOString(),
      singleEvents: true,
      orderBy: 'startTime',
    });

    return response.data.items || [];
  } catch (error) {
    console.error(`Error fetching calendar ${calendarId}:`, error);
    return [];
  }
}

export async function GET(request: NextRequest) {
  try {
    const calendar = await getGoogleCalendarClient();
    
    const nowUTC = new Date();
    const nowCSTString = nowUTC.toLocaleString('en-US', { timeZone: 'America/Chicago' });
    const nowCST = new Date(nowCSTString);
    
    // Fetch next 12 hours of events
    const endTimeUTC = new Date(nowUTC.getTime() + 12 * 60 * 60 * 1000);
    
    const downhillResponse = await calendar.events.list({
      calendarId: CALENDARS.downhill,
      timeMin: nowUTC.toISOString(),
      timeMax: endTimeUTC.toISOString(),
      singleEvents: true,
      orderBy: 'startTime',
    });
    
    const events = downhillResponse.data.items || [];
    
    const debugInfo = {
      serverTime: {
        utc: nowUTC.toISOString(),
        cst: nowCSTString,
        cstParsed: nowCST.toISOString(),
      },
      currentHourCST: nowCST.getHours(),
      calendarId: CALENDARS.downhill,
      totalEvents: events.length,
      events: events.map((event: any) => {
        const startUTC = event.start.dateTime || event.start.date;
        const startCSTString = new Date(startUTC).toLocaleString('en-US', { timeZone: 'America/Chicago' });
        const startCST = new Date(startCSTString);
        
        return {
          summary: event.summary,
          startUTC: startUTC,
          startCSTString: startCSTString,
          startCSTISO: startCST.toISOString(),
          startCSTHour: startCST.getHours(),
          startCSTMinute: startCST.getMinutes(),
          endUTC: event.end.dateTime || event.end.date,
        };
      })
    };
    
    return NextResponse.json(debugInfo, { status: 200 });
    
  } catch (error) {
    return NextResponse.json(
      { 
        error: 'Debug endpoint error', 
        details: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}
