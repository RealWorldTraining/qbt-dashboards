import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';

// Real-time Live Help sheet (current tracking)
const LIVE_SPREADSHEET_ID = '1BOFucsKkTjviWQO5724znJOKlN8wuLOLkZiOtsXT7UI';

// Room mapping
const ROOMS = {
  '🌋DOWNHILL': 'Downhill',
  '🌳ORCHARD': 'Orchard',
  '🦙LLAMAS': 'Llamas'
};

interface PersonStatus {
  name: string;
  entered: string;
  left: string;
  trainer_name: string;
  start_time: string;
  end_time: string;
  wait_duration_minutes: number;
  help_duration_minutes: number;
}

interface RoomStatus {
  being_helped: PersonStatus[];
  waiting: PersonStatus[];
  total_current: number;
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

function parseTime(timeStr: string, dateStr?: string): Date | null {
  if (!timeStr || timeStr.trim() === '') return null;
  
  try {
    const timeParts = timeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
    if (!timeParts) return null;
    
    let hours = parseInt(timeParts[1]);
    const minutes = parseInt(timeParts[2]);
    const ampm = timeParts[3].toUpperCase();
    
    if (ampm === 'PM' && hours !== 12) hours += 12;
    if (ampm === 'AM' && hours === 12) hours = 0;
    
    // Parse date (or use today)
    let year: number, month: number, day: number;
    
    if (dateStr) {
      // Parse date like "2/2/26"
      const dateParts = dateStr.split('/');
      month = parseInt(dateParts[0]) - 1; // 0-indexed for Date
      day = parseInt(dateParts[1]);
      year = parseInt(dateParts[2]);
      if (year < 100) year += 2000;
    } else {
      const now = new Date();
      year = now.getFullYear();
      month = now.getMonth();
      day = now.getDate();
    }
    
    // The time from the sheet is in CST
    // CST is UTC-6 (standard) or UTC-5 (daylight CDT)
    // Create the date as if it were UTC, then adjust for CST offset
    
    // Determine if this date would be in CST (winter) or CDT (summer)
    // DST in Chicago: second Sunday March through first Sunday November
    // Simplified: use month check
    const isDST = month >= 2 && month <= 10; // March-November might be CDT
    const cstOffsetMinutes = isDST ? -300 : -360; // CDT is UTC-5, CST is UTC-6 (negative because behind UTC)
    
    // Create date in local server time first
    const localDate = new Date(year, month, day, hours, minutes, 0, 0);
    
    // Get server's timezone offset
    const serverOffsetMinutes = localDate.getTimezoneOffset();
    
    // Adjust from server timezone to CST
    // If server is UTC (offset=0) and we want CST (offset=-360), we need to add 360 minutes to the timestamp
    const adjustmentMs = (serverOffsetMinutes - cstOffsetMinutes) * 60 * 1000;
    
    const cstDate = new Date(localDate.getTime() + adjustmentMs);
    
    return cstDate;
  } catch (error) {
    console.error('parseTime error:', error);
    return null;
  }
}

function getTodayString(): string {
  const today = new Date();
  const month = today.getMonth() + 1;
  const day = today.getDate();
  return `${month}/${day}`;
}

function calculateDurationMinutes(startStr: string, endStr: string, dateStr: string): number {
  const startDt = parseTime(startStr, dateStr);
  const endDt = parseTime(endStr, dateStr);
  
  if (startDt && endDt) {
    const delta = endDt.getTime() - startDt.getTime();
    return delta / (1000 * 60); // Convert to minutes
  }
  return 0;
}

async function getRoomData(sheets: ReturnType<typeof google.sheets>, roomName: string): Promise<any[]> {
  try {
    const result = await sheets.spreadsheets.values.get({
      spreadsheetId: LIVE_SPREADSHEET_ID,
      range: `${roomName}!A:J`
    });
    
    const rows = result.data.values || [];
    if (rows.length <= 4) return []; // No data beyond headers
    
    // Process data rows (skip headers at row 4, index 3)
    const data = [];
    for (let i = 4; i < rows.length; i++) {
      const row = rows[i];
      if (row.length >= 4 && row[3] && row[3].toString().trim()) {
        data.push({
          row: i + 1,
          date: row[1] || '',           // B: Date 
          entered: row[2] || '',        // C: Entered
          attendee_name: row[3] || '',  // D: Attendee Name
          left: row[4] || '',           // E: Left
          trainer_name: row[5] || '',   // F: Trainer Name
          click_start: row[6] || '',    // G: Click to start
          click_end: row[7] || '',      // H: Click to end  
          start_time: row[8] || '',     // I: Start time
          end_time: row[9] || ''        // J: End time
        });
      }
    }
    
    return data;
  } catch (error) {
    console.error(`Error reading ${roomName}:`, error);
    return [];
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'current-status';
    
    const sheets = await getGoogleSheetsClient();
    const today = getTodayString();
    
    if (action === 'current-status') {
      // Real-time room status
      const status: Record<string, RoomStatus> = {};
      
      for (const [roomEmoji, roomDisplay] of Object.entries(ROOMS)) {
        const roomData = await getRoomData(sheets, roomEmoji);
        
        // Filter to today's data
        const todayData = roomData.filter(row => row.date === today);
        
        // Find people currently in room (no "left" time)
        const currentPeople = todayData.filter(row => !row.left || row.left.toString().trim() === '');
        
        // Categorize current people
        const beingHelped: PersonStatus[] = [];
        const waiting: PersonStatus[] = [];
        
        for (const person of currentPeople) {
          const trainer = person.trainer_name ? person.trainer_name.toString().trim() : '';
          
          if (trainer && trainer !== 'X') {
            // Being helped
            const helpStarted = person.start_time ? person.start_time.toString() : '';
            
            // Calculate duration from start_time to now (in CST)
            let helpDuration = 0;
            if (helpStarted) {
              const startDt = parseTime(helpStarted, person.date);
              const now = new Date(); // UTC time
              if (startDt) {
                const deltaMs = now.getTime() - startDt.getTime();
                helpDuration = Math.max(0, Math.round((deltaMs / (1000 * 60)) * 10) / 10);
              }
            }
            
            beingHelped.push({
              name: person.attendee_name,
              entered: person.entered.toString(),
              left: '',
              trainer_name: trainer,
              start_time: helpStarted,
              end_time: '',
              help_duration_minutes: Math.round(helpDuration * 10) / 10,
              wait_duration_minutes: 0
            });
          } else {
            // Waiting
            const entered = person.entered ? person.entered.toString() : '';
            
            // Calculate wait duration from entered to now
            let waitDuration = 0;
            if (entered) {
              const enteredDt = parseTime(entered, person.date);
              const now = new Date(); // UTC time
              if (enteredDt) {
                const deltaMs = now.getTime() - enteredDt.getTime();
                waitDuration = Math.max(0, Math.round((deltaMs / (1000 * 60)) * 10) / 10);
              }
            }
            
            waiting.push({
              name: person.attendee_name,
              entered: entered,
              left: '',
              trainer_name: '',
              start_time: '',
              end_time: '',
              wait_duration_minutes: Math.round(waitDuration * 10) / 10,
              help_duration_minutes: 0
            });
          }
        }
        
        status[roomDisplay] = {
          being_helped: beingHelped,
          waiting: waiting,
          total_current: currentPeople.length
        };
      }
      
      return NextResponse.json(status);
    }
    
    if (action === 'today-stats') {
      // Today's statistics
      let allTodayData: any[] = [];
      
      // Collect all today's data from all rooms
      for (const [roomEmoji, roomDisplay] of Object.entries(ROOMS)) {
        const roomData = await getRoomData(sheets, roomEmoji);
        const todayRoomData = roomData
          .filter(row => row.date === today)
          .map(row => ({ ...row, room: roomDisplay }));
        allTodayData = allTodayData.concat(todayRoomData);
      }
      
      // Calculate stats
      const totalVisits = allTodayData.length;
      const completedVisits = allTodayData.filter(row => row.left && row.left.toString().trim() !== '');
      
      // Average help duration (for completed sessions with trainer)
      const helpDurations: number[] = [];
      for (const row of completedVisits) {
        const trainer = row.trainer_name ? row.trainer_name.toString().trim() : '';
        if (trainer && trainer !== 'X') {
          const duration = calculateDurationMinutes(
            row.start_time ? row.start_time.toString() : '',
            row.end_time ? row.end_time.toString() : '',
            row.date
          );
          if (duration > 0) {
            helpDurations.push(duration);
          }
        }
      }
      
      const avgHelpDuration = helpDurations.length > 0 
        ? helpDurations.reduce((a, b) => a + b, 0) / helpDurations.length 
        : 0;
      
      // Hourly breakdown (in CST)
      const hourlyLogins = new Array(24).fill(0);
      for (const row of allTodayData) {
        const enteredStr = row.entered ? row.entered.toString() : '';
        if (enteredStr) {
          // Parse the hour directly from the time string (e.g., "2:23 PM")
          const timeParts = enteredStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
          if (timeParts) {
            let hours = parseInt(timeParts[1]);
            const ampm = timeParts[3].toUpperCase();
            if (ampm === 'PM' && hours !== 12) hours += 12;
            if (ampm === 'AM' && hours === 12) hours = 0;
            hourlyLogins[hours]++;
          }
        }
      }
      
      const hourlyData = hourlyLogins.map((logins, hour) => ({ hour, logins }));
      
      return NextResponse.json({
        total_visits: totalVisits,
        completed_visits: completedVisits.length,
        average_help_duration_minutes: Math.round(avgHelpDuration * 10) / 10,
        hourly_logins: hourlyData,
        help_sessions: helpDurations.length
      });
    }
    
    if (action === 'trainer-performance') {
      // Trainer performance for today
      let allTodayData: any[] = [];
      
      for (const [roomEmoji, roomDisplay] of Object.entries(ROOMS)) {
        const roomData = await getRoomData(sheets, roomEmoji);
        const todayRoomData = roomData
          .filter(row => row.date === today)
          .map(row => ({ ...row, room: roomDisplay }));
        allTodayData = allTodayData.concat(todayRoomData);
      }
      
      // Calculate per-trainer stats
      const trainerStats: Record<string, { sessions: number; total_duration: number; avg_duration: number }> = {};
      
      for (const row of allTodayData) {
        const trainer = row.trainer_name ? row.trainer_name.toString().trim() : '';
        if (trainer && trainer !== 'X') {
          if (!trainerStats[trainer]) {
            trainerStats[trainer] = { sessions: 0, total_duration: 0, avg_duration: 0 };
          }
          
          const duration = calculateDurationMinutes(
            row.start_time ? row.start_time.toString() : '',
            row.end_time ? row.end_time.toString() : '',
            row.date
          );
          
          trainerStats[trainer].sessions++;
          trainerStats[trainer].total_duration += duration;
        }
      }
      
      // Calculate averages
      for (const [trainer, stats] of Object.entries(trainerStats)) {
        if (stats.sessions > 0) {
          stats.avg_duration = Math.round((stats.total_duration / stats.sessions) * 10) / 10;
        }
      }
      
      return NextResponse.json(trainerStats);
    }
    
    if (action === 'top-attendees') {
      // Top 5 attendees by total HELP DURATION (start_time to end_time) today
      let allTodayData: any[] = [];
      
      for (const [roomEmoji, roomDisplay] of Object.entries(ROOMS)) {
        const roomData = await getRoomData(sheets, roomEmoji);
        const todayRoomData = roomData
          .filter(row => row.date === today)
          .map(row => ({ ...row, room: roomDisplay }));
        allTodayData = allTodayData.concat(todayRoomData);
      }
      
      // Calculate total HELP DURATION per attendee (start_time → end_time)
      const attendeeTotals: Record<string, number> = {};
      
      for (const row of allTodayData) {
        const name = row.attendee_name ? row.attendee_name.toString().trim() : '';
        if (!name) continue;
        
        const startTime = row.start_time ? row.start_time.toString().trim() : '';
        const endTime = row.end_time ? row.end_time.toString().trim() : '';
        
        // Only count sessions where they were actually helped (have start_time)
        if (!startTime || startTime === '') continue;
        
        let duration = 0;
        if (endTime && endTime !== '') {
          // Completed help session - calculate duration from start_time to end_time
          duration = calculateDurationMinutes(startTime, endTime, row.date);
        } else {
          // Currently being helped - calculate from start_time to now
          const startDt = parseTime(startTime, row.date);
          const now = new Date();
          if (startDt) {
            const deltaMs = now.getTime() - startDt.getTime();
            duration = Math.max(0, deltaMs / (1000 * 60));
          }
        }
        
        if (duration > 0) {
          if (!attendeeTotals[name]) {
            attendeeTotals[name] = 0;
          }
          attendeeTotals[name] += duration;
        }
      }
      
      // Sort and get top 5
      const top5 = Object.entries(attendeeTotals)
        .map(([name, minutes]) => ({
          name,
          minutes: Math.round(minutes * 10) / 10,
          hours: Math.round((minutes / 60) * 100) / 100
        }))
        .sort((a, b) => b.minutes - a.minutes)
        .slice(0, 5);
      
      return NextResponse.json(top5);
    }
    
    return NextResponse.json({ error: 'Invalid action parameter' }, { status: 400 });
    
  } catch (error) {
    console.error('Live Help API Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch live data', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}