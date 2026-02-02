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
    
    // Parse date (or use today in CST)
    let year: number, month: number, day: number;
    
    if (dateStr) {
      // Parse date like "2/2/26"
      const dateParts = dateStr.split('/');
      month = parseInt(dateParts[0]);
      day = parseInt(dateParts[1]);
      year = parseInt(dateParts[2]);
      if (year < 100) year += 2000;
    } else {
      // Use today's date in CST
      const nowCST = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Chicago' }));
      year = nowCST.getFullYear();
      month = nowCST.getMonth() + 1;
      day = nowCST.getDate();
    }
    
    // Build date string that will be interpreted as CST
    // Approach: create a string representation and parse it as CST using toLocaleString
    const monthStr = String(month).padStart(2, '0');
    const dayStr = String(day).padStart(2, '0');
    const hoursStr = String(hours).padStart(2, '0');
    const minutesStr = String(minutes).padStart(2, '0');
    
    // Create string: "2/2/2026, 2:46:00 PM" format
    const ampmStr = hours >= 12 ? 'PM' : 'AM';
    const hours12 = hours % 12 || 12;
    const dateStringCST = `${month}/${day}/${year}, ${hours12}:${String(minutes).padStart(2, '0')}:00 ${ampmStr}`;
    
    // Parse this string as a US date - it will use local timezone
    // Then adjust for CST offset
    const localDate = new Date(dateStringCST);
    
    // Calculate CST offset: CST is -6 hours from UTC (or -5 during DST)
    // Get what the UTC time would be if this were CST
    const offsetMinutes = 6 * 60; // CST offset (will auto-adjust for DST based on date)
    
    // Check if this date would be in DST
    const jan = new Date(year, 0, 1);
    const jul = new Date(year, 6, 1);
    const stdOffset = Math.max(jan.getTimezoneOffset(), jul.getTimezoneOffset());
    const testDate = new Date(year, month - 1, day);
    const isDST = testDate.getTimezoneOffset() < stdOffset;
    
    const cstOffsetHours = isDST ? 5 : 6; // CDT is UTC-5, CST is UTC-6
    
    // Build the UTC timestamp for this CST time
    const utcTimestamp = Date.UTC(year, month - 1, day, hours + cstOffsetHours, minutes, 0);
    
    return new Date(utcTimestamp);
  } catch (error) {
    console.error('parseTime error:', error);
    return null;
  }
}

function getTodayString(): string {
  const today = new Date();
  const month = today.getMonth() + 1;
  const day = today.getDate();
  const year = today.getFullYear() % 100;
  return `${month}/${day}/${year}`;
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
              // Get current time in CST
              const nowCST = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Chicago' }));
              if (startDt) {
                const deltaMs = nowCST.getTime() - startDt.getTime();
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
              // Get current time in CST
              const nowCST = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Chicago' }));
              if (enteredDt) {
                const deltaMs = nowCST.getTime() - enteredDt.getTime();
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
      
      // Hourly breakdown
      const hourlyLogins = new Array(24).fill(0);
      for (const row of allTodayData) {
        const enteredDt = parseTime(row.entered ? row.entered.toString() : '', row.date);
        if (enteredDt) {
          hourlyLogins[enteredDt.getHours()]++;
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
    
    return NextResponse.json({ error: 'Invalid action parameter' }, { status: 400 });
    
  } catch (error) {
    console.error('Live Help API Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch live data', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}