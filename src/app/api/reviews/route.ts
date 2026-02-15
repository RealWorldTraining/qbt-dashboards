import { NextResponse } from 'next/server';
import { google } from 'googleapis';

const SPREADSHEET_ID = '1Nh1LRFfI7Ct6p8V34ixZfs51WUepJkQ22EkV7t64eTo';
const SHEET_NAME = 'Reviews';
const RANGE = 'A:P'; // Columns A through P (includes all data + weight calculations)

interface Review {
  entryDate: string;
  firstName: string;
  lastName: string;
  service: string;
  instructor: string;
  stars: number;
  review: string;
  finalWeight: number | string;
  context: number;
  specificity: number;
  actionability: number;
  wordCount: number;
  lengthBonus: number;
  baseScore: number;
}

// Cache reviews in memory for 5 minutes (reduces API calls)
let cachedReviews: Review[] | null = null;
let cacheTimestamp: number = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

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
      // Get status from column AB (column 27, 0-indexed)
      const status = row[27] || ''
      
      // Filter out only "Removed" for qbt-dashboards. Show Unreviewed + Reviewed
      if (status === 'Removed') {
        return null
      }

      return {
        entryDate: row[0] || '',
        firstName: row[1] || '',
        lastName: row[2] || '',
        service: row[4] || '', // Column E
        instructor: row[5] || '', // Column F
        stars: parseInt(row[6]) || 0, // Column G
        review: row[7] || '', // Column H
        finalWeight: row[8] === 'FILTERED' ? 'FILTERED' : parseFloat(row[8]) || 0, // Column I
        context: parseFloat(row[9]) || 0,
        specificity: parseFloat(row[10]) || 0,
        actionability: parseFloat(row[11]) || 0,
        wordCount: parseInt(row[12]) || 0,
        lengthBonus: parseFloat(row[13]) || 0,
        baseScore: parseFloat(row[14]) || 0,
      };
    }).filter(review => review !== null && review.review.trim().length > 0) as Review[];

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

    // Get unique services and instructors for filter dropdowns
    const uniqueServices = [...new Set(reviews.map(r => r.service))].sort();
    const uniqueInstructors = [...new Set(reviews.map(r => r.instructor).filter(i => i.trim().length > 0))].sort();

    return NextResponse.json({
      success: true,
      count: reviews.length,
      reviews,
      filters: {
        services: uniqueServices,
        instructors: uniqueInstructors,
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
