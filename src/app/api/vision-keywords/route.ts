import { NextResponse } from 'next/server';
import { google } from 'googleapis';

const SHEET_ID = '1T8PZjlf2vBz7YTlz1GCXe68UczWGL8_ERYuBLd_r6H0';
const TAB_NAME = 'GADS: Search Keyword: Weekly with analytics';

export async function GET() {
  try {
    // Load credentials from environment variable (Vercel) or local file (dev)
    let credentials;
    if (process.env.GOOGLE_SHEETS_CREDENTIALS) {
      credentials = JSON.parse(process.env.GOOGLE_SHEETS_CREDENTIALS);
    } else {
      const fs = require('fs');
      const credsPath = process.env.HOME + '/clawd/.secrets/google-sheets.json';
      credentials = JSON.parse(fs.readFileSync(credsPath, 'utf8'));
    }

    const auth = new google.auth.OAuth2(
      credentials.client_id,
      credentials.client_secret
    );
    
    auth.setCredentials({
      refresh_token: credentials.refresh_token,
    });

    const sheets = google.sheets({ version: 'v4', auth });

    // Fetch all data from the keyword tab
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: `${TAB_NAME}!A:T`,
    });

    const rows = response.data.values || [];
    if (rows.length === 0) {
      return NextResponse.json({ error: 'No data found' }, { status: 404 });
    }

    const headers = rows[0];
    const data = rows.slice(1).map((row: any[]) => {
      const obj: any = {};
      headers.forEach((header: string, index: number) => {
        obj[header] = row[index] || '';
      });
      return obj;
    });

    return NextResponse.json({ data, headers });
  } catch (error: any) {
    console.error('Error fetching keyword data:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch keyword data' },
      { status: 500 }
    );
  }
}
