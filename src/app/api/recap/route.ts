import { NextRequest, NextResponse } from 'next/server';
import { writeFile, readFile } from 'fs/promises';
import path from 'path';

// Use /tmp for Vercel serverless (writable but ephemeral)
const TMP_FILE = '/tmp/recap-data.json';

// Static fallback file bundled with the build (persistent across deploys)
// This file is committed to git and serves as the default/fallback data
const STATIC_FILE = path.join(process.cwd(), '.recap-data', 'recap-data.json');

// In-memory cache for fast access within a serverless function instance
let inMemoryData: RecapData | null = null;

export interface RecapData {
  displayMonth: string;
  months: string[];
  profitShare: number[];
  trainingPlans: number[];
  renewals: number[];
  subscribers: number[];
  newVisitors: number[];
  paidVisitors: number[];
  cpc: number[];
  refundPct: number[];
  intuitSales: number[];
  refundDollars: number[];
  chargebackDollars: number[];
  learnerUnits: number[];
  certUnits: number[];
  teamUnits: number[];
  cancels: number[];
  comments: Record<string, string>;
  expenseItems: string[];
}

// POST - Receive data from n8n
export async function POST(request: NextRequest) {
  try {
    // Verify auth header
    const authHeader = request.headers.get('authorization');
    const expectedToken = process.env.RECAP_WEBHOOK_TOKEN || 'recap-secret-token';

    if (authHeader !== `Bearer ${expectedToken}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data: RecapData = await request.json();

    // Validate required fields
    if (!data.displayMonth || !data.months || !data.profitShare) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Store in memory (always works)
    inMemoryData = data;

    // Also try to write to /tmp (works on Vercel serverless, ephemeral)
    try {
      await writeFile(TMP_FILE, JSON.stringify(data, null, 2));
    } catch (fileError) {
      console.log('Could not write to /tmp, using in-memory only:', fileError);
    }

    return NextResponse.json({
      success: true,
      message: `Recap data updated for ${data.displayMonth}`,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error saving recap data:', error);
    return NextResponse.json({ error: 'Failed to save data', details: String(error) }, { status: 500 });
  }
}

// GET - Retrieve current data with fallback chain
export async function GET() {
  // 1. Try in-memory first (fastest, within same function instance)
  if (inMemoryData) {
    return NextResponse.json({ ...inMemoryData, _source: 'memory' });
  }

  // 2. Try /tmp file (fresh data from recent n8n POST)
  try {
    const data = await readFile(TMP_FILE, 'utf-8');
    const parsed = JSON.parse(data);
    inMemoryData = parsed; // Cache it
    return NextResponse.json({ ...parsed, _source: 'tmp' });
  } catch {
    // /tmp doesn't exist, try static fallback
  }

  // 3. Try static file bundled with the build (persists across deploys)
  try {
    const data = await readFile(STATIC_FILE, 'utf-8');
    const parsed = JSON.parse(data);
    inMemoryData = parsed; // Cache it
    return NextResponse.json({ ...parsed, _source: 'static' });
  } catch {
    return NextResponse.json({
      error: 'No data available',
      message: 'Recap data has not been uploaded yet. Run the n8n workflow or add .recap-data/recap-data.json to the repo.'
    }, { status: 404 });
  }
}
