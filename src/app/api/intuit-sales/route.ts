import { NextResponse } from 'next/server';
import { google } from 'googleapis';

const SHEET_ID = '1T-fzTl5NpeqAtKm3Va8HKYxlEH_UYN28-1QybLEMLPY';

const CATEGORIES = [
  { key: 'ies', label: 'IES', column: 5 },
  { key: 'priorityCircle', label: 'Priority Circle', column: 6 },
  { key: 'classes', label: 'Classes', column: 7 },
  { key: 'videos', label: 'Videos', column: 8 },
  { key: 'webinars', label: 'Webinars', column: 9 },
  { key: 'other', label: 'Other', column: 10 },
];

function parseDate(dateStr: string): Date | null {
  try {
    const [month, day, year] = dateStr.split('/').map(Number);
    return new Date(year, month - 1, day);
  } catch {
    return null;
  }
}

function getMonthKey(date: Date): string {
  const month = date.toLocaleString('en-US', { month: 'short' });
  const year = date.getFullYear();
  return `${month} ${year}`;
}

export async function GET() {
  try {
    const credentialsBase64 = process.env.SHEETS_READER_CREDENTIALS || process.env.GOOGLE_SHEETS_CREDENTIALS;
    if (!credentialsBase64) {
      throw new Error('Missing SHEETS_READER_CREDENTIALS');
    }
    const credentialsJson = Buffer.from(credentialsBase64, 'base64').toString('utf-8');
    const auth = new google.auth.GoogleAuth({
      credentials: JSON.parse(credentialsJson),
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    });

    const sheets = google.sheets({ version: 'v4', auth });

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: 'A:K',
    });

    const rows = response.data.values || [];
    
    // Skip header row
    const dataRows = rows.slice(1);

    // Aggregate data by month and category
    const monthlyData: Record<string, Record<string, number>> = {};
    const monthTotals: Record<string, number> = {};
    const allMonths = new Set<string>();

    for (const row of dataRows) {
      const dateStr = row[0];
      const amountStr = row[3];
      
      if (!dateStr || !amountStr) continue;

      const date = parseDate(dateStr);
      if (!date) continue;

      const monthKey = getMonthKey(date);
      allMonths.add(monthKey);

      const amount = parseFloat(amountStr.replace(/,/g, ''));
      if (isNaN(amount)) continue;

      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = {};
        monthTotals[monthKey] = 0;
      }

      monthTotals[monthKey] += amount;

      // Check each category
      for (const category of CATEGORIES) {
        const isChecked = row[category.column] === 'TRUE';
        if (isChecked) {
          if (!monthlyData[monthKey][category.key]) {
            monthlyData[monthKey][category.key] = 0;
          }
          monthlyData[monthKey][category.key] += amount;
        }
      }
    }

    // Sort months chronologically
    const sortedMonths = Array.from(allMonths).sort((a, b) => {
      const dateA = new Date(a);
      const dateB = new Date(b);
      return dateA.getTime() - dateB.getTime();
    });

    // Calculate percentages
    const dataWithPercentages: Record<string, Record<string, { amount: number; percentage: number }>> = {};
    
    for (const month of sortedMonths) {
      dataWithPercentages[month] = {};
      const total = monthTotals[month] || 0;
      
      for (const category of CATEGORIES) {
        const amount = monthlyData[month]?.[category.key] || 0;
        const percentage = total > 0 ? (amount / total) * 100 : 0;
        dataWithPercentages[month][category.key] = { amount, percentage };
      }
    }

    return NextResponse.json({
      months: sortedMonths,
      categories: CATEGORIES,
      data: dataWithPercentages,
      monthTotals,
    });
  } catch (error) {
    console.error('Error fetching Intuit sales data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch data', details: String(error) },
      { status: 500 }
    );
  }
}
