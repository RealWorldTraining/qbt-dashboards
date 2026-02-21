import { NextResponse } from 'next/server';
import { google } from 'googleapis';

const SPREADSHEET_ID = '1Nh1LRFfI7Ct6p8V34ixZfs51WUepJkQ22EkV7t64eTo';
const SHEET_NAME = 'Reviews';
const RANGE = 'A:AC'; // Columns A through AC (includes all data + weight calculations + moderation status + course)

// Default question labels for columns H–P.
// Override any of these at runtime by creating a "Questions" tab in the sheet
// with column A = letter (H, I, J…) and column B = question text.
const DEFAULT_QUESTIONS: Record<string, string> = {
  H: 'What was your favorite part of our training?',
  I: 'What was the most valuable thing you learned during class?',
  J: 'What would you tell a friend or colleague about this class and your instructor?',
  K: 'What was the most valuable thing you learned from the course?',
  L: 'What would you tell a friend or colleague about this course?',
  M: 'How did we help you solve a problem today?',
  N: 'What would you tell a friend or colleague about Live Help and your instructor?',
  O: 'How did our training help you get certified?',
  P: 'Why did you decide to become QuickBooks certified?',
};

// Column letter → 0-based index in the row array
const RESPONSE_COLUMNS: Record<string, number> = {
  H: 7, I: 8, J: 9, K: 10, L: 11, M: 12, N: 13, O: 14, P: 15,
};

interface ReviewResponse {
  question: string;
  answer: string;
}

interface Review {
  entryDate: string;
  firstName: string;
  lastName: string;
  service: string;
  instructor: string;
  stars: number;
  review: string;        // column H — kept for backward compat / search
  responses: ReviewResponse[]; // all non-empty answers H–P with their question labels
  course: string;        // column AC
  finalWeight: number | string;
  context: number;
  specificity: number;
  actionability: number;
  wordCount: number;
  lengthBonus: number;
  baseScore: number;
}

// Cache reviews in memory for 10 seconds for testing (set to 5 minutes in production)
let cachedReviews: Review[] | null = null;
let cacheTimestamp: number = 0;
const CACHE_TTL = 10 * 1000; // 10 seconds for testing

// Fetch question overrides from a "Questions" tab if it exists.
// Falls back to DEFAULT_QUESTIONS if the tab doesn't exist or has no data.
async function fetchQuestionMap(sheets: ReturnType<typeof google.sheets>): Promise<Record<string, string>> {
  try {
    const resp = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Questions!A:C',
    });
    const rows = resp.data.values || [];
    if (rows.length === 0) return DEFAULT_QUESTIONS;
    const map = { ...DEFAULT_QUESTIONS };
    for (const row of rows) {
      // Column B (index 1) = Reviews column letter, Column C (index 2) = question text
      const col = (row[1] || '').toString().trim().toUpperCase();
      const question = (row[2] || '').toString().trim();
      if (col && question && col in RESPONSE_COLUMNS) {
        map[col] = question;
      }
    }
    return map;
  } catch {
    return DEFAULT_QUESTIONS; // tab doesn't exist yet — use defaults
  }
}

