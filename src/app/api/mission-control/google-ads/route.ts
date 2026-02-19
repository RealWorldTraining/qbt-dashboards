import { NextResponse } from 'next/server';
import { google } from 'googleapis';

const SHEET_ID = '1T8PZjlf2vBz7YTlz1GCXe68UczWGL8_ERYuBLd_r6H0';
const ACCOUNT_TAB = 'GADS: Account: Weekly (Devices)';
const CAMPAIGN_TAB = 'GADS: Campaign: Weekly (Devices)';

async function getGoogleSheetsClient() {
  const credentials = process.env.SHEETS_READER_CREDENTIALS;
  if (!credentials) {
    throw new Error('SHEETS_READER_CREDENTIALS not found');
  }

  const auth = new google.auth.GoogleAuth({
    credentials: JSON.parse(Buffer.from(credentials, 'base64').toString()),
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  });

  return google.sheets({ version: 'v4', auth });
}

// GET /api/mission-control/google-ads - Fetch latest Google Ads metrics
export async function GET() {
  try {
    const sheets = await getGoogleSheetsClient();

    // Fetch account-level data (latest week)
    const accountResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: `${ACCOUNT_TAB}!A:L`,
    });

    const accountRows = accountResponse.data.values || [];
    if (accountRows.length < 2) {
      return NextResponse.json({ 
        error: 'No data found in account sheet' 
      }, { status: 404 });
    }

    // Get latest week's data (grouped by device)
    const headers = accountRows[0];
    const dataRows = accountRows.slice(1);
    const latestWeekRows = dataRows.slice(-3); // Desktop, Mobile, Tablet

    // Parse metrics
    const metrics = {
      totalSpend: 0,
      totalConversions: 0,
      avgCPA: 0,
      byDevice: [] as any[],
      lastUpdated: null as string | null,
    };

    latestWeekRows.forEach((row: any[]) => {
      const device = row[2] || 'Unknown';
      const spend = parseFloat(row[7]) || 0;
      const conversions = parseInt(row[10]) || 0;
      const cpa = parseFloat(row[11]) || 0;

      metrics.totalSpend += spend;
      metrics.totalConversions += conversions;

      metrics.byDevice.push({
        device,
        spend,
        conversions,
        cpa,
      });

      if (!metrics.lastUpdated && row[0]) {
        metrics.lastUpdated = row[0];
      }
    });

    metrics.avgCPA = metrics.totalConversions > 0 
      ? metrics.totalSpend / metrics.totalConversions 
      : 0;

    // Fetch top campaigns
    const campaignResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: `${CAMPAIGN_TAB}!A:M`,
    });

    const campaignRows = campaignResponse.data.values || [];
    const campaignDataRows = campaignRows.slice(1).slice(-20); // Last 20 entries

    const campaigns = campaignDataRows.map((row: any[]) => ({
      name: row[3] || 'Unknown',
      device: row[2] || 'Unknown',
      spend: parseFloat(row[7]) || 0,
      conversions: parseInt(row[10]) || 0,
      cpa: parseFloat(row[11]) || 0,
    }))
    .filter((c: any) => c.conversions > 0)
    .sort((a: any, b: any) => b.conversions - a.conversions)
    .slice(0, 5);

    return NextResponse.json({ 
      metrics,
      topCampaigns: campaigns,
      mockData: false 
    });
  } catch (error) {
    console.error('Error fetching Google Ads data:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch Google Ads data',
      mockData: true 
    }, { status: 500 });
  }
}
