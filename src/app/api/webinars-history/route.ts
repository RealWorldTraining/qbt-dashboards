import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';

const SHEET_ID   = process.env.WEBINAR_SHEET_ID || '1ls07PckO_1jhXSlslrszZxKzt8o2BUDMMY7xcKzC7R4';
const SHEET_TAB  = 'Attendance';

// Column indexes (0-based) matching Webinar Machine's ATTENDANCE_HEADERS
const COL = {
  webinarId:          0,
  topic:              1,
  date:               2,
  startTime:          3,
  hostEmail:          4,
  attendeeName:       5,
  attendeeEmail:      6,
  joinTime:           7,
  leaveTime:          8,
  durationMin:        9,
  attentivenessScore: 10,
  country:            11,
  device:             12,
  status:             13,
  source:             14,
};

async function getSheetsClient() {
  let privateKey = process.env.GOOGLE_PRIVATE_KEY || '';
  privateKey = privateKey.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  if (privateKey.includes('\\n')) privateKey = privateKey.replace(/\\n/g, '\n');

  const credentials = {
    type: 'service_account',
    project_id: process.env.GOOGLE_PROJECT_ID,
    private_key_id: process.env.GOOGLE_PRIVATE_KEY_ID,
    private_key: privateKey,
    client_email: process.env.GOOGLE_CLIENT_EMAIL,
    client_id: process.env.GOOGLE_CLIENT_ID,
  };

  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  });

  return google.sheets({ version: 'v4', auth });
}

// Cache for 2 minutes
let cachedRows: string[][] | null = null;
let cacheTimestamp = 0;
const CACHE_TTL = 2 * 60 * 1000;

async function getAttendanceRows(): Promise<string[][]> {
  const now = Date.now();
  if (cachedRows && now - cacheTimestamp < CACHE_TTL) return cachedRows;

  const sheets = await getSheetsClient();
  const resp = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: `${SHEET_TAB}!A:O`,
  });

  // Skip header row
  const rows = (resp.data.values || []).slice(1).filter(r => r[COL.webinarId]);
  cachedRows = rows as string[][];
  cacheTimestamp = now;
  return cachedRows;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const webinarId = searchParams.get('webinarId'); // drill into one webinar
    const host      = searchParams.get('host');       // filter by host email
    const from      = searchParams.get('from');       // YYYY-MM-DD
    const to        = searchParams.get('to');
    const topic     = searchParams.get('topic');

    const rows = await getAttendanceRows();

    // Apply filters
    let filtered = rows;

    if (host) {
      filtered = filtered.filter(r => (r[COL.hostEmail] || '').toLowerCase().includes(host.toLowerCase()));
    }
    if (topic) {
      filtered = filtered.filter(r => (r[COL.topic] || '').toLowerCase().includes(topic.toLowerCase()));
    }
    if (from || to) {
      filtered = filtered.filter(r => {
        const d = r[COL.date];
        if (!d) return false;
        const parts = d.split('/');
        if (parts.length !== 3) return false;
        const iso = `${parts[2].padStart(4, '20')}-${parts[0].padStart(2, '0')}-${parts[1].padStart(2, '0')}`;
        if (from && iso < from) return false;
        if (to   && iso > to)   return false;
        return true;
      });
    }

    // If drilling into a specific webinar, return all its attendee rows
    if (webinarId) {
      const webinarRows = filtered.filter(r => String(r[COL.webinarId]) === webinarId);
      if (webinarRows.length === 0) {
        return NextResponse.json({ webinarId, attendees: [], total: 0 });
      }
      const meta = webinarRows[0];
      return NextResponse.json({
        webinarId,
        topic: meta[COL.topic],
        date: meta[COL.date],
        startTime: meta[COL.startTime],
        hostEmail: meta[COL.hostEmail],
        total: webinarRows.length,
        attendees: webinarRows.map(r => ({
          name:               r[COL.attendeeName]       || '',
          email:              r[COL.attendeeEmail]      || '',
          joinTime:           r[COL.joinTime]           || '',
          leaveTime:          r[COL.leaveTime]          || '',
          durationMin:        r[COL.durationMin]        ? Number(r[COL.durationMin])        : null,
          attentivenessScore: r[COL.attentivenessScore] ? Number(r[COL.attentivenessScore]) : null,
          country:            r[COL.country]            || '',
          device:             r[COL.device]             || '',
        })),
      });
    }

    // Otherwise group by webinar → summary list
    const webinarMap = new Map<string, {
      webinarId: string;
      topic: string;
      date: string;
      startTime: string;
      hostEmail: string;
      attendeeCount: number;
      totalDurationMin: number;
      durationsWithValue: number;
    }>();

    for (const r of filtered) {
      const id = String(r[COL.webinarId]);
      if (!webinarMap.has(id)) {
        webinarMap.set(id, {
          webinarId: id,
          topic:     r[COL.topic]     || '',
          date:      r[COL.date]      || '',
          startTime: r[COL.startTime] || '',
          hostEmail: r[COL.hostEmail] || '',
          attendeeCount: 0,
          totalDurationMin: 0,
          durationsWithValue: 0,
        });
      }
      const entry = webinarMap.get(id)!;
      entry.attendeeCount++;
      const dur = Number(r[COL.durationMin]);
      if (!isNaN(dur) && dur > 0) {
        entry.totalDurationMin += dur;
        entry.durationsWithValue++;
      }
    }

    // Sort by date desc
    const webinars = Array.from(webinarMap.values())
      .map(w => ({
        ...w,
        avgDurationMin: w.durationsWithValue > 0
          ? Math.round(w.totalDurationMin / w.durationsWithValue)
          : null,
      }))
      .sort((a, b) => {
        // Sort by date desc (M/D/YYYY format)
        const parseDate = (s: string) => {
          const p = s.split('/');
          return p.length === 3 ? `${p[2]}-${p[0].padStart(2,'0')}-${p[1].padStart(2,'0')}` : '';
        };
        return parseDate(b.date).localeCompare(parseDate(a.date));
      });

    // Summary stats
    const totalAttendees    = filtered.length;
    const uniqueEmails      = new Set(filtered.map(r => r[COL.attendeeEmail]).filter(Boolean)).size;
    const uniqueHosts       = [...new Set(webinars.map(w => w.hostEmail).filter(Boolean))];
    const topTopics         = [...webinarMap.values()]
      .sort((a, b) => b.attendeeCount - a.attendeeCount)
      .slice(0, 10)
      .map(w => ({ topic: w.topic, sessions: 1, attendees: w.attendeeCount }));

    return NextResponse.json({
      summary: {
        totalWebinars:   webinars.length,
        totalAttendees,
        uniqueAttendees: uniqueEmails,
        hosts:           uniqueHosts,
      },
      webinars,
      topTopics,
    });
  } catch (error) {
    console.error('Webinar history API error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