async function fetchReviewsFromSheet(): Promise<Review[]> {
  // Check cache first
  const now = Date.now();
  if (cachedReviews && (now - cacheTimestamp) < CACHE_TTL) {
    return cachedReviews;
  }

  // Initialize Google Sheets API with service account
  const auth = new google.auth.GoogleAuth({
    credentials: {
      type: 'service_account',
      project_id: process.env.GOOGLE_PROJECT_ID,
      private_key_id: process.env.GOOGLE_PRIVATE_KEY_ID,
      private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      client_email: process.env.GOOGLE_CLIENT_EMAIL,
      client_id: process.env.GOOGLE_CLIENT_ID,
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  });

  const sheets = google.sheets({ version: 'v4', auth });

  // Fetch question labels fresh each time (separate from review cache — questions change rarely)
  const questionMap = await fetchQuestionMap(sheets);

  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME}!${RANGE}`,
    });

    const rows = response.data.values;

    if (!rows || rows.length === 0) {
      return [];
    }

    // Skip first 2 rows (headers), data starts at row 3
    const reviews: Review[] = rows.slice(2).map((row) => {
      // Get status from column AB (index 27)
      const status = row[27] || '';

      // Filter out only "Removed" for qbt-dashboards. Show Unreviewed + Reviewed
      if (status === 'Removed') return null;

      // Build responses array: one entry per non-empty answer column H–P
      const responses: ReviewResponse[] = Object.entries(RESPONSE_COLUMNS)
        .filter(([, idx]) => {
          const val = (row[idx] || '').toString().trim();
          return val.length > 0;
        })
        .map(([col, idx]) => ({
          question: questionMap[col] || col,
          answer: (row[idx] || '').toString().trim(),
        }));

      return {
        entryDate:    row[0]  || '',
        firstName:    row[1]  || '',
        lastName:     row[2]  || '',
        service:      row[4]  || '',  // col E
        instructor:   row[5]  || '',  // col F
        stars:        parseInt(row[6])  || 0,  // col G
        review:       row[7]  || '',  // col H — kept for search + legacy fallback
        responses,
        course:       (row[28] || '').toString().trim(),  // col AC
        // ── Quality metrics (corrected column indices) ──────────────────
        finalWeight:  row[20] === 'FILTERED' ? 'FILTERED' : parseFloat(row[20]) || 0, // col U
        context:      parseFloat(row[21]) || 0,  // col V
        specificity:  parseFloat(row[22]) || 0,  // col W
        actionability: parseFloat(row[23]) || 0, // col X
        wordCount:    parseInt(row[24])   || 0,  // col Y
        lengthBonus:  parseFloat(row[25]) || 0,  // col Z
        baseScore:    parseFloat(row[26]) || 0,  // col AA
      };
    }).filter(review => review !== null) as Review[];

    // Update cache
    cachedReviews = reviews;
    cacheTimestamp = now;

    return reviews;
  } catch (error) {
    console.error('Error fetching reviews from Google Sheet:', error);
    throw error;
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const service = searchParams.get('service');
    const instructor = searchParams.get('instructor');
    const course = searchParams.get('course');
    const minStars = searchParams.get('minStars');
    const minWeight = searchParams.get('minWeight');

    let reviews = await fetchReviewsFromSheet();

    // Apply filters
    if (service) {
      reviews = reviews.filter(r =>
        r.service.toLowerCase().includes(service.toLowerCase())
      );
    }

    if (instructor) {
      reviews = reviews.filter(r =>
        r.instructor.toLowerCase().includes(instructor.toLowerCase())
      );
    }

    if (course) {
      reviews = reviews.filter(r =>
        r.course.toLowerCase() === course.toLowerCase()
      );
    }

    if (minStars) {
      const minStarsNum = parseInt(minStars);
      reviews = reviews.filter(r => r.stars >= minStarsNum);
    }

    if (minWeight) {
      const minWeightNum = parseFloat(minWeight);
      reviews = reviews.filter(r => 
        typeof r.finalWeight === 'number' && r.finalWeight >= minWeightNum
      );
    }

    // Sort by final weight (highest first)
    reviews.sort((a, b) => {
      const aWeight = typeof a.finalWeight === 'number' ? a.finalWeight : 0;
      const bWeight = typeof b.finalWeight === 'number' ? b.finalWeight : 0;
      return bWeight - aWeight;
    });

    // Get unique values for filter dropdowns (from full unfiltered set so dropdowns stay populated)
    const allReviews = await fetchReviewsFromSheet();
    const uniqueServices    = [...new Set(allReviews.map(r => r.service))].sort();
    const uniqueInstructors = [...new Set(allReviews.map(r => r.instructor).filter(i => i.trim().length > 0))].sort();
    const uniqueCourses     = [...new Set(allReviews.map(r => r.course).filter(c => c.trim().length > 0))].sort();

    return NextResponse.json({
      success: true,
      count: reviews.length,
      reviews,
      filters: {
        services:    uniqueServices,
        instructors: uniqueInstructors,
        courses:     uniqueCourses,
      },
    });
  } catch (error) {
    console.error('Error in reviews API:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch reviews', 
        details: String(error) 
      },
      { status: 500 }
    );
  }
}
