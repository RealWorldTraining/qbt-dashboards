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

interface ProcessedMeta {
  topic: string;
  participantCount: number;
  registrantsCount: number | null;
  date: string;
  hostEmail: string;
  startTime: string;
}

// Processed webinar metadata cache (separate — changes less often)
let cachedProcessed: Map<string, ProcessedMeta> | null = null;
let processedCacheTimestamp = 0;

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

async function getProcessedWebinarMeta(): Promise<Map<string, ProcessedMeta>> {
  const now = Date.now();
  if (cachedProcessed && now - processedCacheTimestamp < CACHE_TTL) return cachedProcessed;

  try {
    const sheets = await getSheetsClient();
    const resp = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: `Processed Webinars!A:I`,
    });
    const rows = (resp.data.values || []).slice(1); // skip header
    const map = new Map<string, ProcessedMeta>();
    for (const row of rows) {
      const id = String(row[0] || '');
      if (!id) continue;
      const participantCount = row[3] !== undefined && row[3] !== '' ? Number(row[3]) : 0;
      const registrantsCount = row[5] !== undefined && row[5] !== '' ? Number(row[5]) : null;
      map.set(id, {
        topic:          String(row[1] || ''),
        participantCount: isNaN(participantCount) ? 0 : participantCount,
        registrantsCount: (registrantsCount != null && !isNaN(registrantsCount) && registrantsCount > 0) ? registrantsCount : null,
        date:      String(row[6] || ''),
        hostEmail: String(row[7] || ''),
        startTime: String(row[8] || ''),
      });
    }
    cachedProcessed = map;
    processedCacheTimestamp = now;
    return map;
  } catch (err) {
    console.error('Failed to read processed webinar metadata:', err);
    return new Map();
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const webinarId = searchParams.get('webinarId'); // drill into one webinar
    const host      = searchParams.get('host');       // filter by host email
    const from      = searchParams.get('from');       // YYYY-MM-DD
    const to        = searchParams.get('to');
    const topic     = searchParams.get('topic');

    const [rows, processedMap] = await Promise.all([
      getAttendanceRows(),
      getProcessedWebinarMeta(),
    ]);

    // Always filter out internal staff
    let filtered = rows.filter(r => {
      const email = (r[COL.attendeeEmail] || '').toLowerCase();
      return !email.includes('@quickbookstraining.com');
    });

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
      const externalRows = webinarRows.filter(r =>
        !((r[COL.attendeeEmail] || '').toLowerCase().includes('@quickbookstraining.com'))
      );

      // Merge duplicate rows for the same attendee (rejoins)
      const dedupMap = new Map<string, {
        name: string; joinTime: string; leaveTime: string; totalDuration: number;
      }>();
      let noKeyCount = 0;
      for (const r of externalRows) {
        const email = (r[COL.attendeeEmail] || '').toLowerCase().trim();
        const name  = (r[COL.attendeeName]  || '').toLowerCase().trim();
        const key   = email || name;
        const dur   = r[COL.durationMin] ? Number(r[COL.durationMin]) : 0;

        if (!key) {
          // No identifier — keep as-is with a synthetic key
          dedupMap.set(`__nokey_${noKeyCount++}`, {
            name: r[COL.attendeeName] || '',
            joinTime:  r[COL.joinTime]  || '',
            leaveTime: r[COL.leaveTime] || '',
            totalDuration: dur,
          });
          continue;
        }

        if (!dedupMap.has(key)) {
          dedupMap.set(key, {
            name: r[COL.attendeeName] || '',
            joinTime:  r[COL.joinTime]  || '',
            leaveTime: r[COL.leaveTime] || '',
            totalDuration: dur,
          });
        } else {
          const existing = dedupMap.get(key)!;
          existing.totalDuration += dur;
          // Earliest join time (string compare works for CST locale strings here —
          // imperfect but good enough; exact order matters less than merged duration)
          if (r[COL.joinTime] && (!existing.joinTime || r[COL.joinTime] < existing.joinTime)) {
            existing.joinTime = r[COL.joinTime];
          }
          if (r[COL.leaveTime] && r[COL.leaveTime] > (existing.leaveTime || '')) {
            existing.leaveTime = r[COL.leaveTime];
          }
        }
      }

      const attendees = Array.from(dedupMap.values()).map(a => ({
        name:        a.name,
        joinTime:    a.joinTime,
        leaveTime:   a.leaveTime,
        durationMin: a.totalDuration > 0 ? a.totalDuration : null,
      }));

      const registrantsCount = processedMap.get(webinarId)?.registrantsCount ?? null;
      return NextResponse.json({
        webinarId,
        topic: meta[COL.topic],
        date: meta[COL.date],
        startTime: meta[COL.startTime],
        hostEmail: meta[COL.hostEmail],
        registrantsCount,
        total: attendees.length,
        attendees,
      });
    }

    // Otherwise group by webinar → summary list
    // Track unique attendees per webinar to avoid counting rejoins as separate people
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
    const webinarAttendees = new Map<string, Set<string>>(); // webinarId -> unique attendee keys

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
        webinarAttendees.set(id, new Set());
      }
      const entry      = webinarMap.get(id)!;
      const attendeeSet = webinarAttendees.get(id)!;

      // Dedup key: email preferred, fall back to name
      const email = (r[COL.attendeeEmail] || '').toLowerCase().trim();
      const name  = (r[COL.attendeeName]  || '').toLowerCase().trim();
      const key   = email || name;

      if (!key || !attendeeSet.has(key)) {
        if (key) attendeeSet.add(key);
        entry.attendeeCount++;
      }
      // Always accumulate duration (summed across rejoins for avg calculation)
      const dur = Number(r[COL.durationMin]);
      if (!isNaN(dur) && dur > 0) {
        entry.totalDurationMin += dur;
        entry.durationsWithValue++;
      }
    }

    // Merge in zero-external-attendance webinars from the Processed Webinars tab.
    // We check webinarMap (built from the Attendance tab) rather than participantCount,
    // because participantCount includes internal @quickbookstraining.com staff — a
    // webinar where only staff joined would have participantCount > 0 but 0 external rows.
    for (const [id, meta] of processedMap.entries()) {
      if (webinarMap.has(id)) continue; // already has external attendance rows

      // Apply the same filters (skip if metadata doesn't match)
      if (host && meta.hostEmail && !meta.hostEmail.toLowerCase().includes(host.toLowerCase())) continue;
      if (topic && meta.topic && !meta.topic.toLowerCase().includes(topic.toLowerCase())) continue;
      if ((from || to) && meta.date) {
        const parts = meta.date.split('/');
        if (parts.length === 3) {
          const iso = `${parts[2].padStart(4, '20')}-${parts[0].padStart(2, '0')}-${parts[1].padStart(2, '0')}`;
          if (from && iso < from) continue;
          if (to   && iso > to)   continue;
        }
      }

      webinarMap.set(id, {
        webinarId:          id,
        topic:              meta.topic,
        date:               meta.date,
        startTime:          meta.startTime,
        hostEmail:          meta.hostEmail,
        attendeeCount:      0,
        totalDurationMin:   0,
        durationsWithValue: 0,
      });
    }

    // Sort by date desc
    const webinars = Array.from(webinarMap.values())
      .map(w => {
        const meta = processedMap.get(w.webinarId);
        const registrantsCount = meta?.registrantsCount ?? null;
        // Only compute show rate when registered >= attended; otherwise the
        // numbers aren't comparable (recurring webinar occurrence mismatch)
        const attendanceRate = (registrantsCount != null && registrantsCount > 0 && w.attendeeCount <= registrantsCount)
          ? Math.round((w.attendeeCount / registrantsCount) * 100)
          : null;
        return {
          ...w,
          avgDurationMin: w.durationsWithValue > 0
            ? Math.round(w.totalDurationMin / w.durationsWithValue)
            : null,
          registrantsCount,
          attendanceRate,
        };
      })
      .sort((a, b) => {
        // Sort by date desc (M/D/YYYY format)
        const parseDate = (s: string) => {
          const p = s.split('/');
          return p.length === 3 ? `${p[2]}-${p[0].padStart(2,'0')}-${p[1].padStart(2,'0')}` : '';
        };
        return parseDate(b.date).localeCompare(parseDate(a.date));
      });

    // Summary stats — use deduped attendee counts from webinarMap
    const totalAttendees = Array.from(webinarMap.values()).reduce((sum, w) => sum + w.attendeeCount, 0);
    const uniqueEmails   = new Set(filtered.map(r => r[COL.attendeeEmail]).filter(Boolean)).size;
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
