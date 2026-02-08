const { google } = require('googleapis');

const SHEET_ID = '1T8PZjlf2vBz7YTlz1GCXe68UczWGL8_ERYuBLd_r6H0';
const RANGE = 'GADS: Search Keyword: Weekly with Campaigns!A1:Z10';

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
    console.log(rows[0]);
    console.log('\nFirst 5 data rows:');
    rows.slice(1, 6).forEach((row, i) => {
      console.log(`\nRow ${i+1}:`);
      console.log(row);
    });
  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkData();
