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

// GitHub persistence config
const GITHUB_OWNER = 'QuickBooksTraining';
const GITHUB_REPO = 'qbt-dashboards';
const GITHUB_FILE_PATH = '.recap-data/recap-data.json';
const GITHUB_BRANCH = 'main';

// Commit data to GitHub for permanent persistence
async function commitToGitHub(data: RecapData): Promise<{ success: boolean; error?: string }> {
  const token = process.env.GITHUB_PAT;
  if (!token) {
    return { success: false, error: 'GITHUB_PAT not configured' };
  }

  try {
    // 1. Get the current file SHA (required for updates)
    const getResponse = await fetch(
      `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${GITHUB_FILE_PATH}?ref=${GITHUB_BRANCH}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'qbt-dashboards-recap'
        }
      }
    );

    let sha: string | undefined;
    if (getResponse.ok) {
      const fileData = await getResponse.json();
      sha = fileData.sha;
    } else if (getResponse.status !== 404) {
      const errorText = await getResponse.text();
      return { success: false, error: `GitHub GET failed: ${getResponse.status} - ${errorText}` };
    }

    // 2. Commit the new content
    const content = Buffer.from(JSON.stringify(data, null, 2)).toString('base64');
    const commitMessage = `Update recap data for ${data.displayMonth} (auto-commit from n8n)`;

    const putBody: Record<string, string> = {
      message: commitMessage,
      content,
      branch: GITHUB_BRANCH
    };
    if (sha) {
      putBody.sha = sha;
    }

    const putResponse = await fetch(
      `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${GITHUB_FILE_PATH}`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'qbt-dashboards-recap',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(putBody)
      }
    );

    if (!putResponse.ok) {
      const errorText = await putResponse.text();
      return { success: false, error: `GitHub PUT failed: ${putResponse.status} - ${errorText}` };
    }

    return { success: true };
  } catch (err) {
    return { success: false, error: `GitHub commit error: ${String(err)}` };
  }
}

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

    // Persist to GitHub (survives cold starts and redeploys)
    const gitResult = await commitToGitHub(data);
    if (!gitResult.success) {
      console.error('GitHub persistence failed:', gitResult.error);
    }

    return NextResponse.json({
      success: true,
      message: `Recap data updated for ${data.displayMonth}`,
      timestamp: new Date().toISOString(),
      githubPersisted: gitResult.success,
      githubError: gitResult.error
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
