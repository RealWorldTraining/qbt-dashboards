const { google } = require('googleapis');

const SHEET_ID = '1T8PZjlf2vBz7YTlz1GCXe68UczWGL8_ERYuBLd_r6H0';
const RANGE = 'BING: Search Keyword Weekly!A1:T10';

async function checkData() {
  try {
    const credsJson = process.env.GOOGLE_SHEETS_CREDENTIALS;
    if (!credsJson) {
      console.error('Missing GOOGLE_SHEETS_CREDENTIALS');
      process.exit(1);
    }

    const credentials = JSON.parse(
      Buffer.from(credsJson, 'base64').toString('utf-8')
    );

    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    });

    const sheets = google.sheets({ version: 'v4', auth });
    
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: RANGE,
    });

    const rows = response.data.values;
    if (!rows || rows.length < 2) {
      console.log('No data found');
      return;
    }

    console.log('Header row:');
    rows[0].forEach((h, i) => console.log(`${i}: ${h}`));
    console.log('\nFirst 2 data rows:');
    rows.slice(1, 3).forEach((row, i) => {
      console.log(`\nRow ${i+1}:`, row);
    });
  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkData();
